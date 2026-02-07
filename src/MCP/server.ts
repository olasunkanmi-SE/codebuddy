import "./console-patch";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { ServerEditorHost } from "../hosts/server-editor-host";
import { EditorHostService } from "../services/editor-host.service";
import { SqliteDatabaseService } from "../services/sqlite-database.service";
import { DeepTerminalService } from "../services/deep-terminal.service";
import { DeveloperAgent } from "../agents/developer/agent";
import { Orchestrator } from "../orchestrator";
import { ContextRetriever } from "../services/context-retriever";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import * as path from "path";
import { FileType } from "../interfaces/editor-host";
import { z } from "zod";

import { Logger } from "../infrastructure/logger/logger";

// Initialize the App Server environment
async function initializeAppServer(workspaceRoot: string) {
  try {
    // Initialize Logger first
    const date = new Date().toISOString().replace(/[:.]/g, "-");
    const logPath = path.join(
      workspaceRoot,
      ".codebuddy",
      "logs",
      `server-${date}.log`,
    );
    Logger.initialize("MCPServer", {
      enableFile: true,
      filePath: logPath,
      enableConsole: false, // Keep console clean for stdio transport
    });

    const host = new ServerEditorHost(workspaceRoot);
    EditorHostService.getInstance().initialize(host);
  } catch (error) {
    console.error("Failed to initialize EditorHost:", error);
    throw error;
  }

  try {
    // Initialize DB with correct WASM path for this environment
    const wasmPath = path.join(__dirname, "..", "grammars", "sql-wasm.wasm");
    await SqliteDatabaseService.getInstance().initialize({ wasmPath });
  } catch (error) {
    console.error("Failed to initialize Database:", error);
    throw error;
  }

  try {
    // Initialize ContextRetriever with vector store path
    const vectorStorePath = path.join(workspaceRoot, ".codebuddy");
    ContextRetriever.initialize(vectorStorePath);
  } catch (error) {
    console.error("Failed to initialize ContextRetriever:", error);
    // Continue even if vector store fails
  }
}

async function runServer() {
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, _promise) => {
    console.error("Unhandled Rejection:", reason);
    process.exit(1);
  });

  const workspaceRoot = process.cwd();
  await initializeAppServer(workspaceRoot);

  const server = new Server(
    {
      name: "CodeBuddy-Server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Inject client connection to ServerEditorHost
  const host = EditorHostService.getInstance().getHost();
  if (host instanceof ServerEditorHost) {
    host.setClientConnection({
      sendRequest: async (method, params) => {
        return (server as any).request({ method, params }, z.any() as any);
      },
      sendNotification: (method, params) => {
        (server as any).notification({ method, params });
      },
    });
  }

  let agentRunnable: any;
  const checkpointer = new MemorySaver();

  // Forward Orchestrator events to Client
  const orchestrator = Orchestrator.getInstance();
  const forwardEvent = (method: string) => (payload: any) => {
    server.notification({ method, params: payload } as any);
  };

  orchestrator.onStreamStart(forwardEvent("stream/start"));
  orchestrator.onStreamChunk(forwardEvent("stream/chunk"));
  orchestrator.onStreamEnd(forwardEvent("stream/end"));
  orchestrator.onStreamError(forwardEvent("stream/error"));
  orchestrator.onToolStart(forwardEvent("tool/start"));
  orchestrator.onToolEnd(forwardEvent("tool/end"));
  orchestrator.onThinking(forwardEvent("thinking"));

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "read_file",
          description: "Read file from the workspace",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string" },
            },
            required: ["path"],
          },
        },
        {
          name: "write_file",
          description: "Write content to a file in the workspace",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string" },
              content: { type: "string" },
            },
            required: ["path", "content"],
          },
        },
        {
          name: "list_files",
          description: "List files in a directory",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string" },
            },
            required: ["path"],
          },
        },
        {
          name: "run_command",
          description: "Run a shell command in the terminal",
          inputSchema: {
            type: "object",
            properties: {
              command: { type: "string" },
              session_id: { type: "string", default: "default" },
            },
            required: ["command"],
          },
        },
        {
          name: "read_terminal_output",
          description: "Read output from the terminal session",
          inputSchema: {
            type: "object",
            properties: {
              session_id: { type: "string", default: "default" },
            },
            required: ["session_id"],
          },
        },
        {
          name: "agent",
          description: "Run the Developer Agent to solve a task",
          inputSchema: {
            type: "object",
            properties: {
              prompt: { type: "string" },
              model: {
                type: "string",
                description: "Model to use (local, anthropic, etc.)",
                default: "local",
              },
              stream: {
                type: "boolean",
                description: "Whether to stream the output",
                default: false,
              },
              thread_id: {
                type: "string",
                description: "Thread ID for conversation history",
                default: "default",
              },
            },
            required: ["prompt"],
          },
        },
      ],
    };
  });

  const ChatSendSchema = z.object({
    method: z.literal("chat/send"),
    params: z.object({
      message: z.string(),
      metadata: z.any().optional(),
    }),
  });

  server.setRequestHandler(ChatSendSchema as any, async (request: any) => {
    const { message, metadata } = request.params;
    const host = EditorHostService.getInstance().getHost();

    if (!agentRunnable) {
      const agent = new DeveloperAgent({
        host: host,
        enableWebSearch: false,
        enableSubAgents: true,
        checkPointer: checkpointer,
      });

      // Initialize model configuration if provided in metadata
      if (metadata?.model) {
        Orchestrator.getInstance().publish("onModelChangeSuccess", {
          message: JSON.stringify({ modelName: metadata.model }),
        });
      }

      agentRunnable = await agent.create();
    }

    const config = {
      configurable: { thread_id: metadata?.threadId || "default" },
    };
    const messages = [new HumanMessage(message)];

    // Execute agent stream
    // We don't await the full completion here to allow async processing,
    // but we need to start it.
    // Since this is a request/response, we should probably return 'started'.
    // The events will be delivered via notifications.

    // Note: agentRunnable.stream is an async generator.
    // We need to iterate it to drive the execution.

    (async () => {
      try {
        const stream = await agentRunnable.stream({ messages }, config);
        for await (const _chunk of stream) {
          // Processing happens here, side effects emit events to Orchestrator
        }
      } catch (error) {
        console.error("Agent execution error:", error);
        Orchestrator.getInstance().publish("onStreamError", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    })();

    return { status: "started" };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const host = EditorHostService.getInstance().getHost();

    switch (request.params.name) {
      case "read_file": {
        const filePath = String(request.params.arguments?.path);
        try {
          const content = await host.workspace.fs.readFile(filePath);
          return {
            content: [
              {
                type: "text",
                text: new TextDecoder().decode(content),
              },
            ],
          };
        } catch (err: any) {
          return {
            content: [
              { type: "text", text: `Error reading file: ${err.message}` },
            ],
            isError: true,
          };
        }
      }
      case "write_file": {
        const filePath = String(request.params.arguments?.path);
        const content = String(request.params.arguments?.content);
        try {
          const buffer = new TextEncoder().encode(content);
          await host.workspace.fs.writeFile(filePath, buffer);
          return {
            content: [
              {
                type: "text",
                text: `File created successfully at: ${filePath}`,
              },
            ],
          };
        } catch (err: any) {
          return {
            content: [
              { type: "text", text: `Error writing file: ${err.message}` },
            ],
            isError: true,
          };
        }
      }
      case "list_files": {
        const dirPath = String(request.params.arguments?.path || ".");
        try {
          const files = await host.workspace.fs.readDirectory(dirPath);
          const fileList = files
            .map(
              ([name, type]) =>
                `${name}${type === FileType.Directory ? "/" : ""}`,
            )
            .join("\n");
          return {
            content: [
              {
                type: "text",
                text: fileList,
              },
            ],
          };
        } catch (err: any) {
          return {
            content: [
              { type: "text", text: `Error listing files: ${err.message}` },
            ],
            isError: true,
          };
        }
      }
      case "run_command": {
        const command = String(request.params.arguments?.command);
        const sessionId = String(
          request.params.arguments?.session_id || "default",
        );
        try {
          const output = await DeepTerminalService.getInstance().executeCommand(
            sessionId,
            command,
          );
          return {
            content: [{ type: "text", text: output }],
          };
        } catch (err: any) {
          return {
            content: [
              { type: "text", text: `Error running command: ${err.message}` },
            ],
            isError: true,
          };
        }
      }
      case "read_terminal_output": {
        const sessionId = String(
          request.params.arguments?.session_id || "default",
        );
        try {
          const output =
            DeepTerminalService.getInstance().readOutput(sessionId);
          return {
            content: [{ type: "text", text: output }],
          };
        } catch (err: any) {
          return {
            content: [
              { type: "text", text: `Error reading terminal: ${err.message}` },
            ],
            isError: true,
          };
        }
      }
      case "agent": {
        const prompt = String(request.params.arguments?.prompt);
        const model = String(request.params.arguments?.model || "local");
        const stream = Boolean(request.params.arguments?.stream || false);
        const threadId = String(
          request.params.arguments?.thread_id || "default",
        );

        try {
          if (!agentRunnable) {
            const agent = new DeveloperAgent({
              host: host,
              enableWebSearch: false,
              enableSubAgents: true,
              checkPointer: checkpointer,
            });

            // Initialize model configuration
            Orchestrator.getInstance().publish("onModelChangeSuccess", {
              message: JSON.stringify({ modelName: model }),
            });

            agentRunnable = await agent.create();
          }

          const config = { configurable: { thread_id: threadId } };
          const messages = [new HumanMessage(prompt)];

          if (stream) {
            let finalContent = "";
            const streamEvents = await agentRunnable.streamEvents(
              { messages },
              { ...config, version: "v2" },
            );

            for await (const event of streamEvents) {
              if (
                event.event === "on_chat_model_stream" &&
                event.data?.chunk?.content
              ) {
                const content = event.data.chunk.content;
                finalContent += content;
                await server.notification({
                  method: "notifications/message",
                  params: {
                    content: content,
                    thread_id: threadId,
                  },
                });
              }
            }

            return {
              content: [{ type: "text", text: finalContent }],
            };
          } else {
            const result = await agentRunnable.invoke({ messages }, config);
            const lastMessage = result.messages[result.messages.length - 1];
            return {
              content: [{ type: "text", text: lastMessage.content as string }],
            };
          }
        } catch (err: any) {
          return {
            content: [
              { type: "text", text: `Error running agent: ${err.message}` },
            ],
            isError: true,
          };
        }
      }
      default:
        throw new Error("Unknown tool");
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});

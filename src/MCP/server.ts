
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Logger, LogLevel } from "./utils/logger";
import { FilesystemTools } from "./tools/filesystem";
import { TerminalTools } from "./tools/terminal";

export class CodeBuddyMCPServer {
  private server: Server;
  private logger: Logger;

  constructor() {
    this.logger = new Logger("CodeBuddyMCPServer", LogLevel.INFO);

    this.server = new Server(
      {
        name: "codebuddy-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_files",
            description: "List files in a directory",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The absolute path to the directory to list",
                },
              },
            },
          },
          {
            name: "read_file",
            description: "Read a file from the filesystem",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The absolute path to the file to read",
                },
              },
              required: ["path"],
            },
          },
          {
            name: "edit_file",
            description: "Edit a file (overwrite or replace)",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The absolute path to the file to edit",
                },
                mode: {
                  type: "string",
                  enum: ["overwrite", "replace"],
                  description: "The editing mode",
                },
                content: {
                  type: "string",
                  description: "New content for overwrite mode",
                },
                search: {
                  type: "string",
                  description: "Text to search for in replace mode",
                },
                replace: {
                  type: "string",
                  description: "Text to replace with in replace mode",
                },
              },
              required: ["path", "mode"],
            },
          },
          {
            name: "run_command",
            description: "Run a shell command",
            inputSchema: {
              type: "object",
              properties: {
                command: {
                  type: "string",
                  description: "The command to execute",
                },
                cwd: {
                  type: "string",
                  description: "The working directory",
                },
              },
              required: ["command"],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      this.logger.info(`Calling tool: ${name}`);

      try {
        let result = "";
        const safeArgs = args || {};

        switch (name) {
          case "list_files":
            result = await FilesystemTools.listFiles({
              path: safeArgs.path as string | undefined,
            });
            break;
          case "read_file":
            result = await FilesystemTools.readFile({
              path: safeArgs.path as string,
            });
            break;
          case "edit_file":
            result = await FilesystemTools.editFile({
              path: safeArgs.path as string,
              mode: safeArgs.mode as "overwrite" | "replace",
              content: safeArgs.content as string | undefined,
              search: safeArgs.search as string | undefined,
              replace: safeArgs.replace as string | undefined,
            });
            break;
          case "run_command":
            result = await TerminalTools.runCommand({
              command: safeArgs.command as string,
              cwd: safeArgs.cwd as string | undefined,
            });
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [{ type: "text", text: result }],
        };
      } catch (error: any) {
        this.logger.error(`Error executing tool ${name}: ${error.message}`);
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info("CodeBuddy MCP Server running on stdio");
  }
}

const server = new CodeBuddyMCPServer();
server.start().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});

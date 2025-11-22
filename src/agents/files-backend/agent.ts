/**
 * researchAgentExample.ts
 *
 * Example wiring that reproduces the notebook flow using:
 *  - @langchain-ai/deepagentsjs (createDeepAgent)
 *  - langchain tool() helpers
 *  - sql.js-backed store (SqliteFileStore)
 *
 * This file is intended as an example for a VS Code extension background/service:
 *  - The extension initializes sql.js (initSqlJs)
 *  - The extension constructs the SqliteFileStore (loading prior DB bytes if available)
 *  - The extension registers the tools with createDeepAgent and invokes the agent on user input
 *
 * Note: This is example code — you should adapt wasm path, persistence, and how you forward DB bytes
 * to your extension's storage (e.g. extensionContext.globalState, workspaceState or a file under
 * extension storage).
 */

import { initSqlJs } from "sql.js";
import { createDeepAgent } from "@langchain-ai/deepagentsjs";
import { tool } from "langchain";
import { z } from "zod";

import { SqliteFileStore } from "./store";
import { createFileTools } from "./tool";

/**
 * Mock search result used in the original notebook.
 * Replace with a real search tool (Tavily, Bing, SerpAPI, etc.) in production.
 */
const MOCK_SEARCH_RESULT = `The Model Context Protocol (MCP) is an open standard protocol developed
by Anthropic to enable seamless integration between AI models and external systems like
tools, databases, and other services...`;

/**
 * Create a simple mock web_search tool (similar to the notebook).
 * Replace with a real web search integration in a production extension.
 */
const webSearchTool = tool(
    async ({ query }: { query: string }) => {
        // In production, call an external search API.
        return MOCK_SEARCH_RESULT;
    },
    {
        name: "web_search",
        description: "Search the web for information on a specific topic (mock).",
        schema: z.object({
            query: z.string(),
        }),
    }
);

/**
 * Instructions / system prompt for the agent (condensed from the notebook).
 */
const FILE_USAGE_INSTRUCTIONS = `You have access to a virtual file system to help you retain and save context.

Workflow:
1. Orient: Use ls() to see existing files before starting work.
2. Save: Use write_file() to store the user's request so that we can keep it for later.
3. Read: Use read_file() when you need to examine saved context.`;

const SIMPLE_RESEARCH_INSTRUCTIONS =
    "IMPORTANT: Make a single call to web_search and use the provided result to answer the user's question.";

const SYSTEM_PROMPT = `${FILE_USAGE_INSTRUCTIONS}\n\n${"=".repeat(60)}\n\n${SIMPLE_RESEARCH_INSTRUCTIONS}`;

/**
 * Example setup function the extension would call during activation or the agent setup stage.
 *
 * - locateFileForWasm: a callback that returns the location of sql-wasm.wasm in your extension bundle.
 *   For example: () => path.join(context.extensionPath, "dist/sql-wasm.wasm")
 */
export async function createResearchAgentForExtension(options: {
    locateFileForWasm: (file: string) => string;
    priorDbBytes?: Uint8Array | null;
}) {
    // initialize sql.js runtime (must be done once per process)
    const SQL = await initSqlJs({
        locateFile: (file) => options.locateFileForWasm(file),
    });

    // create the SqliteFileStore (loads prior database bytes if present)
    const store = new SqliteFileStore(SQL, { data: options.priorDbBytes ?? null });
    await store.init(SQL);

    // create file tools bound to this store
    const { lsTool, readFileTool, writeFileTool } = createFileTools(store);

    // Tools to pass into the deep agent:
    const tools = [lsTool, readFileTool, writeFileTool, webSearchTool];

    // create the deep agent (using default model if you don't want to provide one)
    const agent = createDeepAgent({
        tools,
        systemPrompt: SYSTEM_PROMPT,
        // Optionally provide a backend factory or custom middleware here.
        // For this example we keep defaults and rely on our sql-backed tools for persistence.
    });

    return { agent, store };
}

/**
 * Example helper that runs one research session:
 * 1. Writes the user request to user_request.txt
 * 2. Calls web_search once
 * 3. Reads back the saved request and returns the agent answer
 *
 * In practice you'd let the agent planner decide which tools to call. This example shows how you can
 * orchestrate the same steps from your extension code (and is useful for testing the tools).
 */
export async function runSampleSession({
    locateFileForWasm,
    priorDbBytes,
    userQuestion,
}: {
    locateFileForWasm: (file: string) => string;
    priorDbBytes?: Uint8Array | null;
    userQuestion: string;
}) {
    const { agent, store } = await createResearchAgentForExtension({
        locateFileForWasm,
        priorDbBytes,
    });

    // Build the agent input: save the user request first via tool call simulation
    // In a real LangGraph invocation you'd let the agent decide and call tools itself.
    // Here we call tools directly to match the notebook flow.

    // 1) write the user request
    await store.writeFile(
        "user_request.txt",
        `User Request: ${userQuestion}\n\nThe user wants a comprehensive overview.`
    );

    // 2) invoke the agent (agent.invoke will run the agent planning + tools)
    // Note: the deepagentsjs agent.invoke signature resembles the LangGraph API and accepts
    // an invocation object with messages; pass a simple user message below.
    const result = await agent.invoke({
        messages: [{ role: "user", content: userQuestion }],
        // Some agent implementations accept a 'files' field to seed state; deepagentsjs examples sometimes
        // pass `files: {}`. For compatibility leave it out or pass if your environment expects it.
    });

    // The agent result includes messages. The shape depends on deepagentsjs runtime.
    // Return both the agent result and raw DB bytes so the extension can persist them.
    const dbBytes = store.getRawDbBytes();
    return { result, dbBytes };
}
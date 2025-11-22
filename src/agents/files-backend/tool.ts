/**
 * fileTools.ts
 *
 * LangChain-style tools that operate on a SqliteFileStore.
 *
 * These tools match the original notebook's tools: ls, read_file, write_file.
 * They are implemented as LangChain tools (using `tool` from 'langchain') so they can be
 * passed into createDeepAgent(...) as part of the agent's toolset.
 *
 * Exported helper:
 *   - createFileTools(store): returns { lsTool, readFileTool, writeFileTool }
 *
 * The caller (e.g. your VS Code extension activation) should:
 *  1. initialize sql.js and the SqliteFileStore
 *  2. call createFileTools(store) to obtain tools
 *  3. pass tools into createDeepAgent(...)
 *
 * Tool metadata follows the patterns used in the deepagentsjs repo (name, description, schema).
 */

import { tool } from "langchain";
import { z } from "zod";
import type { SqliteFileStore } from "./store";

export function createFileTools(store: SqliteFileStore) {
    // ls: no arguments
    const lsTool = tool(
        async () => {
            const files = await store.listFiles();
            // Return a plain list; the agent's tooling layer will format it for the LLM.
            return files;
        },
        {
            name: "ls",
            description:
                "List all files in the virtual filesystem stored in the agent's file store. No parameters.",
            // No schema required for no-arg tool
        }
    );

    // read_file: accepts file_path, optional offset & limit
    const readFileTool = tool(
        async (args: { file_path: string; offset?: number; limit?: number }) => {
            const { file_path, offset = 0, limit = 2000 } = args;
            return await store.readFile(file_path, offset, limit);
        },
        {
            name: "read_file",
            description:
                "Read content from a file in the virtual filesystem with optional pagination. Returns line-numbered output.",
            schema: z.object({
                file_path: z.string().describe("Path to the file to read"),
                offset: z.number().int().nonnegative().optional().describe("Zero-based line offset"),
                limit: z.number().int().positive().optional().describe("Maximum number of lines to return"),
            }),
        }
    );

    // write_file: create or overwrite
    const writeFileTool = tool(
        async (args: { file_path: string; content: string }) => {
            const { file_path, content } = args;
            const bytes = await store.writeFile(file_path, content);
            // Return a friendly message plus DB bytes so the extension can persist the DB if desired.
            // Note: returning binary DB bytes to LLM is not appropriate; instead we return a short message and
            // expose a helper for the extension to retrieve bytes (store.getRawDbBytes()).
            return `Updated file ${file_path}`;
        },
        {
            name: "write_file",
            description:
                "Create a new file or completely overwrite an existing file in the virtual filesystem.",
            schema: z.object({
                file_path: z.string().describe("Path where the file should be created/overwritten"),
                content: z.string().describe("Complete content to write to the file"),
            }),
        }
    );

    return { lsTool, readFileTool, writeFileTool };
}
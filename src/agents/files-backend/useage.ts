/**
 * sqljs-backend-example.ts
 *
 * Example wiring for a VS Code extension or local dev environment showing how to:
 *  - initialize sql.js
 *  - create a sql.js backend factory
 *  - pass the factory to createDeepAgent(...)
 *  - persist DB bytes using an application-provided callback (example uses a simple file write)
 *
 * NOTE: adapt the persistence mechanism for VS Code extension storage (context.globalState or workspace FS).
 */

import { initSqlJs } from "sql.js";
import * as fs from "fs";
import * as path from "path";
import { createDeepAgent } from "@langchain-ai/deepagentsjs";
import { createSqljsBackendFactory } from "../../src/backends/sqljs.js"; // adjust import path as needed

async function example() {
    // locateFile callback should point to bundled sql-wasm.wasm in your extension
    const SQL = await initSqlJs({
        locateFile: (file) => path.join(__dirname, "sql-wasm.wasm"),
    });

    // Try to load previously persisted DB bytes (example file path)
    const dbFile = path.join(__dirname, "agent_files.sqlite");
    let priorBytes: Uint8Array | null = null;
    if (fs.existsSync(dbFile)) {
        priorBytes = new Uint8Array(fs.readFileSync(dbFile));
    }

    // Provide a persist callback that writes the DB bytes to disk (or extension storage)
    const persist = async (bytes: Uint8Array) => {
        fs.writeFileSync(dbFile, Buffer.from(bytes));
    };

    const backendFactory = createSqljsBackendFactory({
        SQL,
        initialDbBytes: priorBytes,
        persist,
    });

    const agent = createDeepAgent({
        // Provide tools, model, and systemPrompt as necessary
        backend: backendFactory,
    });

    // Use agent.invoke(...) per deepagents usage
    // const result = await agent.invoke({ messages: [{ role: "user", content: "..." }] });
    // console.log(result);
}

if (require.main === module) {
    example().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
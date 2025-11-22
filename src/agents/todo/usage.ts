import "dotenv/config";
import { z } from "zod";
import { tool } from "langchain";
import { ChatAnthropic } from "@langchain/anthropic";
import { createDeepAgent } from "deepagents"; // from langchain-ai/deepagentsjs package
import { writeTodos, readTodos, getTodosState, setTodosState, type Todo } from "./tools";
import { TODO_USAGE_INSTRUCTIONS } from "./prompts";

/**
 * This example reproduces the flow from the original Python notebook:
 *  - create a TODO plan via write_todos
 *  - perform a single web_search research step (mocked here)
 *  - read todos back (read_todos)
 *  - mark todo completed via write_todos
 *  - invoke agent once more so it finalizes and returns the final summary
 *
 * The code below completes the end-to-end flow so it matches the notebook behavior.
 */

/* ---- Mock web_search tool ----
   The README/examples in the deepagentsjs repo use TavilySearch in examples.
   For this demo we provide a small mock to make the example runnable without
   any external API keys.
*/
const webSearch = tool(
    async ({ query }: { query: string }) => {
        // In the notebook the search result is an inlined string. We mirror that.
        return `Mocked search result for "${query}": The Model Context Protocol (MCP) is an open standard protocol developed by Anthropic to enable integration between models and external systems.`;
    },
    {
        name: "web_search",
        description: "Search the web for information (mocked for this demo).",
        schema: z.object({
            query: z.string().describe("The search query string"),
        }),
    }
);

async function main() {
    // Create a model (matches the README recommendation)
    const model = new ChatAnthropic({
        model: "claude-sonnet-4-20250514",
        temperature: 0,
    });

    // Tools the agent can call. We include the TODO tools and the mocked web_search.
    const tools = [writeTodos, webSearch, readTodos];

    // Create the deep agent using the library's factory. The README demonstrates
    // you can pass a systemPrompt; we include the todo usage instructions from the notebook.
    const agent = createDeepAgent({
        model,
        tools,
        systemPrompt: TODO_USAGE_INSTRUCTIONS,
    });

    // Start with an empty TODO list and a single user request.
    const userMessage = { role: "user", content: "Give me a short summary of the Model Context Protocol (MCP)." };

    // 1) The agent should create a research TODO and then call web_search.
    //    Because createDeepAgent is a LangGraph-based graph, invoke accepts a context object.
    //    The deepagentsjs examples call agent.invoke with messages and optional initial context.
    const initialInvocation = {
        messages: [userMessage],
        todos: [] as Todo[],
    };

    // Invoke the agent. In the TypeScript examples in the deepagentsjs repo the agent
    // returns the result object that includes messages, todos, files, etc.
    const result = await agent.invoke(initialInvocation);

    // Print messages to the console (format similar to the notebook output).
    console.log("\n=== Agent Messages (initial invocation) ===");
    if (Array.isArray(result.messages)) {
        for (const m of result.messages) {
            if ((m as any).type === "tool") {
                // Some tool messages may be structured; print readable representation
                console.log(`[tool] ${(m as any).content ?? JSON.stringify(m)}`);
            } else if ((m as any).role) {
                console.log(`[${(m as any).role}] ${(m as any).content}`);
            } else {
                console.log(JSON.stringify(m));
            }
        }
    } else {
        console.log(result.messages);
    }

    // Print TODOs if available (the agent may have updated the in-process todos via write_todos)
    console.log("\n=== TODOs (after initial invocation) ===");
    const currentTodos = Array.isArray((result as any).todos) && (result as any).todos.length > 0
        ? (result as any).todos as Todo[]
        : getTodosState();

    if (currentTodos && currentTodos.length > 0) {
        currentTodos.forEach((t: Todo, i: number) => {
            console.log(` - ${i + 1}. ${t.content} (${t.status})`);
        });
    } else {
        console.log("No todos returned by the agent and no in-process todos present.");
    }

    // ===== Completed flow: mark the active TODO(s) as completed, then re-invoke the agent
    // Simulate the agent finishing the research step and updating its todo list to completed.
    if (currentTodos && currentTodos.length > 0) {
        // Mark all non-completed tasks as completed (this mirrors the notebook: mark as completed when done)
        const updatedTodos = currentTodos.map((t) =>
            t.status === "completed" ? t : { ...t, status: "completed" }
        );

        // Use the writeTodos tool directly to write the updated todo list back.
        // The tool wrapper created by langchain's `tool(...)` returns an async function,
        // so we can call it directly like this. It returns a string acknowledgement.
        try {
            const ack = await writeTodos({ todos: updatedTodos });
            console.log("\n[write_todos] Acknowledgement:", ack);
        } catch (err) {
            // As a fallback, update the in-process state directly so the rest of the flow can continue.
            setTodosState(updatedTodos);
            console.warn("writeTodos tool call failed; updated in-process state directly.", err);
        }

        // Now invoke the agent again so it can reflect on completed todos and produce a final summary,
        // similar to the final message produced in the notebook after marking todos completed.
        const followUpInvocation = {
            messages: [{ role: "user", content: "Please reflect on the completed TODOs and provide a final concise summary of what you found." }],
            // include the updated todos in the invocation context; middleware or agent may read them
            todos: updatedTodos,
        };

        const finalResult = await agent.invoke(followUpInvocation);

        console.log("\n=== Agent Messages (final invocation) ===");
        if (Array.isArray(finalResult.messages)) {
            for (const m of finalResult.messages) {
                if ((m as any).type === "tool") {
                    console.log(`[tool] ${(m as any).content ?? JSON.stringify(m)}`);
                } else if ((m as any).role) {
                    console.log(`[${(m as any).role}] ${(m as any).content}`);
                } else {
                    console.log(JSON.stringify(m));
                }
            }
        } else {
            console.log(finalResult.messages);
        }

        console.log("\n=== TODOs (final state) ===");
        const finalTodos = Array.isArray((finalResult as any).todos) && (finalResult as any).todos.length > 0
            ? (finalResult as any).todos as Todo[]
            : getTodosState();

        if (finalTodos && finalTodos.length > 0) {
            finalTodos.forEach((t: Todo, i: number) => {
                console.log(` - ${i + 1}. ${t.content} (${t.status})`);
            });
        } else {
            console.log("No todos present in final result.");
        }

        // Print files if any (some deepagents flows create or update files)
        console.log("\n=== Files (final invocation) ===");
        if ((finalResult as any).files && Object.keys((finalResult as any).files).length > 0) {
            Object.entries((finalResult as any).files).forEach(([k, v]) => {
                console.log(` - ${k}: ${v}`);
            });
        } else {
            console.log("No files produced by the agent.");
        }
    } else {
        console.log("\nNo todos to mark completed — nothing to do for completion step.");
    }
}

main().catch((err) => {
    console.error("Error running demo:", err);
    process.exit(1);
});
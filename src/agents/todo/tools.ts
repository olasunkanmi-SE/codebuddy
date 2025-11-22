import { z } from "zod";
import { tool } from "langchain";
import { WRITE_TODOS_DESCRIPTION } from "./prompts";

/**
 * Simple in-process stateful implementation of TODO tools.
 *
 * The original Python notebook used InjectedState and Commands to update
 * graph-local state. In the deepagentsjs (TypeScript) environment we can
 * implement equivalent behavior by exposing tools (langchain/tool) whose
 * implementations read and write a process-local state object. For demos
 * and examples this pattern is straightforward and mirrors the observable
 * behavior from the notebook.
 *
 * NOTE: In production you'd typically persist this state via a backend,
 * or use middleware which exposes the agent state to tools. This file
 * intentionally keeps the state in-memory to mirror the notebook's logic
 * while remaining compatible with the deepagentsjs examples.
 */

/* ---- Types ---- */

export type TodoStatus = "pending" | "in_progress" | "completed";

export type Todo = {
    content: string;
    status: TodoStatus;
};

/* ---- In-memory state ----
   This holds the TODO list for the running agent instance. Because these tools
   are plain functions they naturally close over the variable and act like the
   injected state in the Python notebook.
*/
let todosState: Todo[] = [];

/* ---- Zod schemas for tool validation (langchain tool accepts a schema) ---- */
export const TodoSchema = z.object({
    content: z.string().describe("Short, specific description of the task"),
    status: z.enum(["pending", "in_progress", "completed"]),
});
export const TodosSchema = z.array(TodoSchema);

/* ---- Tools ---- */

/**
 * writeTodos
 *
 * Replaces the current TODO list with the provided list and returns a small
 * human-readable acknowledgement string. The description is pulled from the
 * original notebook (shortened).
 */
export const writeTodos = tool(
    async ({ todos }: { todos: Todo[] }) => {
        // Overwrite in-memory todos
        todosState = todos ?? [];
        return `Updated todo list to ${JSON.stringify(todosState)}`;
    },
    {
        name: "write_todos",
        description: WRITE_TODOS_DESCRIPTION,
        schema: z.object({
            todos: TodosSchema.describe("List of todo items with content and status"),
        }),
    }
);

/**
 * readTodos
 *
 * Returns a formatted string representation of the current TODO list so the agent
 * can "recite" the plan back into its working context.
 */
export const readTodos = tool(
    async () => {
        if (!todosState || todosState.length === 0) {
            return "No todos currently in the list.";
        }
        const statusEmoji: Record<TodoStatus, string> = {
            pending: "⏳",
            in_progress: "🔄",
            completed: "✅",
        };
        const out = todosState
            .map((t, i) => `${i + 1}. ${statusEmoji[t.status]} ${t.content} (${t.status})`)
            .join("\n");
        return `Current TODO List:\n${out}`;
    },
    {
        name: "read_todos",
        description: "Read the current TODO list from the agent state (in-process demo).",
        schema: z.undefined(),
    }
);

/* ---- Small helper for external control (optional) ---- */
export function getTodosState() {
    return todosState.slice();
}
export function setTodosState(todos: Todo[]) {
    todosState = todos.slice();
}
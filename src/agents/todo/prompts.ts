/**
 * Prompt and tool description constants translated from the original Python notebook.
 *
 * These strings are used as tool descriptions and system prompts in the TypeScript
 * example so the agent's behavior and tool documentation mirror the original notebook.
 *
 * These are intentionally conservative translations of the notebook text so they
 * can be used with createDeepAgent from the deepagentsjs package.
 */

export const WRITE_TODOS_DESCRIPTION = `
Create and manage structured task lists for tracking progress through complex workflows.

When to Use:
 - Multi-step or non-trivial tasks requiring coordination
 - When user provides multiple tasks or explicitly requests todo list
 - Avoid for single, trivial actions unless directed otherwise

Structure:
 - Maintain one list containing multiple todo objects (content, status)
 - Use clear, actionable content descriptions
 - Status must be: pending, in_progress, or completed

Best Practices:
 - Only one in_progress task at a time
 - Mark completed immediately when task is fully done
 - Always send the full updated list when making changes
 - Prune irrelevant items to keep list focused

Progress Updates:
 - Call write_todos again to change task status or edit content
 - Reflect real-time progress; don't batch completions
 - If blocked, keep in_progress and add new task describing blocker

Parameters:
 - todos: List of TODO items with content and status fields

Returns:
 - Updates agent state with new todo list.
`.trim();

export const TODO_USAGE_INSTRUCTIONS = `
Based upon the user's request:
 1. Use the write_todos tool to create TODOs at the start of a user request, per the tool description.
 2. After you accomplish a TODO, use the read_todos tool to read the TODOs in order to remind yourself of the plan.
 3. Reflect on what you've done and the TODO.
 4. Mark your task as completed, and proceed to the next TODO.
 5. Continue this process until you have completed all TODOs.

IMPORTANT: Always create a research plan of TODOs and conduct research following the above guidelines for ANY user request.
IMPORTANT: Aim to batch research tasks into a single TODO in order to minimize the number of TODOs you have to keep track of.
`.trim();
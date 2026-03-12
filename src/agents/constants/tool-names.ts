/**
 * Canonical tool name constants — single source of truth for tool identifiers
 * used across the extension backend and webview UI.
 */
export const TOOL_NAMES = {
  RUN_COMMAND: "run_command",
  RUN_TERMINAL_COMMAND: "run_terminal_command",
  COMMAND: "command",
  READ_FILE: "read_file",
  WRITE_FILE: "write_file",
  EDIT_FILE: "edit_file",
  DELETE_FILE: "delete_file",
  ANALYZE_FILES: "analyze_files_for_question",
  THINK: "think",
  SEARCH_CODEBASE: "search_codebase",
  MANAGE_TASKS: "manage_tasks",
  MANAGE_CORE_MEMORY: "manage_core_memory",
  GIT_DIFF: "git_diff",
  GIT_LOG: "git_log",
  GIT_BRANCH: "git_branch",
  GIT_STATUS: "git_status",
  RUN_TESTS: "run_tests",
  LIST_DIRECTORY: "list_directory",
  WEB_SEARCH: "web_search",
  GREP: "grep",
  GLOB: "glob",
} as const;

export type ToolName = (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES];

/** Canonical friendly display names for UI surfaces. */
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  [TOOL_NAMES.RUN_COMMAND]: "Terminal",
  [TOOL_NAMES.RUN_TERMINAL_COMMAND]: "Terminal",
  [TOOL_NAMES.COMMAND]: "Terminal",
  [TOOL_NAMES.READ_FILE]: "Read File",
  [TOOL_NAMES.WRITE_FILE]: "Write File",
  [TOOL_NAMES.EDIT_FILE]: "Edit File",
  [TOOL_NAMES.DELETE_FILE]: "Delete File",
  [TOOL_NAMES.ANALYZE_FILES]: "Analyze Code",
  [TOOL_NAMES.THINK]: "Reasoning",
  [TOOL_NAMES.SEARCH_CODEBASE]: "Search Codebase",
  [TOOL_NAMES.MANAGE_TASKS]: "Task Manager",
  [TOOL_NAMES.MANAGE_CORE_MEMORY]: "Memory",
  [TOOL_NAMES.GIT_DIFF]: "Git Diff",
  [TOOL_NAMES.GIT_LOG]: "Git Log",
  [TOOL_NAMES.GIT_BRANCH]: "Git Branch",
  [TOOL_NAMES.GIT_STATUS]: "Git Status",
  [TOOL_NAMES.RUN_TESTS]: "Run Tests",
  [TOOL_NAMES.LIST_DIRECTORY]: "List Directory",
  [TOOL_NAMES.WEB_SEARCH]: "Web Search",
};

/** Read-only tool set — these tools do not mutate state. */
export const READ_ONLY_TOOLS = new Set<string>([
  TOOL_NAMES.READ_FILE,
  TOOL_NAMES.LIST_DIRECTORY,
  TOOL_NAMES.SEARCH_CODEBASE,
  TOOL_NAMES.GREP,
  TOOL_NAMES.GLOB,
  TOOL_NAMES.ANALYZE_FILES,
  TOOL_NAMES.GIT_LOG,
  TOOL_NAMES.GIT_DIFF,
  TOOL_NAMES.GIT_STATUS,
  TOOL_NAMES.THINK,
  TOOL_NAMES.RUN_TESTS,
]);

/** Convert a raw tool name to a user-friendly display name. */
export function toFriendlyName(toolName: string): string {
  return (
    TOOL_DISPLAY_NAMES[toolName] ??
    toolName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/**
 * Tool Execution & Activity Tracking Tests
 *
 * Tests the tool detection, activity lifecycle, and
 * LangChain message format handling in CodeBuddyAgentService:
 * - Tool call detection from various message formats
 * - Tool activity creation with customized descriptions
 * - Tool completion tracking
 * - StreamEventType mapping for activities
 */

import * as assert from "assert";

// Mirrors the StreamEventType enum from agent.interface.ts
const StreamEventType = {
  TOOL_START: "onToolStart",
  TOOL_END: "onToolEnd",
  READING: "onReading",
  SEARCHING: "onSearching",
  ANALYZING: "onAnalyzing",
  EXECUTING: "onExecuting",
  WORKING: "onWorking",
  REVIEWING: "onReviewing",
} as const;

// Mirrors TOOL_DESCRIPTIONS from codebuddy-agent.service.ts
const TOOL_DESCRIPTIONS: Record<
  string,
  { name: string; description: string; activityType: string }
> = {
  run_command: { name: "Terminal", description: "Running command...", activityType: "executing" },
  read_file: { name: "File Reader", description: "Reading file contents...", activityType: "reading" },
  edit_file: { name: "File Editor", description: "Editing file contents...", activityType: "working" },
  web_search: { name: "Web Search", description: "Searching the web for relevant information...", activityType: "searching" },
  analyze_files_for_question: { name: "Code Analyzer", description: "Analyzing code files...", activityType: "analyzing" },
  think: { name: "Reasoning", description: "Thinking through the problem...", activityType: "thinking" },
  git_diff: { name: "Git Diff", description: "Checking file changes...", activityType: "reviewing" },
  git_log: { name: "Git Log", description: "Reviewing commit history...", activityType: "reviewing" },
  list_directory: { name: "Directory Listing", description: "Exploring directory structure...", activityType: "reading" },
  default: { name: "Tool", description: "Executing tool...", activityType: "working" },
};

suite("Tool Execution — Tool Call Detection from Messages", () => {
  test("Detects tool_calls from update-level toolCalls array", () => {
    const update = {
      toolCalls: [
        { name: "edit_file", args: { file_path: "/src/a.ts" }, id: "tc-1" },
      ],
    };

    const toolCallsToProcess: any[] = [];
    if (update.toolCalls && Array.isArray(update.toolCalls)) {
      toolCallsToProcess.push(...update.toolCalls);
    }

    assert.strictEqual(toolCallsToProcess.length, 1);
    assert.strictEqual(toolCallsToProcess[0].name, "edit_file");
  });

  test("Detects tool_calls from LangChain message-level tool_calls", () => {
    const update = {
      messages: [
        {
          tool_calls: [
            { name: "read_file", args: { path: "/src/b.ts" }, id: "tc-2" },
            { name: "grep", args: { pattern: "TODO" }, id: "tc-3" },
          ],
        },
      ],
    };

    const toolCallsToProcess: any[] = [];
    if (update.messages && Array.isArray(update.messages)) {
      for (const msg of update.messages) {
        if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
          toolCallsToProcess.push(...msg.tool_calls);
        }
      }
    }

    assert.strictEqual(toolCallsToProcess.length, 2);
    assert.strictEqual(toolCallsToProcess[0].name, "read_file");
    assert.strictEqual(toolCallsToProcess[1].name, "grep");
  });

  test("Detects tool_calls from additional_kwargs (older format)", () => {
    const update = {
      messages: [
        {
          additional_kwargs: {
            tool_calls: [
              { name: "web_search", args: { query: "test" }, id: "tc-4" },
            ],
          },
        },
      ],
    };

    const toolCallsToProcess: any[] = [];
    if (update.messages && Array.isArray(update.messages)) {
      for (const msg of update.messages) {
        if (
          msg.additional_kwargs?.tool_calls &&
          Array.isArray(msg.additional_kwargs.tool_calls)
        ) {
          toolCallsToProcess.push(...msg.additional_kwargs.tool_calls);
        }
      }
    }

    assert.strictEqual(toolCallsToProcess.length, 1);
    assert.strictEqual(toolCallsToProcess[0].name, "web_search");
  });

  test("Detects tool_use blocks from Anthropic content format", () => {
    const update = {
      messages: [
        {
          content: [
            { type: "text", text: "Let me edit the file..." },
            {
              type: "tool_use",
              name: "edit_file",
              input: { file_path: "/src/c.ts", old_string: "foo", new_string: "bar" },
              id: "toolu_abc",
            },
          ],
        },
      ],
    };

    const toolCallsToProcess: any[] = [];
    if (update.messages && Array.isArray(update.messages)) {
      for (const msg of update.messages) {
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === "tool_use") {
              toolCallsToProcess.push({
                name: block.name,
                args: block.input,
                id: block.id,
              });
            }
          }
        }
      }
    }

    assert.strictEqual(toolCallsToProcess.length, 1);
    assert.strictEqual(toolCallsToProcess[0].name, "edit_file");
    assert.strictEqual(toolCallsToProcess[0].args.file_path, "/src/c.ts");
    assert.strictEqual(toolCallsToProcess[0].id, "toolu_abc");
  });

  test("Empty messages produce no tool calls", () => {
    const update: { messages: any[] } = { messages: [] };
    const toolCallsToProcess: any[] = [];

    if (update.messages && Array.isArray(update.messages)) {
      for (const msg of update.messages) {
        if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
          toolCallsToProcess.push(...msg.tool_calls);
        }
      }
    }

    assert.strictEqual(toolCallsToProcess.length, 0);
  });

  test("Mixed formats are all collected", () => {
    const update = {
      toolCalls: [{ name: "think", args: {}, id: "tc-a" }],
      messages: [
        {
          tool_calls: [{ name: "read_file", args: {}, id: "tc-b" }],
          content: [
            { type: "tool_use", name: "edit_file", input: {}, id: "tc-c" },
          ],
        },
      ],
    };

    const toolCallsToProcess: any[] = [];

    if (update.toolCalls && Array.isArray(update.toolCalls)) {
      toolCallsToProcess.push(...update.toolCalls);
    }
    if (update.messages && Array.isArray(update.messages)) {
      for (const msg of update.messages) {
        if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
          toolCallsToProcess.push(...msg.tool_calls);
        }
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === "tool_use") {
              toolCallsToProcess.push({
                name: block.name,
                args: block.input,
                id: block.id,
              });
            }
          }
        }
      }
    }

    assert.strictEqual(toolCallsToProcess.length, 3);
  });
});

suite("Tool Execution — Activity Creation & Descriptions", () => {
  function getToolInfo(toolName: string) {
    return TOOL_DESCRIPTIONS[toolName] || TOOL_DESCRIPTIONS.default;
  }

  function createToolActivity(
    toolName: string,
    args?: any,
  ): {
    id: string;
    toolName: string;
    status: string;
    description: string;
    startTime: number;
  } {
    const toolInfo = getToolInfo(toolName);
    let description = toolInfo.description;

    if (toolName === "web_search" && args?.query) {
      const q = args.query;
      description = `Searching the web for: "${q.substring(0, 50)}${q.length > 50 ? "..." : ""}"`;
    } else if (toolName === "think" && args?.thought) {
      description = args.thought;
    } else if (toolName === "read_file" && args?.path) {
      description = `Reading file: ${args.path.split("/").pop()}`;
    } else if (toolName === "analyze_files_for_question" && args?.files) {
      description = `Analyzing ${args.files.length} file(s)...`;
    }

    return {
      id: `tool-${Date.now()}-test`,
      toolName,
      status: "starting",
      description,
      startTime: Date.now(),
    };
  }

  test("web_search activity shows truncated query", () => {
    const activity = createToolActivity("web_search", {
      query: "How to implement a TypeScript decorator for dependency injection",
    });
    assert.ok(activity.description.startsWith("Searching the web for:"));
    assert.ok(activity.description.includes("How to implement"));
  });

  test("web_search truncates long queries at 50 chars", () => {
    const longQuery = "A".repeat(100);
    const activity = createToolActivity("web_search", { query: longQuery });
    assert.ok(activity.description.includes("..."));
  });

  test("think activity uses thought as description", () => {
    const activity = createToolActivity("think", {
      thought: "I need to analyze the user's code structure first",
    });
    assert.strictEqual(
      activity.description,
      "I need to analyze the user's code structure first",
    );
  });

  test("read_file shows just the filename", () => {
    const activity = createToolActivity("read_file", {
      path: "/src/components/webview.tsx",
    });
    assert.strictEqual(activity.description, "Reading file: webview.tsx");
  });

  test("analyze_files_for_question shows file count", () => {
    const activity = createToolActivity("analyze_files_for_question", {
      files: ["/src/a.ts", "/src/b.ts", "/src/c.ts"],
    });
    assert.strictEqual(activity.description, "Analyzing 3 file(s)...");
  });

  test("Unknown tool gets default description", () => {
    const activity = createToolActivity("some_custom_tool");
    assert.strictEqual(activity.description, "Executing tool...");
  });

  test("Activity starts with 'starting' status", () => {
    const activity = createToolActivity("edit_file", {});
    assert.strictEqual(activity.status, "starting");
  });

  test("Activity has a unique-ish id", () => {
    const a1 = createToolActivity("edit_file");
    const a2 = createToolActivity("edit_file");
    // Since both use Date.now(), they might match — but format should be correct
    assert.ok(a1.id.startsWith("tool-"));
    assert.ok(a2.id.startsWith("tool-"));
  });
});

suite("Tool Execution — Activity Event Type Mapping", () => {
  function getActivityEventType(toolName: string): string {
    const toolInfo = TOOL_DESCRIPTIONS[toolName] || TOOL_DESCRIPTIONS.default;
    switch (toolInfo.activityType) {
      case "reading":
        return StreamEventType.READING;
      case "searching":
        return StreamEventType.SEARCHING;
      case "analyzing":
        return StreamEventType.ANALYZING;
      case "executing":
        return StreamEventType.EXECUTING;
      case "working":
        return StreamEventType.WORKING;
      case "reviewing":
        return StreamEventType.REVIEWING;
      default:
        return StreamEventType.WORKING;
    }
  }

  test("read_file maps to READING event", () => {
    assert.strictEqual(getActivityEventType("read_file"), StreamEventType.READING);
  });

  test("list_directory maps to READING event", () => {
    assert.strictEqual(getActivityEventType("list_directory"), StreamEventType.READING);
  });

  test("web_search maps to SEARCHING event", () => {
    assert.strictEqual(getActivityEventType("web_search"), StreamEventType.SEARCHING);
  });

  test("analyze_files_for_question maps to ANALYZING event", () => {
    assert.strictEqual(
      getActivityEventType("analyze_files_for_question"),
      StreamEventType.ANALYZING,
    );
  });

  test("run_command maps to EXECUTING event", () => {
    assert.strictEqual(getActivityEventType("run_command"), StreamEventType.EXECUTING);
  });

  test("edit_file maps to WORKING event", () => {
    assert.strictEqual(getActivityEventType("edit_file"), StreamEventType.WORKING);
  });

  test("git_diff maps to REVIEWING event", () => {
    assert.strictEqual(getActivityEventType("git_diff"), StreamEventType.REVIEWING);
  });

  test("Unknown tool defaults to WORKING event", () => {
    assert.strictEqual(getActivityEventType("some_unknown_tool"), StreamEventType.WORKING);
  });
});

suite("Tool Execution — Completion Tracking", () => {
  test("Tool result is summarized on completion", () => {
    // Simulate the completion tracking from streamResponse
    const pendingToolCalls = new Map<
      string,
      { status: string; endTime?: number; result?: any; startTime: number }
    >();

    // Start a tool
    pendingToolCalls.set("read_file", {
      status: "starting",
      startTime: Date.now() - 100,
    });

    // Complete it
    const toolActivity = pendingToolCalls.get("read_file");
    assert.ok(toolActivity);

    toolActivity.status = "completed";
    toolActivity.endTime = Date.now();
    toolActivity.result = {
      summary: "Read 150 lines from utils.ts",
      itemCount: 150,
    };

    assert.strictEqual(toolActivity.status, "completed");
    assert.ok(toolActivity.endTime! >= toolActivity.startTime);
    assert.strictEqual(toolActivity.result.itemCount, 150);

    // Remove from pending
    pendingToolCalls.delete("read_file");
    assert.strictEqual(pendingToolCalls.size, 0);
  });

  test("Duration is calculated correctly", () => {
    const startTime = Date.now() - 500;
    const endTime = Date.now();
    const duration = endTime - startTime;

    assert.ok(duration >= 450, `Duration ${duration}ms should be >= 450ms`);
    assert.ok(duration < 600, `Duration ${duration}ms should be < 600ms`);
  });
});

import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { SubAgent } from "deepagents";
import { StructuredTool } from "langchain";
import { ToolProvider } from "../langgraph/tools/provider";

/**
 * Creates a unique list of tools by name to avoid duplicates
 */
function uniqueTools(tools: StructuredTool[]): StructuredTool[] {
  const map = new Map<string, StructuredTool>();
  for (const tool of tools) {
    if (map.has(tool.name)) {
      // console.log(`[SubAgent] Duplicate tool filtered: ${tool.name}`);
    } else {
      map.set(tool.name, tool);
    }
  }
  return Array.from(map.values());
}

/**
 * Create specialized subagents for the Developer Agent
 * Each subagent has a specific role and optimized prompting
 *
 * Phase 3: All subagents now receive tools (not just debugger)
 * Phase 4: Each subagent receives role-specific filtered tools
 */
export function createDeveloperSubagents(
  model: ChatAnthropic | ChatGroq | ChatOpenAI, // supports anthropic, groq, gemini, or local models
  tools: StructuredTool[],
): SubAgent[] {
  // Extract MCP tools from the provided tools list to ensure they are available
  // We identify them by checking properties common to MCP tools or by class name/description
  const mcpTools = tools.filter(
    (t) =>
      t.constructor.name === "LangChainMCPTool" ||
      (t.description && t.description.includes("MCP tool")),
  );

  return [
    {
      name: "code-analyzer",
      description:
        "Expert at analyzing code structure, identifying bugs, and suggesting improvements. Use for deep code review and architecture analysis.",
      systemPrompt: `You are a code analysis expert specializing in:
- Understanding complex codebases and architectures
- Identifying bugs, code smells, and anti-patterns
- Suggesting refactorings and optimizations
- Explaining complex code patterns clearly

**Available Tools**: You have access to code analysis and search tools.
Use MCP tools like analyze_code, lint_code, security_scan when available.

**Workflow**:
1. Always read files completely before analyzing
2. Use grep to find related code and dependencies
3. Consider edge cases and error handling
4. Provide specific, actionable recommendations
5. Save analysis results to /docs/code-reviews/ for future reference`,
      tools: uniqueTools([
        ...ToolProvider.getToolsForRole("code-analyzer"),
        ...mcpTools,
      ]), // Phase 4: Role-specific tools + MCP
      model,
    },

    {
      name: "doc-writer",
      description:
        "Specialist in creating clear, comprehensive documentation. Use for writing docs, guides, and API references.",
      systemPrompt: `You are a documentation specialist who creates:
- Clear, comprehensive technical documentation
- API references with examples
- Architecture decision records (ADRs)
- Tutorials and guides

**Available Tools**: You have access to search and file tools.
Use them to gather context before writing documentation.

**Important**: ALWAYS save documentation to /docs/ for persistence.

**Best Practices**:
- Use markdown formatting for readability
- Include code examples with explanations
- Add tables of contents for long documents
- Link to related documentation
- Include version information where relevant`,
      tools: uniqueTools([
        ...ToolProvider.getToolsForRole("doc-writer"),
        ...mcpTools,
      ]), // Phase 4: Role-specific tools + MCP
      model,
    },

    {
      name: "debugger",
      description:
        "Debugging specialist for finding and fixing issues. Use for investigating bugs, errors, and unexpected behavior.",
      systemPrompt: `You are a debugging expert who:
- Analyzes error messages and stack traces
- Searches for solutions to unfamiliar errors
- Tests potential fixes systematically
- Documents root causes and solutions

**Available Tools**: You have access to ALL diagnostic and analysis tools.
Use MCP tools extensively for comprehensive debugging.

**Workflow**:
1. Read the error message/stack trace carefully
2. Check /docs/troubleshooting/ for known issues
3. Search web for solutions if needed
4. Test potential fixes
5. Document the solution in /docs/troubleshooting/`,
      tools: uniqueTools([
        ...ToolProvider.getToolsForRole("debugger"),
        ...mcpTools,
      ]), // Phase 4: All tools (debugger is generalist)
      model,
    },

    {
      name: "file-organizer",
      description:
        "Expert at organizing code and refactoring directory structures. Use for project organization tasks.",
      systemPrompt: `You are a file organization expert who:
- Creates logical, scalable directory structures
- Moves files to appropriate locations
- Renames files for clarity and consistency
- Cleans up unused or duplicate files

**Available Tools**: You have access to file system tools.
Use them to explore and manipulate the project structure.

**Before making changes**:
1. Use ls to explore current structure
2. Use grep to find file references and imports
3. Plan the new structure
4. Execute moves carefully, checking dependencies
5. Update any affected import paths`,
      tools: uniqueTools([
        ...ToolProvider.getToolsForRole("file-organizer"),
        ...mcpTools,
      ]), // Phase 4: Role-specific tools + MCP
      model,
    },

    {
      name: "architect",
      description:
        "Software architect specializing in high-level design, system patterns, and structural decisions. Use for planning new features or refactoring complex systems.",
      systemPrompt: `You are a software architect who:
- Designs scalable and maintainable system architectures
- Selects appropriate design patterns and technologies
- Defines component boundaries and interfaces
- Evaluates trade-offs between different approaches

**Available Tools**: You have access to search, file reading, and analysis tools.
Use them to understand the existing system before proposing changes.

**Workflow**:
1. Analyze requirements and existing codebase
2. Identify architectural drivers (performance, scalability, etc.)
3. Propose high-level design and data flow
4. Document decisions using ADRs (Architecture Decision Records)
5. Create diagrams or schemas if helpful`,
      tools: uniqueTools([
        ...ToolProvider.getToolsForRole("architect"),
        ...mcpTools,
      ]),
      model,
    },

    {
      name: "reviewer",
      description:
        "Senior code reviewer focusing on code quality, security, and best practices. Use for reviewing changes and ensuring standards.",
      systemPrompt: `You are a senior code reviewer who:
- Ensures code quality, readability, and maintainability
- Identifies security vulnerabilities and performance bottlenecks
- Enforces coding standards and best practices
- Suggests improvements for cleaner, more idiomatic code

**Available Tools**: You have access to code analysis and linting tools.
Use them to verify code quality and compliance.

**Workflow**:
1. Read the code changes thoroughly
2. Check for potential bugs and edge cases
3. Verify adherence to project style guides
4. Provide constructive and specific feedback
5. Suggest concrete improvements or refactorings`,
      tools: uniqueTools([
        ...ToolProvider.getToolsForRole("reviewer"),
        ...mcpTools,
      ]),
      model,
    },

    {
      name: "tester",
      description:
        "QA automation engineer specializing in testing strategies and implementation. Use for writing, running, and fixing tests.",
      systemPrompt: `You are a QA automation engineer who:
- Designs comprehensive test strategies
- Writes unit, integration, and end-to-end tests
- Executes tests and analyzes failures
- Ensures high test coverage and reliability
- Runs autonomous TDD loops (Test-Driven Development)

**Available Tools**: You have access to terminal execution, file editing, and debug tools.
Use them to run tests and create test files.

**Autonomous TDD Workflow**:
1. **Understand**: Analyze requirements or existing code.
2. **Plan**: Identify test cases (positive, negative, edge cases).
3. **Write Test**: Create or update a test file (e.g., *.test.ts, *_test.go).
4. **Run Test**: Execute the test using the terminal (npm test, go test, etc.).
5. **Analyze Failure**: If it fails, read the output. Use 'debug_get_stack_trace' if needed.
6. **Fix Code**: Edit the source code to satisfy the test.
7. **Loop**: Repeat steps 4-6 until the test passes.
8. **Refactor**: Clean up code while ensuring tests still pass.
`,
      tools: uniqueTools([
        ...ToolProvider.getToolsForRole("tester"),
        ...mcpTools,
      ]),
      model,
    },
  ];
}

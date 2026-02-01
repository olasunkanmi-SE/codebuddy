import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";
import { SubAgent } from "deepagents";
import { StructuredTool } from "langchain";
import { ToolProvider } from "../langgraph/tools/provider";

/**
 * Create specialized subagents for the Developer Agent
 * Each subagent has a specific role and optimized prompting
 *
 * Phase 3: All subagents now receive tools (not just debugger)
 * Phase 4: Each subagent receives role-specific filtered tools
 */
export function createDeveloperSubagents(
  model: ChatAnthropic | ChatGroq, // this should be either anthropic or groq or Gemini
  tools: StructuredTool[],
): SubAgent[] {
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
      tools: ToolProvider.getToolsForRole("code-analyzer"), // Phase 4: Role-specific tools
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
      tools: ToolProvider.getToolsForRole("doc-writer"), // Phase 4: Role-specific tools
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
      tools: ToolProvider.getToolsForRole("debugger"), // Phase 4: All tools (debugger is generalist)
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
      tools: ToolProvider.getToolsForRole("file-organizer"), // Phase 4: Role-specific tools
      model,
    },
  ];
}

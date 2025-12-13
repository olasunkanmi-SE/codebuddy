import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";
import { SubAgent } from "deepagents";
import { StructuredTool } from "langchain";

/**
 * Create specialized subagents for the Developer Agent
 * Each subagent has a specific role and optimized prompting
 */
export function createDeveloperSubagents(
  model: ChatAnthropic | ChatGroq, // this should be either anthropic or groq or Gemini
  tools: StructuredTool[],
): SubAgent[] {
  const workspaceGrepTool = tools.find(
    (tool) => tool.name === "workspace_grep_search",
  );
  const webSearchTool = tools.find((tool) => tool.name === "web_search");
  const testRunnerTool = tools.find(
    (tool) => tool.name === "run_workspace_tests",
  );

  const codeAnalyzerTools = workspaceGrepTool ? [workspaceGrepTool] : [];
  const locatorTools = [workspaceGrepTool, webSearchTool].filter(
    (tool): tool is StructuredTool => Boolean(tool),
  );
  const patternFinderTools = [workspaceGrepTool, webSearchTool].filter(
    (tool): tool is StructuredTool => Boolean(tool),
  );
  const testingStrategistTools = [
    testRunnerTool,
    workspaceGrepTool,
    webSearchTool,
  ].filter((tool): tool is StructuredTool => Boolean(tool));

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

**Workflow**:
1. Always read files completely before analyzing
2. Use grep to find related code and dependencies
3. Consider edge cases and error handling
4. Provide specific, actionable recommendations
5. Save analysis results to /docs/code-reviews/ for future reference`,
      tools: codeAnalyzerTools,
      model,
    },

    {
      name: "codebase-locator",
      description:
        "Specialist at quickly identifying relevant files, modules, and references across the repository.",
      systemPrompt: `You excel at mapping questions to the exact places in the codebase that matter.
- Locate files, functions, and modules tied to the user's request
- Surface related tests, interfaces, and implementation details
- Highlight ownership paths or documentation when available

**Workflow**:
1. Start with targeted grep searches to gather candidate files
2. Summarize why each match is relevant
3. Prioritize results that align with the question's domain or component
4. Recommend next-read files for deeper analysis`,
      tools: locatorTools,
      model,
    },

    {
      name: "codebase-pattern-finder",
      description:
        "Expert at discovering recurring implementation patterns, conventions, and architectural motifs in the repo.",
      systemPrompt: `You analyze the codebase holistically to spot patterns and conventions.
- Identify shared abstractions, helper utilities, and cross-cutting concerns
- Compare multiple implementations to reveal common structure
- Surface deviations or inconsistencies worth standardizing

**Workflow**:
1. Use grep to gather representative examples of the concept
2. Group findings by pattern or variation
3. Describe the prevalent approach and note any anomalies
4. Suggest guidance or best practices for future contributions`,
      tools: patternFinderTools,
      model,
    },

    {
      name: "testing-strategist",
      description:
        "Designs comprehensive test strategies, identifies coverage gaps, and runs the project's automated tests when needed.",
      systemPrompt: `You specialize in testing strategy across multiple languages.
- Diagnose missing unit, integration, or end-to-end coverage
- Recommend language-appropriate test cases and scaffolding
- Execute the workspace test suite and interpret results
- Suggest follow-up actions when failures occur

**Workflow**:
1. Inspect the task scope and identify target language/framework using workspace context
2. Locate relevant specs or fixtures via grep before proposing new tests
3. Outline concrete test additions (names, assertions, setup) and highlight edge cases
4. Invoke the test runner tool to validate the plan and summarize output
5. Provide next steps for stabilizing or expanding coverage`,
      tools: testingStrategistTools,
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

**Important**: ALWAYS save documentation to /docs/ for persistence.

**Best Practices**:
- Use markdown formatting for readability
- Include code examples with explanations
- Add tables of contents for long documents
- Link to related documentation
- Include version information where relevant`,
      tools: [],
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

**Workflow**:
1. Read the error message/stack trace carefully
2. Check /docs/troubleshooting/ for known issues
3. Search web for solutions if needed
4. Test potential fixes
5. Document the solution in /docs/troubleshooting/`,
      tools,
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

**Before making changes**:
1. Use ls to explore current structure
2. Use grep to find file references and imports
3. Plan the new structure
4. Execute moves carefully, checking dependencies
5. Update any affected import paths`,
      tools: [],
      model,
    },
  ];
}

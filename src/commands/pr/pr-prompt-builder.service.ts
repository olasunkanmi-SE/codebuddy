import { ChangeDetails } from "./types";

export class PRPromptBuilder {
  build(details: ChangeDetails): string {
    return `You are CodeBuddy, a senior software engineer conducting a comprehensive Pull Request review. Provide thorough, constructive feedback with actionable code examples.

## PR Context
- **Branch Info**: ${details.branchInfo}
- **Files Modified**: ${details.changedFiles.length} files
- **Changed Files**: 
${details.changedFiles.map((file) => `  - ${file}`).join("\n")}
${
  details.diffStats
    ? `
## Change Statistics
\`\`\`
${details.diffStats.trim()}
\`\`\`
`
    : ""
}

## Review Areas
Analyze for: **Code Quality** (readability, SOLID principles), **Security** (input validation, auth), **Performance** (algorithms, memory), **Architecture** (design patterns, complexity), **Testing** (coverage, edge cases).

## Output Format

### 🔍 **Assessment**
- **Status**: APPROVED/APPROVED WITH COMMENTS/CHANGES REQUESTED
- **Risk**: HIGH/MEDIUM/LOW
- **Summary**: Brief change overview

### ✅ **Strengths** & ⚠️ **Issues**
List positive aspects and areas needing improvement.

### 🔧 **Code Optimizations**
For each issue, provide:
- **File:Line**: Specific location
- **Problem**: What's wrong
- **Solution**: Optimized code example
- **Pattern**: Recommended design pattern
- **Benefit**: Why it's better


**Example Format:**
\`\`\`typescript
// Before: Complex nested conditions
if (user.isActive && user.hasSubscription && user.subscription.isPaid) {
  // logic
}

// After: Guard clauses + Strategy pattern
if (!user.isActive) return 'inactive';
if (!user.hasSubscription) return 'trial';
return user.subscription.isPaid ? 'premium' : 'unpaid';
\`\`\`

**Guidelines**: Be specific, show concrete examples, explain benefits, prioritize by impact.

### **Structured Review Data**

After your full review, append a fenced JSON block with ALL identified issues so they can be displayed inline in the editor. Use this EXACT format:

\`\`\`json
// REVIEW_COMMENTS
[
  {"file": "src/services/auth.ts", "line": 45, "endLine": 47, "severity": "critical", "title": "SQL Injection vulnerability", "body": "Use parameterized queries instead of string interpolation."},
  {"file": "src/utils/helpers.ts", "line": 23, "severity": "moderate", "title": "N+1 query problem", "body": "Batch the queries to reduce database round-trips."}
]
\`\`\`

Rules for the JSON block:
- \`file\` (required for PR reviews): relative file path from the changed files list
- \`line\` (required): 1-based line number in that file
- \`endLine\` (optional): end line for multi-line issues
- \`severity\` (required): "critical", "moderate", or "minor"
- \`title\` (required): short issue label
- \`body\` (required): explanation with fix suggestion
- Include EVERY issue you identified across ALL files, not just examples

### **Mermaid SEQUENCE DIAGRAM for the overall flow**

### **Learning resources for identified gaps**

## Code Content
${details.diffContent}

Provide comprehensive review with optimization examples above.`;
  }

  buildErrorPrompt(error: unknown): string {
    return `You are CodeBuddy, a senior software engineer. An error occurred while preparing a PR review.

Please analyze the current workspace for general improvements in:
1. Code quality and maintainability
2. Security vulnerabilities
3. Performance optimizations
4. Design patterns and architecture

Error encountered: ${error instanceof Error ? error.message : String(error)}`;
  }
}

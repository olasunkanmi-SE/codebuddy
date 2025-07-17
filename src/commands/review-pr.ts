import * as vscode from "vscode";
import { CodeCommandHandler } from "./handler";
import { GitActions } from "../services/git-actions";
import { formatText } from "../utils/utils";

export class ReviewPR extends CodeCommandHandler {
  private readonly gitActions: GitActions;

  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
    this.gitActions = new GitActions();
  }

  /**
   * Allow user to select target branch for PR review
   */
  private async selectTargetBranch(): Promise<string | undefined> {
    try {
      const branches = await this.gitActions.getAvailableBranches();
      const baseBranch = await this.gitActions.getBaseBranch();

      // Put the detected base branch first in the list
      const sortedBranches = [
        baseBranch,
        ...branches.filter((b) => b !== baseBranch),
      ];

      const selectedBranch = await vscode.window.showQuickPick(sortedBranches, {
        placeHolder: `Select target branch for PR review (detected: ${baseBranch})`,
        title: "PR Review Target Branch",
      });

      return selectedBranch;
    } catch (error) {
      console.error("Error selecting target branch:", error);
      vscode.window.showErrorMessage("Failed to get available branches");
      return undefined;
    }
  }

  /**
   * Generate comprehensive PR review prompt
   */
  async generatePrompt(): Promise<string> {
    try {
      // Get target branch from user or use detected base branch
      const targetBranch = await this.selectTargetBranch();
      if (!targetBranch) {
        throw new Error("No target branch selected");
      }

      // Get PR differences
      const prDiff = await this.gitActions.getPRDifferenceSummary(targetBranch);

      // Get additional context
      const currentBranchInfo = await this.gitActions.getCurrentBranchInfo();
      const diffStats = await this.gitActions.getDiffStats(targetBranch);
      const modifiedFiles =
        await this.gitActions.getModifiedFiles(targetBranch);
      const commitHistory =
        await this.gitActions.getCommitHistory(targetBranch);

      return `You are CodeBuddy, a senior software engineer conducting a comprehensive Pull Request review. Provide thorough, constructive feedback with actionable code examples.

## PR Context
- **Branch**: ${currentBranchInfo.current} → ${targetBranch}
- **Files**: ${modifiedFiles.length} modified
- **Commits**: ${commitHistory
        .slice(0, 5)
        .map((c) => `- ${c}`)
        .join("\n")}

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

### 🏗️ **Design Recommendations**
- **Patterns**: Factory, Observer, Strategy, Command for specific scenarios
- **SOLID**: Single responsibility, dependency inversion applications
- **Architecture**: Clean/hexagonal architecture, DDD alignment
- **Refactoring**: Extract method, reduce complexity (target CC < 10)

### � **Complexity Analysis**
- **High Complexity Functions**: Break down >10 CC functions
- **Nested Logic**: Use early returns, polymorphism over conditionals
- **Long Methods**: Extract to single-purpose functions
- **Technical Debt**: Identify accumulation areas

### 🚀 **Performance Examples**
\`\`\`typescript
// N+1 Query Fix
const orders = await orderService.getByUserIds(userIds);
// Memory Leak Fix  
return () => listeners.delete(event); // cleanup
\`\`\`

### 🎯 **Action Items**
- **Must Fix**: Critical security/performance issues
- **Should Fix**: Code quality improvements
- **Consider**: Future architecture enhancements

**Guidelines**: Be specific, show concrete examples, explain benefits, prioritize by impact.

## Code Diff
${prDiff}

Provide comprehensive review with optimization examples above.`;
    } catch (error) {
      console.error("Error generating PR review prompt:", error);
      throw error;
    }
  }

  formatResponse(review: string): string {
    return formatText(review);
  }

  async createPrompt(selectedCode: string): Promise<string> {
    // For PR review, we don't use selectedCode as we analyze the entire PR diff
    return await this.generatePrompt();
  }
}

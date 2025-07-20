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
   * Get VS Code git changes (more reliable than manual git commands)
   */
  private async getVSCodeGitChanges(): Promise<{
    changes: vscode.SourceControlResourceState[];
    repository: any;
  }> {
    // Get the git extension
    const gitExtension = vscode.extensions.getExtension("vscode.git")?.exports;
    const api = gitExtension?.getAPI(1);

    if (!api) {
      throw new Error("Git extension not available");
    }

    // Get the repository for the current workspace
    const workspaceUri = vscode.workspace.workspaceFolders?.[0]?.uri;
    if (!workspaceUri) {
      throw new Error("No workspace folder found");
    }

    const repository = api.getRepository(workspaceUri);
    if (!repository) {
      throw new Error("No git repository found in workspace");
    }

    // Get all changes (staged and unstaged)
    const changes = [
      ...repository.state.indexChanges,
      ...repository.state.workingTreeChanges,
    ];

    return { changes, repository };
  }

  /**
   * Get changed files from VS Code's git integration
   */
  private async getChangedFilesFromVSCode(): Promise<{
    files: string[];
    content: string;
  }> {
    try {
      // Use VS Code's workspace to find recently modified files
      const changedFiles: string[] = [];
      let content = "";

      // Get files modified in the last day (as a fallback approach)
      const allFiles = await vscode.workspace.findFiles(
        "**/*.{ts,js,tsx,jsx,json,md,py,java,cs,php}",
        "**/node_modules/**",
        100,
      );

      // Get file stats and filter by recent modifications
      const recentFiles = [];
      for (const fileUri of allFiles.slice(0, 20)) {
        try {
          const stat = await vscode.workspace.fs.stat(fileUri);
          const isRecent = Date.now() - stat.mtime < 24 * 60 * 60 * 1000; // Last 24 hours
          if (isRecent) {
            recentFiles.push(fileUri);
          }
        } catch (error) {
          // Skip files we can't read
        }
      }

      // If we have recent files, use them
      if (recentFiles.length > 0) {
        for (const fileUri of recentFiles.slice(0, 5)) {
          const relativePath = vscode.workspace.asRelativePath(fileUri);
          changedFiles.push(relativePath);

          try {
            const document = await vscode.workspace.openTextDocument(fileUri);
            const fileContent = document.getText();
            const truncatedContent =
              fileContent.length > 800
                ? fileContent.substring(0, 800) + "... [truncated]"
                : fileContent;
            content += `\n\n## File: ${relativePath}\n\`\`\`${this.getFileExtension(relativePath)}\n${truncatedContent}\n\`\`\``;
          } catch (error) {
            content += `\n\n## File: ${relativePath}\n[Error reading file: ${error}]`;
          }
        }
      }

      return { files: changedFiles, content };
    } catch (error) {
      console.error("Error getting changed files from VS Code:", error);
      return { files: [], content: "Error detecting changed files" };
    }
  }

  private getFileExtension(filePath: string): string {
    const ext = filePath.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "ts":
      case "tsx":
        return "typescript";
      case "js":
      case "jsx":
        return "javascript";
      case "py":
        return "python";
      case "java":
        return "java";
      case "cs":
        return "csharp";
      case "php":
        return "php";
      case "md":
        return "markdown";
      case "json":
        return "json";
      default:
        return ext || "text";
    }
  }

  /**
   * Get file content from VS Code
   */
  private async getFileContent(filePath: string): Promise<string> {
    try {
      const workspaceUri = vscode.workspace.workspaceFolders?.[0]?.uri;
      if (!workspaceUri) {
        return "Could not access workspace";
      }

      const fileUri = vscode.Uri.joinPath(workspaceUri, filePath);
      const document = await vscode.workspace.openTextDocument(fileUri);
      return document.getText();
    } catch (error) {
      return `Error reading file: ${error}`;
    }
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
   * Generate comprehensive PR review prompt using VS Code git integration
   */
  async generatePrompt(): Promise<string> {
    try {
      let changedFiles: string[] = [];
      let diffContent = "";
      let branchInfo = "Unknown branch";

      try {
        // First, try to use VS Code's git integration
        const { changes, repository } = await this.getVSCodeGitChanges();

        if (changes.length > 0) {
          changedFiles = changes.map((change) => {
            const relativePath = vscode.workspace.asRelativePath(
              change.resourceUri,
            );
            return `${relativePath} (${change.decorations?.tooltip || "modified"})`;
          });

          // Get current branch info
          branchInfo = `Current branch: ${repository.state.HEAD?.name || "HEAD"}`;

          // Get sample of changed file content for context
          const sampleFiles = changes.slice(0, 5); // Limit to first 5 files
          for (const change of sampleFiles) {
            const filePath = vscode.workspace.asRelativePath(
              change.resourceUri,
            );
            const content = await this.getFileContent(filePath);
            const truncatedContent =
              content.length > 1000
                ? content.substring(0, 1000) + "... [truncated]"
                : content;

            diffContent += `\n\n## File: ${filePath}\n${truncatedContent}`;
          }
        }
      } catch (error) {
        console.log(
          "VS Code git integration failed, falling back to git commands:",
          error,
        );

        // Fallback to the original git commands approach
        try {
          const targetBranch = await this.selectTargetBranch();
          if (targetBranch) {
            const modifiedFiles =
              await this.gitActions.getModifiedFiles(targetBranch);
            const prDiff =
              await this.gitActions.getPRDifferenceSummary(targetBranch);
            const currentBranchInfo =
              await this.gitActions.getCurrentBranchInfo();

            changedFiles = modifiedFiles;
            diffContent = prDiff;
            branchInfo = `${currentBranchInfo.current} → ${targetBranch}`;
          }
        } catch (fallbackError) {
          console.error(
            "Both VS Code git and fallback git commands failed:",
            fallbackError,
          );
          // Continue with empty data but inform about the issue
        }
      }

      // If we still have no changes, let's check for any recent modifications in the workspace
      if (changedFiles.length === 0) {
        console.log("No git changes found, using recent file detection");
        const { files, content } = await this.getChangedFilesFromVSCode();
        changedFiles = files;
        if (content) {
          diffContent = content;
        } else {
          diffContent =
            "Note: No recent changes detected. Performing general code quality assessment of workspace files.";
        }
      }

      return `You are CodeBuddy, a senior software engineer conducting a comprehensive Pull Request review. Provide thorough, constructive feedback with actionable code examples.

## PR Context
- **Branch Info**: ${branchInfo}
- **Files Modified**: ${changedFiles.length} files
- **Changed Files**: 
${changedFiles.map((file) => `  - ${file}`).join("\n")}

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

### 🔀 **Complexity Analysis**
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

## Code Content
${diffContent}

Provide comprehensive review with optimization examples above.`;
    } catch (error) {
      console.error("Error generating PR review prompt:", error);

      // Return a basic prompt even if everything fails
      return `You are CodeBuddy, a senior software engineer conducting a code review. 

Please analyze the current workspace for:
1. Code quality and maintainability
2. Security vulnerabilities
3. Performance optimizations
4. Design patterns and architecture

Since no specific changes were detected, provide a general assessment of the codebase and suggest improvements.

Error encountered: ${error}`;
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

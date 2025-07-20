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
    const changes = [...repository.state.indexChanges, ...repository.state.workingTreeChanges];

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

      // Optimized file retrieval: only fetch files modified in the last 24 hours
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000; // 24 hours ago

      // First get all potential files (limit to reduce I/O)
      const allFiles = await vscode.workspace.findFiles(
        "**/*.{ts,js,tsx,jsx,json,md,py,java,cs,php}",
        "**/node_modules/**",
        50 // Reduced from 100 to limit initial fetch
      );

      // Filter files based on last modified time more efficiently
      const recentFiles: vscode.Uri[] = [];
      const batchSize = 10; // Process files in batches to avoid blocking

      for (let i = 0; i < allFiles.length; i += batchSize) {
        const batch = allFiles.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(async (fileUri) => {
            try {
              const stat = await vscode.workspace.fs.stat(fileUri);
              if (stat.mtime >= oneDayAgo && stat.mtime <= now) {
                return fileUri;
              }
            } catch (error) {
              console.error(`Error getting file stat for ${fileUri.fsPath}:`, error);
            }
            return null;
          })
        );

        // Collect successful results
        batchResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            recentFiles.push(result.value);
          }
        });

        // Stop if we have enough files
        if (recentFiles.length >= 10) break;
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
              fileContent.length > 800 ? fileContent.substring(0, 800) + "... [truncated]" : fileContent;
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
      const currentBranch = await this.gitActions.getCurrentBranchInfo();

      // Filter out the current branch from the options
      const availableBranches = branches.filter((b) => b !== currentBranch.current);

      // Try to detect common base branches and put them first
      const commonBaseBranches = ["main", "master", "develop", "dev", "staging"];
      const priorityBranches = commonBaseBranches.filter((b) => availableBranches.includes(b));
      const otherBranches = availableBranches.filter((b) => !commonBaseBranches.includes(b));

      const sortedBranches = [...priorityBranches, ...otherBranches];

      if (sortedBranches.length === 0) {
        vscode.window.showWarningMessage("No other branches found to compare against");
        return undefined;
      }

      // Create quick pick items with additional context
      const quickPickItems = sortedBranches.map((branch) => ({
        label: branch,
        description: commonBaseBranches.includes(branch) ? "(common base branch)" : "",
        detail: `Compare ${currentBranch.current} → ${branch}`,
      }));

      const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: `Select target branch to review ${currentBranch.current} against`,
        title: "Pull Request Review - Target Branch",
        matchOnDescription: true,
        matchOnDetail: true,
      });

      return selected?.label;
    } catch (error) {
      console.error("Error selecting target branch:", error);
      vscode.window.showErrorMessage(`Failed to get available branches: ${error}`);
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

      // First, always ask user to select target branch for PR review
      const targetBranch = await this.selectTargetBranch();
      if (!targetBranch) {
        vscode.window.showInformationMessage("PR review cancelled - no target branch selected");
        throw new Error("No target branch selected for PR review");
      }

      try {
        // Try to use git commands first for PR diff against specific branch
        const modifiedFiles = await this.gitActions.getModifiedFiles(targetBranch);
        const prDiff = await this.gitActions.getPRDifferenceSummary(targetBranch);
        const currentBranchInfo = await this.gitActions.getCurrentBranchInfo();

        changedFiles = modifiedFiles;
        diffContent = prDiff;
        branchInfo = `${currentBranchInfo.current} → ${targetBranch}`;

        console.log(`PR review: comparing ${currentBranchInfo.current} against ${targetBranch}`);

        // Show user confirmation of what's being reviewed
        vscode.window.showInformationMessage(
          `🔍 Reviewing PR: ${currentBranchInfo.current} → ${targetBranch} (${modifiedFiles.length} files changed)`
        );
      } catch (gitError) {
        console.log("Git commands failed, falling back to VS Code git integration:", gitError);

        // Fallback to VS Code's git integration
        try {
          const { changes, repository } = await this.getVSCodeGitChanges();

          if (changes.length > 0) {
            changedFiles = changes.map((change) => {
              const relativePath = vscode.workspace.asRelativePath(change.resourceUri);
              return `${relativePath} (${change.decorations?.tooltip || "modified"})`;
            });

            // Get current branch info
            const currentBranch = repository.state.HEAD?.name || "HEAD";
            branchInfo = `Current branch: ${currentBranch} (target: ${targetBranch})`;

            // Get sample of changed file content for context
            const sampleFiles = changes.slice(0, 5); // Limit to first 5 files
            for (const change of sampleFiles) {
              const filePath = vscode.workspace.asRelativePath(change.resourceUri);
              const content = await this.getFileContent(filePath);
              const truncatedContent = content.length > 1000 ? content.substring(0, 1000) + "... [truncated]" : content;

              diffContent += `\n\n## File: ${filePath}\n${truncatedContent}`;
            }
          }
        } catch (vscodeError) {
          console.error("Both git commands and VS Code git integration failed:", vscodeError);

          // Provide user-friendly error notification
          vscode.window
            .showErrorMessage(
              `Failed to retrieve changes between current branch and ${targetBranch}. ` +
                "Please ensure Git is properly configured and accessible. " +
                "The review will proceed with recently modified files as a fallback.",
              "View Output"
            )
            .then((selection) => {
              if (selection === "View Output") {
                vscode.window.showInformationMessage(
                  "Check the VS Code Developer Console (Help > Toggle Developer Tools) for detailed error information."
                );
              }
            });
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

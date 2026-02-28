import * as vscode from "vscode";
import { CodeCommandHandler } from "./handler";
import { GitActions } from "../services/git-actions";
import { formatText } from "../utils/utils";

export class GenerateCommitMessage extends CodeCommandHandler {
  private readonly gitActions: GitActions;

  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
    this.gitActions = new GitActions();
  }

  /**
   * Get staged differences summary using GitActions
   */
  async getStagedDifferenceSummary(): Promise<string> {
    try {
      return await this.gitActions.getStagedDifferenceSummary();
    } catch (error: any) {
      this.logger.error("Error getting staged differences:", error);
      this.notificationService.addNotification(
        "error",
        "Staged Changes Not Found",
        "Failed to get staged changes. Ensure you have staged files for commit.",
        "Git",
      );
      throw error;
    }
  }

  async generatePrompt() {
    return `You are CodeBuddy, an AI assistant specialized in analyzing code changes and generating informative commit messages. Your role is to examine git diffs and produce concise, descriptive commit messages that follow best practices. Here's how you should approach this task:
            Carefully analyze the provided git diff, focusing on the main changes across all modified files.
            Identify the primary type of change (e.g., feat, fix, refactor, docs, style, test, chore) and the main scope of the changes (e.g., api, ui, database).
            Craft a commit message following this structure:
            First line: <type>(<scope>): <short summary>
            Blank line
            Bullet points describing specific changes
            In the short summary, capture the overall purpose or impact of the changes in a brief phrase.
            Use bullet points to list specific, important changes. Focus on what was changed, not how it was changed.
            Keep the entire message concise, ideally not exceeding 5-7 lines total.
            Use present tense, imperative mood for all descriptions (e.g., "Add feature" not "Added feature" or "Adds feature").
            Mention significant dependency changes, especially the addition of new packages.
            If documentation or comments have been substantially modified, include this information.
            Avoid mentioning minor changes like code formatting, unless that's the primary purpose of the commit.
            When presented with a git diff, analyze it thoroughly and respond with a commit message formatted as described above. Your goal is to provide a clear, informative summary that helps developers quickly understand the nature and scope of the changes.
            Return your response as a markdown and use the pre tags.
            Here is the gitDifference
            ${await this.getStagedDifferenceSummary()}`;
  }

  formatResponse(comment: string): string {
    return formatText(comment);
  }

  async createPrompt(selectedCode: string): Promise<string> {
    const prompt = await this.generatePrompt();
    const fullPrompt = `${prompt} \n ${selectedCode}`;
    return fullPrompt;
  }
}

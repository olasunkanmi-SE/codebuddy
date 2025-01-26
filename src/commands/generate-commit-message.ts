import simpleGit, { GitError, SimpleGit, SimpleGitOptions } from "simple-git";
import { EventGenerator } from "./event-generator";
import * as vscode from "vscode";
import { formatText } from "../application/utils";

export class GenerateCommitMessage extends EventGenerator {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  async getStagedDifferenceSummary() {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      vscode.window.showErrorMessage("No workspace folder is open");
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const options: Partial<SimpleGitOptions> = {
      binary: "git",
      maxConcurrentProcesses: 6,
      trimmed: false,
      baseDir: rootPath,
    };
    try {
      const git: SimpleGit = simpleGit(options);
      const stagedDiffSummay = await git.diffSummary("--staged");

      const fileDifferencePromises = stagedDiffSummay.files.map(
        async (file) => {
          try {
            let fileDiff;
            if (file.file.includes("_deleted_")) {
              fileDiff = "File deleted";
            } else {
              fileDiff = await git.diff(["--staged"]);
            }
            return { file: file.file, diff: fileDiff, error: null };
          } catch (error: any) {
            if (
              error instanceof GitError &&
              error.message.includes(
                "unknown revision or path not in the working tree",
              )
            ) {
              try {
                const fileContent = await git.catFile([
                  "-p",
                  `:0:${file.file}`,
                ]);
                return {
                  file: file.file,
                  diff: `New file: ${file.file}\n${fileContent}`,
                  error: null,
                };
              } catch (catError: any) {
                return {
                  file: file.file,
                  diff: null,
                  error: `Error getting content for new file: ${catError.message}`,
                };
              }
            } else {
              return { file: file.file, diff: null, error: error.message };
            }
          }
        },
      );

      const fileDiffs = await Promise.all(fileDifferencePromises);
      let differenceSummary = "";

      fileDiffs.forEach(({ file, diff, error }) => {
        if (error) {
          console.error(`Error: ${error}`);
        } else {
          differenceSummary = `\nFile: ${diff}`;
        }
      });
      console.log({ differenceSummary });
      return differenceSummary;
    } catch (error) {
      console.log(error);
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

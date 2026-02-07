// src/commands/review-pr.ts
import { CodeCommandHandler } from "../handler";
import { GitActions } from "../../services/git-actions";
import { ChangeDetector } from "./change-detector.service";
import { formatText } from "../../utils/utils";
import { GitCliProvider } from "./git-cli.provider";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { PRPromptBuilder } from "./pr-prompt-builder.service";
import { EditorHostService } from "../../services/editor-host.service";

export class ReviewPR extends CodeCommandHandler {
  private readonly changeDetector: ChangeDetector;
  private readonly promptBuilder: PRPromptBuilder;
  // private readonly branchSelector: BranchSelector;

  constructor(action: string, context: any) {
    super(action, context);
    this.logger = Logger.initialize("ReviewPR", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });

    // Dependency Injection: Compose services here
    const gitActions = new GitActions();
    // this.branchSelector = new BranchSelector(gitActions);
    this.promptBuilder = new PRPromptBuilder();

    // The order of providers determines the fallback strategy
    const changeProviders = [
      new GitCliProvider(gitActions),
      // new VscodeApiProvider(new VscodeGitApi()),
      // new RecentFileChangeProvider(), // Another potential provider
    ];

    this.changeDetector = new ChangeDetector(changeProviders);
  }

  private async selectTargetBranch(): Promise<string | undefined> {
    // This logic can be moved to a dedicated BranchSelector service
    // For brevity, it is kept here but should ideally be extracted.
    const gitActions = new GitActions(); // Or inject it
    const branches = await gitActions.getAvailableBranches();
    const currentBranch = await gitActions.getCurrentBranchInfo();
    const availableBranches = branches.filter(
      (b) => b !== currentBranch.current,
    );
    if (availableBranches.length === 0) {
      EditorHostService.getInstance()
        .getHost()
        .window.showInformationMessage(
          "No other branches found to compare against.",
        );
      return undefined;
    }
    const selected = await EditorHostService.getInstance()
      .getHost()
      .window.showQuickPick(availableBranches, {
        placeHolder: `Select target branch to review ${currentBranch.current} against`,
      });
    if (typeof selected === "object") {
      return selected.label;
    }
    return selected as string;
  }

  public async generatePrompt(): Promise<string> {
    try {
      // 1. User Interaction
      const targetBranch = await this.selectTargetBranch();
      if (!targetBranch) {
        throw new Error("PR review cancelled - no target branch selected.");
      }

      // 2. Data Fetching (Delegated)
      const changeDetails = await this.changeDetector.findChanges(targetBranch);

      // 3. Prompt Construction (Delegated)
      return this.promptBuilder.build(changeDetails);
    } catch (error) {
      this.logger.error("Error generating PR review prompt:", error);
      EditorHostService.getInstance()
        .getHost()
        .window.showErrorMessage(
          error instanceof Error ? error.message : "An unknown error occurred.",
        );
      return this.promptBuilder.buildErrorPrompt(error);
    }
  }

  formatResponse(review: string): string {
    return formatText(review);
  }

  async createPrompt(selectedCode: string): Promise<string> {
    return this.generatePrompt();
  }
}

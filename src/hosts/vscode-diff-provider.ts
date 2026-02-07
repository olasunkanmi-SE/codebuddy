import * as vscode from "vscode";
import { DiffReviewService } from "../services/diff-review.service";

export class DiffContentProvider implements vscode.TextDocumentContentProvider {
  private static instance: DiffContentProvider;
  private diffService: DiffReviewService;

  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this._onDidChange.event;

  private constructor() {
    this.diffService = DiffReviewService.getInstance();

    // Listen to changes in the service to trigger updates
    this.diffService.onChangeEvent((event) => {
      const uri = vscode.Uri.from({
        scheme: DiffReviewService.SCHEME,
        path: event.change.id,
      });
      this._onDidChange.fire(uri);
    });
  }

  public static getInstance(): DiffContentProvider {
    if (!DiffContentProvider.instance) {
      DiffContentProvider.instance = new DiffContentProvider();
    }
    return DiffContentProvider.instance;
  }

  public provideTextDocumentContent(
    uri: vscode.Uri,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<string> {
    if (uri.scheme !== DiffReviewService.SCHEME) {
      return null;
    }

    const id = uri.path; // We'll use the path as the ID
    const change = this.diffService.getPendingChange(id);

    if (!change) {
      return "Error: Pending change not found or expired.";
    }

    return change.newContent;
  }
}

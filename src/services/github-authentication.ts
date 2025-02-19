import * as vscode from "vscode";

const GITHUB_AUTH_PROVIDER_ID = "github";
const SCOPES = ["user:email"];

export class Credentials {
  async initialize(context: vscode.ExtensionContext): Promise<void> {
    this.registerListeners(context);
  }

  async getSession(): Promise<vscode.AuthenticationSession | undefined> {
    const session = await vscode.authentication.getSession(
      GITHUB_AUTH_PROVIDER_ID,
      SCOPES,
      { createIfNone: false },
    );
    return session;
  }

  registerListeners(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
      vscode.authentication.onDidChangeSessions(async (e) => {
        if (e.provider.id === GITHUB_AUTH_PROVIDER_ID) {
          await this.getSession();
        }
      }),
    );
  }
}

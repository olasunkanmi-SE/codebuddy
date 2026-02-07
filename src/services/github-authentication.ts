import { EditorHostService } from "./editor-host.service";
import { IAuthenticationSession } from "../interfaces/editor-host";
import { IDisposable } from "../interfaces/disposable";

const GITHUB_AUTH_PROVIDER_ID = "github";
const SCOPES = ["user:email"];

export class Credentials {
  async initialize(context: { subscriptions: IDisposable[] }): Promise<void> {
    this.registerListeners(context);
  }

  async getSession(): Promise<IAuthenticationSession | undefined> {
    const session = await EditorHostService.getInstance()
      .getHost()
      .authentication.getSession(GITHUB_AUTH_PROVIDER_ID, SCOPES, {
        createIfNone: true,
      });
    return session;
  }

  registerListeners(context: { subscriptions: IDisposable[] }): void {
    context.subscriptions.push(
      EditorHostService.getInstance()
        .getHost()
        .authentication.onDidChangeSessions(async (e) => {
          if (e.provider.id === GITHUB_AUTH_PROVIDER_ID) {
            await this.getSession();
          }
        }),
    );
  }
}

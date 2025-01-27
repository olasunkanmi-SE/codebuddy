import * as vscode from "vscode";
import { AgentEventEmitter } from "../emitter/agent-emitter";

export class BaseAiAgent
  extends AgentEventEmitter
  implements vscode.Disposable
{
  constructor() {
    super();
  }

  public performTask(input: string) {
    try {
      this.emitStatus("processing", input);
    } catch (error) {
      this.emitError(
        error instanceof Error ? error.message : "Unknown Error",
        "process failed",
      );
    } finally {
      this.emitStatus("completed", "Processing complete");
    }
  }

  public dispose(): void {
    this.dispose();
  }
}

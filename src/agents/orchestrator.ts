import * as vscode from "vscode";
import { BaseAiAgent } from "./base";
import { IErrorEvent, IStatusEvent } from "../emitter/interface";

export class Orchestrator implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly aiAgent: BaseAiAgent) {
    this.disposables.push(
      this.aiAgent.onStatus(this.handleStatus.bind(this)),
      this.aiAgent.onError(this.handleError.bind(this))
    );
  }

  private handleStatus(event: IStatusEvent) {
    console.log(`Status: ${event.state} - ${event.message}`);
  }

  private handleError(event: IErrorEvent) {
    console.error(`Error: ${event.message} (Code: ${event.code})`);
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

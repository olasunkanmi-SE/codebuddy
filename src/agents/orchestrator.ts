import * as vscode from "vscode";
import { BaseAiAgent } from "./base";
import { IErrorEvent, IPromptEvent, IStatusEvent } from "../emitter/interface";

export class Orchestrator implements vscode.Disposable {
  private static instance: Orchestrator;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly aiAgent: BaseAiAgent) {
    this.disposables.push(
      this.aiAgent.onStatusChange(this.handleStatus.bind(this)),
      this.aiAgent.onError(this.handleError.bind(this)),
      this.aiAgent.onQuery(this.handleQuery.bind(this)),
    );
  }

  static getInstance(aiAgent: BaseAiAgent) {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator(aiAgent);
    }
    return Orchestrator.instance;
  }

  public handleStatus(event: IStatusEvent) {
    console.log(
      `Status: ${event.status} - ${event.message} - ${JSON.stringify(event)}`,
    );
  }

  public handleError(event: IErrorEvent) {
    console.error(`Error: ${event.message} (Code: ${event.code})`);
  }

  public handleQuery(event: IPromptEvent) {
    console.error(
      `Error: ${event.message} (Code: ${JSON.stringify(event.metaData)})`,
    );
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

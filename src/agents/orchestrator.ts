import * as vscode from "vscode";
import { BaseAiAgent } from "./base";
import { IEventPayload } from "../emitter/interface";

export class Orchestrator implements vscode.Disposable {
  private static instance: Orchestrator;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(private readonly aiAgent: BaseAiAgent) {
    this.disposables.push(
      this.aiAgent.onStatusChange(this.handleStatus.bind(this)),
      this.aiAgent.onPrompt(this.handleQuery.bind(this)),
      this.aiAgent.onError(this.handleError.bind(this)),
    );
  }

  static getInstance(aiAgent: BaseAiAgent) {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator(aiAgent);
    }
    return Orchestrator.instance;
  }

  public handleStatus(event: IEventPayload) {
    this.aiAgent.emitEvent("onQuery", JSON.stringify(event));
    console.log(` ${event.message} - ${JSON.stringify(event)}`);
  }

  public handleQuery(event: IEventPayload) {
    this.aiAgent.run(event);
    console.error(`Error: ${event.message})`);
  }

  public handleError(event: IEventPayload) {
    console.error(`Error: ${event.message}`);
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

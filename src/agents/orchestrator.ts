import * as vscode from "vscode";
import { BaseAiAgent } from "./base";
import { IEventPayload } from "../emitter/interface";

export class Orchestrator extends BaseAiAgent implements vscode.Disposable {
  private static instance: Orchestrator;
  private readonly disposables: vscode.Disposable[] = [];

  constructor() {
    super();
    this.disposables.push(
      this.onStatusChange(this.handleStatus.bind(this)),
      this.onPrompt(this.handleQuery.bind(this)),
      this.onError(this.handleError.bind(this)),
    );
  }

  static getInstance() {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator();
    }
    return Orchestrator.instance;
  }

  public handleStatus(event: IEventPayload) {
    this.emitEvent("onQuery", JSON.stringify(event));
    console.log(` ${event.message} - ${JSON.stringify(event)}`);
  }

  public handleQuery(event: IEventPayload) {
    console.error(`Error: ${event.message})`);
  }

  public handleError(event: IEventPayload) {
    console.error(`Error: ${event.message}`);
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

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
      this.onPromptGenerated(this.handlePromptGeneratedEvent.bind(this)),
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
    console.log(` ${event.message} - ${JSON.stringify(event)}`);
  }

  public handlePromptGeneratedEvent(event: IEventPayload) {
    console.error(`Error: ${event.message})`);
    this.publish("onResponse", JSON.stringify(event));
  }

  public handleError(event: IEventPayload) {
    console.error(`Error: ${event.message}`);
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

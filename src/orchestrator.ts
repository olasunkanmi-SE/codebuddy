import * as vscode from "vscode";
import { IEventPayload } from "./emitter/interface";
import { EventEmitter } from "./emitter/publisher";

export class Orchestrator extends EventEmitter implements vscode.Disposable {
  private static instance: Orchestrator;
  private readonly disposables: vscode.Disposable[] = [];
  private isInitialized = false;

  constructor() {
    super();
    // Don't register listeners immediately - do it lazily
  }

  static getInstance() {
    if (!Orchestrator.instance) {
      Orchestrator.instance = new Orchestrator();
    }
    return Orchestrator.instance;
  }

  // Call this method to start the orchestrator and begin listening
  public start() {
    this.initializeIfNeeded();
  }

  // Initialize listeners only when needed
  private initializeIfNeeded() {
    if (this.isInitialized) {
      return;
    }

    this.disposables.push(
      this.onStatusChange(this.handleStatus.bind(this)),
      this.onPromptGenerated(this.handlePromptGeneratedEvent.bind(this)),
      // this.onError(this.handleError.bind(this)),
    );
    this.isInitialized = true;
  }

  public handleStatus(event: IEventPayload) {
    console.log(` ${event.message} - ${JSON.stringify(event)}`);
  }

  public handlePromptGeneratedEvent(event: IEventPayload) {
    console.error(`Error: ${event.message})`);
    this.publish("onResponse", event.message);
  }

  public dispose(): void {
    console.log("Orchestrator disposing...");
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
    this.isInitialized = false;

    // Clear singleton instance if needed
    if (Orchestrator.instance === this) {
      Orchestrator.instance = undefined as any;
    }
  }
}

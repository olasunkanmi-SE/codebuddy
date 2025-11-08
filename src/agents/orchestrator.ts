import * as vscode from "vscode";
import { IEventPayload } from "../emitter/interface";
import { EventEmitter } from "../emitter/publisher";

export class Orchestrator extends EventEmitter implements vscode.Disposable {
  private static instance: Orchestrator;
  private readonly disposables: vscode.Disposable[] = [];
  private isInitialized = false;

  constructor() {
    super();
    // Don't register listeners immediately - do it lazily
  }

  static getInstance() {
    return (Orchestrator.instance ??= new Orchestrator());
  }

  // Call this method to start the orchestrator and begin listening
  public start() {
    if (this.isInitialized) {
      this.logger.warn(
        "Orchestrator already started. Skipping initialization.",
      );
      return;
    }

    this.logger.info("Orchestrator starting initialization...");

    this.disposables.push(
      this.onStatusChange(this.handleStatus.bind(this)),
      this.onPromptGenerated(this.handlePromptGeneratedEvent.bind(this)),
      // Add other listeners as needed
      // this.onError(this.handleError.bind(this)),
    );

    // Register other VSCode-related disposables here if the orchestrator manages them
    // Example: this.disposables.push(vscode.commands.registerCommand(...));

    this.isInitialized = true;
    this.logger.info("Orchestrator initialization complete.");
  }

  public handleStatus(event: IEventPayload) {
    this.logger.info(` ${event.message} - ${JSON.stringify(event)}`);
  }

  public handlePromptGeneratedEvent(event: IEventPayload) {
    this.logger.info(`msg: ${event.message})`);
    this.publish("onResponse", event.message);
  }

  public dispose(): void {
    if (!this.isInitialized) {
      this.logger.info("Orchestrator is not initialized or already disposed.");
      return;
    }
    this.logger.info("Orchestrator disposing...");
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
    this.isInitialized = false;

    // Clear singleton instance if needed
    if (Orchestrator.instance === this) {
      Orchestrator.instance = undefined as any;
    }
  }
}

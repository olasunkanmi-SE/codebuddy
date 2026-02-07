import { IEventPayload } from "./emitter/interface";
import { EventEmitter } from "./emitter/publisher";
import { IDisposable } from "./interfaces/disposable";

export class Orchestrator extends EventEmitter implements IDisposable {
  private static instance: Orchestrator;
  private readonly disposables: IDisposable[] = [];
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
      this.onPromptGenerated(this.handlePromptGeneratedEvent.bind(this)),
    );
    this.isInitialized = true;
  }

  public handleStatus(event: IEventPayload) {
    console.log(` ${event.message} - ${JSON.stringify(event)}`);
  }

  public handlePromptGeneratedEvent(event: IEventPayload) {
    console.error(`Error: ${event.message})`);
    this.publish("onResponse", event.message ?? event);
  }

  public handleComplete(event: IEventPayload) {
    console.log(`✅ Complete: ${JSON.stringify(event.message)}`);
    // Can forward to webview or process further
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

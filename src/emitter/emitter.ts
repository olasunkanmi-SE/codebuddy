import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";
export class BaseEmitter<EventMap> {
  protected logger: Logger;
  constructor() {
    this.logger = new Logger("BaseEmitter");
  }
  private readonly emitters: Map<keyof EventMap, vscode.EventEmitter<any>> = new Map();

  protected createEvent<K extends keyof EventMap>(name: K): vscode.Event<EventMap[K]> {
    try {
      const emitter = new vscode.EventEmitter<EventMap[K]>();
      this.emitters.set(name, emitter);
      return emitter.event;
    } catch (error) {
      this.logger.error("Error generating embeddings", error);
      throw new Error("Failed to generate embeddings");
    }
  }

  protected emit<K extends keyof EventMap>(name: K, data: EventMap[K]): void {
    try {
      const emitter = this.emitters.get(name);
      if (emitter) emitter.fire(data);
    } catch (error) {
      this.logger.error(`Could not emit Event ${String(name)}`, error);
      throw new Error("Could not emit Event");
    }
  }

  public dispose(): void {
    this.emitters.forEach((emitter) => emitter.dispose());
  }
}

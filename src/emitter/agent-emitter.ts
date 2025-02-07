import * as vscode from "vscode";
import { BaseEmitter } from "./emitter";
import { EventState, IAgentEventMap, IEventPayload } from "./interface";

export class AgentEventEmitter extends BaseEmitter<IAgentEventMap> {
  onStatusChange: vscode.Event<IEventPayload> = this.createEvent("onStatus");
  onError: vscode.Event<IEventPayload> = this.createEvent("onError");
  onUpdate: vscode.Event<IEventPayload> = this.createEvent("onUpdate");
  onPrompt: vscode.Event<IEventPayload> = this.createEvent("onQuery");

  /**
   * Emits a generic event with specified status, message, and optional data.
   *
   * @template T The type of the optional data.
   * @param {string} eventName The name of the event to emit.
   * @param {EventState} status The status of the event.
   * @param {string} message The message associated with the event (optional).
   * @param {T} data Optional data to include in the event payload.
   */
  emitEvent(eventName: keyof IAgentEventMap, message?: string, data?: any) {
    const payload: IEventPayload = {
      type: eventName,
      message,
      timestamp: new Date().toISOString(),
      data,
    };
    this.emit(eventName, payload);
  }

  public dispose(): void {
    super.dispose();
  }
}

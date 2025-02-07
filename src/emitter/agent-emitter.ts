import { BaseEmitter } from "./emitter";
import {
  EventState,
  IAgentEventMap,
  IErrorEvent,
  IPromptEvent,
  IStatusEvent,
} from "./interface";
import * as vscode from "vscode";

export class AgentEventEmitter extends BaseEmitter<IAgentEventMap> {
  onStatusChange: vscode.Event<IStatusEvent> = this.createEvent("onStatus");
  onError: vscode.Event<IErrorEvent> = this.createEvent("onError");
  onQuery: vscode.Event<IPromptEvent> = this.createEvent("onPrompt");

  protected emitError(message: string, code: string) {
    this.emit("onError", {
      type: "error",
      message,
      code,
      timestamp: new Date().toISOString(),
    });
  }

  protected emitStatus(status: EventState, message: string) {
    this.emit("onStatus", {
      type: "status",
      status,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  protected onPrompt(status: EventState, message: string) {
    this.emit("onPrompt", {
      type: "prompt",
      status,
      message,
      metaData: { tags: [] },
      timestamp: new Date().toISOString(),
    });
  }

  public dispose(): void {
    super.dispose();
  }
}

import { BaseEmitter } from "./emitter";
import {
  EventState,
  IAgentEventMap,
  IErrorEvent,
  IStatusEvent,
} from "./interface";
import * as vscode from "vscode";

export class AgentEventEmitter extends BaseEmitter<IAgentEventMap> {
  onStatus: vscode.Event<IStatusEvent> = this.createEvent("onStatus");
  onError: vscode.Event<IErrorEvent> = this.createEvent("onError");

  public emitError(message: string, code: string) {
    this.emit("onError", {
      type: "error",
      message,
      code,
      timestamp: Date.now(),
    });
  }

  public emitStatus(state: EventState, message: string) {
    this.emit("onStatus", {
      type: "status",
      state,
      message,
      timestamp: Date.now(),
    });
  }
}

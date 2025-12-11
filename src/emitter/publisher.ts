import * as vscode from "vscode";
import { BaseEmitter } from "./base";
import { IAgentEventMap, IEventPayload } from "./interface";

export class EventEmitter extends BaseEmitter<Record<string, IEventPayload>> {
  onStatusChange: vscode.Event<IEventPayload> = this.createEvent("onStatus");
  onError: vscode.Event<IEventPayload> = this.createEvent("onError");
  onUpdate: vscode.Event<IEventPayload> = this.createEvent("onUpdate");
  onPromptGenerated: vscode.Event<IEventPayload> = this.createEvent("onQuery");
  onThinking: vscode.Event<IEventPayload> = this.createEvent("onThinking");
  onResponse: vscode.Event<IEventPayload> = this.createEvent("onResponse");
  onSecretChange: vscode.Event<IEventPayload> =
    this.createEvent("onSecretChange");
  onFileUpload: vscode.Event<IEventPayload> = this.createEvent("onFileUpload");
  onActiveworkspaceUpdate: vscode.Event<IEventPayload> = this.createEvent(
    "onActiveworkspaceUpdate",
  );
  onStrategizing: vscode.Event<IEventPayload> =
    this.createEvent("onStrategizing");
  onModelChange: vscode.Event<IEventPayload> =
    this.createEvent("onModelChange");
  onConfigurationChange: vscode.Event<IEventPayload> = this.createEvent(
    "onConfigurationChange",
  );
  onUserPrompt: vscode.Event<IEventPayload> = this.createEvent("onUserPrompt");
  onClearHistory: vscode.Event<IEventPayload> =
    this.createEvent("onClearHistory");
  onInlineChat: vscode.Event<IEventPayload> = this.createEvent("onInlineChat");
  onUpdateUserPreferences: vscode.Event<IEventPayload> = this.createEvent(
    "onUpdateUserPreferences",
  );
  onGetUserPreferences: vscode.Event<IEventPayload> = this.createEvent(
    "onGetUserPreferences",
  );
  onUpdateThemePreferences: vscode.Event<IEventPayload> = this.createEvent(
    "onUpdateThemePreferences",
  );

  // NEW: Streaming events
  onPlanStep: vscode.Event<IEventPayload> = this.createEvent("onPlanStep");
  onToolCall: vscode.Event<IEventPayload> = this.createEvent("onToolCall");
  onContentDelta: vscode.Event<IEventPayload> =
    this.createEvent("onContentDelta");
  onComplete: vscode.Event<IEventPayload> = this.createEvent("onComplete");
  onStreamStart: vscode.Event<IEventPayload> =
    this.createEvent("onStreamStart");
  onStreamChunk: vscode.Event<IEventPayload> =
    this.createEvent("onStreamChunk");
  onStreamEnd: vscode.Event<IEventPayload> = this.createEvent("onStreamEnd");
  onStreamError: vscode.Event<IEventPayload> =
    this.createEvent("onStreamError");
  onStreamFlush: vscode.Event<IEventPayload> =
    this.createEvent("onStreamFlush");
  onModelChangeSuccess: vscode.Event<IEventPayload> = this.createEvent(
    "onModelChangeSuccess",
  );

  /**
   * Emits a generic event with specified status, message, and optional data.
   *
   * @template T The type of the optional data.
   * @param {string} eventName The name of the event to emit.
   * @param {any} message The message associated with the event (can be string or object).

   */

  publish(eventName: keyof IAgentEventMap, message?: any, data?: any) {
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

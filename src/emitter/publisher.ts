import { BaseEmitter } from "./base";
import { IAgentEventMap, IEventPayload } from "./interface";
import { IEvent } from "../interfaces/events";

export class EventEmitter extends BaseEmitter<Record<string, IEventPayload>> {
  onStatusChange: IEvent<IEventPayload> = this.createEvent("onStatus");
  onError: IEvent<IEventPayload> = this.createEvent("onError");
  onUpdate: IEvent<IEventPayload> = this.createEvent("onUpdate");
  onPromptGenerated: IEvent<IEventPayload> = this.createEvent("onQuery");
  onThinking: IEvent<IEventPayload> = this.createEvent("onThinking");
  onThinkingStart: IEvent<IEventPayload> = this.createEvent("onThinkingStart");
  onThinkingUpdate: IEvent<IEventPayload> =
    this.createEvent("onThinkingUpdate");
  onThinkingEnd: IEvent<IEventPayload> = this.createEvent("onThinkingEnd");
  onResponse: IEvent<IEventPayload> = this.createEvent("onResponse");
  onSecretChange: IEvent<IEventPayload> = this.createEvent("onSecretChange");
  onFileUpload: IEvent<IEventPayload> = this.createEvent("onFileUpload");
  onActiveworkspaceUpdate: IEvent<IEventPayload> = this.createEvent(
    "onActiveworkspaceUpdate",
  );
  onStrategizing: IEvent<IEventPayload> = this.createEvent("onStrategizing");
  onModelChange: IEvent<IEventPayload> = this.createEvent("onModelChange");
  onConfigurationChange: IEvent<IEventPayload> = this.createEvent(
    "onConfigurationChange",
  );
  onUserPrompt: IEvent<IEventPayload> = this.createEvent("onUserPrompt");
  onClearHistory: IEvent<IEventPayload> = this.createEvent("onClearHistory");
  onInlineChat: IEvent<IEventPayload> = this.createEvent("onInlineChat");
  onUpdateUserPreferences: IEvent<IEventPayload> = this.createEvent(
    "onUpdateUserPreferences",
  );
  onGetUserPreferences: IEvent<IEventPayload> = this.createEvent(
    "onGetUserPreferences",
  );
  onUpdateThemePreferences: IEvent<IEventPayload> = this.createEvent(
    "onUpdateThemePreferences",
  );

  // NEW: Streaming events
  onPlanStep: IEvent<IEventPayload> = this.createEvent("onPlanStep");
  onToolCall: IEvent<IEventPayload> = this.createEvent("onToolCall");
  onContentDelta: IEvent<IEventPayload> = this.createEvent("onContentDelta");
  onComplete: IEvent<IEventPayload> = this.createEvent("onComplete");
  onStreamStart: IEvent<IEventPayload> = this.createEvent("onStreamStart");
  onStreamChunk: IEvent<IEventPayload> = this.createEvent("onStreamChunk");
  onStreamEnd: IEvent<IEventPayload> = this.createEvent("onStreamEnd");
  onStreamError: IEvent<IEventPayload> = this.createEvent("onStreamError");
  onStreamFlush: IEvent<IEventPayload> = this.createEvent("onStreamFlush");
  onStreamMetadata: IEvent<IEventPayload> = this.createEvent("streamMetadata");
  onModelChangeSuccess: IEvent<IEventPayload> = this.createEvent(
    "onModelChangeSuccess",
  );

  // Tool activity events for real-time feedback
  onToolStart: IEvent<IEventPayload> = this.createEvent("onToolStart");
  onToolEnd: IEvent<IEventPayload> = this.createEvent("onToolEnd");
  onToolProgress: IEvent<IEventPayload> = this.createEvent("onToolProgress");
  onPlanning: IEvent<IEventPayload> = this.createEvent("onPlanning");
  onSummarizing: IEvent<IEventPayload> = this.createEvent("onSummarizing");

  // New detailed activity events for streaming every decision/action
  onDecision: IEvent<IEventPayload> = this.createEvent("onDecision");
  onReading: IEvent<IEventPayload> = this.createEvent("onReading");
  onSearching: IEvent<IEventPayload> = this.createEvent("onSearching");
  onReviewing: IEvent<IEventPayload> = this.createEvent("onReviewing");
  onAnalyzing: IEvent<IEventPayload> = this.createEvent("onAnalyzing");
  onExecuting: IEvent<IEventPayload> = this.createEvent("onExecuting");
  onWorking: IEvent<IEventPayload> = this.createEvent("onWorking");

  // Diff review events for file change tracking
  onPendingChange: IEvent<IEventPayload> = this.createEvent("onPendingChange");
  onChangeApplied: IEvent<IEventPayload> = this.createEvent("onChangeApplied");
  onChangeRejected: IEvent<IEventPayload> =
    this.createEvent("onChangeRejected");

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

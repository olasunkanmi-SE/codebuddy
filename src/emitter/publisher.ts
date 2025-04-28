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
  onBootstrap: vscode.Event<IEventPayload> = this.createEvent("onBootstrap");
  onFileUpload: vscode.Event<IEventPayload> = this.createEvent("onFileUpload");
  onFileProcessSuccess: vscode.Event<IEventPayload> = this.createEvent(
    "onFileProcessSuccess",
  );
  onActiveworkspaceUpdate: vscode.Event<IEventPayload> = this.createEvent(
    "onActiveworkspaceUpdate",
  );
  onFilesRetrieved: vscode.Event<IEventPayload> =
    this.createEvent("onFilesRetrieved");
  onStrategizing: vscode.Event<IEventPayload> =
    this.createEvent("onStrategizing");
  onModelChange: vscode.Event<IEventPayload> =
    this.createEvent("onModelChange");
  onModelChangeSuccess: vscode.Event<IEventPayload> = this.createEvent(
    "onModelChangeSuccess",
  );
  onHistoryUpdated: vscode.Event<IEventPayload> =
    this.createEvent("onHistoryUpdated");
  onConfigurationChange: vscode.Event<IEventPayload> = this.createEvent(
    "onConfigurationChange",
  );
  onFileCreated: vscode.Event<IEventPayload> =
    this.createEvent("onFileCreated");
  onTextChange: vscode.Event<IEventPayload> = this.createEvent("onTextChange");
  OnSaveText: vscode.Event<IEventPayload> = this.createEvent("OnSaveText");
  onFileRenamed: vscode.Event<IEventPayload> =
    this.createEvent("onFileRenamed");
  onFileDeleted: vscode.Event<IEventPayload> =
    this.createEvent("onFileDeleted");
  onUserPrompt: vscode.Event<IEventPayload> = this.createEvent("onUserPrompt");
  onClearHistory: vscode.Event<IEventPayload> =
    this.createEvent("onClearHistory");
  onCommenting: vscode.Event<IEventPayload> = this.createEvent("onCommenting");
  onReviewing: vscode.Event<IEventPayload> = this.createEvent("onReviewing");
  onRefactoring: vscode.Event<IEventPayload> =
    this.createEvent("onRefactoring");
  onOptimizing: vscode.Event<IEventPayload> = this.createEvent("onOptimizing");
  onInterviewMe: vscode.Event<IEventPayload> =
    this.createEvent("onInterviewMe");
  onFix: vscode.Event<IEventPayload> = this.createEvent("onFix");
  onExplain: vscode.Event<IEventPayload> = this.createEvent("onExplain");
  onCommitMessage: vscode.Event<IEventPayload> =
    this.createEvent("onCommitMessage");
  generateMermaidDiagram: vscode.Event<IEventPayload> = this.createEvent(
    "generateMermaidDiagram",
  );
  onInlineChat: vscode.Event<IEventPayload> = this.createEvent("onInlineChat");
  onUpdateUserPreferences: vscode.Event<IEventPayload> = this.createEvent(
    "onUpdateUserPreferences",
  );
  onGetUserPreferences: vscode.Event<IEventPayload> = this.createEvent(
    "onGetUserPreferences",
  );

  /**
   * Emits a generic event with specified status, message, and optional data.
   *
   * @template T The type of the optional data.
   * @param {string} eventName The name of the event to emit.
   * @param {string} message The message associated with the event (optional).

   */
  publish(eventName: keyof IAgentEventMap, message?: string, data?: any) {
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

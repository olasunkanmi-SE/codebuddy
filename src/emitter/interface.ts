type AgentEventKeys =
  | "onStatus"
  | "onError"
  | "onUpdate"
  | "onQuery"
  | "onResponse"
  | "onThinking"
  | "onSecretChange"
  | "onBootstrap"
  | "onActiveworkspaceUpdate"
  | "onFileUpload"
  | "onFileProcessSuccess"
  | "onFilesRetrieved"
  | "onStrategizing"
  | "onModelChange"
  | "onModelChangeSuccess"
  | "onHistoryUpdated"
  | "onConfigurationChange"
  | "onFileCreated"
  | "onTextChange"
  | "OnSaveText"
  | "onFileRenamed"
  | "onFileDeleted"
  | "onUserPrompt"
  | "onClearHistory"
  | "onOptimizing"
  | "onInterviewMe"
  | "onFix"
  | "onExplain"
  | "onCommitMessage"
  | "generateMermaidDiagram"
  | "onInlineChat"
  | "onCommenting"
  | "onReviewing"
  | "onRefactoring"
  | "onUpdateUserPreferences"
  | "onGetUserPreferences";
export type IAgentEventMap = Record<AgentEventKeys, IEventPayload>;

export interface IEventPayload {
  type: string;
  message?: any;
  timestamp: string;
  data?: any;
}

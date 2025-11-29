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
  | "onTextChange"
  | "onUserPrompt"
  | "onClearHistory"
  | "onOptimizing"
  | "onInterviewMe"
  | "onFix"
  | "onExplain"
  | "onCommitMessage"
  | "onGenerateMermaidDiagram"
  | "onInlineChat"
  | "onCommenting"
  | "onReviewing"
  | "onRefactoring"
  | "onUpdateUserPreferences"
  | "onGetUserPreferences"
  | "onUpdateThemePreferences"
  | "streamStart"
  | "streamFlush"
  | "streamEnd"
  | "streamError";
export type IAgentEventMap = Record<AgentEventKeys, IEventPayload>;

export interface IEventPayload {
  type: string;
  message?: any;
  timestamp: string;
  data?: any;
}

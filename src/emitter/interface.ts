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
  | "onStreamStart"
  | "onStreamChunk"
  | "onStreamEnd"
  | "onStreamError"
  | "onStreamFlush"
  | "onToolStart"
  | "onToolEnd"
  | "onToolProgress"
  | "onPlanning"
  | "onSummarizing";
export type IAgentEventMap = Record<AgentEventKeys, IEventPayload>;

export interface IEventPayload {
  type: string;
  message?: any;
  timestamp: string;
  data?: any;
  requestId?: string;
  threadId?: string;
  content?: string;
  accumulated?: string;
  metadata?: Record<string, any>;
  error?: string;
}

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
  | "onHistoryUpdated";

export type IAgentEventMap = Record<AgentEventKeys, IEventPayload>;

export interface IEventPayload {
  type: string;
  message?: any;
  timestamp: string;
  data?: any;
}

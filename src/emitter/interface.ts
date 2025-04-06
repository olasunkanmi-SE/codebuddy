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
  | "onStrategizing";

export type IAgentEventMap = Record<AgentEventKeys, IEventPayload>;

export interface IEventPayload {
  type: string;
  message?: string;
  timestamp: string;
  data?: any;
}

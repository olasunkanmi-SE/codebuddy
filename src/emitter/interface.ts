interface IBaseEmitter {
  timestamp: string;
}

export type Action = "query" | "update" | "status" | "error";
export type EventState =
  | "idle"
  | "processing"
  | "completed"
  | "ui-update"
  | "error"
  | "query";

export interface IAgentEventMap {
  onStatus: IEventPayload;
  onError: IEventPayload;
  onUpdate: IEventPayload;
  onQuery: IEventPayload;
}

export interface IEventPayload {
  type: string;
  message?: string;
  timestamp: string;
  data?: any;
}

interface IBaseEmitter {
  timestamp: string;
}

export interface IErrorEvent extends IBaseEmitter {
  type: "error";
  message: string;
  code: string;
}

export interface IStatusEvent extends IBaseEmitter {
  type: "status";
  status: EventState;
  message: string;
}

export interface IPromptEvent extends IBaseEmitter {
  type: "prompt";
  status: EventState;
  message: string;
  metaData: Record<string, unknown>;
}

export type EventState = "idle" | "processing" | "completed" | "query";

export interface IAgentEventMap {
  onStatus: IStatusEvent;
  onError: IErrorEvent;
  onPrompt: IPromptEvent;
}

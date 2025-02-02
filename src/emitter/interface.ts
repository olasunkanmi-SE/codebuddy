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
  state: EventState;
  message: string;
}

export type EventState = "idle" | "processing" | "completed";

export interface IAgentEventMap {
  onStatus: IStatusEvent;
  onError: IErrorEvent;
}

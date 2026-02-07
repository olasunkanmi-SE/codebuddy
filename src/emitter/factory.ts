import { IEventEmitter } from "../interfaces/events";
import { NodeEventEmitter } from "./node-emitter";
import { EditorHostService } from "../services/editor-host.service";

export function createEventEmitter<T>(): IEventEmitter<T> {
  try {
    return EditorHostService.getInstance().getHost().createEventEmitter<T>();
  } catch (e) {
    // Fallback if EditorHost is not initialized yet or fails
    // This allows usage in contexts where EditorHost might not be ready (e.g. unit tests or very early init)
    return new NodeEventEmitter<T>();
  }
}

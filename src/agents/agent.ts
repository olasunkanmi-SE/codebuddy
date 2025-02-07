import { IEventPayload } from "../emitter/interface";
import { BaseAiAgent } from "./base";

export class CodeBuddyAgent extends BaseAiAgent {
  constructor() {
    super();
  }

  run(event: IEventPayload): any {
    console.log(event);
  }
}

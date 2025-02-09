import { ICodeBuddyToolConfig } from "../application/interfaces/agent.interface";

export abstract class CodeBuddyTool {
  constructor(public readonly config: ICodeBuddyToolConfig) {}

  abstract execute(query: string): any;
}

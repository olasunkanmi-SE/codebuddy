import { formatText } from "../utils";
import { EventGenerator } from "./event-generator";
import * as vscode from "vscode";

export class Comments extends EventGenerator {
  selectedCode: string | undefined;
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt() {
    const PROMPT = `
        A good code review comment describes the intent behind the code without
        repeating information that's obvious from the code itself. Good comments
        describe "why", explain any "magic" values and non-obvious behaviour.
        Respond based on the programming language of the requested code. Unless stated otherwise.
        Note: Only add function level comments. Do not write comment in between the code.
        Be creative in crafting your comment, but be careful not unnecessary comments.
`;
    return PROMPT;
  }

  formatResponse(comment: string): string {
    return formatText(comment);
  }

  createPrompt(selectedCode: string): string {
    const prompt = this.generatePrompt();
    const fullPrompt = `${prompt} \n ${selectedCode}`;
    return fullPrompt;
  }
}

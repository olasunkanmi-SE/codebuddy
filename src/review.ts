import * as vscode from "vscode";
import { EventGenerator } from "./event-generator";

export class ReviewCode extends EventGenerator {
  constructor(action: string) {
    super(action);
  }

  generatePrompt() {
    const CODE_LABEL = "Here is the code:";
    const REVIEW_LABEL = "Here is the review:";
    const PROMPT = `
          Reviewing code involves finding bugs and increasing code quality. Examples of bugs are syntax 
          errors or typos, out of memory errors, and boundary value errors. Increasing code quality 
          entails reducing complexity of code, eliminating duplicate code, and ensuring other developers 
          are able to understand the code. 
          ${CODE_LABEL}
          for i in x:
              pint(f"Iteration {i} provides this {x**2}.")
          ${REVIEW_LABEL}
          The command \`print\` is spelled incorrectly.
          ${CODE_LABEL}
          height = [1, 2, 3, 4, 5]
          w = [6, 7, 8, 9, 10]
          ${REVIEW_LABEL}
          The variable name \`w\` seems vague. Did you mean \`width\` or \`weight\`?
          ${CODE_LABEL}
          while i < 0:
            thrice = i * 3
            thrice = i * 3
            twice = i * 2
          ${REVIEW_LABEL}
          There are duplicate lines of code in this control structure.
`;
    return PROMPT;
  }

  formatResponse(comment: string): string | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      console.debug("Abandon: no open text editor.");
      return;
    }
    let trimmed = "";
    let padding = "";
    const commentPrefix = " * ";
    const commentStart = "/**\n";
    const commentEnd = " */\n";
    const selectedCode = this.getSelectedWindowArea();
    if (selectedCode) {
      trimmed = selectedCode.trimStart();
      padding = selectedCode.substring(0, selectedCode.length - trimmed.length);
    }

    let comments: string = comment
      .split("\n")
      .map((line: string) => `${padding}${commentPrefix}${line}`)
      .join("\n");

    comments = `${padding}${commentStart}${comments}\n${padding}${commentEnd}`;
    return comments;
  }

  createPrompt(selectedCode: string): string {
    const prompt = this.generatePrompt();
    const fullPrompt = `${prompt} \n ${selectedCode}`;
    return fullPrompt;
  }
}

import { formatText } from "../utils/utils";
import { EventGenerator } from "./event-generator";
import * as vscode from "vscode";

export class InterviewMe extends EventGenerator {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt(selectedCode: string) {
    const PROMPT = `
    You are an expert in the programming language and framework used in the provided code snippet.
    Use the selected code as a context into understanding whats happening in the code, relate it to software
    engineering, and ask question on that branch of software engineering.
    Briefly introduce the concept and provide any necessary background information
    Please provide a list of questions that can be used to evaluate a candidate's knowledge and skills based on the provided code snippet.
    The questions should cover topics such as:
    - Code design and architecture
    - Performance and optimization
    - Error handling and debugging
    - Security and best practices
    - Code readability and maintainability

    Follow up with answers to your questions.

    QUESTION -> ${selectedCode}
`;
    return PROMPT;
  }

  formatResponse(comment: string): string {
    return formatText(comment);
  }

  createPrompt(selectedCode: string): string {
    const prompt = this.generatePrompt(selectedCode);
    return prompt;
  }
}

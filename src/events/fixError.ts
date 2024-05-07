import { formatText } from "../utils";
import { EventGenerator } from "./event-generator";
import * as vscode from "vscode";

export class FixError extends EventGenerator {
  constructor(action: string, context: vscode.ExtensionContext, error: string) {
    super(action, context, error);
  }

  generatePrompt() {
    const PROMPT = `
        As an AI-powered code assistant, your task is to identify and fix errors within the provided code block. Analyze the code, detect any issues, and provide corrected code along with explanations for the fixes. Consider the following:
        Identify syntax errors, logical errors, or potential runtime errors in the code.
        Provide a corrected version of the code that resolves the identified issues.
        Offer alternative solutions or best practices, if applicable, to improve the code's efficiency, readability, or maintainability.
        Respond based on the programming language of the requested code. Unless stated otherwise
        Error Message: {errorMessage}
        Once you detect the function where the error is coming from, your response should return only the function affected with your fix and afore mentioned actions
`;
    return PROMPT.replace("{errorMessage}", this.error ?? "");
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

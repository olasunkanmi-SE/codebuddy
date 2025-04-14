import { formatText } from "../utils/utils";
import { CodeCommandHandler } from "./hander";
import * as vscode from "vscode";

export class GenerateUnitTest extends CodeCommandHandler {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt(selectedCode: string) {
    const PROMPT = `
    Task: Generate comprehensive unit tests for the following code snippet. Ensure the tests cover:
    Functionality: Basic functionality of each function or method.
    Edge Cases: Test boundary conditions, extreme inputs, and unusual scenarios.
    Error Handling: Verify that exceptions are thrown where expected.
    Performance: If applicable, include tests for time complexity or resource usage.
    Framework: Use appropriate testing framework for the language.
    Write tests in the same language as the code snippet.
    Each test should be self-contained and follow the [language's standard testing conventions].
    Include comments explaining what each test case checks.
    Output Format:
    Provide the test code directly without additional explanations outside of comments in the test code itself.
    ${selectedCode}
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

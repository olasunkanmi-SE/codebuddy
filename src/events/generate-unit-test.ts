import { formatText } from "../utils";
import { EventGenerator } from "./event-generator";
import * as vscode from "vscode";

export class GenerateUnitTest extends EventGenerator {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt(selectedCode: string) {
    const PROMPT = `
      Generate a comprehensive set of unit tests for the provided code block using [testing framework, e.g., Jest, Mocha, etc.]. The tests should cover various scenarios, including successful executions, error handling, and edge cases.
      Requirements:
      Use [testing framework] as the testing framework
      Write tests for each method/function of the provided code block
      Test successful executions with valid inputs and expected outputs
      Test error handling for invalid inputs, edge cases, and unexpected errors
      Use mock implementations for dependencies, if applicable
      Use descriptive test names and assertions to ensure clarity and readability
      Code Block: ${selectedCode}
      Output: Generate a set of unit tests that meet the requirements above. 
      The output should be a test file with multiple test suites, each covering a specific method/function of the provided code block. 
      The tests should be written in selected code language and use [Jest, Mocha, etc.]'s API for assertions and mocking.
      Note: Please ensure that the generated tests are well-structured, readable, and maintainable. Also, provide explanations and justifications for the generated tests to help understand the reasoning behind the test cases.
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

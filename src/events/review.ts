import { formatText } from "../utils";
import * as vscode from "vscode";
import { EventGenerator } from "./event-generator";

export class ReviewCode extends EventGenerator {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt() {
    const PROMPT = `
    You are tasked with giving exhausting review of a piece of code submitted by a developer. The code is designed to perform a specific task or function within a software application. Your objective is to analyze the code for potential errors, inefficiencies, and adherence to best coding practices. Provide feedback on the clarity, readability, and maintainability of the code. Highlight any areas where improvements can be made to enhance performance, optimize resource usage, or ensure better scalability. Your review should aim to assist the developer in producing clean, robust, and efficient code that meets the project requirements and industry standards.
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

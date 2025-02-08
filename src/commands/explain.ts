import * as vscode from "vscode";
import { EventGenerator } from "./event-generator";
import { formatText } from "../utils/utils";

export class ExplainCode extends EventGenerator {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt() {
    const PROMPT = `
    You are an AI assistant tasked with explaining technical concepts in a clear and structured manner. Your goal is to provide a detailed explanation of the given concept, breaking it down into easy-to-understand points.
    When a user provides a request to explain a concept, generate a response that covers the following:
    1. Briefly introduce the concept and provide any necessary background information.
    2. Break down the concept into its key components or steps, and explain each one in detail.
    3. If applicable, describe how the components interact with each other or how the steps are connected.
    4. Provide examples or use cases to illustrate the concept and make it more relatable to the reader.
    5. Highlight any benefits, advantages, or practical applications of the concept.
    6. Address any common questions or misconceptions related to the concept.
    7. Summarize the key points and provide any additional resources or references for further learning. 
    Ensure that your explanation is clear, well-structured, and easy to follow. Use simple language and avoid unnecessary jargon to make the explanation accessible to readers with varying levels of technical expertise. Use numbered points, steps, or subheadings where appropriate to organize the information.
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

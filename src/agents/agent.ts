import { GenerativeModel } from "@google/generative-ai";
import * as vscode from "vscode";
import {
  LLMs,
  ProcessInputResult,
} from "../application/interfaces/agent.interface";
import { createPrompt } from "../utils/prompt";
import { BaseAiAgent } from "./base";

export class CodeBuddyAgent extends BaseAiAgent {
  constructor() {
    super();
  }

  run(
    input: string,
    model: LLMs,
    metaData?: Record<string, any>,
  ): Promise<Partial<ProcessInputResult | undefined>> {
    const result = this.processInput(input, model, metaData);
    return result;
  }

  async processInput(
    userInput: string,
    model: LLMs,
    metaData?: Record<string, any>,
  ): Promise<Partial<ProcessInputResult | undefined>> {
    try {
      let response;
      // TODO generateContent should move to the BaseAiAgent
      if (model instanceof GenerativeModel) {
        response = await this.gemini(userInput, model, metaData);
      }
      return response;
    } catch (error) {
      vscode.window.showErrorMessage("Error processing user query");
      this.logger.error(
        "Error generating, queries, thoughts from user query",
        error,
      );
      throw error;
    }
  }
}

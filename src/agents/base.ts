import * as vscode from "vscode";
import { AgentEventEmitter } from "../emitter/agent-emitter";
import {
  LLMs,
  ProcessInputResult,
} from "../application/interfaces/agent.interface";
import { GenerateContentResult, GenerativeModel } from "@google/generative-ai";
import { createPrompt } from "../utils/prompt";

export abstract class BaseAiAgent
  extends AgentEventEmitter
  implements vscode.Disposable
{
  constructor() {
    super();
  }

  abstract run(input: string, model: LLMs, metaData?: Record<string, any>): any;

  public dispose(): void {
    this.dispose();
  }

  parseResponse(input: string): {
    queries: string[] | undefined;
    thought: string | undefined;
  } {
    return {
      queries: this.extractQueries(input),
      thought: this.extractThought(input),
    };
  }

  extractQueries(input: string): string[] | undefined {
    const startIndex = input.indexOf("Queries: [");
    if (startIndex === -1) {
      return;
    }

    const endIndex = input.indexOf("]", startIndex);
    if (endIndex === -1) {
      return;
    }

    const queriesString = input.substring(startIndex + 10, endIndex);
    const queriesArray = queriesString
      .split(",")
      .map((item) => item.trim().replace(/"/g, ""));
    return queriesArray;
  }

  extractThought(input: string): string | undefined {
    const match = RegExp(/Thought:\s*(.*?)\n/).exec(input);
    if (match) {
      return match[1].trim();
    } else {
      return;
    }
  }

  async gemini(
    userInput: string,
    model: LLMs,
    metaData?: Record<string, any>,
  ): Promise<Partial<ProcessInputResult>> {
    try {
      const prompt = createPrompt(userInput);
      // TODO generateContent should move to the BaseAiAgent
      if (!(model instanceof GenerativeModel)) {
        throw new Error("Model is not an instance of GenerativeModel");
      }
      const generateContentResponse: GenerateContentResult =
        await model.generateContent(prompt);
      const { text, usageMetadata } = generateContentResponse.response;
      const parsedResponse = this.parseResponse(text());
      const extractedQueries = parsedResponse.queries;
      const extractedThought = parsedResponse.thought;
      const tokenCount = usageMetadata?.totalTokenCount ?? 0;
      return {
        queries: extractedQueries,
        tokens: tokenCount,
        prompt: userInput,
        thought: extractedThought,
      };
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

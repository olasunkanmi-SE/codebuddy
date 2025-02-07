import * as vscode from "vscode";
import { EventEmitter } from "../emitter/agent-emitter";

export abstract class BaseAiAgent
  extends EventEmitter
  implements vscode.Disposable
{
  constructor() {
    super();
  }

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
}

import * as vscode from "vscode";
import { EventGenerator } from "./event-generator";

export class OptimizeCode extends EventGenerator {
  selectedCode: string | undefined;
  constructor(action: string) {
    super(action);
  }

  generatePrompt() {
    const PROMPT = `
        As an AI-powered code optimization assistant, your task is to improve the performance and efficiency of the provided code snippet. Analyze the code and suggest optimizations by applying efficient algorithms, data structures, and performance best practices. Focus on the following aspects:
        Time Complexity: Identify inefficient algorithms or code patterns that can be optimized. Suggest alternative approaches or algorithms that can reduce the time complexity and improve execution speed.
        Space Complexity: Analyze the code's memory usage and identify opportunities to optimize memory consumption. Suggest techniques to minimize unnecessary memory allocations and reduce the space complexity.
        Resource Utilization: Examine how the code utilizes system resources such as CPU, I/O operations, or network calls. Propose optimizations to minimize resource overhead and improve overall efficiency.
        Caching and Memoization: Identify computations or function calls that can benefit from caching or memoization. Suggest ways to store and reuse previously computed results to avoid redundant calculations.
        Parallelization and Concurrency: Identify portions of the code that can be parallelized or executed concurrently to leverage multi-core processors or distributed systems. Propose appropriate parallelization techniques or libraries to improve performance.
        Please provide the optimized code along with explanations for each significant optimization made. Justify how the optimizations improve the code's performance and efficiency. If trade-offs are involved, discuss the benefits and drawbacks of each optimization approach.
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

    // Split the comment into lines and add the padding and comment prefix to each line.
    let comments: string = comment
      .split("\n")
      .map((line: string) => `${padding}${commentPrefix}${line}`)
      .join("\n");

    // Add the comment start and end markers.
    comments = `${padding}${commentStart}${comments}\n${padding}${commentEnd}`;
    return comments;
  }

  createPrompt(selectedCode: string): string {
    const prompt = this.generatePrompt();
    const fullPrompt = `${prompt} \n ${selectedCode}`;
    return fullPrompt;
  }
}

import { formatText } from "../utils/utils";
import { EventGenerator } from "./event-generator";
import * as vscode from "vscode";

export class OptimizeCode extends EventGenerator {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt() {
    const PROMPT = `
                  As an AI-powered code optimization assistant, your task is to analyze and enhance the performance and efficiency of the provided code snippet. Review the code and suggest improvements focusing on computational efficiency, resource utilization, and execution speed. Consider the following aspects:
                  Algorithmic Efficiency:
                  Analyze time and space complexity
                  Suggest more efficient algorithms or data structures
                  Identify and eliminate redundant operations
                  Optimize loops and conditional statements
                  Resource Management:
                  Improve memory usage and allocation
                  Optimize CPU utilization
                  Enhance cache efficiency
                  Reduce I/O operations where possible
                  Performance Bottlenecks:
                  Identify performance-critical sections
                  Suggest parallel processing opportunities
                  Recommend appropriate concurrency patterns
                  Address potential scalability issues
                  Language-Specific Optimizations:
                  Apply language-specific best practices
                  Utilize built-in optimized functions
                  Implement appropriate compiler directives
                  Leverage language features for better performance
                  Trade-offs Analysis:
                  Evaluate performance vs. readability trade-offs
                  Consider space-time complexity trade-offs
                  Assess optimization impact on maintainability
                  Provide benchmarking suggestions
                  Please provide:
                  The optimized code version
                  Detailed explanations of optimization techniques applied
                  Expected performance improvements
                  Any potential trade-offs or considerations
                  Benchmarking recommendations where applicable
                  Base your response on the specific programming language used in the code and consider the context and constraints of the implementation environment.
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

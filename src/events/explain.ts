import * as vscode from "vscode";
import { EventGenerator } from "./event-generator";
import { formatText } from "../utils";

export class ExplainCode extends EventGenerator {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt() {
    const PROMPT = `
        As an AI-powered code explanation assistant, your task is to provide clear and concise explanations of the given code snippet. Break down the code into logical sections and explain the purpose and functionality of each part. Focus on the following aspects: 1. Code Structure: Describe the overall structure of the code, including any classes, functions, or modules. Explain how the code is organized and how different components interact with each other. 2. Algorithm and Logic: Identify the main algorithms or logical steps used in the code. Explain the underlying concepts, principles, or problem-solving approaches applied. Provide insights into why certain algorithms or techniques were chosen. 3. Data Structures: Identify the key data structures used in the code, such as arrays, lists, dictionaries, or custom data types. Explain how these data structures are utilized and their role in the code's functionality. 4. Control Flow: Explain the control flow of the code, including conditional statements, loops, and function calls. Describe how the code executes and what determines the path of execution. 5. Input and Output: Identify the input parameters or data sources used by the code. Explain how the code processes and manipulates the input data. Describe the expected output or results produced by the code. 6. Libraries and Dependencies: Identify any external libraries, frameworks, or dependencies used in the code. Explain the purpose and functionality of each library and how they contribute to the code's overall behavior. 7. Best Practices and Design Patterns: Identify any best practices, design patterns, or coding conventions followed in the code. Explain the benefits and rationale behind these practices and how they contribute to code readability, maintainability, and efficiency. Please provide clear and concise explanations for each section of the code. Use simple language and avoid excessive technical jargon to ensure the explanations are accessible to readers with varying levels of programming knowledge. If necessary, include examples or analogies to clarify complex concepts. Remember, the goal is to help the reader understand the code's purpose, functionality, and underlying logic. Provide insights and explanations that empower the reader to comprehend and work with the code effectively.Respond based on the programming language of the requested code. Unless stated otherwise
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

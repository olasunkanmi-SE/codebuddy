import * as vscode from "vscode";

import { GoogleGenerativeAI } from "@google/generative-ai";

const PROMPT = `
As an AI-powered code assistant, your task is to identify and fix errors within the provided code block. Analyze the code, detect any issues, and provide corrected code along with explanations for the fixes. Consider the following:

Identify syntax errors, logical errors, or potential runtime errors in the code.
Provide a corrected version of the code that resolves the identified issues.
Offer alternative solutions or best practices, if applicable, to improve the code's efficiency, readability, or maintainability.
Respond based on the programming language of the requested code. Unless stated otherwise

Error Message: {errorMessage}
`;

export async function fixCodeError(errorMessage: string) {
  vscode.window.showInformationMessage("Generating Fix...");
  const fullPrompt = PROMPT.replace("{errorMessage}", errorMessage);
  const modelName = vscode.workspace
    .getConfiguration()
    .get<string>("google.gemini.model", "models/gemini-1.0-pro-latest");

  const apiKey = vscode.workspace
    .getConfiguration()
    .get<string>("google.gemini.apiKey");
  if (!apiKey) {
    vscode.window.showErrorMessage(
      "API key not configured. Check your settings."
    );
    return;
  }

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({ model: modelName });

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  const fixedCode = response.text();

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    console.debug("Abandon: no open text editor.");
    return;
  }

  // Insert before selection.
  editor.edit((editBuilder) => {
    const commentPrefix = " * ";
    const commentStart = "/**\n";
    const commentEnd = " */\n";

    // Split the comment into lines and add the padding and comment prefix to each line.
    let tsComment: string = fixedCode
      .split("\n")
      .map((line: string) => `${commentPrefix}${line}`)
      .join("\n");

    // Add the comment start and end markers.
    tsComment = `${commentStart}${tsComment}\n${commentEnd}`;
    const position = editor.selection.active;
    // Insert the generated comment at the start of the selection.
    if (position) {
      editBuilder.insert(position, tsComment);
    }
  });
}

import * as vscode from "vscode";
import { GoogleGenerativeAI } from "@google/generative-ai";
const CODE_LABEL = "Here is the code:";
const REVIEW_LABEL = "Here is the review:";
const PROMPT = `
Reviewing code involves finding bugs and increasing code quality. Examples of bugs are syntax 
errors or typos, out of memory errors, and boundary value errors. Increasing code quality 
entails reducing complexity of code, eliminating duplicate code, and ensuring other developers 
are able to understand the code. 
${CODE_LABEL}
for i in x:
    pint(f"Iteration {i} provides this {x**2}.")
${REVIEW_LABEL}
The command \`print\` is spelled incorrectly.
${CODE_LABEL}
height = [1, 2, 3, 4, 5]
w = [6, 7, 8, 9, 10]
${REVIEW_LABEL}
The variable name \`w\` seems vague. Did you mean \`width\` or \`weight\`?
${CODE_LABEL}
while i < 0:
  thrice = i * 3
  thrice = i * 3
  twice = i * 2
${REVIEW_LABEL}
There are duplicate lines of code in this control structure.
`;

export async function generateReview() {
  vscode.window.showInformationMessage("Generating code review...");
  const modelName = vscode.workspace
    .getConfiguration()
    .get<string>("google.gemini.textModel", "models/gemini-1.0-pro-latest");

  // Get API Key from local user configuration
  const apiKey = vscode.workspace.getConfiguration().get<string>("google.gemini.apiKey");
  if (!apiKey) {
    vscode.window.showErrorMessage("API key not configured. Check your settings.");
    return;
  }

  const genai = new GoogleGenerativeAI(apiKey);
  const model = genai.getGenerativeModel({ model: modelName });

  // Text selection
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    console.debug("Abandon: no open text editor.");
    return;
  }

  const selection = editor.selection;
  const selectedCode = editor.document.getText(selection);

  // Build the full prompt using the template.
  const fullPrompt = `${PROMPT}
    ${CODE_LABEL}
    ${selectedCode}
    ${REVIEW_LABEL}
    `;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  const comment = response.text();

  // Insert before selection
  editor.edit((editBuilder) => {
    const commentPrefix = " * ";
    const commentStart = "/**\n";
    const commentEnd = " */\n";

    // Copy the indent from the first line of the selection.
    const trimmed = selectedCode.trimStart();
    const padding = selectedCode.substring(0, selectedCode.length - trimmed.length);

    // Split the comment into lines and add the padding and comment prefix to each line.
    let tsComment: string = comment
      .split("\n")
      .map((line: string) => `${padding}${commentPrefix}${line}`)
      .join("\n");

    // Add the comment start and end markers.
    tsComment = `${padding}${commentStart}${tsComment}\n${padding}${commentEnd}`;

    // Insert the generated comment at the start of the selection.
    editBuilder.insert(selection.start, tsComment);
  });
}

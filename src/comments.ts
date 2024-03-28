import * as vscode from "vscode";

import { GoogleGenerativeAI } from "@google/generative-ai";

// Provide instructions for the AI language model
// This approach uses a few-shot technique, providing a few examples.
const CODE_LABEL = "Here is the code:";
const COMMENT_LABEL = "Here is a good comment:";
const PROMPT = `
A good code review comment describes the intent behind the code without
repeating information that's obvious from the code itself. Good comments
describe "why", explain any "magic" values and non-obvious behaviour.
Below are some examples of good code comments.

${CODE_LABEL}
print(f" \\033[33m {msg}\\033[00m", file=sys.stderr)
${COMMENT_LABEL}
Use terminal codes to print color output to console.

${CODE_LABEL}
to_delete = set(data.keys()) - frozenset(keep)
for key in to_delete:
  del data[key]
${COMMENT_LABEL}
Modifies \`data\` to remove any entry not specified in the \`keep\` list.

${CODE_LABEL}
lines[text_range.start_line - 1:text_range.end_line - 1] = [repl.new_content]
${COMMENT_LABEL}
Replace text from \`lines\` with \`new_content\`, noting that array indices 
are offset 1 from line numbers.

${CODE_LABEL}
api_key = os.getenv("GOOGLE_API_KEY")
${COMMENT_LABEL}
Attempt to load the API key from the environment.`;

export async function generateComment() {
  vscode.window.showInformationMessage("Generating comment...");

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
        ${COMMENT_LABEL}
        `;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  const comment = response.text();

  // Insert before selection.
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

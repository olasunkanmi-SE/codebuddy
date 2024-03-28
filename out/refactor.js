"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefactoredCode = void 0;
const vscode = require("vscode");
const generative_ai_1 = require("@google/generative-ai");
const PROMPT = `
As an AI-powered code refactoring assistant, your task is to enhance the quality and maintainability of the provided code snippet. Analyze the code and suggest improvements by applying best practices, design patterns, and principles of clean code. Focus on the following aspects:
1. Readability: Improve code readability by using meaningful names, consistent formatting, and clear code structure. Suggest changes to make the code easier to understand and follow.
2. Modularity: Identify opportunities to break down the code into smaller, reusable functions or components. Aim to reduce code duplication and improve code organization.
3. Simplicity: Simplify complex logic, remove unnecessary complexity, and streamline the code. Suggest ways to make the code more concise and easier to maintain.
4. Maintainability: Enhance the overall maintainability of the code by improving code documentation, error handling, and adherence to coding standards and best practices.
Please provide the refactored code along with explanations for each significant change made. Justify how the refactoring improves the code's quality and maintainability.
`;
async function generateRefactoredCode() {
    vscode.window.showInformationMessage("Generating code refactor...");
    const modelName = vscode.workspace
        .getConfiguration()
        .get("google.gemini.textModel", "models/gemini-1.0-pro-latest");
    // Get API Key from local user configuration
    const apiKey = vscode.workspace.getConfiguration().get("google.gemini.apiKey");
    if (!apiKey) {
        vscode.window.showErrorMessage("API key not configured. Check your settings.");
        return;
    }
    const genai = new generative_ai_1.GoogleGenerativeAI(apiKey);
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
        ${selectedCode}
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
        let tsComment = comment
            .split("\n")
            .map((line) => `${padding}${commentPrefix}${line}`)
            .join("\n");
        // Add the comment start and end markers.
        tsComment = `${padding}${commentStart}${tsComment}\n${padding}${commentEnd}`;
        // Insert the generated comment at the start of the selection.
        editBuilder.insert(selection.start, tsComment);
    });
}
exports.generateRefactoredCode = generateRefactoredCode;
//# sourceMappingURL=refactor.js.map
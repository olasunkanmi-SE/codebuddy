"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOptimizeCode = void 0;
const vscode = require("vscode");
const generative_ai_1 = require("@google/generative-ai");
const PROMPT = `
As an AI-powered code optimization assistant, your task is to improve the performance and efficiency of the provided code snippet. Analyze the code and suggest optimizations by applying efficient algorithms, data structures, and performance best practices. Focus on the following aspects:
Time Complexity: Identify inefficient algorithms or code patterns that can be optimized. Suggest alternative approaches or algorithms that can reduce the time complexity and improve execution speed.
Space Complexity: Analyze the code's memory usage and identify opportunities to optimize memory consumption. Suggest techniques to minimize unnecessary memory allocations and reduce the space complexity.
Resource Utilization: Examine how the code utilizes system resources such as CPU, I/O operations, or network calls. Propose optimizations to minimize resource overhead and improve overall efficiency.
Caching and Memoization: Identify computations or function calls that can benefit from caching or memoization. Suggest ways to store and reuse previously computed results to avoid redundant calculations.
Parallelization and Concurrency: Identify portions of the code that can be parallelized or executed concurrently to leverage multi-core processors or distributed systems. Propose appropriate parallelization techniques or libraries to improve performance.
Please provide the optimized code along with explanations for each significant optimization made. Justify how the optimizations improve the code's performance and efficiency. If trade-offs are involved, discuss the benefits and drawbacks of each optimization approach.
`;
async function generateOptimizeCode() {
    const action = vscode.window.showInformationMessage("Generating optimized code...");
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
exports.generateOptimizeCode = generateOptimizeCode;
//# sourceMappingURL=optimize.js.map
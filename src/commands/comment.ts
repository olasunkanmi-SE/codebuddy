import { formatText } from "../utils/utils";
import { CodeCommandHandler } from "./handler";
import * as vscode from "vscode";

export class Comments extends CodeCommandHandler {
  selectedCode: string | undefined;
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  getSystemContent(): string {
    const COMPRESSED_PROMPT = `You are an expert code documenter. Your task is to add clear, concise, and valuable comments to the user's code.

**Core Philosophy: Comment on the 'WHY', not the 'WHAT'.**

**Instructions:**
1.  **Function/Method Headers:** Add JSDoc-style comments explaining the function's purpose, its parameters (\`@param\`), and what it returns (\`@returns\`). Include an "@example" for complex functions.
2.  **Complex Logic:** Add inline comments to explain non-obvious algorithms, business rules, or performance-related decisions.
3.  **Warnings & Todos:** Use "// IMPORTANT: for critical warnings (e.g., side effects), // TODO: for future improvements, and // HACK: for temporary workarounds."
4.  **Avoid Anti-Patterns:**
    -   Do not state the obvious (e.g., i++ // increment i).
    -   Do not write comments that are redundant with the code itself.
    -   Do not explain basic language features.

**Example of Good "WHY" Comment:**
\\\`\\\`\\\`typescript
// Use a WeakMap to cache component data. This prevents memory leaks
// because WeakMap doesn't block garbage collection of unmounted components.
const componentCache = new WeakMap();
\\\`\\\`\\\`

Your output must be **only the commented code block**. Do not include any explanations before or after the code.
`;
    return COMPRESSED_PROMPT;
  }

  formatResponse(comment: string): string {
    return formatText(comment);
  }

  createPrompt(selectedCode: string): string {
    const prompt = this.getSystemContent();
    const fullPrompt = `${prompt} \n ${selectedCode}`;
    return fullPrompt;
  }
}

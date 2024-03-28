"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const comments_1 = require("./comments");
const review_1 = require("./review");
const refactor_1 = require("./refactor");
const fix_1 = require("./fix");
const optimize_1 = require("./optimize");
function activate(context) {
    const commentCode = vscode.commands.registerCommand("pipet-code-agent.commentCode", comments_1.generateComment);
    const reviewCode = vscode.commands.registerCommand("pipet-code-agent.reviewCode", review_1.generateReview);
    const refactorCode = vscode.commands.registerCommand("pipet-code-agent.codeRefactor", refactor_1.generateRefactoredCode);
    const optimizeCode = vscode.commands.registerCommand("pipet-code-agent.codeOptimize", optimize_1.generateOptimizeCode);
    const fixCode = vscode.commands.registerCommand("pipet-code-agent.codeFix", (errorMessage) => {
        (0, fix_1.fixCodeError)(errorMessage);
    });
    const askExtensionProvider = new AskExtensionProvider();
    const askExtensionDisposable = vscode.languages.registerCodeActionsProvider({ scheme: "file", language: "*" }, askExtensionProvider);
    context.subscriptions.push(commentCode, reviewCode, refactorCode, fixCode, optimizeCode, askExtensionDisposable);
}
exports.activate = activate;
class AskExtensionProvider {
    provideCodeActions(document, range, context, token) {
        const actions = [];
        if (context.diagnostics.length > 0) {
            const diagnostic = context.diagnostics[0];
            const errorMessage = diagnostic.message;
            const action = new vscode.CodeAction("Ask Ola to Fix", vscode.CodeActionKind.QuickFix);
            action.command = {
                command: "pipet-code-agent.codeFix",
                title: "Ask Ola to Fix",
                arguments: [errorMessage],
            };
            actions.push(action);
        }
        return actions;
    }
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
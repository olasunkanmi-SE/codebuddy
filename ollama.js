"use strict";
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const extensionPath = vscode.extensions.getExtension("your-extension-id").extensionPath;
function activate(context) {
    console.log('Congratulations, your extension "CodeBuddy" is now active!');
    // Register commands
    context.subscriptions.push(vscode.commands.registerCommand("codebuddy.setupDocker", setupDocker));
    context.subscriptions.push(vscode.commands.registerCommand("codebuddy.checkDocker", checkDockerInstalled));
}
async function checkDockerInstalled() {
    return new Promise((resolve, reject) => {
        exec("docker --version", (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage("Docker is not installed or not in your PATH. Please install Docker and try again.");
                resolve(false);
            }
            else {
                vscode.window.showInformationMessage("Docker is installed.");
                resolve(true);
            }
        });
    });
}
async function setupDocker() {
    const dockerInstalled = await checkDockerInstalled();
    if (!dockerInstalled)
        return;
    // Ensure Docker Compose is installed
    const dockerComposeInstalled = await new Promise((resolve) => {
        exec("docker-compose --version", (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage("Docker Compose is not installed. Please install Docker Compose and try again.");
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
    if (!dockerComposeInstalled)
        return;
    // Copy the docker-compose.yml file to the user's workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage("No workspace folder open. Please open a folder and try again.");
        return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const dockerComposeSrc = path.join(extensionPath, "resources", "docker-compose.yml");
    const dockerComposeDest = path.join(workspacePath, "docker-compose.yml");
    try {
        fs.copyFileSync(dockerComposeSrc, dockerComposeDest);
        vscode.window.showInformationMessage("Docker Compose file has been copied to your workspace.");
    }
    catch (error) {
        vscode.window.showErrorMessage("Failed to copy docker-compose.yml: " + error.message);
        return;
    }
    // Run Docker Compose
    exec(`docker-compose -f ${dockerComposeDest} up -d`, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage("Failed to start Docker Compose: " + error.message);
        }
        else {
            vscode.window.showInformationMessage("Docker Compose setup completed successfully.");
            // Optionally, you could now configure your extension to use the local Ollama service
            configureOllamaURL();
        }
    });
}
function configureOllamaURL() {
    const config = vscode.workspace.getConfiguration("codebuddy");
    config
        .update("ollamaURL", "http://localhost:11434", vscode.ConfigurationTarget.Global)
        .then(() => {
        vscode.window.showInformationMessage("Ollama URL has been set to localhost.");
    })
        .catch((error) => {
        vscode.window.showErrorMessage("Failed to update Ollama URL: " + error);
    });
}
function deactivate() { }
module.exports = {
    activate,
    deactivate,
};
//# sourceMappingURL=ollama.js.map
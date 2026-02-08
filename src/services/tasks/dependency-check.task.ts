import * as vscode from "vscode";
import { Logger } from "../../infrastructure/logger/logger";
import * as fs from "fs/promises";
import * as path from "path";

export class DependencyCheckTask {
  private logger: Logger;

  constructor() {
    this.logger = Logger.initialize("DependencyCheckTask", {});
  }

  public async execute(): Promise<void> {
    this.logger.info("Running Dependency Check...");

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    for (const folder of workspaceFolders) {
      const packageJsonPath = path.join(folder.uri.fsPath, "package.json");
      try {
        const content = await fs.readFile(packageJsonPath, "utf-8");
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        const unpinned = [];
        const stars = [];

        for (const [name, version] of Object.entries(deps)) {
          if (typeof version === "string") {
            if (version === "*" || version === "latest") {
              stars.push(name);
            } else if (version.startsWith("^") || version.startsWith("~")) {
              // These are technically pinned but loose.
              // We strictly look for dangerous wildcards.
            }
          }
        }

        if (stars.length > 0) {
          vscode.window
            .showWarningMessage(
              `Dependency Alert: ${stars.length} packages use wildcard versions (*). This is risky for stability.`,
              "View package.json",
            )
            .then((selection) => {
              if (selection === "View package.json") {
                vscode.workspace
                  .openTextDocument(packageJsonPath)
                  .then((doc) => {
                    vscode.window.showTextDocument(doc);
                  });
              }
            });
        }
      } catch (e) {
        // No package.json or invalid
      }
    }
  }
}

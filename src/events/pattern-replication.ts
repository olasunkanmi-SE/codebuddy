import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

interface ICodePattern {
  uploadPattern(file: vscode.Uri): Promise<void>;
  getPatterns(): Promise<string[]>;
  uploadPatternHandler(): Promise<void>;
  showInformationMessage(action: string): Thenable<string | undefined>;
}

export class CodePattern implements ICodePattern {
  private patternDir: string;
  constructor(
    private readonly action: string,
    private readonly context: vscode.ExtensionContext
  ) {
    this.showInformationMessage(this.action);
    this.patternDir = path.join(this.context.extensionPath, "patterns");
    if (!fs.existsSync(this.patternDir)) {
      fs.mkdirSync(this.patternDir);
    }
  }

  //TODO check if the filename already exists?
  async uploadPattern(file: vscode.Uri): Promise<void> {
    const content = await fs.promises.readFile(file.fsPath, "utf8");
    const patternName = path.basename(file.fsPath);
    const patternPath = path.join(this.patternDir, patternName);
    await fs.promises.writeFile(patternPath, content);
    vscode.window.showInformationMessage(
      `Pattern ${patternName} Upload successful`
    );
  }

  async getPatterns(): Promise<string[]> {
    const files = await fs.promises.readdir(this.patternDir);
    return files.map((file) => path.join(this.patternDir, file));
  }

  async uploadPatternHandler(): Promise<void> {
    const file: vscode.Uri[] | undefined = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        "Text files": ["txt"],
      },
    });

    if (file?.[0]) {
      try {
        await this.uploadPattern(file[0]);
        this.getPatterns();
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `Failed to upload pattern: ${error.message}`
        );
      }
    }
  }
  // Todo: Move to utility
  showInformationMessage(action: string): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(action);
  }
}

import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

interface IPatternUploader {
  uploadFile(file: vscode.Uri): Promise<void>;
  getPatterns(): Promise<string[]>;
  uploadPatternHandler(): Promise<void>;
}

export class PatternUploader implements IPatternUploader {
  patternDir: string;
  constructor(private readonly context: vscode.ExtensionContext) {
    this.patternDir = path.join(this.context.extensionPath, "patterns");
    if (!fs.existsSync(this.patternDir)) {
      fs.mkdirSync(this.patternDir);
    }
  }

  /**
   * Uploads a file to the pattern directory asynchronously.
   * This function reads the file content, deletes any existing patterns,
   * and writes the new pattern to the file system.
   * @param file - The file to upload, represented as a vscode Uri
   * @throws {Error} If the upload process fails
   * */
  async uploadFile(file: vscode.Uri): Promise<void> {
    try {
      const content = await fs.promises.readFile(file.fsPath, "utf8");
      const patternName = path.basename(file.fsPath);
      const patterns = await this.getPatterns();
      if (patterns.length > 0) {
        await this.deletePatterns(patterns);
      }
      const patternPath = path.join(this.patternDir, patternName);
      await fs.promises.writeFile(patternPath, content);
      vscode.window.showInformationMessage(
        `KnowledgeBase uploaded successfully`,
      );
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Failed to upload pattern: ${error.message}`,
      );
      throw error;
    }
  }

  async getPatternNames(): Promise<string[]> {
    const patterns = await this.getPatterns();
    return patterns.map((pattern) => {
      const patternName = path.basename(pattern);
      return patternName;
    });
  }

  async readFileAsync(filePath: string): Promise<string> {
    const fullPath = path.resolve(filePath);
    try {
      const content = await fs.promises.readFile(fullPath, "utf8");
      return content;
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Error reading from knowledgeBase: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Deletes multiple patterns asynchronously.
   * This function maps over the provided pattern names, constructs the full file paths,
   * and uses fs.promises.unlink to delete the files.
   * @param patterns - An array of pattern names to delete
   * @throws {Error} If any of the files cannot be deleted
   * */
  async deletePatterns(patterns: string[]): Promise<void> {
    try {
      const deletePromises = patterns.map((pattern) => {
        const patternName = path.basename(pattern);
        return fs.promises.unlink(path.join(this.patternDir, patternName));
      });
      await Promise.all(deletePromises);
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Unable to delete patterns: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Asynchronously retrieves a list of pattern files from the designated directory.
   * @returns A Promise that resolves to an array of file paths (strings)
   * @throws {Error} If an error occurs while reading the directory
   */
  async getPatterns(): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(this.patternDir);
      return files.map((file) => path.join(this.patternDir, file));
    } catch (error: any) {
      vscode.window.showErrorMessage(
        `Error fetching the pattern file ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Handles uploading a pattern file asynchronously.
   * Prompts the user to select a text file, uploads it, and handles any errors that occur.
   * @returns A Promise that resolves when the upload is complete or rejected with an error
   * */
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
        await this.uploadFile(file[0]);
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `Failed to upload pattern: ${error.message}`,
        );
        throw error;
      }
    }
  }
}

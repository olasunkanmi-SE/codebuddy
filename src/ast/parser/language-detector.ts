import * as path from "path";
import * as vscode from "vscode";
import { languageConfigs } from "../language-config";

export class LanguageDetector {
  static detectFromFilePath(filePath: string): string | undefined {
    const ext = path.extname(filePath).slice(1).toLowerCase();

    for (const languageId in languageConfigs) {
      if (languageConfigs[languageId].languageIdMap.includes(ext)) {
        return languageId;
      }
    }

    const openDoc = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.fsPath === filePath,
    );
    if (openDoc) {
      for (const langId in languageConfigs) {
        if (
          languageConfigs[langId].languageIdMap.includes(openDoc.languageId)
        ) {
          return langId;
        }
      }
    }
    return undefined;
  }

  getSupporttedExtensions(): string[] {
    const extensions: string[] = [];
    for (const config of Object.values(languageConfigs)) {
      extensions.push(...config.languageIdMap);
    }
    return [...new Set(extensions)];
  }

  static isSupported(filePath: string): boolean {
    return this.detectFromFilePath(filePath) !== undefined;
  }
}

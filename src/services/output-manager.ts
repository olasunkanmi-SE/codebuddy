/**
 * Output Manager
 *
 * Manages VS Code output channel for displaying analysis results.
 */

import * as vscode from "vscode";

export class OutputManager {
  private static instance: OutputManager | null = null;
  private outputChannel: vscode.OutputChannel;

  private constructor(channelName: string = "CodeBuddy Analysis") {
    this.outputChannel = vscode.window.createOutputChannel(channelName);
  }

  static getInstance(channelName?: string): OutputManager {
    return (OutputManager.instance ??= new OutputManager(channelName));
  }

  appendLine(message: string): void {
    this.outputChannel.appendLine(message);
  }

  append(message: string): void {
    this.outputChannel.append(message);
  }

  clear(): void {
    this.outputChannel.clear();
  }

  show(preserveFocus: boolean = true): void {
    this.outputChannel.show(preserveFocus);
  }

  hide(): void {
    this.outputChannel.hide();
  }

  getChannel(): vscode.OutputChannel {
    return this.outputChannel;
  }

  dispose(): void {
    this.outputChannel.dispose();
    OutputManager.instance = null;
  }
}

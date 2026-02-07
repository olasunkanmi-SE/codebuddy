/**
 * Output Manager
 *
 * Manages VS Code output channel for displaying analysis results.
 */

import { IOutputChannel } from "../interfaces/output-channel";
import { EditorHostService } from "./editor-host.service";

export class OutputManager {
  private static instance: OutputManager | null = null;
  private _outputChannel: IOutputChannel | undefined;
  private channelName: string;

  private constructor(channelName = "CodeBuddy Analysis") {
    this.channelName = channelName;
  }

  static getInstance(channelName?: string): OutputManager {
    return (OutputManager.instance ??= new OutputManager(channelName));
  }

  private get outputChannel(): IOutputChannel {
    if (!this._outputChannel) {
      try {
        this._outputChannel = EditorHostService.getInstance()
          .getHost()
          .window.createOutputChannel(this.channelName);
      } catch (e) {
        // Fallback if EditorHost not ready or not initialized
        // This ensures we don't crash if logging happens extremely early
        return {
          name: this.channelName,
          append: (value: string) => process.stderr.write(value),
          appendLine: (value: string) => process.stderr.write(value + "\n"),
          clear: () => {
            /* no-op */
          },
          show: () => {
            /* no-op */
          },
          hide: () => {
            /* no-op */
          },
          dispose: () => {
            /* no-op */
          },
        };
      }
    }
    return this._outputChannel;
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

  show(preserveFocus = true): void {
    this.outputChannel.show(preserveFocus);
  }

  hide(): void {
    this.outputChannel.hide();
  }

  getChannel(): IOutputChannel {
    return this.outputChannel;
  }

  dispose(): void {
    if (this._outputChannel) {
      this._outputChannel.dispose();
      this._outputChannel = undefined;
    }
    OutputManager.instance = null;
  }
}

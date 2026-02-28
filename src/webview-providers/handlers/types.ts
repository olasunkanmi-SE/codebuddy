import * as vscode from "vscode";
import { Logger } from "../../infrastructure/logger/logger";

/**
 * Context object passed to each message handler, giving it access to the
 * webview, logger, and any shared helper methods it needs without coupling
 * back to BaseWebViewProvider.
 */
export interface HandlerContext {
  readonly webview: vscode.WebviewView;
  readonly logger: Logger;
  readonly extensionUri: vscode.Uri;
  sendResponse(
    response: string,
    currentChat?: string,
  ): Promise<boolean | undefined>;
}

/**
 * A domain-specific handler that processes a set of related webview commands.
 */
export interface WebviewMessageHandler {
  /** The command strings this handler is responsible for. */
  readonly commands: string[];
  /** Process a single webview message. */
  handle(message: any, ctx: HandlerContext): Promise<void>;
}

/**
 * Registry that maps command strings to their handlers and dispatches
 * incoming messages accordingly.
 */
export class MessageHandlerRegistry {
  private readonly handlers = new Map<string, WebviewMessageHandler>();

  register(handler: WebviewMessageHandler): void {
    for (const cmd of handler.commands) {
      this.handlers.set(cmd, handler);
    }
  }

  /** Returns true if the command was handled. */
  async dispatch(message: any, ctx: HandlerContext): Promise<boolean> {
    const handler = this.handlers.get(message.command);
    if (handler) {
      await handler.handle(message, ctx);
      return true;
    }
    return false;
  }

  has(command: string): boolean {
    return this.handlers.has(command);
  }
}

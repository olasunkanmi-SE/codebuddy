import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export class DebuggerService {
  private static instance: DebuggerService;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.initialize("DebuggerService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  public static getInstance(): DebuggerService {
    if (!DebuggerService.instance) {
      DebuggerService.instance = new DebuggerService();
    }
    return DebuggerService.instance;
  }

  public get activeSession(): vscode.DebugSession | undefined {
    return vscode.debug.activeDebugSession;
  }

  public async getThreads(): Promise<any[]> {
    if (!this.activeSession) throw new Error("No active debug session");
    try {
      const response = await this.activeSession.customRequest("threads");
      return response.threads;
    } catch (error: any) {
      this.logger.error("Failed to get threads", error);
      throw error;
    }
  }

  public async getStackTrace(
    threadId: number,
    startFrame: number = 0,
    levels: number = 20,
  ): Promise<any[]> {
    if (!this.activeSession) throw new Error("No active debug session");
    try {
      const response = await this.activeSession.customRequest("stackTrace", {
        threadId,
        startFrame,
        levels,
      });
      return response.stackFrames;
    } catch (error: any) {
      this.logger.error("Failed to get stack trace", error);
      throw error;
    }
  }

  public async getScopes(frameId: number): Promise<any[]> {
    if (!this.activeSession) throw new Error("No active debug session");
    try {
      const response = await this.activeSession.customRequest("scopes", {
        frameId,
      });
      return response.scopes;
    } catch (error: any) {
      this.logger.error("Failed to get scopes", error);
      throw error;
    }
  }

  public async getVariables(variablesReference: number): Promise<any[]> {
    if (!this.activeSession) throw new Error("No active debug session");
    try {
      const response = await this.activeSession.customRequest("variables", {
        variablesReference,
      });
      return response.variables;
    } catch (error: any) {
      this.logger.error("Failed to get variables", error);
      throw error;
    }
  }

  public async evaluate(expression: string, frameId?: number): Promise<any> {
    if (!this.activeSession) throw new Error("No active debug session");
    try {
      const response = await this.activeSession.customRequest("evaluate", {
        expression,
        frameId,
        context: "repl",
      });
      return response;
    } catch (error: any) {
      this.logger.error("Failed to evaluate expression", error);
      throw error;
    }
  }

  public async stepOver(threadId: number): Promise<void> {
    if (!this.activeSession) throw new Error("No active debug session");
    await this.activeSession.customRequest("next", { threadId });
  }

  public async stepInto(threadId: number): Promise<void> {
    if (!this.activeSession) throw new Error("No active debug session");
    await this.activeSession.customRequest("stepIn", { threadId });
  }

  public async stepOut(threadId: number): Promise<void> {
    if (!this.activeSession) throw new Error("No active debug session");
    await this.activeSession.customRequest("stepOut", { threadId });
  }

  public async continue(threadId: number): Promise<void> {
    if (!this.activeSession) throw new Error("No active debug session");
    await this.activeSession.customRequest("continue", { threadId });
  }

  public async pause(threadId: number): Promise<void> {
    if (!this.activeSession) throw new Error("No active debug session");
    await this.activeSession.customRequest("pause", { threadId });
  }
}

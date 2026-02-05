// Service / Client for Codebase Analysis Worker
import * as vscode from "vscode";
import * as path from "path";
import { Worker } from "worker_threads";
import { Logger } from "../infrastructure/logger/logger";

/**
 * Message types for communication
 */
export interface WorkerMessage {
  type:
    | "ANALYZE_CODEBASE"
    | "ANALYSIS_COMPLETE"
    | "ANALYSIS_ERROR"
    | "ANALYSIS_PROGRESS"
    | "LOG";
  payload?: any;
  error?: string;
  progress?: {
    current: number;
    total: number;
    message: string;
  };
  level?: string;
  message?: string;
  data?: any;
}

export interface CodebaseAnalysisWorkerData {
  workspacePath: string;
  filePatterns: string[];
  excludePatterns: string[];
  maxFiles: number;
}

export interface AnalysisResult {
  frameworks: string[];
  dependencies: Record<string, string>;
  files: string[];
  apiEndpoints: any[];
  dataModels: any[];
  databaseSchema: any;
  domainRelationships: any[];
  fileContents: Map<string, string>;
  summary: {
    totalFiles: number;
    totalLines: number;
    languageDistribution: Record<string, number>;
    complexity: "low" | "medium" | "high";
  };
}

export class CodebaseAnalysisWorker {
  private readonly logger: Logger;
  private worker?: Worker;
  private resolveAnalysis?: (
    value: AnalysisResult | PromiseLike<AnalysisResult>,
  ) => void;
  private rejectAnalysis?: (reason?: any) => void;
  private onProgressCallback?: (progress: any) => void;

  constructor() {
    this.logger = Logger.initialize("CodebaseAnalysisWorker", {});
  }

  async analyzeCodebase(
    data: CodebaseAnalysisWorkerData,
    onProgress: (progress: {
      current: number;
      total: number;
      message: string;
    }) => void,
    token?: vscode.CancellationToken,
  ): Promise<AnalysisResult> {
    if (this.worker) {
      throw new Error("Analysis already in progress");
    }

    this.onProgressCallback = onProgress;

    try {
      // 1. Resolve relevant files using VS Code API (Main Thread)
      onProgress({
        current: 0,
        total: 100,
        message: "Scanning workspace files...",
      });
      const files = await this.findRelevantFiles(data);

      if (files.length === 0) {
        this.logger.warn("No files found to analyze");
      }

      onProgress({
        current: 5,
        total: 100,
        message: `Found ${files.length} files. Starting worker...`,
      });

      // 2. Spawn and communicate with Worker
      return await new Promise<AnalysisResult>((resolve, reject) => {
        this.resolveAnalysis = resolve;
        this.rejectAnalysis = reject;

        const workerPath = this.getWorkerPath();
        this.logger.info(
          `Initializing Codebase Analysis Worker at: ${workerPath}`,
        );

        try {
          this.worker = new Worker(workerPath);

          this.worker.on("message", this.handleMessage.bind(this));
          this.worker.on("error", (err) => {
            this.logger.error("Worker error:", err);
            this.cleanup();
            reject(err);
          });
          this.worker.on("exit", (code) => {
            if (code !== 0) {
              const msg = `Worker stopped with exit code ${code}`;
              this.logger.error(msg);
              this.cleanup();
              reject(new Error(msg));
            }
          });

          // Send start command
          this.worker.postMessage({
            type: "ANALYZE_CODEBASE",
            payload: {
              workspacePath: data.workspacePath,
              files,
            },
          });

          // Handle Cancellation
          if (token) {
            token.onCancellationRequested(() => {
              this.logger.info("Cancellation requested via token");
              this.worker?.postMessage({ type: "CANCEL" });
              // We don't terminate immediately, we wait for worker to clean up or just die
              this.cleanup();
              reject(new Error("Analysis cancelled"));
            });
          }
        } catch (e) {
          this.cleanup();
          reject(e);
        }
      });
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  private handleMessage(message: WorkerMessage) {
    switch (message.type) {
      case "ANALYSIS_COMPLETE":
        if (this.resolveAnalysis) {
          this.resolveAnalysis(message.payload);
          this.resolveAnalysis = undefined; // prevent double resolve
          this.cleanup();
        }
        break;
      case "ANALYSIS_ERROR":
        if (this.rejectAnalysis) {
          this.rejectAnalysis(new Error(message.error));
          this.rejectAnalysis = undefined;
          this.cleanup();
        }
        break;
      case "ANALYSIS_PROGRESS":
        if (this.onProgressCallback && message.progress) {
          this.onProgressCallback(message.progress);
        }
        break;
      case "LOG":
        const { level, message: msg, data } = message;
        if (level === "ERROR") this.logger.error(msg || "Worker Error", data);
        else if (level === "WARN") this.logger.warn(msg || "Worker Warn", data);
        else if (level === "DEBUG")
          this.logger.debug(msg || "Worker Debug", data);
        else this.logger.info(msg || "Worker Info", data);
        break;
    }
  }

  private cleanup() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = undefined;
    }
    this.resolveAnalysis = undefined;
    this.rejectAnalysis = undefined;
    this.onProgressCallback = undefined;
  }

  cancel() {
    this.cleanup();
  }

  isAnalysisRunning(): boolean {
    return !!this.worker;
  }

  private getWorkerPath(): string {
    // In bundled environment, __dirname is dist/
    // Worker is in dist/workers/codebase-analysis.worker.js
    return path.join(__dirname, "workers", "codebase-analysis.worker.js");
  }

  /**
   * Find all relevant files in the workspace (Main Thread Operation)
   */
  private async findRelevantFiles(
    data: CodebaseAnalysisWorkerData,
  ): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of data.filePatterns) {
      try {
        const uris = await vscode.workspace.findFiles(
          pattern,
          `{${data.excludePatterns.join(",")}}`,
          data.maxFiles,
        );

        files.push(...uris.map((uri) => uri.fsPath));
      } catch (error: any) {
        this.logger.warn(
          `Failed to find files with pattern ${pattern}:`,
          error,
        );
      }
    }

    // Remove duplicates and sort
    return [...new Set(files)].sort((a, b) => a.localeCompare(b));
  }
}

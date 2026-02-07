import * as cp from "child_process";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { EventEmitter } from "events";
import { EditorHostService } from "./editor-host.service";

interface TerminalSession {
  id: string;
  process: cp.ChildProcessWithoutNullStreams;
  outputBuffer: string[];
  lastReadIndex: number;
  createdAt: number;
}

export class DeepTerminalService extends EventEmitter {
  private static instance: DeepTerminalService;
  private sessions: Map<string, TerminalSession> = new Map();
  private logger: Logger;
  private readonly MAX_BUFFER_LINES = 2000;

  private constructor() {
    super();
    this.logger = Logger.initialize("DeepTerminalService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  public static getInstance(): DeepTerminalService {
    if (!DeepTerminalService.instance) {
      DeepTerminalService.instance = new DeepTerminalService();
    }
    return DeepTerminalService.instance;
  }

  /**
   * Starts a new persistent terminal session
   */
  public async startSession(id: string, shellPath?: string): Promise<string> {
    if (this.sessions.has(id)) {
      return `Session ${id} already exists.`;
    }

    const shell =
      shellPath ||
      (process.platform === "win32" ? "powershell.exe" : "/bin/zsh");

    let cwd = process.cwd();
    try {
      const folders =
        EditorHostService.getInstance().getHost().workspace.workspaceFolders;
      if (folders && folders.length > 0) {
        cwd = folders[0].uri.fsPath;
      }
    } catch (e) {
      // Fallback to process.cwd() if EditorHost is not ready
    }

    this.logger.info(
      `Starting terminal session ${id} with shell ${shell} in ${cwd}`,
    );

    try {
      const childProcess = cp.spawn(shell, [], {
        cwd,
        env: { ...process.env, TERM: "xterm-256color" }, // Better output formatting
        shell: false, // We are spawning the shell directly
      });

      const session: TerminalSession = {
        id,
        process: childProcess,
        outputBuffer: [],
        lastReadIndex: 0,
        createdAt: Date.now(),
      };

      this.setupListeners(session);
      this.sessions.set(id, session);

      return `Session ${id} started successfully.`;
    } catch (error: any) {
      this.logger.error(`Failed to start session ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Executes a command in an existing session
   */
  public async executeCommand(id: string, command: string): Promise<string> {
    const session = this.sessions.get(id);
    if (!session) {
      // Auto-create session if it doesn't exist?
      // For now, let's auto-create "default" session if requested
      if (id === "default") {
        await this.startSession("default");
        return this.executeCommand("default", command);
      }
      throw new Error(`Session ${id} not found. Please start it first.`);
    }

    return new Promise((resolve, reject) => {
      try {
        // Reset read index on new command? No, we want history.
        // Write command to stdin
        if (session.process.stdin.writable) {
          session.process.stdin.write(command + "\n");
          this.logger.info(`Sent command to ${id}: ${command}`);
          resolve(`Command sent to session ${id}`);
        } else {
          reject(new Error(`Session ${id} stdin is not writable.`));
        }
      } catch (error: any) {
        reject(error);
      }
    });
  }

  /**
   * Reads new output from the session since last read
   */
  public readOutput(id: string): string {
    const session = this.sessions.get(id);
    if (!session) {
      return `Session ${id} not found.`;
    }

    const newLines = session.outputBuffer.slice(session.lastReadIndex);
    session.lastReadIndex = session.outputBuffer.length;

    if (newLines.length === 0) {
      return "";
    }

    return newLines.join("");
  }

  /**
   * Gets the full history of the session
   */
  public getFullHistory(id: string): string {
    const session = this.sessions.get(id);
    if (!session) {
      return `Session ${id} not found.`;
    }
    return session.outputBuffer.join("");
  }

  public terminateSession(id: string): string {
    const session = this.sessions.get(id);
    if (!session) {
      return `Session ${id} not found.`;
    }

    session.process.kill();
    this.sessions.delete(id);
    this.logger.info(`Terminated session ${id}`);
    return `Session ${id} terminated.`;
  }

  private setupListeners(session: TerminalSession) {
    const { process, id } = session;

    process.stdout.on("data", (data) => {
      const text = data.toString();
      this.appendToBuffer(session, text);
      this.emit("output", { id, text, type: "stdout" });
    });

    process.stderr.on("data", (data) => {
      const text = data.toString();
      this.appendToBuffer(session, text);
      this.emit("output", { id, text, type: "stderr" });
    });

    process.on("close", (code) => {
      const msg = `\n[Session closed with code ${code}]\n`;
      this.appendToBuffer(session, msg);
      this.logger.info(`Session ${id} closed with code ${code}`);
      this.emit("close", { id, code });
      // Don't delete immediately so user can read final output
    });

    process.on("error", (err) => {
      const msg = `\n[Session error: ${err.message}]\n`;
      this.appendToBuffer(session, msg);
      this.logger.error(`Session ${id} error: ${err.message}`);
    });
  }

  private appendToBuffer(session: TerminalSession, text: string) {
    // We store raw chunks, or maybe split by lines?
    // Splitting by lines is better for "read last N lines" logic,
    // but chunks are more faithful to stream.
    // Let's just store chunks but ensure we don't grow forever.

    // For simplicity in this "Deep" implementation, let's just push chunks.
    // But readOutput needs to be careful.

    session.outputBuffer.push(text);

    // Simple pruning if too large (naive approach)
    if (session.outputBuffer.length > this.MAX_BUFFER_LINES) {
      // Keep last 1000 chunks
      session.outputBuffer = session.outputBuffer.slice(-1000);
      // Reset read index if it falls behind (which means we skipped data)
      if (session.lastReadIndex > 1000) {
        session.lastReadIndex = 0; // Force re-read of what's left? Or point to end?
        // Pointing to end might miss context. Let's set to 0 (start of current buffer).
        session.lastReadIndex = 0;
      } else {
        // Adjust index because we removed N items from front
        const removed = this.MAX_BUFFER_LINES - 1000;
        session.lastReadIndex = Math.max(0, session.lastReadIndex - removed);
      }
    }
  }
}

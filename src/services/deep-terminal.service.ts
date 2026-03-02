import * as cp from "child_process";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { EventEmitter } from "events";

/**
 * A fixed-capacity circular buffer that overwrites the oldest entries
 * when full, avoiding repeated array copies.
 */
class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0; // next write position
  private count = 0; // number of items currently stored

  constructor(private readonly capacity: number) {
    this.buffer = new Array(capacity);
  }

  /** Appends an item, overwriting the oldest if at capacity. */
  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  /** Returns all stored items in insertion order. */
  toArray(): T[] {
    if (this.count === 0) return [];
    const start = this.count < this.capacity ? 0 : this.head; // head is the oldest when full
    const out: T[] = new Array(this.count);
    for (let i = 0; i < this.count; i++) {
      out[i] = this.buffer[(start + i) % this.capacity] as T;
    }
    return out;
  }

  /** Returns items from `startIndex` (logical, 0-based from oldest). */
  slice(startIndex: number): T[] {
    if (startIndex >= this.count) return [];
    const physicalStart = this.count < this.capacity ? 0 : this.head;
    const len = this.count - startIndex;
    const out: T[] = new Array(len);
    for (let i = 0; i < len; i++) {
      out[i] = this.buffer[
        (physicalStart + startIndex + i) % this.capacity
      ] as T;
    }
    return out;
  }

  get length(): number {
    return this.count;
  }
}

interface TerminalSession {
  id: string;
  process: cp.ChildProcessWithoutNullStreams;
  outputBuffer: CircularBuffer<string>;
  lastReadIndex: number;
  createdAt: number;
}

/**
 * Patterns that match dangerous or destructive shell commands.
 * Each entry is a regex tested against the normalised (trimmed, lowercase) command.
 */
const BLOCKED_COMMAND_PATTERNS: readonly RegExp[] = [
  // Destructive file-system operations
  /\brm\s+(-[a-zA-Z]*)?\s*-[a-zA-Z]*r[a-zA-Z]*\s+\/\s*$/, // rm -rf /
  /\brm\s+(-[a-zA-Z]*)?\s*-[a-zA-Z]*r[a-zA-Z]*\s+\/\s/, // rm -rf / <path>
  /\bmkfs\b/,
  /\bdd\s+.*\bof=\/dev\//,
  // Privilege escalation
  /\bsudo\b/,
  /\bsu\s+-/,
  /\bchmod\s+[0-7]*777\s+\//,
  // Arbitrary remote-code execution
  /\bcurl\b.*\|\s*(ba)?sh/,
  /\bwget\b.*\|\s*(ba)?sh/,
  /\bcurl\b.*\|\s*python/,
  /\bwget\b.*\|\s*python/,
  // Fork bomb
  /:\(\)\s*\{.*:\|:.*\}/,
  // History / credential exfiltration
  /\bhistory\s*\|.*curl/,
  /\bcat\s+.*\.(ssh|gnupg|aws|npmrc|env)/,
  // Disk / system destruction
  /\b>\/dev\/sda/,
  /\bshutdown\b/,
  /\breboot\b/,
  /\binit\s+0/,
];

export class DeepTerminalService extends EventEmitter {
  private static instance: DeepTerminalService;
  private sessions: Map<string, TerminalSession> = new Map();
  private logger: Logger;
  private readonly MAX_BUFFER_CHUNKS = 2000;
  private static readonly DEFAULT_COMMAND_TIMEOUT_MS = 10_000;

  private constructor(logger?: Logger) {
    super();
    this.logger =
      logger ??
      Logger.initialize("DeepTerminalService", {
        minLevel: LogLevel.DEBUG,
        enableConsole: true,
        enableFile: true,
        enableTelemetry: true,
      });
  }

  /**
   * Returns the singleton instance.
   * @param logger Optional logger to inject (only used on first creation).
   */
  public static getInstance(logger?: Logger): DeepTerminalService {
    if (!DeepTerminalService.instance) {
      DeepTerminalService.instance = new DeepTerminalService(logger);
    }
    return DeepTerminalService.instance;
  }

  /**
   * Starts a new persistent terminal session.
   *
   * @param id      Unique session identifier.
   * @param shellPath  Absolute path to the shell binary (defaults to
   *                   PowerShell on Windows, /bin/bash elsewhere).
   * @returns A confirmation message.
   */
  public async startSession(id: string, shellPath?: string): Promise<string> {
    if (this.sessions.has(id)) {
      return `Session ${id} already exists.`;
    }

    const shell =
      shellPath ||
      (process.platform === "win32" ? "powershell.exe" : "/bin/bash");
    const cwd =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();

    this.logger.info(
      `Starting terminal session ${id} with shell ${shell} in ${cwd}`,
    );

    try {
      const childProcess = cp.spawn(shell, [], {
        cwd,
        env: { ...process.env, TERM: "xterm-256color" },
        shell: false,
      });

      const session: TerminalSession = {
        id,
        process: childProcess,
        outputBuffer: new CircularBuffer<string>(this.MAX_BUFFER_CHUNKS),
        lastReadIndex: 0,
        createdAt: Date.now(),
      };

      this.setupListeners(session);
      this.sessions.set(id, session);

      return `Session ${id} started successfully.`;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to start session ${id}: ${msg}`);
      throw error;
    }
  }

  /**
   * Validates a command against the blocked-pattern list.
   * @throws If the command matches a dangerous pattern.
   */
  private validateCommand(command: string): void {
    const normalised = command.trim().toLowerCase();
    for (const pattern of BLOCKED_COMMAND_PATTERNS) {
      if (pattern.test(normalised)) {
        const msg = `Blocked dangerous command: "${command}"`;
        this.logger.warn(msg);
        throw new Error(
          `${msg}. This command matches a restricted pattern and cannot be executed.`,
        );
      }
    }
  }

  /**
   * Sends a command to an existing session's stdin (fire-and-forget).
   *
   * This resolves once the command has been written to stdin, **not**
   * when it finishes executing. Listen to the `'output'` event or use
   * {@link sendCommandAndWait} if you need the command's output.
   *
   * @param id       Session identifier.
   * @param command  The shell command string to send.
   * @returns A confirmation message.
   * @throws If the session does not exist, stdin is not writable, or
   *         the command matches a blocked pattern.
   */
  public sendCommand(id: string, command: string): Promise<string> {
    this.validateCommand(command);

    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found. Please start it first.`);
    }

    return new Promise((resolve, reject) => {
      if (!session.process.stdin.writable) {
        return reject(new Error(`Session ${id} stdin is not writable.`));
      }

      session.process.stdin.write(command + "\n", (err) => {
        if (err) {
          return reject(
            new Error(`Failed to write to session ${id} stdin: ${err.message}`),
          );
        }
        this.logger.info(`Sent command to ${id}: ${command}`);
        resolve(`Command sent to session ${id}`);
      });
    });
  }

  /**
   * Sends a command and collects stdout output until a timeout elapses
   * with no new data, then resolves with the captured output.
   *
   * @param id         Session identifier.
   * @param command    The shell command string to send.
   * @param timeoutMs  Max time (ms) to wait for output silence before
   *                   resolving. Defaults to {@link DEFAULT_COMMAND_TIMEOUT_MS}.
   * @returns The stdout output produced by the command.
   */
  public async sendCommandAndWait(
    id: string,
    command: string,
    timeoutMs: number = DeepTerminalService.DEFAULT_COMMAND_TIMEOUT_MS,
  ): Promise<string> {
    this.validateCommand(command);

    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found. Please start it first.`);
    }

    return new Promise<string>((resolve, reject) => {
      const chunks: string[] = [];
      let settled = false;
      let idleTimer: ReturnType<typeof setTimeout>;

      const resetIdleTimer = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(
          () => {
            cleanup();
            resolve(chunks.join(""));
          },
          Math.min(timeoutMs, 2000),
        ); // resolve after 2s of silence
      };

      const hardTimer = setTimeout(() => {
        if (!settled) {
          cleanup();
          resolve(chunks.join(""));
        }
      }, timeoutMs);

      const onOutput = ({
        id: eventId,
        text,
      }: {
        id: string;
        text: string;
      }) => {
        if (eventId === id) {
          chunks.push(text);
          resetIdleTimer();
        }
      };

      const onClose = ({ id: eventId }: { id: string }) => {
        if (eventId === id && !settled) {
          cleanup();
          resolve(chunks.join(""));
        }
      };

      const cleanup = () => {
        if (settled) return;
        settled = true;
        clearTimeout(hardTimer);
        clearTimeout(idleTimer);
        this.removeListener("output", onOutput);
        this.removeListener("close", onClose);
      };

      this.on("output", onOutput);
      this.on("close", onClose);
      resetIdleTimer();

      session.process.stdin.write(command + "\n", (err) => {
        if (err) {
          cleanup();
          reject(
            new Error(`Failed to write to session ${id} stdin: ${err.message}`),
          );
        } else {
          this.logger.info(`Sent command (await) to ${id}: ${command}`);
        }
      });
    });
  }

  /**
   * Reads new output chunks accumulated since the last call to this method.
   *
   * @param id  Session identifier.
   * @returns Concatenated new output, or an empty string if none.
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
   * Returns the full buffered output history for a session.
   *
   * @param id  Session identifier.
   */
  public getFullHistory(id: string): string {
    const session = this.sessions.get(id);
    if (!session) {
      return `Session ${id} not found.`;
    }
    return session.outputBuffer.toArray().join("");
  }

  /**
   * Kills the session's child process and removes it from the registry.
   *
   * @param id  Session identifier.
   */
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
    const { process: proc, id } = session;

    proc.stdout.on("data", (data: Buffer) => {
      const text = data.toString();
      session.outputBuffer.push(text);
      this.emit("output", { id, text, type: "stdout" });
    });

    proc.stderr.on("data", (data: Buffer) => {
      const text = data.toString();
      session.outputBuffer.push(text);
      this.emit("output", { id, text, type: "stderr" });
    });

    proc.on("close", (code: number | null) => {
      const msg = `\n[Session closed with code ${code}]\n`;
      session.outputBuffer.push(msg);
      this.logger.info(`Session ${id} closed with code ${code}`);
      this.emit("close", { id, code });
    });

    proc.on("error", (err: Error) => {
      const msg = `\n[Session error: ${err.message}]\n`;
      session.outputBuffer.push(msg);
      this.logger.error(`Session ${id} error: ${err.message}`);
    });
  }
}

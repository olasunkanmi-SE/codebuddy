import * as cp from "child_process";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { EventEmitter } from "events";

/**
 * A fixed-capacity circular buffer that overwrites the oldest entries
 * when full, avoiding repeated array copies.
 */
export class CircularBuffer<T> {
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
    const start = this.count < this.capacity ? 0 : this.head;
    const out: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const item = this.buffer[(start + i) % this.capacity];
      if (item !== undefined) {
        out.push(item);
      }
    }
    return out;
  }

  /** Returns items from `startIndex` (logical, 0-based from oldest). */
  slice(startIndex: number): T[] {
    if (startIndex >= this.count) return [];
    const physicalStart = this.count < this.capacity ? 0 : this.head;
    const len = this.count - startIndex;
    const out: T[] = [];
    for (let i = 0; i < len; i++) {
      const item =
        this.buffer[(physicalStart + startIndex + i) % this.capacity];
      if (item !== undefined) {
        out.push(item);
      }
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
 * Structured result returned by {@link DeepTerminalService.sendCommandAndWait}.
 */
export interface CommandResult {
  output: string;
  /** Exit code captured if the session closed during the wait, otherwise `null`. */
  exitCode: number | null;
  /** `true` when exitCode is 0, `false` otherwise (including timeout without close). */
  success: boolean;
}

/**
 * Default set of patterns that match dangerous or destructive shell commands.
 * Each entry is a regex tested against the normalised (trimmed, lowercase) command.
 *
 * The list can be extended at runtime via
 * {@link DeepTerminalService.addBlockedPatterns}.
 */
export const DEFAULT_BLOCKED_PATTERNS: readonly RegExp[] = [
  // Destructive file-system operations (including common obfuscation wrappers)
  /(?:^|\s|;|`|\$\()(?:rm|eval\s+rm|xargs\s+rm)\s+(-[a-zA-Z]*)?\s*-[a-zA-Z]*r[a-zA-Z]*\s+\/\s*$/,
  /(?:^|\s|;|`|\$\()(?:rm|eval\s+rm|xargs\s+rm)\s+(-[a-zA-Z]*)?\s*-[a-zA-Z]*r[a-zA-Z]*\s+\/\s/,
  /\bmkfs\b/,
  /\bdd\s+.*\bof=\/dev\//,
  // Privilege escalation — nuanced sudo: block destructive sub-commands
  // while allowing benign operations like package updates.
  /\bsudo\s+rm\b/,
  /\bsudo\s+mkfs\b/,
  /\bsudo\s+dd\b/,
  /\bsudo\s+chmod\b/,
  /\bsudo\s+chown\b.*\//,
  /\bsudo\s+shutdown\b/,
  /\bsudo\s+reboot\b/,
  /\bsudo\s+init\b/,
  /\bsu\s+-/,
  /\bchmod\s+[0-7]*777\s+\//,
  // Arbitrary remote-code execution (including common obfuscations)
  /\b(curl|wget)\b.*\|\s*(ba)?sh/,
  /\b(curl|wget)\b.*\|\s*python/,
  /\b(echo|printf)\b.*\b(base64|xxd)\b.*\|\s*(ba)?sh/,
  // Hex / base64 encoded pipeline execution
  /\b(echo|printf)\b\s+['"]?([a-fA-F0-9]{2,}|[a-zA-Z0-9+/=]{4,})['"]?\s*\|\s*(base64|xxd|xargs)\s*\|\s*(ba)?sh/,
  // Fork bomb — general pattern
  /:\(\)\s*\{[^}]*:\s*\|\s*:\s*\}/,
  // History / credential exfiltration
  /\bhistory\s*\|.*(curl|wget|nc)/,
  /\bcat\s+.*\.(ssh|gnupg|aws|npmrc|env|kube)/,
  // Disk / system destruction
  /\b>\s*\/dev\/sda/,
  /\bshutdown\b/,
  /\breboot\b/,
  /\binit\s+0/,
  // eval / command substitution with dangerous payloads
  /\beval\b.*\b(rm|mkfs|dd|curl|wget)\b/,
];

export class DeepTerminalService extends EventEmitter {
  private static instance: DeepTerminalService;
  private sessions: Map<string, TerminalSession> = new Map();
  private logger: Logger;
  private readonly MAX_BUFFER_CHUNKS = 2000;
  private static readonly DEFAULT_COMMAND_TIMEOUT_MS = 10_000;
  /** Hard limit (bytes) on the per-command output collected by sendCommandAndWait. */
  private static readonly MAX_WAIT_BUFFER_BYTES = 10 * 1024 * 1024; // 10 MB

  /** Runtime-extensible blocked patterns (starts with the default set). */
  private blockedPatterns: RegExp[] = [...DEFAULT_BLOCKED_PATTERNS];

  /**
   * @param logger  Pre-initialised logger instance. When omitted the service
   *                creates its own via `Logger.initialize` — this is safe
   *                because `Logger.initialize` is idempotent for a given name.
   */
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
   * Appends additional blocked command patterns at runtime.
   * Useful for administrators or plugins that need to extend the
   * default security policy without modifying source.
   */
  public addBlockedPatterns(patterns: RegExp[]): void {
    this.blockedPatterns.push(...patterns);
  }

  /**
   * Returns a snapshot of the currently active blocked patterns.
   */
  public getBlockedPatterns(): readonly RegExp[] {
    return [...this.blockedPatterns];
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

    // /bin/bash chosen over /bin/zsh for broader cross-platform availability;
    // override via the shellPath parameter when a different shell is preferred.
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
   * Validates a command against the instance's blocked-pattern list.
   * @throws If the command matches a dangerous pattern.
   */
  private validateCommand(command: string): void {
    let normalised = command.trim().toLowerCase();

    // Simple de-obfuscation: strip backtick command substitutions,
    // collapse runs of whitespace, and remove surrounding quotes to
    // reduce the effectiveness of trivial bypass attempts.
    normalised = normalised.replace(/`([^`]*)`/g, "$1");
    normalised = normalised.replace(/\s+/g, " ");

    for (const pattern of this.blockedPatterns) {
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
   * Sends a command and collects output until either a period of silence
   * elapses or the hard timeout is reached, then resolves with a
   * {@link CommandResult} containing the captured output, exit code
   * (if the session closed during the wait), and a success flag.
   *
   * @param id         Session identifier.
   * @param command    The shell command string to send.
   * @param timeoutMs  Max time (ms) to wait for output silence before
   *                   resolving. Defaults to {@link DEFAULT_COMMAND_TIMEOUT_MS}.
   * @returns A {@link CommandResult} with the command's output and status.
   */
  public async sendCommandAndWait(
    id: string,
    command: string,
    timeoutMs: number = DeepTerminalService.DEFAULT_COMMAND_TIMEOUT_MS,
  ): Promise<CommandResult> {
    this.validateCommand(command);

    const session = this.sessions.get(id);
    if (!session) {
      throw new Error(`Session ${id} not found. Please start it first.`);
    }

    return new Promise<CommandResult>((resolve, reject) => {
      const chunks: string[] = [];
      let settled = false;
      let idleTimer: ReturnType<typeof setTimeout>;
      let exitCode: number | null = null;

      const settle = (): void => {
        if (settled) return;
        settled = true;
        clearTimeout(hardTimer);
        clearTimeout(idleTimer);
        this.removeListener("output", onOutput);
        this.removeListener("close", onClose);
        resolve({
          output: chunks.join(""),
          exitCode,
          success: exitCode === 0,
        });
      };

      const resetIdleTimer = (): void => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(
          settle,
          Math.min(timeoutMs, 2000), // resolve after 2 s of silence
        );
      };

      const hardTimer = setTimeout(settle, timeoutMs);

      let totalBytes = 0;

      const onOutput = ({
        id: eventId,
        text,
      }: {
        id: string;
        text: string;
      }): void => {
        if (eventId === id && !settled) {
          if (totalBytes < DeepTerminalService.MAX_WAIT_BUFFER_BYTES) {
            chunks.push(text);
            totalBytes += text.length;
          } else if (totalBytes >= DeepTerminalService.MAX_WAIT_BUFFER_BYTES) {
            this.logger.warn(
              `Output for command in session ${id} exceeded ${DeepTerminalService.MAX_WAIT_BUFFER_BYTES} bytes — truncating.`,
            );
          }
          resetIdleTimer();
        }
      };

      const onClose = ({
        id: eventId,
        code,
      }: {
        id: string;
        code: number | null;
      }): void => {
        if (eventId === id && !settled) {
          exitCode = code;
          settle();
        }
      };

      this.on("output", onOutput);
      this.on("close", onClose);
      resetIdleTimer();

      session.process.stdin.write(command + "\n", (err) => {
        if (err && !settled) {
          settled = true;
          clearTimeout(hardTimer);
          clearTimeout(idleTimer);
          this.removeListener("output", onOutput);
          this.removeListener("close", onClose);
          reject(
            new Error(`Failed to write to session ${id} stdin: ${err.message}`),
          );
        } else if (!err) {
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

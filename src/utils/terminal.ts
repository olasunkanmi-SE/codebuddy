import { spawn } from "child_process";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

type AllowedCommand = "git" | "npm" | "ls" | "echo" | "docker";

const ALLOWED_COMMANDS: Readonly<Set<AllowedCommand>> = new Set([
  "git",
  "npm",
  "ls",
  "echo",
  "docker",
]);

export class Terminal {
  private readonly logger: Logger;
  private static instance: Terminal;
  private extensionPath: string = "";
  private outputChannel: vscode.OutputChannel;
  private listeners: ((data: string) => void)[] = [];
  private backgroundProcesses: Map<
    number,
    import("child_process").ChildProcess
  > = new Map();

  constructor() {
    this.logger = Logger.initialize(Terminal.name, {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.outputChannel =
      vscode.window.createOutputChannel("CodeBuddy Terminal");
  }

  static getInstance(): Terminal {
    if (!Terminal.instance) {
      Terminal.instance = new Terminal();
    }
    return Terminal.instance;
  }

  /**
   * Register a listener for terminal output.
   * @param listener The callback function to receive output data.
   * @returns A disposable to remove the listener.
   */
  public onOutput(listener: (data: string) => void): vscode.Disposable {
    this.listeners.push(listener);
    return new vscode.Disposable(() => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    });
  }

  /**
   * Sets the extension path for locating docker-compose.yml and other resources
   */
  setExtensionPath(path: string): void {
    this.extensionPath = path;
    this.logger.info(`Terminal extension path set to: ${path}`);
  }

  getExtensionPath(): string {
    return this.extensionPath;
  }

  private isDangerousCommand(command: string): boolean {
    // Regex to match dangerous commands: rm, rmdir, unlink
    // Matches whole words to avoid false positives (e.g. "firm" should not match)
    const dangerousPattern = /\b(rm|rmdir|unlink)\b/;
    return dangerousPattern.test(command);
  }

  /**
   * Executes any shell command and streams output to the CodeBuddy Terminal channel.
   * Includes a safety guard requiring user confirmation before execution.
   * @param command The command to execute.
   * @param cwd Optional working directory.
   * @returns A promise that resolves with the command's stdout.
   */
  public async executeAnyCommand(
    command: string,
    cwd?: string,
    background: boolean = false,
  ): Promise<string> {
    // Safety Guard: User Confirmation only for dangerous commands
    if (this.isDangerousCommand(command)) {
      const selection = await vscode.window.showWarningMessage(
        `CodeBuddy wants to execute a potentially destructive command: "${command}"`,
        { modal: true },
        "Execute",
        "Cancel",
      );

      if (selection !== "Execute") {
        this.logger.info(`User denied execution of command: ${command}`);
        return Promise.reject(new Error("User denied command execution."));
      }
    }

    this.outputChannel.show(true);
    this.outputChannel.appendLine(
      `> ${command} ${background ? "(background)" : ""}`,
    );
    this.logger.info(
      `Executing command: ${command} (background: ${background})`,
    );

    return new Promise((resolve, reject) => {
      const process = spawn(command, {
        shell: true,
        cwd:
          cwd ||
          vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ||
          this.extensionPath ||
          undefined,
      });

      if (background && process.pid) {
        this.backgroundProcesses.set(process.pid, process);
      }

      let stdout = "";
      let stderr = "";

      process.stdout.on("data", (data) => {
        const str = data.toString();
        stdout += str;
        this.outputChannel.append(str);
        this.listeners.forEach((listener) => listener(str));
      });

      process.stderr.on("data", (data) => {
        const str = data.toString();
        stderr += str;
        this.outputChannel.append(str);
        this.listeners.forEach((listener) => listener(str));
      });

      process.on("error", (err) => {
        const errorMessage = `Error: ${err.message}\n`;
        this.outputChannel.appendLine(`Error: ${err.message}`);
        this.listeners.forEach((listener) => listener(errorMessage));
        this.logger.error(`Command execution error: ${err.message}`);
        if (!background) {
          reject(err);
        }
      });

      process.on("close", (code) => {
        if (background && process.pid) {
          this.backgroundProcesses.delete(process.pid);
          this.logger.info(
            `Background command "${command}" finished with code ${code}`,
          );
          return;
        }

        if (code === 0) {
          this.logger.info(`Command finished successfully.`);
          resolve(stdout);
        } else {
          const errorMessage = `Command failed with exit code ${code}`;
          this.logger.error(`${errorMessage}. Stderr: ${stderr}`);
          reject(new Error(`${errorMessage}\n${stderr}`));
        }
      });

      if (background) {
        resolve(`Background process started with PID ${process.pid}`);
      }
    });
  }

  /**
   * Securely executes a whitelisted shell command.
   * @param command The command to execute. Must be one of the allowed commands.
   * @param args An array of string arguments to pass to the command.
   * @returns A promise that resolves with the command's stdout.
   * @throws An error if the command is not in the allowed list or arguments are unsafe.
   */
  private executeCommand(
    command: AllowedCommand,
    args: string[],
    options?: { timeout?: number },
  ): Promise<string> {
    if (!ALLOWED_COMMANDS.has(command)) {
      const errorMessage = `Security Alert: Execution of command "${command}" is disallowed.`;
      this.logger.error(errorMessage);
      return Promise.reject(new Error(errorMessage));
    }

    if (command === "docker") {
      this.validateDockerArgs(args);
    }

    this.logger.info(
      `Executing whitelisted command: ${command} ${args.join(" ")}`,
    );
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: "pipe" });

      let stdout = "";
      let stderr = "";

      let timeOutHandle: NodeJS.Timeout | undefined;

      if (options?.timeout) {
        timeOutHandle = setTimeout(() => {
          process.kill();
          reject(
            new Error(
              `Command "${command} ${args.join(" ")}" timed out after ${options.timeout}ms`,
            ),
          );
        }, options.timeout);
      }

      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      process.on("error", (err) => {
        if (timeOutHandle) clearTimeout(timeOutHandle);
        this.logger.error(
          `Failed to start subprocess for command "${command}":`,
          err,
        );
        reject(err);
      });

      process.on("close", (code) => {
        if (timeOutHandle) clearTimeout(timeOutHandle);
        if (code === 0) {
          this.logger.info(`Command finished successfully.`);
          resolve(stdout);
        } else {
          const errorMessage = `Command "${command} ${args.join(" ")}" failed with exit code ${code}. Stderr: ${stderr}`;
          this.logger.error(errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });
  }

  /**
   * Validates arguments to ensure only safe 'docker mcp server ls' commands are allowed.
   * This prevents running arbitrary 'docker' commands like 'docker run -it /bin/bash'.
   */
  private validateDockerArgs(args: string[]): void {
    const allowedSequences = [
      ["mcp", "server", "ls", "--json"],
      ["mcp", "gateway", "run"],
      ["mcp", "--help"],
      ["model", "ls"],
      ["model", "ls", "--json"],
      ["model", "--help"],
      ["ps", "--filter", "name=ollama", "--format", "json"],
      ["compose", "up", "-d"],
      ["exec", "ollama", "ollama", "list"],
    ];

    // Check for 'docker compose -f <path> up -d' pattern
    if (
      args.length === 5 &&
      args[0] === "compose" &&
      args[1] === "-f" &&
      args[3] === "up" &&
      args[4] === "-d"
    ) {
      // Validate that args[2] is a valid file path (ends with docker-compose.yml or .yaml)
      const composePath = args[2];
      if (
        composePath.endsWith("docker-compose.yml") ||
        composePath.endsWith("docker-compose.yaml")
      ) {
        return;
      }
    }

    const isAllowed = allowedSequences.some((expectedArgs) => {
      if (args.length !== expectedArgs.length) return false;
      return args.every((arg, index) => arg === expectedArgs[index]);
    });

    if (isAllowed) return;

    // Special check for 'docker desktop enable model-runner --tcp=12434'
    if (
      args.length === 4 &&
      args[0] === "desktop" &&
      args[1] === "enable" &&
      args[2] === "model-runner" &&
      args[3] === "--tcp=12434"
    ) {
      return;
    }

    // Special check for 'docker model pull <model>'
    if (args.length === 3 && args[0] === "model" && args[1] === "pull") {
      const modelName = args[2];
      // Allow alphanumeric, slashes, colons, dashes, dots (e.g. ai/llama3.2:3b)
      if (/^[a-zA-Z0-9/:\-.]+$/.test(modelName)) {
        return;
      }
    }

    // Special check for 'docker model rm <model>'
    if (args.length === 3 && args[0] === "model" && args[1] === "rm") {
      const modelName = args[2];
      // Allow alphanumeric, slashes, colons, dashes, dots (e.g. ai/llama3.2:3b)
      if (/^[a-zA-Z0-9/:\-.]+$/.test(modelName)) {
        return;
      }
    }

    // Special check for 'docker exec ollama ollama pull <model>'
    if (
      args.length === 5 &&
      args[0] === "exec" &&
      args[1] === "ollama" &&
      args[2] === "ollama" &&
      args[3] === "pull"
    ) {
      const modelName = args[4];
      // Allow alphanumeric, slashes, colons, dashes, dots (e.g. llama3, ai/llama3.2:3b)
      if (/^[a-zA-Z0-9/:\-.]+$/.test(modelName)) {
        return;
      }
    }

    const errorMessage = `Security Alert: Disallowed 'docker' arguments provided: ${args.join(" ")}. Only specific docker commands are permitted.`;
    this.logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  enableDockerModelRunner(): Promise<string> {
    return this.executeCommand("docker", [
      "desktop",
      "enable",
      "model-runner",
      "--tcp=12434",
    ]);
  }

  pullDockerModel(modelName: string): Promise<string> {
    return this.executeCommand("docker", ["model", "pull", modelName]);
  }

  deleteDockerModel(modelName: string): Promise<string> {
    return this.executeCommand("docker", ["model", "rm", modelName]);
  }

  pullOllamaModel(modelName: string): Promise<string> {
    return this.executeCommand("docker", [
      "exec",
      "ollama",
      "ollama",
      "pull",
      modelName,
    ]);
  }

  getOllamaModels(): Promise<string> {
    return this.executeCommand("docker", ["exec", "ollama", "ollama", "list"]);
  }

  getMcpServerList(): Promise<string> {
    return this.executeCommand("docker", ["mcp", "server", "ls", "--json"]);
  }

  getLocalModelList(): Promise<string> {
    return this.executeCommand("docker", ["model", "ls", "--json"]).catch(() =>
      this.executeCommand("docker", ["model", "ls"]),
    );
  }

  checkDockerModelRunner(): Promise<boolean> {
    return this.executeCommand("docker", ["model", "--help"], {
      timeout: 5000,
    })
      .then((output) => {
        // Verify that the output specifically mentions "Usage:  docker model"
        // If "docker model" is not installed, it usually prints the generic "Usage:  docker [OPTIONS] COMMAND"
        return output.includes("Usage:  docker model");
      })
      .catch(() => false);
  }

  getRunningOllamaContainer(): Promise<string> {
    return this.executeCommand("docker", [
      "ps",
      "--filter",
      "name=ollama",
      "--format",
      "json",
    ]);
  }

  async runDockerComposeUp(): Promise<string> {
    if (this.extensionPath) {
      const composePath = require("path").join(
        this.extensionPath,
        "docker-compose.yml",
      );
      this.logger.info(`Running docker compose with file: ${composePath}`);
      return this.executeCommand("docker", [
        "compose",
        "-f",
        composePath,
        "up",
        "-d",
      ]);
    }
    // Fallback to default behavior if no extension path set
    this.logger.warn(
      "Extension path not set, using default docker compose location",
    );
    return this.executeCommand("docker", ["compose", "up", "-d"]);
  }

  get runMcpGateway(): Promise<string> {
    return this.executeCommand("docker", ["mcp", "gateway", "run"]);
  }

  checkDockerMCP(): Promise<boolean> {
    return this.executeCommand("docker", ["mcp", "--help"], {
      timeout: 5000,
    })
      .then(() => true)
      .catch(() => false);
  }
}

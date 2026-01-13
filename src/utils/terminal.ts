import { spawn } from "child_process";
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
  constructor() {
    this.logger = Logger.initialize(Terminal.name, {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance(): Terminal {
    if (!Terminal.instance) {
      Terminal.instance = new Terminal();
    }
    return Terminal.instance;
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
    options?: { timeout?: number }
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
      `Executing whitelisted command: ${command} ${args.join(" ")}`
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
              `Command "${command} ${args.join(" ")}" timed out after ${options.timeout}ms`
            )
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
          err
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
    ];

    const isAllowed = allowedSequences.some((expectedArgs) => {
      if (args.length !== expectedArgs.length) return false;
      return args.every((arg, index) => arg === expectedArgs[index]);
    });
    if (!isAllowed) {
      const errorMessage = `Security Alert: Disallowed 'docker' arguments provided: ${args.join(" ")}. Only 'docker mcp server ls' and 'docker mcp gateway run' are permitted.`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  getMcpServerList(): Promise<string> {
    return this.executeCommand("docker", ["mcp", "server", "ls", "--json"]);
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

/**
 * Skill Installer
 *
 * Handles OS-aware CLI tool installation for skills.
 * Detects the current OS, CPU architecture, and available package managers,
 * then executes the appropriate install command.
 */

import * as os from "os";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import {
  SkillDefinition,
  InstallConfig,
  InstallResult,
  DependencyCheckResult,
  CpuArch,
} from "./interfaces";
import { isSafeCommandName } from "./shell-escape";

const execAsync = promisify(exec);

type Platform = "darwin" | "linux" | "windows";

interface PackageManager {
  name: string;
  checkCommand: string;
  installPrefix: string;
}

const PACKAGE_MANAGERS: Record<Platform, PackageManager[]> = {
  darwin: [
    {
      name: "brew",
      checkCommand: "brew --version",
      installPrefix: "brew install",
    },
    {
      name: "npm",
      checkCommand: "npm --version",
      installPrefix: "npm install -g",
    },
    {
      name: "pip",
      checkCommand: "pip3 --version",
      installPrefix: "pip3 install",
    },
  ],
  linux: [
    {
      name: "apt",
      checkCommand: "apt --version",
      installPrefix: "sudo apt install -y",
    },
    {
      name: "dnf",
      checkCommand: "dnf --version",
      installPrefix: "sudo dnf install -y",
    },
    {
      name: "pacman",
      checkCommand: "pacman --version",
      installPrefix: "sudo pacman -S --noconfirm",
    },
    {
      name: "snap",
      checkCommand: "snap --version",
      installPrefix: "sudo snap install",
    },
    {
      name: "npm",
      checkCommand: "npm --version",
      installPrefix: "npm install -g",
    },
    {
      name: "pip",
      checkCommand: "pip3 --version",
      installPrefix: "pip3 install",
    },
  ],
  windows: [
    {
      name: "scoop",
      checkCommand: "scoop --version",
      installPrefix: "scoop install",
    },
    {
      name: "choco",
      checkCommand: "choco --version",
      installPrefix: "choco install -y",
    },
    {
      name: "winget",
      checkCommand: "winget --version",
      installPrefix:
        "winget install --accept-package-agreements --accept-source-agreements",
    },
    {
      name: "npm",
      checkCommand: "npm --version",
      installPrefix: "npm install -g",
    },
    {
      name: "pip",
      checkCommand: "pip --version",
      installPrefix: "pip install",
    },
  ],
};

/** Homebrew install script */
const BREW_INSTALL_SCRIPT =
  '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"';

export class SkillInstaller {
  private readonly logger: Logger;
  private readonly platform: Platform;
  private readonly arch: CpuArch;
  private readonly extensionPath: string;
  private availablePackageManagers: Set<string> = new Set();
  private packageManagersChecked = false;

  constructor(extensionPath: string) {
    this.extensionPath = extensionPath;
    this.logger = Logger.initialize("SkillInstaller", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: false,
    });

    this.platform = this.detectPlatform();
    this.arch = this.detectArch();
    this.logger.log(
      LogLevel.INFO,
      `Platform detected: ${this.platform} (${this.arch})`,
    );
  }

  /**
   * Detect the current platform
   */
  private detectPlatform(): Platform {
    const platform = os.platform();
    if (platform === "darwin") return "darwin";
    if (platform === "win32") return "windows";
    return "linux";
  }

  /**
   * Detect CPU architecture (Intel x64 vs Apple Silicon arm64)
   */
  private detectArch(): CpuArch {
    const arch = os.arch();
    if (arch === "arm64") return "arm64";
    if (arch === "arm") return "arm";
    return "x64"; // x64, ia32, etc. default to x64
  }

  /**
   * Sanitize display name to prevent terminal injection
   * Only allows alphanumeric, spaces, hyphens, underscores, and dots
   */
  private sanitizeDisplayName(name: string): string {
    // Remove any characters that could cause issues in terminal names
    const sanitized = name.replace(/[^a-zA-Z0-9\s\-_./]/g, "").trim();
    // Truncate to reasonable length
    return sanitized.slice(0, 50) || "Unknown Skill";
  }

  /**
   * Validate a command before execution
   * Checks for potentially dangerous patterns
   * @returns Error message if invalid, null if valid
   */
  private validateCommand(command: string, context: string): string | null {
    // Reject empty commands
    if (!command || command.trim().length === 0) {
      return "Empty command";
    }

    // Reject commands that are suspiciously long (might indicate injection)
    if (command.length > 2000) {
      return "Command exceeds maximum allowed length";
    }

    // Dangerous patterns that should NEVER be in install/setup commands
    const dangerousPatterns = [
      // Directory escape attempts
      /\.\.\//g,
      // Null bytes (could bypass checks)
      /\x00/g,
      // Background execution without user visibility
      /&\s*$/,
      // Download and execute patterns (except known safe ones)
      /curl.*\|\s*(ba)?sh/i, // curl pipe to shell - warn but don't block for Homebrew
    ];

    // Patterns that are outright forbidden
    const forbiddenPatterns = [
      // Direct file writes that could be dangerous
      />\s*\/etc\//i,
      />\s*~\/\.\w/i, // Writing to hidden config files
      // rm -rf patterns that are clearly dangerous
      /rm\s+-rf?\s+[\/~]/i,
      // Eval with external content
      /eval\s+\$\(/i,
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(command)) {
        this.logger.warn(
          `Forbidden command pattern detected in ${context}: ${pattern.toString()}`,
        );
        return `Command contains forbidden pattern: ${pattern.toString()}`;
      }
    }

    // Log warnings for suspicious patterns but allow (user will see the command)
    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        this.logger.warn(
          `Potentially risky command pattern in ${context}: ${pattern.toString()}`,
        );
        // For curl|sh we warn but allow, as Homebrew uses this legitimately
        if (/curl.*\|\s*(ba)?sh/i.test(command)) {
          this.logger.info(
            "Allowing curl|sh pattern (common for package managers)",
          );
        }
      }
    }

    return null; // Command is valid
  }

  /**
   * Check which package managers are available on this system
   */
  public async detectPackageManagers(): Promise<Set<string>> {
    if (this.packageManagersChecked) {
      return this.availablePackageManagers;
    }

    const managers = PACKAGE_MANAGERS[this.platform];

    // Check all managers in parallel for speed
    const checks = managers.map(async (manager) => {
      try {
        await execAsync(manager.checkCommand);
        this.availablePackageManagers.add(manager.name);
        this.logger.log(
          LogLevel.DEBUG,
          `Package manager found: ${manager.name}`,
        );
      } catch {
        // Package manager not available
      }
    });

    await Promise.all(checks);

    this.packageManagersChecked = true;
    this.logger.log(
      LogLevel.INFO,
      `Available package managers: ${Array.from(this.availablePackageManagers).join(", ") || "none"}`,
    );

    return this.availablePackageManagers;
  }

  /**
   * Check if a skill's CLI dependency is installed
   */
  public async checkInstalled(
    skill: SkillDefinition,
  ): Promise<DependencyCheckResult> {
    if (!skill.dependencies) {
      // No dependencies means always "installed"
      return { installed: true };
    }

    const { checkCommand, cli } = skill.dependencies;

    try {
      const { stdout } = await execAsync(checkCommand);
      const version = this.extractVersion(stdout);

      // Try to find the binary path
      const binaryPath = await this.findBinaryPath(cli);

      return {
        installed: true,
        version,
        binaryPath,
      };
    } catch {
      return { installed: false };
    }
  }

  /**
   * Extract version string from command output
   */
  private extractVersion(output: string): string | undefined {
    // Common version patterns
    const patterns = [
      /v?(\d+\.\d+\.\d+)/,
      /version\s*[:\s]?\s*v?(\d+\.\d+\.\d+)/i,
      /(\d+\.\d+\.\d+)/,
    ];

    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  /**
   * Find the path to a binary
   */
  private async findBinaryPath(cli: string): Promise<string | undefined> {
    try {
      const command =
        this.platform === "windows" ? `where ${cli}` : `which ${cli}`;
      const { stdout } = await execAsync(command);
      return stdout.trim().split("\n")[0];
    } catch {
      return undefined;
    }
  }

  /**
   * Get the install command for a skill on the current OS
   */
  public async getInstallCommand(
    skill: SkillDefinition,
  ): Promise<string | null> {
    if (!skill.dependencies?.install) {
      return null;
    }

    const platformConfig = skill.dependencies.install[this.platform];
    if (!platformConfig) {
      return null;
    }

    // Ensure package managers are detected
    await this.detectPackageManagers();

    // Try each package manager in order of preference
    const command = await this.resolveInstallCommand(platformConfig);
    if (command) {
      return command;
    }

    // Fall back to script if available
    if (platformConfig.script) {
      return platformConfig.script;
    }

    return null;
  }

  /**
   * Resolve the best install command based on available package managers
   */
  private async resolveInstallCommand(
    config: InstallConfig,
  ): Promise<string | null> {
    // Check for architecture-specific script first (for macOS Intel/ARM)
    if (config.scriptArch) {
      const archScript = config.scriptArch[this.arch];
      if (archScript) {
        return archScript;
      }
    }

    // Check for direct download by architecture
    if (config.download) {
      const downloadUrl = config.download[this.arch];
      if (downloadUrl) {
        // Return curl command to download
        return `curl -fsSL -o /tmp/download "${downloadUrl}" && chmod +x /tmp/download`;
      }
    }

    // Platform-specific package manager priorities
    const priorities: Array<{ key: keyof InstallConfig; prefix: string }> = [];

    if (this.platform === "darwin") {
      // On macOS, try brew first, then npm/pip as fallbacks
      if (config.brew && this.availablePackageManagers.has("brew")) {
        priorities.push({ key: "brew", prefix: "brew install" });
      }
      if (config.npm && this.availablePackageManagers.has("npm")) {
        priorities.push({ key: "npm", prefix: "npm install -g" });
      }
      if (config.pip && this.availablePackageManagers.has("pip")) {
        priorities.push({ key: "pip", prefix: "pip3 install" });
      }
      if (config.go) {
        // go install is usually available if Go is installed
        priorities.push({ key: "go", prefix: "go install" });
      }
    } else if (this.platform === "linux") {
      if (config.apt && this.availablePackageManagers.has("apt")) {
        priorities.push({ key: "apt", prefix: "sudo apt install -y" });
      }
      if (config.dnf && this.availablePackageManagers.has("dnf")) {
        priorities.push({ key: "dnf", prefix: "sudo dnf install -y" });
      }
      if (config.pacman && this.availablePackageManagers.has("pacman")) {
        priorities.push({
          key: "pacman",
          prefix: "sudo pacman -S --noconfirm",
        });
      }
      if (config.snap && this.availablePackageManagers.has("snap")) {
        priorities.push({ key: "snap", prefix: "sudo snap install" });
      }
      if (config.npm && this.availablePackageManagers.has("npm")) {
        priorities.push({ key: "npm", prefix: "npm install -g" });
      }
      if (config.pip && this.availablePackageManagers.has("pip")) {
        priorities.push({ key: "pip", prefix: "pip3 install" });
      }
      if (config.go) {
        priorities.push({ key: "go", prefix: "go install" });
      }
    } else if (this.platform === "windows") {
      if (config.scoop && this.availablePackageManagers.has("scoop")) {
        priorities.push({ key: "scoop", prefix: "scoop install" });
      }
      if (config.choco && this.availablePackageManagers.has("choco")) {
        priorities.push({ key: "choco", prefix: "choco install -y" });
      }
      if (config.winget && this.availablePackageManagers.has("winget")) {
        priorities.push({
          key: "winget",
          prefix:
            "winget install --accept-package-agreements --accept-source-agreements",
        });
      }
      if (config.npm && this.availablePackageManagers.has("npm")) {
        priorities.push({ key: "npm", prefix: "npm install -g" });
      }
      if (config.pip && this.availablePackageManagers.has("pip")) {
        priorities.push({ key: "pip", prefix: "pip install" });
      }
      if (config.go) {
        priorities.push({ key: "go", prefix: "go install" });
      }
    }

    for (const { key, prefix } of priorities) {
      const pkg = config[key];
      if (pkg && typeof pkg === "string") {
        return `${prefix} ${pkg}`;
      }
    }

    // Fall back to generic script
    if (config.script) {
      return config.script;
    }

    return null;
  }

  /**
   * Install a skill's CLI dependency
   */
  public async install(skill: SkillDefinition): Promise<InstallResult> {
    // Collect all available install methods
    const methods = await this.getAvailableInstallMethods(skill);
    const availableMethods = methods.filter((m) => m.available);

    if (availableMethods.length === 0) {
      // Check if brew needs to be installed on macOS
      if (this.platform === "darwin") {
        const brewStatus = await this.checkHomebrewStatus();
        if (!brewStatus.installed) {
          const action = await vscode.window.showWarningMessage(
            `${skill.displayName} requires Homebrew which is not installed. Would you like to install it?`,
            "Install Homebrew",
            "Show Manual Steps",
            "Cancel",
          );

          if (action === "Install Homebrew") {
            await this.executeInTerminal(
              brewStatus.installCommand!,
              "Homebrew",
            );
            return {
              success: true,
              command: brewStatus.installCommand,
              message:
                "Installing Homebrew. After it completes, retry installing " +
                skill.displayName,
            };
          } else if (action === "Show Manual Steps") {
            const platformConfig = skill.dependencies?.install?.[this.platform];
            if (platformConfig?.manual) {
              vscode.window.showInformationMessage(platformConfig.manual);
            } else {
              vscode.env.openExternal(vscode.Uri.parse("https://brew.sh"));
            }
          }

          return { success: false, error: "Homebrew installation required" };
        }
      }

      return {
        success: false,
        error: `No install method available for ${skill.displayName} on ${this.platform} (${this.arch})`,
      };
    }

    // If only one method available, use it directly
    if (availableMethods.length === 1) {
      const method = availableMethods[0];
      this.logger.log(
        LogLevel.INFO,
        `Installing ${skill.displayName} via ${method.method}: ${method.command}`,
      );
      return this.executeInTerminal(method.command, skill.displayName);
    }

    // Multiple methods available - let user choose
    const items = availableMethods.map((m) => ({
      label: m.method,
      description: m.method.includes("Bundled")
        ? "(Recommended - installs to .codebuddy/bin/)"
        : "",
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `Select install method for ${skill.displayName}`,
      title: "Choose Installation Method",
    });

    if (selected) {
      const method = availableMethods.find((m) => m.method === selected.label);
      if (method) {
        this.logger.log(
          LogLevel.INFO,
          `Installing ${skill.displayName} via ${method.method}: ${method.command}`,
        );
        return this.executeInTerminal(method.command, skill.displayName);
      }
    }

    return { success: false, error: "Installation cancelled" };
  }

  /**
   * Execute an install command in VS Code's integrated terminal
   * Validates the command before execution to prevent injection attacks.
   */
  private async executeInTerminal(
    command: string,
    displayName: string,
  ): Promise<InstallResult> {
    // Validate command before execution
    const validationError = this.validateCommand(
      command,
      `install:${displayName}`,
    );
    if (validationError) {
      this.logger.error(
        `Command validation failed for ${displayName}: ${validationError}`,
      );
      return {
        success: false,
        error: `Security: ${validationError}`,
      };
    }

    // Sanitize display name for terminal
    const safeDisplayName = this.sanitizeDisplayName(displayName);

    return new Promise((resolve) => {
      const terminal = vscode.window.createTerminal({
        name: `Install: ${safeDisplayName}`,
        message: `Installing ${safeDisplayName}...\n`,
      });

      terminal.show();
      terminal.sendText(command);

      // We can't directly get the exit code from VS Code terminals
      // So we provide a best-effort result
      // The user will see the terminal output for verification
      // NOTE: Command is logged for debugging but this could be a security concern
      // if it contains sensitive data. Consider masking in production.
      this.logger.log(
        LogLevel.INFO,
        `Install command sent to terminal for: ${safeDisplayName}`,
      );

      // Give user instructions
      vscode.window
        .showInformationMessage(
          `Installing ${safeDisplayName}. Check the terminal for progress.`,
          "Verify Installation",
        )
        .then((action) => {
          if (action === "Verify Installation") {
            vscode.commands.executeCommand(
              "codebuddy.skills.verifyInstall",
              safeDisplayName,
            );
          }
        });

      resolve({
        success: true,
        command,
      });
    });
  }

  /**
   * Run a skill's setup command in the terminal
   * Validates the setup command before execution to prevent injection attacks.
   */
  public async runSetupCommand(skill: SkillDefinition): Promise<void> {
    if (!skill.auth?.setupCommand) {
      vscode.window.showWarningMessage(
        `No setup command available for ${skill.displayName}`,
      );
      return;
    }

    // Validate setup command
    const validationError = this.validateCommand(
      skill.auth.setupCommand,
      `setup:${skill.name}`,
    );
    if (validationError) {
      this.logger.error(
        `Setup command validation failed for ${skill.name}: ${validationError}`,
      );
      vscode.window.showErrorMessage(
        `Cannot run setup: ${validationError}. Please check the skill configuration.`,
      );
      return;
    }

    // Sanitize display name
    const safeDisplayName = this.sanitizeDisplayName(skill.displayName);

    const terminal = vscode.window.createTerminal({
      name: `Setup: ${safeDisplayName}`,
      message: `Running setup for ${safeDisplayName}...\n`,
    });

    terminal.show();
    terminal.sendText(skill.auth.setupCommand);

    this.logger.log(
      LogLevel.INFO,
      `Setup command sent to terminal for: ${safeDisplayName}`,
    );
  }

  /**
   * Get information about the current platform
   */
  public getPlatformInfo(): {
    platform: Platform;
    arch: CpuArch;
    packageManagers: string[];
  } {
    return {
      platform: this.platform,
      arch: this.arch,
      packageManagers: Array.from(this.availablePackageManagers),
    };
  }

  /**
   * Check if Homebrew is available (macOS specific)
   * Returns install instructions if not available
   */
  public async checkHomebrewStatus(): Promise<{
    installed: boolean;
    installCommand?: string;
    message?: string;
  }> {
    if (this.platform !== "darwin") {
      return { installed: true }; // N/A for non-macOS
    }

    await this.detectPackageManagers();

    if (this.availablePackageManagers.has("brew")) {
      return { installed: true };
    }

    return {
      installed: false,
      installCommand: BREW_INSTALL_SCRIPT,
      message:
        "Homebrew is recommended for installing CLI tools on macOS. " +
        "Install it or use alternative methods (npm, pip, direct download).",
    };
  }

  /**
   * Get all available install methods for a skill
   * Useful for showing alternatives when primary method isn't available
   */
  public async getAvailableInstallMethods(
    skill: SkillDefinition,
  ): Promise<Array<{ method: string; command: string; available: boolean }>> {
    await this.detectPackageManagers();
    const methods: Array<{
      method: string;
      command: string;
      available: boolean;
    }> = [];

    // Check for bundled install script first (preferred - local install)
    if (skill.dependencies?.bundledInstall) {
      const scriptPath = `${this.extensionPath}/${skill.dependencies.bundledInstall}`;
      methods.push({
        method: "Bundled Install (Local)",
        command: `bash "${scriptPath}"`,
        available: true,
      });
    }

    if (!skill.dependencies?.install) {
      return methods;
    }

    const platformConfig = skill.dependencies.install[this.platform];
    if (!platformConfig) {
      return methods;
    }

    // Map all possible install methods
    const methodMappings: Array<{
      key: keyof InstallConfig;
      name: string;
      prefix: string;
      manager?: string;
    }> = [
      {
        key: "brew",
        name: "Homebrew",
        prefix: "brew install",
        manager: "brew",
      },
      {
        key: "apt",
        name: "APT",
        prefix: "sudo apt install -y",
        manager: "apt",
      },
      {
        key: "dnf",
        name: "DNF",
        prefix: "sudo dnf install -y",
        manager: "dnf",
      },
      {
        key: "pacman",
        name: "Pacman",
        prefix: "sudo pacman -S --noconfirm",
        manager: "pacman",
      },
      {
        key: "snap",
        name: "Snap",
        prefix: "sudo snap install",
        manager: "snap",
      },
      {
        key: "scoop",
        name: "Scoop",
        prefix: "scoop install",
        manager: "scoop",
      },
      {
        key: "choco",
        name: "Chocolatey",
        prefix: "choco install -y",
        manager: "choco",
      },
      {
        key: "winget",
        name: "Winget",
        prefix: "winget install",
        manager: "winget",
      },
      { key: "npm", name: "npm", prefix: "npm install -g", manager: "npm" },
      { key: "pip", name: "pip", prefix: "pip3 install", manager: "pip" },
      { key: "go", name: "Go", prefix: "go install" },
      { key: "script", name: "Shell Script", prefix: "" },
    ];

    for (const mapping of methodMappings) {
      const value = platformConfig[mapping.key];
      if (value && typeof value === "string") {
        const available = mapping.manager
          ? this.availablePackageManagers.has(mapping.manager)
          : true;
        methods.push({
          method: mapping.name,
          command: mapping.prefix ? `${mapping.prefix} ${value}` : value,
          available,
        });
      }
    }

    // Add architecture-specific downloads
    if (platformConfig.download) {
      const downloadUrl = platformConfig.download[this.arch];
      if (downloadUrl) {
        methods.push({
          method: `Direct Download (${this.arch})`,
          command: `curl -fsSL -O "${downloadUrl}"`,
          available: true,
        });
      }
    }

    // Add manual instructions
    if (platformConfig.manual) {
      methods.push({
        method: "Manual",
        command: platformConfig.manual,
        available: true,
      });
    }

    return methods;
  }

  /**
   * Check if any package manager is available
   */
  public async hasPackageManager(): Promise<boolean> {
    await this.detectPackageManagers();
    return this.availablePackageManagers.size > 0;
  }
}

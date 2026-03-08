/**
 * Skill Handler
 *
 * Handles webview messages related to skills.
 * Provides CRUD operations and installation management for skills.
 */

import * as vscode from "vscode";
import { WebviewMessageHandler, HandlerContext } from "./types";
import {
  SkillService,
  Skill,
  SkillCategoryInfo,
  SkillEnvironment,
} from "../../services/skill";

// ============================================
// Message Type Definitions
// ============================================

/**
 * Base interface for all skill-related messages
 */
interface SkillMessageBase {
  command: string;
}

/**
 * Message for enabling a skill
 */
interface EnableSkillMessage extends SkillMessageBase {
  command: "enable-skill";
  skillId: string;
  scope?: "workspace" | "global";
}

/**
 * Message for disabling a skill
 */
interface DisableSkillMessage extends SkillMessageBase {
  command: "disable-skill";
  skillId: string;
}

/**
 * Message for checking skill dependencies
 */
interface CheckSkillDepsMessage extends SkillMessageBase {
  command: "check-skill-deps";
  skillId: string;
}

/**
 * Message for installing skill dependencies
 */
interface InstallSkillDepsMessage extends SkillMessageBase {
  command: "install-skill-deps";
  skillId: string;
}

/**
 * Message for configuring a skill
 */
interface ConfigureSkillMessage extends SkillMessageBase {
  command: "configure-skill";
  skillId: string;
  config?: Record<string, string | number | boolean>;
}

/**
 * Message for running skill setup
 */
interface RunSkillSetupMessage extends SkillMessageBase {
  command: "run-skill-setup";
  skillId: string;
}

/**
 * Simple message types for commands without additional parameters
 */
interface GetSkillsMessage {
  command: "get-skills";
}

interface GetSkillCategoriesMessage {
  command: "get-skill-categories";
}

interface GetPlatformInfoMessage {
  command: "get-platform-info";
}

interface RefreshSkillsMessage {
  command: "refresh-skills";
}

/**
 * Message for getting skill environments
 */
interface GetSkillEnvironmentsMessage extends SkillMessageBase {
  command: "get-skill-environments";
  skillId: string;
}

/**
 * Message for creating a skill environment
 */
interface CreateSkillEnvironmentMessage extends SkillMessageBase {
  command: "create-skill-environment";
  skillId: string;
  environment?: Omit<SkillEnvironment, "createdAt">;
}

/**
 * Message for switching skill environment
 */
interface SwitchSkillEnvironmentMessage extends SkillMessageBase {
  command: "switch-skill-environment";
  skillId: string;
  environmentId?: string;
}

/**
 * Message for configuring a skill environment
 */
interface ConfigureSkillEnvironmentMessage extends SkillMessageBase {
  command: "configure-skill-environment";
  skillId: string;
  environmentId: string;
  config?: Record<string, string | number | boolean>;
}

/**
 * Message for deleting a skill environment
 */
interface DeleteSkillEnvironmentMessage extends SkillMessageBase {
  command: "delete-skill-environment";
  skillId: string;
  environmentId: string;
}

/**
 * Union type for all skill messages
 */
type SkillMessage =
  | EnableSkillMessage
  | DisableSkillMessage
  | CheckSkillDepsMessage
  | InstallSkillDepsMessage
  | ConfigureSkillMessage
  | RunSkillSetupMessage
  | GetSkillsMessage
  | GetSkillCategoriesMessage
  | GetPlatformInfoMessage
  | RefreshSkillsMessage
  | GetSkillEnvironmentsMessage
  | CreateSkillEnvironmentMessage
  | SwitchSkillEnvironmentMessage
  | ConfigureSkillEnvironmentMessage
  | DeleteSkillEnvironmentMessage;

// ============================================
// Handler Implementation
// ============================================

export class SkillHandler implements WebviewMessageHandler {
  readonly commands = [
    "get-skills",
    "get-skill-categories",
    "enable-skill",
    "disable-skill",
    "check-skill-deps",
    "install-skill-deps",
    "configure-skill",
    "run-skill-setup",
    "get-platform-info",
    "refresh-skills",
    // Environment management
    "get-skill-environments",
    "create-skill-environment",
    "switch-skill-environment",
    "configure-skill-environment",
    "delete-skill-environment",
  ];

  private getSkillService(): SkillService {
    return SkillService.getInstance();
  }

  /**
   * Send the skills list to the webview
   */
  private async postSkillsList(ctx: HandlerContext): Promise<void> {
    try {
      const skills = await this.getSkillService().getSkills();
      await ctx.webview.webview.postMessage({
        type: "skills-list",
        skills,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ctx.logger.error("Failed to get skills list", error);
      await ctx.webview.webview.postMessage({
        type: "skills-error",
        error: errorMessage,
      });
    }
  }

  /**
   * Send skill categories to the webview
   */
  private async postCategories(ctx: HandlerContext): Promise<void> {
    const categories = this.getSkillService().getCategories();
    await ctx.webview.webview.postMessage({
      type: "skill-categories",
      categories,
    });
  }

  /**
   * Handle incoming webview messages
   */
  async handle(message: SkillMessage, ctx: HandlerContext): Promise<void> {
    const service = this.getSkillService();

    switch (message.command) {
      case "get-skills":
        await this.postSkillsList(ctx);
        break;

      case "get-skill-categories":
        await this.postCategories(ctx);
        break;

      case "enable-skill":
        await this.handleEnableSkill(message, ctx);
        break;

      case "disable-skill":
        await this.handleDisableSkill(message, ctx);
        break;

      case "check-skill-deps":
        await this.handleCheckDeps(message, ctx);
        break;

      case "install-skill-deps":
        await this.handleInstallDeps(message, ctx);
        break;

      case "configure-skill":
        await this.handleConfigure(message, ctx);
        break;

      case "run-skill-setup":
        await this.handleRunSetup(message, ctx);
        break;

      case "get-platform-info":
        await this.handleGetPlatformInfo(ctx);
        break;

      case "refresh-skills":
        await this.handleRefreshSkills(ctx);
        break;

      // Environment management
      case "get-skill-environments":
        await this.handleGetEnvironments(message, ctx);
        break;

      case "create-skill-environment":
        await this.handleCreateEnvironment(message, ctx);
        break;

      case "switch-skill-environment":
        await this.handleSwitchEnvironment(message, ctx);
        break;

      case "configure-skill-environment":
        await this.handleConfigureEnvironment(message, ctx);
        break;

      case "delete-skill-environment":
        await this.handleDeleteEnvironment(message, ctx);
        break;
    }
  }

  /**
   * Handle enabling a skill
   */
  private async handleEnableSkill(
    message: EnableSkillMessage,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId, scope = "workspace" } = message;

    try {
      const result = await this.getSkillService().enableSkill(skillId, scope);

      if (result.requiresInstall) {
        // Send back that installation is required
        await ctx.webview.webview.postMessage({
          type: "skill-requires-install",
          skillId,
          installCommand: result.installCommand,
        });
        return;
      }

      if (result.requiresConfig) {
        // Send back that configuration is required
        await ctx.webview.webview.postMessage({
          type: "skill-requires-config",
          skillId,
        });
      }

      if (result.success) {
        // Use status bar for non-intrusive feedback on routine operations
        vscode.window.setStatusBarMessage(`✓ Skill "${skillId}" enabled`, 3000);
      } else if (result.error) {
        vscode.window.showErrorMessage(
          `Failed to enable skill: ${result.error}`,
        );
      }

      await this.postSkillsList(ctx);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ctx.logger.error(`Failed to enable skill ${skillId}`, error);
      vscode.window.showErrorMessage(`Failed to enable skill: ${errorMessage}`);
    }
  }

  /**
   * Handle disabling a skill
   */
  private async handleDisableSkill(
    message: DisableSkillMessage,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId } = message;

    try {
      const result = await this.getSkillService().disableSkill(skillId);

      if (result.success) {
        // Use status bar for non-intrusive feedback on routine operations
        vscode.window.setStatusBarMessage(
          `✓ Skill "${skillId}" disabled`,
          3000,
        );
      } else if (result.error) {
        vscode.window.showErrorMessage(
          `Failed to disable skill: ${result.error}`,
        );
      }

      await this.postSkillsList(ctx);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ctx.logger.error(`Failed to disable skill ${skillId}`, error);
      vscode.window.showErrorMessage(
        `Failed to disable skill: ${errorMessage}`,
      );
    }
  }

  /**
   * Handle checking skill dependencies
   */
  private async handleCheckDeps(
    message: CheckSkillDepsMessage,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId } = message;

    try {
      const result = await this.getSkillService().checkDependencies(skillId);

      await ctx.webview.webview.postMessage({
        type: "skill-deps-check",
        skillId,
        result,
      });
    } catch (error: unknown) {
      ctx.logger.error(`Failed to check dependencies for ${skillId}`, error);
    }
  }

  /**
   * Handle installing skill dependencies
   */
  private async handleInstallDeps(
    message: InstallSkillDepsMessage,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId } = message;

    try {
      const skill = await this.getSkillService().getSkill(skillId);
      if (!skill) {
        vscode.window.showErrorMessage(`Skill not found: ${skillId}`);
        return;
      }

      // Show confirmation dialog
      const action = await vscode.window.showInformationMessage(
        `Install ${skill.dependencies?.cli || skillId}?`,
        {
          modal: true,
          detail: `This will install the CLI tool required for the ${skill.displayName} skill.`,
        },
        "Install",
        "Cancel",
      );

      if (action !== "Install") {
        return;
      }

      const result = await this.getSkillService().installDependencies(skillId);

      await ctx.webview.webview.postMessage({
        type: "skill-install-result",
        skillId,
        result,
      });

      if (result.success) {
        // After installation, try to enable the skill again
        const enableResult = await this.getSkillService().enableSkill(skillId);

        if (enableResult.success) {
          vscode.window.showInformationMessage(
            `${skill.displayName} installed and enabled successfully!`,
          );
        }

        await this.postSkillsList(ctx);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ctx.logger.error(`Failed to install dependencies for ${skillId}`, error);
      vscode.window.showErrorMessage(`Installation failed: ${errorMessage}`);
    }
  }

  /**
   * Handle skill configuration
   */
  private async handleConfigure(
    message: ConfigureSkillMessage,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId, config } = message;

    try {
      const skill = await this.getSkillService().getSkill(skillId);
      if (!skill) {
        vscode.window.showErrorMessage(`Skill not found: ${skillId}`);
        return;
      }

      // If config is provided from UI, save it directly
      if (config && Object.keys(config).length > 0) {
        const result = await this.getSkillService().configureSkill(
          skillId,
          config,
        );

        if (result.success) {
          vscode.window.showInformationMessage(
            `${skill.displayName} configured successfully`,
          );
          await this.postSkillsList(ctx);
        } else {
          vscode.window.showErrorMessage(
            `Configuration failed: ${result.error}`,
          );
        }
        return;
      }

      // If no config provided, show guided configuration via VS Code input boxes
      if (!skill.config || skill.config.length === 0) {
        vscode.window.showInformationMessage(
          `${skill.displayName} doesn't require configuration`,
        );
        return;
      }

      const newConfig: Record<string, string | number | boolean> = {};
      let cancelled = false;

      for (const field of skill.config) {
        const value = await vscode.window.showInputBox({
          title: `Configure ${skill.displayName}`,
          prompt: field.label,
          placeHolder: field.placeholder,
          password: field.type === "secret",
          ignoreFocusOut: true,
          value: skill.state.configValues?.[field.name]?.toString() || "",
        });

        if (value === undefined) {
          cancelled = true;
          break;
        }

        if (field.required && !value) {
          vscode.window.showWarningMessage(`${field.label} is required`);
          cancelled = true;
          break;
        }

        newConfig[field.name] = value;
      }

      if (!cancelled) {
        const result = await this.getSkillService().configureSkill(
          skillId,
          newConfig,
        );

        if (result.success) {
          // Use status bar for non-intrusive feedback
          vscode.window.setStatusBarMessage(
            `✓ ${skill.displayName} configured successfully`,
            3000,
          );
          await this.postSkillsList(ctx);
        } else {
          vscode.window.showErrorMessage(
            `Configuration failed: ${result.error}`,
          );
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ctx.logger.error(`Failed to configure skill ${skillId}`, error);
      vscode.window.showErrorMessage(`Configuration failed: ${errorMessage}`);
    }
  }

  /**
   * Handle running skill setup command
   */
  private async handleRunSetup(
    message: RunSkillSetupMessage,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId } = message;

    try {
      const skill = await this.getSkillService().getSkill(skillId);
      if (!skill) {
        vscode.window.showErrorMessage(`Skill not found: ${skillId}`);
        return;
      }

      if (!skill.auth?.setupCommand) {
        vscode.window.showWarningMessage(
          `${skill.displayName} doesn't have a setup command`,
        );
        return;
      }

      await this.getSkillService().runSetupCommand(skillId);

      // Mark as needing verification after setup
      await ctx.webview.webview.postMessage({
        type: "skill-setup-started",
        skillId,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ctx.logger.error(`Failed to run setup for ${skillId}`, error);
      vscode.window.showErrorMessage(`Setup failed: ${errorMessage}`);
    }
  }

  /**
   * Handle getting platform information
   */
  private async handleGetPlatformInfo(ctx: HandlerContext): Promise<void> {
    try {
      const info = this.getSkillService().getPlatformInfo();

      await ctx.webview.webview.postMessage({
        type: "platform-info",
        ...info,
      });
    } catch (error: unknown) {
      ctx.logger.error("Failed to get platform info", error);
    }
  }

  /**
   * Handle refreshing skills from disk
   * Reloads all skill definitions and cleans up orphaned states
   */
  private async handleRefreshSkills(ctx: HandlerContext): Promise<void> {
    try {
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      await this.getSkillService().reload(workspacePath);

      vscode.window.setStatusBarMessage("✓ Skills refreshed from disk", 3000);
      await this.postSkillsList(ctx);
      await this.postCategories(ctx);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ctx.logger.error("Failed to refresh skills", error);
      vscode.window.showErrorMessage(
        `Failed to refresh skills: ${errorMessage}`,
      );
    }
  }

  // ============================================
  // Environment Management Handlers
  // ============================================

  /**
   * Handle getting environments for a skill
   */
  private async handleGetEnvironments(
    message: GetSkillEnvironmentsMessage,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId } = message;

    try {
      const service = this.getSkillService();
      const environments = service.getEnvironments(skillId);
      const activeEnv = service.getActiveEnvironment(skillId);

      await ctx.webview.webview.postMessage({
        type: "skill-environments",
        skillId,
        environments,
        activeEnvironmentId: activeEnv?.id,
      });
    } catch (error: unknown) {
      ctx.logger.error(`Failed to get environments for ${skillId}`, error);
    }
  }

  /**
   * Handle creating a new environment
   */
  private async handleCreateEnvironment(
    message: CreateSkillEnvironmentMessage,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId, environment } = message;

    try {
      const service = this.getSkillService();

      // If environment data is provided from UI, create directly
      if (environment) {
        const result = await service.createEnvironment(skillId, environment);

        await ctx.webview.webview.postMessage({
          type: "skill-environment-created",
          skillId,
          success: result.success,
          error: result.error,
        });

        if (result.success) {
          // Refresh environments list
          await this.handleGetEnvironments(
            { command: "get-skill-environments", skillId },
            ctx,
          );
          await this.postSkillsList(ctx);
        }
        return;
      }

      // If no data provided, show interactive prompt
      const newEnv = await service.promptCreateEnvironment(skillId);

      if (newEnv) {
        await ctx.webview.webview.postMessage({
          type: "skill-environment-created",
          skillId,
          success: true,
          environment: newEnv,
        });
        await this.handleGetEnvironments(
          { command: "get-skill-environments", skillId },
          ctx,
        );
        await this.postSkillsList(ctx);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ctx.logger.error(`Failed to create environment for ${skillId}`, error);
      vscode.window.showErrorMessage(
        `Failed to create environment: ${errorMessage}`,
      );
    }
  }

  /**
   * Handle switching active environment
   */
  private async handleSwitchEnvironment(
    message: SwitchSkillEnvironmentMessage,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId, environmentId } = message;

    try {
      const service = this.getSkillService();

      // If environmentId provided, switch directly
      if (environmentId) {
        const result = await service.switchEnvironment(skillId, environmentId);

        await ctx.webview.webview.postMessage({
          type: "skill-environment-switched",
          skillId,
          environmentId,
          success: result.success,
          error: result.error,
        });

        if (result.success) {
          await this.handleGetEnvironments(
            { command: "get-skill-environments", skillId },
            ctx,
          );
          await this.postSkillsList(ctx);
        }
        return;
      }

      // If no environmentId, show QuickPick
      const switched = await service.promptSwitchEnvironment(skillId);

      if (switched) {
        await this.handleGetEnvironments(
          { command: "get-skill-environments", skillId },
          ctx,
        );
        await this.postSkillsList(ctx);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ctx.logger.error(`Failed to switch environment for ${skillId}`, error);
      vscode.window.showErrorMessage(
        `Failed to switch environment: ${errorMessage}`,
      );
    }
  }

  /**
   * Handle configuring an environment's credentials
   */
  private async handleConfigureEnvironment(
    message: ConfigureSkillEnvironmentMessage,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId, environmentId, config } = message;

    try {
      const service = this.getSkillService();

      // If config data is provided from UI, configure directly
      if (config && Object.keys(config).length > 0) {
        const result = await service.configureEnvironment(
          skillId,
          environmentId,
          config,
        );

        await ctx.webview.webview.postMessage({
          type: "skill-environment-configured",
          skillId,
          environmentId,
          success: result.success,
          error: result.error,
        });

        if (result.success) {
          await this.postSkillsList(ctx);
        }
        return;
      }

      // If no config provided, show interactive prompt
      const configured = await service.promptConfigureEnvironment(
        skillId,
        environmentId,
      );

      if (configured) {
        await ctx.webview.webview.postMessage({
          type: "skill-environment-configured",
          skillId,
          environmentId,
          success: true,
        });
        await this.postSkillsList(ctx);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ctx.logger.error(
        `Failed to configure environment ${environmentId} for ${skillId}`,
        error,
      );
      vscode.window.showErrorMessage(
        `Failed to configure environment: ${errorMessage}`,
      );
    }
  }

  /**
   * Handle deleting an environment
   */
  private async handleDeleteEnvironment(
    message: DeleteSkillEnvironmentMessage,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId, environmentId } = message;

    try {
      const service = this.getSkillService();
      const skill = await service.getSkill(skillId);
      const env = service
        .getEnvironments(skillId)
        .find((e) => e.id === environmentId);

      // Confirm deletion
      const confirm = await vscode.window.showWarningMessage(
        `Delete "${env?.displayName ?? environmentId}" environment from ${skill?.displayName ?? skillId}?`,
        {
          modal: true,
          detail: "This will remove all credentials for this environment.",
        },
        "Delete",
        "Cancel",
      );

      if (confirm !== "Delete") {
        return;
      }

      const result = await service.deleteEnvironment(skillId, environmentId);

      await ctx.webview.webview.postMessage({
        type: "skill-environment-deleted",
        skillId,
        environmentId,
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        // Use status bar for non-intrusive feedback
        vscode.window.setStatusBarMessage(
          `✓ Deleted "${env?.displayName ?? environmentId}" environment`,
          3000,
        );
        await this.handleGetEnvironments(
          { command: "get-skill-environments", skillId },
          ctx,
        );
        await this.postSkillsList(ctx);
      } else {
        vscode.window.showErrorMessage(
          `Failed to delete environment: ${result.error}`,
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      ctx.logger.error(
        `Failed to delete environment ${environmentId} for ${skillId}`,
        error,
      );
      vscode.window.showErrorMessage(
        `Failed to delete environment: ${errorMessage}`,
      );
    }
  }
}

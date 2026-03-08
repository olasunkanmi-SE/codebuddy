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
    } catch (error: any) {
      ctx.logger.error("Failed to get skills list", error);
      await ctx.webview.webview.postMessage({
        type: "skills-error",
        error: error.message,
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
  async handle(message: any, ctx: HandlerContext): Promise<void> {
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
    message: any,
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
        vscode.window.showInformationMessage(`Skill "${skillId}" enabled`);
      } else if (result.error) {
        vscode.window.showErrorMessage(
          `Failed to enable skill: ${result.error}`,
        );
      }

      await this.postSkillsList(ctx);
    } catch (error: any) {
      ctx.logger.error(`Failed to enable skill ${skillId}`, error);
      vscode.window.showErrorMessage(
        `Failed to enable skill: ${error.message}`,
      );
    }
  }

  /**
   * Handle disabling a skill
   */
  private async handleDisableSkill(
    message: any,
    ctx: HandlerContext,
  ): Promise<void> {
    const { skillId } = message;

    try {
      const result = await this.getSkillService().disableSkill(skillId);

      if (result.success) {
        vscode.window.showInformationMessage(`Skill "${skillId}" disabled`);
      } else if (result.error) {
        vscode.window.showErrorMessage(
          `Failed to disable skill: ${result.error}`,
        );
      }

      await this.postSkillsList(ctx);
    } catch (error: any) {
      ctx.logger.error(`Failed to disable skill ${skillId}`, error);
      vscode.window.showErrorMessage(
        `Failed to disable skill: ${error.message}`,
      );
    }
  }

  /**
   * Handle checking skill dependencies
   */
  private async handleCheckDeps(
    message: any,
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
    } catch (error: any) {
      ctx.logger.error(`Failed to check dependencies for ${skillId}`, error);
    }
  }

  /**
   * Handle installing skill dependencies
   */
  private async handleInstallDeps(
    message: any,
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
    } catch (error: any) {
      ctx.logger.error(`Failed to install dependencies for ${skillId}`, error);
      vscode.window.showErrorMessage(`Installation failed: ${error.message}`);
    }
  }

  /**
   * Handle skill configuration
   */
  private async handleConfigure(
    message: any,
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
          vscode.window.showInformationMessage(
            `${skill.displayName} configured successfully`,
          );
          await this.postSkillsList(ctx);
        } else {
          vscode.window.showErrorMessage(
            `Configuration failed: ${result.error}`,
          );
        }
      }
    } catch (error: any) {
      ctx.logger.error(`Failed to configure skill ${skillId}`, error);
      vscode.window.showErrorMessage(`Configuration failed: ${error.message}`);
    }
  }

  /**
   * Handle running skill setup command
   */
  private async handleRunSetup(
    message: any,
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
    } catch (error: any) {
      ctx.logger.error(`Failed to run setup for ${skillId}`, error);
      vscode.window.showErrorMessage(`Setup failed: ${error.message}`);
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
    } catch (error: any) {
      ctx.logger.error("Failed to get platform info", error);
    }
  }

  // ============================================
  // Environment Management Handlers
  // ============================================

  /**
   * Handle getting environments for a skill
   */
  private async handleGetEnvironments(
    message: any,
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
    } catch (error: any) {
      ctx.logger.error(`Failed to get environments for ${skillId}`, error);
    }
  }

  /**
   * Handle creating a new environment
   */
  private async handleCreateEnvironment(
    message: any,
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
          await this.handleGetEnvironments({ skillId }, ctx);
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
        await this.handleGetEnvironments({ skillId }, ctx);
        await this.postSkillsList(ctx);
      }
    } catch (error: any) {
      ctx.logger.error(`Failed to create environment for ${skillId}`, error);
      vscode.window.showErrorMessage(
        `Failed to create environment: ${error.message}`,
      );
    }
  }

  /**
   * Handle switching active environment
   */
  private async handleSwitchEnvironment(
    message: any,
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
          await this.handleGetEnvironments({ skillId }, ctx);
          await this.postSkillsList(ctx);
        }
        return;
      }

      // If no environmentId, show QuickPick
      const switched = await service.promptSwitchEnvironment(skillId);

      if (switched) {
        await this.handleGetEnvironments({ skillId }, ctx);
        await this.postSkillsList(ctx);
      }
    } catch (error: any) {
      ctx.logger.error(`Failed to switch environment for ${skillId}`, error);
      vscode.window.showErrorMessage(
        `Failed to switch environment: ${error.message}`,
      );
    }
  }

  /**
   * Handle configuring an environment's credentials
   */
  private async handleConfigureEnvironment(
    message: any,
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
    } catch (error: any) {
      ctx.logger.error(
        `Failed to configure environment ${environmentId} for ${skillId}`,
        error,
      );
      vscode.window.showErrorMessage(
        `Failed to configure environment: ${error.message}`,
      );
    }
  }

  /**
   * Handle deleting an environment
   */
  private async handleDeleteEnvironment(
    message: any,
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
        vscode.window.showInformationMessage(
          `Deleted "${env?.displayName ?? environmentId}" environment`,
        );
        await this.handleGetEnvironments({ skillId }, ctx);
        await this.postSkillsList(ctx);
      } else {
        vscode.window.showErrorMessage(
          `Failed to delete environment: ${result.error}`,
        );
      }
    } catch (error: any) {
      ctx.logger.error(
        `Failed to delete environment ${environmentId} for ${skillId}`,
        error,
      );
      vscode.window.showErrorMessage(
        `Failed to delete environment: ${error.message}`,
      );
    }
  }
}

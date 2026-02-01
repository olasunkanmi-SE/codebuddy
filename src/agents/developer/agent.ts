import { ChatAnthropic } from "@langchain/anthropic";
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { BaseStore } from "@langchain/langgraph";
import { rgPath } from "@vscode/ripgrep";
import { spawnSync } from "child_process";
import {
  BackendProtocol,
  CompositeBackend,
  createDeepAgent,
  StateBackend,
  StoreBackend,
} from "deepagents";
import { StructuredTool } from "langchain";
import * as vscode from "vscode";
import { IEventPayload } from "../../emitter/interface";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { Memory } from "../../memory/base";
import { Orchestrator } from "../../orchestrator";
import { getAPIKeyAndModel } from "../../utils/utils";
import { createVscodeFsBackendFactory } from "../backends/filesystem";
import {
  ICodeBuddyAgentConfig,
  InterruptConfiguration,
} from "../interface/agent.interface";
import { ToolProvider } from "../langgraph/tools/provider";
import { DEVELOPER_SYSTEM_PROMPT } from "./prompts";
import { createDeveloperSubagents } from "./subagents";

export class DeveloperAgent {
  private config: ICodeBuddyAgentConfig;
  private model: ChatAnthropic | ChatGroq | undefined;
  private tools: StructuredTool[];
  private readonly logger: Logger;
  private readonly disposables: vscode.Disposable[] = [];
  protected readonly orchestrator: Orchestrator;

  constructor(config: ICodeBuddyAgentConfig = {}) {
    this.orchestrator = Orchestrator.getInstance();
    this.config = config;
    ToolProvider.initialize();
    // Tools will be loaded asynchronously in create()
    this.tools = config.additionalTools || [];

    this.logger = Logger.initialize("DeveloperAgent", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.disposables.push(
      this.orchestrator.onModelChangeSuccess(this.handleModelChange.bind(this)),
    );
  }

  private handleModelChange(event: IEventPayload) {
    try {
      if (!event.message) {
        return;
      }
      const msg = JSON.parse(event.message);
      const model = msg.modelName;
      this.getAIConfigFromWebProvider(model);
    } catch (error) {}
  }

  private getAIConfigFromWebProvider(model: string) {
    const apiKeyAndModel = getAPIKeyAndModel(model.toLowerCase());
    let currentModel: ChatAnthropic | ChatGroq | undefined;
    switch (model.toLowerCase()) {
      case "anthropic":
        currentModel = new ChatAnthropic({
          apiKey: apiKeyAndModel.apiKey,
          model: apiKeyAndModel.model!,
        });
        break;
      case "groq":
        currentModel = new ChatGroq({
          apiKey: apiKeyAndModel.apiKey,
          model: apiKeyAndModel.model!,
        });
        break;
      case "gemini":
        // Temporary mesaure to prevent an error being throwned to the user
        // The current genai package isnt compatible with langchain 1.0.0 package
        currentModel = new ChatAnthropic({
          apiKey: apiKeyAndModel.apiKey,
          model: apiKeyAndModel.model!,
        });
        break;
      default:
        break;
    }
    this.model = currentModel;
    Memory.set("agentModel", currentModel);
  }

  /**
   * Creates the VSCode FileSystem Backend with Ripgrep support
   */
  private createVscodeBackend() {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    if (!workspacePath) {
      console.warn("No workspace folder found for DeveloperAgent.");
    }

    return createVscodeFsBackendFactory({
      rootDir: workspacePath || "",
      ripgrepSearch: async (opts) => {
        const result = spawnSync(
          rgPath,
          [
            "-n",
            "-H",
            ...(opts.extraArgs || []),
            ...(opts.glob ? ["-g", opts.glob] : []),
            opts.pattern,
            opts.cwd,
          ],
          { encoding: "utf-8", maxBuffer: opts.maxBuffer },
        );

        if (result.error) throw result.error;
        return result.stdout;
      },
      disableSpawnFallback: false,
      useRipgrep: true,
    });
  }

  /**
   * Constructs the Backend Factory specifically for DeepAgents
   */
  private getBackendFactory() {
    const vscodeFsBackend = this.createVscodeBackend();
    const { assistantId, store: configStore } = this.config;

    return (stateAndStore: {
      state: unknown;
      store?: BaseStore;
    }): BackendProtocol => {
      const defaultBackend = new StateBackend(stateAndStore);
      const routes: Record<string, BackendProtocol> = {};

      // Mount Documentation/Store backend if store exists
      if (stateAndStore.store) {
        routes["/docs/"] = new StoreBackend({
          ...stateAndStore,
          assistantId: assistantId || "developer-agent",
        });
      }

      // Mount Workspace backend
      routes["/workspace/"] = vscodeFsBackend;

      return new CompositeBackend(defaultBackend, routes);
    };
  }

  /**
   * Generates the final System Prompt
   */
  private getSystemPrompt(): string {
    const { customSystemPrompt } = this.config;
    return customSystemPrompt
      ? `${DEVELOPER_SYSTEM_PROMPT}\n\n## 📋 Additional Instructions:\n${customSystemPrompt}`
      : DEVELOPER_SYSTEM_PROMPT;
  }

  /**
   * Configures Human-in-the-loop interrupts
   * By default, file write and edit operations require user approval
   */
  private getInterruptConfiguration(): InterruptConfiguration {
    const defaultInterruptOn: InterruptConfiguration = {
      write_file: {
        allowedDecisions: ["approve", "edit", "reject"],
      },
      edit_file: {
        allowedDecisions: ["approve", "edit", "reject"],
      },
    };

    return this.config.interruptOn
      ? { ...defaultInterruptOn, ...this.config.interruptOn }
      : defaultInterruptOn;
  }

  /**
   * Main entry point to build and return the agent runnable
   */
  public async create() {
    const cachedModel = Memory.get("agentModel");
    if (!this.model && !cachedModel) {
      this.logger.error("Error creating DeveloperAgent: No model found");
      vscode.window.showWarningMessage(
        "Please make sure that you have selected a valid model with correct API key in the settings.",
      );
      throw new Error("Error creating DeveloperAgent: No model found");
    }

    this.model = cachedModel as ChatAnthropic | ChatGroq;
    const { store, enableSubAgents = true, checkPointer } = this.config;

    // Ensure MCP tools are loaded before creating the agent
    this.logger.info("Ensuring MCP tools are loaded...");
    const providerTools = await ToolProvider.getToolsAsync();
    this.tools = [...(this.config.additionalTools || []), ...providerTools];
    this.logger.info(
      `Agent initialized with ${this.tools.length} tools (including MCP)`,
    );

    const subagents = enableSubAgents
      ? createDeveloperSubagents(this.model, this.tools)
      : undefined;

    return createDeepAgent({
      model: this.model,
      tools: this.tools,
      systemPrompt: this.getSystemPrompt(),
      backend: this.getBackendFactory(),
      store,
      checkpointer: checkPointer,
      name: "DeveloperAgent",
      subagents,
      interruptOn: {}, // FIX: Use the interrupt configuration
    });
  }

  /**
   * Static factory for the "Advanced" configuration
   */
  public static async createAdvanced(config: ICodeBuddyAgentConfig = {}) {
    const agent = new DeveloperAgent({
      enableWebSearch: true,
      enableSubAgents: true,
      ...config,
    });
    return agent.create();
  }
}

/**
 * Legacy wrapper to maintain backward compatibility if needed,
 * or for simple functional usage.
 */
export async function createDeveloperAgent(config: ICodeBuddyAgentConfig = {}) {
  return new DeveloperAgent(config).create();
}

export async function createAdvancedDeveloperAgent(
  config: ICodeBuddyAgentConfig = {},
) {
  return DeveloperAgent.createAdvanced(config);
}

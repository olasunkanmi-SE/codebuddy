import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { BaseStore } from "@langchain/langgraph";
import { rgPath } from "@vscode/ripgrep";
import { execFile } from "child_process";
import { promisify } from "util";
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
import { ProjectRulesService } from "../../services/project-rules.service";
import { MemoryTool } from "../../tools/memory";
import { SkillManager } from "../../services/skill-manager";
import { getAPIKeyAndModel } from "../../utils/utils";
import { createVscodeFsBackendFactory } from "../backends/filesystem";
import {
  ICodeBuddyAgentConfig,
  InterruptConfiguration,
} from "../interface/agent.interface";
import { ToolProvider } from "../langgraph/tools/provider";
import { DEVELOPER_SYSTEM_PROMPT } from "./prompts";
import { createDeveloperSubagents } from "./subagents";

const execFileAsync = promisify(execFile);

export class DeveloperAgent {
  private config: ICodeBuddyAgentConfig;
  private model:
    | ChatAnthropic
    | ChatGroq
    | ChatOpenAI
    | ChatGoogleGenerativeAI
    | undefined;
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
    } catch (error) {
      // Ignore model change errors
    }
  }

  private getAIConfigFromWebProvider(model: string) {
    const apiKeyAndModel = getAPIKeyAndModel(model.toLowerCase());
    let currentModel:
      | ChatAnthropic
      | ChatGroq
      | ChatOpenAI
      | ChatGoogleGenerativeAI
      | undefined;
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
        currentModel = new ChatGoogleGenerativeAI({
          apiKey: apiKeyAndModel.apiKey,
          model: apiKeyAndModel.model!,
        });
        break;
      case "local":
        // Use ChatOpenAI with Ollama's OpenAI-compatible endpoint
        currentModel = new ChatOpenAI({
          apiKey: apiKeyAndModel.apiKey || "not-needed",
          model: apiKeyAndModel.model || "qwen2.5-coder",
          configuration: {
            baseURL: apiKeyAndModel.baseUrl || "http://localhost:11434/v1",
          },
        });
        break;
      case "openai":
        currentModel = new ChatOpenAI({
          apiKey: apiKeyAndModel.apiKey,
          model: apiKeyAndModel.model!,
        });
        break;
      case "qwen":
      case "glm":
      case "deepseek":
        currentModel = new ChatOpenAI({
          apiKey: apiKeyAndModel.apiKey,
          model: apiKeyAndModel.model!,
          configuration: {
            baseURL: apiKeyAndModel.baseUrl,
          },
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
      // opts.extraArgs and opts.glob are sourced from internal deepagents
      // configuration only — never from unsanitized user input.
      ripgrepSearch: async (opts) => {
        try {
          const { stdout } = await execFileAsync(
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
          return stdout;
        } catch (error: any) {
          // ripgrep exits with code 1 when no matches are found
          if (error.code === 1) {
            return "";
          }
          throw error;
        }
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
    const projectRules = ProjectRulesService.getInstance().getRules();

    let prompt = DEVELOPER_SYSTEM_PROMPT;

    // Add project rules if available
    if (projectRules) {
      prompt += `\n\n## 📋 Project Rules (always follow):\n${projectRules}`;
    }

    // Add custom system prompt if provided
    if (customSystemPrompt) {
      prompt += `\n\n## 📋 Additional Instructions:\n${customSystemPrompt}`;
    }

    // Add core memories
    prompt += MemoryTool.getFormattedMemories();

    // Add skills prompt
    prompt += SkillManager.getInstance().getSkillsPrompt();

    return prompt;
  }

  /**
   * Configures Human-in-the-loop interrupts
   * Only delete operations require user approval - writes and edits proceed automatically
   */
  private getInterruptConfiguration(): InterruptConfiguration {
    const defaultInterruptOn: InterruptConfiguration = {
      delete_file: {
        allowedDecisions: ["approve", "reject"],
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

    this.model = cachedModel as
      | ChatAnthropic
      | ChatGroq
      | ChatOpenAI
      | ChatGoogleGenerativeAI;
    const { store, enableSubAgents = true, checkPointer } = this.config;

    // Ensure MCP tools are loaded before creating the agent
    this.logger.info("Ensuring MCP tools are loaded...");
    const providerTools = await ToolProvider.getToolsAsync();

    // Combine and deduplicate tools
    const allTools = [...(this.config.additionalTools || []), ...providerTools];
    const uniqueToolsMap = new Map<string, StructuredTool>();

    allTools.forEach((tool) => {
      if (uniqueToolsMap.has(tool.name)) {
        this.logger.warn(`Duplicate tool detected and skipped: ${tool.name}`);
      } else {
        uniqueToolsMap.set(tool.name, tool);
      }
    });

    this.tools = Array.from(uniqueToolsMap.values());

    this.logger.info(
      `Agent initialized with ${this.tools.length} unique tools (including MCP)`,
    );

    // Load skills from workspace
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (workspacePath) {
      try {
        await SkillManager.getInstance().loadSkills(workspacePath);
        this.logger.info("Skills loaded successfully");
      } catch (error) {
        this.logger.error("Error loading skills", error);
      }
    }

    const subagents = enableSubAgents
      ? createDeveloperSubagents(this.model, this.tools)
      : undefined;

    const interruptConfig =
      this.config.enableHITL === false
        ? undefined
        : this.getInterruptConfiguration();

    return createDeepAgent({
      model: this.model,
      tools: this.tools,
      systemPrompt: this.getSystemPrompt(),
      backend: this.getBackendFactory(),
      store,
      checkpointer: checkPointer,
      name: "DeveloperAgent",
      subagents,
      interruptOn: interruptConfig,
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

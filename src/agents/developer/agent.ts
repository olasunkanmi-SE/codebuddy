import { ChatAnthropic } from "@langchain/anthropic";
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
  private model: ChatAnthropic;
  private tools: StructuredTool[];

  constructor(config: ICodeBuddyAgentConfig = {}) {
    this.config = config;
    ToolProvider.initialize();
    const providerTools = ToolProvider.getTools();
    this.tools = [...(config.additionalTools || []), ...providerTools];
    this.model = new ChatAnthropic({
      apiKey: getAPIKeyAndModel("anthropic").apiKey,
      model: getAPIKeyAndModel("anthropic").model!,
    });
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
  public create() {
    const { store, enableSubAgents = true, checkPointer } = this.config;

    const subagents = enableSubAgents
      ? createDeveloperSubagents(this.model, this.tools)
      : undefined;

    return createDeepAgent({
      model: new ChatAnthropic({
        apiKey: getAPIKeyAndModel("anthropic").apiKey,
        model: getAPIKeyAndModel("anthropic").model!,
      }),
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
  public static createAdvanced(config: ICodeBuddyAgentConfig = {}) {
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
export function createDeveloperAgent(config: ICodeBuddyAgentConfig = {}) {
  return new DeveloperAgent(config).create();
}

export function createAdvancedDeveloperAgent(
  config: ICodeBuddyAgentConfig = {},
) {
  return DeveloperAgent.createAdvanced(config);
}

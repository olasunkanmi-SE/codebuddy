import { InMemoryStore, MemorySaver } from "@langchain/langgraph";
import * as vscode from "vscode";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { Orchestrator } from "../orchestrator";
import { createAdvancedDeveloperAgent } from "./developer/agent";

export class CodebuddyAgentService {
  private agent: any = null;
  private store = new InMemoryStore();
  private checkpointer = new MemorySaver();
  private logger: any;
  private orchestrator: any;
  private static instance: CodebuddyAgentService;

  constructor() {
    this.logger = Logger.initialize("AgentService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.orchestrator = Orchestrator.getInstance();
  }

  static getInstance() {
    return (CodebuddyAgentService.instance ??= new CodebuddyAgentService());
  }

  private async getAgent() {
    if (!this.agent) {
      this.agent = await createAdvancedDeveloperAgent({
        checkPointer: this.checkpointer,
        store: this.store,
        // ✅ Disable HITL for smooth streaming
        enableHITL: false,
      });
      this.logger.log(LogLevel.INFO, "Agent initialized");
    }
    return this.agent;
  }

  async *runx(userMessage: string, threadId?: string) {
    try {
      const agent = await this.getAgent();
      const conversationId = threadId || `thread-${Date.now()}`;

      const config = {
        configurable: { thread_id: conversationId },
      };

      let result = await agent.stream(
        {
          messages: [{ role: "user", content: userMessage }],
        },
        config,
      );

      for await (const event of result) {
        for (const [nodeName, update] of Object.entries(
          event as Record<string, any>,
        )) {
          // Handle interrupts if they occur
          if (nodeName === "__interrupt__") {
            this.logger.log(LogLevel.INFO, "Auto-approving interrupt");

            // Auto-approve and continue
            const interrupts = update as any[];
            for (const interrupt of interrupts) {
              if (interrupt?.value?.id) {
                result = await agent.stream(
                  {
                    command: {
                      resume: {
                        [interrupt.value.id]: "approve",
                      },
                    },
                  },
                  config,
                );
              }
            }
            continue;
          }

          yield { node: nodeName, update };
          this.logger.log(LogLevel.INFO, `Stream event from node: ${nodeName}`);
        }
      }
    } catch (error: any) {
      this.logger.error("Agent execution failed:", error);
      if (
        error.message?.includes("token") ||
        error.message?.includes("billing") ||
        error.message?.includes("token usage") ||
        error.message?.includes("billing issue") ||
        error.message?.includes("quota") ||
        error.message?.includes("authorization") ||
        error.message?.includes("401") ||
        error.message?.includes("403")
      ) {
        vscode.window.showErrorMessage(
          `token usage or billing issues, kindly check your billing informationon your AI platform`,
        );
        throw new Error(`Authorization or billing error: ${error.message}`);
      }
      throw error;
    }
  }

  async processUserQuery(userInput: string, threadId?: string): Promise<any> {
    const stream = this.runx(userInput, threadId);
    for await (const update of stream) {
      if (update?.update?.messages) {
        const lastMessageContent = this.handleUserQuery(update.update.messages);
        if (lastMessageContent) {
          this.orchestrator.publish("onQuery", String(lastMessageContent));
        }
      }
    }
  }

  private handleUserQuery(messages: any[]): string | null {
    if (!messages || messages.length === 0) return null;
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.content || null;
  }
}

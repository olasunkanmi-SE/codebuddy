import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { Orchestrator } from "../../orchestrator";
import { StreamEventType } from "../interface/agent.interface";
import { CodeBuddyAgentService } from "../services/codebuddy-agent.service";

export class MessageHandler {
  protected readonly orchestrator: Orchestrator;
  private agentService: CodeBuddyAgentService;
  private logger: Logger;
  private static instance: MessageHandler;
  private activeRequests: Map<string, { threadId?: string }> = new Map<
    string,
    { threadId?: string }
  >();

  constructor() {
    this.orchestrator = Orchestrator.getInstance();
    this.agentService = CodeBuddyAgentService.getInstance();
    this.logger = Logger.initialize("MessageHandler", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  static getInstance() {
    return (MessageHandler.instance ??= new MessageHandler());
  }

  async handleUserMessage(message: string, metaData?: any) {
    const requestId = `request-${Date.now()}`;
    const threadId = metaData?.threadId;
    this.activeRequests.set(requestId, { threadId });
    try {
      await this.orchestrator.publish(StreamEventType.START, {
        requestId,
        threadId,
        metadata: { timestamp: Date.now() },
      });

      await this.agentService.processUserQuery(
        message,
        async (chunk) => {
          if (!this.activeRequests.has(requestId)) return;
          await this.orchestrator.publish(StreamEventType.CHUNK, {
            requestId,
            threadId,
            content: chunk.content,
            accumulated: chunk.accumulated,
            metadata: { timestamp: Date.now() },
          });
        },
        async (finalContent) => {
          if (!this.activeRequests.has(requestId)) return;
          await this.orchestrator.publish(StreamEventType.END, {
            requestId,
            threadId,
            content: finalContent,
            metadata: { timestamp: Date.now() },
          });
          this.activeRequests.delete(requestId);
          this.logger.info(`Request ${requestId} completed`);
        },
        async (error) => {
          if (!this.activeRequests.has(requestId)) return;
          await this.orchestrator.publish(StreamEventType.ERROR, {
            requestId,
            threadId,
            error: `Request ${requestId} failed`,
            metadata: { timestamp: Date.now() },
          });
          this.activeRequests.delete(requestId);
          this.logger.error(`Request ${requestId} failed`, error);
        },
        threadId,
      );
    } catch (error: any) {
      this.logger.error(`Request ${requestId} failed`, error);
      await this.orchestrator.publish(StreamEventType.ERROR, {
        requestId,
        threadId,
        error: `Request ${requestId} failed`,
        metadata: { timestamp: Date.now() },
      });
      this.activeRequests.delete(requestId);
    }
  }

  cancelRequest(requestId: string) {
    const requestInfo = this.activeRequests.get(requestId);
    if (requestInfo?.threadId) {
      this.agentService.cancelStream(requestInfo.threadId);
      this.activeRequests.delete(requestId);
      this.logger.log(
        LogLevel.INFO,
        `Request ${requestId} (thread: ${requestInfo.threadId}) cancelled`,
      );
    }
  }

  dispose() {
    this.activeRequests.clear();
  }
}

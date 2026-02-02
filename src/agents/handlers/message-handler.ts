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
      // Tag stream start with requestId/threadId so the webview can associate subsequent chunks
      await this.orchestrator.publish(StreamEventType.START, {
        requestId,
        threadId,
        metadata: { timestamp: Date.now() },
      });

      // Process stream and forward all events to orchestrator
      for await (const event of this.agentService.streamResponse(
        message,
        threadId,
        undefined,
        requestId,
      )) {
        if (!this.activeRequests.has(requestId)) break;

        // DEBUG: Log all events received from stream
        this.logger.debug(`[MESSAGE_HANDLER] Event received: ${event.type}`);

        // Forward event to orchestrator based on type
        switch (event.type) {
          case StreamEventType.THINKING:
            await this.orchestrator.publish(StreamEventType.THINKING, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;
          case StreamEventType.PLANNING:
          case StreamEventType.THINKING_START:
            await this.orchestrator.publish(StreamEventType.THINKING_START, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;
          case StreamEventType.THINKING_UPDATE:
            await this.orchestrator.publish(StreamEventType.THINKING_UPDATE, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;
          case StreamEventType.THINKING_END:
            await this.orchestrator.publish(StreamEventType.THINKING_END, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;
          case StreamEventType.PLANNING:
            await this.orchestrator.publish(StreamEventType.PLANNING, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.METADATA:
            await this.orchestrator.publish(StreamEventType.METADATA, {
              requestId,
              threadId,
              ...event.metadata,
              content: event.content,
            });
            break;

          case StreamEventType.TOOL_START:
            await this.orchestrator.publish(StreamEventType.TOOL_START, {
              requestId,
              threadId,
              ...JSON.parse(event.content),
              metadata: { ...event.metadata, requestId, threadId },
            });
            this.logger.debug(`Tool started: ${event.metadata?.toolName}`);
            break;

          case StreamEventType.TOOL_END:
            await this.orchestrator.publish(StreamEventType.TOOL_END, {
              requestId,
              threadId,
              ...JSON.parse(event.content),
              metadata: { ...event.metadata, requestId, threadId },
            });
            this.logger.debug(`Tool ended: ${event.metadata?.toolName}`);
            break;

          case StreamEventType.TOOL_PROGRESS:
            await this.orchestrator.publish(StreamEventType.TOOL_PROGRESS, {
              requestId,
              threadId,
              content: event.content,
              metadata: { ...event.metadata, requestId, threadId },
            });
            break;

          case StreamEventType.SUMMARIZING:
            await this.orchestrator.publish(StreamEventType.SUMMARIZING, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;

          // New detailed activity events
          case StreamEventType.DECISION:
            await this.orchestrator.publish(StreamEventType.DECISION, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            this.logger.debug(`Decision: ${event.content}`);
            break;

          case StreamEventType.READING:
            await this.orchestrator.publish(StreamEventType.READING, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.SEARCHING:
            await this.orchestrator.publish(StreamEventType.SEARCHING, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.REVIEWING:
            await this.orchestrator.publish(StreamEventType.REVIEWING, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.ANALYZING:
            await this.orchestrator.publish(StreamEventType.ANALYZING, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.EXECUTING:
            await this.orchestrator.publish(StreamEventType.EXECUTING, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.WORKING:
            await this.orchestrator.publish(StreamEventType.WORKING, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.CHUNK:
            await this.orchestrator.publish(StreamEventType.CHUNK, {
              requestId,
              threadId,
              content: event.content,
              accumulated: event.accumulated,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.END:
            await this.orchestrator.publish(StreamEventType.END, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            this.activeRequests.delete(requestId);
            this.logger.info(`Request ${requestId} completed`);
            break;

          case StreamEventType.ERROR:
            await this.orchestrator.publish(StreamEventType.ERROR, {
              requestId,
              threadId,
              error: event.content,
              metadata: event.metadata,
            });
            this.activeRequests.delete(requestId);
            this.logger.error(`Request ${requestId} failed: ${event.content}`);
            break;
        }
      }
    } catch (error: any) {
      this.logger.error(`Request ${requestId} failed`, error);
      await this.orchestrator.publish(StreamEventType.ERROR, {
        requestId,
        threadId,
        error: `Request ${requestId} failed: ${error.message}`,
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

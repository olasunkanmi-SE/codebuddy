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

  async handleUserMessage(message: string, metaData?: any): Promise<string> {
    const requestId = `request-${Date.now()}`;
    const threadId = metaData?.threadId;
    this.activeRequests.set(requestId, { threadId });
    let fullResponse = "";

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
        metaData?.mode,
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
              content: event.content,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.DECISION:
            await this.orchestrator.publish(StreamEventType.DECISION, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.TOOL_START:
            await this.orchestrator.publish(StreamEventType.TOOL_START, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.TOOL_END:
            await this.orchestrator.publish(StreamEventType.TOOL_END, {
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
            // Capture the accumulated response
            if (event.accumulated) {
              fullResponse = event.accumulated;
            } else {
              // Fallback if accumulated is missing (shouldn't happen based on service code)
              fullResponse += event.content;
            }

            await this.orchestrator.publish(StreamEventType.CHUNK, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;

          case StreamEventType.ERROR:
            await this.orchestrator.publish(StreamEventType.ERROR, {
              requestId,
              threadId,
              content: event.content,
              metadata: event.metadata,
            });
            break;
        }
      }

      return fullResponse;
    } catch (error) {
      this.logger.error("Error in message handler", error);
      await this.orchestrator.publish(StreamEventType.ERROR, {
        requestId,
        threadId,
        content: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    } finally {
      this.activeRequests.delete(requestId);
      await this.orchestrator.publish(StreamEventType.END, {
        requestId,
        threadId,
      });
    }
  }

  cancelRequest(requestId: string, threadId?: string) {
    const requestInfo = this.activeRequests.get(requestId);
    const resolvedThreadId = requestInfo?.threadId ?? threadId;

    if (resolvedThreadId) {
      this.agentService.cancelStream(resolvedThreadId);
      this.logger.log(
        LogLevel.INFO,
        `Request ${requestId} (thread: ${resolvedThreadId}) cancelled`,
      );
    }

    this.activeRequests.delete(requestId);
  }

  dispose() {
    this.activeRequests.clear();
  }
}

import * as vscode from "vscode";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { StreamEventType } from "../interface/agent.interface";
import { CodeBuddyAgentService } from "../services/codebuddy-agent.service";

export class MessageHandler {
    private agentService: CodeBuddyAgentService;
    private logger: Logger;
    private activeRequests: Map<string, { threadId?: string }> = new Map<string, { threadId?: string }>();

    constructor(private readonly webview: vscode.Webview) {
        this.agentService = CodeBuddyAgentService.getInstance();
        this.logger = Logger.initialize("MessageHandler", {
            minLevel: LogLevel.DEBUG,
            enableConsole: true,
            enableFile: true,
            enableTelemetry: true,
        });
    }

    async handleUserMessage(message: string, metaData?: any) {
        const requestId = `request-${Date.now()}`;
        const threadId = metaData?.threadId;
        this.activeRequests.set(requestId, { threadId });
        try {
            this.webview.postMessage({
                type: StreamEventType.START,
                payload: {
                    requestId,
                    threadId,
                    timestamp: Date.now()
                }
            });

            await this.agentService.processUserQuery(message, (chunk) => {
                if (!this.activeRequests.has(requestId)) return
                this.webview.postMessage({
                    type: StreamEventType.CHUNK,
                    payload: {
                        requestId,
                        content: chunk.content,
                        timestamp: Date.now(),
                        accumulated: chunk.accumulated,
                        metadata: chunk.metadata
                    }
                });
            }, (finalContent) => {
                if (!this.activeRequests.has(requestId)) return
                this.webview.postMessage({
                    type: StreamEventType.END,
                    payload: {
                        requestId,
                        finalContent,
                        timestamp: Date.now()
                    }
                });
                this.activeRequests.delete(requestId);
                this.logger.info(`Request ${requestId} completed`);
            }, (error) => {
                if (!this.activeRequests.has(requestId)) return
                this.webview.postMessage({
                    type: StreamEventType.ERROR,
                    payload: {
                        requestId,
                        error: `Request ${requestId} failed`,
                        timestamp: Date.now()
                    }
                });
                this.activeRequests.delete(requestId)
                this.logger.error(`Request ${requestId} failed`, error);
            }, threadId);
        } catch (error: any) {
            this.logger.error(`Request ${requestId} failed`, error);
            this.webview.postMessage({
                type: StreamEventType.ERROR,
                payload: {
                    requestId,
                    error: `Request ${requestId} failed`,
                    timestamp: Date.now()
                }
            });
            this.activeRequests.delete(requestId)
        }

    }

    cancelRequest(requestId: string) {
        const requestInfo = this.activeRequests.get(requestId);
        if (requestInfo?.threadId) {
            this.agentService.cancelStream(requestInfo.threadId);
            this.activeRequests.delete(requestId);
            this.logger.log(LogLevel.INFO, `Request ${requestId} (thread: ${requestInfo.threadId}) cancelled`);
        }
    }

    dispose() {
        this.activeRequests.clear();
    }
}
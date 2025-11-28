import { InMemoryStore, MemorySaver } from "@langchain/langgraph";
import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { createAdvancedDeveloperAgent } from "../developer/agent";
import { ICodeBuddyAgentConfig, StreamEventType } from "../interface/agent.interface";
import { StreamManager } from "./stream-manager.service";

export class CodeBuddyAgentService {
    private agent: any = null;
    private store = new InMemoryStore();
    private checkpointer = new MemorySaver();
    private readonly logger: Logger
    private static instance: CodeBuddyAgentService
    private activeStreams = new Map<string, StreamManager>();

    constructor() {
        this.logger = Logger.initialize("CodeBuddyAgentService", {
            minLevel: LogLevel.DEBUG,
            enableConsole: true,
            enableFile: true,
            enableTelemetry: true,
        });
    }

    static getInstance(): CodeBuddyAgentService {
        return (CodeBuddyAgentService.instance ??= new CodeBuddyAgentService());
    }

    private async getAgent(config?: ICodeBuddyAgentConfig) {
        if (!this.agent) {
            this.agent = await createAdvancedDeveloperAgent({
                checkPointer: config?.checkPointer ?? this.checkpointer,
                store: config?.store ?? this.store,
                enableHITL: config?.enableHITL ?? false,
            });
            this.logger.log(LogLevel.INFO, "Agent initialized");
        }
        return this.agent
    }

    async *streamResponse(userMessage: string, threadId?: string, onChunk?: (chunk: any) => void) {
        const conversationId = threadId ?? `thread-${Date.now()}`
        const streamManger = new StreamManager({
            maxBufferSize: 10,
            flushInterval: 50,
            enableBackPressure: true
        })
        this.activeStreams.set(conversationId, streamManger)
        try {
            const agent = await this.getAgent();
            const streamId = streamManger.startStream()
            this.logger.log(LogLevel.INFO, `Starting stream ${streamId} for thread ${conversationId}`);
            const config = {
                configurable: { thread_id: conversationId }
            }
            let result = await agent.stream({ messages: [{ role: 'user', content: userMessage }] }, config)
            let accumulatedContent = "";
            for await (const event of result) {
                for (const [nodeName, update] of Object.entries(event as Record<string, any>)) {
                    if (nodeName === "__interrupt__") {
                        this.logger.log(LogLevel.INFO, "Auto-approving interrupt");
                        const interrupts = update as any[]
                        for (const interrupt of interrupts) {
                            if (interrupt?.value.id) {
                                result = await agent.stream({
                                    command: {
                                        resume: {
                                            [interrupt.value.id]: "approve"
                                        }
                                    }
                                }, config)
                            }
                        }
                        continue
                    }
                    if (update?.messages && Array.isArray(update.messages)) {
                        const lastMessage = update.messages[update.messages.length - 1];
                        if (lastMessage?.content) {
                            const newContent = String(lastMessage.content);
                            const delta = newContent.slice(accumulatedContent.length);
                            if (delta) {
                                accumulatedContent = newContent
                                streamManger.addChunk(delta, { node: nodeName, messageType: lastMessage.type })

                                yield {
                                    type: StreamEventType.CHUNK,
                                    content: delta,
                                    metadata: { node: nodeName, messageType: lastMessage.type },
                                    accumulated: accumulatedContent
                                }
                                onChunk?.({
                                    type: StreamEventType.CHUNK,
                                    content: delta,
                                    metadata: { node: nodeName, messageType: lastMessage.type },
                                    accumulated: accumulatedContent
                                })
                            }
                        }
                    }
                    if (update?.toolCalls) {
                        for (const toolCall of update.toolCalls) {
                            streamManger.addToolEvent(toolCall.name, true, toolCall)
                            yield {
                                type: StreamEventType.TOOL_START,
                                content: JSON.stringify(toolCall),
                                metadata: {
                                    toolName: toolCall.name,
                                    node: nodeName
                                }

                            }
                        }
                    }
                }
            }
            streamManger.endStream(accumulatedContent);
            yield {
                type: StreamEventType.END,
                content: accumulatedContent,
                metadata: { threadId: conversationId }
            }
        } catch (error: any) {
            yield {
                type: StreamEventType.ERROR,
                content: "An unexpected error occurred while processing your request.",
                metadata: { threadId: conversationId }
            }
            this.logger.log(LogLevel.ERROR, `Stream failed for thread ${conversationId}`, error);

            throw error
        } finally {
            this.activeStreams.delete(conversationId)
        }
    }

    async processUserQuery(userInput: string, onChunk: (chunk: any) => void, onComplete: (finalContent: string) => void, onError: (error: Error) => void, threadId?: string) {
        try {
            let finalContent = '';
            for await (const chunk of this.streamResponse(userInput, threadId, onChunk)) {
                if (chunk.type === StreamEventType.END) {
                    finalContent = chunk.content;
                }
            }
            onComplete(finalContent);
        } catch (error: any) {
            onError(error);
        }
    }

    cancelStream(threadId:string){
        const streamManager = this.activeStreams.get(threadId);
        if(streamManager && streamManager.isActive()){
            streamManager.endStream();
            this.activeStreams.delete(threadId);
            this.logger.log(LogLevel.INFO, `Stream cancelled for thread ${threadId}`);
        }
    }
}
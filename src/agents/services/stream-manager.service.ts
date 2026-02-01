import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { Orchestrator } from "../../orchestrator";
import { generateUUID } from "../../utils/utils";
import {
  IStreamChunk,
  IStreamOptions,
  StreamEventType,
} from "../interface/agent.interface";

/**
 * Manages the lifecycle of a data stream by buffering chunks and flushing them periodically
 * or when the buffer is full. This class ensures that data is sent in manageable batches,
 * provides back-pressure, and handles the start, end, and error states of a stream.
 */
export class StreamManager {
  protected readonly orchestrator: Orchestrator;
  private buffer: IStreamChunk[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly options: Required<IStreamOptions>;
  private readonly logger: Logger;
  private isStreaming = false;
  private streamId: string | null = null;

  /**
   * Initializes a new StreamManager with specific configuration options.
   * @param {IStreamOptions} options - Configuration for buffer size, flush interval, and back-pressure.
   * Defaults are provided for any omitted options.
   */
  constructor(options: IStreamOptions) {
    this.orchestrator = Orchestrator.getInstance();
    this.options = {
      maxBufferSize: options.maxBufferSize ?? 10,
      flushInterval: options.flushInterval ?? 50,
      enableBackPressure: options.enableBackPressure ?? true,
    };
    this.logger = Logger.initialize("StreamManager", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  /**
   * Starts a new streaming session.
   * This generates a unique stream ID, resets the state, publishes a start event,
   * and schedules the first buffer flush.
   * @returns {string} The unique identifier for the newly started stream.
   */
  async startStream(preferredId?: string): Promise<string> {
    // Use caller-supplied id to keep request correlation consistent across layers
    this.streamId = preferredId ?? generateUUID();
    this.isStreaming = true;
    this.buffer = [];
    await this.orchestrator.publish(StreamEventType.START, {
      id: this.streamId,
      content: "",
      metadata: { timestamp: Date.now() },
    });
    this.scheduleFlush();
    return this.streamId;
  }

  /**
   * Sets up a recurring timer to flush the buffer.
   * This uses a self-rescheduling `setTimeout` instead of `setInterval` to prevent
   * overlapping flushes. The next flush is only scheduled after the current one completes,
   * which is more robust if the flush operation takes a variable amount of time.
   */
  private scheduleFlush() {
    if (this.flushTimer) return;
    const run = () => {
      if (this.buffer.length > 0) {
        this.flush();
      }
      // Only continue scheduling if the stream is still active.
      if (this.isStreaming) {
        this.flushTimer = setTimeout(run, this.options.flushInterval);
      }
    };
    this.flushTimer = setTimeout(run, this.options.flushInterval);
  }

  /**
   * Immediately sends all chunks currently in the buffer via the orchestrator.
   */
  private flush() {
    if (this.buffer.length === 0) return;

    // Atomically swap the buffer to avoid race conditions. New chunks can be
    // added to the new empty buffer while the old one is being flushed.
    const chunksToFlush = this.buffer;
    this.buffer = [];
    this.orchestrator.publish("onStreamFlush", chunksToFlush);
  }

  /**
   * Adds a data chunk to the stream buffer.
   * If the buffer reaches its maximum configured size, it will be flushed immediately.
   * @param {string} content - The string content of the chunk.
   * @param {Record<string, any>} [metadata] - Optional metadata to associate with the chunk.
   */
  addChunk(content: string, metadata?: Record<string, any>): void {
    if (!this.isStreaming) {
      this.logger.warn("Attempt to add chunk to a non-streaming session");
      return;
    }
    const chunk: IStreamChunk = {
      id: this.streamId ?? generateUUID(),
      type: StreamEventType.CHUNK,
      content,
      metadata: { ...metadata, timestamp: Date.now() },
    };
    this.buffer.push(chunk);

    // Enforce back-pressure by flushing immediately when the buffer is full.
    if (this.buffer.length >= this.options.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Adds a special event chunk to mark the start or end of a tool's execution.
   * These events are flushed immediately to ensure consumers are notified of these
   * important state changes without delay.
   * @param {string} toolName - The name of the tool.
   * @param {boolean} isStart - True if the tool is starting, false if it's ending.
   * @param {any} [data] - Optional data associated with the tool event.
   */
  addToolEvent(toolName: string, isStart: boolean, data?: any): void {
    const chunk: IStreamChunk = {
      id: this.streamId ?? generateUUID(),
      type: isStart ? StreamEventType.TOOL_START : StreamEventType.TOOL_END,
      content: JSON.stringify(data ?? {}),
      metadata: { toolName, timestamp: Date.now() },
    };
    this.buffer.push(chunk);
    // IMPORTANT: Flush immediately to notify consumers about tool usage right away.
    this.flush();
  }

  /**
   * Gracefully ends the streaming session.
   * This performs a final flush of any remaining data in the buffer, cleans up
   * the timer, and publishes an end event.
   * @param {string} [finalContent] - Optional final message to include in the end event.
   */
  async endStream(finalContent?: string): Promise<void> {
    // Ensure any lingering chunks are sent before closing the stream.
    this.flush();

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.orchestrator.publish("onStreamEnd", {
      id: this.streamId,
      type: StreamEventType.END,
      content: finalContent ?? "",
      metadata: { timestamp: Date.now() },
    });
    this.isStreaming = false;
    this.streamId = null;
  }

  /**
   * Handles an error that occurred during the stream.
   * It flushes any pending data, publishes an error event, and then terminates the stream.
   * @param {Error} error - The error object to be reported.
   */
  async handleError(error: Error): Promise<void> {
    this.flush();
    const metadata: { timestamp: number; stack?: string; message?: string } = {
      timestamp: Date.now(),
    };
    this.logger.error("Stream error occurred", {
      error,
      streamId: this.streamId,
    });
    await this.orchestrator.publish("onStreamError", {
      id: this.streamId,
      type: StreamEventType.ERROR,
      content: error.message,
      metadata,
    });
    await this.endStream();
  }

  /**
   * Checks if the stream is currently active.
   * @returns {boolean} True if the stream is active, otherwise false.
   */
  isActive(): boolean {
    return this.isStreaming;
  }
}

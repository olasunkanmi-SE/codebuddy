import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type TimelineStatus = "active" | "completed" | "failed";

export interface AgentTimelineThinking {
  content: string;
  status: TimelineStatus;
  timestamp: number;
}

export interface AgentTimelinePlan {
  raw: string;
  steps: string[];
  status: TimelineStatus;
  timestamp: number;
}

export type AgentTimelineActionType =
  | "tool"
  | "decision"
  | "reading"
  | "searching"
  | "reviewing"
  | "analyzing"
  | "executing"
  | "working"
  | "summarizing";

export interface AgentTimelineAction {
  id: string;
  type: AgentTimelineActionType;
  label: string;
  status: TimelineStatus;
  detail?: string;
  result?: string;
  toolName?: string;
  terminalOutput?: string;
  timestamp: number;
  duration?: number;
  progress?: number;
}

export interface AgentTimelineState {
  thinking?: AgentTimelineThinking;
  plan?: AgentTimelinePlan;
  actions: AgentTimelineAction[];
  summarizing?: boolean;
  result?: { summary?: string };
}

export interface AgentTimelineSnapshot extends AgentTimelineState {}

export interface IWebviewMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  language?: string;
  alias?: string;
  senderInitial?: string;
  isStreaming?: boolean;
  timestamp?: number;
  timelineSnapshot?: AgentTimelineSnapshot;
}

interface UseStreamingChatOptions {
  enableStreaming?: boolean;
  onLegacyMessage?: (messages: IWebviewMessage[]) => void;
}

// Stream event types matching backend
const StreamEventType = {
  START: "onStreamStart",
  END: "onStreamEnd",
  CHUNK: "onStreamChunk",
  TOOL_START: "onToolStart",
  TOOL_END: "onToolEnd",
  TOOL_PROGRESS: "onToolProgress",
  PLANNING: "onPlanning",
  SUMMARIZING: "onSummarizing",
  THINKING: "onThinking",
  THINKING_START: "onThinkingStart",
  THINKING_UPDATE: "onThinkingUpdate",
  THINKING_END: "onThinkingEnd",
  ERROR: "onStreamError",
  METADATA: "streamMetadata",
  // New detailed activity events
  DECISION: "onDecision",
  READING: "onReading",
  SEARCHING: "onSearching",
  REVIEWING: "onReviewing",
  ANALYZING: "onAnalyzing",
  EXECUTING: "onExecuting",
  WORKING: "onWorking",
  TERMINAL_OUTPUT: "onTerminalOutput",
} as const;

export const useStreamingChat = (
  vscodeApi: any,
  options: UseStreamingChatOptions = {},
) => {
  const { enableStreaming = true, onLegacyMessage } = options;

  const [completedMessages, setCompletedMessages] = useState<IWebviewMessage[]>(
    [],
  );
  const [streamingMessage, setStreamingMessage] =
    useState<IWebviewMessage | null>(null);
  const [isLegacyLoading, setIsLegacyLoading] = useState(false);
  const [timeline, setTimeline] = useState<AgentTimelineState>({
    actions: [],
  });
  const [pendingApproval, setPendingApproval] = useState<{
    toolName?: string;
    description?: string;
  } | null>(null);

  const currentRequestIdRef = useRef<string | null>(null);
  const threadIdRef = useRef<string>(
    `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );

  // Combine completed and streaming messages
  const streamedMessages = useMemo(() => {
    return streamingMessage
      ? [...completedMessages, streamingMessage]
      : completedMessages;
  }, [completedMessages, streamingMessage]);

  // Add a message directly (for legacy or manual additions)
  const addMessage = useCallback(
    (message: Omit<IWebviewMessage, "id" | "timestamp">) => {
      const fullMessage: IWebviewMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };
      setCompletedMessages((prev) => [...prev, fullMessage]);
      return fullMessage;
    },
    [],
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setCompletedMessages([]);
    setStreamingMessage(null);
    setTimeline({ actions: [] });
    currentRequestIdRef.current = null;
  }, []);

  // Streaming handlers
  const handleStreamStart = useCallback(
    (payload: any) => {
      console.log("Stream start payload:", payload);
      if (!enableStreaming) return;

      const tempId = `temp-${payload.requestId || Date.now()}`;
      currentRequestIdRef.current = payload.requestId;
      setIsLegacyLoading(false);
      setTimeline({ actions: [] }); // Clear timeline for new stream
      setPendingApproval(null); // Reset pending approvals for new requests
      setStreamingMessage({
        id: tempId,
        type: "bot",
        content: "",
        isStreaming: true,
        timestamp: Date.now(),
        language: payload.language || "Typescript",
        alias: payload.alias || "O",
      });
    },
    [enableStreaming],
  );

  const handleStreamChunk = useCallback(
    (payload: any) => {
      if (!enableStreaming) return;
      if (payload.requestId !== currentRequestIdRef.current) return;

      setStreamingMessage((prev) => {
        if (!prev) return null;
        const newContent = prev.content + payload.content;
        return { ...prev, content: newContent };
      });
    },
    [enableStreaming],
  );

  const handleStreamEnd = useCallback(
    (payload: any) => {
      if (!enableStreaming) return;
      if (payload.requestId !== currentRequestIdRef.current) return;

      setStreamingMessage((prev) => {
        if (!prev) return null;
        const finalContent = payload.content ?? prev.content;
        const finalMessage: IWebviewMessage = {
          ...prev,
          id: `bot-${Date.now()}`,
          isStreaming: false,
          content: finalContent,
        };
        setCompletedMessages((prevCompleted) => [
          ...prevCompleted,
          finalMessage,
        ]);
        return null;
      });

      currentRequestIdRef.current = null;
    },
    [enableStreaming, timeline],
  );

  const handleStreamError = useCallback(
    (payload: any) => {
      if (!enableStreaming) return;
      if (payload.requestId !== currentRequestIdRef.current) return;

      // Mark all active actions as failed
      setTimeline((prev) => ({
        ...prev,
        actions: prev.actions.map((a) =>
          a.status === "active" ? { ...a, status: "failed" as const } : a,
        ),
      }));

      const errorContent =
        payload.error || "An error occurred during streaming";

      // Always create an error message, even if no streaming message exists
      setStreamingMessage((prev) => {
        const snapshot: AgentTimelineSnapshot = {
          ...timeline,
          result: { summary: errorContent },
          summarizing: false,
          actions: timeline.actions.map((a) =>
            a.status === "active" ? { ...a, status: "failed" as const } : a,
          ),
        };
        const errorMessage: IWebviewMessage = {
          id: `error-${Date.now()}`,
          type: "bot",
          isStreaming: false,
          content: errorContent,
          timestamp: Date.now(),
          language: prev?.language || "text",
          alias: prev?.alias || "O",
          timelineSnapshot: snapshot,
        };
        setCompletedMessages((prevCompleted) => [
          ...prevCompleted,
          errorMessage,
        ]);
        return null;
      });

      currentRequestIdRef.current = null;
      setIsLegacyLoading(false);
    },
    [enableStreaming],
  );

  // Tool activity handlers
  const handleToolStart = useCallback((payload: any) => {
    const summarizeArgs = (args: any): string | null => {
      if (!args || typeof args !== "object") return null;
      if (typeof args.command === "string") {
        const trimmed =
          args.command.length > 120
            ? `${args.command.slice(0, 117)}...`
            : args.command;
        return `command: ${trimmed}`;
      }
      const entries = Object.entries(args).slice(0, 2);
      if (entries.length === 0) return null;
      const parts = entries.map(([key, value]) => {
        const raw = typeof value === "string" ? value : JSON.stringify(value);
        const trimmed = raw.length > 60 ? `${raw.slice(0, 57)}...` : raw;
        return `${key}=${trimmed}`;
      });
      const suffix = Object.keys(args).length > 2 ? ", …" : "";
      return parts.join(", ") + suffix;
    };

    const argSummary = summarizeArgs(payload.args);
    const description =
      payload.description || `Running ${payload.toolName || "tool"}`;
    const annotatedDescription = argSummary
      ? `${description} (${argSummary})`
      : description;

    const action: AgentTimelineAction = {
      id: payload.toolId || `action-${Date.now()}`,
      type: "tool",
      toolName: payload.toolName,
      label: payload.toolName || "Tool",
      detail: annotatedDescription,
      status: "active",
      timestamp: Date.now(),
    };

    setTimeline((prev) => ({
      ...prev,
      plan:
        prev.plan && prev.plan.status === "active"
          ? { ...prev.plan, status: "completed" }
          : prev.plan,
      actions: [...prev.actions, action],
    }));
  }, []);

  const handleToolEnd = useCallback((payload: any) => {
    setTimeline((prev) => ({
      ...prev,
      actions: prev.actions.map((action) =>
        (action.toolName === payload.toolName ||
          action.id === payload.toolId) &&
        action.status === "active"
          ? {
              ...action,
              status: payload.status === "failed" ? "failed" : "completed",
              result:
                typeof payload.result === "string"
                  ? payload.result
                  : payload.result?.summary,
              duration: payload.duration,
              progress: 100,
            }
          : action,
      ),
    }));
  }, []);

  const handleToolProgress = useCallback((payload: any) => {
    const progressValue =
      typeof payload.progress === "number"
        ? Math.max(0, Math.min(100, payload.progress))
        : undefined;

    setTimeline((prev) => ({
      ...prev,
      actions: prev.actions.map((action) =>
        action.toolName === payload.toolName && action.status === "active"
          ? {
              ...action,
              detail: payload.message || action.detail,
              progress: progressValue ?? action.progress,
            }
          : action,
      ),
    }));
  }, []);

  const handlePlanning = useCallback((payload: any) => {
    const raw = payload.content || "Analyzing your request...";
    const steps = raw
      .split(/\n|•|-\s/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    setTimeline((prev) => ({
      ...prev,
      plan: {
        raw,
        steps,
        status: "active",
        timestamp: Date.now(),
      },
    }));
  }, []);

  const handleSummarizing = useCallback(() => {
    setTimeline((prev) => ({
      ...prev,
      summarizing: true,
      plan:
        prev.plan && prev.plan.status === "active"
          ? { ...prev.plan, status: "completed" }
          : prev.plan,
    }));
  }, []);

  const handleThinkingStart = useCallback((payload: any) => {
    const content = payload.content || "Thinking...";
    setTimeline((prev) => ({
      ...prev,
      thinking: {
        content,
        status: "active",
        timestamp: Date.now(),
      },
    }));
  }, []);

  const handleThinkingUpdate = useCallback((payload: any) => {
    const content = payload.content;
    if (!content) return;
    setTimeline((prev) =>
      prev.thinking
        ? { ...prev, thinking: { ...prev.thinking, content } }
        : prev,
    );
  }, []);

  const handleThinkingEnd = useCallback(() => {
    setTimeline((prev) =>
      prev.thinking
        ? { ...prev, thinking: { ...prev.thinking, status: "completed" } }
        : prev,
    );
  }, []);

  const handleMetadata = useCallback((payload: any) => {
    if (!payload?.status) return;

    switch (payload.status) {
      case "interrupt_waiting":
        const desc =
          payload.description ||
          (payload.toolName
            ? `Preparing to run ${payload.toolName}`
            : "Preparing to run tool");
        setPendingApproval({
          toolName: payload.toolName,
          description: desc,
        });
        break;
      case "interrupt_approved":
        setPendingApproval(null);
        break;
      default:
        break;
    }
  }, []);

  const handleActivityEvent = useCallback(
    (
      type: AgentTimelineActionType,
      payload: any,
      status: TimelineStatus = "active",
    ) => {
      const detail = payload.content || `Agent is ${type}...`;
      const label = payload.toolName || type;
      // De-duplicate consecutive working updates with the same detail
      if (type === "working") {
        setTimeline((prev) => {
          const last = prev.actions[prev.actions.length - 1];
          if (last && last.type === "working" && last.detail === detail) {
            return prev;
          }
          return {
            ...prev,
            actions: [
              ...prev.actions,
              {
                id: payload.id || `action-${Date.now()}`,
                type,
                label,
                detail,
                status,
                timestamp: Date.now(),
              },
            ],
            plan:
              prev.plan && prev.plan.status === "active"
                ? { ...prev.plan, status: "completed" as const }
                : prev.plan,
            summarizing: false,
          };
        });
        return;
      }

      const action: AgentTimelineAction = {
        id: payload.id || `action-${Date.now()}`,
        type,
        label,
        detail,
        status,
        timestamp: Date.now(),
      };

      setTimeline((prev) => ({
        ...prev,
        actions: [...prev.actions, action],
        plan:
          prev.plan && prev.plan.status === "active"
            ? { ...prev.plan, status: "completed" as const }
            : prev.plan,
        summarizing: false,
      }));
    },
    [],
  );

  const handleTerminalOutput = useCallback((payload: any) => {
    setTimeline((prev) => {
      const lastActiveIndex = prev.actions.findLastIndex(
        (a) =>
          a.status === "active" &&
          (a.type === "executing" ||
            a.toolName === "run_command" ||
            a.toolName === "command"),
      );

      if (lastActiveIndex === -1) {
        return prev;
      }

      const actions = [...prev.actions];
      const action = actions[lastActiveIndex];
      actions[lastActiveIndex] = {
        ...action,
        terminalOutput: (action.terminalOutput || "") + payload.content,
      };

      return { ...prev, actions };
    });
  }, []);

  // Legacy bot response handler
  const handleLegacyBotResponse = useCallback(
    (payload: any) => {
      const botMessage: IWebviewMessage = {
        id: `bot-${Date.now()}`,
        type: "bot",
        content: payload.message || payload.content || "",
        language: payload.language || "Typescript",
        alias: payload.alias || "O",
        isStreaming: false,
        timestamp: Date.now(),
      };
      setCompletedMessages((prev) => [...prev, botMessage]);
      setIsLegacyLoading(false);

      if (onLegacyMessage) {
        onLegacyMessage([botMessage]);
      }
    },
    [onLegacyMessage],
  );

  // Send message
  const sendMessage = useCallback(
    (content: string, metadata?: Record<string, any>) => {
      const userMessage: IWebviewMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        content,
        timestamp: Date.now(),
        alias: metadata?.alias || "O",
        ...metadata,
      };
      setCompletedMessages((prev) => [...prev, userMessage]);
      setIsLegacyLoading(true);

      vscodeApi.postMessage({
        command: "user-input",
        message: content,
        metaData: {
          ...metadata,
          threadId: metadata?.threadId ?? threadIdRef.current,
        },
      });
    },
    [vscodeApi],
  );

  const cancelCurrentRequest = useCallback(() => {
    const requestId = currentRequestIdRef.current;
    if (!requestId) return;

    setPendingApproval(null);
    setTimeline((prev) => ({
      ...prev,
      actions: prev.actions.map((a) =>
        a.status === "active" ? { ...a, status: "failed" as const } : a,
      ),
      plan:
        prev.plan && prev.plan.status === "active"
          ? { ...prev.plan, status: "completed" as const }
          : prev.plan,
      summarizing: false,
      result: { summary: "Stopped by user" },
    }));

    vscodeApi.postMessage({
      command: "cancel-request",
      requestId,
      threadId: threadIdRef.current,
    });
  }, [vscodeApi]);

  // Message event listener
  useEffect(() => {
    const messageHandler = (event: any) => {
      // Debug logging left in place to help trace streaming issues; consider gating behind a flag if noisy
      console.log("[useStreamingChat] Received message event:", event.data);
      const message = event.data;
      const { command, type } = message;

      // Handle both 'command' and 'type' for backward compatibility
      const messageType = command || type;
      console.log("[useStreamingChat] Processing messageType:", messageType);

      switch (messageType) {
        // Streaming commands
        case StreamEventType.START:
          console.log("[useStreamingChat] STREAM_START:", message.payload);
          handleStreamStart(message.payload);
          break;
        case StreamEventType.CHUNK:
          handleStreamChunk(message.payload);
          break;
        case StreamEventType.END:
          console.log("[useStreamingChat] STREAM_END:", message.payload);
          handleStreamEnd(message.payload);
          break;
        case StreamEventType.ERROR:
          console.log("[useStreamingChat] STREAM_ERROR:", message.payload);
          handleStreamError(message.payload);
          break;

        // Tool activity events
        case StreamEventType.TOOL_START:
          console.log("[useStreamingChat] TOOL_START:", message.payload);
          handleToolStart(message.payload);
          break;
        case StreamEventType.TOOL_END:
          console.log("[useStreamingChat] TOOL_END:", message.payload);
          handleToolEnd(message.payload);
          break;
        case StreamEventType.TOOL_PROGRESS:
          handleToolProgress(message.payload);
          break;
        case StreamEventType.PLANNING:
          console.log("[useStreamingChat] PLANNING:", message.payload);
          handlePlanning(message.payload);
          break;
        case StreamEventType.SUMMARIZING:
          console.log("[useStreamingChat] SUMMARIZING:", message.payload);
          handleSummarizing();
          break;
        case StreamEventType.THINKING:
          console.log("[useStreamingChat] THINKING:", message.payload);
          handleThinkingStart(message.payload);
          break;
        case StreamEventType.THINKING_START:
          console.log("[useStreamingChat] THINKING_START:", message.payload);
          handleThinkingStart(message.payload);
          break;
        case StreamEventType.THINKING_UPDATE:
          console.log("[useStreamingChat] THINKING_UPDATE:", message.payload);
          handleThinkingUpdate(message.payload);
          break;
        case StreamEventType.THINKING_END:
          console.log("[useStreamingChat] THINKING_END:", message.payload);
          handleThinkingEnd();
          break;
        case StreamEventType.METADATA:
          console.log("[useStreamingChat] METADATA:", message.payload);
          handleMetadata(message.payload);
          break;

        // New detailed activity events
        case StreamEventType.DECISION:
          console.log("[useStreamingChat] DECISION:", message.payload);
          handleActivityEvent("decision", message.payload);
          break;
        case StreamEventType.READING:
          console.log("[useStreamingChat] READING:", message.payload);
          handleActivityEvent("reading", message.payload);
          break;
        case StreamEventType.SEARCHING:
          console.log("[useStreamingChat] SEARCHING:", message.payload);
          handleActivityEvent("searching", message.payload);
          break;
        case StreamEventType.REVIEWING:
          console.log("[useStreamingChat] REVIEWING:", message.payload);
          handleActivityEvent("reviewing", message.payload);
          break;
        case StreamEventType.ANALYZING:
          handleActivityEvent("analyzing", message.payload);
          break;
        case StreamEventType.EXECUTING:
          handleActivityEvent("executing", message.payload);
          break;
        case StreamEventType.WORKING:
          handleActivityEvent("working", message.payload);
          break;
        case StreamEventType.TERMINAL_OUTPUT:
          handleTerminalOutput(message.payload);
          break;

        // Legacy non-streaming response
        case "bot-response":
          if (!enableStreaming || !currentRequestIdRef.current) {
            handleLegacyBotResponse(message);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", messageHandler);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [
    enableStreaming,
    handleStreamStart,
    handleStreamChunk,
    handleStreamEnd,
    handleStreamError,
    handleToolStart,
    handleToolEnd,
    handleToolProgress,
    handlePlanning,
    handleSummarizing,
    handleMetadata,
    handleActivityEvent,
    handleTerminalOutput,
    handleLegacyBotResponse,
  ]);

  return {
    messages: streamedMessages,
    timeline,
    isStreaming: !!streamingMessage,
    isLoading: isLegacyLoading || !!streamingMessage,
    sendMessage,
    addMessage,
    clearMessages,
    setMessages: setCompletedMessages,
    pendingApproval,
    cancelCurrentRequest,
    threadId: threadIdRef.current,
  };
};

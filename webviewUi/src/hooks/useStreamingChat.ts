import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityItem } from "../components/AgentActivityFeed";

export interface IWebviewMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  language?: string;
  alias?: string;
  senderInitial?: string;
  isStreaming?: boolean;
  timestamp?: number;
  activities?: ActivityItem[];
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
  ERROR: "onStreamError",
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
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const currentRequestIdRef = useRef<string | null>(null);

  // Combine completed and streaming messages
  const streamedMessages = useMemo(() => {
    const messages = streamingMessage
      ? [...completedMessages, streamingMessage]
      : completedMessages;

    // Attach current activities to the last bot message
    if (messages.length > 0 && activities.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.type === "bot") {
        return messages.map((msg, idx) =>
          idx === messages.length - 1 ? { ...msg, activities } : msg,
        );
      }
    }
    return messages;
  }, [completedMessages, streamingMessage, activities]);

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
    setActivities([]);
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
      setActivities([]); // Clear activities for new stream
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
        const newContent =
          payload.accumulated ?? prev.content + payload.content;
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
          activities: [...activities], // Include activities in final message
        };
        setCompletedMessages((prevCompleted) => [
          ...prevCompleted,
          finalMessage,
        ]);
        return null;
      });

      // Clear activities after a delay to allow user to see the final state
      setTimeout(() => {
        setActivities([]);
      }, 2000);

      currentRequestIdRef.current = null;
    },
    [enableStreaming, activities],
  );

  const handleStreamError = useCallback(
    (payload: any) => {
      if (!enableStreaming) return;
      if (payload.requestId !== currentRequestIdRef.current) return;

      // Mark all active activities as failed
      setActivities((prev) =>
        prev.map((a) =>
          a.status === "active" ? { ...a, status: "failed" as const } : a,
        ),
      );

      const errorContent =
        payload.error || "An error occurred during streaming";

      // Always create an error message, even if no streaming message exists
      setStreamingMessage((prev) => {
        const errorMessage: IWebviewMessage = {
          id: `error-${Date.now()}`,
          type: "bot",
          isStreaming: false,
          content: errorContent,
          timestamp: Date.now(),
          language: prev?.language || "text",
          alias: prev?.alias || "O",
        };
        setCompletedMessages((prevCompleted) => [
          ...prevCompleted,
          errorMessage,
        ]);
        return null;
      });

      // Clear activities after showing error
      setTimeout(() => {
        setActivities([]);
      }, 3000);

      currentRequestIdRef.current = null;
      setIsLegacyLoading(false);
    },
    [enableStreaming],
  );

  // Tool activity handlers
  const handleToolStart = useCallback((payload: any) => {
    const activity: ActivityItem = {
      id: payload.toolId || `activity-${Date.now()}`,
      type: "tool_start",
      toolName: payload.toolName,
      description: payload.description || `Running ${payload.toolName}...`,
      status: "active",
      timestamp: Date.now(),
    };
    setActivities((prev) => [...prev, activity]);
  }, []);

  const handleToolEnd = useCallback((payload: any) => {
    setActivities((prev) =>
      prev.map((activity) =>
        (activity.toolName === payload.toolName ||
          activity.id === payload.toolId) &&
        activity.status === "active"
          ? {
              ...activity,
              status: payload.status === "failed" ? "failed" : "completed",
              result: payload.result,
              duration: payload.duration,
            }
          : activity,
      ),
    );
  }, []);

  const handleToolProgress = useCallback((payload: any) => {
    setActivities((prev) =>
      prev.map((activity) =>
        activity.toolName === payload.toolName && activity.status === "active"
          ? {
              ...activity,
              description: payload.message || activity.description,
            }
          : activity,
      ),
    );
  }, []);

  const handlePlanning = useCallback((payload: any) => {
    const activity: ActivityItem = {
      id: `planning-${Date.now()}`,
      type: "planning",
      toolName: "planning",
      description: payload.content || "Analyzing your request...",
      status: "active",
      timestamp: Date.now(),
    };
    setActivities((prev) => {
      // Replace existing planning activity or add new
      const filtered = prev.filter((a) => a.type !== "planning");
      return [...filtered, activity];
    });

    // Mark planning as complete after a brief delay
    setTimeout(() => {
      setActivities((prev) =>
        prev.map((a) =>
          a.type === "planning" && a.status === "active"
            ? { ...a, status: "completed" as const }
            : a,
        ),
      );
    }, 1500);
  }, []);

  const handleSummarizing = useCallback((payload: any) => {
    const activity: ActivityItem = {
      id: `summarizing-${Date.now()}`,
      type: "summarizing",
      toolName: "summarizing",
      description: payload.content || "Preparing response...",
      status: "active",
      timestamp: Date.now(),
    };
    setActivities((prev) => [...prev, activity]);

    // Mark as complete shortly after
    setTimeout(() => {
      setActivities((prev) =>
        prev.map((a) =>
          a.type === "summarizing" && a.status === "active"
            ? { ...a, status: "completed" as const }
            : a,
        ),
      );
    }, 1000);
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
        metaData: metadata,
      });
    },
    [vscodeApi],
  );

  // Message event listener
  useEffect(() => {
    const messageHandler = (event: any) => {
      console.log("Received message event:", event.data);
      const message = event.data;
      const { command, type } = message;

      // Handle both 'command' and 'type' for backward compatibility
      const messageType = command || type;

      switch (messageType) {
        // Streaming commands
        case StreamEventType.START:
          handleStreamStart(message.payload);
          break;
        case StreamEventType.CHUNK:
          handleStreamChunk(message.payload);
          break;
        case StreamEventType.END:
          handleStreamEnd(message.payload);
          break;
        case StreamEventType.ERROR:
          handleStreamError(message.payload);
          break;

        // Tool activity events
        case StreamEventType.TOOL_START:
          handleToolStart(message.payload);
          break;
        case StreamEventType.TOOL_END:
          handleToolEnd(message.payload);
          break;
        case StreamEventType.TOOL_PROGRESS:
          handleToolProgress(message.payload);
          break;
        case StreamEventType.PLANNING:
          handlePlanning(message.payload);
          break;
        case StreamEventType.SUMMARIZING:
          handleSummarizing(message.payload);
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
    handleLegacyBotResponse,
  ]);

  return {
    messages: streamedMessages,
    activities,
    isStreaming: !!streamingMessage,
    isLoading: isLegacyLoading || !!streamingMessage,
    sendMessage,
    addMessage,
    clearMessages,
    setMessages: setCompletedMessages,
  };
};

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface IWebviewMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  language?: string;
  alias?: string;
  senderInitial?: string;
  isStreaming?: boolean;
  timestamp?: number;
}

interface UseStreamingChatOptions {
  enableStreaming?: boolean;
  onLegacyMessage?: (messages: IWebviewMessage[]) => void;
}

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

  const currentRequestIdRef = useRef<string | null>(null);

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
    currentRequestIdRef.current = null;
  }, []);

  // Streaming handlers
  const handleStreamStart = useCallback(
    (payload: any) => {
      console.log("payload", payload);
      if (!enableStreaming) return;

      const tempId = `temp-${payload.requestId || Date.now()}`;
      currentRequestIdRef.current = payload.requestId;
      setIsLegacyLoading(false);
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
        };
        setCompletedMessages((prevCompleted) => [
          ...prevCompleted,
          finalMessage,
        ]);
        return null;
      });

      currentRequestIdRef.current = null;
    },
    [enableStreaming],
  );

  const handleStreamError = useCallback(
    (payload: any) => {
      if (!enableStreaming) return;
      if (payload.requestId !== currentRequestIdRef.current) return;

      setStreamingMessage((prev) => {
        if (!prev) return null;
        const errorMessage: IWebviewMessage = {
          ...prev,
          id: `error-${Date.now()}`,
          isStreaming: false,
          content: payload.error || "An error occurred during streaming",
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
      console.log("event", event);
      const message = event.data;
      const { command, type } = message;

      // Handle both 'command' and 'type' for backward compatibility
      const messageType = command || type;

      switch (messageType) {
        // Streaming commands
        case "onStreamStart":
          handleStreamStart(message.payload);
          break;
        case "onStreamChunk":
          handleStreamChunk(message.payload);
          break;
        case "onStreamEnd":
          handleStreamEnd(message.payload);
          break;
        case "onStreamError":
          handleStreamError(message.payload);
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
    handleLegacyBotResponse,
  ]);

  return {
    messages: streamedMessages,
    isStreaming: !!streamingMessage,
    isLoading: isLegacyLoading || !!streamingMessage,
    sendMessage,
    addMessage,
    clearMessages,
    setMessages: setCompletedMessages,
  };
};

import { VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import React, { useCallback, useRef, useState } from "react";
import AttachmentIcon from "./attachmentIcon";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  onStop?: () => void;
  onAttachmentClick?: () => void;
}

const MicIcon = ({ listening }: { listening: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={listening ? "red" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  onStop,
  onAttachmentClick,
}) => {
  const [userInput, setUserInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const onSendMessageRef = useRef(onSendMessage);
  React.useEffect(() => {
    onSendMessageRef.current = onSendMessage;
  }, [onSendMessage]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTextChange = useCallback((event: any) => {
    if (disabled) return;
    setUserInput(event.target.value);
  }, [disabled]);

  const sendMessage = useCallback(() => {
    if (disabled) return;
    onSendMessageRef.current(userInput);
    setUserInput("");
  }, [userInput, disabled]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled) return;
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    },
    [sendMessage, disabled]
  );

  const startListening = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      console.warn("Speech recognition not supported in this environment");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setUserInput((prev) => (prev ? prev + " " : "") + speechResult);
    };

    recognition.start();
  }, []);

  return (
    <div style={{ display: "grid", gap: "8px", position: "relative" }}>
      <VSCodeTextArea
        value={userInput}
        onInput={handleTextChange}
        placeholder={disabled ? "Agent is working..." : "Ask CodeBuddy..."}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{
          width: "100%",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <AttachmentIcon onClick={onAttachmentClick} disabled={disabled} />
          
          <svg
            className={`attachment-icon${disabled ? " active" : ""}`}
            onClick={disabled ? onStop : undefined}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: disabled ? 1 : 0.4,
              cursor: disabled ? "pointer" : "default",
            }}
            role="button"
            aria-label="Stop run"
          >
            <title>{disabled ? "Stop run" : "Stop (no active run)"}</title>
            <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
          </svg>

          {!disabled && (
            <div
              style={{
                cursor: "pointer",
                padding: "4px",
                borderRadius: "4px",
                backgroundColor: isListening ? "rgba(255, 0, 0, 0.2)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isListening ? "red" : "inherit"
              }}
              onClick={startListening}
              title="Voice Input"
            >
              <MicIcon listening={isListening} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInput;

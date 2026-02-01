import { VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import React, { useCallback, useRef, useState } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [userInput, setUserInput] = useState("");

  const onSendMessageRef = useRef(onSendMessage);
  React.useEffect(() => {
    onSendMessageRef.current = onSendMessage;
  }, [onSendMessage]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTextChange = useCallback((event: any) => {
    if (disabled) return;
    setUserInput(event.target.value);
  }, [disabled]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (disabled) return;
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    },
    [userInput, disabled]
  );

  const sendMessage = useCallback(() => {
    if (disabled) return;
    if (userInput.trim()) {
      onSendMessageRef.current(userInput);
      setUserInput("");
    }
  }, [userInput, disabled]);

  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <VSCodeTextArea
        value={userInput}
        onInput={handleTextChange}
        placeholder={disabled ? "Agent is working..." : "Ask Anything"}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{ 
          background: "#16161e",
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
    </div>
  );
};

export default ChatInput;

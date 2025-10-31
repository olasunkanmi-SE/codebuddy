import { VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import React, { useState, useCallback, useRef } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [userInput, setUserInput] = useState("");

  const onSendMessageRef = useRef(onSendMessage);
  React.useEffect(() => {
    onSendMessageRef.current = onSendMessage;
  }, [onSendMessage]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTextChange = useCallback((event: any) => {
    setUserInput(event.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    },
    [userInput]
  );

  const sendMessage = useCallback(() => {
    if (userInput.trim()) {
      onSendMessageRef.current(userInput);
      setUserInput("");
    }
  }, [userInput]);

  return (
    <div>
      <VSCodeTextArea
        value={userInput}
        onInput={handleTextChange}
        placeholder="Ask Anything"
        onKeyDown={handleKeyDown}
        style={{ background: "#16161e" }}
      />
    </div>
  );
};

export default ChatInput;

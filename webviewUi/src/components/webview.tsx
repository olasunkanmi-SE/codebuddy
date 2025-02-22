/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Message {
  type: "user" | "bot";
  content: string;
  language?: string;
  alias?: string;
}

export interface ExtensionMessage {
  type: string;
  payload: any;
}

import { VSCodeButton, VSCodeDropdown, VSCodeOption, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react";
import { useEffect, useState } from "react";
import { BotMessage } from "./botMessage";
import { UserMessage } from "./personMessage";

const vscode = (() => {
  if (typeof window !== "undefined" && "acquireVsCodeApi" in window) {
    return (window as any).acquireVsCodeApi();
  }
  // Fallback for non-VSCode environments
  return {
    postMessage: (message: any) => {
      console.log("Message to VS Code:", message);
    },
  };
})();

export const WebviewUI = () => {
  const [selectedModel, setSelectedModel] = useState("");
  const [userInput, setUserInput] = useState("");
  const [messsages, setMessages] = useState<Message[]>();

  useEffect(() => {
    console.log(selectedModel);
    const messageHandler = (event: any) => {
      const message = event.data;

      switch (message.type) {
        case "bot-response":
          console.log("message", message);
          setMessages((prevMessages) => [
            ...(prevMessages || []),
            {
              type: "bot",
              content: message.message,
              language: "Typescript",
            },
          ]);

          break;
        case "error":
          // TODO Handle Error, send a vscode.postMessage.
          // The extension can give a feed back with showinfoMessage
          console.error("Extension error", message.payload);
          break;
        case "modelUpdate":
          // TODO Handle Model update
          setSelectedModel(message.payload.model);
          break;
        default:
          console.warn("Unknown message type", message.type);
      }
    };
    window.addEventListener("message", messageHandler);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, []);

  const handleDropdownChange = (e: any) => {
    const newValue = e.target.value;
    setSelectedModel(newValue);
    vscode.postMessage({
      command: "modelSelected",
      value: {
        model: newValue,
      },
    });
  };

  const handleTextChange = (e: any) => {
    const newValue = e.target.value;
    setUserInput(newValue);
  };

  const handleSend = () => {
    if (!userInput.trim()) return;

    setMessages((previousMessages) => [
      ...(previousMessages || []),
      {
        type: "user",
        content: userInput,
        alias: "O",
      },
    ]);

    vscode.postMessage({
      command: "user-input",
      message: userInput,
      tags: ["file", "index", "search"],
    });

    setUserInput("");
  };

  return (
    <div className="container">
      <div className="dropdown-container">
        <div>
          {messsages?.map((msg, index) =>
            msg.type === "bot" ? (
              <BotMessage key={index} content={msg.content} />
            ) : (
              <UserMessage key={index} message={msg.content} alias={msg.alias} />
            )
          )}
          {/* {isLoading && <div className="loading">Processing...</div>} */}
        </div>
      </div>
      <div className="business">
        <VSCodeDropdown value={selectedModel} id="my-dropdown" onChange={handleDropdownChange}>
          <VSCodeOption value="">Select a Model</VSCodeOption>
          <VSCodeOption value="Anthropic">Anthropic</VSCodeOption>
          <VSCodeOption value="Claude">Claude</VSCodeOption>
          <VSCodeOption value="Grok">Grok</VSCodeOption>
        </VSCodeDropdown>
        <div className="textarea-container">
          <VSCodeTextArea
            value={userInput}
            onInput={handleTextChange}
            placeholder="Ask a question or enter '/' for quick actions"
          />
        </div>
        <div className="dropdown-container">
          <VSCodeButton appearance="secondary" onClick={handleSend}>
            Send
          </VSCodeButton>
        </div>
      </div>
    </div>
  );
};

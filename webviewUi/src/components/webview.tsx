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

import {
  VSCodeTextArea,
  VSCodePanels,
  VSCodePanelTab,
  VSCodePanelView,
} from "@vscode/webview-ui-toolkit/react";
import type hljs from "highlight.js";
import { useEffect, useState } from "react";
import { codeBuddyMode, modelOptions } from "../constants/constant";
import { getChatCss } from "../themes/chat_css";
import { updateStyles } from "../utils/dynamicCss";
import { highlightCodeBlocks } from "../utils/highlightCode";
import AttachmentIcon from "./attachmentIcon";
import { BotIcon } from "./botIcon";
import { BotMessage } from "./botMessage";
import { UserMessage } from "./personMessage";
import { ModelDropdown } from "./select";
import WorkspaceSelector from "./context";

const hljsApi = window["hljs" as any] as unknown as typeof hljs;

const vsCode = (() => {
  if (typeof window !== "undefined" && "acquireVsCodeApi" in window) {
    return (window as any).acquireVsCodeApi();
  }

  return {
    postMessage: (message: any) => {
      console.log("Message to VS Code:", message);
    },
  };
})();

export const WebviewUI = () => {
  const css = getChatCss("tokyo night");
  updateStyles(css);
  const [selectedModel, setSelectedModel] = useState("Gemini");
  const [selectedCodeBuddyMode, setSelectedCodeBuddyMode] = useState("Ask");
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tab-1");
  const [selectedContext, setSelectedContext] = useState("");
  const [folders, setFolders] = useState<any>("");
  const [activeEditor, setActiveEditor] = useState("");

  useEffect(() => {
    const messageHandler = (event: any) => {
      setIsBotLoading(true);
      const message = event.data;
      switch (message.type) {
        case "bot-response":
          setIsBotLoading(false);
          setMessages((prevMessages) => [
            ...(prevMessages || []),
            {
              type: "bot",
              content: message.message,
              language: "Typescript",
            },
          ]);
          break;
        case "bootstrap":
          setFolders(message);
          break;
        case "error":
          console.error("Extension error", message.payload);
          break;
        case "onActiveworkspaceUpdate":
          setActiveEditor(message.message ?? "");
          break;
        default:
          console.warn("Unknown message type", message.type);
      }
    };
    window.addEventListener("message", messageHandler);
    highlightCodeBlocks(hljsApi, messages);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [messages]);

  const handleContextChange = (value: string) => {
    setSelectedContext(value);
  };

  const handleModelChange = (e: any) => {
    const newValue = e.target.value;
    setSelectedModel(newValue);
    vsCode.postMessage({
      topic: "update-model-event",
      payload: newValue,
    });
  };

  const handleCodeBuddyMode = (e: any) => {
    const newValue = e.target.value;
    setSelectedCodeBuddyMode(newValue);
    vsCode.postMessage({
      topic: "codebuddy-mode-change-event",
      payload: newValue,
    });
  };

  const handleTextChange = (e: any) => {
    const newValue = e.target.value;
    setUserInput(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    // TODO Compare the data to be sent to the data recieved.
    // TODO Since the folders will come through the parent, you can filter the values with the folders and files
    if (!userInput.trim()) return;

    setMessages((previousMessages) => [
      ...(previousMessages || []),
      {
        type: "user",
        content: userInput,
        alias: "O",
      },
    ]);

    setIsBotLoading(true);

    vsCode.postMessage({
      command: "user-input",
      message: userInput,
      metaData: {
        mode: selectedCodeBuddyMode,
        context: selectedContext.split("@"),
      },
    });

    setUserInput("");
  };

  const handleGetContext = () => {
    vsCode.postMessage({
      command: "upload-file",
      message: userInput,
    });
  };

  return (
    <div style={{ overflow: "hidden" }}>
      <VSCodePanels className="vscodePanels" activeid={activeTab}>
        <VSCodePanelTab id="tab-1" onClick={() => setActiveTab("tab-1")}>
          CHAT
        </VSCodePanelTab>
        <VSCodePanelTab id="tab-2" onClick={() => setActiveTab("tab-2")}>
          HISTORY
        </VSCodePanelTab>
        <VSCodePanelTab id="tab-3" onClick={() => setActiveTab("tab-3")}>
          SETTINGS
        </VSCodePanelTab>
        <VSCodePanelTab id="tab-4" onClick={() => setActiveTab("tab-4")}>
          OTHERS
        </VSCodePanelTab>

        <VSCodePanelView
          id="view-1"
          style={{ height: "calc(100vh - 55px)", position: "relative" }}
        >
          <div className="chat-content">
            <div className="dropdown-container">
              <div>
                {messages?.map((msg) =>
                  msg.type === "bot" ? (
                    <BotMessage key={msg.content} content={msg.content} />
                  ) : (
                    <UserMessage
                      key={msg.content}
                      message={msg.content}
                      alias={msg.alias}
                    />
                  )
                )}
                {isBotLoading && <BotIcon isBlinking={true} />}
              </div>
            </div>
          </div>
        </VSCodePanelView>

        <VSCodePanelView id="view-2">1 </VSCodePanelView>
        <VSCodePanelView id="view-3">2 </VSCodePanelView>
        <VSCodePanelView id="view-4">3 </VSCodePanelView>
      </VSCodePanels>
      <div
        className="business"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          padding: "10px",
          backgroundColor: "#16161e",
        }}
      >
        <div className="textarea-container">
          <div className="horizontal-stack">
            <span className="currenFile">
              <small>
                Active workspace:
                {selectedContext.includes(activeEditor)
                  ? ""
                  : `${activeEditor}`}
              </small>
              <small>
                {Array.from(
                  new Set(selectedContext.split("@").join(", ").split(", "))
                ).join(" ")}
              </small>
            </span>
          </div>
          <WorkspaceSelector
            activeEditor={activeEditor}
            onInputChange={handleContextChange}
            folders={folders}
          />

          <VSCodeTextArea
            value={userInput}
            onInput={handleTextChange}
            placeholder="Ask Anything"
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="horizontal-stack">
          <AttachmentIcon onClick={handleGetContext} />
          <ModelDropdown
            value={selectedModel}
            onChange={handleModelChange}
            options={modelOptions}
            id="model"
          />
          <ModelDropdown
            value={selectedCodeBuddyMode}
            onChange={handleCodeBuddyMode}
            options={codeBuddyMode}
            id="cBuddymode"
          />
        </div>
      </div>
    </div>
  );
};

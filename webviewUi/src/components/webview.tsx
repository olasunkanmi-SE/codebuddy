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

import { VSCodePanels, VSCodePanelTab, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";
import type hljs from "highlight.js";
import { useCallback, useEffect, useRef, useState, useMemo } from "react"; // Use useCallback and useMemo
import { codeBuddyMode, faqItems, modelOptions, themeOptions } from "../constants/constant";
import { getChatCss } from "../themes/chat_css";
import { updateStyles } from "../utils/dynamicCss";
import { highlightCodeBlocks } from "../utils/highlightCode";
import AttachmentIcon from "./attachmentIcon";
import { BotMessage } from "./botMessage";
import { UserMessage } from "./personMessage";
import { ModelDropdown } from "./select";
import WorkspaceSelector from "./context";
import TextInput from "./textInput";
import ToggleButton from "./toggleButton";
import Button from "./button";
import { FAQAccordion } from "./accordion";
import { SkeletonLoader } from "./skeletonLoader";
import { CommandFeedbackLoader } from "./commandFeedbackLoader";
import ChatInput from "./ChatInput";

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

// Define a type for configuration data for better type safety
interface ConfigData {
  username?: string;
  theme?: string;
}

export const WebviewUI = () => {
  // State variables
  const [selectedTheme, setSelectedTheme] = useState("tokyo night");
  const [selectedModel, setSelectedModel] = useState("Gemini");
  const [selectedCodeBuddyMode, setSelectedCodeBuddyMode] = useState("Ask");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotLoading, setIsBotLoading] = useState(false);
  const [commandAction, setCommandAction] = useState<string>("");
  const [commandDescription, setCommandDescription] = useState<string>("");
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState("tab-1");
  const [selectedContext, setSelectedContext] = useState("");
  const [folders, setFolders] = useState<any>("");
  const [activeEditor, setActiveEditor] = useState("");
  const [username, setUsername] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // Ref for username input element
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Memoize the chat CSS to prevent unnecessary re-renders
  const chatCss = useMemo(() => getChatCss(selectedTheme), [selectedTheme]);

  // Use useCallback to prevent unnecessary re-renders of the message handler
  const messageHandler = useCallback((event: any) => {
    const message = event.data;
    switch (message.type) {
      case "bot-response":
        // Use functional updates to ensure we're working with the most recent state
        setMessages((prevMessages) => [
          ...(prevMessages || []),
          {
            type: "bot",
            content: message.message,
            language: "Typescript",
            alias: "O",
          },
        ]);
        setIsBotLoading(false);
        setIsCommandExecuting(false);
        setCommandAction("");
        setCommandDescription("");
        break;
      case "codebuddy-commands":
        // Handle command feedback - show what action is being performed
        console.log("Command feedback received:", message.message);
        setIsCommandExecuting(true);
        if (typeof message.message === "object" && message.message.action && message.message.description) {
          setCommandAction(message.message.action);
          setCommandDescription(message.message.description);
        } else {
          // Fallback for legacy string format
          setCommandAction(message.message || "Processing request");
          setCommandDescription("CodeBuddy is analyzing your code and generating a response...");
        }
        break;
      case "bootstrap":
        setFolders(message);
        break;
      case "chat-history":
        try {
          // Parse the chat history efficiently using JSON.parse
          const parsedMessages = JSON.parse(message.message);
          setMessages((prevMessages) => [...parsedMessages, ...(prevMessages || [])]);
        } catch (error: any) {
          console.log(error);
          throw new Error(error.message);
        }
        break;
      case "error":
        console.error("Extension error", message.payload);
        setIsBotLoading(false);
        break;
      case "onActiveworkspaceUpdate":
        setActiveEditor(message.message ?? "");
        break;
      case "onConfigurationChange": {
        const data = JSON.parse(message.message);
        return data;
      }
      case "onGetUserPreferences": {
        const data: ConfigData = JSON.parse(message.message);
        if (data.username) {
          setUsername(data.username);
        }
        if (data.theme) {
          setSelectedTheme(data.theme);
        }
        return data;
      }
      case "theme-settings":
        // Handle theme settings from extension
        if (message.theme) {
          setSelectedTheme(message.theme);
        }
        break;
      default:
        console.warn("Unknown message type", message.type);
    }
  }, []);

  // Update CSS whenever theme changes using useEffect
  useEffect(() => {
    // Update styles using dynamicCss utility
    updateStyles(chatCss);
  }, [chatCss]);

  // Initialize event listener for messages from VS Code
  useEffect(() => {
    window.addEventListener("message", messageHandler);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [messageHandler]); // Dependency array includes messageHandler

  // Separate effect for highlighting code blocks using highlightCodeBlocks utility
  useEffect(() => {
    highlightCodeBlocks(hljsApi, messages);
  }, [messages]);

  const handleClearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  const handleUserPreferences = useCallback(() => {
    vsCode.postMessage({
      command: "update-user-info",
      message: JSON.stringify({
        username,
      }),
    });
  }, [username]);

  const handleContextChange = useCallback((value: string) => {
    setSelectedContext(value);
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  }, []);

  const handleToggle = useCallback((isActive: boolean) => {
    setDarkMode(isActive);
    // Apply theme change logic here
    document.body.classList.toggle("dark-mode", isActive);
  }, []);

  const handleModelChange = useCallback((e: any) => {
    const newValue = e.target.value;
    setSelectedModel(newValue);
    vsCode.postMessage({
      command: "update-model-event",
      message: newValue,
    });
  }, []);

  const handleCodeBuddyMode = useCallback((e: any) => {
    const newValue = e.target.value;
    setSelectedCodeBuddyMode(newValue);
    vsCode.postMessage({
      command: "codebuddy-model-change-event",
      message: newValue,
    });
  }, []);

  const handleThemeChange = useCallback((e: any) => {
    const newValue = e.target.value;
    setSelectedTheme(newValue);
    // Optionally save theme preference to extension storage
    vsCode.postMessage({
      command: "theme-change-event",
      message: newValue,
    });
  }, []);

  // Use useCallback to prevent unnecessary re-renders of the handleSend function
  const handleSend = useCallback(
    (message: string) => {
      if (!message.trim()) return;

      setMessages((previousMessages) => [
        ...(previousMessages || []),
        {
          type: "user",
          content: message,
          alias: "O",
        },
      ]);

      setIsBotLoading(true);

      vsCode.postMessage({
        command: "user-input",
        message: message,
        metaData: {
          mode: selectedCodeBuddyMode,
          context: selectedContext.split("@"),
        },
      });
    },
    [selectedCodeBuddyMode, selectedContext]
  );

  const handleGetContext = useCallback(() => {
    vsCode.postMessage({
      command: "upload-file",
      message: "",
    });
  }, []);

  const processedContext = useMemo(() => {
    const contextArray = Array.from(new Set(selectedContext.split("@").join(", ").split(", ")));
    return contextArray.filter((item) => item.length > 1);
  }, [selectedContext]);

  const memoizedMessages = useMemo(() => {
    return messages.map((msg) =>
      msg.type === "bot" ? (
        <BotMessage key={msg.content} content={msg.content} />
      ) : (
        <UserMessage key={msg.content} message={msg.content} alias={msg.alias} />
      )
    );
  }, [messages]);

  return (
    <div style={{ overflow: "hidden" }}>
      <VSCodePanels className="vscodePanels" activeid={activeTab}>
        <VSCodePanelTab id="tab-1" onClick={() => setActiveTab("tab-1")}>
          CHAT
        </VSCodePanelTab>
        <VSCodePanelTab id="tab-2" onClick={() => setActiveTab("tab-2")}>
          SETTINGS
        </VSCodePanelTab>
        <VSCodePanelTab id="tab-3" onClick={() => setActiveTab("tab-3")}>
          FAQ
        </VSCodePanelTab>
        <VSCodePanelTab id="tab-4" onClick={() => setActiveTab("tab-4")}>
          OTHERS
        </VSCodePanelTab>

        <VSCodePanelView id="view-1" style={{ height: "calc(100vh - 55px)", position: "relative" }}>
          <div className="chat-content">
            <div className="dropdown-container">
              <div>
                {memoizedMessages}
                {isCommandExecuting && (
                  <CommandFeedbackLoader commandAction={commandAction} commandDescription={commandDescription} />
                )}
                {isBotLoading && !isCommandExecuting && <SkeletonLoader />}
              </div>
            </div>
          </div>
        </VSCodePanelView>

        <VSCodePanelView id="view-2">
          <div>
            <div className="horizontal-stack-setting">
              <span> Nickname </span>
              <span>
                <TextInput
                  ref={nameInputRef}
                  onChange={handleNameChange}
                  value={username}
                  className="text-input"
                  maxLength={10}
                  disabled={true}
                />
              </span>
              <span style={{ marginLeft: "5px" }}>
                <Button
                  onClick={handleUserPreferences}
                  initialText="save"
                  clickedText="saving..."
                  duration={2000}
                  disabled={true}
                ></Button>
              </span>
            </div>
            <div className="horizontal-stack-setting">
              {" "}
              <span> Index Codebase </span>
              <span>
                {" "}
                <ToggleButton label="" initialState={darkMode} onToggle={handleToggle} disabled={true} />
              </span>
            </div>
          </div>
        </VSCodePanelView>
        <VSCodePanelView id="view-3">
          <div>
            <FAQAccordion
              items={faqItems.map((i) => ({
                question: i.question,
                answer: <div className="doc-content" dangerouslySetInnerHTML={{ __html: i.answer }} />,
              }))}
            />
          </div>
        </VSCodePanelView>
        <VSCodePanelView id="view-4">In Dev </VSCodePanelView>
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
            <span>
              {selectedContext.length > 1 ? (
                <>
                  <small>Context: </small>
                  <small>
                    {processedContext.map((item) => (
                      <span className="attachment-icon" key={item}>
                        {item}
                      </span>
                    ))}
                  </small>
                </>
              ) : (
                <></>
              )}
            </span>
          </div>
          <div className="horizontal-stack">
            <span className="currenFile">
              <small>Active workspace: </small>
              <small className="attachment-icon">{activeEditor}</small>
            </span>
          </div>
          <WorkspaceSelector activeEditor={activeEditor} onInputChange={handleContextChange} folders={folders} />
          <ChatInput onSendMessage={handleSend} /> {/* Replace VSCodeTextArea with ChatInput */}
        </div>
        <div className="horizontal-stack">
          <AttachmentIcon onClick={handleGetContext} disabled={true} />
          <ModelDropdown value={selectedModel} onChange={handleModelChange} options={modelOptions} id="model" />
          <ModelDropdown
            value={selectedCodeBuddyMode}
            onChange={handleCodeBuddyMode}
            options={codeBuddyMode}
            id="cBuddymode"
          />
          <ModelDropdown value={selectedTheme} onChange={handleThemeChange} options={themeOptions} id="theme" />
          <Button
            onClick={handleClearHistory}
            initialText="Clear history"
            clickedText="Clearing..."
            duration={2000}
          ></Button>
        </div>
      </div>
    </div>
  );
};

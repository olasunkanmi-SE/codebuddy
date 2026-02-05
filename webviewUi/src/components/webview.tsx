/* eslint-disable @typescript-eslint/no-explicit-any */

import { VSCodeButton, VSCodePanels, VSCodePanelTab, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";
import type hljs from "highlight.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { codeBuddyMode, faqItems, modelOptions, themeOptions } from "../constants/constant";
import { IWebviewMessage, useStreamingChat } from "../hooks/useStreamingChat";
import { getChatCss } from "../themes/chat_css";
import { updateStyles } from "../utils/dynamicCss";
import { highlightCodeBlocks } from "../utils/highlightCode";
import { FAQAccordion } from "./accordion";
import { AgentTimeline } from "./AgentTimeline";
import AttachmentIcon from "./attachmentIcon";
import ChatInput from "./ChatInput";
import { CommandFeedbackLoader } from "./commandFeedbackLoader";
import FileMention from "./FileMention";
import { Extensions } from "./extensions";
import { FutureFeatures } from "./futureFeatures";
import MessageRenderer from "./MessageRenderer";
import { UserMessage } from "./personMessage";
import { Settings } from "./settings";
import { SettingsPanel, SettingsGearIcon, SettingsValues, SettingsOptions, SettingsHandlers, DEFAULT_LANGUAGE_OPTIONS, DEFAULT_KEYMAP_OPTIONS, DEFAULT_SUBAGENTS, CustomRule, SubagentConfig } from "./settings/index";
import { SkeletonLoader } from "./skeletonLoader";
import { WelcomeScreen } from "./welcomeUI";

// Styled components for settings toggle
const SettingsToggleButton = styled.button`
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.95);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
`;

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

interface ConfigData {
  username?: string;
  theme?: string;
  enableStreaming?: boolean;
}

export const WebviewUI = () => {
  // State variables
  const [selectedTheme, setSelectedTheme] = useState("tokyo night");
  const [selectedModel, setSelectedModel] = useState("Gemini");
  // Default to Agent so the streaming pipeline is used during testing
  const [selectedCodeBuddyMode, setSelectedCodeBuddyMode] = useState("Agent");
  const [commandAction, setCommandAction] = useState<string>("");
  const [commandDescription, setCommandDescription] = useState<string>("");
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState("tab-1");
  const [selectedContext, setSelectedContext] = useState("");
  const [folders, setFolders] = useState<any>("");
  const [activeEditor, setActiveEditor] = useState("");
  const [username, setUsername] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Rules & Subagents state
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [subagents, setSubagents] = useState<SubagentConfig[]>(DEFAULT_SUBAGENTS);

  // Ref for username input element
  // const nameInputRef = useRef<HTMLInputElement>(null);

  // Initialize streaming chat hook
  const {
    messages: streamedMessages,
    timeline,
    isStreaming,
    isLoading: isBotLoading,
    sendMessage,
    clearMessages,
    setMessages,
    pendingApproval,
    cancelCurrentRequest,
    threadId,
  } = useStreamingChat(vsCode, {
    enableStreaming,
    onLegacyMessage: (messages) => {
      console.log("Legacy message received:", messages);
    },
  });

  // Memoize the chat CSS to prevent unnecessary re-renders
  const chatCss = useMemo(() => getChatCss(selectedTheme), [selectedTheme]);

  // Legacy message handler for non-streaming events
  const legacyMessageHandler = useCallback((event: any) => {
    const message = event.data;
    const messageType = message.command || message.type;

    // Handle stream end to clear command execution state
    // (the actual message handling is done by useStreamingChat hook)
    if (messageType === 'onStreamEnd' || messageType === 'onStreamError') {
      setIsCommandExecuting(false);
      setCommandAction("");
      setCommandDescription("");
      return;
    }

    // Skip other streaming-related messages as they're handled by the hook
    if (message.command?.includes('stream') || message.type?.includes('stream')) {
      return;
    }

    switch (messageType) {
      case "codebuddy-commands":
        console.log("Command feedback received:", message.message);
        setIsCommandExecuting(true);
        if (typeof message.message === "object" && message.message.action && message.message.description) {
          setCommandAction(message.message.action);
          setCommandDescription(message.message.description);
        } else {
          setCommandAction(message.message || "Processing request");
          setCommandDescription("CodeBuddy is analyzing your code and generating a response...");
        }
        break;

      case "bootstrap":
        setFolders(message);
        break;

      case "chat-history":
        try {
          const parsedMessages = JSON.parse(message.message);
          console.log("chat-history received", parsedMessages?.length);
          const formattedMessages: IWebviewMessage[] = parsedMessages.map((msg: any) => ({
            id: `history-${Date.now()}-${Math.random()}`,
            type: msg.type,
            content: msg.content,
            language: msg.language,
            alias: msg.alias,
            timestamp: Date.now(),
          }));
          setMessages((prev: IWebviewMessage[]) => [...formattedMessages, ...prev]);
        } catch (error: any) {
          console.error("Error parsing chat history:", error);
        }
        break;

      case "error":
        console.error("Extension error", message.payload);
        setIsCommandExecuting(false);
        setCommandAction("");
        setCommandDescription("");
        break;

      case "bot-response":
        // Clear command execution state when bot response is received
        // The actual message handling is done by useStreamingChat hook
        setIsCommandExecuting(false);
        setCommandAction("");
        setCommandDescription("");
        break;

      case "onActiveworkspaceUpdate":
        setActiveEditor(message.message ?? "");
        break;

      case "onConfigurationChange": {
        const data = JSON.parse(message.message);
        if (data.enableStreaming !== undefined) {
          setEnableStreaming(data.enableStreaming);
        }
        break;
      }

      case "onGetUserPreferences": {
        const data: ConfigData = JSON.parse(message.message);
        if (data.username) {
          setUsername(data.username);
        }
        if (data.theme) {
          setSelectedTheme(data.theme);
        }
        if (data.enableStreaming !== undefined) {
          setEnableStreaming(data.enableStreaming);
        }
        break;
      }

      case "theme-settings":
        if (message.theme) {
          setSelectedTheme(message.theme);
        }
        break;

      case "rules-data":
        // Handle rules and subagents data from extension
        if (message.data) {
          if (message.data.rules) {
            setCustomRules(message.data.rules);
          }
          if (message.data.systemPrompt !== undefined) {
            setCustomSystemPrompt(message.data.systemPrompt);
          }
          if (message.data.subagents) {
            setSubagents(message.data.subagents);
          }
        }
        break;

      case "rule-added":
        // Handle single rule added
        if (message.data?.rule) {
          setCustomRules(prev => [...prev, message.data.rule]);
        }
        break;

      default:
        // Ignore unknown message types
        break;
    }
  }, [setMessages]);

  // Update CSS whenever theme changes
  useEffect(() => {
    updateStyles(chatCss);
  }, [chatCss]);

  // Initialize legacy event listener
  useEffect(() => {
    window.addEventListener("message", legacyMessageHandler);
    return () => {
      window.removeEventListener("message", legacyMessageHandler);
    };
  }, [legacyMessageHandler]);

  // Signal to extension that webview is ready to receive messages
  useEffect(() => {
    vsCode.postMessage({ command: "webview-ready" });
  }, []);

  // Request chat history on mount (in case the initial push was missed)
  useEffect(() => {
    vsCode.postMessage({ command: "request-chat-history" });
  }, []);

  // Highlight code blocks when messages update
  useEffect(() => {
    highlightCodeBlocks(hljsApi, streamedMessages);
  }, [streamedMessages]);

  // Clear command execution state when streaming completes
  useEffect(() => {
    if (!isStreaming && !isBotLoading) {
      setIsCommandExecuting(false);
      setCommandAction("");
      setCommandDescription("");
    }
  }, [isStreaming, isBotLoading]);

  const handleClearHistory = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  const handleIndexWorkspace = useCallback(() => {
    vsCode.postMessage({ command: "index-workspace" });
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

  // const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  //   setUsername(e.target.value);
  // }, []);

  const handleToggle = useCallback((isActive: boolean) => {
    setDarkMode(isActive);
    document.body.classList.toggle("dark-mode", isActive);
  }, []);

  const handleSend = useCallback(
    (message: string) => {
      if (!message.trim()) return;

      sendMessage(message, {
        // Force Agent mode during testing to ensure langgraph/deepagent streaming path runs
        mode: selectedCodeBuddyMode || "Agent",
        context: selectedContext.split("@"),
        alias: "O",
        threadId,
      });
    },
    [sendMessage, selectedCodeBuddyMode, selectedContext, threadId]
  );

  const handleGetContext = useCallback(() => {
    vsCode.postMessage({
      command: "upload-file",
      message: "",
    });
  }, []);

  const handleApproveAction = useCallback(() => {
    vsCode.postMessage({ command: "user-consent", message: "granted" });
  }, []);

  const handleStop = useCallback(() => {
    cancelCurrentRequest();
  }, [cancelCurrentRequest]);

  const processedContext = useMemo(() => {
    const contextArray = Array.from(new Set(selectedContext.split("@").join(", ").split(", ")));
    return contextArray.filter((item) => item.length > 1);
  }, [selectedContext]);

  const memoizedMessages = useMemo(() => {
    return streamedMessages.map((msg) =>
      msg.type === "bot" ? (
        <MessageRenderer
          key={msg.id}
          content={msg.content}
          language={msg.language}
          isStreaming={msg.isStreaming}
        />
      ) : (
        <UserMessage
          key={msg.id}
          message={msg.content}
          alias={msg.alias}
        />
      )
    );
  }, [streamedMessages]);

  // Settings context values for the new settings panel
  const settingsValues = useMemo<SettingsValues>(() => ({
    theme: selectedTheme,
    language: 'en',
    keymap: 'default',
    nickname: username,
    codeBuddyMode: selectedCodeBuddyMode,
    enableStreaming: enableStreaming,
    selectedModel: selectedModel,
    username: username,
    accountType: 'Free',
    customRules: customRules,
    customSystemPrompt: customSystemPrompt,
    subagents: subagents,
  }), [selectedTheme, username, selectedCodeBuddyMode, enableStreaming, selectedModel, customRules, customSystemPrompt, subagents]);

  const settingsOptions = useMemo<SettingsOptions>(() => ({
    themeOptions: themeOptions,
    modelOptions: modelOptions,
    codeBuddyModeOptions: codeBuddyMode,
    keymapOptions: DEFAULT_KEYMAP_OPTIONS,
    languageOptions: DEFAULT_LANGUAGE_OPTIONS,
  }), []);

  const settingsHandlers = useMemo<SettingsHandlers>(() => ({
    onThemeChange: (value: string) => {
      setSelectedTheme(value);
      vsCode.postMessage({ command: "theme-change-event", message: value });
    },
    onLanguageChange: (_value: string) => {
      // Coming soon - language change
    },
    onKeymapChange: (_value: string) => {
      // Coming soon - keymap change
    },
    onNicknameChange: (value: string) => {
      setUsername(value);
    },
    onCodeBuddyModeChange: (value: string) => {
      setSelectedCodeBuddyMode(value);
      vsCode.postMessage({ command: "codebuddy-model-change-event", message: value });
    },
    onStreamingChange: (enabled: boolean) => {
      setEnableStreaming(enabled);
    },
    onModelChange: (value: string) => {
      setSelectedModel(value);
      vsCode.postMessage({ command: "update-model-event", message: value });
    },
    onUsernameChange: (value: string) => {
      setUsername(value);
    },
    postMessage: (message: { command: string; message?: any }) => {
      vsCode.postMessage(message);
    },
    // Rules & Subagents handlers
    onAddRule: (rule) => {
      const newRule: CustomRule = {
        ...rule,
        id: `rule-${Date.now()}`,
        createdAt: Date.now(),
      };
      setCustomRules(prev => [...prev, newRule]);
    },
    onUpdateRule: (id, updates) => {
      setCustomRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    },
    onDeleteRule: (id) => {
      setCustomRules(prev => prev.filter(r => r.id !== id));
    },
    onToggleRule: (id, enabled) => {
      setCustomRules(prev => prev.map(r => r.id === id ? { ...r, enabled } : r));
    },
    onUpdateSystemPrompt: (prompt) => {
      setCustomSystemPrompt(prompt);
    },
    onToggleSubagent: (id, enabled) => {
      setSubagents(prev => prev.map(s => s.id === id ? { ...s, enabled } : s));
    },
  }), []);

  return (
    <div style={{ overflow: "hidden", width: "100%" }}>
      {/* Settings Toggle Button */}
      <SettingsToggleButton
        onClick={() => setIsSettingsOpen(true)}
        aria-label="Open settings"
        title="Settings"
      >
        <SettingsGearIcon size={18} />
      </SettingsToggleButton>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        username={username || 'CodeBuddy User'}
        accountType="Free"
        settingsValues={settingsValues}
        settingsOptions={settingsOptions}
        settingsHandlers={settingsHandlers}
      />

      <VSCodePanels className="vscodePanels" activeid={activeTab}>
        <VSCodePanelTab id="tab-1" onClick={() => setActiveTab("tab-1")}>
          CHAT
        </VSCodePanelTab>
        <VSCodePanelTab id="tab-2" onClick={() => setActiveTab("tab-2")}>
          SETTINGS
        </VSCodePanelTab>
        <VSCodePanelTab id="tab-3" onClick={() => setActiveTab("tab-3")}>
          EXTENSIONS
        </VSCodePanelTab>
        <VSCodePanelTab id="tab-4" onClick={() => setActiveTab("tab-4")}>
          FAQ
        </VSCodePanelTab>
        <VSCodePanelTab id="tab-5" onClick={() => setActiveTab("tab-5")}>
          FUTURE
        </VSCodePanelTab>
        <VSCodePanelView id="view-1" style={{ height: "calc(100vh - 55px)", position: "relative" }}>
          <div className="chat-content" style={{ maxWidth: "1100px", margin: "0 auto" }}>
            <div className="dropdown-container">
              <div>
                {/* Show welcome screen when there are no messages */}
                {streamedMessages.length === 0 && !isBotLoading && !isCommandExecuting ? (
                  <WelcomeScreen
                    username={username}
                    onGetStarted={() => {
                      // Optional: Focus on the input or trigger a sample prompt
                      console.log("User is ready to start!");
                    }}
                  />
                ) : (
                  <>
                    {memoizedMessages}
                    {/* Show Agent timeline when streaming/working */}
                    {(isStreaming || isBotLoading) && (
                      <AgentTimeline
                        timeline={timeline}
                        isActive={isStreaming || isBotLoading}
                        pendingApproval={pendingApproval}
                        onApprove={handleApproveAction}
                        onDeny={() => vsCode.postMessage({ command: "user-consent", message: "denied" })}
                        isLive
                      />
                    )}
                    {/* Render timeline snapshots for completed bot messages */}
                    {streamedMessages
                      .filter((m) => m.type === "bot" && m.timelineSnapshot)
                      .map((m) => (
                        <AgentTimeline
                          key={`timeline-${m.id}`}
                          timeline={m.timelineSnapshot!}
                          isActive={false}
                          isLive={false}
                        />
                      ))}
                    {isCommandExecuting && (
                      <CommandFeedbackLoader
                        commandAction={commandAction}
                        commandDescription={commandDescription}
                      />
                    )}
                    {/* Show skeleton only if no activities are being tracked */}
                    {isBotLoading &&
                      !isCommandExecuting &&
                      !isStreaming &&
                      !timeline.thinking &&
                      !timeline.plan &&
                      timeline.actions.length === 0 &&
                      !timeline.summarizing && <SkeletonLoader />}
                  </>
                )}
              </div>
            </div>
          </div>
        </VSCodePanelView>

        <VSCodePanelView id="view-2">
          <Settings
            username={username}
            selectedTheme={selectedTheme}
            selectedModel={selectedModel}
            selectedCodeBuddyMode={selectedCodeBuddyMode}
            enableStreaming={enableStreaming}
            darkMode={darkMode}
            themeOptions={themeOptions}
            modelOptions={modelOptions}
            codeBuddyMode={codeBuddyMode}
            onUsernameChange={setUsername}
            onThemeChange={(value) => {
              setSelectedTheme(value);
              vsCode.postMessage({ command: "theme-change-event", message: value });
            }}
            onModelChange={(value) => {
              setSelectedModel(value);
              vsCode.postMessage({ command: "update-model-event", message: value });
            }}
            onCodeBuddyModeChange={(value) => {
              setSelectedCodeBuddyMode(value);
              vsCode.postMessage({ command: "codebuddy-model-change-event", message: value });
            }}
            onStreamingChange={setEnableStreaming}
            onDarkModeChange={handleToggle}
            onClearHistory={handleClearHistory}
            onIndexWorkspace={handleIndexWorkspace}
            onSavePreferences={handleUserPreferences}
          />
        </VSCodePanelView>

        <VSCodePanelView id="view-3">
          <Extensions
            onAddMCPServer={(server) => console.log('Add server:', server)}
            onAddAgent={(agent) => console.log('Add agent:', agent)}
          />
        </VSCodePanelView>

        <VSCodePanelView id="view-4">
          <div>
            <VSCodePanelView id="view-4">
              <div>
                <VSCodePanelView id="view-4">
                  <div>
                    <FAQAccordion items={faqItems} />
                  </div>
                </VSCodePanelView>
              </div>
            </VSCodePanelView>
          </div>
        </VSCodePanelView>
        <VSCodePanelView id="view-5">
          <FutureFeatures />
        </VSCodePanelView>
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
          <FileMention activeEditor={activeEditor} onInputChange={handleContextChange} folders={folders} />
          {pendingApproval && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                border: "1px solid #2a2a36",
                borderRadius: "10px",
                background: "#1e1e2a",
                marginBottom: "8px",
              }}
            >
              <div style={{ color: "#d0d0dc", fontSize: "13px", marginRight: "12px" }}>
                {`Approve ${pendingApproval.toolName || "tool"} to proceed — ${pendingApproval.description || `Preparing to run ${pendingApproval.toolName || "tool"}`}`}
              </div>
              <VSCodeButton appearance="primary" onClick={handleApproveAction}>
                Approve action
              </VSCodeButton>
            </div>
          )}
          <ChatInput onSendMessage={handleSend} disabled={isStreaming || isBotLoading} />
        </div>
        <div className="horizontal-stack">
          <AttachmentIcon onClick={handleGetContext} disabled={true} />
          <svg
            className={`attachment-icon${isStreaming || isBotLoading ? " active" : ""}`}
            onClick={isStreaming || isBotLoading ? handleStop : undefined}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: isStreaming || isBotLoading ? 1 : 0.4,
              cursor: isStreaming || isBotLoading ? "pointer" : "default",
            }}
            role="button"
            aria-label="Stop run"
          >
            <title>{isStreaming || isBotLoading ? "Stop run" : "Stop (no active run)"}</title>
            <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
          </svg>
        </div>
      </div>
    </div>
  );
};
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
import { AgentActivityFeed } from "./AgentActivityFeed";
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
  const [newsItems, setNewsItems] = useState<any[]>([]);
  
  // Rules & Subagents state
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [subagents, setSubagents] = useState<SubagentConfig[]>(DEFAULT_SUBAGENTS);

  // Ref for username input element
  // const nameInputRef = useRef<HTMLInputElement>(null);

  // Initialize streaming chat hook
  const {
    messages: streamedMessages,
    activities,
    isStreaming,
    isLoading: isBotLoading,
    sendMessage,
    clearMessages,
    setMessages,
    pendingApproval,
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

      case "news-update":
        if (message.payload && message.payload.news) {
          setNewsItems(message.payload.news);
        }
        break;

      case "chat-history":
        try {
          const parsedMessages = JSON.parse(message.message);
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

  const handleDismissNews = useCallback(() => {
    const ids = newsItems.map((item: any) => item.id);
    vsCode.postMessage({ command: "news-mark-read", ids });
    setNewsItems([]);
  }, [newsItems]);

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
      });
    },
    [sendMessage, selectedCodeBuddyMode, selectedContext]
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
              {newsItems.length > 0 && (
                <div style={{
                  margin: "16px 20px",
                  backgroundColor: "var(--vscode-sideBar-background)",
                  border: "1px solid var(--vscode-widget-border)",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                  overflow: "hidden"
                }}>
                  <div style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--vscode-widget-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "var(--vscode-editor-inactiveSelectionBackground)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="codicon codicon-bell" style={{ fontSize: "14px" }}></span>
                      <h3 style={{ margin: 0, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Daily Briefing
                      </h3>
                    </div>
                    <VSCodeButton appearance="icon" aria-label="Dismiss" onClick={handleDismissNews}>
                      <span className="codicon codicon-close"></span>
                    </VSCodeButton>
                  </div>
                  <div style={{ padding: "0" }}>
                    {newsItems.map((item: any, index: number) => (
                      <div key={index} style={{
                        padding: "12px 16px",
                        borderBottom: index < newsItems.length - 1 ? "1px solid var(--vscode-input-border)" : "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                      }}>
                        <a href={item.url} style={{
                          color: "var(--vscode-textLink-foreground)",
                          textDecoration: "none",
                          fontSize: "14px",
                          fontWeight: "500",
                          lineHeight: "1.4"
                        }}>
                          {item.title}
                        </a>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", opacity: 0.7 }}>
                          <span style={{ fontWeight: "600" }}>{item.source}</span>
                          <span>•</span>
                          <span>{item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Just now'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                {/* Show welcome screen when there are no messages and no news items */}
                {streamedMessages.length === 0 && !isBotLoading && !isCommandExecuting && newsItems.length === 0 ? (
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
                    {/* Show activity feed when agent is working */}
                    {(isStreaming || isBotLoading) && activities.length > 0 && (
                      <AgentActivityFeed
                        activities={activities}
                        isActive={isStreaming || isBotLoading}
                      />
                    )}
                    {isCommandExecuting && (
                      <CommandFeedbackLoader
                        commandAction={commandAction}
                        commandDescription={commandDescription}
                      />
                    )}
                    {/* Show skeleton only if no activities are being tracked */}
                    {isBotLoading && !isCommandExecuting && !isStreaming && activities.length === 0 && <SkeletonLoader />}
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
        </div>
      </div>
    </div>
  );
};
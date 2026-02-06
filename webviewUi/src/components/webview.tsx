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
import MessageRenderer from "./MessageRenderer";
import { PendingChangesPanel } from "./PendingChangesPanel";
import { UserMessage } from "./personMessage";
import { SettingsPanel, SettingsGearIcon, SettingsValues, SettingsOptions, SettingsHandlers, DEFAULT_LANGUAGE_OPTIONS, DEFAULT_KEYMAP_OPTIONS, DEFAULT_SUBAGENTS, DEFAULT_FONT_FAMILY_OPTIONS, DEFAULT_FONT_SIZE_OPTIONS, CustomRule, SubagentConfig } from "./settings/index";
import { SkeletonLoader } from "./skeletonLoader";
import { WelcomeScreen } from "./welcomeUI";
import { News } from "./news/News";

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
  fontFamily?: string;
  fontSize?: number;
  autoApprove?: boolean;
  allowFileEdits?: boolean;
  allowTerminal?: boolean;
  verboseLogging?: boolean;
  indexCodebase?: boolean;
  contextWindow?: string;
  includeHidden?: boolean;
  maxFileSize?: string;
  compactMode?: boolean;
}

export const WebviewUI = () => {
  // State variables
  const [selectedTheme, setSelectedTheme] = useState("tokyo night");
  const [selectedModel, setSelectedModel] = useState("Groq");
  // Default to Ask mode for conversational interactions
  const [selectedCodeBuddyMode, setSelectedCodeBuddyMode] = useState("Ask");
  const [commandAction, setCommandAction] = useState<string>("");
  const [commandDescription, setCommandDescription] = useState<string>("");
  const [isCommandExecuting, setIsCommandExecuting] = useState(false);
  const [selectedContext, setSelectedContext] = useState("");
  const [folders, setFolders] = useState<any>("");
  const [activeEditor, setActiveEditor] = useState("");
  const [username, setUsername] = useState("");
  const [enableStreaming, setEnableStreaming] = useState(true);
  const [fontFamily, setFontFamily] = useState("JetBrains Mono");
  const [fontSize, setFontSize] = useState(16);
  const [autoApprove, setAutoApprove] = useState(false);
  const [allowFileEdits, setAllowFileEdits] = useState(true);
  const [allowTerminal, setAllowTerminal] = useState(true);
  const [verboseLogging, setVerboseLogging] = useState(false);
  const [indexCodebase, setIndexCodebase] = useState(false);
  const [contextWindow, setContextWindow] = useState("16k");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [maxFileSize, setMaxFileSize] = useState("1");
  const [compactMode, setCompactMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fileChangesPanelCollapsed, setFileChangesPanelCollapsed] = useState(true);
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

      case "news-update":
        if (message.payload && message.payload.news) {
          setNewsItems(message.payload.news);
        }
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
        // Handle configuration changes for compact mode
        if (data["codebuddy.compactMode"] !== undefined) {
          setCompactMode(data["codebuddy.compactMode"]);
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
        if (data.fontFamily) {
          setFontFamily(data.fontFamily);
        }
        if (data.fontSize !== undefined) {
          setFontSize(data.fontSize);
        }
        if (data.autoApprove !== undefined) {
          setAutoApprove(data.autoApprove);
        }
        if (data.allowFileEdits !== undefined) {
          setAllowFileEdits(data.allowFileEdits);
        }
        if (data.allowTerminal !== undefined) {
          setAllowTerminal(data.allowTerminal);
        }
        if (data.verboseLogging !== undefined) {
          setVerboseLogging(data.verboseLogging);
        }
        if (data.indexCodebase !== undefined) {
          setIndexCodebase(data.indexCodebase);
        }
        if (data.contextWindow) {
          setContextWindow(data.contextWindow);
        }
        if (data.includeHidden !== undefined) {
          setIncludeHidden(data.includeHidden);
        }
        if (data.maxFileSize) {
          setMaxFileSize(data.maxFileSize);
        }
        if (data.compactMode !== undefined) {
          setCompactMode(data.compactMode);
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

      case "history-cleared":
        // Clear local messages when history is cleared on backend
        clearMessages();
        break;

      default:
        // Ignore unknown message types
        break;
    }
  }, [setMessages, clearMessages]);

  // Update CSS whenever theme changes
  useEffect(() => {
    updateStyles(chatCss);
  }, [chatCss]);

  // Apply font settings to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--codebuddy-font-family', `"${fontFamily}", "Fira Code", monospace`);
    document.documentElement.style.setProperty('--codebuddy-font-size', `${fontSize}px`);
  }, [fontFamily, fontSize]);

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
    highlightCodeBlocks(hljsApi, streamedMessages, vsCode);
  }, [streamedMessages]);

  // Clear command execution state when streaming completes
  useEffect(() => {
    if (!isStreaming && !isBotLoading) {
      setIsCommandExecuting(false);
      setCommandAction("");
      setCommandDescription("");
    }
  }, [isStreaming, isBotLoading]);

  const handleMarkAsRead = useCallback((id: number) => {
    vsCode.postMessage({ command: "news-mark-read", ids: [id] });
    setNewsItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleRefreshNews = useCallback(() => {
    vsCode.postMessage({ command: "news-refresh" });
  }, []);

  const handleOpenUrl = useCallback((url: string) => {
    vsCode.postMessage({ command: "openExternal", text: url });
  }, []);

  const handleContextChange = useCallback((value: string) => {
    setSelectedContext(value);
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
    fontFamily: fontFamily,
    fontSize: fontSize,
    autoApprove: autoApprove,
    allowFileEdits: allowFileEdits,
    allowTerminal: allowTerminal,
    verboseLogging: verboseLogging,
    indexCodebase: indexCodebase,
    contextWindow: contextWindow,
    includeHidden: includeHidden,
    maxFileSize: maxFileSize,
    compactMode: compactMode,
    selectedModel: selectedModel,
    username: username,
    accountType: 'Free',
    customRules: customRules,
    customSystemPrompt: customSystemPrompt,
    subagents: subagents,
  }), [selectedTheme, username, selectedCodeBuddyMode, enableStreaming, fontFamily, fontSize, autoApprove, allowFileEdits, allowTerminal, verboseLogging, indexCodebase, contextWindow, includeHidden, maxFileSize, compactMode, selectedModel, customRules, customSystemPrompt, subagents]);

  const settingsOptions = useMemo<SettingsOptions>(() => ({
    themeOptions: themeOptions,
    modelOptions: modelOptions,
    codeBuddyModeOptions: codeBuddyMode,
    keymapOptions: DEFAULT_KEYMAP_OPTIONS,
    languageOptions: DEFAULT_LANGUAGE_OPTIONS,
    fontFamilyOptions: DEFAULT_FONT_FAMILY_OPTIONS,
    fontSizeOptions: DEFAULT_FONT_SIZE_OPTIONS,
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
      vsCode.postMessage({ command: "nickname-change-event", message: value });
    },
    onCodeBuddyModeChange: (value: string) => {
      setSelectedCodeBuddyMode(value);
      vsCode.postMessage({ command: "codebuddy-model-change-event", message: value });
    },
    onStreamingChange: (enabled: boolean) => {
      setEnableStreaming(enabled);
      vsCode.postMessage({ command: "streaming-change-event", message: enabled });
    },
    onFontFamilyChange: (value: string) => {
      setFontFamily(value);
      vsCode.postMessage({ command: "font-family-change-event", message: value });
    },
    onFontSizeChange: (value: number) => {
      setFontSize(value);
      vsCode.postMessage({ command: "font-size-change-event", message: value });
    },
    onAutoApproveChange: (enabled: boolean) => {
      setAutoApprove(enabled);
      vsCode.postMessage({ command: "auto-approve-change-event", message: enabled });
    },
    onAllowFileEditsChange: (enabled: boolean) => {
      setAllowFileEdits(enabled);
      vsCode.postMessage({ command: "allow-file-edits-change-event", message: enabled });
    },
    onAllowTerminalChange: (enabled: boolean) => {
      setAllowTerminal(enabled);
      vsCode.postMessage({ command: "allow-terminal-change-event", message: enabled });
    },
    onVerboseLoggingChange: (enabled: boolean) => {
      setVerboseLogging(enabled);
      vsCode.postMessage({ command: "verbose-logging-change-event", message: enabled });
    },
    onIndexCodebaseChange: (enabled: boolean) => {
      setIndexCodebase(enabled);
      vsCode.postMessage({ command: "index-codebase-change-event", message: enabled });
    },
    onContextWindowChange: (value: string) => {
      setContextWindow(value);
      vsCode.postMessage({ command: "context-window-change-event", message: value });
    },
    onIncludeHiddenChange: (enabled: boolean) => {
      setIncludeHidden(enabled);
      vsCode.postMessage({ command: "include-hidden-change-event", message: enabled });
    },
    onMaxFileSizeChange: (value: string) => {
      setMaxFileSize(value);
      vsCode.postMessage({ command: "max-file-size-change-event", message: value });
    },
    onCompactModeChange: (enabled: boolean) => {
      setCompactMode(enabled);
      vsCode.postMessage({ command: "compact-mode-change-event", message: enabled });
    },
    onReindexWorkspace: () => {
      vsCode.postMessage({ command: "reindex-workspace-event" });
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
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
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

      <VSCodePanels className="vscodePanels" activeid="tab-1">
        <VSCodePanelTab id="tab-1">CHAT</VSCodePanelTab>
        <VSCodePanelTab id="tab-2">FAQ</VSCodePanelTab>
        <VSCodePanelTab id="tab-3">NEWS</VSCodePanelTab>
        <VSCodePanelView id="view-1">
          <div className="panel-body-scroll">
            <div className={`chat-content ${compactMode ? 'compact-mode' : ''}`}>
              <div className="dropdown-container">
                <div style={{ minWidth: 0, maxWidth: "100%" }}>
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
            {/* File Changes Panel - shows pending and recent file modifications */}
            <PendingChangesPanel 
              collapsed={fileChangesPanelCollapsed}
              onToggle={() => setFileChangesPanelCollapsed(!fileChangesPanelCollapsed)}
            />
          </div>
        </VSCodePanelView>

        <VSCodePanelView id="view-2">
          <div className="panel-body-scroll">
            <FAQAccordion items={faqItems} />
          </div>
        </VSCodePanelView>
        
        <VSCodePanelView id="view-3">
          <div className="panel-body-scroll">
            <News 
              newsItems={newsItems} 
              onMarkAsRead={handleMarkAsRead}
              onRefresh={handleRefreshNews}
              onOpenUrl={handleOpenUrl}
            />
          </div>
        </VSCodePanelView>
      </VSCodePanels>

      <div
        className="business"
        style={{
          padding: "10px",
          backgroundColor: "#16161e",
          flexShrink: 0,
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
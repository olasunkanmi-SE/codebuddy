/* eslint-disable @typescript-eslint/no-explicit-any */

import { VSCodeButton, VSCodePanels, VSCodePanelTab, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";
import type hljs from "highlight.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { codeBuddyMode, faqItems, modelOptions, themeOptions } from "../constants/constant";
import { IWebviewMessage, useStreamingChat } from "../hooks/useStreamingChat";
import { vscode } from "../utils/vscode";
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
import { SessionsPanel, ChatSession } from "./sessions";
import { NotificationPanel, INotificationItem } from "./notifications";
import { UpdatesPanel } from "./updates/UpdatesPanel";
import { ObservabilityPanel } from "./observability/ObservabilityPanel";

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

// Styled component for sessions toggle button
const SessionsToggleButton = styled.button`
  position: fixed;
  top: 56px;
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

// Sessions icon component
const SessionsIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Styled component for notification toggle button
const NotificationToggleButton = styled.button`
  position: fixed;
  top: 100px;
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

const NotificationIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// Book icon component for Updates
const BookIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

// Globe icon component for Browser
const GlobeIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// Styled component for browser toggle button
const BrowserToggleButton = styled.button`
  position: fixed;
  top: 188px;
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

// Styled component for font size controls
const FontSizeControls = styled.div`
  position: fixed;
  top: 232px;
  left: 12px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FontSizeButton = styled.button`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  font-size: 16px;
  font-weight: bold;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.95);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
`;

// Styled component for updates toggle button
const UpdatesToggleButton = styled.button`
  position: fixed;
  top: 144px;
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

const vsCode = vscode;

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
  dailyStandupEnabled?: boolean;
  codeHealthEnabled?: boolean;
  dependencyCheckEnabled?: boolean;
  browserType?: 'reader' | 'simple' | 'system';
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
  const [fontSize, setFontSize] = useState(13);
  const [autoApprove, setAutoApprove] = useState(false);
  const [allowFileEdits, setAllowFileEdits] = useState(true);
  const [allowTerminal, setAllowTerminal] = useState(true);
  const [verboseLogging, setVerboseLogging] = useState(false);
  const [indexCodebase, setIndexCodebase] = useState(false);
  const [contextWindow, setContextWindow] = useState("16k");
  const [includeHidden, setIncludeHidden] = useState(false);
  const [maxFileSize, setMaxFileSize] = useState("1");
  const [compactMode, setCompactMode] = useState(false);
  const [dailyStandupEnabled, setDailyStandupEnabled] = useState(true);
  const [codeHealthEnabled, setCodeHealthEnabled] = useState(true);
  const [dependencyCheckEnabled, setDependencyCheckEnabled] = useState(true);
  const [gitWatchdogEnabled, setGitWatchdogEnabled] = useState(true);
  const [browserType, setBrowserType] = useState<'reader' | 'simple' | 'system'>('reader');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fileChangesPanelCollapsed, setFileChangesPanelCollapsed] = useState(true);
  const [newsItems, setNewsItems] = useState<any[]>([]);
  
  // Rules & Subagents state
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [subagents, setSubagents] = useState<SubagentConfig[]>(DEFAULT_SUBAGENTS);

  // Sessions state
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Notifications state
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isUpdatesPanelOpen, setIsUpdatesPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const [logs, setLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  // const [dependencyGraph, setDependencyGraph] = useState<string | null>(null);

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

  useEffect(() => {
    // Removed connectors effect
  }, []);

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

      case "notifications-update":
        if (message.notifications) {
          setNotifications(message.notifications);
        }
        if (message.unreadCount !== undefined) {
          setUnreadNotificationCount(message.unreadCount);
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

      case "observability-logs":
        setLogs(message.logs);
        break;
      case "observability-metrics":
        setMetrics(message.metrics);
        break;
      case "log-entry":
        setLogs((prev) => [...prev, message.event].slice(-1000));
        break;

      /* case "dependency-graph":
        setDependencyGraph(message.graph);
        break; */

      case "onConfigurationChange": {
        const data = JSON.parse(message.message);
        if (data.enableStreaming !== undefined) {
          setEnableStreaming(data.enableStreaming);
        }
        // Handle configuration changes for compact mode
        if (data["codebuddy.compactMode"] !== undefined) {
          setCompactMode(data["codebuddy.compactMode"]);
        }
        if (data["codebuddy.automations.dailyStandup.enabled"] !== undefined) {
          setDailyStandupEnabled(data["codebuddy.automations.dailyStandup.enabled"]);
        }
        if (data["codebuddy.automations.codeHealth.enabled"] !== undefined) {
          setCodeHealthEnabled(data["codebuddy.automations.codeHealth.enabled"]);
        }
        if (data["codebuddy.automations.dependencyCheck.enabled"] !== undefined) {
          setDependencyCheckEnabled(data["codebuddy.automations.dependencyCheck.enabled"]);
        }
        if (data["codebuddy.browserType"] !== undefined) {
          setBrowserType(data["codebuddy.browserType"]);
        }
        if (data["codebuddy.automations.gitWatchdog.enabled"] !== undefined) {
          setGitWatchdogEnabled(data["codebuddy.automations.gitWatchdog.enabled"]);
        }
        if (data["codebuddy.browserType"] !== undefined) {
          setBrowserType(data["codebuddy.browserType"]);
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
        if (data.dailyStandupEnabled !== undefined) {
          setDailyStandupEnabled(data.dailyStandupEnabled);
        }
        if (data.codeHealthEnabled !== undefined) {
          setCodeHealthEnabled(data.codeHealthEnabled);
        }
        if (data.dependencyCheckEnabled !== undefined) {
          setDependencyCheckEnabled(data.dependencyCheckEnabled);
        }
        if (data.browserType !== undefined) {
          setBrowserType(data.browserType);
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

      // Session management handlers
      case "sessions-list":
        if (message.sessions) {
          setSessions(message.sessions);
        }
        break;

      case "session-created":
        if (message.sessionId) {
          setCurrentSessionId(message.sessionId);
        }
        if (message.sessions) {
          setSessions(message.sessions);
        }
        break;

      case "session-switched": {
        if (message.sessionId) {
          setCurrentSessionId(message.sessionId);
        }
        if (message.history) {
          // Convert and set the history for the new session
          const formattedMessages: IWebviewMessage[] = message.history.map((msg: any) => ({
            id: `session-${Date.now()}-${Math.random()}`,
            type: msg.type,
            content: msg.content,
            language: msg.language,
            alias: msg.alias,
            timestamp: msg.timestamp || Date.now(),
          }));
          setMessages(formattedMessages);
        } else {
          // Clear messages for new session
          clearMessages();
        }
        break;
      }

      case "session-deleted":
        console.log("session-deleted received:", message);
        if (message.sessions) {
          console.log("Setting sessions:", message.sessions.length);
          setSessions(message.sessions);
        }
        // If the deleted session was current, clear the view
        if (message.sessionId === currentSessionId) {
          setCurrentSessionId(null);
          clearMessages();
        }
        break;

      case "session-title-updated":
        if (message.sessions) {
          setSessions(message.sessions);
        }
        break;

      case "current-session":
        if (message.sessionId) {
          setCurrentSessionId(message.sessionId);
        }
        break;

      default:
        // Ignore unknown message types
        break;
    }
  }, [setMessages, clearMessages, currentSessionId]);

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
    vsCode.postMessage({ command: "notifications-get" });
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

  const handleLaunchBrowser = () => {
    vsCode.postMessage({
      command: "execute-command",
      commandId: "codebuddy.openSimpleBrowser",
    });
  };

  const handleIncreaseFont = () => {
    setFontSize((prev) => Math.min(prev + 1, 24));
  };

  const handleDecreaseFont = () => {
    setFontSize((prev) => Math.max(prev - 1, 8));
  };

  const handleToggleSaved = useCallback((id: number) => {
    vsCode.postMessage({ command: "news-toggle-saved", id });
  }, []);

  const handleDeleteNews = (id: number) => {
    vsCode.postMessage({ command: "news-delete", id });
  };

  const handleDeleteAllNews = () => {
    vsCode.postMessage({ command: "news-delete-all" });
  };

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

  // Session management handlers
  const handleNewSession = useCallback(() => {
    vsCode.postMessage({ command: "create-session", message: {} });
    setIsSessionsOpen(false);
  }, []);

  const handleSwitchSession = useCallback((sessionId: string) => {
    vsCode.postMessage({ command: "switch-session", message: { sessionId } });
    setIsSessionsOpen(false);
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    console.log("handleDeleteSession called with sessionId:", sessionId);
    vsCode.postMessage({ command: "delete-session", message: { sessionId } });
  }, []);

  const handleRenameSession = useCallback((sessionId: string, newTitle: string) => {
    vsCode.postMessage({ command: "update-session-title", message: { sessionId, title: newTitle } });
  }, []);

  const handleOpenSessions = useCallback(() => {
    // Request sessions list when opening
    vsCode.postMessage({ command: "get-sessions" });
    setIsSessionsOpen(true);
  }, []);

  // Notification handlers
  const handleNotificationMarkAsRead = useCallback((id: number) => {
    vsCode.postMessage({ command: "notification-mark-read", id });
  }, []);

  const handleNotificationMarkAllAsRead = useCallback(() => {
    vsCode.postMessage({ command: "notification-mark-all-read" });
  }, []);

  const handleNotificationClearAll = useCallback(() => {
    vsCode.postMessage({ command: "notification-clear-all" });
  }, []);

  const handleToggleNotifications = useCallback(() => {
    if (!isNotificationPanelOpen) {
      vsCode.postMessage({ command: "notifications-get" });
    }
    setIsNotificationPanelOpen(!isNotificationPanelOpen);
  }, [isNotificationPanelOpen]);

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
    dailyStandupEnabled: dailyStandupEnabled,
    codeHealthEnabled: codeHealthEnabled,
    dependencyCheckEnabled: dependencyCheckEnabled,
    gitWatchdogEnabled: gitWatchdogEnabled,
    browserType: browserType,
    selectedModel: selectedModel,
    username: username,
    accountType: 'Free',
    customRules: customRules,
    customSystemPrompt: customSystemPrompt,
    subagents: subagents,
  }), [selectedTheme, username, selectedCodeBuddyMode, enableStreaming, fontFamily, fontSize, autoApprove, allowFileEdits, allowTerminal, verboseLogging, indexCodebase, contextWindow, includeHidden, maxFileSize, compactMode, selectedModel, customRules, customSystemPrompt, subagents, dailyStandupEnabled, codeHealthEnabled, dependencyCheckEnabled, gitWatchdogEnabled, browserType]);

  const settingsOptions = useMemo<SettingsOptions>(() => ({
    themeOptions: themeOptions,
    modelOptions: modelOptions,
    codeBuddyModeOptions: codeBuddyMode,
    keymapOptions: DEFAULT_KEYMAP_OPTIONS,
    languageOptions: DEFAULT_LANGUAGE_OPTIONS,
    fontFamilyOptions: DEFAULT_FONT_FAMILY_OPTIONS,
    fontSizeOptions: DEFAULT_FONT_SIZE_OPTIONS,
    browserTypeOptions: [
      { value: 'reader', label: 'Smart Reader (Recommended)' },
      { value: 'simple', label: 'Simple Browser' },
      { value: 'system', label: 'System Browser' },
    ],
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
    onDailyStandupChange: (enabled: boolean) => {
      setDailyStandupEnabled(enabled);
      vsCode.postMessage({ command: "daily-standup-change-event", message: enabled });
    },
    onCodeHealthChange: (enabled: boolean) => {
      setCodeHealthEnabled(enabled);
      vsCode.postMessage({ command: "code-health-change-event", message: enabled });
    },
    onDependencyCheckChange: (enabled: boolean) => {
      setDependencyCheckEnabled(enabled);
      vsCode.postMessage({ command: "dependency-check-change-event", message: enabled });
    },
    onGitWatchdogChange: (enabled: boolean) => {
      setGitWatchdogEnabled(enabled);
      vsCode.postMessage({ command: "git-watchdog-change-event", message: enabled });
    },
    onBrowserTypeChange: (value: 'reader' | 'simple' | 'system') => {
      setBrowserType(value);
      vsCode.postMessage({ command: "updateConfiguration", key: "codebuddy.browserType", value: value });
    },
    onUsernameChange: (value: string) => {
      setUsername(value);
    },
    postMessage: (message: { command: string; [key: string]: any }) => {
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
        <SettingsGearIcon />
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

      {/* Sessions Toggle Button */}
      <SessionsToggleButton
        onClick={handleOpenSessions}
        aria-label="Open sessions"
        title="Sessions"
      >
        <SessionsIcon size={18} />
      </SessionsToggleButton>

      {/* Sessions Panel */}
      <SessionsPanel
        sessions={sessions}
        currentSessionId={currentSessionId}
        isOpen={isSessionsOpen}
        onClose={() => setIsSessionsOpen(false)}
        onNewSession={handleNewSession}
        onSwitchSession={handleSwitchSession}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />

      {/* Notifications Toggle Button */}
      <NotificationToggleButton
        onClick={handleToggleNotifications}
        aria-label="Open notifications"
        title="Notifications"
      >
        <NotificationIcon size={18} />
        {unreadNotificationCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "var(--vscode-activityBarBadge-background)",
              color: "var(--vscode-activityBarBadge-foreground)",
              fontSize: "10px",
              fontWeight: "bold",
              borderRadius: "50%",
              minWidth: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--vscode-editor-background)",
            }}
          >
            {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
          </span>
        )}
      </NotificationToggleButton>

      {/* Notifications Panel */}
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleNotificationMarkAsRead}
        onMarkAllAsRead={handleNotificationMarkAllAsRead}
        onClearAll={handleNotificationClearAll}
      />

      {/* Updates Toggle Button */}
      <UpdatesToggleButton
        onClick={() => setIsUpdatesPanelOpen(true)}
        aria-label="Open updates"
        title="Updates"
      >
        <BookIcon size={18} />
      </UpdatesToggleButton>

      {/* Browser Toggle Button */}
      <BrowserToggleButton
        onClick={handleLaunchBrowser}
        aria-label="Open browser"
        title="Launch Browser (Google)"
      >
        <GlobeIcon size={18} />
      </BrowserToggleButton>

      {/* Font Size Controls */}
      <FontSizeControls>
        <FontSizeButton 
          onClick={handleIncreaseFont} 
          title="Increase font size"
          aria-label="Increase font"
        >
          +
        </FontSizeButton>
        <FontSizeButton 
          onClick={handleDecreaseFont} 
          title="Decrease font size"
          aria-label="Decrease font"
        >
          -
        </FontSizeButton>
      </FontSizeControls>

      {/* Updates Panel */}
      <UpdatesPanel
        isOpen={isUpdatesPanelOpen}
        onClose={() => setIsUpdatesPanelOpen(false)}
        newsItems={newsItems}
        onMarkAsRead={handleMarkAsRead}
        onRefresh={handleRefreshNews}
        onOpenUrl={handleOpenUrl}
        onToggleSaved={handleToggleSaved}
        onDelete={handleDeleteNews}
        onDeleteAll={handleDeleteAllNews}
        userName={username || "Developer"}
      />

      <VSCodePanels className="vscodePanels" activeid="tab-1">
        <VSCodePanelTab id="tab-1">CHAT</VSCodePanelTab>
        <VSCodePanelTab id="tab-2">FAQ</VSCodePanelTab>
        <VSCodePanelTab id="tab-4">OBSERVABILITY</VSCodePanelTab>
        {/* <VSCodePanelTab id="tab-5">VISUALIZER</VSCodePanelTab> */}
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
        
        <VSCodePanelView id="view-4">
          <ObservabilityPanel vsCode={vsCode} logs={logs} metrics={metrics} />
        </VSCodePanelView>

        {/* <VSCodePanelView id="view-5">
          <VisualizerPanel vsCode={vsCode} graph={dependencyGraph} />
        </VSCodePanelView> */}
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
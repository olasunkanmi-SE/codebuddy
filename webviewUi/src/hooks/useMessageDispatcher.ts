/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import i18n from "../i18n/i18n";
import { vscode } from "../utils/vscode";
import { useSettingsStore } from "../stores/settings.store";
import { usePanelStore } from "../stores/panels.store";
import { useSessionsStore } from "../stores/sessions.store";
import { useNotificationsStore } from "../stores/notifications.store";
import { useContentStore } from "../stores/content.store";
import { useChatStore } from "../stores/chat.store";
import type { IWebviewMessage } from "./useStreamingChat";

interface ConfigData {
  username?: string;
  theme?: string;
  selectedModel?: string;
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
  browserType?: "reader" | "simple" | "system";
  language?: string;
}

export interface StreamingChatAPI {
  setMessages: (msgs: IWebviewMessage[]) => void;
  clearMessages: () => void;
  addMessage: (msg: Omit<IWebviewMessage, "id" | "timestamp">) => void;
  sendMessage: (text: string, opts: any) => void;
  threadId: string;
}

export function useMessageDispatcher(streamingChat: StreamingChatAPI) {
  const { setMessages, clearMessages, addMessage, sendMessage, threadId } =
    streamingChat;

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data;
      const messageType = message.command || message.type;

      // Handle stream end/error — clear command state, let useStreamingChat handle the rest
      if (messageType === "onStreamEnd" || messageType === "onStreamError") {
        useChatStore.getState().clearCommandState();
        return;
      }

      // Skip other streaming messages (handled by useStreamingChat)
      if (
        message.command?.includes("stream") ||
        message.type?.includes("stream")
      ) {
        return;
      }

      const settings = useSettingsStore.getState();
      const sessions = useSessionsStore.getState();
      const notifications = useNotificationsStore.getState();
      const content = useContentStore.getState();
      const chat = useChatStore.getState();
      const panels = usePanelStore.getState();

      switch (messageType) {
        case "codebuddy-commands": {
          chat.setIsCommandExecuting(true);
          if (
            typeof message.message === "object" &&
            message.message.action &&
            message.message.description
          ) {
            chat.setCommandAction(message.message.action);
          } else {
            chat.setCommandAction(message.message || "Processing request");
          }
          break;
        }

        case "bootstrap":
          chat.setFolders(message);
          break;

        case "news-update":
          if (message.payload?.news) {
            content.setNewsItems(message.payload.news);
          }
          break;

        case "notifications-update":
          if (message.notifications) {
            notifications.setNotifications(message.notifications);
          }
          if (message.unreadCount !== undefined) {
            notifications.setUnreadCount(message.unreadCount);
          }
          break;

        case "chat-history":
          try {
            const parsedMessages = JSON.parse(message.message);
            const formattedMessages: IWebviewMessage[] = parsedMessages.map(
              (msg: any) => ({
                id: `history-${Date.now()}-${Math.random()}`,
                type: msg.type,
                content: msg.content,
                language: msg.language,
                timestamp: Date.now(),
              }),
            );
            setMessages(formattedMessages);
          } catch (error) {
            console.error("Error parsing chat history:", error);
          }
          break;

        case "error":
          console.error("Extension error", message.payload);
          chat.clearCommandState();
          break;

        case "bot-response":
          chat.clearCommandState();
          break;

        case "onActiveworkspaceUpdate":
          chat.setActiveEditor(message.message ?? "");
          break;

        case "observability-logs":
          content.setLogs(message.logs);
          break;
        case "observability-metrics":
          content.setMetrics(message.metrics);
          break;
        case "observability-traces":
          content.setTraces(message.traces);
          break;
        case "log-entry":
          content.addLog(message.event);
          break;

        case "browsing-history":
          if (message.history) {
            content.setBrowsingHistory(message.history);
            panels.openHistory();
          }
          break;

        case "set-locale":
          if (message.locale) {
            i18n.changeLanguage(message.locale);
          }
          break;

        case "onConfigurationChange": {
          const data = JSON.parse(message.message);
          const patch: Record<string, any> = {};
          if (data.enableStreaming !== undefined)
            patch.enableStreaming = data.enableStreaming;
          if (data["codebuddy.compactMode"] !== undefined)
            patch.compactMode = data["codebuddy.compactMode"];
          if (data["codebuddy.automations.dailyStandup.enabled"] !== undefined)
            patch.dailyStandupEnabled =
              data["codebuddy.automations.dailyStandup.enabled"];
          if (data["codebuddy.automations.codeHealth.enabled"] !== undefined)
            patch.codeHealthEnabled =
              data["codebuddy.automations.codeHealth.enabled"];
          if (
            data["codebuddy.automations.dependencyCheck.enabled"] !== undefined
          )
            patch.dependencyCheckEnabled =
              data["codebuddy.automations.dependencyCheck.enabled"];
          if (data["codebuddy.automations.gitWatchdog.enabled"] !== undefined)
            patch.gitWatchdogEnabled =
              data["codebuddy.automations.gitWatchdog.enabled"];
          if (
            data["codebuddy.automations.endOfDaySummary.enabled"] !== undefined
          )
            patch.endOfDaySummaryEnabled =
              data["codebuddy.automations.endOfDaySummary.enabled"];
          if (data["codebuddy.browserType"] !== undefined)
            patch.browserType = data["codebuddy.browserType"];
          if (Object.keys(patch).length > 0) settings.patch(patch);
          break;
        }

        case "onGetUserPreferences": {
          const data: ConfigData = JSON.parse(message.message);
          const patch: Record<string, any> = {};
          if (data.username) patch.username = data.username;
          if (data.theme) patch.selectedTheme = data.theme;
          if (data.selectedModel) patch.selectedModel = data.selectedModel;
          if (data.enableStreaming !== undefined)
            patch.enableStreaming = data.enableStreaming;
          if (data.fontFamily) patch.fontFamily = data.fontFamily;
          if (data.fontSize !== undefined) patch.fontSize = data.fontSize;
          if (data.autoApprove !== undefined)
            patch.autoApprove = data.autoApprove;
          if (data.allowFileEdits !== undefined)
            patch.allowFileEdits = data.allowFileEdits;
          if (data.allowTerminal !== undefined)
            patch.allowTerminal = data.allowTerminal;
          if (data.verboseLogging !== undefined)
            patch.verboseLogging = data.verboseLogging;
          if (data.indexCodebase !== undefined)
            patch.indexCodebase = data.indexCodebase;
          if (data.contextWindow) patch.contextWindow = data.contextWindow;
          if (data.includeHidden !== undefined)
            patch.includeHidden = data.includeHidden;
          if (data.maxFileSize) patch.maxFileSize = data.maxFileSize;
          if (data.compactMode !== undefined)
            patch.compactMode = data.compactMode;
          if (data.dailyStandupEnabled !== undefined)
            patch.dailyStandupEnabled = data.dailyStandupEnabled;
          if (data.codeHealthEnabled !== undefined)
            patch.codeHealthEnabled = data.codeHealthEnabled;
          if (data.dependencyCheckEnabled !== undefined)
            patch.dependencyCheckEnabled = data.dependencyCheckEnabled;
          if (data.browserType !== undefined)
            patch.browserType = data.browserType;
          if (data.language) {
            patch.selectedLanguage = data.language;
            i18n.changeLanguage(data.language);
          }
          if (Object.keys(patch).length > 0) settings.patch(patch);
          break;
        }

        case "theme-settings":
          if (message.theme) {
            settings.patch({ selectedTheme: message.theme });
          }
          break;

        case "rules-data":
          if (message.data) {
            const rulesPatch: Record<string, any> = {};
            if (message.data.rules) rulesPatch.customRules = message.data.rules;
            if (message.data.systemPrompt !== undefined)
              rulesPatch.customSystemPrompt = message.data.systemPrompt;
            if (message.data.subagents)
              rulesPatch.subagents = message.data.subagents;
            if (Object.keys(rulesPatch).length > 0) settings.patch(rulesPatch);
          }
          break;

        case "rule-added":
          if (message.data?.rule) {
            settings.patch({
              customRules: [...settings.customRules, message.data.rule],
            });
          }
          break;

        case "history-cleared":
          clearMessages();
          break;

        // ── Session management ──
        case "sessions-list":
          if (message.sessions) {
            sessions.setSessions(message.sessions);
          }
          break;

        case "session-created":
          if (message.sessionId)
            sessions.setCurrentSessionId(message.sessionId);
          if (message.sessions) sessions.setSessions(message.sessions);
          clearMessages();
          break;

        case "session-switched": {
          if (message.sessionId)
            sessions.setCurrentSessionId(message.sessionId);
          if (message.history) {
            const formattedMessages: IWebviewMessage[] = message.history.map(
              (msg: any) => ({
                id: `session-${Date.now()}-${Math.random()}`,
                type: msg.type,
                content: msg.content,
                language: msg.language,
                timestamp: msg.timestamp || Date.now(),
              }),
            );
            setMessages(formattedMessages);
          } else {
            clearMessages();
          }
          break;
        }

        case "session-deleted":
          if (message.sessions) sessions.setSessions(message.sessions);
          if (message.sessionId === sessions.currentSessionId) {
            sessions.setCurrentSessionId(null);
            clearMessages();
          }
          break;

        case "session-title-updated":
          if (message.sessions) sessions.setSessions(message.sessions);
          break;

        case "current-session":
          if (message.sessionId)
            sessions.setCurrentSessionId(message.sessionId);
          break;

        case "append-to-chat":
          if (message.text) {
            addMessage({
              type: "bot",
              content: `📎 **Context added from Reader:**\n\n${message.text}\n\n*This content will be included as context in your next message to the AI.*`,
            });
            vscode.postMessage({
              command: "store-reader-context",
              text: message.text,
            });
          }
          break;

        case "send-message":
          if (message.text) {
            const mode =
              useSettingsStore.getState().selectedCodeBuddyMode || "Agent";
            sendMessage(message.text, {
              mode,
              context: [],
              threadId,
            });
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setMessages, clearMessages, addMessage, sendMessage, threadId]);
}

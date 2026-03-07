/* eslint-disable @typescript-eslint/no-explicit-any */

import { VSCodeButton, VSCodePanels, VSCodePanelTab, VSCodePanelView } from "@vscode/webview-ui-toolkit/react";
import type hljs from "highlight.js";
import { useCallback, useEffect, useMemo } from "react";
import "./webview.css";
import { faqItems } from "../constants/constant";
import { useStreamingChat } from "../hooks/useStreamingChat";
import { useMessageDispatcher } from "../hooks/useMessageDispatcher";
import { vscode } from "../utils/vscode";
import { getChatCss } from "../themes/chat_css";
import { updateStyles } from "../utils/dynamicCss";
import { highlightCodeBlocks } from "../utils/highlightCode";
import {
  useSettingsStore,
  useSettingsValues,
  useSettingsHandlers,
  useSettingsOptions,
  usePanelStore,
  useSessionsStore,
  useNotificationsStore,
  useContentStore,
  useChatStore,
} from "../stores";
import { FAQAccordion } from "./accordion";
import { AgentTimeline } from "./AgentTimeline";
import AttachmentIcon from "./attachmentIcon";
import ChatInput from "./ChatInput";
import { CostDisplay } from "./CostDisplay";
import { CommandFeedbackLoader } from "./commandFeedbackLoader";
import MessageRenderer from "./MessageRenderer";
import { PendingChangesPanel } from "./PendingChangesPanel";
import { ComposerPanel } from "./ComposerPanel";
import { CheckpointPanel } from "./CheckpointPanel";
import { UserMessage } from "./personMessage";
import { SettingsPanel, SettingsGearIcon } from "./settings/index";
import { WelcomeScreen } from "./welcomeUI";
import { SessionsPanel } from "./sessions";
import { NotificationPanel } from "./notifications";
import { UpdatesPanel } from "./updates/UpdatesPanel";
import { ObservabilityPanel } from "./observability/ObservabilityPanel";
import { CoWorkerPanel } from "./coworker/CoWorkerPanel";
import { BrowserPanel } from "./browser/BrowserPanel";
import { PanelErrorBoundary } from "./PanelErrorBoundary";
import {
  SidebarNav,
  SettingsToggleButton,
  SessionsToggleButton,
  NotificationToggleButton,
  UpdatesToggleButton,
  ObservabilityToggleButton,
  BrowserToggleButton,
  CoWorkerToggleButton,
  FontSizeGroup,
  FontSizeButton,
  SessionsIcon,
  NotificationIcon,
  BookIcon,
  BrowserIcon,
  CoWorkerIcon,
  ObservabilityIcon,
} from "./webview.styles";

const hljsApi = window["hljs" as any] as unknown as typeof hljs;

const vsCode = vscode;

export const WebviewUI = () => {
  // ── Store selectors ──
  const enableStreaming = useSettingsStore((s) => s.enableStreaming);
  const selectedTheme = useSettingsStore((s) => s.selectedTheme);
  const compactMode = useSettingsStore((s) => s.compactMode);
  const username = useSettingsStore((s) => s.username);
  const fontFamily = useSettingsStore((s) => s.fontFamily);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const selectedCodeBuddyMode = useSettingsStore((s) => s.selectedCodeBuddyMode);
  const selectedContext = useChatStore((s) => s.selectedContext);
  const activeEditor = useChatStore((s) => s.activeEditor);
  const folders = useChatStore((s) => s.folders);
  const commandAction = useChatStore((s) => s.commandAction);
  const isCommandExecuting = useChatStore((s) => s.isCommandExecuting);
  const fileChangesPanelCollapsed = useChatStore((s) => s.fileChangesPanelCollapsed);
  const unreadNotificationCount = useNotificationsStore((s) => s.unreadNotificationCount);

  // Panel store
  const isSettingsOpen = usePanelStore((s) => s.isSettingsOpen);
  const isSessionsOpen = usePanelStore((s) => s.isSessionsOpen);
  const isNotificationPanelOpen = usePanelStore((s) => s.isNotificationPanelOpen);
  const isUpdatesPanelOpen = usePanelStore((s) => s.isUpdatesPanelOpen);
  const isObservabilityOpen = usePanelStore((s) => s.isObservabilityOpen);
  const isCoWorkerOpen = usePanelStore((s) => s.isCoWorkerOpen);
  const isBrowserPanelOpen = usePanelStore((s) => s.isBrowserPanelOpen);

  // Sessions store
  const sessions = useSessionsStore((s) => s.sessions);
  const currentSessionId = useSessionsStore((s) => s.currentSessionId);

  // Content store
  const newsItems = useContentStore((s) => s.newsItems);
  const logs = useContentStore((s) => s.logs);
  const metrics = useContentStore((s) => s.metrics);
  const traces = useContentStore((s) => s.traces);
  const notifications = useNotificationsStore((s) => s.notifications);

  // Settings-derived objects for SettingsPanel
  const settingsValues = useSettingsValues();
  const settingsOptions = useSettingsOptions();
  const settingsHandlers = useSettingsHandlers();

  // CoWorker panel props from settings store
  const dailyStandupEnabled = useSettingsStore((s) => s.dailyStandupEnabled);
  const codeHealthEnabled = useSettingsStore((s) => s.codeHealthEnabled);
  const dependencyCheckEnabled = useSettingsStore((s) => s.dependencyCheckEnabled);
  const gitWatchdogEnabled = useSettingsStore((s) => s.gitWatchdogEnabled);
  const endOfDaySummaryEnabled = useSettingsStore((s) => s.endOfDaySummaryEnabled);

  // ── Streaming chat hook ──
  const {
    messages: streamedMessages,
    timeline,
    isStreaming,
    isLoading: isBotLoading,
    sendMessage,
    addMessage,
    clearMessages,
    setMessages,
    pendingApproval,
    cancelCurrentRequest,
    threadId,
    conversationCost,
  } = useStreamingChat(vsCode, {
    enableStreaming,
    onLegacyMessage: (messages) => {
      console.log("Legacy message received:", messages);
    },
  });

  // ── Message dispatcher (replaces giant legacyMessageHandler) ──
  useMessageDispatcher({ setMessages, clearMessages, addMessage, sendMessage, threadId });

  // ── Memoized CSS ──
  const chatCss = useMemo(() => getChatCss(selectedTheme), [selectedTheme]);

  // ── Effects ──

  // Update CSS whenever theme changes
  useEffect(() => {
    updateStyles(chatCss);
  }, [chatCss]);

  // Apply font settings to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--codebuddy-font-family', `"${fontFamily}", "Fira Code", monospace`);
    document.documentElement.style.setProperty('--codebuddy-font-size', `${fontSize}px`);
  }, [fontFamily, fontSize]);

  // Signal to extension that webview is ready to receive messages
  useEffect(() => {
    vsCode.postMessage({ command: "webview-ready" });
  }, []);

  // Request chat history on mount
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
      useChatStore.getState().clearCommandState();
    }
  }, [isStreaming, isBotLoading]);

  // ── Handlers (thin wrappers using stores) ──

  const handleSend = useCallback(
    (message: string, mentionedFiles?: string[]) => {
      if (!message.trim()) return;
      const contextFiles = mentionedFiles && mentionedFiles.length > 0
        ? mentionedFiles
        : selectedContext.split("@").filter(Boolean);
      sendMessage(message, {
        mode: selectedCodeBuddyMode || "Agent",
        context: contextFiles,
        threadId,
      });
    },
    [sendMessage, selectedCodeBuddyMode, selectedContext, threadId]
  );

  const handleGetContext = useCallback(() => {
    vsCode.postMessage({ command: "upload-file", message: "" });
  }, []);

  const handleApproveAction = useCallback(() => {
    vsCode.postMessage({ command: "user-consent", message: "granted", threadId: pendingApproval?.threadId });
  }, [pendingApproval]);

  const handleStop = useCallback(() => {
    cancelCurrentRequest();
  }, [cancelCurrentRequest]);

  const handleToggleNotifications = useCallback(() => {
    if (!isNotificationPanelOpen) {
      vsCode.postMessage({ command: "notifications-get" });
    }
    usePanelStore.getState().toggleNotifications();
  }, [isNotificationPanelOpen]);

  const handleOpenSessions = useCallback(() => {
    vsCode.postMessage({ command: "get-sessions" });
    usePanelStore.getState().openSessions();
  }, []);

  const handleOpenBrowserPanel = useCallback(() => {
    useContentStore.getState().handleShowBrowsingHistory();
    useContentStore.getState().handleGetBookmarks();
    usePanelStore.getState().openBrowserPanel();
  }, []);

  // ── Derived values ──

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
        />
      )
    );
  }, [streamedMessages]);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Sidebar Navigation — flexbox container replaces hardcoded pixel positions */}
      <SidebarNav aria-label="Sidebar actions">
        <SettingsToggleButton
          onClick={() => usePanelStore.getState().openSettings()}
          aria-label="Open settings"
          title="Settings"
        >
          <SettingsGearIcon size={14} />
        </SettingsToggleButton>

        <SessionsToggleButton
          onClick={handleOpenSessions}
          aria-label="Open sessions"
          title="Sessions"
        >
          <SessionsIcon size={14} />
        </SessionsToggleButton>

        <NotificationToggleButton
          onClick={handleToggleNotifications}
          aria-label="Open notifications"
          title="Notifications"
        >
          <NotificationIcon size={14} />
          {unreadNotificationCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "var(--vscode-activityBarBadge-background)",
                color: "var(--vscode-activityBarBadge-foreground)",
                fontSize: "9px",
                fontWeight: "bold",
                borderRadius: "50%",
                minWidth: "14px",
                height: "14px",
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

        <UpdatesToggleButton
          onClick={() => usePanelStore.getState().openUpdates()}
          aria-label="Open updates"
          title="Updates"
        >
          <BookIcon size={14} />
        </UpdatesToggleButton>

        <ObservabilityToggleButton
          onClick={() => usePanelStore.getState().openObservability()}
          aria-label="Open observability"
          title="Observability"
        >
          <ObservabilityIcon size={14} />
        </ObservabilityToggleButton>

        <BrowserToggleButton
          onClick={handleOpenBrowserPanel}
          aria-label="Open browser"
          title="Browser"
        >
          <BrowserIcon size={14} />
        </BrowserToggleButton>

        <CoWorkerToggleButton
          onClick={() => usePanelStore.getState().openCoWorker()}
          aria-label="Open co-worker"
          title="Co-Worker"
        >
          <CoWorkerIcon size={14} />
        </CoWorkerToggleButton>

        <FontSizeGroup>
          <FontSizeButton onClick={() => useSettingsStore.getState().handleIncreaseFontSize()} title="Increase Font Size">
            A+
          </FontSizeButton>
          <FontSizeButton onClick={() => useSettingsStore.getState().handleDecreaseFontSize()} title="Decrease Font Size">
            A-
          </FontSizeButton>
        </FontSizeGroup>
      </SidebarNav>

      {/* Settings Panel */}
      <PanelErrorBoundary fallbackLabel="Settings">
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => usePanelStore.getState().closeSettings()}
        username={username || 'CodeBuddy User'}
        accountType="Free"
        settingsValues={settingsValues}
        settingsOptions={settingsOptions}
        settingsHandlers={settingsHandlers}
      />
      </PanelErrorBoundary>

      {/* Sessions Panel */}
      <PanelErrorBoundary fallbackLabel="Sessions">
      <SessionsPanel
        sessions={sessions}
        currentSessionId={currentSessionId}
        isOpen={isSessionsOpen}
        onClose={() => usePanelStore.getState().closeSessions()}
        onNewSession={() => { useSessionsStore.getState().handleNewSession(); usePanelStore.getState().closeSessions(); }}
        onSwitchSession={(id: string) => { useSessionsStore.getState().handleSwitchSession(id); usePanelStore.getState().closeSessions(); }}
        onDeleteSession={useSessionsStore.getState().handleDeleteSession}
        onRenameSession={useSessionsStore.getState().handleRenameSession}
      />
      </PanelErrorBoundary>

      {/* Notifications Panel */}
      <PanelErrorBoundary fallbackLabel="Notifications">
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => usePanelStore.getState().closeNotifications()}
        notifications={notifications}
        onMarkAsRead={useNotificationsStore.getState().handleMarkAsRead}
        onMarkAllAsRead={useNotificationsStore.getState().handleMarkAllAsRead}
        onClearAll={useNotificationsStore.getState().handleClearAll}
        onDelete={useNotificationsStore.getState().handleDelete}
      />
      </PanelErrorBoundary>

      {/* Updates Panel */}
      <PanelErrorBoundary fallbackLabel="Updates">
      <UpdatesPanel
        isOpen={isUpdatesPanelOpen}
        onClose={() => usePanelStore.getState().closeUpdates()}
        newsItems={newsItems}
        onMarkAsRead={useContentStore.getState().handleMarkNewsAsRead}
        onRefresh={useContentStore.getState().handleRefreshNews}
        onOpenUrl={useContentStore.getState().handleOpenUrl}
        onOpenInReader={useContentStore.getState().handleOpenInReader}
        onToggleSaved={useContentStore.getState().handleToggleSaved}
        onDelete={useContentStore.getState().handleDeleteNews}
        userName={username || "Developer"}
      />
      </PanelErrorBoundary>

      {/* Browser Panel (Chrome-style with History + Bookmarks) */}
      <PanelErrorBoundary fallbackLabel="Browser">
      <BrowserPanel
        isOpen={isBrowserPanelOpen}
        onClose={() => usePanelStore.getState().closeBrowserPanel()}
      />
      </PanelErrorBoundary>

      {/* Observability Panel */}
      <PanelErrorBoundary fallbackLabel="Observability">
      <ObservabilityPanel
        vsCode={vsCode}
        logs={logs}
        metrics={metrics}
        traces={traces}
        isOpen={isObservabilityOpen}
        onClose={() => usePanelStore.getState().closeObservability()}
      />
      </PanelErrorBoundary>

      {/* Co-Worker Panel */}
      <PanelErrorBoundary fallbackLabel="Co-Worker">
      <CoWorkerPanel
        isOpen={isCoWorkerOpen}
        onClose={() => usePanelStore.getState().closeCoWorker()}
        dailyStandupEnabled={dailyStandupEnabled}
        codeHealthEnabled={codeHealthEnabled}
        dependencyCheckEnabled={dependencyCheckEnabled}
        gitWatchdogEnabled={gitWatchdogEnabled}
        endOfDaySummaryEnabled={endOfDaySummaryEnabled}
        onDailyStandupChange={settingsHandlers.onDailyStandupChange}
        onCodeHealthChange={settingsHandlers.onCodeHealthChange}
        onDependencyCheckChange={settingsHandlers.onDependencyCheckChange}
        onGitWatchdogChange={settingsHandlers.onGitWatchdogChange}
        onEndOfDaySummaryChange={settingsHandlers.onEndOfDaySummaryChange}
      />
      </PanelErrorBoundary>

      <VSCodePanels className="vscodePanels" activeid="tab-1">
        <VSCodePanelTab id="tab-1">CHAT</VSCodePanelTab>
        <VSCodePanelTab id="tab-2">FAQ</VSCodePanelTab>
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
                          onDeny={() => vsCode.postMessage({ command: "user-consent", message: "denied", threadId: pendingApproval?.threadId })}
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
                        />
                      )}
                      {/* Show typing indicator for chat messages before streaming content appears */}
                      {isBotLoading &&
                        !isCommandExecuting &&
                        (!isStreaming ||
                          !streamedMessages.some((m) => m.type === "bot" && m.isStreaming && m.content)) &&
                        !timeline.thinking &&
                        !timeline.plan &&
                        timeline.actions.length === 0 &&
                        !timeline.summarizing && (
                          <CommandFeedbackLoader commandAction="Thinking" />
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* File Changes Panel - shows pending and recent file modifications */}
            <PendingChangesPanel 
              collapsed={fileChangesPanelCollapsed}
              onToggle={() => useChatStore.getState().toggleFileChangesPanel()}
            />
            {/* Composer Panel - multi-file compose sessions */}
            <ComposerPanel
              collapsed={useChatStore.getState().composerPanelCollapsed}
              onToggle={() => useChatStore.getState().toggleComposerPanel()}
            />
            {/* Checkpoint Panel - revert workspace to previous state */}
            <CheckpointPanel
              collapsed={useChatStore.getState().checkpointPanelCollapsed}
              onToggle={() => useChatStore.getState().toggleCheckpointPanel()}
            />
          </div>
        </VSCodePanelView>

        <VSCodePanelView id="view-2">
          <div className="panel-body-scroll">
            <FAQAccordion items={faqItems} />
          </div>
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
          {activeEditor && (
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", padding: "0 2px 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Active: <span style={{ color: "rgba(255,255,255,0.6)" }}>{activeEditor}</span>
            </div>
          )}
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
          <CostDisplay costData={conversationCost} isStreaming={isStreaming} />
          <ChatInput onSendMessage={handleSend} disabled={isStreaming || isBotLoading} folders={folders} activeEditor={activeEditor} />
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
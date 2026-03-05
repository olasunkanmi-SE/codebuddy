/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useMemo } from "react";
import { vscode } from "../utils/vscode";
import i18n from "../i18n/i18n";
import type {
  CustomRule,
  SubagentConfig,
  SettingsValues,
  SettingsHandlers,
  SettingsOptions,
} from "../components/settings/SettingsContext";
import {
  DEFAULT_SUBAGENTS,
  DEFAULT_LANGUAGE_OPTIONS,
  DEFAULT_KEYMAP_OPTIONS,
  DEFAULT_FONT_FAMILY_OPTIONS,
  DEFAULT_FONT_SIZE_OPTIONS,
} from "../components/settings/SettingsContext";
import {
  codeBuddyMode,
  modelOptions,
  themeOptions,
} from "../constants/constant";

export interface SettingsState {
  selectedTheme: string;
  selectedModel: string;
  selectedCodeBuddyMode: string;
  username: string;
  selectedLanguage: string;
  enableStreaming: boolean;
  fontFamily: string;
  fontSize: number;
  compactMode: boolean;
  autoApprove: boolean;
  allowFileEdits: boolean;
  allowTerminal: boolean;
  verboseLogging: boolean;
  indexCodebase: boolean;
  contextWindow: string;
  includeHidden: boolean;
  maxFileSize: string;
  dailyStandupEnabled: boolean;
  codeHealthEnabled: boolean;
  dependencyCheckEnabled: boolean;
  gitWatchdogEnabled: boolean;
  endOfDaySummaryEnabled: boolean;
  browserType: "reader" | "simple" | "system";
  customRules: CustomRule[];
  customSystemPrompt: string;
  subagents: SubagentConfig[];
}

interface SettingsActions {
  patch: (partial: Partial<SettingsState>) => void;

  handleThemeChange: (value: string) => void;
  handleModelChange: (value: string) => void;
  handleCodeBuddyModeChange: (value: string) => void;
  handleLanguageChange: (value: string) => void;
  handleNicknameChange: (value: string) => void;
  handleStreamingChange: (enabled: boolean) => void;
  handleFontFamilyChange: (value: string) => void;
  handleFontSizeChange: (value: number) => void;
  handleAutoApproveChange: (enabled: boolean) => void;
  handleAllowFileEditsChange: (enabled: boolean) => void;
  handleAllowTerminalChange: (enabled: boolean) => void;
  handleVerboseLoggingChange: (enabled: boolean) => void;
  handleIndexCodebaseChange: (enabled: boolean) => void;
  handleContextWindowChange: (value: string) => void;
  handleIncludeHiddenChange: (enabled: boolean) => void;
  handleMaxFileSizeChange: (value: string) => void;
  handleCompactModeChange: (enabled: boolean) => void;
  handleReindexWorkspace: () => void;
  handleDailyStandupChange: (enabled: boolean) => void;
  handleCodeHealthChange: (enabled: boolean) => void;
  handleDependencyCheckChange: (enabled: boolean) => void;
  handleGitWatchdogChange: (enabled: boolean) => void;
  handleEndOfDaySummaryChange: (enabled: boolean) => void;
  handleBrowserTypeChange: (value: "reader" | "simple" | "system") => void;
  handleUsernameChange: (value: string) => void;
  handleIncreaseFontSize: () => void;
  handleDecreaseFontSize: () => void;

  addRule: (rule: Omit<CustomRule, "id" | "createdAt">) => void;
  updateRule: (id: string, updates: Partial<CustomRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string, enabled: boolean) => void;
  updateSystemPrompt: (prompt: string) => void;
  toggleSubagent: (id: string, enabled: boolean) => void;
}

type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>()((set, get) => {
  const notify = (key: string, value: any, command: string) => {
    set({ [key]: value } as any);
    vscode.postMessage({ command, message: value });
  };

  return {
    // ── State ──
    selectedTheme: "tokyo night",
    selectedModel: "Groq",
    selectedCodeBuddyMode: "Ask",
    username: "",
    selectedLanguage: "en",
    enableStreaming: true,
    fontFamily: "JetBrains Mono",
    fontSize: 13,
    compactMode: false,
    autoApprove: false,
    allowFileEdits: true,
    allowTerminal: true,
    verboseLogging: false,
    indexCodebase: false,
    contextWindow: "16k",
    includeHidden: false,
    maxFileSize: "1",
    dailyStandupEnabled: true,
    codeHealthEnabled: true,
    dependencyCheckEnabled: true,
    gitWatchdogEnabled: true,
    endOfDaySummaryEnabled: true,
    browserType: "reader" as const,
    customRules: [],
    customSystemPrompt: "",
    subagents: DEFAULT_SUBAGENTS,

    // ── Bulk setter (used by message dispatcher) ──
    patch: (partial) => set(partial),

    // ── UI handlers (set + notify extension) ──
    handleThemeChange: (v) => notify("selectedTheme", v, "theme-change-event"),
    handleModelChange: (v) => notify("selectedModel", v, "update-model-event"),
    handleCodeBuddyModeChange: (v) =>
      notify("selectedCodeBuddyMode", v, "codebuddy-model-change-event"),
    handleLanguageChange: (v) => {
      set({ selectedLanguage: v });
      i18n.changeLanguage(v);
      vscode.postMessage({ command: "language-change-event", message: v });
    },
    handleNicknameChange: (v) => notify("username", v, "nickname-change-event"),
    handleStreamingChange: (v) =>
      notify("enableStreaming", v, "streaming-change-event"),
    handleFontFamilyChange: (v) =>
      notify("fontFamily", v, "font-family-change-event"),
    handleFontSizeChange: (v) =>
      notify("fontSize", v, "font-size-change-event"),
    handleAutoApproveChange: (v) =>
      notify("autoApprove", v, "auto-approve-change-event"),
    handleAllowFileEditsChange: (v) =>
      notify("allowFileEdits", v, "allow-file-edits-change-event"),
    handleAllowTerminalChange: (v) =>
      notify("allowTerminal", v, "allow-terminal-change-event"),
    handleVerboseLoggingChange: (v) =>
      notify("verboseLogging", v, "verbose-logging-change-event"),
    handleIndexCodebaseChange: (v) =>
      notify("indexCodebase", v, "index-codebase-change-event"),
    handleContextWindowChange: (v) =>
      notify("contextWindow", v, "context-window-change-event"),
    handleIncludeHiddenChange: (v) =>
      notify("includeHidden", v, "include-hidden-change-event"),
    handleMaxFileSizeChange: (v) =>
      notify("maxFileSize", v, "max-file-size-change-event"),
    handleCompactModeChange: (v) =>
      notify("compactMode", v, "compact-mode-change-event"),
    handleReindexWorkspace: () =>
      vscode.postMessage({ command: "reindex-workspace-event" }),
    handleDailyStandupChange: (v) =>
      notify("dailyStandupEnabled", v, "daily-standup-change-event"),
    handleCodeHealthChange: (v) =>
      notify("codeHealthEnabled", v, "code-health-change-event"),
    handleDependencyCheckChange: (v) =>
      notify("dependencyCheckEnabled", v, "dependency-check-change-event"),
    handleGitWatchdogChange: (v) =>
      notify("gitWatchdogEnabled", v, "git-watchdog-change-event"),
    handleEndOfDaySummaryChange: (v) =>
      notify("endOfDaySummaryEnabled", v, "end-of-day-summary-change-event"),
    handleBrowserTypeChange: (v) => {
      set({ browserType: v });
      vscode.postMessage({
        command: "updateConfiguration",
        key: "codebuddy.browserType",
        value: v,
      });
    },
    handleUsernameChange: (v) => set({ username: v }),
    handleIncreaseFontSize: () => {
      const newSize = Math.min(get().fontSize + 1, 24);
      set({ fontSize: newSize });
      vscode.postMessage({
        command: "font-size-change-event",
        message: newSize,
      });
    },
    handleDecreaseFontSize: () => {
      const newSize = Math.max(get().fontSize - 1, 8);
      set({ fontSize: newSize });
      vscode.postMessage({
        command: "font-size-change-event",
        message: newSize,
      });
    },

    // ── Rules & Subagents ──
    addRule: (rule) =>
      set((s) => ({
        customRules: [
          ...s.customRules,
          { ...rule, id: `rule-${Date.now()}`, createdAt: Date.now() },
        ],
      })),
    updateRule: (id, updates) =>
      set((s) => ({
        customRules: s.customRules.map((r) =>
          r.id === id ? { ...r, ...updates } : r,
        ),
      })),
    deleteRule: (id) =>
      set((s) => ({
        customRules: s.customRules.filter((r) => r.id !== id),
      })),
    toggleRule: (id, enabled) =>
      set((s) => ({
        customRules: s.customRules.map((r) =>
          r.id === id ? { ...r, enabled } : r,
        ),
      })),
    updateSystemPrompt: (prompt) => set({ customSystemPrompt: prompt }),
    toggleSubagent: (id, enabled) =>
      set((s) => ({
        subagents: s.subagents.map((sub) =>
          sub.id === id ? { ...sub, enabled } : sub,
        ),
      })),
  };
});

// ── Derived hooks for SettingsPanel compatibility ──

export function useSettingsValues(): SettingsValues {
  return useSettingsStore(
    useShallow((s) => ({
      theme: s.selectedTheme,
      language: s.selectedLanguage,
      keymap: "default" as const,
      nickname: s.username,
      codeBuddyMode: s.selectedCodeBuddyMode,
      enableStreaming: s.enableStreaming,
      fontFamily: s.fontFamily,
      fontSize: s.fontSize,
      autoApprove: s.autoApprove,
      allowFileEdits: s.allowFileEdits,
      allowTerminal: s.allowTerminal,
      verboseLogging: s.verboseLogging,
      indexCodebase: s.indexCodebase,
      contextWindow: s.contextWindow,
      includeHidden: s.includeHidden,
      maxFileSize: s.maxFileSize,
      compactMode: s.compactMode,
      selectedModel: s.selectedModel,
      dailyStandupEnabled: s.dailyStandupEnabled,
      codeHealthEnabled: s.codeHealthEnabled,
      dependencyCheckEnabled: s.dependencyCheckEnabled,
      gitWatchdogEnabled: s.gitWatchdogEnabled,
      endOfDaySummaryEnabled: s.endOfDaySummaryEnabled,
      browserType: s.browserType,
      username: s.username,
      accountType: "Free" as const,
      customRules: s.customRules,
      customSystemPrompt: s.customSystemPrompt,
      subagents: s.subagents,
    })),
  );
}

export function useSettingsHandlers(): SettingsHandlers {
  return useMemo(() => {
    const s = useSettingsStore.getState();
    return {
      onThemeChange: s.handleThemeChange,
      onLanguageChange: s.handleLanguageChange,
      onKeymapChange: () => {},
      onNicknameChange: s.handleNicknameChange,
      onCodeBuddyModeChange: s.handleCodeBuddyModeChange,
      onStreamingChange: s.handleStreamingChange,
      onFontFamilyChange: s.handleFontFamilyChange,
      onFontSizeChange: s.handleFontSizeChange,
      onAutoApproveChange: s.handleAutoApproveChange,
      onAllowFileEditsChange: s.handleAllowFileEditsChange,
      onAllowTerminalChange: s.handleAllowTerminalChange,
      onVerboseLoggingChange: s.handleVerboseLoggingChange,
      onIndexCodebaseChange: s.handleIndexCodebaseChange,
      onContextWindowChange: s.handleContextWindowChange,
      onIncludeHiddenChange: s.handleIncludeHiddenChange,
      onMaxFileSizeChange: s.handleMaxFileSizeChange,
      onCompactModeChange: s.handleCompactModeChange,
      onReindexWorkspace: s.handleReindexWorkspace,
      onModelChange: s.handleModelChange,
      onUsernameChange: s.handleUsernameChange,
      postMessage: (msg: { command: string; [key: string]: any }) =>
        vscode.postMessage(msg),
      onAddRule: s.addRule,
      onUpdateRule: s.updateRule,
      onDeleteRule: s.deleteRule,
      onToggleRule: s.toggleRule,
      onUpdateSystemPrompt: s.updateSystemPrompt,
      onToggleSubagent: s.toggleSubagent,
      onDailyStandupChange: s.handleDailyStandupChange,
      onCodeHealthChange: s.handleCodeHealthChange,
      onDependencyCheckChange: s.handleDependencyCheckChange,
      onGitWatchdogChange: s.handleGitWatchdogChange,
      onEndOfDaySummaryChange: s.handleEndOfDaySummaryChange,
      onBrowserTypeChange: s.handleBrowserTypeChange,
    };
  }, []);
}

export function useSettingsOptions(): SettingsOptions {
  return useMemo<SettingsOptions>(
    () => ({
      themeOptions: themeOptions,
      modelOptions: modelOptions,
      codeBuddyModeOptions: codeBuddyMode,
      keymapOptions: DEFAULT_KEYMAP_OPTIONS,
      languageOptions: DEFAULT_LANGUAGE_OPTIONS,
      fontFamilyOptions: DEFAULT_FONT_FAMILY_OPTIONS,
      fontSizeOptions: DEFAULT_FONT_SIZE_OPTIONS,
      browserTypeOptions: [
        { value: "reader", label: "Smart Reader (Recommended)" },
        { value: "simple", label: "Simple Browser" },
        { value: "system", label: "System Browser" },
      ],
    }),
    [],
  );
}

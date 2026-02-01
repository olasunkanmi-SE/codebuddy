import React, { createContext, useContext, ReactNode } from 'react';

// Types for custom rules
export interface CustomRule {
  id: string;
  name: string;
  description: string;
  content: string;
  enabled: boolean;
  createdAt: number;
}

// Types for subagent configuration 
export interface SubagentConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  toolPatterns: string[];
}

// Types for settings values
export interface SettingsValues {
  // General
  theme: string;
  language: string;
  keymap: string;
  nickname: string;
  codeBuddyMode: string;
  enableStreaming: boolean;
  
  // Models
  selectedModel: string;
  
  // Account
  username: string;
  accountType: 'Free' | 'Pro';
  
  // Rules & Subagents
  customRules: CustomRule[];
  customSystemPrompt: string;
  subagents: SubagentConfig[];
}

// Types for options
export interface SelectOption {
  value: string;
  label: string;
}

export interface SettingsOptions {
  themeOptions: SelectOption[];
  modelOptions: SelectOption[];
  codeBuddyModeOptions: SelectOption[];
  keymapOptions: SelectOption[];
  languageOptions: SelectOption[];
}

// Change handlers
export interface SettingsHandlers {
  onThemeChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onKeymapChange: (value: string) => void;
  onNicknameChange: (value: string) => void;
  onCodeBuddyModeChange: (value: string) => void;
  onStreamingChange: (enabled: boolean) => void;
  onModelChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  postMessage: (message: { command: string; message?: any }) => void;
  // Rules & Subagents handlers
  onAddRule: (rule: Omit<CustomRule, 'id' | 'createdAt'>) => void;
  onUpdateRule: (id: string, updates: Partial<CustomRule>) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string, enabled: boolean) => void;
  onUpdateSystemPrompt: (prompt: string) => void;
  onToggleSubagent: (id: string, enabled: boolean) => void;
}

// Combined context type
export interface SettingsContextType {
  values: SettingsValues;
  options: SettingsOptions;
  handlers: SettingsHandlers;
}

// Default options
const DEFAULT_LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
];

const DEFAULT_KEYMAP_OPTIONS: SelectOption[] = [
  { value: 'default', label: 'Default' },
  { value: 'vim', label: 'Vim' },
  { value: 'emacs', label: 'Emacs' },
  { value: 'sublime', label: 'Sublime Text' },
];

// Default subagents matching the ToolProvider TOOL_ROLE_MAPPING
const DEFAULT_SUBAGENTS: SubagentConfig[] = [
  {
    id: 'code-analyzer',
    name: 'Code Analyzer',
    description: 'Deep code analysis, security scanning, and architecture review',
    enabled: true,
    toolPatterns: ['analyze', 'lint', 'security', 'complexity', 'quality', 'ast', 'parse', 'check', 'scan', 'review'],
  },
  {
    id: 'doc-writer',
    name: 'Documentation Writer',
    description: 'Generate comprehensive documentation and API references',
    enabled: true,
    toolPatterns: ['search', 'read', 'generate', 'doc', 'api', 'reference', 'web'],
  },
  {
    id: 'debugger',
    name: 'Debugger',
    description: 'Find and fix bugs with access to all available tools',
    enabled: true,
    toolPatterns: ['*'],
  },
  {
    id: 'file-organizer',
    name: 'File Organizer',
    description: 'Restructure and organize project files and directories',
    enabled: true,
    toolPatterns: ['file', 'directory', 'list', 'read', 'write', 'move', 'rename', 'delete', 'structure', 'organize'],
  },
];

// Default context value
const defaultContextValue: SettingsContextType = {
  values: {
    theme: 'tokyo night',
    language: 'en',
    keymap: 'default',
    nickname: '',
    codeBuddyMode: 'Agent',
    enableStreaming: true,
    selectedModel: 'Gemini',
    username: '',
    accountType: 'Free',
    customRules: [],
    customSystemPrompt: '',
    subagents: DEFAULT_SUBAGENTS,
  },
  options: {
    themeOptions: [],
    modelOptions: [],
    codeBuddyModeOptions: [],
    keymapOptions: DEFAULT_KEYMAP_OPTIONS,
    languageOptions: DEFAULT_LANGUAGE_OPTIONS,
  },
  handlers: {
    onThemeChange: () => {},
    onLanguageChange: () => {},
    onKeymapChange: () => {},
    onNicknameChange: () => {},
    onCodeBuddyModeChange: () => {},
    onStreamingChange: () => {},
    onModelChange: () => {},
    onUsernameChange: () => {},
    postMessage: () => {},
    onAddRule: () => {},
    onUpdateRule: () => {},
    onDeleteRule: () => {},
    onToggleRule: () => {},
    onUpdateSystemPrompt: () => {},
    onToggleSubagent: () => {},
  },
};

// Create context
const SettingsContext = createContext<SettingsContextType>(defaultContextValue);

// Provider component
interface SettingsProviderProps {
  children: ReactNode;
  values: SettingsValues;
  options: SettingsOptions;
  handlers: SettingsHandlers;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
  values,
  options,
  handlers,
}) => {
  const contextValue: SettingsContextType = {
    values,
    options: {
      ...options,
      keymapOptions: options.keymapOptions || DEFAULT_KEYMAP_OPTIONS,
      languageOptions: options.languageOptions || DEFAULT_LANGUAGE_OPTIONS,
    },
    handlers,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook to use settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Export default options for reuse
export { DEFAULT_LANGUAGE_OPTIONS, DEFAULT_KEYMAP_OPTIONS, DEFAULT_SUBAGENTS };

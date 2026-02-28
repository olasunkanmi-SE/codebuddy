export type SettingsCategory =
  | "account"
  | "general"
  | "browser"
  | "agents"
  | "mcp"
  | "connectors"
  | "conversation"
  | "models"
  | "context"
  | "rules"
  | "privacy"
  | "beta"
  | "about";

export interface SettingsCategoryInfo {
  id: SettingsCategory;
  label: string;
  icon: string;
  description?: string;
}

export interface SettingsNavItem {
  category: SettingsCategory;
  label: string;
  icon: React.ReactNode;
}

export interface SettingsOption {
  key: string;
  label: string;
  description?: string;
  type: "toggle" | "select" | "input" | "button" | "custom";
  value?: any;
  options?: { value: string; label: string }[];
  disabled?: boolean;
}

export interface SettingsSection {
  title: string;
  description?: string;
  options: SettingsOption[];
}

export interface UserProfile {
  username: string;
  avatarUrl?: string;
  accountType: "Free" | "Pro";
}

export const SETTINGS_CATEGORIES: SettingsCategoryInfo[] = [
  {
    id: "account",
    label: "Account",
    icon: "user",
    description: "Manage your account settings",
  },
  {
    id: "general",
    label: "General",
    icon: "settings",
    description: "General application settings",
  },
  {
    id: "browser",
    label: "Browser",
    icon: "globe",
    description: "Browser and link opening preferences",
  },
  {
    id: "agents",
    label: "Agents",
    icon: "bot",
    description: "Configure AI agent behavior",
  },
  {
    id: "mcp",
    label: "MCP",
    icon: "server",
    description: "Model Context Protocol servers",
  },
  {
    id: "connectors",
    label: "Connectors",
    icon: "plug",
    description: "Connect to external services",
  },
  {
    id: "conversation",
    label: "Conversation",
    icon: "message",
    description: "Chat and conversation settings",
  },
  {
    id: "models",
    label: "Models",
    icon: "cpu",
    description: "AI model configuration",
  },
  {
    id: "context",
    label: "Context",
    icon: "folder",
    description: "Workspace context settings",
  },
  {
    id: "rules",
    label: "Rules & Subagents",
    icon: "book",
    description: "Custom rules and subagent configuration",
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: "shield",
    description: "Privacy and data settings",
  },
  {
    id: "beta",
    label: "Beta",
    icon: "flask",
    description: "Beta features and experiments",
  },
  {
    id: "about",
    label: "About",
    icon: "info",
    description: "About this extension",
  },
];

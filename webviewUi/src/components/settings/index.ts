// Main components
export { SettingsPanel } from "./SettingsPanel";
export { SettingsSidebar } from "./SettingsSidebar";
export { SettingsContent } from "./SettingsContent";

// Context
export {
  SettingsProvider,
  useSettings,
  DEFAULT_LANGUAGE_OPTIONS,
  DEFAULT_KEYMAP_OPTIONS,
  DEFAULT_SUBAGENTS,
  DEFAULT_FONT_FAMILY_OPTIONS,
  DEFAULT_FONT_SIZE_OPTIONS,
} from "./SettingsContext";
export type {
  SettingsValues,
  SettingsOptions,
  SettingsHandlers,
  SettingsContextType,
  SelectOption,
  CustomRule,
  SubagentConfig,
} from "./SettingsContext";

// Types
export type {
  SettingsCategory,
  SettingsCategoryInfo,
  SettingsNavItem,
  SettingsOption,
  SettingsSection as SettingsSectionType,
  UserProfile,
} from "./types";
export { SETTINGS_CATEGORIES } from "./types";

// Icons
export { SettingsIcon, SettingsGearIcon } from "./icons";

// UI Components - renamed to avoid conflicts
export {
  SettingsSection,
  SectionTitle,
  SectionDescription,
  SettingsRow,
  SettingInfo,
  SettingLabel,
  SettingDescription,
  SettingControl,
  Toggle,
  Select,
  Input,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Divider,
  Badge,
  IconButton,
  EmptyState,
  EmptyStateIcon,
  EmptyStateTitle,
  EmptyStateDescription,
  LinkButton,
} from "./ui";

// Section Components
export * from "./sections";

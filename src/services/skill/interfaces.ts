/**
 * Skill System Interfaces
 *
 * Core type definitions for the enhanced skill system that provides
 * discoverable, toggleable skills with OS-aware CLI installation.
 */

/** CPU architecture */
export type CpuArch = "x64" | "arm64" | "arm";

/**
 * Architecture-specific binary download configuration
 */
export interface ArchSpecificDownload {
  /** URL for Intel x64 binary */
  x64?: string;
  /** URL for Apple Silicon / ARM64 binary */
  arm64?: string;
  /** URL for 32-bit ARM binary */
  arm?: string;
}

/**
 * Install configuration for a specific OS/package manager
 */
export interface InstallConfig {
  /** Homebrew formula (macOS) */
  brew?: string;
  /** APT package name (Debian/Ubuntu) */
  apt?: string;
  /** DNF package name (Fedora/RHEL) */
  dnf?: string;
  /** Pacman package name (Arch Linux) */
  pacman?: string;
  /** Snap package name */
  snap?: string;
  /** Scoop package name (Windows) */
  scoop?: string;
  /** Chocolatey package name (Windows) */
  choco?: string;
  /** Winget package ID (Windows) */
  winget?: string;
  /** NPM package (global install) */
  npm?: string;
  /** Pip package (Python) */
  pip?: string;
  /** Go package (go install) */
  go?: string;
  /** Fallback shell script (curl/wget based) */
  script?: string;
  /** Architecture-specific script for macOS */
  scriptArch?: ArchSpecificDownload;
  /** Direct binary download URLs by architecture */
  download?: ArchSpecificDownload;
  /** Human-readable manual install instructions */
  manual?: string;
}

/**
 * Dependency information for a skill's CLI tool
 */
export interface SkillDependencies {
  /** Name of the CLI binary */
  cli: string;
  /** Command to verify installation (e.g., "jira --version") */
  checkCommand: string;
  /** Path to bundled install script relative to extension (e.g., "skills/gitlab/install.sh") */
  bundledInstall?: string;
  /** OS-specific install configurations */
  install: {
    darwin?: InstallConfig;
    linux?: InstallConfig;
    windows?: InstallConfig;
  };
}

/**
 * Configuration field definition for skill setup
 */
export interface SkillConfigField {
  /** Environment variable or config key name */
  name: string;
  /** Display label in UI */
  label: string;
  /** Field type for UI rendering */
  type: "string" | "secret" | "number" | "boolean" | "select";
  /** Whether the field is required */
  required: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Help URL for documentation */
  helpUrl?: string;
  /** Default value */
  defaultValue?: string | number | boolean;
  /** Options for select type */
  options?: Array<{ label: string; value: string }>;
  /**
   * Explicit environment variable name to use (optional).
   * When set, this overrides the default behavior of using `name` as the env var.
   * Useful for mapping friendly field names to specific CLI env vars.
   * Example: { name: "apiKey", envVarName: "JIRA_API_TOKEN" }
   */
  envVarName?: string;
}

/**
 * Authentication configuration for a skill
 */
export interface SkillAuth {
  /** Authentication type */
  type: "api-key" | "oauth" | "basic" | "none";
  /** CLI command to run interactive setup */
  setupCommand?: string;
  /** OAuth provider (for oauth type) */
  oauthProvider?: string;
  /** Environment variables required by the CLI (mapped from config fields) */
  envVars?: string[];
}

/**
 * Full skill definition with all metadata
 */
export interface SkillDefinition {
  /** Unique identifier (lowercase, kebab-case) */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Short description for UI */
  description: string;
  /** Icon identifier or URL */
  icon?: string;
  /** Category for grouping in UI */
  category: SkillCategory;
  /** Semantic version */
  version: string;
  /** CLI dependency information */
  dependencies?: SkillDependencies;
  /** Configuration fields for setup */
  config?: SkillConfigField[];
  /** Authentication method */
  auth?: SkillAuth;
  /** Markdown content with usage instructions */
  content: string;
  /** Source of the skill definition */
  source: SkillSource;
  /** File path where skill was loaded from */
  filePath?: string;
}

/**
 * Skill categories for UI grouping
 */
export type SkillCategory =
  | "project-management"
  | "version-control"
  | "communication"
  | "cloud-devops"
  | "databases"
  | "monitoring"
  | "other";

/**
 * Named environment for a skill (e.g., LOCAL, QA, PROD)
 */
export interface SkillEnvironment {
  /** Unique identifier for the environment (e.g., "local", "qa", "prod") */
  id: string;
  /** Display name (e.g., "Local Development", "QA Environment") */
  displayName: string;
  /** Optional color for UI distinction */
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
  /** When the environment was created */
  createdAt: number;
  /** Optional description */
  description?: string;
}

/**
 * Default environment names
 */
export const DEFAULT_ENVIRONMENTS: SkillEnvironment[] = [
  {
    id: "default",
    displayName: "Default",
    color: "gray",
    createdAt: Date.now(),
  },
];

/**
 * Source of a skill definition
 */
export type SkillSource = "builtin" | "workspace" | "global" | "custom";

/**
 * Runtime state of a skill
 */
export interface SkillState {
  /** Whether the skill is enabled by the user */
  enabled: boolean;
  /** Whether the CLI dependency is installed */
  installed: boolean;
  /** Whether the skill has been configured (at least one environment) */
  configured: boolean;
  /** Scope where the skill is enabled */
  scope: "workspace" | "global";
  /** Last error message, if any */
  lastError?: string;
  /** Configuration values for default environment (deprecated, use environments) */
  configValues?: Record<string, string | number | boolean>;
  /** Named environments for this skill */
  environments?: SkillEnvironment[];
  /** Currently active environment ID */
  activeEnvironment?: string;
  /** Config values per environment (non-secrets only) */
  environmentConfigs?: Record<
    string,
    Record<string, string | number | boolean>
  >;
}

/**
 * Combined skill with definition and state
 */
export interface Skill extends SkillDefinition {
  /** Current runtime state */
  state: SkillState;
}

/**
 * Result of an enable skill operation
 */
export interface EnableSkillResult {
  success: boolean;
  /** True if CLI needs to be installed first */
  requiresInstall?: boolean;
  /** Install command for the current OS */
  installCommand?: string;
  /** True if configuration is required */
  requiresConfig?: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Result of a skill installation
 */
export interface InstallResult {
  success: boolean;
  /** Install command that was run */
  command?: string;
  /** Error message if failed */
  error?: string;
  /** Exit code from install command */
  exitCode?: number;
  /** Additional info message */
  message?: string;
}

/**
 * Result of checking skill dependencies
 */
export interface DependencyCheckResult {
  installed: boolean;
  /** Version string if available */
  version?: string;
  /** Path to the CLI binary */
  binaryPath?: string;
}

/**
 * Result of handling an auth failure
 */
export interface AuthFailureResult {
  /** Whether credentials were successfully reconfigured */
  reconfigured: boolean;
  /** Action taken by the user */
  action: "reconfigure" | "cancel" | "setup";
}

/**
 * Configuration status for a skill
 */
export interface SkillConfigStatus {
  /** Whether all required config is present */
  configured: boolean;
  /** Names of missing required config fields */
  missing: string[];
}

/**
 * Message types for skill handler communication
 */
export type SkillCommand =
  | "get-skills"
  | "enable-skill"
  | "disable-skill"
  | "install-skill-deps"
  | "configure-skill"
  | "check-skill-deps"
  | "run-skill-setup"
  | "get-skill-categories";

/**
 * Payload for skill commands
 */
export interface SkillCommandPayload {
  skillId?: string;
  config?: Record<string, string | number | boolean>;
  scope?: "workspace" | "global";
}

/**
 * Category metadata for UI
 */
export interface SkillCategoryInfo {
  id: SkillCategory;
  label: string;
  description: string;
  icon?: string;
}

/**
 * All available skill categories with metadata
 */
export const SKILL_CATEGORIES: SkillCategoryInfo[] = [
  {
    id: "project-management",
    label: "Project Management",
    description: "Issue tracking, sprint planning, and project organization",
    icon: "project",
  },
  {
    id: "version-control",
    label: "Version Control",
    description: "Git hosting, code review, and repository management",
    icon: "git-branch",
  },
  {
    id: "communication",
    label: "Communication",
    description: "Messaging, email, and team collaboration",
    icon: "comment-discussion",
  },
  {
    id: "cloud-devops",
    label: "Cloud & DevOps",
    description: "Cloud providers, container orchestration, and CI/CD",
    icon: "cloud",
  },
  {
    id: "databases",
    label: "Databases",
    description: "Database clients and data management",
    icon: "database",
  },
  {
    id: "monitoring",
    label: "Monitoring",
    description: "Error tracking, logging, and observability",
    icon: "pulse",
  },
  {
    id: "other",
    label: "Other",
    description: "Miscellaneous skills and utilities",
    icon: "extensions",
  },
];

/**
 * Default state for a new skill
 */
export const DEFAULT_SKILL_STATE: SkillState = {
  enabled: false,
  installed: false,
  configured: false,
  scope: "workspace",
  environments: [...DEFAULT_ENVIRONMENTS],
  activeEnvironment: "default",
  environmentConfigs: {},
};

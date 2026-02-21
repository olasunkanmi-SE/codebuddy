import { MCPServerConfig } from "./types";

/**
 * Preset MCP server configurations for common tools.
 * Users can add these with one click from the MCP Settings panel.
 */
export interface MCPPreset {
  /** Unique key used as the server name in config */
  id: string;
  /** Display name */
  name: string;
  /** Description shown in UI */
  description: string;
  /** Category for grouping */
  category: "browser" | "database" | "devtools" | "productivity";
  /** npm package name for the MCP server */
  package: string;
  /** The server configuration to write into settings */
  config: MCPServerConfig;
  /** Link to documentation */
  docsUrl?: string;
}

export const MCP_PRESETS: MCPPreset[] = [
  {
    id: "playwright",
    name: "Playwright Browser",
    description:
      "Browser automation — navigate, click, fill forms, take screenshots, and run scripts in a real Chromium browser",
    category: "browser",
    package: "@playwright/mcp",
    config: {
      command: "npx",
      args: ["@playwright/mcp@latest"],
      description: "Playwright MCP — browser automation for the agent",
      enabled: true,
      transport: "stdio",
    },
    docsUrl:
      "https://github.com/anthropics/anthropic-tools/tree/main/playwright-mcp",
  },
];

/**
 * Look up a preset by its id.
 */
export function getPreset(id: string): MCPPreset | undefined {
  return MCP_PRESETS.find((p) => p.id === id);
}

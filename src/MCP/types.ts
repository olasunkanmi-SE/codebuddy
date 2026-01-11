/**
 * MCP Type Definitions
 * Defines interfaces for MCP server configuration, tools, and results
 */

/**
 * Configuration for a single MCP server
 */
export interface MCPServerConfig {
  /** Command to execute (e.g., 'docker', 'node') */
  command: string;

  /** Command arguments */
  args: string[];

  /** Optional environment variables */
  env?: Record<string, string>;

  /** Server description (for UI display) */
  description?: string;

  /** Enable/disable this server */
  enabled?: boolean;
}

export type MCPServersConfig = Record<string, MCPServerConfig>;

/**
 * MCP Tool definition (from MCP protocol)
 */
export interface MCPTool {
  /** Unique tool name */
  name: string;

  /** Human-readable description */
  description?: string;

  /** JSON Schema for tool input */
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };

  /** Server that provides this tool */
  serverName: string;

  /** Tool metadata */
  metadata?: {
    category?: string;
    tags?: string[];
    version?: string;
  };
}

/**
 * Result from MCP tool execution
 */
export interface MCPToolResult {
  /** Result content (can be text, images, etc.) */
  content: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
    [key: string]: any;
  }>;

  /** Whether this is an error result */
  isError?: boolean;

  /** Execution metadata */
  metadata?: {
    duration?: number;
    serverName?: string;
    toolName?: string;
  };
}

/**
 * MCP Service statistics
 */
export interface MCPServiceStats {
  /** Number of connected servers */
  connectedServers: number;

  /** Total available tools */
  totalTools: number;

  /** Tools by server */
  toolsByServer: Record<string, number>;

  /** Total tool invocations */
  totalInvocations: number;

  /** Failed invocations */
  failedInvocations: number;

  /** Last refresh timestamp */
  lastRefresh: number;
}

/**
 * MCP Client state
 */
export enum MCPClientState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

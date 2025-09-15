# MCP Integration Strategy

## Overview

The Model Context Protocol (MCP) serves as the foundational layer that enables our specialist agents to access and utilize domain-specific tools and resources. This document outlines the integration strategy, implementation patterns, and best practices for leveraging MCP in our multi-agent system.

## MCP Architecture in Agent Context

### Agent-MCP Relationship

```
┌─────────────────┐    MCP Protocol    ┌─────────────────┐
│                 │◄─────────────────►│                 │
│   Agent Core    │                    │   MCP Server    │
│                 │                    │                 │
│ - Decision Logic│                    │ - Tool Registry │
│ - State Mgmt    │                    │ - Resource Mgmt │
│ - Communication │                    │ - Auth & Security│
└─────────────────┘                    └─────────────────┘
         │                                       │
         │                                       │
         ▼                                       ▼
┌─────────────────┐                    ┌─────────────────┐
│   Agent Tools   │                    │  External Tools │
│                 │                    │                 │
│ - MCP Adapter   │                    │ - Git CLI       │
│ - Tool Cache    │                    │ - Database APIs │
│ - Error Handler │                    │ - Analysis Tools│
└─────────────────┘                    └─────────────────┘
```

## MCP Authorization Architecture (Updated 2025-06-18)

### New Authorization Model

Following the MCP Spec update (2025-06-18), our architecture implements the new authorization pattern:

- **Authorization Server**: Issues access tokens for agents to access MCP resources
- **MCP Servers as Resource Servers**: Consume and validate access tokens, provide resources
- **Agent Clients**: Obtain tokens from Authorization Server, present to MCP Resource Servers

```
┌─────────────────┐    1. Request Token    ┌─────────────────┐
│                 │◄─────────────────────►│                 │
│  Agent Client   │                        │ Authorization   │
│                 │    2. Access Token     │    Server       │
└─────────────────┘                        └─────────────────┘
         │
         │ 3. Resource Request + Token
         ▼
┌─────────────────┐    4. Validate Token    ┌─────────────────┐
│                 │◄─────────────────────►│                 │
│   MCP Server    │                        │ Authorization   │
│ (Resource       │    5. Token Valid      │    Server       │
│  Server)        │                        │                 │
└─────────────────┘                        └─────────────────┘
         │
         │ 6. Provide Resource/Tool Access
         ▼
┌─────────────────┐
│  External Tool  │
│   (Git, DB,     │
│   Analysis)     │
└─────────────────┘
```

### Authorization Server Implementation

```typescript
interface AuthorizationServer {
  // Token issuance for agent authentication
  issueAccessToken(clientCredentials: ClientCredentials): Promise<AccessToken>;

  // Token validation for MCP Resource Servers
  validateToken(token: string): Promise<TokenValidationResult>;

  // Scope-based access control
  checkPermissions(token: string, resource: string, action: string): Promise<boolean>;

  // Token refresh and revocation
  refreshToken(refreshToken: string): Promise<AccessToken>;
  revokeToken(token: string): Promise<void>;
}

interface AccessToken {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope: string[];
}
```

## MCP Resource Server Implementation (Following 2025-06-18 Spec)

### 1. Handle Unauthorized Requests: Return 401 and WWW-Authenticate Header

When MCP clients send requests without access tokens or with invalid tokens, the MCP server must return HTTP 401 with proper WWW-Authenticate header:

```typescript
class MCPResourceServer {
  private resourceMetadataUrl: string;

  constructor(config: MCPServerConfig) {
    this.resourceMetadataUrl = `${config.baseUrl}/.well-known/oauth-protected-resource`;
  }

  // Handle unauthorized requests
  sendUnauthorizedResponse(res: Response): void {
    res.set("WWW-Authenticate", `Bearer resource_metadata="${this.resourceMetadataUrl}"`);
    res.status(401).json({
      error: "unauthorized",
      error_description: "Access token required",
    });
  }

  // Middleware to check for valid access token
  async authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      this.sendUnauthorizedResponse(res);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const validation = await this.validateAccessToken(token);

    if (!validation.valid) {
      this.sendUnauthorizedResponse(res);
      return;
    }

    req.tokenPayload = validation.payload;
    next();
  }
}
```

### 2. Resource Metadata Discovery Mechanism

Implement the `/.well-known/oauth-protected-resource` endpoint as required by RFC 9728:

```typescript
class MCPResourceMetadata {
  private config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  // Create metadata endpoint URL based on resource identifier
  static createResourceMetadataEndpoint(resource: string): URL {
    const resourceUrl = new URL(resource);

    // If the resource has no path (or is just '/'), endpoint is at the base
    if (resourceUrl.pathname === "/") {
      return new URL("/.well-known/oauth-protected-resource", resourceUrl.origin);
    }

    // Otherwise, append the resource's path to the base well-known path
    return new URL(`/.well-known/oauth-protected-resource${resourceUrl.pathname}`, resourceUrl.origin);
  }

  // Build resource metadata response
  getResourceMetadata(): ResourceMetadata {
    return {
      resource: this.config.resourceIdentifier,
      authorization_servers: this.config.authorizationServers,
      scopes_supported: this.config.supportedScopes,
      bearer_methods_supported: ["header"],
    };
  }

  // Express route handler for metadata endpoint
  handleMetadataRequest = (req: Request, res: Response): void => {
    const metadata = this.getResourceMetadata();
    res.json(metadata);
  };
}

interface ResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported: string[];
  bearer_methods_supported: string[];
}
```

### 3. Access Token Validation (Security-First Approach)

Implement secure token validation following the guide's security recommendations:

```typescript
import { jwtVerify, createRemoteJWKSet } from "jose";

class MCPTokenValidator {
  private configuredAuthServers: string[];
  private resourceIdentifier: string;
  private jwksCache: Map<string, any> = new Map();

  constructor(config: MCPServerConfig) {
    this.configuredAuthServers = config.authorizationServers;
    this.resourceIdentifier = config.resourceIdentifier;
  }

  async validateAccessToken(token: string): Promise<TokenValidationResult> {
    try {
      // 1. Parse unverified JWT header to get issuer
      const [header, payload] = token.split(".");
      const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString());
      const issuer = decodedPayload.iss;

      // 2. Security check: Verify issuer is in our configured authorization servers
      if (!this.configuredAuthServers.includes(issuer)) {
        throw new Error("Token issuer not in configured authorization servers");
      }

      // 3. Get JWKS for token verification
      const jwks = await this.getJWKS(issuer);

      // 4. Verify JWT with strict validation
      const { payload: verifiedPayload } = await jwtVerify(token, jwks, {
        issuer: issuer, // Strictly validate issuer
        audience: this.resourceIdentifier, // Validate audience is current MCP Server
        clockTolerance: 30, // Allow 30 seconds clock skew
      });

      return {
        valid: true,
        payload: verifiedPayload,
      };
    } catch (error) {
      console.error("Token validation failed:", error.message);
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  // Validate token has required scope for specific operation
  validateScope(tokenPayload: any, requiredScope: string): boolean {
    if (!tokenPayload.scope) {
      return false;
    }

    const tokenScopes = tokenPayload.scope.split(" ");
    return tokenScopes.includes(requiredScope);
  }

  // Handle scope validation with proper error response
  handleScopeValidation(req: Request, res: Response, requiredScope: string): boolean {
    if (!this.validateScope(req.tokenPayload, requiredScope)) {
      res.status(403).json({
        error: "insufficient_scope",
        error_description: `Required scope: ${requiredScope}`,
      });
      return false;
    }
    return true;
  }

  private async getJWKS(issuer: string): Promise<any> {
    if (!this.jwksCache.has(issuer)) {
      const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
      this.jwksCache.set(issuer, jwks);
    }
    return this.jwksCache.get(issuer);
  }
}

interface TokenValidationResult {
  valid: boolean;
  payload?: any;
  error?: string;
}
```

### 4. Complete MCP Server Configuration

Example configuration following the guide's patterns:

```typescript
interface MCPServerConfig {
  resourceIdentifier: string;
  authorizationServers: string[];
  supportedScopes: string[];
  baseUrl: string;
}

// Example configurations for different MCP servers
const gitToolsServerConfig: MCPServerConfig = {
  resourceIdentifier: "https://git-tools.agent-system.com",
  authorizationServers: ["https://auth.agent-system.com"],
  supportedScopes: ["git:read", "git:write", "github:api", "repo:admin"],
  baseUrl: "https://git-tools.agent-system.com",
};

const databaseToolsServerConfig: MCPServerConfig = {
  resourceIdentifier: "https://db-tools.agent-system.com",
  authorizationServers: ["https://auth.agent-system.com"],
  supportedScopes: ["db:read", "db:write", "db:admin", "schema:modify"],
  baseUrl: "https://db-tools.agent-system.com",
};
```

### 5. Tool Endpoint Implementation with Proper Auth

```typescript
class GitToolsMCPServer extends MCPResourceServer {
  private tokenValidator: MCPTokenValidator;

  constructor(config: MCPServerConfig) {
    super(config);
    this.tokenValidator = new MCPTokenValidator(config);
  }

  // Example: Git clone tool with scope validation
  async handleGitClone(req: Request, res: Response): Promise<void> {
    // Check for git:write scope
    if (!this.tokenValidator.handleScopeValidation(req, res, "git:write")) {
      return;
    }

    try {
      const { repositoryUrl, targetPath } = req.body;
      const result = await this.executeGitClone(repositoryUrl, targetPath);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "git_clone_failed", details: error.message });
    }
  }

  // Example: Repository metadata access with read scope
  async handleRepositoryInfo(req: Request, res: Response): Promise<void> {
    // Check for git:read scope
    if (!this.tokenValidator.handleScopeValidation(req, res, "git:read")) {
      return;
    }

    try {
      const { repositoryUrl } = req.params;
      const info = await this.getRepositoryInfo(repositoryUrl);
      res.json(info);
    } catch (error) {
      res.status(500).json({ error: "repository_info_failed", details: error.message });
    }
  }

  private async executeGitClone(repositoryUrl: string, targetPath: string): Promise<any> {
    // Implementation details...
  }

  private async getRepositoryInfo(repositoryUrl: string): Promise<any> {
    // Implementation details...
  }
}
```

## MCP Server Organization

### Domain-Specific MCP Servers

#### Git Tools MCP Server

```typescript
interface GitMCPServer {
  name: "git-tools-server";
  version: "1.0.0";

  tools: {
    // Repository operations
    "git-clone": GitCloneTool;
    "git-commit": GitCommitTool;
    "git-merge": GitMergeTool;
    "git-branch": GitBranchTool;

    // Analysis tools
    "git-log-analysis": GitLogAnalysisTool;
    "git-blame": GitBlameTool;
    "git-diff-analysis": GitDiffAnalysisTool;

    // Integration tools
    "github-api": GitHubAPITool;
    "gitlab-api": GitLabAPITool;
    "bitbucket-api": BitbucketAPITool;
  };

  resources: {
    "repository-metadata": RepositoryResource;
    "commit-history": CommitHistoryResource;
    "branch-info": BranchInfoResource;
  };
}
```

#### Database Tools MCP Server

```typescript
interface DatabaseMCPServer {
  name: "database-tools-server";
  version: "1.0.0";

  tools: {
    // Query operations
    "sql-executor": SQLExecutorTool;
    "query-optimizer": QueryOptimizerTool;
    "explain-plan": ExplainPlanTool;

    // Schema operations
    "schema-analyzer": SchemaAnalyzerTool;
    "migration-generator": MigrationGeneratorTool;
    "index-advisor": IndexAdvisorTool;

    // Performance tools
    "performance-monitor": PerformanceMonitorTool;
    "slow-query-analyzer": SlowQueryAnalyzerTool;
    "resource-monitor": ResourceMonitorTool;
  };

  resources: {
    "schema-metadata": SchemaResource;
    "performance-metrics": PerformanceMetricsResource;
    "query-stats": QueryStatsResource;
  };
}
```

#### Code Analysis MCP Server

```typescript
interface CodeAnalysisMCPServer {
  name: "code-analysis-server";
  version: "1.0.0";

  tools: {
    // Static analysis
    "eslint-analyzer": ESLintTool;
    "sonarqube-analyzer": SonarQubeTool;
    "semgrep-scanner": SemgrepTool;

    // Security analysis
    "vulnerability-scanner": VulnerabilityScannerTool;
    "dependency-checker": DependencyCheckerTool;
    "security-audit": SecurityAuditTool;

    // Quality metrics
    "complexity-analyzer": ComplexityAnalyzerTool;
    "coverage-analyzer": CoverageAnalyzerTool;
    "maintainability-index": MaintainabilityTool;
  };

  resources: {
    "code-metrics": CodeMetricsResource;
    "security-reports": SecurityReportResource;
    "quality-trends": QualityTrendsResource;
  };
}
```

## MCP Client Implementation in Agents

### Base MCP Client

````typescript
```typescript
abstract class BaseMCPClient {
  protected serverConnection: MCPServerConnection;
  protected toolCache: Map<string, Tool>;
  protected authClient: AuthorizationClient;
  protected accessToken: AccessToken | null = null;

  constructor(serverEndpoint: string, authConfig: AuthConfig) {
    this.authClient = new AuthorizationClient(authConfig);
    this.serverConnection = new MCPServerConnection(serverEndpoint);
    this.toolCache = new Map();
  }

  async connect(): Promise<void> {
    // Step 1: Obtain access token from Authorization Server
    this.accessToken = await this.authClient.getAccessToken();

    // Step 2: Connect to MCP Resource Server with token
    await this.serverConnection.connect({
      authorization: `Bearer ${this.accessToken.access_token}`
    });

    // Step 3: Initialize available tools
    await this.initializeTools();
  }

  async invokeTool(toolName: string, parameters: any): Promise<any> {
    // Ensure we have a valid token
    await this.ensureValidToken();

    return await this.serverConnection.invokeTool(toolName, parameters, {
      authorization: `Bearer ${this.accessToken.access_token}`
    });
  }

  async getResource(resourceUri: string): Promise<any> {
    // Ensure we have a valid token
    await this.ensureValidToken();

    return await this.serverConnection.getResource(resourceUri, {
      authorization: `Bearer ${this.accessToken.access_token}`
    });
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || this.isTokenExpiring()) {
      this.accessToken = await this.authClient.refreshAccessToken(this.accessToken?.refresh_token);
    }
  }

  private isTokenExpiring(): boolean {
    if (!this.accessToken) return true;
    const expiresAt = Date.now() + (this.accessToken.expires_in * 1000);
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes
    return (expiresAt - Date.now()) < refreshThreshold;
  }

  abstract initializeTools(): Promise<void>;
}
````

### Authorization Client Implementation

```typescript
class AuthorizationClient {
  private authServerEndpoint: string;
  private clientCredentials: ClientCredentials;
  private tokenCache: Map<string, AccessToken> = new Map();

  constructor(config: AuthConfig) {
    this.authServerEndpoint = config.authServerEndpoint;
    this.clientCredentials = config.clientCredentials;
  }

  async getAccessToken(scopes?: string[]): Promise<AccessToken> {
    const cacheKey = scopes?.join(",") || "default";
    const cachedToken = this.tokenCache.get(cacheKey);

    if (cachedToken && !this.isTokenExpiring(cachedToken)) {
      return cachedToken;
    }

    const tokenRequest = {
      grant_type: "client_credentials",
      client_id: this.clientCredentials.clientId,
      client_secret: this.clientCredentials.clientSecret,
      scope: scopes?.join(" ") || "mcp:access",
    };

    const response = await fetch(`${this.authServerEndpoint}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(tokenRequest),
    });

    if (!response.ok) {
      throw new Error(`Failed to obtain access token: ${response.statusText}`);
    }

    const token: AccessToken = await response.json();
    this.tokenCache.set(cacheKey, token);
    return token;
  }

  async refreshAccessToken(refreshToken?: string): Promise<AccessToken> {
    if (!refreshToken) {
      return await this.getAccessToken();
    }

    const tokenRequest = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: this.clientCredentials.clientId,
      client_secret: this.clientCredentials.clientSecret,
    };

    const response = await fetch(`${this.authServerEndpoint}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(tokenRequest),
    });

    if (!response.ok) {
      // If refresh fails, get new token
      return await this.getAccessToken();
    }

    return await response.json();
  }

  private isTokenExpiring(token: AccessToken): boolean {
    // Check if token expires within 5 minutes
    const expiresAt = Date.now() + token.expires_in * 1000;
    const refreshThreshold = 5 * 60 * 1000;
    return expiresAt - Date.now() < refreshThreshold;
  }
}
```

### Agent-Specific MCP Clients

#### Git Agent MCP Client

```typescript
class GitAgentMCPClient extends BaseMCPClient {
  async cloneRepository(url: string, path: string): Promise<RepositoryInfo> {
    return await this.invokeTool("git-clone", { url, path });
  }

  async analyzeCommitHistory(repositoryPath: string, options: AnalysisOptions): Promise<CommitAnalysis> {
    return await this.invokeTool("git-log-analysis", { repositoryPath, options });
  }

  async getRepositoryMetadata(repositoryId: string): Promise<RepositoryMetadata> {
    return await this.getResource(`repository-metadata://${repositoryId}`);
  }

  protected async initializeTools(): Promise<void> {
    // Initialize Git-specific tools
    this.toolCache.set("git-clone", await this.serverConnection.getTool("git-clone"));
    this.toolCache.set("git-commit", await this.serverConnection.getTool("git-commit"));
    // ... other tools
  }
}
```

#### Database Agent MCP Client

```typescript
class DatabaseAgentMCPClient extends BaseMCPClient {
  async executeQuery(connectionId: string, query: string): Promise<QueryResults> {
    return await this.invokeTool("sql-executor", { connectionId, query });
  }

  async optimizeQuery(query: string, database: DatabaseType): Promise<OptimizedQuery> {
    return await this.invokeTool("query-optimizer", { query, database });
  }

  async getPerformanceMetrics(connectionId: string): Promise<PerformanceMetrics> {
    return await this.getResource(`performance-metrics://${connectionId}`);
  }

  protected async initializeTools(): Promise<void> {
    // Initialize Database-specific tools
    this.toolCache.set("sql-executor", await this.serverConnection.getTool("sql-executor"));
    this.toolCache.set("query-optimizer", await this.serverConnection.getTool("query-optimizer"));
    // ... other tools
  }
}
```

## Tool Abstraction Layer

### Universal Tool Interface

```typescript
interface UniversalTool {
  name: string;
  description: string;
  version: string;
  parameters: ToolParameterSchema;

  execute(parameters: any): Promise<ToolResult>;
  validate(parameters: any): ValidationResult;
  getCapabilities(): ToolCapabilities;
}
```

### Tool Adapter Pattern

```typescript
class MCPToolAdapter implements UniversalTool {
  private mcpTool: MCPTool;
  private client: BaseMCPClient;

  constructor(mcpTool: MCPTool, client: BaseMCPClient) {
    this.mcpTool = mcpTool;
    this.client = client;
  }

  async execute(parameters: any): Promise<ToolResult> {
    try {
      const result = await this.client.invokeTool(this.mcpTool.name, parameters);
      return new ToolResult(true, result);
    } catch (error) {
      return new ToolResult(false, null, error);
    }
  }

  validate(parameters: any): ValidationResult {
    return this.mcpTool.parameterSchema.validate(parameters);
  }
}
```

## Resource Management

### Resource Caching Strategy

```typescript
class MCPResourceCache {
  private cache: Map<string, CacheEntry>;
  private ttl: Map<string, number>;

  async get<T>(resourceUri: string): Promise<T | null> {
    const entry = this.cache.get(resourceUri);
    if (entry && this.isValid(resourceUri)) {
      return entry.data as T;
    }
    return null;
  }

  set<T>(resourceUri: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(resourceUri, { data, timestamp: Date.now() });
    this.ttl.set(resourceUri, ttlSeconds * 1000);
  }

  private isValid(resourceUri: string): boolean {
    const entry = this.cache.get(resourceUri);
    const ttl = this.ttl.get(resourceUri) || 0;
    return entry && Date.now() - entry.timestamp < ttl;
  }
}
```

### Resource Subscription Pattern

```typescript
class MCPResourceSubscription {
  private subscriptions: Map<string, ResourceSubscription>;

  async subscribe(resourceUri: string, callback: (data: any) => void): Promise<void> {
    const subscription = new ResourceSubscription(resourceUri, callback);
    this.subscriptions.set(resourceUri, subscription);

    // Implement WebSocket or polling-based subscription
    await this.establishSubscription(subscription);
  }

  async unsubscribe(resourceUri: string): Promise<void> {
    const subscription = this.subscriptions.get(resourceUri);
    if (subscription) {
      await subscription.close();
      this.subscriptions.delete(resourceUri);
    }
  }
}
```

## Error Handling and Resilience

### MCP Error Handling

```typescript
class MCPErrorHandler {
  async handleToolError(error: MCPError, toolName: string, parameters: any): Promise<ToolResult> {
    switch (error.type) {
      case MCPErrorType.TOOL_NOT_FOUND:
        return await this.handleMissingTool(toolName);

      case MCPErrorType.INVALID_PARAMETERS:
        return await this.handleInvalidParameters(toolName, parameters, error);

      case MCPErrorType.EXECUTION_TIMEOUT:
        return await this.handleTimeout(toolName, parameters);

      case MCPErrorType.SERVER_UNAVAILABLE:
        return await this.handleServerUnavailable(toolName);

      default:
        return new ToolResult(false, null, error);
    }
  }

  private async handleMissingTool(toolName: string): Promise<ToolResult> {
    // Attempt to find alternative tools or fallback mechanisms
    const alternatives = await this.findAlternativeTools(toolName);
    if (alternatives.length > 0) {
      // Log the fallback and continue with alternative
      return new ToolResult(true, null, `Using alternative tool: ${alternatives[0]}`);
    }
    return new ToolResult(false, null, `Tool ${toolName} not available and no alternatives found`);
  }
}
```

### Circuit Breaker Pattern

```typescript
class MCPCircuitBreaker {
  private failures: Map<string, number>;
  private lastFailure: Map<string, number>;
  private threshold: number = 5;
  private timeout: number = 60000; // 1 minute

  async execute<T>(serverEndpoint: string, operation: () => Promise<T>): Promise<T> {
    if (this.isCircuitOpen(serverEndpoint)) {
      throw new Error(`Circuit breaker open for ${serverEndpoint}`);
    }

    try {
      const result = await operation();
      this.recordSuccess(serverEndpoint);
      return result;
    } catch (error) {
      this.recordFailure(serverEndpoint);
      throw error;
    }
  }

  private isCircuitOpen(serverEndpoint: string): boolean {
    const failures = this.failures.get(serverEndpoint) || 0;
    const lastFailure = this.lastFailure.get(serverEndpoint) || 0;

    return failures >= this.threshold && Date.now() - lastFailure < this.timeout;
  }
}
```

## Configuration and Discovery

### MCP Server Configuration

```json
{
  "mcp-integration": {
    "authorization-server": {
      "endpoint": "http://auth-server.internal:8080",
      "client-id": "agent-system",
      "client-secret": "env:AUTH_CLIENT_SECRET",
      "token-endpoint": "/oauth2/token",
      "validation-endpoint": "/oauth2/introspect"
    },
    "servers": {
      "git-tools": {
        "endpoint": "http://localhost:8001",
        "resource-server": {
          "token-validation": "authorization-server",
          "required-scopes": ["git:read", "git:write", "github:api"]
        },
        "connection": {
          "timeout": 30000,
          "retry-attempts": 3,
          "circuit-breaker": true
        }
      },
      "database-tools": {
        "endpoint": "http://localhost:8002",
        "resource-server": {
          "token-validation": "authorization-server",
          "required-scopes": ["db:read", "db:write", "db:admin"]
        },
        "connection": {
          "timeout": 60000,
          "retry-attempts": 2,
          "circuit-breaker": true
        }
      },
      "code-analysis": {
        "endpoint": "http://localhost:8003",
        "resource-server": {
          "token-validation": "authorization-server",
          "required-scopes": ["code:scan", "security:audit", "quality:analyze"]
        },
        "connection": {
          "timeout": 120000,
          "retry-attempts": 1,
          "circuit-breaker": false
        }
      }
    },
    "token-management": {
      "token-cache-ttl": 3300,
      "token-refresh-threshold": 300,
      "max-token-retries": 3,
      "token-storage": "secure-memory"
    },
    "discovery": {
      "auto-discovery": true,
      "discovery-endpoints": ["http://discovery.internal:8080/mcp-servers"],
      "refresh-interval": 300
    },
    "caching": {
      "tool-cache-ttl": 3600,
      "resource-cache-ttl": 300,
      "max-cache-size": "100MB"
    }
  }
}
```

### Dynamic Tool Discovery

```typescript
class MCPDiscoveryService {
  private knownServers: Map<string, MCPServerInfo>;

  async discoverServers(): Promise<MCPServerInfo[]> {
    const discoveryEndpoints = this.getDiscoveryEndpoints();
    const servers: MCPServerInfo[] = [];

    for (const endpoint of discoveryEndpoints) {
      try {
        const discoveredServers = await this.queryDiscoveryEndpoint(endpoint);
        servers.push(...discoveredServers);
      } catch (error) {
        console.warn(`Failed to discover servers from ${endpoint}:`, error);
      }
    }

    return this.deduplicateServers(servers);
  }

  async getToolsForDomain(domain: string): Promise<ToolInfo[]> {
    const relevantServers = await this.getServersForDomain(domain);
    const tools: ToolInfo[] = [];

    for (const server of relevantServers) {
      const serverTools = await this.queryServerTools(server);
      tools.push(...serverTools);
    }

    return tools;
  }
}
```

## Performance Optimization

### Tool Execution Optimization

```typescript
class MCPPerformanceOptimizer {
  async optimizeToolExecution(toolName: string, parameters: any): Promise<OptimizationStrategy> {
    // Analyze tool usage patterns
    const usage = await this.analyzeToolUsage(toolName);

    // Determine optimal execution strategy
    if (usage.frequency > 100 && usage.avgExecutionTime > 5000) {
      return new CachingStrategy(toolName, parameters);
    }

    if (usage.parallelizable && parameters.batch) {
      return new BatchExecutionStrategy(toolName, parameters);
    }

    return new StandardExecutionStrategy(toolName, parameters);
  }

  async batchToolExecutions(requests: ToolRequest[]): Promise<ToolResult[]> {
    // Group requests by tool and server
    const groupedRequests = this.groupRequestsByTool(requests);
    const results: ToolResult[] = [];

    // Execute batches in parallel where possible
    const batchPromises = Object.entries(groupedRequests).map(([toolName, requests]) =>
      this.executeBatch(toolName, requests)
    );

    const batchResults = await Promise.all(batchPromises);
    return results.concat(...batchResults);
  }
}
```

## Monitoring and Observability

### MCP Metrics Collection

```typescript
class MCPMetricsCollector {
  private metrics: Map<string, Metric>;

  recordToolInvocation(toolName: string, duration: number, success: boolean): void {
    this.metrics.set(`tool.${toolName}.invocations`, this.incrementCounter(`tool.${toolName}.invocations`));

    this.metrics.set(`tool.${toolName}.duration`, this.recordDuration(`tool.${toolName}.duration`, duration));

    if (success) {
      this.incrementCounter(`tool.${toolName}.success`);
    } else {
      this.incrementCounter(`tool.${toolName}.failures`);
    }
  }

  recordResourceAccess(resourceUri: string, cacheHit: boolean): void {
    this.incrementCounter(`resource.accesses`);

    if (cacheHit) {
      this.incrementCounter(`resource.cache.hits`);
    } else {
      this.incrementCounter(`resource.cache.misses`);
    }
  }

  getMetricsSummary(): MetricsSummary {
    return {
      toolInvocations: this.getToolMetrics(),
      resourceAccess: this.getResourceMetrics(),
      serverHealth: this.getServerHealthMetrics(),
      performance: this.getPerformanceMetrics(),
    };
  }
}
```

This MCP integration strategy provides a comprehensive foundation for connecting our specialist agents to their domain-specific tools through the Model Context Protocol, ensuring scalable, reliable, and performant tool access across the multi-agent system.\n\n## MCP Auth Implementation Checklist (Following 2025-06-18 Spec)\n\n### ✅ Required MCP Server (Resource Server) Implementation:\n\n1. **401 Unauthorized Response with WWW-Authenticate Header**\n - Return `WWW-Authenticate: Bearer resource_metadata=\"<metadata-url>\"` for missing/invalid tokens\n - Include proper error responses following RFC standards\n\n2. **Resource Metadata Discovery (/.well-known/oauth-protected-resource)**\n - Implement metadata endpoint at `{server-address}/.well-known/oauth-protected-resource[/service-path]`\n - Return JSON with required fields: `resource`, `authorization_servers`, `scopes_supported`, `bearer_methods_supported`\n - Support multiple services with separate metadata endpoints if needed\n\n3. **Secure Access Token Validation**\n - Validate tokens using **configured authorization servers only** (security critical)\n - Strict audience validation: ensure token `aud` matches resource identifier\n - Proper issuer validation against configured authorization servers\n - JWT signature verification using JWKS from authorization servers\n\n4. **Scope-Based Access Control**\n - Validate required scopes for each tool/resource access\n - Return 403 Forbidden for insufficient scope (not 401)\n - Support granular permissions (git:read, git:write, db:admin, etc.)\n\n### ✅ Required MCP Client Implementation:\n\n1. **Auth Flow Discovery**\n - Make initial request without token to discover auth requirements\n - Parse WWW-Authenticate header to extract resource metadata URL\n - Fetch and parse resource metadata to understand auth requirements\n\n2. **Token Management**\n - Request tokens from authorization servers specified in metadata\n - Include appropriate scopes in token requests\n - Handle token refresh and retry logic for expired tokens\n - Proper error handling for 401 (re-auth) vs 403 (insufficient scope)\n\n3. **Security Best Practices**\n - Always include audience parameter when requesting tokens\n - Validate token responses and handle auth errors gracefully\n - Implement token caching with proper expiration handling\n\n### 🔐 Security Considerations:\n\n- **Never trust token issuer from unverified JWT** - always validate against configured auth servers\n- **Strict audience validation** prevents token abuse across services \n- **Scope validation** provides granular access control\n- **Proper error codes** (401 vs 403) for different auth failure scenarios\n- **Token caching** reduces auth server load while maintaining security\n\n### 📋 Example Resource Metadata Response:\n\n`json\n{\n  \"resource\": \"https://git-tools.agent-system.com\",\n  \"authorization_servers\": [\n    \"https://auth.agent-system.com\"\n  ],\n  \"scopes_supported\": [\n    \"git:read\",\n    \"git:write\", \n    \"github:api\",\n    \"repo:admin\"\n  ],\n  \"bearer_methods_supported\": [\n    \"header\"\n  ]\n}\n`\n\nThis implementation ensures full compliance with the MCP Auth Spec (2025-06-18) and follows security best practices for OAuth 2.0 Resource Server patterns.

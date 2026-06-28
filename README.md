> **DEPRECATION NOTICE**  
> Active development for CodeBuddy has officially moved to a private repository. This public repository is now archived and will no longer accept new features, bug fixes, issues, or pull requests (including automated dependency updates). 
> 
> Thank you to everyone who supported and interacted with the public version of this project!
# CodeBuddy

### Autonomous AI Software Engineer for Visual Studio Code

Read the [DOCS](https://codebuddy-docs.vercel.app/getting-started/overview/)

CodeBuddy is a multi-agent AI software engineer that operates inside VS Code. It plans, writes, debugs, tests, documents, and deploys entire features autonomously -- reading your codebase, running terminal commands, editing files, searching the web, and correcting its own mistakes until the task is done.

It supports 10 AI providers (cloud and local), over 20 built-in tools, 16 bundled skill integrations, a Model Context Protocol gateway for unlimited extensibility, enterprise-grade security controls, and full internationalization in 7 languages.


[![CI](https://github.com/olasunkanmi-SE/codebuddy/actions/workflows/workflow.yml/badge.svg)](https://github.com/olasunkanmi-SE/codebuddy/actions/workflows/workflow.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Architecture](#architecture)
- [Agent System](#agent-system)
- [Concurrency and Queue Management](#concurrency-and-queue-management)
- [Operating Modes](#operating-modes)
- [AI Providers](#ai-providers)
- [Provider Failover](#provider-failover)
- [Built-in Tools](#built-in-tools)
- [Commands](#commands)
- [Inline Code Completion](#inline-code-completion)
- [Diff Review System](#diff-review-system)
- [Model Context Protocol (MCP)](#model-context-protocol-mcp)
- [Connectors and Integrations](#connectors-and-integrations)
- [Skills System](#skills-system)
- [Context Pipeline](#context-pipeline)
- [Hybrid Memory and Search](#hybrid-memory-and-search)
- [Project Rules](#project-rules)
- [Security](#security)
- [Coworker Automations](#coworker-automations)
- [Cost Tracking](#cost-tracking)
- [Smart Reader](#smart-reader)
- [Observability](#observability)
- [Internationalization](#internationalization)
- [Settings Reference](#settings-reference)
- [Installation](#installation)
- [Configuration](#configuration)
- [Data Storage](#data-storage)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture

CodeBuddy is built on an event-driven, layered architecture designed for extensibility, provider-agnosticism, and real-time streaming.

### Orchestrator

The Orchestrator is a singleton event bus at the center of the system. Every subsystem communicates exclusively through publish/subscribe events. The Orchestrator never calls services directly -- it emits typed events and listeners react independently. This fully decouples the agent layer, webview layer, and service layer from one another.

### Agent Execution Pipeline

```
User message (webview)
  --> BaseWebViewProvider receives via onDidReceiveMessage
    --> InputValidator sanitizes input
    --> ConcurrencyQueueService gates admission (priority-aware semaphore)
    --> MessageHandler routes to CodeBuddyAgentService
      --> DeveloperAgent invokes createDeepAgent()
        --> LangGraph graph executes (reason -> act -> observe loop)
          --> Tools execute (file edit, terminal, search, MCP, etc.)
          --> Stream events emitted per token / per tool call
          --> AgentSafetyGuard enforces event/tool/duration limits
          --> ProviderFailoverService retries on alternate providers
        --> Events flow back through Orchestrator
      --> WebViewProvider forwards to webview via postMessage
User sees streamed response with real-time tool activity indicators
```

### Webview Communication

The extension host and the React webview communicate over a bidirectional `postMessage` protocol. The webview sends structured commands. The extension responds with typed events.

### Persistence Strategy

| Layer                  | Mechanism                                     | Purpose                                                       |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| In-memory cache        | TTL-based Map (Memory singleton)              | Session data, model references, transient state               |
| File storage           | `.codebuddy/` workspace directory             | Agent state snapshots, memories, tasks, rules                 |
| SQLite                 | sql.js (WASM) with FTS4 full-text search      | Codebase analysis, persistent structured data, keyword search |
| LangGraph checkpointer | SqljsCheckpointSaver (SQLite-backed)          | Multi-turn conversation threads with resumable state          |
| VS Code SecretStorage  | Encrypted OS keychain                         | API keys and credentials                                      |
| Vector store           | SqliteVectorStore with pre-normalized vectors | Workspace embeddings for semantic search                      |
| Credential proxy       | In-process HTTP proxy on 127.0.0.1            | Session-token-authenticated credential injection for LLM SDK  |

### Tree-Sitter Language Support

CodeBuddy uses Tree-sitter WASM binaries for accurate AST parsing across 7 languages, powering codebase analysis, symbol extraction, and the code indexing worker thread:

| Language   | Binary                        |
| ---------- | ----------------------------- |
| JavaScript | `tree-sitter-javascript.wasm` |
| TypeScript | `tree-sitter-tsx.wasm`        |
| Python     | `tree-sitter-python.wasm`     |
| Go         | `tree-sitter-go.wasm`         |
| Java       | `tree-sitter-java.wasm`       |
| Rust       | `tree-sitter-rust.wasm`       |
| PHP        | `tree-sitter-php.wasm`        |

---

## Agent System

### Multi-Agent Architecture

CodeBuddy uses a multi-agent architecture built on the LangGraph DeepAgents framework. A Developer Agent coordinates the work, with seven specialized subagents that each receive role-specific filtered tools:

| Subagent       | Responsibility                                                                        |
| -------------- | ------------------------------------------------------------------------------------- |
| Code Analyzer  | Deep code review, bug identification, complexity analysis, anti-pattern detection     |
| Doc Writer     | Technical documentation, API references, README generation, tutorials                 |
| Debugger       | Error investigation, stack trace analysis, root cause identification, fix proposals   |
| File Organizer | Directory restructuring, file renaming, project layout optimization                   |
| Architect      | System design, pattern selection, architecture decision records, scalability planning |
| Reviewer       | Code quality enforcement, security review, best practices, style compliance           |
| Tester         | Test strategy, unit/integration test generation, test execution and validation        |

### Self-Healing Execution

When the agent encounters a failure -- a build error, a failed test, an invalid command output -- it does not stop. It reads the error, analyzes the root cause, applies a correction, and retries. This loop continues until the task succeeds or the agent determines the issue requires human intervention.

### Safety Guardrails

The `AgentSafetyGuard` enforces hard limits on every agent stream to prevent runaway execution:

- Maximum 2,000 stream events per session (configurable up to 10,000).
- Maximum 400 tool invocations per session (configurable up to 2,000).
- Maximum 10-minute runtime per session (configurable up to 60 minutes).
- Per-tool call counting with specific caps: file edits (8), terminal commands (10), web searches (8).
- Loop detection for repeated file edits to the same file (threshold: 4).

The `ProductionSafeguards` service provides a circuit breaker with CLOSED/OPEN/HALF_OPEN states and 5 recovery strategies for handling sustained failures.

### Human-in-the-Loop

Destructive operations (such as file deletion) trigger an interrupt that pauses execution and asks for explicit approval. The user can approve, edit, or reject the proposed action before the agent continues.

### Checkpoints

The `CheckpointService` saves agent execution state to SQLite, enabling resumable conversations. Before each agent operation, a named checkpoint is created so work can be restored if the session is interrupted.

---

## Concurrency and Queue Management

The `ConcurrencyQueueService` controls the maximum number of concurrent agent operations. When all slots are occupied, incoming requests are queued in priority-aware FIFO order and drained as slots free up.

- **Configurable concurrency limit**: 1 to 10 slots (default 3), adjustable at runtime.
- **Three priority levels**: USER (2), SCHEDULED (1), BACKGROUND (0). Higher-priority requests are dequeued first; ties are broken by arrival time.
- **Queue depth cap**: Scales proportionally with the concurrency limit (10x multiplier). Requests beyond the cap are rejected with back-pressure feedback.
- **Starvation prevention**: Items waiting longer than 60 seconds receive an automatic priority boost, preserving fairness with stable sort.
- **Cancellation**: Cancel individual items or all waiting items from the QuickPick status view.
- **AbortSignal support**: Callers can pass an `AbortSignal` or a timeout for cooperative cancellation. Runtime polyfills ensure compatibility across VS Code Electron versions.
- **Status bar**: Displays running and queued counts. Hidden when the queue is idle.
- **Guaranteed slot release**: An outer `try/finally` in the agent service ensures slots are always returned, even on stream failure or cancellation.

---

## Operating Modes

**Agent Mode** -- Full autonomous execution. The agent has access to all tools: file creation and editing, terminal commands, web search, codebase analysis, MCP integrations, and debugger access. File changes go through the diff review system for approval.

**Ask Mode** -- Direct question-and-answer interaction. The agent answers questions, explains code, and provides suggestions without modifying files or running commands. Context is gathered from your workspace automatically. Supports context window compaction with automatic summarization when approaching token limits.

---

## AI Providers

CodeBuddy supports 10 AI providers. Switch between them at any time without restarting.

| Provider            | Default Model           | Notes                                                        |
| ------------------- | ----------------------- | ------------------------------------------------------------ |
| Gemini (Google)     | gemini-2.5-pro          | Long context window, strong general coding                   |
| Anthropic (Claude)  | claude-sonnet-4-5       | Complex architecture, large refactors                        |
| OpenAI              | gpt-4o                  | Reasoning, planning, broad knowledge                         |
| DeepSeek            | deepseek-chat           | Cost-effective, strong code generation                       |
| Qwen (Alibaba)      | qwen-max                | Competitive open-weight performance                          |
| Groq                | llama-3.1-70b-versatile | Ultra-fast inference via dedicated hardware                  |
| GLM (Zhipu AI)      | glm-4                   | Chinese and English bilingual support                        |
| XGrok               | grok                    | Alternative reasoning model                                  |
| Ollama (Local)      | qwen2.5-coder           | Fully offline, zero API cost, code never leaves your machine |
| Docker Model Runner | configurable            | Run models via Docker Desktop's built-in model runtime       |

All providers use a unified `buildChatModel()` factory that normalizes configuration, applies proxy headers when the credential proxy is active, and produces LangChain-compatible chat model instances.

---

## Provider Failover

The `ProviderFailoverService` automatically switches to a backup LLM provider when the primary fails. This prevents dead conversations from rate limits, billing issues, or provider outages.

- **Ordered fallback chain**: Configure an explicit provider priority list, or let CodeBuddy auto-detect from your configured API keys.
- **Failure classification**: HTTP status codes are mapped to specific reasons -- auth (401), billing (402), rate limit (429), timeout (408), overloaded (503), model not found (404) -- each with its own cooldown period.
- **Cooldown management**: auth=10 min, billing=30 min, rate limit=1 min, timeout=30s, overloaded=2 min, model not found=1 hr.
- **Probe recovery**: Providers are probed before their cooldown expires (30s margin) to restore them as available.
- **Thread continuity**: Failover preserves the conversation thread via checkpoint-based `thread_id` continuity.
- **Health indicator**: The `ProviderHealthIndicator` in the webview shows green/yellow/red status with tooltip details.

---

## Built-in Tools

The agent has access to over 20 tools that it selects and invokes autonomously:

| Tool               | What It Does                                                                     |
| ------------------ | -------------------------------------------------------------------------------- |
| File Analysis      | Read, analyze, and understand code files in your workspace                       |
| File Editing       | Create, overwrite, or apply targeted search-and-replace edits with diff review   |
| File Listing       | Explore directory structures and discover project layout                         |
| Terminal           | Execute shell commands with real-time output streaming and error capture         |
| Deep Terminal      | Persistent terminal sessions with buffered output for long-running processes     |
| Git Operations     | Diff, log, status, branch management, and commit operations                      |
| Ripgrep Search     | Fast full-text search across the entire codebase                                 |
| Web Search         | Internet search via Tavily for documentation, solutions, and references          |
| Symbol Search      | Find function definitions, class declarations, and code symbols                  |
| Diagnostics        | Read VS Code diagnostic errors and warnings from the Problems panel              |
| Web Preview        | Open browser previews for web applications                                       |
| Vector DB Search   | Semantic similarity search over indexed codebase embeddings                      |
| Task Manager       | Persistent task tracking with priorities and status (pending, in progress, done) |
| Core Memory        | Store and recall knowledge, rules, and experience across sessions                |
| Think              | Extended chain-of-thought reasoning for complex problem solving                  |
| Debug: State       | Inspect active debug session state                                               |
| Debug: Stack Trace | Read and analyze stack traces during debugging                                   |
| Debug: Variables   | Inspect variable values in the current debug scope                               |
| Debug: Evaluate    | Evaluate expressions in the debug context                                        |
| Debug: Control     | Step into, step over, continue, and pause debug execution                        |
| MCP Tools          | Dynamically loaded tools from connected MCP servers                              |

Tools are registered through the `ToolProvider` and filtered per subagent role. The `PermissionScopeService` can further restrict which tools are available based on the active permission profile.

---

## Commands

All commands are available from the Command Palette, the right-click context menu, or their keyboard shortcuts.

### Code Operations

| Command                       | Shortcut    | Description                                                     |
| ----------------------------- | ----------- | --------------------------------------------------------------- |
| Comment Code                  | Cmd+Shift+J | Generate clear, contextual comments for selected code           |
| Review Code                   | Cmd+Shift+R | Comprehensive code review covering quality and security         |
| Refactor Code                 | Cmd+Shift+; | Restructure code for readability and maintainability            |
| Optimize Code                 | Cmd+Shift+0 | Identify and apply performance optimizations                    |
| Explain Code                  | Cmd+Shift+1 | Get a clear explanation of what selected code does and why      |
| Generate Commit Message       | Cmd+Shift+2 | Produce a commit message from staged changes                    |
| Inline Chat                   | Cmd+Shift+8 | Quick inline code discussion and editing                        |
| Generate Architecture Diagram | Cmd+Shift+7 | Produce Mermaid diagrams visualizing code structure             |
| Codebase Analysis             | Cmd+Shift+6 | Analyze the full workspace and answer architectural questions   |
| Interview Me                  | --          | Generate progressive technical interview questions              |
| Review Pull Request           | --          | Comprehensive PR review with branch diff analysis               |
| Generate Documentation        | --          | Full documentation suite (README, API, architecture, component) |

### Workspace and Context

| Command                        | Shortcut    | Description                                      |
| ------------------------------ | ----------- | ------------------------------------------------ |
| Index Workspace                | --          | Build vector embeddings for semantic code search |
| Init .codebuddyignore          | --          | Create a file exclusion list for indexing        |
| Open/Init/Reload Project Rules | Cmd+Shift+9 | Manage project-specific AI behavior rules        |
| Toggle Inline Completions      | --          | Enable or disable ghost text code completion     |
| Open in Smart Reader           | --          | Open any URL in the distraction-free reader      |
| Clear Workspace Context        | --          | Reset the workspace context cache                |

### Diff Review

| Command                      | Description                                         |
| ---------------------------- | --------------------------------------------------- |
| Apply Change                 | Accept an agent-proposed file modification          |
| Reject Change                | Decline an agent-proposed file modification         |
| Review Composer Session      | Review all changes in a multi-file composer session |
| Apply Composer Session       | Accept all changes in a composer session            |
| Reject Composer Session      | Decline all changes in a composer session           |
| Clear Inline Review Comments | Remove all inline review annotations                |

### Automations

| Command            | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| Daily Standup      | Trigger an automated standup report                           |
| Code Health Check  | Scan for TODOs, large files, and technical debt indicators    |
| Dependency Check   | Audit dependencies for wildcards and dangerous version ranges |
| Git Watchdog       | Check for stale uncommitted changes                           |
| End of Day Summary | Generate a summary of the day's work                          |

### Integrations

| Command                   | Description                                                        |
| ------------------------- | ------------------------------------------------------------------ |
| Create Branch from Jira   | Browse Jira tickets and create a Git branch from a selected ticket |
| Create Branch from GitLab | Browse GitLab issues and create a Git branch from a selected issue |

### Security and Administration

| Command                       | Description                                                  |
| ----------------------------- | ------------------------------------------------------------ |
| Run Doctor                    | Execute security audit and configuration health checks       |
| Doctor Auto-Fix               | Automatically remediate detected security issues             |
| Open External Security Config | Open the external security configuration file                |
| Run Security Diagnostics      | Run security policy diagnostics                              |
| Switch Permission Profile     | Switch between restricted, standard, and trusted profiles    |
| Switch Access Control Mode    | Switch between open, allow, and deny modes                   |
| Access Control Audit Log      | View the access control audit trail                          |
| Credential Proxy Audit Log    | View the credential proxy audit trail                        |
| Queue Status                  | View running and queued agent operations with cancel actions |
| Cancel All Queued             | Cancel all waiting items in the concurrency queue            |

### Documentation Generator

The documentation command supports five output types (Complete Suite, README Only, API Docs, Architecture Docs, Component Docs), three output formats (Markdown, HTML, Both), and three diagram formats (Mermaid, PlantUML, ASCII).

---

## Inline Code Completion

CodeBuddy provides a Fill-in-the-Middle (FIM) inline completion engine that operates independently from the chat:

- Ghost text suggestions appear as you type, using context from imports, surrounding code, and file structure.
- Can use a different AI provider and model from the main chat -- run a fast local model for completions while using a cloud model for agent tasks.
- Configurable debounce delay (default 300ms), max tokens, and trigger mode (automatic or manual).
- LRU caching (50 entries) prevents redundant API calls for repeated completions.
- Multi-line completion support.

---

## Diff Review System

Every file change the agent proposes goes through a review pipeline:

- Changes appear in the Pending Changes panel in the sidebar with a visual diff.
- Open any change in VS Code's native side-by-side diff editor.
- Apply or reject individual changes with toolbar buttons.
- Composer sessions group multi-file changes for batch review.
- Inline review comments annotate specific lines in the editor.
- Recent changes history tracks the last 50 modifications.
- Auto-apply mode is available for workflows that do not require manual approval (`codebuddy.autoApprove`).
- Real-time event notifications keep the UI synchronized via the Orchestrator.

---

## Model Context Protocol (MCP)

CodeBuddy has first-class support for the Model Context Protocol, the open standard for connecting AI agents to external tools and data sources.

- **Docker Gateway Mode** -- Run a single unified MCP catalog via `docker mcp gateway run`, exposing all configured tool servers through one endpoint.
- **Multi-Server Mode** -- Connect to multiple independent MCP servers simultaneously, each with its own transport (SSE or stdio).
- **Presets** -- Built-in preset for Playwright browser automation. Add custom presets for your own tool servers.
- **Tool Management** -- Enable or disable individual tools per server from the Settings panel.
- **Circuit Breaker** -- Fault tolerance with CLOSED/OPEN/HALF_OPEN states prevents cascading failures from unhealthy MCP servers.
- **Auto Shutdown** -- The Docker gateway shuts down automatically after 5 minutes of inactivity to conserve resources.
- **Retry Logic** -- Automatic retry with exponential backoff (3 attempts) for transient connection failures.
- **Agent Integration** -- All MCP tools are surfaced as LangChain-compatible tools, available to every agent and subagent automatically.

---

## Connectors and Integrations

CodeBuddy ships with 17 pre-configured connectors for external services. Each connector is an MCP server that can be enabled with a single click from Settings.

| Connector       | Type                                                             |
| --------------- | ---------------------------------------------------------------- |
| GitHub          | Source control, issues, pull requests                            |
| GitLab          | Issues, merge requests, branches (also direct CLI integration)   |
| Jira            | Ticket management, branch creation (also direct CLI integration) |
| Linear          | Issue tracking and project management                            |
| Slack           | Team communication and notifications                             |
| Google Drive    | Document access and search                                       |
| Gmail           | Email integration                                                |
| Google Calendar | Calendar event access                                            |
| Notion          | Knowledge base and documentation                                 |
| PostgreSQL      | Database queries and schema inspection                           |
| MySQL           | Database queries and schema inspection                           |
| MongoDB         | Document database operations                                     |
| Redis           | Cache and data store operations                                  |
| AWS             | Cloud infrastructure management                                  |
| Kubernetes      | Container orchestration                                          |
| Sentry          | Error tracking and monitoring                                    |
| n8n             | Workflow automation                                              |

Jira and GitLab also have direct CLI integrations: browse tickets/issues in a VS Code quick-pick menu, create branches from selected items, and open them in the browser.

---

## Skills System

Skills extend the agent's domain knowledge with structured capability definitions. CodeBuddy uses a three-tier discovery model:

### Bundled Skills

16 skills ship with the extension, each with a `SKILL.md` definition and optional install scripts:

| Skill         | Capability                                          |
| ------------- | --------------------------------------------------- |
| AWS           | Amazon Web Services infrastructure management       |
| Datadog       | Monitoring, alerting, and observability             |
| Elasticsearch | Search engine queries and index management          |
| Email         | Email composition and delivery                      |
| GitHub        | Repository operations, issues, and pull requests    |
| GitLab        | Merge requests, pipelines, and issue tracking       |
| Gmail         | Gmail API integration with secure CLI tool          |
| Jira          | Ticket creation, search, and sprint management      |
| Kubernetes    | Cluster operations, pod management, and deployments |
| Linear        | Issue tracking and project boards                   |
| MongoDB       | Document queries, aggregation pipelines             |
| MySQL         | SQL queries and schema inspection                   |
| PostgreSQL    | SQL queries and schema inspection                   |
| Redis         | Cache operations and data store commands            |
| Sentry        | Error tracking and issue resolution                 |
| Telegram      | Bot messaging and notifications                     |

### Workspace and Global Skills

- **Workspace skills**: Place `*SKILL.md` files in `.codebuddy/skills/` for project-specific capabilities.
- **Global skills**: Place files in `~/.codebuddy/skills/` for cross-project capabilities.
- Workspace skills take precedence when names collide.
- YAML frontmatter defines skill metadata (name, description, environment requirements).

### Skill Management

- Enable or disable skills individually from the Settings panel.
- Per-skill environment configuration (LOCAL, QA, PROD) with isolated credentials stored in SecretStorage.
- OS-aware installation with package manager fallback chains (brew, npm, pip, script).
- Active skills are injected into the agent's system prompt at runtime.

---

## Context Pipeline

CodeBuddy gathers context from multiple sources and assembles it into each prompt automatically:

1. **Active file** -- The file currently open in the editor is always included.
2. **@ mentions** -- Reference specific files in your message with `@filename` to include them explicitly.
3. **Hybrid search** -- Combines vector similarity, FTS4 keyword matching, temporal decay, and MMR diversity re-ranking (see [Hybrid Memory and Search](#hybrid-memory-and-search)).
4. **Web search** -- For questions requiring external knowledge, the agent searches the web via Tavily and incorporates relevant results.
5. **Codebase understanding** -- A persistent, git-aware analysis service maintains an architectural map of your project (frameworks, APIs, data models, dependencies) cached in SQLite and invalidated when the git state changes. Tree-sitter AST parsing supports 7 languages with endpoint detection for Express, NestJS, FastAPI, Flask, Django, Spring, Gin, Actix, and more.
6. **Project rules** -- Loaded from `.codebuddy/rules.md` and injected into every prompt.
7. **Agent memory** -- Persistent knowledge, rules, and experience from the core memory system.
8. **Skills** -- Active skill definitions are appended to the system prompt.
9. **Reader context** -- If an article is open in the Smart Reader, its content is available to the agent.
10. **Question classification** -- An NLP-based classifier (using stemming and fuzzy matching) categorizes each query to optimize which context sources are prioritized.

The `EnhancedPromptBuilderService` assembles the final prompt from these sources, respecting the configured token budget and deduplicating by file path.

### Context Window Compaction

When a conversation approaches the model's context window limit, the `ContextWindowCompactionService` applies a 4-tier progressive fallback:

1. **Tool strip** -- Remove large tool outputs from older messages.
2. **Multi-chunk summarization** -- Split history into chunks, summarize each with an LLM call, then merge.
3. **Partial compaction** -- Summarize only the oldest portion of history.
4. **Plain fallback** -- Aggressive truncation as a last resort.

Compaction triggers automatically at 90% context utilization (warning at 80%) and is also available manually via the `/compact` slash command.

---

## Hybrid Memory and Search

### Persistent Memory

The agent maintains memory across sessions using a file-backed storage system at `.codebuddy/memory.json`:

- **Three categories**: Knowledge (facts and information), Rule (behavioral guidelines), Experience (lessons learned from past interactions).
- **Two scopes**: User (global, persists across all workspaces) and Project (workspace-specific).
- **CRUD operations**: The agent can add, update, delete, and search memories during execution.
- **System prompt injection**: All stored memories are automatically included in the agent's context.

The agent also has a persistent task manager (`.codebuddy/tasks.json`) for tracking work items with priorities and statuses across sessions.

### Hybrid Search

The `HybridSearchService` combines multiple retrieval strategies for high-quality context retrieval:

- **Vector search**: Pre-normalized query vectors with cosine similarity over `Float32Array` BLOBs. Binary-search insertion maintains a top-K result set. Time-based yield (8ms budget) keeps the extension host responsive during large scans.
- **FTS4 keyword search**: SQLite FTS4 with unicode61 tokenizer. Auto-synced via INSERT/DELETE/UPDATE triggers. TF-IDF scoring via `matchinfo('pcx')` blob parsing.
- **Score fusion**: Configurable weighted linear combination of vector and keyword scores (default: 0.7 vector, 0.3 text). Weights are auto-normalized.
- **Temporal decay**: Optional exponential decay so recently indexed content ranks higher. Configurable half-life (1-365 days).
- **MMR diversity**: Optional Maximal Marginal Relevance re-ranking using Jaccard similarity to reduce redundant results.
- **5-tier fallback**: hybrid, FTS4-only, legacy vector, legacy keyword, common files.

### Configuration

| Setting                                             | Default | Description                                         |
| --------------------------------------------------- | ------- | --------------------------------------------------- |
| `codebuddy.hybridSearch.vectorWeight`               | 0.7     | Weight for semantic similarity (0-1)                |
| `codebuddy.hybridSearch.textWeight`                 | 0.3     | Weight for keyword matches (0-1)                    |
| `codebuddy.hybridSearch.topK`                       | 10      | Maximum results returned (1-50)                     |
| `codebuddy.hybridSearch.mmr.enabled`                | false   | Enable MMR diversity re-ranking                     |
| `codebuddy.hybridSearch.mmr.lambda`                 | 0.7     | MMR trade-off: 0 = max diversity, 1 = max relevance |
| `codebuddy.hybridSearch.temporalDecay.enabled`      | false   | Enable time-based score decay                       |
| `codebuddy.hybridSearch.temporalDecay.halfLifeDays` | 30      | Days until a result's score is halved (1-365)       |

---

## Project Rules

Define how CodeBuddy writes code for your project. Rules are automatically loaded and injected into every AI prompt.

- **File locations**: `.codebuddy/rules.md`, `.codebuddy/rules/index.md`, `.codebuddyrules`, or `CODEBUDDY.md`.
- **Directory rules**: Place multiple `.md` files in `.codebuddy/rules/` and they are merged together.
- **Token budget**: Configurable maximum (default 2000 tokens) with smart truncation if rules exceed the limit.
- **Settings-based rules**: Define additional rules and a custom system prompt directly in the VS Code settings UI.
- **Live reload**: File watchers detect changes and reload rules automatically.
- **Template scaffolding**: The `Init Rules` command creates a starter template.

---

## Security

CodeBuddy provides a multi-layered security architecture designed for individual developers and enterprise teams.

### Permission Profiles

The `PermissionScopeService` enforces three permission profiles, configurable per workspace via `.codebuddy/permissions.json`:

| Profile      | Tools     | Terminal                         | File Edits | Approval  |
| ------------ | --------- | -------------------------------- | ---------- | --------- |
| `restricted` | Read-only | All commands denied              | Denied     | N/A       |
| `standard`   | All tools | Dangerous commands denied        | Allowed    | Manual    |
| `trusted`    | All tools | Auto-approve (catastrophic deny) | Allowed    | Automatic |

A **catastrophic deny floor** blocks `rm -rf /`, `mkfs`, `dd of=/dev/`, and fork bombs across all profiles including `trusted`.

Tools can be further restricted via per-workspace blocklists and allowlists with O(1) Set lookups.

### Access Control

The `AccessControlService` supports three modes:

- **open**: No restrictions (default).
- **allow**: Only explicitly listed users can interact.
- **deny**: Block listed users.

Configuration is loaded from `.codebuddy/access.json` with file watching for live updates.

### Credential Proxy

The `CredentialProxyService` runs an HTTP proxy on `127.0.0.1` that injects API keys from the OS keychain into outbound LLM requests. SDK clients never see real credentials.

- 9 provider routes (Anthropic, OpenAI, Groq, Deepseek, Qwen, GLM, Grok, Tavily, Local).
- Session token authentication (`crypto.randomBytes(32)`) prevents other local processes from using the proxy.
- Auth header stripping on outbound requests.
- Per-provider token bucket rate limiting.
- 10 MB body size limit with backpressure.
- Slow-loris protection (30s idle timeout between chunks).
- Ring buffer audit log (1000 entries) viewable via the `Credential Proxy Audit Log` command.
- Path traversal protection on all proxy routes.

### External Security Configuration

The `ExternalSecurityConfigService` loads security policies from a JSON schema-validated file, enabling centralized security management across teams.

### Doctor Command

The `DoctorService` runs 6 independent security checks and reports findings by severity:

1. **API Key Audit** -- Detects plaintext API keys in VS Code settings; auto-fix migrates to SecretStorage.
2. **Input Validator** -- Verifies the prompt injection defense pipeline is active.
3. **Terminal Restrictions** -- Reports command deny patterns and custom overrides.
4. **Directory Permissions** -- Scans `.codebuddy/` POSIX permissions on macOS/Linux.
5. **MCP Config** -- Detects inline secrets in MCP server environment variables.
6. **Security Config** -- Validates external security policy and offers scaffolding.

Findings are actionable: `Doctor Auto-Fix` remediates issues automatically with per-fix error isolation.

### Input Validation

The `InputValidator` sanitizes all user input before it reaches the agent, with pattern-based prompt injection detection. The `LlmSafetyService` redacts injection patterns from LLM-bound content.

---

## Coworker Automations

CodeBuddy runs scheduled background tasks that surface actionable information without requiring manual invocation:

| Automation         | Schedule          | What It Does                                                                            |
| ------------------ | ----------------- | --------------------------------------------------------------------------------------- |
| Daily Standup      | 8:00 AM           | Progress report from recent activity, dirty files, active errors, and connected tickets |
| Code Health Check  | 9:00 AM           | Scans for TODOs, FIXMEs, large files, change hotspots, and stale index indicators       |
| Dependency Check   | 11:00 AM          | Audits `package.json` for wildcard versions and dangerous version ranges                |
| Git Watchdog       | Every 2 hours     | Alerts if uncommitted changes have been sitting for more than 2 hours                   |
| Tech News          | 10 AM, 2 PM, 6 PM | Aggregates articles from 35+ engineering blogs                                          |
| News Cleanup       | Midnight          | Removes old unsaved news articles                                                       |
| End of Day Summary | End of day        | Generates a summary of the day's work                                                   |

All automations can be triggered manually from the Command Palette or disabled individually from Settings. Configurable parameters include protected branch patterns, large file thresholds, hotspot change minimums, and max TODO items.

---

## Cost Tracking

The `CostTrackingService` monitors LLM API spend in real time:

- Pricing database for 25+ models across all supported providers.
- Per-conversation cost accumulation.
- `CostDisplay` component in the webview shows a live cost counter.
- Budget-aware alternative suggestions and pricing hints in the model dropdown.
- Cost data streamed as `cost_update` events from the agent loop.

---

## Smart Reader

CodeBuddy includes a built-in distraction-free article reader:

- Extracts article content using Mozilla Readability with DOMPurify sanitization.
- Renders in a dedicated VS Code webview panel.
- Caches articles for 24 hours (up to 100 articles) to avoid redundant fetches.
- Maintains a browsing history accessible from the toolbar.
- Three modes: Smart Reader (built-in, recommended), Simple Browser, or System Browser.
- Article content is available to the agent as context, so you can ask questions about what you are reading.
- SSRF validation prevents requests to private IP ranges and localhost.

---

## Observability

CodeBuddy ships with built-in OpenTelemetry instrumentation:

- **Tracing**: OpenTelemetry SDK with in-memory span exporter for local debugging. OpenLLMetry (Traceloop) captures LangGraph and LangChain trace data. Every agent stream is wrapped in a span with model metadata, event counts, and tool invocation counts.
- **External Export**: Configurable OTLP HTTP endpoint for exporting traces to LangFuse, LangSmith, Jaeger, or any OpenTelemetry-compatible backend.
- **Metrics**: OTLP HTTP export for metrics collection.
- **Structured Logging**: Multi-level logging (DEBUG, INFO, WARN, ERROR) to console and file. Per-service logger instances with configurable minimum levels.
- **Webview Panel**: A dedicated Observability panel in the sidebar displays traces, logs, and system performance data in real time.

---

## Internationalization

The interface is available in 7 languages. The language can be changed from Settings > General without restarting.

| Language             | Code  |
| -------------------- | ----- |
| English              | en    |
| Spanish              | es    |
| French               | fr    |
| German               | de    |
| Chinese (Simplified) | zh-cn |
| Japanese             | ja    |
| Yoruba               | yo    |

Both the webview UI (via i18next) and the extension backend (via @vscode/l10n) are fully localized. Right-click context menu commands follow VS Code's display language setting. NLS bundles are maintained in `l10n/` and `package.nls.*.json` files.

---

## Settings Reference

Access the full settings panel via the gear icon in the sidebar. Settings are organized into sections:

| Section             | What You Configure                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Account             | Profile, subscription, sign out                                                            |
| General             | Theme (9 themes), font (10 font families), font size, language, streaming, nickname        |
| Agents              | Operating mode, auto-approve, file/terminal permissions, safety limits, verbose logging    |
| Models              | AI provider selection, API keys, model overrides, failover chain                           |
| MCP                 | MCP server connections, tool management, Docker gateway, disabled tools                    |
| Connectors          | One-click activation of 17 external service integrations                                   |
| Skills              | Enable/disable skills, environment configuration, credential management                    |
| Conversation        | Streaming toggle, compact mode, chat history management                                    |
| Context             | Workspace indexing, context window size, hidden files, max file size, hybrid search tuning |
| Rules and Subagents | Custom rules, system prompt override, subagent configuration                               |
| CoWorker            | Enable/disable individual automated tasks, thresholds, protected branches                  |
| Browser             | Link opening preferences (Reader, Simple, System)                                          |
| Privacy             | Telemetry, clear history, clear cache, clear all data                                      |
| Beta                | Experimental features toggle                                                               |
| About               | Version, repository links, changelog, license                                              |

### Key Settings

| Setting                                    | Type    | Default  | Description                                                |
| ------------------------------------------ | ------- | -------- | ---------------------------------------------------------- |
| `generativeAi.option`                      | enum    | Groq     | Active AI provider                                         |
| `codebuddy.agent.maxConcurrentStreams`     | number  | 3        | Maximum concurrent agent operations (1-10)                 |
| `codebuddy.agent.maxEventCount`            | number  | 2000     | Maximum stream events per session (500-10,000)             |
| `codebuddy.agent.maxToolInvocations`       | number  | 400      | Maximum tool calls per session (50-2,000)                  |
| `codebuddy.agent.maxDurationMinutes`       | number  | 10       | Maximum session runtime in minutes (1-60)                  |
| `codebuddy.failover.enabled`               | boolean | true     | Automatic provider failover on errors                      |
| `codebuddy.failover.providers`             | array   | []       | Ordered fallback provider list (auto-detect if empty)      |
| `codebuddy.credentialProxy.enabled`        | boolean | false    | Route LLM calls through the local credential proxy         |
| `codebuddy.permissionScope.defaultProfile` | enum    | standard | Default permission profile (restricted, standard, trusted) |
| `codebuddy.accessControl.defaultMode`      | enum    | open     | Access control mode (open, allow, deny)                    |
| `codebuddy.completion.enabled`             | boolean | true     | Inline code completion                                     |
| `codebuddy.completion.provider`            | enum    | Local    | Completion AI provider (can differ from chat provider)     |
| `codebuddy.requireDiffApproval`            | boolean | false    | Require manual approval for all file changes               |
| `codebuddy.autoApprove`                    | boolean | false    | Auto-approve agent actions without prompting               |
| `codebuddy.rules.enabled`                  | boolean | true     | Load and inject project rules into prompts                 |
| `codebuddy.contextWindow`                  | enum    | 16k      | Context window size (4k, 8k, 16k, 32k, 128k)               |

---

## Installation

Install from either registry:

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)
- [Open VSX Registry](https://open-vsx.org/extension/fiatinnovations/ola-code-buddy)

Or search for "CodeBuddy" in the VS Code extension manager.

**Requirements**: VS Code 1.78 or later.

---

## Configuration

### Cloud Providers

1. Open the CodeBuddy sidebar and click the gear icon to open Settings.
2. Navigate to the Models section.
3. Select your preferred AI provider.
4. Enter your API key.
5. Optionally configure a failover chain under the Failover settings.

### Local Models (Ollama)

```json
{
  "generativeAi.option": "Local",
  "local.baseUrl": "http://localhost:11434/v1",
  "local.model": "qwen2.5-coder"
}
```

### Local Models (Docker)

```bash
docker compose -f docker-compose.yml up -d
docker exec -it ollama ollama pull qwen2.5-coder
```

Docker Model Runner is also supported for running models through Docker Desktop's built-in model runtime at `localhost:12434`.

### Credential Proxy

To route all LLM API calls through the local credential proxy (recommended for shared environments):

1. Store API keys via Settings > Models (they are saved to OS keychain via SecretStorage).
2. Enable the proxy: set `codebuddy.credentialProxy.enabled` to `true`.
3. The proxy starts automatically on extension activation. SDK clients receive a dummy `"proxy-managed"` key and a `127.0.0.1` base URL.

### MCP Servers

Configure MCP servers in VS Code settings under `codebuddy.mcp.servers`. Example:

```json
{
  "codebuddy.mcp.servers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {}
    }
  }
}
```

Or enable the Docker MCP Gateway for a unified catalog of tools managed through Docker Desktop.

### Permission Profiles

Create `.codebuddy/permissions.json` in your workspace root:

```json
{
  "profile": "standard",
  "toolBlocklist": ["terminal"],
  "commandDenyPatterns": ["rm -rf", "DROP TABLE"]
}
```

See `schemas/permissions-v1.json` for the full JSON Schema.

---

## Data Storage

CodeBuddy stores all data locally in a `.codebuddy` directory at your workspace root:

| Path               | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| `chat-history/`    | Conversation logs in JSON format                  |
| `memory.json`      | Persistent agent knowledge, rules, and experience |
| `tasks.json`       | Task tracking data                                |
| `analysis.db`      | SQLite database for codebase analysis snapshots   |
| `vector.db`        | SQLite vector store for embeddings and FTS4 index |
| `rules.md`         | Project-specific behavior rules                   |
| `rules/`           | Directory for multiple rule files                 |
| `skills/`          | Custom workspace skill definitions                |
| `permissions.json` | Workspace permission profile configuration        |
| `access.json`      | Access control user lists                         |

This directory is automatically added to `.gitignore`. API keys are stored separately in the OS keychain via VS Code SecretStorage.

---

## Troubleshooting

**Local model not connecting**

- Verify Ollama is running (`ollama serve` or check Docker container status).
- Confirm the port: 11434 for Ollama, 12434 for Docker Model Runner.
- Check that `local.baseUrl` matches your setup.

**Agent not responding**

- Click the Stop button in the chat interface.
- Check the concurrency queue status (Command Palette > `Queue Status`) -- the request may be queued behind other operations.
- Clear chat history from Settings > Privacy.
- Check the CodeBuddy output channel: View > Output > CodeBuddy.

**API key errors**

- Verify the key is entered correctly in Settings > Models.
- Confirm the selected model matches the provider for your key.
- Run `Doctor` to check for plaintext keys in settings that should be migrated to SecretStorage.
- If using the credential proxy, verify it is running (check the output channel).

**Provider failover not working**

- Ensure `codebuddy.failover.enabled` is `true`.
- Configure at least one alternative provider with a valid API key.
- Check provider health in the status bar indicator.

**MCP server not connecting**

- Verify the server command is installed and accessible.
- Check the MCP server logs in the output channel.
- For Docker Gateway, ensure Docker Desktop is running.
- Check the MCP circuit breaker state -- a server in OPEN state needs its cooldown to expire.

**Security issues detected**

- Run `Doctor` from the Command Palette to scan for configuration issues.
- Use `Doctor Auto-Fix` to automatically remediate plaintext keys and permission issues.
- Review the security diagnostics output for detailed findings.

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on setting up the development environment, running tests, and submitting pull requests.

---

## License

MIT License -- see [LICENSE](LICENSE) for details.

---

[Repository](https://github.com/olasunkanmi-SE/codebuddy)

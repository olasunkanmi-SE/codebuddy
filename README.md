# CodeBuddy

### Autonomous AI Software Engineer for Visual Studio Code

CodeBuddy is a multi-agent AI software engineer that operates inside VS Code. It does not autocomplete lines of code. It plans, writes, debugs, tests, documents, and deploys entire features autonomously -- reading your codebase, running terminal commands, editing files, searching the web, and correcting its own mistakes until the task is done.

It supports 10 AI providers (cloud and local), 20+ built-in tools, 17 pre-configured external connectors, and a Model Context Protocol gateway for unlimited extensibility. It ships with scheduled automations, a built-in tech news reader, persistent agent memory, and full internationalization in 7 languages.

<p align="center">
  <img src="images/codebuddy.png" alt="CodeBuddy" width="720" />
</p>

---

## Table of Contents

- [Architecture](#architecture)
- [Agent System](#agent-system)
- [Operating Modes](#operating-modes)
- [AI Providers](#ai-providers)
- [Built-in Tools](#built-in-tools)
- [Commands](#commands)
- [Inline Code Completion](#inline-code-completion)
- [Diff Review System](#diff-review-system)
- [Model Context Protocol (MCP)](#model-context-protocol-mcp)
- [Connectors and Integrations](#connectors-and-integrations)
- [Context Pipeline](#context-pipeline)
- [Project Rules and Skills](#project-rules-and-skills)
- [Persistent Memory](#persistent-memory)
- [Coworker Automations](#coworker-automations)
- [Smart Reader](#smart-reader)
- [Observability](#observability)
- [Internationalization](#internationalization)
- [Settings](#settings)
- [Installation](#installation)
- [Configuration](#configuration)
- [Data Storage](#data-storage)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Architecture

CodeBuddy is built on an event-driven, layered architecture designed for extensibility, provider-agnosticism, and real-time streaming.

### System Layers

```
+---------------------------------------------------------+
|                    Presentation Layer                    |
|        React + Vite Webview  |  VS Code UI Commands     |
+---------------------------------------------------------+
          |  postMessage (bidirectional)  |
+---------------------------------------------------------+
|                  Webview Provider Layer                  |
|     BaseWebViewProvider + per-provider subclasses        |
|    (Anthropic, Gemini, Groq, OpenAI, DeepSeek, ...)     |
+---------------------------------------------------------+
          |  publish / subscribe  |
+---------------------------------------------------------+
|                   Orchestrator (Event Bus)               |
|      Singleton mediator  |  50+ named event channels    |
|     Decouples agents, UI, and services completely        |
+---------------------------------------------------------+
     |              |              |              |
+----------+  +-----------+  +-----------+  +-----------+
|  Agent   |  |  Service  |  |  Infra    |  |  Command  |
|  Layer   |  |  Layer    |  |  Layer    |  |  Layer    |
+----------+  +-----------+  +-----------+  +-----------+
| DeepAgent|  | Context   |  | Logger    |  | Comment   |
| LangGraph|  | Retriever |  | OTel/     |  | Review    |
| Subagents|  | Chat Hist.|  | Traceloop |  | Refactor  |
| Tools    |  | Diff Rev. |  | SQLite    |  | Optimize  |
| Backends |  | Scheduler |  | SecretStore| | Explain  |
| HITL     |  | Indexing  |  | HTTP      |  | PR Review |
+----------+  +-----------+  +-----------+  +-----------+
```

### Orchestrator

The Orchestrator is a singleton event bus at the center of the system. Every subsystem communicates exclusively through publish/subscribe events. The Orchestrator never calls services directly -- it emits typed events (`onQuery`, `onStreamChunk`, `onToolStart`, `onPendingChange`, `onThinking`, etc.) and listeners react independently. This fully decouples the agent layer, webview layer, and service layer from one another.

### Agent Execution Pipeline

```
User message (webview)
  --> BaseWebViewProvider receives via onDidReceiveMessage
    --> InputValidator sanitizes input
    --> MessageHandler routes to CodeBuddyAgentService
      --> DeveloperAgent invokes createDeepAgent()
        --> LangGraph graph executes (reason -> act -> observe loop)
          --> Tools execute (file edit, terminal, search, MCP, etc.)
          --> Stream events emitted per token / per tool call
        --> Events flow back through Orchestrator
      --> WebViewProvider forwards to webview via postMessage
User sees streamed response with real-time tool activity indicators
```

### Webview Communication

The extension host and the React webview communicate over a bidirectional `postMessage` protocol. The webview sends structured commands (`user-input`, `cancel-request`, `user-consent`, `theme-change-event`, `language-change-event`). The extension responds with typed events (`onStreamStart`, `onStreamChunk`, `onToolStart`, `onToolEnd`, `onThinking`, `diff-change-event`, `bootstrap`, `chat-history`). There is no shared state -- all coordination happens through messages.

### Persistence Strategy

| Layer                  | Mechanism                         | Purpose                                                 |
| ---------------------- | --------------------------------- | ------------------------------------------------------- |
| In-memory cache        | TTL-based Map (Memory singleton)  | Session data, model references, transient state         |
| File storage           | `.codebuddy/` workspace directory | Agent state snapshots, memories, tasks, rules           |
| SQLite                 | sql.js (WASM)                     | Codebase analysis snapshots, persistent structured data |
| LangGraph checkpointer | MemorySaver                       | Multi-turn conversation threads                         |
| VS Code SecretStorage  | Encrypted OS keychain             | API keys and credentials                                |
| Vector store           | SimpleVectorStore (JSON-backed)   | Workspace embeddings for semantic search                |

### Design Patterns

The codebase uses Singleton (Orchestrator, Logger, services), Observer/Pub-Sub (the entire event bus), Mediator (Orchestrator decouples all layers), Factory (AgentFactory, LLMFactory, ToolProvider), Strategy (dynamic LLM provider switching, CompositeBackend routing), Template Method (BaseWebViewProvider with per-provider subclasses), Adapter (LangChain tool wrappers, MCP tool adapter), Composite (CompositeBackend routes by path prefix), Guard/Mutex (AgentRunningGuardService, SimpleMutex), and Worker (ChatHistoryWorker, AstIndexingService on background threads).

---

## Agent System

### Multi-Agent Architecture

CodeBuddy uses a multi-agent architecture built on the DeepAgents framework and LangGraph. A primary Developer Agent coordinates the work, with seven specialized subagents that each receive role-specific filtered tools:

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

### Human-in-the-Loop

Destructive operations (such as file deletion) trigger an interrupt that pauses execution and asks for explicit approval. The user can approve, edit, or reject the proposed action before the agent continues.

---

## Operating Modes

**Agent Mode** -- Full autonomous execution. The agent has access to all tools: file creation and editing, terminal commands, web search, codebase analysis, MCP integrations, and debugger access. File changes go through the diff review system for approval.

**Ask Mode** -- Direct question-and-answer interaction. The agent answers questions, explains code, and provides suggestions without modifying files or running commands. Context is gathered from your workspace automatically.

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

Inline code completion can use a separate provider and model from the chat, allowing you to run a fast local model for completions while using a cloud model for agent tasks.

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

---

## Commands

All commands are available from the Command Palette, the right-click context menu, or their keyboard shortcuts.

| Command                        | Shortcut    | Description                                                                    |
| ------------------------------ | ----------- | ------------------------------------------------------------------------------ |
| Comment Code                   | Cmd+Shift+J | Generate clear, contextual comments for selected code                          |
| Review Code                    | Cmd+Shift+R | Comprehensive code review covering quality, security, and best practices       |
| Refactor Code                  | Cmd+Shift+; | Restructure code for readability and maintainability                           |
| Optimize Code                  | Cmd+Shift+0 | Identify and apply performance optimizations                                   |
| Explain Code                   | Cmd+Shift+1 | Get a clear explanation of what selected code does and why                     |
| Generate Commit Message        | Cmd+Shift+2 | Produce a commit message from staged changes                                   |
| Inline Chat                    | Cmd+Shift+8 | Quick inline code discussion and editing                                       |
| Generate Architecture Diagram  | Cmd+Shift+7 | Produce Mermaid diagrams visualizing code structure                            |
| Codebase Analysis              | Cmd+Shift+6 | Analyze the full workspace and answer architectural questions                  |
| Interview Me                   | --          | Generate progressive technical interview questions from your code              |
| Review Pull Request            | --          | Comprehensive PR review with branch diff analysis                              |
| Generate Documentation         | --          | Full documentation suite (README, API docs, architecture docs, component docs) |
| Index Workspace                | --          | Build vector embeddings for semantic code search                               |
| Open/Init/Reload Project Rules | Cmd+Shift+9 | Manage project-specific AI behavior rules                                      |
| Toggle Inline Completions      | --          | Enable or disable ghost text code completion                                   |
| Open in Smart Reader           | --          | Open any URL in the distraction-free reader                                    |
| Apply/Reject Change            | --          | Accept or decline agent-proposed file modifications                            |
| Daily Standup                  | --          | Trigger an automated standup report                                            |
| Code Health Check              | --          | Scan for TODOs, large files, and technical debt indicators                     |
| Dependency Check               | --          | Audit dependencies for wildcards and dangerous version ranges                  |
| Git Watchdog                   | --          | Check for stale uncommitted changes                                            |
| Create Branch from Jira        | --          | Browse Jira tickets and create a Git branch from a selected ticket             |
| Create Branch from GitLab      | --          | Browse GitLab issues and create a Git branch from a selected issue             |

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
- Recent changes history tracks the last 50 modifications.
- Auto-apply mode is available for workflows that do not require manual approval.
- Real-time event notifications keep the UI synchronized.

---

## Model Context Protocol (MCP)

CodeBuddy has first-class support for the Model Context Protocol, the open standard for connecting AI agents to external tools and data sources.

- **Docker Gateway Mode** -- Run a single unified MCP catalog via `docker mcp gateway run`, exposing all configured tool servers through one endpoint.
- **Multi-Server Mode** -- Connect to multiple independent MCP servers simultaneously, each with its own transport (SSE or stdio).
- **Presets** -- Built-in preset for Playwright browser automation. Add custom presets for your own tool servers.
- **Tool Management** -- Enable or disable individual tools per server from the Settings panel.
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

## Context Pipeline

CodeBuddy gathers context from multiple sources and assembles it into each prompt automatically:

1. **Active file** -- The file currently open in the editor is always included.
2. **@ mentions** -- Reference specific files in your message with `@filename` to include them explicitly.
3. **Semantic search** -- The EmbeddingService generates vector embeddings of your codebase. The ContextRetriever performs similarity search against the vector store and falls back to keyword search if embedding is unavailable.
4. **Web search** -- For questions requiring external knowledge, the agent searches the web via Tavily and incorporates relevant results.
5. **Codebase understanding** -- A persistent, git-aware analysis service maintains an architectural map of your project (frameworks, APIs, data models, dependencies) cached in SQLite and invalidated when the git state changes.
6. **Project rules** -- Loaded from `.codebuddy/rules.md` and injected into every prompt.
7. **Agent memory** -- Persistent knowledge, rules, and experience from the core memory system.
8. **Skills** -- Custom skill definitions from `.codebuddy/skills/` are appended to the system prompt.
9. **Reader context** -- If an article is open in the Smart Reader, its content is available to the agent.
10. **Question classification** -- An NLP-based classifier (using stemming and fuzzy matching) categorizes each query to optimize which context sources are prioritized.

The EnhancedPromptBuilderService assembles the final prompt from these sources, respecting the configured token budget and deduplicating by file path.

---

## Project Rules and Skills

### Project Rules

Define how CodeBuddy writes code for your project. Rules are automatically loaded and injected into every AI prompt.

- **File locations**: `.codebuddy/rules.md`, `.codebuddy/rules/index.md`, `.codebuddyrules`, or `CODEBUDDY.md`
- **Directory rules**: Place multiple `.md` files in `.codebuddy/rules/` and they are merged together.
- **Token budget**: Configurable maximum (default 2000 tokens) with smart truncation if rules exceed the limit.
- **Settings-based rules**: Define additional rules and a custom system prompt directly in the VS Code settings UI.
- **Live reload**: File watchers detect changes and reload rules automatically.
- **Template scaffolding**: The `Init Rules` command creates a starter template.

### Skills

Extend the agent's capabilities with custom skills:

- Place any `*SKILL.md` file in the `.codebuddy/skills/` directory.
- Each skill file uses YAML frontmatter to define a name and description.
- Skills are automatically discovered (including subdirectories) and appended to the agent's system prompt.
- The agent can then invoke the skill's described behavior when relevant.

---

## Persistent Memory

The agent maintains memory across sessions using a file-backed storage system at `.codebuddy/memory.json`:

- **Three categories**: Knowledge (facts and information), Rule (behavioral guidelines), Experience (lessons learned from past interactions).
- **Two scopes**: User (global, persists across all workspaces) and Project (workspace-specific).
- **CRUD operations**: The agent can add, update, delete, and search memories during execution.
- **System prompt injection**: All stored memories are automatically included in the agent's context.

The agent also has a persistent task manager (`.codebuddy/tasks.json`) for tracking work items with priorities and statuses across sessions.

---

## Coworker Automations

CodeBuddy runs scheduled background tasks that surface actionable information without requiring manual invocation:

| Automation        | Schedule          | What It Does                                                                                                                                    |
| ----------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Daily Standup     | 8:00 AM           | Generates a progress report from recent activity, dirty files, active errors, and connected Jira/GitLab items                                   |
| Code Health Check | 9:00 AM           | Scans for TODOs, FIXMEs, large files, and stale index indicators                                                                                |
| Dependency Check  | 11:00 AM          | Audits `package.json` for wildcard versions, security-flagged packages, and dangerous version ranges                                            |
| Git Watchdog      | Every 2 hours     | Alerts if uncommitted changes have been sitting for more than 2 hours                                                                           |
| Tech News         | 10 AM, 2 PM, 6 PM | Aggregates articles from 35+ engineering blogs (OpenAI, Google, Cloudflare, Netflix, Anthropic, DeepMind, Meta AI, ByteByteGo, InfoQ, and more) |
| News Cleanup      | Midnight          | Removes old unsaved news articles                                                                                                               |

All automations can be triggered manually from the Command Palette or disabled individually from Settings.

---

## Smart Reader

CodeBuddy includes a built-in distraction-free article reader:

- Extracts article content using Mozilla Readability with DOMPurify sanitization.
- Renders in a dedicated VS Code webview panel.
- Caches articles for 24 hours (up to 100 articles) to avoid redundant fetches.
- Maintains a browsing history accessible from the toolbar.
- Three modes: Smart Reader (built-in, recommended), Simple Browser, or System Browser.
- Article content is available to the agent as context, so you can ask questions about what you are reading.

---

## Observability

CodeBuddy ships with built-in OpenTelemetry instrumentation:

- **Tracing**: OpenTelemetry SDK with in-memory span exporter for local debugging. OpenLLMetry (Traceloop) captures LangGraph and LangChain trace data.
- **Metrics**: OTLP HTTP export for metrics collection.
- **Structured Logging**: Multi-level logging (DEBUG, INFO, WARN, ERROR) to console and file.
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

Both the webview UI (via i18next) and the extension backend (via @vscode/l10n) are fully localized. Right-click context menu commands follow VS Code's display language setting.

---

## Settings

Access the full settings panel via the gear icon in the sidebar. Settings are organized into sections:

| Section             | What You Configure                                                                  |
| ------------------- | ----------------------------------------------------------------------------------- |
| Account             | Profile, subscription, sign out                                                     |
| General             | Theme (9 themes), font (10 font families), font size, language, streaming, nickname |
| Agents              | Operating mode, auto-approve actions, file/terminal permissions, verbose logging    |
| Models              | AI provider selection, API keys, active model display, local model management       |
| MCP                 | MCP server connections, tool management, Docker gateway                             |
| Connectors          | One-click activation of 17 external service integrations                            |
| Conversation        | Streaming toggle, compact mode, chat history management                             |
| Context             | Workspace indexing, context window size, hidden files, max file size                |
| Rules and Subagents | Custom rules, system prompt override, subagent configuration                        |
| CoWorker            | Enable/disable individual automated tasks                                           |
| Browser             | Link opening preferences (Reader, Simple, System)                                   |
| Privacy             | Telemetry, clear history, clear cache, clear all data                               |
| Beta                | Experimental features toggle                                                        |
| About               | Version, repository links, changelog, license                                       |

---

## Installation

Install from either registry:

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)
- [Open VSX Registry](https://open-vsx.org/extension/fiatinnovations/ola-code-buddy)

Or search for "CodeBuddy" in the VS Code extension manager.

---

## Configuration

### Cloud Providers

1. Open the CodeBuddy sidebar and click the gear icon to open Settings.
2. Navigate to the Models section.
3. Select your preferred AI provider.
4. Enter your API key.

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

### MCP Servers

Configure MCP servers in VS Code settings under `codebuddy.mcpServers`. Example:

```json
{
  "codebuddy.mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {}
    }
  }
}
```

Or enable the Docker MCP Gateway for a unified catalog of tools managed through Docker Desktop.

---

## Data Storage

CodeBuddy stores all data locally in a `.codebuddy` directory at your workspace root:

- `chat-history/` -- Conversation logs in JSON format
- `memory.json` -- Persistent agent knowledge, rules, and experience
- `tasks.json` -- Task tracking data
- `analysis.db` -- SQLite database for codebase analysis snapshots
- `rules.md` -- Project-specific behavior rules
- `skills/` -- Custom skill definitions
- Logs and session state

This directory is automatically added to `.gitignore`.

---

## Troubleshooting

**Local model not connecting**

- Verify Ollama is running (`ollama serve` or check Docker container status).
- Confirm the port: 11434 for Ollama, 12434 for Docker Model Runner.
- Check that `local.baseUrl` matches your setup.

**Agent not responding**

- Click the Stop button in the chat interface.
- Clear chat history from Settings > Privacy.
- Check the CodeBuddy output channel: View > Output > CodeBuddy.

**API key errors**

- Verify the key is entered correctly in Settings > Models.
- Confirm the selected model matches the provider for your key.
- Check network connectivity for cloud providers.

**MCP server not connecting**

- Verify the server command is installed and accessible.
- Check the MCP server logs in the output channel.
- For Docker Gateway, ensure Docker Desktop is running.

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on setting up the development environment, running tests, and submitting pull requests.

## License

MIT License -- see [LICENSE](LICENSE) for details.

---

[Repository](https://github.com/olasunkanmi-SE/codebuddy)

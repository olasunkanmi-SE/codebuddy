# CodeBuddy — Comprehensive Codebase Audit Report

**Date**: February 21, 2026  
**Scope**: Full application audit — architecture, code quality, security, testing, UI/UX, and competitive feature analysis  
**Codebase**: 262 TypeScript files, ~59,000 lines across extension + React webview

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What's Been Done Well](#2-whats-been-done-well)
3. [What Needs Improvement](#3-what-needs-improvement)
4. [Security Audit](#4-security-audit)
5. [Testing & Quality Assurance](#5-testing--quality-assurance)
6. [UI/UX Assessment](#6-uiux-assessment)
7. [Feature Gap Analysis vs Codex & Competitors](#7-feature-gap-analysis-vs-codex--competitors)
8. [Prioritized Recommendations](#8-prioritized-recommendations)

---

## 1. Executive Summary

CodeBuddy is an ambitious VS Code extension that positions itself as an autonomous AI software engineer. The project demonstrates strong architectural vision — a multi-agent system with LangGraph, 18 tools, MCP integration, inline completions, AST analysis, and a rich React-based chat UI. The breadth of features is impressive for what appears to be a solo/small-team project.

However, the codebase suffers from **scaling pains typical of fast-moving projects**: god classes (base.ts at 3,568 lines), minimal test coverage, security gaps in API key storage, and significant dead/incomplete code. The foundation is solid, but production-readiness requires focused investment in testing, security hardening, and architectural cleanup.

### Scorecard

| Area                  | Score  | Notes                                                                                    |
| --------------------- | :----: | ---------------------------------------------------------------------------------------- |
| Architecture & Design | **B**  | Strong patterns (singleton, factory, pub/sub) but god classes and duplicate services     |
| Code Quality          | **C+** | Heavy `any` usage, dead code, typos, but consistent logging and error handling           |
| Security              | **C**  | Input validation exists but isn't wired in; API keys in plaintext settings               |
| Testing               | **D**  | 18 test files but most are empty or minimal; no coverage reporting                       |
| UI/UX                 | **B+** | Excellent streaming UX and settings panel, but god component and no state management     |
| Feature Completeness  | **A-** | Impressive breadth — MCP, 9 providers, inline completion, AST, tools, rules, automations |
| Documentation         | **B**  | Strong README, good inline roadmaps, but no API docs or architecture diagrams            |
| Build & DevOps        | **B-** | Good esbuild config, GitHub Actions CI, but no cross-platform testing or coverage gates  |

---

## 2. What's Been Done Well

### 2.1 Multi-Agent Architecture (Industry-Leading Pattern)

The agent system follows the **ReAct (Reasoning + Acting) pattern** via LangGraph with proper safety boundaries:

- **Safety limits**: Max 1,000 stream events, 200 tool invocations, 5-minute timeout, per-file edit loop detection — prevents runaway agents
- **Human-in-the-Loop (HITL)**: Consent-based interrupts with configurable auto-approve — matches industry best practice for autonomous agents
- **OpenTelemetry tracing**: Spans with attributes across the agent pipeline — production-grade observability
- **Diff review pipeline**: Agent file writes go through a review/auto-apply workflow with visual diff — this is how Cursor and Windsurf handle it too

**Reference**: `src/agents/services/codebuddy-agent.service.ts`

### 2.2 Tool System Design

18 tools with a clean factory pattern and role-based filtering for subagent specialization:

| Tool Category     | Tools                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------- |
| File Operations   | `FileTool`, `ListFilesTool`, `EditFileTool`                                           |
| Search            | `SearchTool`, `RipgrepSearchTool`, `SymbolSearchTool`, `TravilySearchTool`, `WebTool` |
| Code Intelligence | `DiagnosticsTool`, `GitTool`, `ThinkTool`                                             |
| Execution         | `TerminalTool`, `DeepTerminalTool`                                                    |
| Productivity      | `TodoTool`, `MemoryTool`, `WebPreviewTool`                                            |

Path traversal protection in the filesystem backend (`resolveAgentPath()` validates paths stay within workspace root) and mutex-protected writes prevent race conditions.

**Reference**: `src/tools/tools.ts`, `src/agents/backends/filesystem.ts`

### 2.3 MCP Integration (Model Context Protocol)

One of the more complete MCP implementations in the VS Code extension ecosystem:

- **Dual transport**: stdio (subprocess) and SSE (remote/network)
- **Docker Gateway mode**: Unified tool catalog via `docker mcp gateway run`
- **Tool cache with TTL** (5 minutes) to avoid repeated `listTools` calls
- **Idle timeout** (5 minutes) — auto-disconnects to save resources
- **Exponential backoff reconnection** (max 3 attempts)
- **Tool deduplication** across servers

**Reference**: `src/MCP/client.ts`, `src/MCP/service.ts`

### 2.4 Streaming Chat UX

The `useStreamingChat` hook is the standout piece of frontend engineering:

- Clean separation of streaming state management from rendering
- Proper `useCallback` memoization of all 15+ handlers
- Timeline state machine for agent activity tracking (thinking → planning → tool execution → responding)
- De-duplication of consecutive working updates
- `AgentTimeline` component provides rich real-time activity visualization

**Reference**: `webviewUi/src/hooks/useStreamingChat.ts`

### 2.5 Settings System

The settings panel is the best-organized subsystem in the UI:

- 14 dedicated section components with barrel exports
- Proper TypeScript interfaces (`SettingsValues`, `SettingsOptions`, `SettingsHandlers`)
- Dedicated context (`SettingsContext.tsx`) with clean provider pattern
- Reusable UI kit components (Toggle, Button, Card, Input, etc.)

**Reference**: `webviewUi/src/components/settings/`

### 2.6 Multi-Provider LLM Support

9 providers supported (Anthropic, OpenAI, Gemini, Groq, Deepseek, Qwen, GLM, XGrok, Local/Ollama) with:

- Abstract base class `BaseLLM<T>` with consistent interface
- `CompletionProviderFactory` for inline completions
- Separate `LLMFactory` for LangChain chat models
- Config validation (`validateLlmConfig()`) in constructors
- Provider-specific inline completion models

**Reference**: `src/llms/base.ts`, `src/llms/completion-factory.ts`

### 2.7 Project Rules System

Comparable to Cursor's `.cursorrules` / `.cursorignore` pattern:

- File-based rules (`.codebuddy/rules.md`) + settings-based rules + custom system prompt
- Auto-reload on file change via watchers
- Token budget enforcement with truncation
- Merge strategy across all three rule sources
- Template scaffolding command

**Reference**: `src/services/project-rules.service.ts`

### 2.8 Additional Strengths

- **Inline completions**: LRU cache, debounce, FIM prompt support, cancellation token checking
- **DiffReviewService**: VS Code TextDocumentContentProvider for native diff view
- **AST analysis**: Tree-sitter integration with WASM grammar support
- **Git integration**: Commit message generation, PR review, branch creation from Jira/GitLab
- **Scheduler**: Database-backed task scheduling for automations (standup, code health, dependency check)
- **Smart Reader**: Mozilla Readability-powered article reader with chat integration
- **News system**: RSS feed aggregation with tech news delivery

---

## 3. What Needs Improvement

### 3.1 CRITICAL: God Classes

| File                                             |     Lines | Issue                                                                            |
| ------------------------------------------------ | --------: | -------------------------------------------------------------------------------- |
| `src/webview-providers/base.ts`                  | **3,568** | Handles ALL webview message routing — 50+ `case` handlers, 25+ injected services |
| `webviewUi/src/components/webview.tsx`           | **1,466** | 40+ `useState` calls, all features in one component                              |
| `src/agents/services/codebuddy-agent.service.ts` | **1,222** | Acceptable for its scope but could benefit from extraction                       |

**`base.ts`** is the single biggest maintenance risk. Every new webview feature adds another `case` to its message handler. It instantiates 15+ services in its constructor.

**`webview.tsx`** holds ALL application state in one component — any state change re-renders everything. It has two competing message listeners (`useStreamingChat` + `legacyMessageHandler`) with overlapping concerns.

**How to fix**:

- Extract `base.ts` message handlers into domain-specific handler classes (rules, browser, settings, agent, files)
- Decompose `webview.tsx` into feature modules with either React Context or a lightweight state manager (Zustand)
- Unify the dual message listeners into a single message router

### 3.2 CRITICAL: Two Competing Agent Services

`src/agents/agentService.ts` (older, less safe) and `src/agents/services/codebuddy-agent.service.ts` (newer, production-grade) coexist. The older one has a `runx()` method with fewer safety limits and is still imported/referenced.

**How to fix**: Migrate all callers to `codebuddy-agent.service.ts` and remove the legacy `agentService.ts`.

### 3.3 HIGH: Heavy `any` Usage

Throughout the agent system, LLM layer, and message handling, `any` types are pervasive:

```typescript
// Example from agentService.ts
agent: any;
store: any;
```

This defeats TypeScript's type safety and makes refactoring dangerous — the compiler can't catch breaking changes.

**How to fix**: Define proper interfaces for agent state, store, message payloads, and tool results. Start with the most-changed files.

### 3.4 HIGH: Dead Code & Incomplete Features

| File/Area                                    | Status                    |
| -------------------------------------------- | ------------------------- |
| `src/agents/langgraph/graphs/agent.ts`       | Entire file commented out |
| `src/agents/langgraph/nodes/planner.ts`      | Empty                     |
| `src/agents/langgraph/nodes/responder.ts`    | Empty                     |
| `src/agents/langgraph/nodes/fallback.ts`     | Empty                     |
| `src/memory/sliding.ts`                      | Empty                     |
| `src/memory/summarize.ts`                    | Empty                     |
| `src/memory/token.ts`                        | Empty                     |
| `src/memory/unconstrained.ts`                | Empty                     |
| `webviewUi/src/components/errorFallBack.tsx` | Stub, never used          |
| `patterns/dev.db`                            | Empty 0-byte file         |

These files suggest planned features that were never implemented. They add confusion and false confidence about capabilities.

**How to fix**: Either implement them or remove them. Don't ship empty files.

### 3.5 HIGH: `spawnSync` Blocking Extension Host

In `src/agents/developer/agent.ts` line ~104, `spawnSync(rgPath, ...)` runs synchronously during agent creation. This blocks the VS Code extension host thread, causing UI freezes.

**How to fix**: Replace with `spawn()` (async) or `execFile()` with a Promise wrapper.

### 3.6 MEDIUM: Duplicate Switch Statements in Command Handler

`src/commands/handler.ts` has the same 7-way switch statement duplicated for every operation (sending feedback, storing history, generating responses). Each branch does the same thing with a different provider constant.

**How to fix**: Use `WebViewProviderManager.getCurrentProvider()` instead of switching on model names.

### 3.7 MEDIUM: Module-Level Mutable State

```typescript
// src/webview-providers/base.ts
let _view: vscode.WebviewView | undefined; // Module-level mutable
```

This is shared across all imports and can lead to stale references when providers are switched.

**How to fix**: Move view reference to instance property only.

### 3.8 MEDIUM: LLM Factory Hardcoded to Anthropic

`src/agents/langgraph/llm/factory.ts` creates only `ChatAnthropic` despite the extension supporting 9 providers. The actual multi-provider routing happens elsewhere (`DeveloperAgent.getAIConfigFromWebProvider()`), making the factory misleading.

**How to fix**: Make the factory respect the selected provider configuration.

### 3.9 LOW: File Naming Typos

- `src/ast/analysis/relevance.scrorer.ts` → should be `relevance.scorer.ts`
- `src/ast/analysis/summry.generator.ts` → should be `summary.generator.ts`

### 3.10 LOW: GroqLLM Returns Dummy Embeddings

```typescript
// src/llms/groq/groq.ts
async generateEmbeddings() { return [1, 2]; }  // Wrong — misleading
```

Should throw an `UnsupportedOperationError` or return an empty array with a warning (like Anthropic does).

### 3.11 LOW: Inconsistent Message Format

Backend sends `{ type, payload }` or `{ type, message }` or `{ command, data }`. Frontend handles all via:

```tsx
const messageType = command || type;
```

No shared type contract between backend and frontend for message shapes.

**How to fix**: Create a shared `MessageProtocol` type definition used by both sides.

---

## 4. Security Audit

### 4.1 HIGH: API Keys Stored in Plaintext

All 9 provider API keys are stored in VS Code's `settings.json` via `vscode.workspace.getConfiguration()`. The `SecretStorageService` only stores username and theme — not API keys.

VS Code settings are stored as plaintext JSON on disk. Anyone with filesystem access can read them.

**Industry standard**: Use `vscode.SecretStorage` API (which uses the OS keychain — Keychain on macOS, Credential Manager on Windows, libsecret on Linux).

**How to fix**: Migrate API key storage from `getConfiguration()` to `SecretStorageService` using `context.secrets.store()` / `context.secrets.get()`.

### 4.2 HIGH: InputValidator Not Wired Into Main Flow

`InputValidator` has comprehensive prompt injection detection (9 suspicious patterns, length limits, control character stripping) — but it's **not called** in the main message flow. `MessageHandler → CodeBuddyAgentService.streamResponse()` passes user messages directly without validation.

**How to fix**: Call `InputValidator.validateInput()` at the entry point of `streamResponse()`.

### 4.3 MEDIUM: `html: true` in markdown-it

`src/utils/utils.ts` initializes `markdownit({ html: true })`. While `DOMPurify` is a dependency and IS used in `BotMessage`, the markdown-it configuration allows raw HTML pass-through before sanitization occurs. If any rendering path bypasses DOMPurify, it's an XSS vector.

**How to fix**: Set `html: false` in markdown-it configuration (the safer default), or ensure DOMPurify wraps every use of `markdown-it.render()`.

### 4.4 MEDIUM: Unrestricted Terminal Commands

`DeepTerminalTool` spawns a shell and writes user-provided commands directly to stdin. While `Terminal` class (in utils) has a command allowlist (`git`, `npm`, `ls`, `echo`, `docker`), the deep terminal service bypasses this.

**How to fix**: Either route all terminal execution through the allowlist, or add explicit dangerous-command blocking (`rm -rf /`, `curl | bash`, etc.) plus require HITL approval for high-risk commands.

### 4.5 LOW: No CSP Nonce in Webview HTML

The webview HTML generation should use CSP nonces for inline scripts. If it's using `'unsafe-inline'`, that weakens the Content Security Policy.

### 4.6 Summary

| Finding                         | Severity | OWASP Category                  |
| ------------------------------- | -------- | ------------------------------- |
| API keys in plaintext settings  | HIGH     | A02 - Cryptographic Failures    |
| InputValidator not in main flow | HIGH     | A03 - Injection                 |
| `html: true` in markdown-it     | MEDIUM   | A03 - Injection (XSS)           |
| Unrestricted deep terminal      | MEDIUM   | A01 - Broken Access Control     |
| No CSP nonce verification       | LOW      | A05 - Security Misconfiguration |

---

## 5. Testing & Quality Assurance

### 5.1 Current State

| Metric                       | Value                                           |
| ---------------------------- | ----------------------------------------------- |
| Test framework               | Mocha + vscode-test                             |
| Test files                   | 18 files in `src/test/suite/`                   |
| Test files with actual tests | ~3-5 (most are empty or stubs)                  |
| Test coverage reporting      | None                                            |
| CI test execution            | GitHub Actions runs tests but no coverage gates |
| E2E tests                    | None                                            |
| Webview tests                | None                                            |

### 5.2 What's Missing (by priority)

1. **Agent system tests** — The core `CodeBuddyAgentService`, `ToolProvider`, filesystem backend, and HITL flow have zero tests. This is the highest-risk area.
2. **Security tests** — `InputValidator` test file is empty. No tests for path traversal protection, terminal command filtering.
3. **MCP integration tests** — No tests for client reconnection, tool caching, Docker gateway mode.
4. **Webview component tests** — No React Testing Library or jest setup for UI components.
5. **Cross-platform CI** — Only tests on one OS despite macOS/Windows/Linux differences in path handling, terminal behavior, Docker access.

### 5.3 What Codex/Cursor/Cline Do

- **Codex**: Runs tests in a sandboxed cloud environment before applying changes; uses test results as feedback for iterating
- **Cursor**: Has extensive E2E tests for prompt handling, diff application, and streaming
- **Cline**: Uses vitest with comprehensive mocking for VS Code API; tests tool execution, permission flow, diff parsing

### 5.4 Recommendations

1. Add **vitest** for unit tests (faster than mocha, native TypeScript, better DX)
2. Set up **coverage reporting** with c8/istanbul; add a CI gate (e.g., `>60%` for new files)
3. Prioritize tests for: agent safety limits, HITL consent flow, tool execution, InputValidator, API key handling
4. Add **React Testing Library** for webview component tests
5. Add **Windows + Linux** CI matrix

---

## 6. UI/UX Assessment

### 6.1 Strengths

- **AgentTimeline**: Real-time visualization of agent activity (thinking, planning, tool execution) — on par with Cursor's agent panel
- **Streaming UX**: Smooth token-by-token rendering with proper loading states
- **CommandFeedbackLoader**: Shows action name + description during command execution — professional touch
- **ErrorBoundary**: Non-destructive — overlays error toast without destroying the UI
- **MessageRenderer**: Intelligent content detection routes different response types to specialized renderers (search results, code analysis, error cards)
- **Settings panel**: Well-organized with 14 section components, toggles, modals

### 6.2 Weaknesses

| Issue                                                                                  | Impact                                                    | Priority |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------- |
| God component (`webview.tsx`) — 40+ useState, 1,466 lines                              | Every state change re-renders everything                  | HIGH     |
| No centralized state management                                                        | Props drilling, no state subscription, massive re-renders | HIGH     |
| Hardcoded pixel positions for sidebar buttons (`top: 12px`, `top: 56px`, `top: 100px`) | Brittle layout, poor responsive behavior                  | MEDIUM   |
| No keyboard navigation for browsing history dropdown                                   | Accessibility violation                                   | MEDIUM   |
| No `role="alert"` on error banners                                                     | Screen readers won't announce errors                      | MEDIUM   |
| No i18n/localization                                                                   | English-only; limits global adoption                      | LOW      |
| `document.execCommand("copy")` used as fallback                                        | Deprecated API                                            | LOW      |

### 6.3 Comparison with Competitors

| Feature              | CodeBuddy |  Cursor   |   Cline   |    Codex    |
| -------------------- | :-------: | :-------: | :-------: | :---------: |
| Streaming chat       |    Yes    |    Yes    |    Yes    |     Yes     |
| Agent timeline       |    Yes    |    Yes    |    No     | N/A (async) |
| Inline diff review   |    Yes    |    Yes    |    Yes    |     N/A     |
| Settings panel       | Excellent |   Good    |  Minimal  |     N/A     |
| Keyboard shortcuts   |   Many    |   Many    |   Some    |     N/A     |
| Theme customization  | 9 themes  | Inherited | Inherited |     N/A     |
| Accessibility (WCAG) |  Partial  |   Good    |  Partial  |     N/A     |
| Session management   |    Yes    |    No     |    No     |     Yes     |
| Code highlighting    |    Yes    |    Yes    |    Yes    |     Yes     |

---

## 7. Feature Gap Analysis vs Codex & Competitors

### 7.1 Features CodeBuddy HAS That Competitors Don't

| Feature                                              | CodeBuddy |    Codex    |       Cursor       | Cline |
| ---------------------------------------------------- | :-------: | :---------: | :----------------: | :---: |
| Smart Reader (article parsing)                       |  **Yes**  |     No      |         No         |  No   |
| Tech news feed                                       |  **Yes**  |     No      |         No         |  No   |
| Interview prep mode                                  |  **Yes**  |     No      |         No         |  No   |
| Jira/GitLab branch creation                          |  **Yes**  |     No      |         No         |  No   |
| Automated daily standup                              |  **Yes**  |     No      |         No         |  No   |
| Scheduled code health checks                         |  **Yes**  |     No      |         No         |  No   |
| 9 LLM providers including Chinese models (Qwen, GLM) |  **Yes**  | No (OpenAI) |      Limited       | Some  |
| Project rules system                                 |  **Yes**  |     No      | Yes (.cursorrules) |  No   |
| Browsing history in extension                        |  **Yes**  |     No      |         No         |  No   |
| Mermaid diagram generation                           |  **Yes**  |     No      |         No         |  No   |

### 7.2 Features Codex Has That CodeBuddy Lacks

| Feature                               |                                  Codex                                  |                                      CodeBuddy                                       | Difficulty to Add |
| ------------------------------------- | :---------------------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------------: |
| **Cloud sandboxed execution**         | Yes — runs code in isolated cloud VMs with network/filesystem isolation |                          No — runs locally on user machine                           |     Very Hard     |
| **Parallel task execution**           |        Yes — multiple agents work on separate tasks concurrently        |                               No — single-thread agent                               |       Hard        |
| **Git-native workflow**               |    Yes — creates branches, commits, opens PRs autonomously on GitHub    | Partial — generates commit messages, creates branches, but no autonomous PR creation |      Medium       |
| **Test-driven iteration**             |          Yes — runs tests after changes, iterates until green           |                              No — no test feedback loop                              |      Medium       |
| **Async background tasks**            |         Yes — submit tasks and come back later (not real-time)          |                     No — real-time only, requires active session                     |       Hard        |
| **Image/screenshot input**            |               Yes — accepts images in prompts for UI work               |                                 No — text-only input                                 |      Medium       |
| **Web browsing for research**         |     Yes — agent can fetch and read web pages during task execution      |      Partial — has Smart Reader but not agent-accessible during task execution       |      Medium       |
| **Workspace-level context**           |         Yes — full codebase awareness via sandboxed environment         |            Partial — AST indexing + vector search but limited in practice            |      Medium       |
| **Fine-grained permissions per task** |        Yes — network, filesystem, command restrictions per task         |                            Partial — global settings only                            |      Medium       |

### 7.3 Features Cursor Has That CodeBuddy Lacks

| Feature                           |                           Cursor                            |                         CodeBuddy                         | Difficulty to Add |
| --------------------------------- | :---------------------------------------------------------: | :-------------------------------------------------------: | :---------------: |
| **Composer (multi-file editing)** |      Yes — edit across multiple files in one operation      |                No — single file operations                |       Hard        |
| **Tab completion with context**   | Yes — uses surrounding code + recent edits for completions  |   Partial — has inline completions but less contextual    |      Medium       |
| **Codebase indexing at scale**    |          Yes — full repo indexing with embeddings           | Partial — has vector DB but indexing is slow (sequential) |      Medium       |
| **@-mention for files/symbols**   |      Yes — `@file`, `@folder`, `@symbol` in chat input      |                            No                             |      Medium       |
| **Apply/reject per-hunk**         |              Yes — granular diff hunk approval              |               No — all-or-nothing file diff               |      Medium       |
| **Privacy mode**                  |       Yes — prevent code from being stored/trained on       |                            No                             |       Easy        |
| **Custom API endpoint**           | Yes — bring-your-own-API for any OpenAI-compatible provider |     Partial — Local provider supports custom base URL     |       Easy        |
| **Multi-cursor agent edits**      |     Yes — agent can make concurrent edits across files      |                            No                             |       Hard        |
| **Chat-embedded file references** |             Yes — inline file previews in chat              |                            No                             |      Medium       |
| **`.cursorignore`**               |             Yes — exclude files from AI context             |                       No equivalent                       |       Easy        |

### 7.4 Features Cline Has That CodeBuddy Lacks

| Feature                            |                      Cline                      |                 CodeBuddy                 | Difficulty to Add |
| ---------------------------------- | :---------------------------------------------: | :---------------------------------------: | :---------------: |
| **Approval workflow per action**   | Yes — granular approve/reject for each tool use |  Partial — HITL exists but less granular  |       Easy        |
| **Cost tracking per conversation** |        Yes — shows token and dollar cost        |                    No                     |       Easy        |
| **Checkpoint/revert**              | Yes — can revert to any conversation checkpoint |                    No                     |      Medium       |
| **Browser tool (Puppeteer)**       | Yes — can interact with web pages during tasks  | No — has reader but no browser automation |       Hard        |
| **Diff parsing feedback**          |      Yes — validates diffs before applying      |                  Partial                  |       Easy        |

---

## 8. Prioritized Recommendations

### Tier 1: Critical (Do First)

| #   | Recommendation                                                                                                      | Effort   | Impact            |
| --- | ------------------------------------------------------------------------------------------------------------------- | -------- | ----------------- |
| 1   | **Migrate API keys to SecretStorage** — Move from `settings.json` to `vscode.SecretStorage` (OS keychain)           | 2-3 days | Security: HIGH    |
| 2   | **Wire InputValidator into main message flow** — Call `validateInput()` in `CodeBuddyAgentService.streamResponse()` | 1 hour   | Security: HIGH    |
| 3   | **Set `html: false` in markdown-it** or ensure DOMPurify wraps all render paths                                     | 1 hour   | Security: MEDIUM  |
| 4   | **Remove/retire legacy `agentService.ts`** — Migrate all callers to `codebuddy-agent.service.ts`                    | 1-2 days | Stability: HIGH   |
| 5   | **Replace `spawnSync` with async spawn** in `agent.ts`                                                              | 2 hours  | Performance: HIGH |

### Tier 2: High Priority (Next Sprint)

| #   | Recommendation                                                                                 | Effort   | Impact                |
| --- | ---------------------------------------------------------------------------------------------- | -------- | --------------------- |
| 6   | **Decompose `base.ts`** — Extract message handlers into domain handler classes                 | 3-5 days | Maintainability: HIGH |
| 7   | **Decompose `webview.tsx`** — Split into feature modules, add Zustand or Context for state     | 3-5 days | Maintainability: HIGH |
| 8   | **Add core agent tests** — Safety limits, HITL flow, tool execution, filesystem path traversal | 3-5 days | Quality: HIGH         |
| 9   | **Add cost tracking** — Token count + estimated cost per conversation (Cline-style)            | 2-3 days | UX: HIGH              |
| 10  | **Add `@`-mentions for files/symbols in chat** — `@file`, `@folder`, `@symbol` like Cursor     | 3-5 days | UX: HIGH              |

### Tier 3: Medium Priority (Next Month)

| #   | Recommendation                                                                                               | Effort    | Impact              |
| --- | ------------------------------------------------------------------------------------------------------------ | --------- | ------------------- |
| 11  | **Add test-driven iteration** — Run tests after agent changes, feed results back for iteration (Codex-style) | 1-2 weeks | Feature: HIGH       |
| 12  | **Add checkpoint/revert** — Allow users to revert to any conversation state (Cline-style)                    | 1 week    | UX: MEDIUM          |
| 13  | **Support image input** — Accept screenshots/images in prompts for UI work (Codex-style)                     | 1 week    | Feature: MEDIUM     |
| 14  | **Add per-hunk diff approval** — Granular accept/reject for individual changes within a file                 | 1 week    | UX: MEDIUM          |
| 15  | **Remove dead code** — Delete all empty/commented-out files (8+ files identified)                            | 1 day     | Cleanliness: MEDIUM |
| 16  | **Fix file naming typos** — `relevance.scrorer.ts` → `scorer`, `summry.generator.ts` → `summary`             | 30 min    | Quality: LOW        |
| 17  | **Add `.codebuddyignore`** — Exclude files/folders from AI context (like `.cursorignore`)                    | 1-2 days  | Feature: MEDIUM     |
| 18  | **Add privacy mode toggle** — Prevent code from being sent to cloud APIs                                     | 1 day     | Trust: MEDIUM       |

### Tier 4: Future Enhancements

| #   | Recommendation                                                                                             | Effort    | Impact             |
| --- | ---------------------------------------------------------------------------------------------------------- | --------- | ------------------ |
| 19  | **Implement memory strategies** — Sliding window, summarization, token-aware (4 empty files already exist) | 1-2 weeks | Quality: MEDIUM    |
| 20  | **Multi-file composer** — Edit across multiple files in one operation (Cursor Composer-style)              | 2-3 weeks | Feature: HIGH      |
| 21  | **Add i18n/localization** — Support multiple languages for global adoption                                 | 1-2 weeks | Adoption: MEDIUM   |
| 22  | **Add accessibility (WCAG 2.1 AA)** — ARIA labels, keyboard nav, focus management throughout               | 1-2 weeks | Compliance: MEDIUM |
| 23  | **Implement browser automation tool** — Puppeteer/Playwright for agent web interaction                     | 2-3 weeks | Feature: MEDIUM    |
| 24  | **Parallel agent execution** — Multiple agents working on separate subtasks concurrently                   | 3-4 weeks | Feature: HIGH      |
| 25  | **Cross-platform CI matrix** — Add Windows + Linux to GitHub Actions                                       | 1 day     | Quality: MEDIUM    |

---

## Appendix A: File Complexity Hotspots

| File                                             | Lines | Recommended Max | Action                       |
| ------------------------------------------------ | ----: | :-------------: | ---------------------------- |
| `src/webview-providers/base.ts`                  | 3,568 |       500       | Split into domain handlers   |
| `webviewUi/src/components/webview.tsx`           | 1,466 |       300       | Split into feature modules   |
| `src/agents/services/codebuddy-agent.service.ts` | 1,222 |       500       | Extract stream processor     |
| `src/services/news-reader.service.ts`            |   634 |       400       | Extract HTML template        |
| `src/extension.ts`                               |  850+ |       300       | Extract command registration |

## Appendix B: Dependency Concerns

| Dependency                                  | Issue                                       |
| ------------------------------------------- | ------------------------------------------- |
| `@typescript-eslint/*@^5.59.8`              | Very outdated — current is v8.x             |
| `eslint@^8.41.0`                            | Outdated — current is v9.x with flat config |
| `@types/node@20.2.5`                        | Pinned to exact version — should use range  |
| `sinon` in `dependencies`                   | Should be in `devDependencies`              |
| `prettier` in `dependencies`                | Should be in `devDependencies`              |
| `@types/fast-levenshtein` in `dependencies` | Should be in `devDependencies`              |
| `@types/node-fetch` in `dependencies`       | Should be in `devDependencies`              |
| `@types/sql.js` in both deps and devDeps    | Duplicate — remove from `dependencies`      |

## Appendix C: Good Patterns Worth Preserving

1. **Singleton + Dispose**: Services implement `vscode.Disposable` and clean up in `dispose()` — do this everywhere
2. **Logger per service**: Each service creates a named logger instance — excellent traceability
3. **Factory pattern for tools**: `ToolProvider` with `IToolFactory` interface — extensible without modifying existing code
4. **Orchestrator event bus**: Clean pub/sub with typed events — good decoupling
5. **DiffReviewService as TextDocumentContentProvider**: Leverages VS Code's native diff view — elegant integration
6. **Safety limits as constants**: Max events, max tool invocations, timeout — easy to adjust and reason about
7. **File watchers for rules**: Automatic reload on file system changes — responsive UX
8. **ErrorBoundary in React**: Non-destructive error handling that preserves the UI tree

---

_End of audit report_

# CodeBuddy: Autonomous AI Software Engineer

> **Not just a copilot—a fully autonomous software engineer that lives in your IDE.**

CodeBuddy transforms VS Code into an agentic development environment. Unlike traditional coding assistants that only provide autocomplete or snippets, CodeBuddy is an **autonomous agent** capable of planning, executing, debugging, and deploying complex software tasks. It understands your entire codebase, runs terminal commands, manages files, and fixes its own errors.

## Overview

CodeBuddy transforms developer productivity by acting as a proactive teammate. It goes beyond simple code suggestions to provide deep architectural insights, autonomous refactoring, comprehensive testing strategies, and self-healing workflows. The extension supports both cloud-based and local AI models, enabling developers to choose the right balance of capability, speed, and privacy.

## Key Features

### Multi-Agent Architecture

CodeBuddy employs specialized agents that collaborate on complex tasks:

- **Project Manager**: Orchestrates workflow and delegates tasks to specialized agents.
- **Architect**: Designs scalable systems, selects patterns, and creates architecture decision records.
- **Reviewer**: Enforces code quality, security standards, and best practices.
- **Tester**: Writes and validates unit and integration tests.
- **Debugger**: Investigates root causes and proposes fixes.
- **Code Analyzer**: Scans codebase for anti-patterns and complexity issues.
- **Documentation Writer**: Generates comprehensive documentation and API references.
- **File Organizer**: Refactors directory structures and manages project organization.

### Autonomous Self-Healing

When a task fails (e.g., a build error or failed test), CodeBuddy doesn't give up. It follows a rigorous loop:
1. Reads the error output from the terminal.
2. Analyzes the root cause.
3. Applies a fix.
4. Retries the verification.
5. Repeats until success.

### Dual Operating Modes

**Chat Mode**: Traditional question-and-answer interaction for quick queries, code explanations, and getting code snippets without file modifications.

**Agent Mode**: Autonomous execution with full tool access including file operations, terminal commands, web search, and codebase analysis. Changes can be reviewed before application.

### AI Provider Support

CodeBuddy supports nine AI providers, giving you flexibility in model selection:

| Provider  | Default Model           | Capabilities                      |
| --------- | ----------------------- | --------------------------------- |
| Gemini    | gemini-2.5-pro          | Long context, general coding      |
| Anthropic | claude-sonnet-4-5       | Complex architecture, refactoring |
| OpenAI    | gpt-4o                  | Reasoning, planning               |
| DeepSeek  | deepseek-chat           | Cost-effective coding             |
| Qwen      | qwen-max                | Strong open-weight performance    |
| Groq      | llama-3.1-70b-versatile | Ultra-fast inference              |
| GLM       | glm-4                   | Chinese and English support       |
| XGrok     | grok                    | Alternative reasoning             |
| Local     | qwen2.5-coder           | Privacy-first, offline capable    |

### Local Model Integration

Run completely offline with local models via Ollama or LM Studio:

- Full Agent mode support with local models.
- Zero API costs for unlimited usage.
- Code never leaves your machine.
- Supports Qwen 2.5 Coder, Llama 3.2, DeepSeek Coder, and other OpenAI-compatible models.

### Terminal Integration

Agents can execute shell commands directly:

- Run builds, tests, git operations, and any shell command.
- Real-time output streaming in dedicated terminal channel.
- Safety guards with user confirmation before execution.
- Feedback loop for self-correction based on command output.

### Diff Review System

File changes made by the agent are tracked and reviewable:

- Side-by-side diff viewer in VS Code.
- Apply or reject individual changes.
- Recent changes history panel.
- Optional approval mode requiring explicit confirmation before file writes.

### Model Context Protocol (MCP) Integration

Extend CodeBuddy's capabilities through the open MCP standard:

- Connect external tools and data sources.
- Add custom MCP servers for specialized functionality.
- Unified protocol for AI-tool integration.
- Supported integrations include PostgreSQL, AWS, Kubernetes, Linear, and more.

### Project Rules

Customize agent behavior with project-specific rules:

- Define coding conventions and guidelines in `.codebuddy/rules.md`.
- Create custom rules via the Settings UI.
- Toggle rules on/off without deletion.
- Rules are appended to the agent's system prompt.

### Deep Context Understanding

Intelligent context handling ensures relevant responses:

- **Semantic Search**: Uses vector embeddings to find relevant code chunks.
- **AST Analysis**: Understands function definitions and module interactions.
- **Token Budget Awareness**: Optimizes context usage based on model limits.
- **Priority System**: Prioritizes @mentioned files, active files, and auto-gathered context.

## Installation

Install from your preferred registry:

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)
- [Open VSX Registry](https://open-vsx.org/extension/fiatinnovations/ola-code-buddy)

Alternatively, search for "CodeBuddy" in the VS Code extension manager.

## Configuration

### Cloud Providers

1. Open VS Code Settings (File > Preferences > Settings).
2. Search for "CodeBuddy".
3. Select your preferred AI provider from the dropdown.
4. Enter your API key in the appropriate field.

### Local Models

Configure for Ollama or LM Studio:

```json
{
  "generativeAi.option": "Local",
  "local.baseUrl": "http://localhost:11434/v1",
  "local.model": "qwen2.5-coder"
}
```

For Docker-based Ollama:

```bash
docker compose -f docker-compose.yml up -d
docker exec -it ollama ollama pull qwen2.5-coder
```

## Settings Panel

Access comprehensive settings via the gear icon in the sidebar:

- **Account**: Profile and account information.
- **General**: Theme, language, font settings, nickname, streaming preferences.
- **Agents**: Auto-approve actions, file/terminal permissions, verbose logging.
- **MCP**: Model Context Protocol server management.
- **Conversation**: Chat display preferences and history management.
- **Models**: AI model selection and configuration.
- **Context**: Workspace indexing, context window size, file inclusion settings.
- **Rules and Subagents**: Custom rules and specialized agent configuration.
- **Privacy**: Data privacy settings and clear data options.
- **Beta**: Experimental features.
- **About**: Version information and links.

## Data Storage

CodeBuddy stores data locally in a `.codebuddy` folder at your workspace root:

- Chat history in JSON format.
- Codebase analysis database (SQLite).
- Project rules and configuration.
- Logs and session data.

This folder is automatically added to `.gitignore` to prevent committing sensitive data.

## Troubleshooting

**Connection Issues with Local Models**
- Verify Ollama or LM Studio is running.
- Check the port configuration (default: 11434 for Ollama, 1234 for LM Studio).
- Confirm the `local.baseUrl` setting matches your server.

**Agent Not Responding**
- Use the Stop button in the chat interface.
- Clear chat history via Settings > Privacy.
- Check the CodeBuddy output channel (View > Output > CodeBuddy).

**API Key Errors**
- Verify your API key is correctly entered in settings.
- Ensure the selected model matches your API key provider.
- Check for network connectivity for cloud providers.

## Contributing

We are building the future of software engineering. Contributions are welcome. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Repository**: [github.com/olasunkanmi-SE/codebuddy](https://github.com/olasunkanmi-SE/codebuddy)

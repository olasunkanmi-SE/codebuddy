# CodeBuddy

An AI-powered coding assistant for Visual Studio Code featuring agentic architecture, multi-model support, local model integration, and intelligent codebase understanding.

[![Version](https://img.shields.io/visual-studio-marketplace/v/fiatinnovations.ola-code-buddy)](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/fiatinnovations.ola-code-buddy)](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/fiatinnovations.ola-code-buddy)](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)

---

## Overview

CodeBuddy is a Visual Studio Code extension that integrates advanced AI capabilities directly into your development workflow. It provides intelligent code assistance through an agentic architecture that can autonomously plan, execute, and verify multi-step tasks while maintaining context awareness across your entire codebase.

The extension supports nine AI providers including cloud-based models (Gemini, Anthropic Claude, OpenAI, Groq, DeepSeek, Qwen, GLM) and local models via Ollama, giving developers flexibility in choosing the right model for their privacy and performance requirements.

---

## Key Features

### Agentic Architecture

CodeBuddy employs a multi-agent system built on DeepAgents and LangGraph:

- **Developer Agent**: Primary orchestrating agent with tool access and decision-making capabilities
- **Specialized Sub-Agents**: Code Analyzer, Documentation Writer, Debugger, and File Organizer
- **Tool Integration**: Web search, file operations, and structured reasoning tools
- **Human-in-the-Loop**: Configurable approval workflows for file modifications

### Dual Operating Modes

- **Agent Mode**: Autonomous task execution with tool usage and multi-step planning
- **Ask Mode**: Direct question-answering with intelligent context gathering

### Smart Context Selection

- Token budget-aware context retrieval based on model limits (4K for local, 20K-50K for cloud models)
- Automatic active file inclusion in conversation context
- File mentions via `@filename` syntax with fuzzy search for explicit context selection
- Relevance scoring for code snippet prioritization

### Project Rules

Persistent configuration via `.codebuddy/rules.md` that travels with your repository:

- Define coding conventions, architectural guidelines, and project-specific instructions
- Rules are automatically injected into all AI prompts
- Merge file-based rules with settings-based custom prompts
- Token budget management with configurable limits
- Commands: Open Project Rules (Cmd+Shift+9), Initialize Project Rules, Reload Project Rules

### Local Model Support

Full support for locally-hosted models through Ollama:

- Privacy-first: Code never leaves your machine
- Offline capability
- Pre-configured support for Qwen 2.5 Coder, Llama 3.2, DeepSeek Coder, CodeLlama
- Docker Compose integration for containerized deployment
- Settings UI for model management (pull, delete, configure)

### Code Intelligence

- **Review**: Security analysis, best practice evaluation, performance assessment
- **Refactoring**: Context-aware code restructuring suggestions
- **Optimization**: Performance improvement recommendations
- **Documentation**: Automated comment and documentation generation
- **Explanation**: Technical breakdowns of complex code segments

### Pull Request Review

- Branch comparison with multi-provider fallback
- Comprehensive change analysis
- Security and performance evaluation
- Git CLI integration for accurate diffs

### Documentation Generation

- README file generation
- API endpoint documentation
- Architecture diagram creation (Mermaid)
- Component and module documentation

### Mermaid Diagram Support

- Automatic rendering within chat interface
- Syntax auto-correction for common LLM output errors
- Dark theme styling
- Collapsible source code view

---

## Supported AI Models

| Provider  | Models                                     | Characteristics                |
| --------- | ------------------------------------------ | ------------------------------ |
| Gemini    | gemini-2.5-pro, gemini-1.5-flash           | General purpose, embeddings    |
| Anthropic | claude-sonnet-4-5, claude-3-opus           | Complex reasoning, code review |
| OpenAI    | gpt-4o, gpt-4-turbo                        | Robust general purpose         |
| Groq      | llama-3.1-70b-versatile, llama-3.3-70b     | Fast inference                 |
| DeepSeek  | deepseek-chat (V3), deepseek-reasoner (R1) | Cost-effective, strong coding  |
| Qwen      | qwen-max, qwen3-coder-plus                 | Multilingual, code-focused     |
| GLM       | glm-4, glm-4-plus                          | Chinese language support       |
| Local     | qwen2.5-coder, llama3.2, deepseek-coder    | Privacy, offline capability    |

---

## Installation

1. Open Visual Studio Code
2. Navigate to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "CodeBuddy"
4. Select Install

Alternatively, install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy).

---

## Configuration

### Model Selection

Configure your preferred AI provider in VS Code settings:

```json
{
  "generativeAi.option": "Gemini"
}
```

Available options: `Gemini`, `Anthropic`, `OpenAI`, `Groq`, `Deepseek`, `Qwen`, `GLM`, `Local`

### API Keys

Each provider requires its respective API key:

| Provider  | Setting Key           | Documentation                                                |
| --------- | --------------------- | ------------------------------------------------------------ |
| Gemini    | google.gemini.apiKeys | [Google AI Studio](https://aistudio.google.com/app/apikey)   |
| Anthropic | anthropic.apiKey      | [Anthropic Console](https://console.anthropic.com/)          |
| OpenAI    | openai.apiKey         | [OpenAI Platform](https://platform.openai.com/api-keys)      |
| Groq      | groq.llama3.apiKey    | [Groq Console](https://console.groq.com/keys)                |
| DeepSeek  | deepseek.apiKey       | [DeepSeek Platform](https://platform.deepseek.com/api_keys)  |
| Qwen      | qwen.apiKey           | [DashScope Console](https://dashscope.console.aliyun.com/)   |
| GLM       | glm.apiKey            | [Zhipu AI Platform](https://open.bigmodel.cn/)               |
| Tavily    | tavily.apiKey         | [Tavily Dashboard](https://app.tavily.com/home) (web search) |

### Local Model Configuration

For Ollama-based local models:

```json
{
  "generativeAi.option": "Local",
  "local.model": "qwen2.5-coder",
  "local.baseUrl": "http://localhost:11434/v1"
}
```

Alternatively, use the Settings UI in the CodeBuddy sidebar to manage local models through Docker Compose.

### Project Rules

Create `.codebuddy/rules.md` in your workspace root or use the command "CodeBuddy: Initialize Project Rules":

```markdown
# Project Rules

## Code Style

- Use functional components with hooks
- Prefer const over let

## Architecture

- All API calls through src/services/
- State management via Zustand
```

Rules settings:

```json
{
  "codebuddy.rules.enabled": true,
  "codebuddy.rules.maxTokens": 2000
}
```

### UI Customization

```json
{
  "font.family": "JetBrains Mono",
  "chatview.theme": "Atom One Dark",
  "chatview.font.size": 16
}
```

---

## Usage

### Commands

Access via Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

| Command                             | Description                       |
| ----------------------------------- | --------------------------------- |
| CodeBuddy: Open Project Rules       | Open or create project rules file |
| CodeBuddy: Initialize Project Rules | Create rules file with template   |
| CodeBuddy: Reload Project Rules     | Force reload rules from file      |
| CodeBuddy: Generate Documentation   | Generate project documentation    |
| CodeBuddy: Analyze Codebase         | Deep architectural analysis       |
| CodeBuddy: Review Pull Request      | Comprehensive PR review           |
| CodeBuddy: Show Cache Status        | Display codebase analysis cache   |
| CodeBuddy: Clear Cache              | Clear analysis cache              |

### Context Menu

Right-click on selected code:

| Action             | Description                     |
| ------------------ | ------------------------------- |
| Add Comment        | Generate documentation comments |
| Review Code        | Comprehensive code analysis     |
| Refactor Code      | Restructuring suggestions       |
| Optimize Code      | Performance improvements        |
| Explain Code       | Technical explanation           |
| Generate Commit    | Git commit message generation   |
| Inline Chat        | Context-aware conversation      |
| Generate Diagram   | Mermaid diagram creation        |
| Open Project Rules | Open rules file                 |

### Keyboard Shortcuts

| Action             | Windows/Linux | macOS       |
| ------------------ | ------------- | ----------- |
| Add Comment        | Ctrl+Shift+J  | Cmd+Shift+J |
| Review Code        | Ctrl+Shift+R  | Cmd+Shift+R |
| Refactor Code      | Ctrl+Shift+;  | Cmd+Shift+; |
| Optimize Code      | Ctrl+Shift+0  | Cmd+Shift+0 |
| Explain Code       | Ctrl+Shift+1  | Cmd+Shift+1 |
| Generate Commit    | Ctrl+Shift+2  | Cmd+Shift+2 |
| Inline Chat        | Ctrl+Shift+8  | Cmd+Shift+8 |
| Analyze Codebase   | Ctrl+Shift+6  | Cmd+Shift+6 |
| Open Project Rules | Ctrl+Shift+9  | Cmd+Shift+9 |

### Chat Interface

- Type messages directly in the chat panel
- Use `@filename` to include specific files as context (supports fuzzy search)
- Toggle between Agent and Ask modes
- Active file is automatically included in context
- Active workspace display shows current file path

---

## Architecture

```
codebuddy/
├── src/
│   ├── extension.ts                 # Extension entry point
│   ├── orchestrator.ts              # Event orchestration
│   ├── agents/
│   │   ├── developer/
│   │   │   ├── agent.ts             # Developer agent (DeepAgents)
│   │   │   ├── prompts.ts           # System prompts
│   │   │   └── subagents.ts         # Specialized sub-agents
│   │   ├── langgraph/
│   │   │   └── tools/               # LangGraph tool implementations
│   │   └── tools/
│   │       └── provider.ts          # Tool factory
│   ├── services/
│   │   ├── project-rules.service.ts # Project rules management
│   │   ├── smart-context-selector.service.ts
│   │   ├── codebase-understanding.service.ts
│   │   ├── enhanced-prompt-builder.service.ts
│   │   ├── docker/
│   │   │   └── DockerModelService.ts # Local model management
│   │   └── ...
│   ├── llms/                        # AI provider integrations
│   │   ├── gemini/
│   │   ├── anthropic/
│   │   ├── groq/
│   │   ├── local/                   # Ollama integration
│   │   └── ...
│   └── webview-providers/           # UI communication
├── webviewUi/                       # React chat interface
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileMention.tsx      # @ mention with fuzzy search
│   │   │   └── ...
│   │   └── constants/
│   │       └── constant.ts          # FAQ, model configs
└── package.json
```

### Storage Architecture

| Path        | Backend    | Persistence   | Purpose                     |
| ----------- | ---------- | ------------- | --------------------------- |
| /workspace/ | Filesystem | Permanent     | Real file operations        |
| /docs/      | Store      | Cross-session | Knowledge and documentation |
| / (root)    | State      | Session only  | Temporary workspace         |
| .codebuddy/ | Local      | Permanent     | Chat history, rules, logs   |

---

## Local Development

### Prerequisites

- Node.js 18+
- VS Code 1.78.0+
- npm or yarn

### Setup

```bash
git clone https://github.com/olasunkanmi-SE/codebuddy.git
cd codebuddy

npm install
cd webviewUi && npm install && cd ..

npm run compile
cd webviewUi && npm run build && cd ..
```

### Development

1. Open the project in VS Code
2. Press F5 to launch Extension Development Host
3. For webview development: `npm run dev:webview`

### Build

```bash
npm run build
```

---

## Troubleshooting

### Agent Not Responding

- Verify API key configuration
- Check provider quota and billing status
- Test with an alternative model

### Local Model Connection Issues

- Confirm Ollama is running: `ollama serve`
- Verify base URL: `http://localhost:11434/v1`
- Check model is pulled: `ollama list`
- Use Settings UI to start Docker Compose server

### Context Too Large (413 Error)

- Smart context selection automatically manages token budgets
- Reduce explicit file mentions if needed
- Consider using a model with larger context window
- Local models use 4K token budget by default

### Project Rules Not Loading

- Verify file exists at `.codebuddy/rules.md`
- Check `codebuddy.rules.enabled` is true
- Use "CodeBuddy: Reload Project Rules" command

---

## Technical Specifications

| Specification   | Value                     |
| --------------- | ------------------------- |
| VS Code Version | 1.78.0+                   |
| AI Providers    | 9 (8 cloud + 1 local)     |
| Agent Framework | DeepAgents + LangGraph    |
| UI Framework    | React                     |
| Database        | SQLite (metadata)         |
| Token Budgets   | Local: 4K, Cloud: 20K-50K |

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

## Links

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)
- [Open VSX Registry](https://open-vsx.org/extension/fiatinnovations/ola-code-buddy)
- [GitHub Repository](https://github.com/olasunkanmi-SE/codebuddy)
- [Issue Tracker](https://github.com/olasunkanmi-SE/codebuddy/issues)

---

## Author

Oyinlola Olasunkanmi Raymond

- [GitHub](https://github.com/olasunkanmi-SE)
- [LinkedIn](https://www.linkedin.com/in/oyinlola-olasunkanmi-raymond-71b6b8aa/)
- Email: oyinolasunkanmi@gmail.com

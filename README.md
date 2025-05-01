# CodeBuddy: Your AI Coding Assistant

CodeBuddy is a Visual Studio Code extension that enhances developer productivity through AI-powered code assistance. It provides intelligent code review, refactoring suggestions, optimization tips, and interactive chat capabilities powered by multiple AI models including Gemini, Groq, Anthropic, and Deepseek.

The extension leverages advanced language models to help developers write better code, understand complex codebases, and automate routine tasks. Key features include code commenting, refactoring suggestions, performance optimization, error fixing, code explanation, commit message generation, and interactive code chat. CodeBuddy integrates seamlessly with VS Code's interface and supports TypeScript/JavaScript development workflows with extensibility for other languages.

## Install in Vscode Market Place

https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy

## Roadmap

- [x] Codebase Understanding: Comprehensive local codebase indexing with Retrieval-Augmented Generation (RAG) capabilities.
- [x] Code search: Search code across the entire codebase
- [x] Rewrite the Webview UI with React
- [x] Incorporate AI agents for seamless interaction with external resources and APIs.
- [x] Context Pinning: Allow users to pin specific directories, files, and code elements (functions, classes, etc.) as persistent context for AI models.
- [ ] Automated Documentation Generation: Generate comprehensive and up-to-date codebase documentation.
- [x] Intelligent Orchestration: Coordinate AI agents' activities with proper workflow.
- [x] Access to real-time data.
- [ ] Support for local LLMs such as Ollama
- [x] Support for Deepseek model

## Repository Structure

```
.
├── src/                          # Source code directory
│   ├── agents/                   # Agent orchestration and interfaces
│   ├── application/             # Core application constants and interfaces
│   ├── commands/                # Command implementations for VS Code extension
│   ├── infrastructure/          # Infrastructure layer (HTTP, logging, database)
│   ├── llms/                    # Language model integrations (Anthropic, Deepseek, Gemini, Groq)
│   ├── memory/                  # Memory management implementations
│   ├── services/                # Core services (file management, authentication, etc.)
│   ├── webview/                 # Webview UI components
│   └── extension.ts             # Main extension entry point
├── webviewUi/                   # React-based UI components
│   ├── src/                     # UI source code
│   └── package.json             # UI dependencies
├── package.json                 # Main extension configuration and dependencies
└── tsconfig.json               # TypeScript configuration
```

### Contribution

1. Fork the repository. Make a branch from Development.
2. npm install the packages
3. Click Run, an option on your screen's top bar, then click Start Debugging. Run -> Start Debugging
4. A new instance of VS Code will be opened up. This is like your test instance; all changes made on the Codebuddy repo can be seen on this instance.
5. The main entry into the application is the extension.ts. For the Webview, the main entry is the webview.tsx
6. Raise a PR
7. For more info, check the contributing.md page

## Usage Instructions

### Installation

1. Ensure you have Visual Studio Code version 1.78.0 or higher installed.
2. Install the CodeBuddy extension from the Visual Studio Code Marketplace.

### Configuration

1. Open VS Code settings (File > Preferences > Settings).
2. Search for "CodeBuddy" in the settings search bar.
3. Configure the following settings:
   - Select the Generative AI model (Gemini, Groq, Anthropic, or XGrok)
   - Enter the API key for your chosen model
   - Choose your preferred font family and chat view theme

### Troubleshooting

1. API Key Issues:

   - Problem: "Failed to generate content" error message.
   - Solution: Double-check your API key in the CodeBuddy settings.

2. Model Selection:

   - Problem: Features not working as expected.
   - Solution: Ensure you've selected the correct AI model in the settings.

3. Performance Issues:
   - Problem: Slow response times from CodeBuddy.
   - Solution: Check your internet connection and consider switching to a faster AI model.

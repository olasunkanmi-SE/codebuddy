# CodeBuddy: Your AI Coding Assistant

CodeBuddy is a powerful Visual Studio Code extension that integrates various generative AI models to enhance your coding workflow and productivity.

This extension provides a wide range of AI-powered features to assist developers in their daily coding tasks, from code generation and refactoring and to unit test creation.

## Install in Vscode Market Place
https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy


## Architecture

```mermaid
graph TB
    subgraph VSCode["VS Code Extension"]
        Editor["Editor Interface"]
        Commands["Commands Layer"]
        Webview["Webview UI (React)"]
    end

    subgraph Core["Core Application"]
        direction TB
        Agents["AI Agents Layer"]
        AppServices["Application Services"]
        Infrastructure["Infrastructure Layer"]
        Memory["Memory System"]
    end

    subgraph AIProviders["AI Providers"]
        Gemini["Gemini API"]
        Groq["Groq API"]
        Anthropic["Anthropic API"]
        XGrok["XGrok API"]
    end

    subgraph Storage["Storage Layer"]
        SQLite["SQLite Database"]
        VectorDB["Vector Embeddings"]
        FileSystem["File System Service"]
    end

    %% Main Flow Connections
    Editor -->|"User Input"| Commands
    Commands -->|"Process Request"| Agents
    Agents -->|"Context Management"| Memory
    Agents -->|"API Requests"| Infrastructure
    Infrastructure -->|"Model Selection"| AIProviders
    AppServices -->|"Data Access"| Storage
    Memory -->|"Store Context"| Storage
    Infrastructure -->|"Response"| Webview

    %% Additional Connections
    Agents -->|"Business Logic"| AppServices
    Commands -->|"UI Updates"| Webview
    FileSystem -->|"Code Analysis"| Agents
    

    class VSCode vscode
    class Core core
    class AIProviders ai
    class Storage storage
```
### Database
- SQLite database for code pattern storage
- Vector embeddings for semantic code search

### File System
- Workspace management for multi-root projects
- TypeScript configuration detection
- File watching and indexing services


## Roadmap
- [ ] Codebase Understanding: Comprehensive local codebase indexing with Retrieval-Augmented Generation (RAG) capabilities.
- [ ] Code search: Search code across the entire codebase
- [ ] Rewrite the Webview UI with React
- [ ] Incorporate AI agents for seamless interaction with external resources and APIs.
- [ ] Context Pinning: Allow users to pin specific directories, files, and code elements (functions, classes, etc.) as persistent context for AI models.
- [ ] Automated Documentation Generation: Generate comprehensive and up-to-date codebase documentation.
- [ ] Intelligent Orchestration: Orchestrate ReAct models activities through advanced tools and function calling.
- [ ] Access to real-time data.
- [ ] Support for local LLMs such as Ollama
- [ ] Support for Deepseek model


## Repository Structure
```
.
├── src/                         # Source code directory
│   ├── agents/                  # AI agent implementations and orchestration
│   ├── application/             # Core application constants and interfaces
│   ├── commands/                # Command implementations for VS Code extension
│   ├── infrastructure/          # Core infrastructure components (HTTP, logging, storage)
│   ├── llms/                    # Language model integrations (Anthropic, Gemini, Groq)
│   ├── memory/                  # Memory management for AI context
│   ├── providers/               # Provider implementations for different services
│   ├── services/                # Business logic and core services
│   └── webview/                 # VS Code webview implementation
├── webviewUi/                   # React-based UI for the extension
└── package.json                 # Project configuration and dependencies
```

Key Files:

- `src/extension.ts`: Main entry point for the extension
- `src/events/`: Contains event handlers for various CodeBuddy features
- `src/providers/`: Implements providers for different AI models and webviews
- `src/services/`: Contains service classes for chat management and AI model integration
- `package.json`: Defines extension metadata, dependencies, and configuration

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

### Getting Started

1. Open a Vscode workspace/file containing some code
2. Right-click on the selected code to access CodeBuddy features in the context menu.
3. Access the chat interface via the CodeBuddy panel in the Activity Bar.

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


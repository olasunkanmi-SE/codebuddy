# CodeBuddy: Your AI Coding Assistant

CodeBuddy is a powerful Visual Studio Code extension that integrates various generative AI models to enhance your coding workflow and productivity.

This extension provides a wide range of AI-powered features to assist developers in their daily coding tasks, from code generation and refactoring and to unit test creation.

## Install in Vscode Market Place
https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy

## Highlevel Architecture
![Screenshot 2025-01-28 at 4 00 10 PM](https://github.com/user-attachments/assets/99d610f9-3e88-4f43-9198-61629fed5eaf)


## Roadmap
- [ ] Codebase Understanding: Comprehensive local codebase indexing with Retrieval-Augmented Generation (RAG) capabilities.
- [ ] Code search: Search code across the entire codebase
- [ ] Rewrite the Webview UI with React
- [ ] Incorporate AI agents for seamless interaction with external resources and APIs.
- [ ] Context Pinning: Allow users to pin specific directories, files, and code elements (functions, classes, etc.) as persistent context for AI models.
- [ ] Automated Documentation Generation: Generate comprehensive and up-to-date codebase documentation.
- [ ] Intelligent Orchestration: Orchestrate AI model activities with agent capabilities through advanced tools and function calling for complex tasks.
- [ ] Access to real-time data.
- [ ] Support for local LLMs such as Ollama
- [ ] Support for Deepseek model

## Repository Structure

```
.
├── src/
│   ├── events/
│   ├── providers/
│   ├── services/
│   ├── test/
│   ├── webview/
│   ├── constant.ts
│   ├── extension.ts
│   └── utils.ts
├── CHANGELOG.md
├── CONTRIBUTING.md
├── package.json
├── README.md
└── tsconfig.json
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

### Features

- Code Comments: Generate meaningful comments for your code.
- Code Review: Get AI-powered code reviews and suggestions.
- Code Refactoring: Automatically refactor selected code.
- Code Optimization: Optimize your code for better performance.
- Code Explanation: Get detailed explanations of complex code snippets.
- Commit Message Generation: Create meaningful commit messages based on your changes.
- Inline chat for a quick conversation with the Codebuddy
- Code Chart Generation: Create visual representations of your code structure.

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

### Debugging

To enable debug mode:

1. Open the Output panel in VS Code (View > Output).
2. Select "CodeBuddy" from the dropdown menu.
3. Look for debug information and error messages in the output.

## Data Flow

When a user interacts with CodeBuddy, the following data flow occurs:

1. User Input: The user selects a code or enters a query in the CodeBuddy chat panel.
2. Extension Processing: The `extension.ts` file manages the user's action and directs it to the appropriate event handler in the `events/` directory.
3. AI Model Integration: The chosen AI model (Gemini, Groq, Anthropic, or XGrok) is activated through the respective provider in the `providers/` directory.
4. API Request: The provider requests the AI service's API using the user's input and any necessary context.
5. Response Processing: The provider receives and processes the AI service's response.
6. User Interface Update: The processed response is relayed back to the user interface, updating either the code editor or the chat panel.

Note: The chat history and other session data are managed by the `ChatManager` service to maintain context across interactions.

## Deployment

N/A - This is a Visual Studio Code extension and does not require separate deployment.

## Infrastructure

N/A - This project does not have a dedicated infrastructure stack.

# CodeBuddy: Your AI Coding Assistant

CodeBuddy is a powerful Visual Studio Code extension that integrates various generative AI models to enhance your coding workflow and productivity.

This extension provides a wide range of AI-powered features to assist developers in their daily coding tasks, from code generation and refactoring and to unit test creation.

## Install in Vscode Market Place
https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy

## Roadmap
- [ ] Index codebase. Perform retrieval-augmented generation (RAG) on the codebase.
- [ ] Context Pinning. Pin directories, and files, (functions, classes, etc.) as persistent context. AI Models to reference these items for every suggestion, across Chat and Commands.
- [ ] Persistent Context. AI model to use certain context throughout a conversation and across different conversations by configuring the Context.
- [ ] Create Code base Documentation.

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

1. Open a JavaScript or TypeScript file in VS Code.
2. Right-click on selected code to access CodeBuddy features in the context menu.
3. Use the CodeBuddy panel in the Activity Bar to access the chat interface.

### Features

- Code Comments: Generate meaningful comments for your code.
- Code Review: Get AI-powered code reviews and suggestions.
- Code Refactoring: Automatically refactor selected code.
- Code Optimization: Optimize your code for better performance.
- Code Explanation: Get detailed explanations of complex code snippets.
- Unit Test Generation: Automatically generate unit tests for your code.
- Commit Message Generation: Create meaningful commit messages based on your changes.
- Interview Question Generation: Generate interview questions based on your code.
- Code Chart Generation: Create visual representations of your code structure.

### Common Use Cases

1. Generate comments for a complex function:

   - Select the function in your code editor.
   - Right-click and choose "CodeBuddy. Add comment to selected code."

2. Get a code review:

   - Select a block of code or an entire file.
   - Right-click and select "CodeBuddy. Review these selected code."

3. Generate a unit test:

   - Select the function or class you want to test.
   - Right-click and choose "CodeBuddy. Generate Unit Test."

4. Ask CodeBuddy a question:
   - Open the CodeBuddy chat panel from the Activity Bar.
   - Type your question and press Enter.

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

1. User Input: The user selects code or enters a query in the CodeBuddy chat panel.
2. Extension Processing: The `extension.ts` file handles the user's action and routes it to the appropriate event handler in the `events/` directory.
3. AI Model Integration: The selected AI model (Gemini, Groq, Anthropic, or XGrok) is invoked through the corresponding provider in the `providers/` directory.
4. API Request: The provider sends a request to the AI service's API with the user's input and any necessary context.
5. Response Processing: The AI service's response is received and processed by the provider.
6. User Interface Update: The processed response is sent back to the user interface, either updating the code editor or the chat panel.

```
[User Input] -> [Extension] -> [Event Handler] -> [AI Provider] -> [AI API]
                                                                      |
[User Interface] <- [Extension] <- [Event Handler] <- [AI Provider] <-'
```

Note: The chat history and other session data are managed by the `ChatManager` service to maintain context across interactions.

## Deployment

N/A - This is a Visual Studio Code extension and does not require separate deployment.

## Infrastructure

N/A - This project does not have a dedicated infrastructure stack.

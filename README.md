# CodeBuddy - AI-Powered Coding Assistant

CodeBuddy is a Visual Studio Code extension that provides an AI-powered coding assistant to help developers write better code more efficiently. With CodeBuddy, you can get intelligent code suggestions, completions, and assistance based on the context and requirements of your code.

## Install in Vscode Market Place
https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy

## Roadmap
- [x] Code Generation: The assistant can generate code snippets based on user input, streamlining the development process.
- [x] Task Completion: The assistant can aid in completing tasks such as debugging, testing, and refactoring, enhancing development workflow efficiency.
- [x] Code Refactoring: The assistant can refactor code to improve efficiency, readability, and maintainability.
- [x] Code Analysis: The assistant can analyze code and provide suggestions for improvement, including identifying potential bugs, security vulnerabilities, and performance issues.
- [x] Quickfix Compilation Errors: The assistant can quickly resolve compilation errors.
- [ ] Code Search: The assistant can search for code snippets and functions within the codebase, enabling quick reuse of existing code.
- [x] Document Upload and Knowledge Retrieval: The assistant can upload documents and retrieve knowledge from them.
- [ ] Auto-Completion of Code (Code Suggestions): The assistant will provide code suggestions for auto-completion.
- [x] Support for various Generative AIs. Currently, Support Groq, Gemini, and Anthropic
- [ ] Folder-Specific Tasks: The assistant performs tasks such as summarizing, creating, and updating within specific folders.
- [ ] GitHub Issues Integration: The assistant will be connected to GitHub Issues, enhancing collaboration and issue tracking
- [x] Unit Test Generation: The assistant can generate unit tests.
- [x] Interview Mode: The assistant can generate interview questions based on selected code or text.
- [x] Generate commit messages from Git diff


## For local development purposes
- Clone this repository
- Open this in VSCode.
- Click on run -> start debugging
- A new instance of VScode will be open to you, this instance contains the latest file you opened on your Vscode

## Supported Models
- Gemini
- Groq
- Anthropic
- XGrok

## Settings.json
- "google.gemini.apiKeys": 'Your API Key'. Get Gemini APIKey https://aistudio.google.com/app/apikey
- "google.gemini.model": Specify the AI model for code assistance (default: "gemini-1.0-pro-latest").
- "groq.llama3.apiKey": "your Groq API key". Get Grok API Key https://console.groq.com/keys
- "groq.model": "Specify the AI model. https://console.groq.com/docs/models"

## How to run locally
  - In package.json, hover on "vscode:prepublish", click on run script. This will create a build for the application
  - On the Vscode Menu, click on run -> start debugging. A new Vscode instance is opened
  - In the new instance, press command/ctrl + shift + p, search for Explorer: Focus on chat view. This opens up a chat webview
  - To ask for help on a piece of code, simply highlight the code and right-click. There are a variety of actions listed to soothe your need

## Contributing
- Contributions are welcome! If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request.


Enjoy coding with CodeBuddy!

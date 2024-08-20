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
- [x] Support for various Generative AIs. Currently, Support Groq and Gemini
- [ ] Folder-Specific Tasks: The assistant will be able to perform tasks such as summarizing, creating, and updating within specific folders.
- [ ] GitHub Issues Integration: The assistant will be connected to GitHub Issues, enhancing collaboration and issue tracking
- [x] Unit Test Generation: The assistant can generate unit tests.
- [x] Interview Mode: The assistant can generate interview questions based on selected code or text.
- [x] Generate commit messages from Git diff


## For local development purposes
- Clone this repository
- Open this in VSCode.
- Click on run -> start debugging
- A new instance of VScode will be open to you, this instance contains the latest file you opened on your Vscode
- You can change the file by clicking on file -> open recent.
- To access code buddy. Drag the explorer button to the right of the page. A chat interface should be displayed
- Highlight any code, right-click. You should see lists of options like refactoring, optimizing code, etc.
- Also you can simply type an instruction, in conjunction with some highlighted code if you will, right-click and click on send to Ola
- you can have a chat-like conversation and it does remember your previous questions because there is support for chat history

## How to use
- Once installed, drag the explorer button to the right of the page. A chat interface should be displayed
- Highlight your code, right-click, and select any of the desired assistant options
- For generic questions, add your instructions to them, highlight and send them to CodeBuddy.
- The chat button is disabled for now. Help is needed in fixing here https://github.com/olasunkanmi-SE/codebuddy/issues/37

## Requirements

- A Gemini or Groq API key is required.
- Latest version of Vscode
- Presently supports Google Gemini and Groq generative AIs.

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

## Release Notes

### 1.0.0

- Initial release of CodeBuddy.

### 1.1.0

- Support for multiple chat view themes, fonts and font size

- ### 1.1.1
- Support for Auto-Generated Code Commit Messages, Knowledgebase, Unit Test Generation, copy and auto-Scroll to bottom of Chat, Interview me.

- Support for multiple chat view themes, fonts and font size

## Contributing
- Contributions are welcome! If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request.


Enjoy coding with CodeBuddy!

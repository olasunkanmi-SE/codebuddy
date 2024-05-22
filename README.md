# CodeBuddy - AI-Powered Coding Assistant

CodeBuddy is a Visual Studio Code extension that provides an AI-powered coding assistant to help developers write better code more efficiently. With CodeBuddy, you can get intelligent code suggestions, completions, and assistance based on the context and requirements of your code.

## Install in Vscode Market Place
https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy

## Features

- Code generation: The assistant can generate code snippets based on your input, allowing you to quickly create code without having to write it all yourself.
- Task completion: The assistant can help you complete tasks such as debugging, testing, and refactoring, making your development workflow more efficient.
- Code refactoring: The assistant can refactor your code to make it more efficient, readable, and maintainable.
- Code analysis: The assistant can analyze your code and provide suggestions for improvement, such as pointing out potential bugs, security vulnerabilities, and performance issues.
- Code formatting: The assistant can format your code to conform to your preferred style guide, making your code more readable and maintainable.
- Code search: The assistant can search for code snippets and functions within your codebase, allowing you to quickly find and reuse existing code.


## For local development purposes
- Clone this repository
- Open this in VSCode.
- Click on run -> start debugging
- A new instance of VScode will be open to you, this instance contains the latest file you opened on your Vscode
- You can change the file by clicking on file -> open recent.
- To access code buddy. Drag the explorer button to the right of the page. A chat interface should be displayed
- Highlight any code, right-click. You should see lists of options like refactoring, optimize code, etc.
- Also you can simply type an instruction, in conjunction with some highlighted code if you will, right-click and click on send to Ola
- you can have a chat-like conversation and it does remember your previous questions because there is support for chat history

## How to use
- Once installed, press command/ctrl + shift + p, search for Explorer: Focus on chat view, this opens up a chat webview
- Highlight your code, right click, and click any of the desired assistant options
- If you have a none coding questions, you can type it in your vscode editor and send to Ola.
- The chat button is disabled for now. Help is needed in fixing here https://github.com/olasunkanmi-SE/codebuddy/issues/37


## Roadmap
- [x] Code generation: The assistant can generate code snippets based on your input, allowing you to quickly create code without having to write it all yourself.
- [x] Task completion: The assistant can help you complete tasks such as debugging, testing, and refactoring, making your development workflow more efficient.
- [x] Code refactoring: The assistant can refactor your code to make it more efficient, readable, and maintainable.
- [x] Code analysis: The assistant can analyze your code and provide suggestions for improvement, such as pointing out potential bugs, security vulnerabilities, and performance issues.
- [x] Code formatting: The assistant can format your code to conform to your preferred style guide, making your code more readable and maintainable.
- [x] Quickfix compilation errors
- [ ] Code search: The assistant can search for code snippets and functions within your codebase, allowing you to quickly find and reuse existing code.
- [ ] Upload documents and retrieve knowledge from it
- [ ] Auto-completion of code aka code suggestions
- [x] Support for various Generative AIs. Currently Support Groq and Gemini
- [ ] Perform folder specific tasks like. Summarize, create, and update
- [ ] Connect the co-buddy to GitHub Issues
- [ ] Suggest code changes or provide templates based on the issue type or requirements.
- [ ] Task-based suggestions, Analyze the current task or issue description and provide code suggestions based on the requirements
- [ ] Automated issue linking: any code changes, automatically detect the relevant issue or task based on the branch name, commit message, or user input.
- [ ] Update the issue status or add comments to the issue based on the code changes

## Requirements

- A Gemini or Groq API key is required.
- Latest version of Vscode
- Presently supports Google Gemini and Groq generative AIs.

## Settings.json
- "google.gemini.apiKeys": 'Your API Key'. Get Gemini APIKey https://aistudio.google.com/app/apikey
- "google.gemini.model": Specify the AI model for code assistance (default: "gemini-1.0-pro-latest").
- "groq.llama3.apiKey": "your Groq API key". Get Grok API Key https://console.groq.com/keys
- "groq.model": "llama3-70b-8192"

## How to run locally
  - In package.json, hover on "vscode:prepublish", click on run script. This will create a build for the application
  - On the Vscode Menu, click on run -> start debugging. A new Vscode instance is opened
  - In the new instance, press command/ctrl + shift + p, search for Explorer: Focus on chat view. This opens up a chat webview
  - To ask for help on a piece of code, simply highlight the code and right-click. There are a variety of actions listed to soothe your need

## Release Notes

### 1.0.0

- Initial release of CodeBuddy.

## Contributing
- Contributions are welcome! If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request.


Enjoy coding with CodeBuddy!

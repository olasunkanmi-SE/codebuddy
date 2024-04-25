# CodeBuddy - AI-Powered Coding Assistant

CodeBuddy is a Visual Studio Code extension that provides an AI-powered coding assistant to help developers write better code more efficiently. With CodeBuddy, you can get intelligent code suggestions, completions, and assistance based on the context and requirements of your code.

## Features

- Code generation: The assistant can generate code snippets based on your input, allowing you to quickly create code without having to write it all yourself.
- Task completion: The assistant can help you complete tasks such as debugging, testing, and refactoring, making your development workflow more efficient.
- Code refactoring: The assistant can refactor your code to make it more efficient, readable, and maintainable.
- Code analysis: The assistant can analyze your code and provide suggestions for improvement, such as pointing out potential bugs, security vulnerabilities, and performance issues.
- Code formatting: The assistant can format your code to conform to your preferred style guide, making your code more readable and maintainable.
- Code search: The assistant can search for code snippets and functions within your codebase, allowing you to quickly find and reuse existing code.


## How to use
- Clone this repository
- Open this in VSCode.
- Click on run -> start debugging
- A new instance of VScode will be open to you, this instance contains the latest file you opened on your Vscode
- You can change the file by clicking on file -> open recent.
- To access code buddy. Drag the explorer button to the right of the page. A chat interface should be displayed
- Highlight any code, right-click. You should see lists of options like refactoring, optimize code, etc.
- Also you can simply type an instruction, in conjunction with some highlighted code if you will, right-click and click on send to Ola
- you can have a chat-like conversation and it does remember your previous questions because there is support for chat history


## Roadmap
- [x] Code generation: The assistant can generate code snippets based on your input, allowing you to quickly create code without having to write it all yourself.
- [x] Task completion: The assistant can help you complete tasks such as debugging, testing, and refactoring, making your development workflow more efficient.
- [x] Code refactoring: The assistant can refactor your code to make it more efficient, readable, and maintainable.
- [x] Code analysis: The assistant can analyze your code and provide suggestions for improvement, such as pointing out potential bugs, security vulnerabilities, and performance issues.
- [x] Code formatting: The assistant can format your code to conform to your preferred style guide, making your code more readable and maintainable.
- [ ] Code search: The assistant can search for code snippets and functions within your codebase, allowing you to quickly find and reuse existing code.
- [ ] Upload documents and retrieve knowledge from it
- [ ] Auto-completion of code aka code suggestions
- [x] Support for various Generative AIs

## Configuration

CodeBuddy provides the following configuration options:

- 'google.gemini.apiKey': Set your Google Generative AI API key to enable the AI functionality.
- `'google.gemini.model': Specify the AI model to use for code assistance (default: "gemini-1.0-pro-latest").
- "groq.apiKey": "Groq API key",
  "groq.model": "llama3-70b-8192",

To configure these options, go to the Visual Studio Code settings and search for "CodeBuddy".

## Requirements

- A Gemini or Groq API key is required.
- Latest version of Vscode

## Extension Settings

- Presently supports Google Gemini.
- In vscode settings, search for Ola, and under extensions, click on 'Your coding buddy'. 
- Enter your Google Gemini API key and Gemini Model
- Or in the settings.json file, enter this   
- `google.gemini.apiKey`: "Your API key",
- `google.gemini.model`: "models/gemini model",

## Release Notes

### 1.0.0

- Initial release of CodeBuddy.

## Contributing
- Contributions are welcome! If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request.


Enjoy coding with CodeBuddy!

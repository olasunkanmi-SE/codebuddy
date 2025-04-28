# Change Log

All notable changes to the "ola" extension are documented in this file.

## v0.0.1

# Changelog for CodeBuddy Version 2.0.0

Initial release. Provides commands for generating code comments and code reviews.

## Major Features

- Codebase Understanding: Comprehensive local codebase indexing with Retrieval-Augmented Generation (RAG) capabilities.
- Code search: Search code across the entire codebase
- Rewrite the Webview UI with React
- Incorporate AI agents for seamless interaction with external resources and APIs.
- Context Pinning: Allow users to pin specific directories, files, and code elements (functions, classes, etc.) as persistent context for AI models.
- Intelligent AI agent Orchestration: Coordinate AI agents' activities with proper workflow.
- Access to real-time data.
- Support for Deepseek model

### AI Intelligence

- Added AI agent system with intelligent orchestration [#142]
- Access to real-time data
- Code Indexing (RAG)
- Agent Context aware
- Implemented base LLM class [#141]
- Integrated Gemini, DeepSeek, and Groq LLM for enhanced processing [#197]
- Implemented RAG (Retrieval Augmented Generation) capabilities [#134, #137]
- Improved embedding model from Xenova/all-MiniLM-L6-v2 to text-embedding [#136]

### UI Enhancements

- Upgraded UI with improved responsiveness [#117, #175]
- Enhanced chat webview with model selection and attachments [#160]
- Implemented tabbed interface and improved prompt handling [#173]
- Enhanced code block display and added architecture documentation [#157]
- Improved code highlighting and added copy functionality [#166]
- Enhanced webview UI with bot icon and mode selection [#168]

### Functionality

- Created communication between the extension and React webview [#121]
- Implemented web search functionality [#158, #159]
- Enhanced web search results with metadata [#170]
- Added secret storage provider and event handling [#162]
- Implemented workspace service and context info [#181]
- Added file system event monitoring [#238]
- Enabled local file uploads and processing [#206]
- Introduced Think tool for complex problem-solving [#210]
- Implemented chat history management [#232]
- Added user preferences management [#243]

### Code Improvements

#### Refactoring

- Streamlined inline chat functionality [#127]
- Improved event generator functionality [#122]
- Restructured project for better organization [#140]
- Improved type safety and reusability in BaseEmitter [#144]
- Refactored agent classes and orchestrator [#150]
- Renamed AgentEventEmitter to EventEmitter for clarity [#151]
- Improved code indexing and context retrieval [#161]
- Enhanced database connection handling [#179]
- Refactored command handler [#222]
- Renamed files for clarity [#223]

#### Performance & Reliability

- Added `.vscodeignore` file to exclude development files from extension package [#128]
- Replaced `path.posix.join` with `vscode.Uri.joinPath` for consistent paths [#131]
- Created repository and code mapper [#132, #133]
- Implemented CodeBuddy agent with LLM integration [#148]
- Fixed `hljs` for highlighting code [#163]
- Enhanced file and directory exclusion during workspace scanning [#188]
- Improved tool call handling and result processing [#218]
- Introduced agent state management and error handling [#220]
- Enhanced model selection and API key retrieval [#227]

### Documentation

- Created contribution guidelines [#129]
- Updated project structure in README [#242]

### New Contributors

- @skyline-GTRr32 made their first contribution in [#178]

**Full Changelog**: [https://github.com/olasunkanmi-SE/codebuddy/compare/v.1.1.7...v2.0.0](https://github.com/olasunkanmi-SE/codebuddy/compare/v.1.1.7...v2.0.0)

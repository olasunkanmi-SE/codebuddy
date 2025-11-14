# CodeBuddy: AI-Powered Coding Assistant

[![Version](https://img.shields.io/visual-studio-marketplace/v/fiatinnovations.ola-code-buddy)](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/fiatinnovations.ola-code-buddy)](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/fiatinnovations.ola-code-buddy)](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)

**CodeBuddy** is a revolutionary Visual Studio Code extension that transforms your development workflow with AI-powered assistance.

## ✨ What's New in v3.4.8

🚀 **Enhanced Vector Database** - Advanced semantic search with LanceDB integration  
📚 **Smart Context Extraction** - Intelligent context retrieval for AI responses  
🔍 **Improved Prompt Engineering** - Sophisticated prompt building for better AI responses  
🤖 **Production-Ready Performance** - Optimized memory usage and faster response times  
💡 **Advanced Embedding Service** - Better code understanding with intelligent chunking  
�️ **Enhanced Error Handling** - Robust fallback mechanisms and better diagnostics

## 🌟 Support the Project

If CodeBuddy enhances your development workflow:
- ⭐ Star the repository
- 📝 Leave a review on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)
- 🐛 Report bugs or suggest features
- 🤝 Contribute to the codebase
- 💬 Share with fellow developers

## 🎯 Core Features

### 🧠 **AI-Powered Code Assistance**

- **Multiple AI Models**: Choose from Gemini, Anthropic Claude, Groq, Deepseek, and XGrok
- **Intelligent Code Review**: Deep analysis of code quality, security, and best practices
- **Smart Refactoring**: Context-aware code improvements and restructuring
- **Performance Optimization**: AI-driven suggestions for better performance
- **Bug Detection & Fixes**: Automatic error detection with intelligent fix suggestions
- **Vector Database Integration**: Semantic search across your entire codebase

### 💫 **Context-Aware Code Completion**

- **Inline Suggestions**: Copilot-style grey text completions as you type
- **Pattern Learning**: Learns from your codebase to suggest relevant completions
- **Function Signatures**: Smart parameter suggestions based on your patterns
- **Variable Naming**: Intelligent variable name suggestions following your conventions
- **Block Completion**: Auto-completes common code structures (if/for/try blocks)

### 📚 **Intelligent Documentation Generator**

- **Comprehensive README**: Auto-generates professional README.md files
- **API Documentation**: Extracts and documents REST endpoints automatically
- **Architecture Analysis**: Creates Mermaid diagrams and architectural overviews
- **Component Documentation**: Documents classes, interfaces, and modules
- **Smart Analysis**: Understands project structure and generates relevant docs

### 🔍 **Deep Codebase Understanding**

- **Vector-Powered Search**: LanceDB integration for semantic code search and retrieval
- **Smart Context Extraction**: Intelligent context selection for AI conversations
- **Architectural Recommendations**: Suggests improvements based on your project structure
- **Framework Detection**: Identifies and analyzes technologies in use
- **Pattern Recognition**: Understands your coding patterns and conventions
- **Context-Aware Q&A**: Answer questions about your specific codebase with precise context
- **Fallback Mechanisms**: Robust search with multiple strategies for maximum reliability

### 💬 **Interactive Chat Interface**

- **Modern React UI**: Beautiful, responsive chat interface with enhanced UX
- **Smart Context Integration**: Automatic semantic context inclusion in conversations
- **File Upload**: Support for various file formats (PDF, DOCX, CSV, JSON, TXT)
- **Advanced Syntax Highlighting**: Code blocks with proper language detection
- **Customizable Themes**: Multiple chat themes to match your preferences
- **Enhanced Prompt Engineering**: Sophisticated prompt building for optimal AI responses
- **Performance Monitoring**: Real-time performance metrics and diagnostics

## 🚀 Quick Start

### Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "CodeBuddy"
4. Click Install

### Setup

1. **Select AI Model**: Choose your preferred AI provider in VS Code settings
2. **Add API Key**: Configure your API key for the chosen model
3. **Start Coding**: CodeBuddy is now ready to assist!

### Getting Your API Keys

- **Gemini**: [Get API Key](https://aistudio.google.com/app/apikey)
- **Anthropic**: [Get API Key](https://docs.anthropic.com/en/docs/about-claude/models)
- **Groq**: [Get API Key](https://console.groq.com/keys)
- **Deepseek**: [Get API Key](https://platform.deepseek.com/api_keys)
- **XGrok**: [Get API Key](https://console.x.ai/)

## 📋 How to Use

### Right-Click Context Menu

Right-click on selected code to access these features:

- 💭 **Add Comments** - Intelligent code documentation
- 🔍 **Review Code** - Comprehensive code analysis
- 🔄 **Refactor Code** - Smart code improvements
- ⚡ **Optimize Code** - Performance enhancements
- 💬 **Explain Code** - Clear explanations of complex logic
- 📝 **Generate Commit Message** - Smart Git commit messages
- 💫 **Inline Chat** - Context-aware code discussions
- 📚 **Interview Questions** - Technical interview preparation
- 📊 **Generate Diagram** - Mermaid diagram creation
- 🏗️ **Analyze Codebase** - Deep architectural analysis

### Command Palette

Access additional features via Ctrl+Shift+P:

- **CodeBuddy: Generate Documentation** - Create comprehensive docs
- **CodeBuddy: Show Vector Database Statistics** - View indexing and search stats
- **CodeBuddy: Force Full Reindex** - Rebuild vector database index
- **CodeBuddy: Show Indexing Status** - Check current indexing progress
- **CodeBuddy: Vector Database Diagnostic** - Run comprehensive diagnostics
- **CodeBuddy: Show Performance Report** - View performance metrics
- **CodeBuddy: Clear Vector Cache** - Reset vector database cache
- **CodeBuddy: Emergency Stop** - Stop all background operations
- **CodeBuddy: Optimize Performance** - Run performance optimizations

### Chat Interface

Click the CodeBuddy icon in the Activity Bar to open the interactive chat:

- Ask questions about your code
- Upload files for analysis
- Get architectural recommendations
- Discuss implementation strategies

## 🔧 Configuration

Access CodeBuddy settings in VS Code preferences:

### AI Model Selection

```json
{
  "generativeAi.option": "Gemini" // or "Groq", "Anthropic", "XGrok", "Deepseek"
}
```

### Model-Specific Settings

```json
{
  "google.gemini.apiKeys": "your-gemini-api-key",
  "google.gemini.model": "gemini-1.5-flash",
  "anthropic.apiKey": "your-anthropic-api-key",
  "groq.llama3.apiKey": "your-groq-api-key",
  "deepseek.apiKey": "your-deepseek-api-key"
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

## 🏗️ Architecture

CodeBuddy follows a layered architecture pattern designed for scalability and maintainability:

### Frontend Layer

- **VS Code Integration**: Native VS Code commands and context menus
- **React WebView**: Modern chat interface with responsive design
- **Command Palette**: Rich set of developer commands

### Core Application Layer

- **AI Agent Orchestration**: Multi-agent system for complex tasks
- **Memory System**: Persistent context and conversation management
- **Business Logic**: Core application services and workflows
- **Application Interfaces**: Clean contracts between layers

### Service Layer

- **Vector Database Service**: LanceDB integration for semantic search
- **Smart Context Extraction**: Intelligent context retrieval
- **Enhanced Prompt Building**: Sophisticated AI prompt engineering
- **Embedding Service**: Code analysis and intelligent chunking
- **Documentation Generator**: Automated documentation creation

### Infrastructure Layer

- **HTTP Services**: External API integrations
- **Logging System**: Comprehensive logging and monitoring
- **Repository Layer**: Data access and persistence
- **Local Storage**: SQLite database and file system management

### AI Provider Integration

- **Multiple LLM Support**: Gemini, Anthropic, Groq, Deepseek, XGrok
- **Fallback Mechanisms**: Robust error handling and service switching
- **Performance Optimization**: Smart caching and request batching

### Storage Layer

- **SQLite Database**: Metadata and conversation storage
- **LanceDB Vector Database**: High-performance semantic search
- **File System**: Local file management and caching
- **Apache Arrow**: Efficient data serialization and storage

## 🚀 Roadmap

### ✅ Completed Features

- [x] **Vector Database Integration** - LanceDB-powered semantic search
- [x] **Smart Context Extraction** - Intelligent context retrieval system
- [x] **Enhanced Prompt Engineering** - Sophisticated prompt building service
- [x] **Production Safeguards** - Memory management and performance monitoring
- [x] **Advanced Embedding Service** - Intelligent code chunking and embedding
- [x] **React Webview UI** - Modern, responsive interface
- [x] **AI Agent Orchestration** - Multi-agent workflow coordination
- [x] **Documentation Generation** - Automated comprehensive docs
- [x] **Multiple AI Models** - Support for 5 different providers
- [x] **Robust Error Handling** - Fallback mechanisms and diagnostics

### 🔜 Coming Soon

- [ ] **MCP Integration** - Model Context Protocol support for enhanced tool usage
- [ ] **Agent-to-Agent Communication** - Advanced multi-agent coordination
- [ ] **Local LLM Support** - Ollama integration for offline usage
- [ ] **Multi-language Support** - Python, Java, Go, and more language support
- [ ] **Advanced Caching** - Redis support for distributed caching
- [ ] **Team Collaboration** - Share contexts and documentation across teams
- [ ] **Custom Templates** - Personalized documentation and code templates
- [ ] **Real-time Collaboration** - Live coding assistance and pair programming

## 📁 Repository Structure

```
codebuddy/
├── src/                          # Source code
│   ├── agents/                   # AI agent orchestration
│   ├── commands/                 # VS Code command implementations
│   ├── llms/                     # AI provider integrations
│   ├── services/                 # Core business logic
│   │   ├── vector-database.service.ts         # Vector database integration
│   │   ├── smart-context-extractor.ts         # Context extraction service
│   │   ├── enhanced-prompt-builder.service.ts # Prompt engineering
│   │   ├── embedding-service.ts               # Code embedding service
│   │   ├── documentation-generator.service.ts # Documentation generation
│   │   └── codebase-understanding.service.ts  # Codebase analysis
│   ├── webview-providers/        # VS Code webview providers
│   ├── infrastructure/           # Infrastructure layer
│   └── extension.ts              # Main extension entry point
├── webviewUi/                    # React-based chat interface
├── docs/                         # Documentation
└── package.json                  # Extension configuration
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch** from `development`
3. **Install dependencies**: `npm install`
4. **Start development**: Run → Start Debugging (F5)
5. **Make your changes** in the new VS Code instance
6. **Test thoroughly** with various scenarios
7. **Submit a pull request**

### Development Setup

- Main entry point: `src/extension.ts`
- React UI entry: `webviewUi/src/App.tsx`
- Testing: New VS Code instance opens automatically
- Build: `npm run compile` and `npm run build:webview`

For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md)

## 🛠️ Troubleshooting

### Common Issues

**❓ Vector database not working**

- Check if API key is properly configured for embeddings
- Use "CodeBuddy: Vector Database Diagnostic" command
- Try "CodeBuddy: Force Full Reindex" to rebuild the database
- Check the output panel for detailed error messages

**❓ API Key Issues**

- Verify your API key is correctly entered in VS Code settings
- Check that you've selected the matching AI model
- Ensure your API key has sufficient credits/quota

**❓ Documentation generation fails**

- Make sure you have proper file permissions in the workspace
- Check that your project structure is supported
- Review the output panel for detailed error messages

**❓ Performance Issues**

- Try switching to a faster AI model (Groq is typically fastest)
- Clear the extension cache: Use "CodeBuddy: Restart" command
- Check your internet connection stability

### Getting Help

- 📖 Check our [documentation](docs/)
- 🐛 Report issues on [GitHub](https://github.com/olasunkanmi-SE/codebuddy/issues)
- 💬 Join our community discussions
- 📧 Contact: oyinolasunkanmi@gmail.com

## 📊 Analytics & Performance

- **Bundle Size**: ~8.99MB (Extension) + ~397KB (UI)
- **Supported Languages**: TypeScript, JavaScript, React, Vue, Python, Java, C++, and more
- **VS Code Version**: 1.78.0+
- **AI Models**: 5 providers supported (Gemini, Anthropic, Groq, Deepseek, XGrok)
- **Database**: SQLite for metadata, LanceDB for vector embeddings
- **Vector Database**: Apache Arrow format with high-performance search
- **Memory Management**: Intelligent caching and cleanup mechanisms

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🌟 Support the Project

If CodeBuddy enhances your development workflow:

- ⭐ Star the repository
- 📝 Leave a review on the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)
- 🐛 Report bugs or suggest features
- 🤝 Contribute to the codebase
- 💬 Share with fellow developers

---

**Made with ❤️ by [Olasunkanmi Raymond](https://olasunkanmi.app)**

_Transform your coding experience with AI-powered assistance. Install CodeBuddy today and code smarter, not harder!_

[![Install Now](https://img.shields.io/badge/Install%20Now-VS%20Code%20Marketplace-blue?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=fiatinnovations.ola-code-buddy)

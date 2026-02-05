import { FAQItem } from "../components/accordion";

export const modelOptions = [
  { value: "Gemini", label: "Google Gemini" },
  { value: "Anthropic", label: "Anthropic Claude" },
  { value: "Groq", label: "Groq (Llama)" },
  { value: "Deepseek", label: "Deepseek" },
  { value: "OpenAI", label: "OpenAI" },
  { value: "Qwen", label: "Alibaba Qwen" },
  { value: "GLM", label: "Zhipu GLM" },
  { value: "Local", label: "Local (OpenAI Compatible)" },
];

export const codeBuddyMode = [
  { value: "Agent", label: "Agent" },
  { value: "Ask", label: "Ask" },
];

export const themeOptions = [
  { value: "tokyo night", label: "Tokyo Night" },
  { value: "Atom One Dark", label: "Atom One Dark" },
  { value: "github dark", label: "GitHub Dark" },
  { value: "night owl", label: "Night Owl" },
  { value: "stackoverflow", label: "Stack Overflow" },
  { value: "Code Pen", label: "Code Pen" },
  { value: "ir black", label: "IR Black" },
  { value: "felipec", label: "Felipec" },
  { value: "Atom One Dark Reasonable", label: "Atom One Dark Reasonable" },
];

export const PREDEFINED_LOCAL_MODELS = [
  {
    value: "qwen2.5-coder",
    label: "Qwen 2.5 Coder (7B)",
    description: "Excellent for code tasks - Recommended",
  },
  {
    value: "qwen2.5-coder:3b",
    label: "Qwen 2.5 Coder (3B)",
    description: "Faster, lighter coding model",
  },
  {
    value: "llama3.2",
    label: "Llama 3.2 (3B)",
    description: "Efficient general purpose model",
  },
  {
    value: "deepseek-coder",
    label: "DeepSeek Coder",
    description: "Strong code completion capabilities",
  },
  {
    value: "codellama",
    label: "CodeLlama (7B)",
    description: "Meta's code-focused model",
  },
];

export const faqItems: FAQItem[] = [
  {
    question: "HOW DO I SET UP CODEBUDDY?",
    answer: `<p>Setting up CodeBuddy is simple:</p>
      <ol>
          <li>Obtain API keys for one of the supported LLMs: Gemini, Anthropic, Deepseek, OpenAI, Qwen, GLM, Groq, XGrok, or use a Local model</li>
          <li>Open VS Code settings (File > Preferences > Settings)</li>
          <li>Search for "CodeBuddy" in the settings search bar</li>
          <li>Select your preferred AI model from the dropdown</li>
          <li>Enter your API key (or Base URL for Local models) in the appropriate field</li>
          <li>Save your settings and restart VS Code if needed</li>
      </ol>
    <p>That's it! CodeBuddy should now be ready to assist you.</p>`,
  },
  {
    question: "WHICH AI MODELS WORK BEST WITH CODEBUDDY?",
    answer: `<p>For optimal performance with CodeBuddy, we recommend:</p>
        <h3>Cloud Models:</h3>
        <ul>
            <li><strong>Gemini:</strong> Gemini 2.5 Pro (default) provides excellent reasoning and coding results</li>
            <li><strong>Anthropic:</strong> Claude Sonnet 4.5 (default) is excellent for complex architectural reasoning</li>
            <li><strong>Deepseek:</strong> DeepSeek-V3 or R1 models are highly capable for coding tasks</li>
            <li><strong>OpenAI:</strong> GPT-4o offers robust general-purpose coding assistance</li>
            <li><strong>Qwen:</strong> Qwen-Max and Qwen3-Coder models are strong contenders</li>
            <li><strong>Groq:</strong> Offers ultra-fast inference with Llama 3.1 70B</li>
            <li><strong>GLM:</strong> GLM-4 from Zhipu AI for Chinese and English support</li>
            <li><strong>XGrok:</strong> xAI's Grok models for alternative reasoning</li>
        </ul>
        <h3>Local Models (Privacy-First):</h3>
        <ul>
            <li><strong>Qwen 2.5 Coder (7B):</strong> Excellent code understanding and generation - <em>recommended for local use</em></li>
            <li><strong>Qwen 2.5 Coder (3B):</strong> Faster, lighter version for quick tasks</li>
            <li><strong>DeepSeek Coder:</strong> Strong performance on coding benchmarks</li>
            <li><strong>CodeLlama:</strong> Meta's code-specialized model</li>
            <li><strong>Llama 3.2:</strong> Good general-purpose model that handles code well</li>
        </ul>
        <p><strong>Tip:</strong> Local models via Ollama work great for both Chat and Agent modes, keeping your code completely private!</p>
        <p>The best model depends on your use case: cloud models for maximum capability, local models for privacy and offline access.</p>`,
  },
  {
    question: "HOW DO I USE THE AGENT MODE?",
    answer: `<p>To use CodeBuddy's Agent Mode:</p>
      <ol>
          <li>Ensure you've selected a model in the settings</li>
          <li>Agent mode works with all supported models: Gemini, Anthropic, Deepseek, OpenAI, Qwen, GLM, Groq, XGrok, and <strong>Local models</strong></li>
          <li>Open the CodeBuddy sidebar in VS Code</li>
          <li>Select "Agent" mode from the mode switcher at the top</li>
      </ol>
      <h3>What Agent Mode Does:</h3>
      <ul>
          <li><strong>File Operations:</strong> Read, write, and edit files in your workspace</li>
          <li><strong>Web Search:</strong> Search for documentation, solutions, and best practices</li>
          <li><strong>Code Analysis:</strong> Analyze your codebase structure and dependencies</li>
          <li><strong>Context Awareness:</strong> Automatically includes your active file and @mentioned files</li>
      </ul>
      <h3>Using Local Models with Agent:</h3>
      <p>Local models like <strong>Qwen 2.5 Coder</strong> (via Ollama) fully support Agent mode, allowing you to:</p>
      <ul>
          <li>Keep all your code completely private (nothing leaves your machine)</li>
          <li>Work offline without internet connectivity</li>
          <li>Avoid API costs for frequent usage</li>
      </ul>
      <p><strong>Tip:</strong> The smart context system respects local model token limits (typically 4K tokens), automatically selecting the most relevant code snippets.</p>`,
  },
  {
    question: "HOW DO I INSTALL LOCAL MODELS?",
    answer: `<p>To run local models with CodeBuddy, you need a local LLM server compatible with OpenAI's API format.</p>
    
    <h3>Option 1: CodeBuddy Settings UI (Easiest)</h3>
    <ol>
      <li>Open CodeBuddy sidebar and go to <strong>Settings → Local Models</strong></li>
      <li>Click <strong>"Start Server"</strong> to launch Ollama via Docker Compose</li>
      <li>Select a model from the predefined list (e.g., Qwen 2.5 Coder, Llama 3.2)</li>
      <li>Click <strong>"Pull"</strong> to download the model</li>
      <li>Once pulled, click <strong>"Use"</strong> to configure CodeBuddy to use it</li>
    </ol>
    <p><em>The UI shows model status, allows pulling/deleting models, and automatically configures the API endpoint.</em></p>
    
    <h3>Option 2: Ollama (Manual)</h3>
    <ol>
      <li>Download and install Ollama from <a href="https://ollama.com">ollama.com</a></li>
      <li>Run a model in your terminal: <code>ollama run qwen2.5-coder</code> or <code>ollama run llama3</code></li>
      <li>In CodeBuddy settings:
        <ul>
          <li>Set Model to <strong>Local</strong></li>
          <li>Set Base URL to <code>http://localhost:11434/v1</code></li>
          <li>Set Model Name to the model you pulled (e.g., <code>qwen2.5-coder</code>)</li>
        </ul>
      </li>
    </ol>
    
    <h3>Option 3: LM Studio</h3>
    <ol>
      <li>Download LM Studio from <a href="https://lmstudio.ai">lmstudio.ai</a></li>
      <li>Load a model and start the "Local Server"</li>
      <li>In CodeBuddy settings, use the URL provided by LM Studio (usually <code>http://localhost:1234/v1</code>)</li>
    </ol>
    
    <h3>Option 4: Docker Compose (Recommended for Teams)</h3>
    <p>Use the built-in Docker Compose support with 32GB memory allocation:</p>
    <ol>
      <li>Click <strong>"Start Server"</strong> in Settings → Local Models, or run: <code>docker compose -f docker-compose.yml up -d</code></li>
      <li>Pull a model via UI or: <code>docker exec -it ollama ollama pull qwen2.5-coder</code></li>
      <li>CodeBuddy auto-connects to <code>http://localhost:11434/v1</code></li>
    </ol>
    
    <h3>Recommended Models for Coding:</h3>
    <ul>
      <li><strong>qwen2.5-coder (7B)</strong> - Excellent for code generation and understanding</li>
      <li><strong>qwen2.5-coder:3b</strong> - Faster, lighter version for quick tasks</li>
      <li><strong>deepseek-coder</strong> - Strong code completion capabilities</li>
      <li><strong>codellama</strong> - Meta's code-focused model</li>
    </ul>
    
    <p><strong>Note:</strong> Local models work with both Chat and Agent modes in CodeBuddy!</p>`,
  },
  {
    question: "WHAT ARE THE CODEBUDDY AGENT CAPABILITIES?",
    answer: `<p>The CodeBuddy Agent is a sophisticated AI-powered assistant integrated within VS Code that offers several advanced capabilities to enhance your coding experience:</p>
      <h3>Detailed Capabilities</h3>
      <ol>
        <li><strong>Reasoning Ability</strong>
          <ul>
            <li>Can understand complex coding questions and requirements</li>
            <li>Provides logical explanations for coding solutions</li>
            <li>Helps troubleshoot bugs by analyzing code logic</li>
            <li>Offers architectural recommendations with supporting rationale</li>
          </ul>
        </li>
        <li><strong>Web Search Integration</strong>
          <ul>
            <li>Searches the internet for relevant coding documentation</li>
            <li>Finds solutions to specific error messages or bugs</li>
            <li>Gathers information about libraries, frameworks, and best practices</li>
            <li>Stays current with the latest programming techniques and standards</li>
          </ul>
        </li>
        <li><strong>Workspace File Access</strong>
          <ul>
            <li>Reads and analyzes files within your VS Code workspace</li>
            <li>Understands project structure and dependencies</li>
            <li>Examines related code files for context when solving problems</li>
            <li>Can reference existing implementations to maintain code consistency</li>
          </ul>
        </li>
        <li><strong>Smart Context Selection</strong>
          <ul>
            <li>Automatically includes your active file as context</li>
            <li>Respects token limits based on your model (4K for local, 20K+ for cloud)</li>
            <li>Prioritizes @mentioned files over auto-gathered context</li>
            <li>Uses relevance scoring to select the most helpful code snippets</li>
          </ul>
        </li>
        <li><strong>RAG-Based Architecture</strong> (Retrieval-Augmented Generation)
          <ul>
            <li>Combines knowledge retrieval with generative AI capabilities</li>
            <li>Provides more accurate and contextually relevant responses</li>
            <li>Accesses specialized coding knowledge beyond its base training</li>
            <li>Offers higher-quality solutions by retrieving pertinent information before generating responses</li>
          </ul>
        </li>
      </ol>
      <p>The CodeBuddy Agent is specifically designed to function as your intelligent coding companion, helping you write better, more efficient code while saving time on research and debugging.</p>
      <p><strong>Supported Models:</strong> Agent mode works with Gemini, Anthropic, Deepseek, OpenAI, Qwen, GLM, Groq, XGrok, and <strong>Local models</strong> (like Qwen 2.5 Coder via Ollama).</p>`,
  },

  {
    question: "CAN I DOWNLOAD MY CHAT HISTORY",
    answer: `<p>Yes you can! CodeBuddy gives you full control over your data:</p>
    <ul>
      <li><strong>Local Storage:</strong> All chat history is stored in a <code>.codebuddy</code> folder at the root of your workspace</li>
      <li><strong>Gitignored:</strong> This folder is automatically added to .gitignore to prevent accidentally committing sensitive conversations</li>
      <li><strong>JSON Format:</strong> Chat history is stored in JSON format, making it easy to read, parse, or migrate</li>
      <li><strong>Future Features:</strong> Logs and additional data will also be stored here</li>
    </ul>
    <p>To clear your history, go to Settings (gear icon) → Privacy → Clear Chat History.</p>`,
  },
  {
    question: "HOW DO I ACCESS SETTINGS?",
    answer: `<p>CodeBuddy offers a comprehensive settings panel accessed via the <strong>gear icon (⚙️)</strong> in the sidebar:</p>
    <h3>Settings Panel Categories:</h3>
    <ul>
      <li><strong>Account:</strong> Your profile and account information</li>
      <li><strong>General:</strong> Theme, language, font settings, nickname, and streaming preferences</li>
      <li><strong>Agents:</strong> Configure Agent mode behavior, auto-approve actions, file/terminal permissions</li>
      <li><strong>MCP:</strong> Add and manage Model Context Protocol servers</li>
      <li><strong>Conversation:</strong> Chat display preferences and history management</li>
      <li><strong>Models:</strong> AI model selection and configuration</li>
      <li><strong>Context:</strong> Workspace indexing and context window settings</li>
      <li><strong>Rules & Subagents:</strong> Custom rules and specialized subagent configuration</li>
      <li><strong>Privacy:</strong> Data privacy settings and clear data options</li>
      <li><strong>Beta:</strong> Experimental features</li>
      <li><strong>About:</strong> Version info and links</li>
    </ul>
    <p><strong>Tip:</strong> Use the search bar at the top of the settings panel to quickly find specific settings!</p>`,
  },
  {
    question: "WHAT ARE MCP SERVERS?",
    answer: `<p><strong>MCP (Model Context Protocol)</strong> servers extend CodeBuddy's capabilities by providing additional tools and context sources:</p>
    <h3>What MCP Servers Do:</h3>
    <ul>
      <li><strong>Add New Tools:</strong> Connect external services like databases, APIs, or specialized tools</li>
      <li><strong>Extend Context:</strong> Provide additional context from external sources</li>
      <li><strong>Custom Integrations:</strong> Build your own MCP servers for proprietary systems</li>
    </ul>
    <h3>How to Add an MCP Server:</h3>
    <ol>
      <li>Go to Settings (gear icon) → MCP</li>
      <li>Click "Add Server"</li>
      <li>Enter the server name and configuration</li>
      <li>The server's tools become available to the Agent</li>
    </ol>
    <p>MCP follows an open protocol, allowing community-created servers to integrate seamlessly with CodeBuddy.</p>`,
  },
  {
    question: "WHAT ARE CUSTOM RULES AND SUBAGENTS?",
    answer: `<p>Custom Rules and Subagents help you tailor CodeBuddy to your specific workflow:</p>
    <h3>Custom Rules:</h3>
    <ul>
      <li><strong>Project-Specific Guidelines:</strong> Define coding conventions for your project (e.g., "Always use TypeScript strict mode")</li>
      <li><strong>Appended to System Prompt:</strong> Rules are added to the AI's instructions, influencing all responses</li>
      <li><strong>Toggleable:</strong> Enable/disable rules as needed without deleting them</li>
      <li><strong>Examples:</strong>
        <ul>
          <li>"Use functional components over class components"</li>
          <li>"Follow our internal naming conventions: camelCase for variables, PascalCase for components"</li>
          <li>"Always add error handling with try/catch blocks"</li>
        </ul>
      </li>
    </ul>
    <h3>Subagents:</h3>
    <p>Subagents are specialized AI agents that can be delegated specific tasks:</p>
    <ul>
      <li><strong>Code Analyzer:</strong> Deep code analysis, security scanning, architecture review</li>
      <li><strong>Documentation Writer:</strong> Generate comprehensive documentation and API references</li>
      <li><strong>Debugger:</strong> Find and fix bugs with full tool access</li>
      <li><strong>File Organizer:</strong> Restructure and organize project files</li>
    </ul>
    <p>Configure both in Settings (gear icon) → Rules & Subagents.</p>`,
  },
  {
    question: "WHAT COMMANDS ARE AVAILABLE?",
    answer: `<p>CodeBuddy provides many commands accessible via the Command Palette (Cmd/Ctrl+Shift+P):</p>
    <h3>Code Actions (require text selection):</h3>
    <ul>
      <li><strong>Add Comment:</strong> Add intelligent comments to selected code</li>
      <li><strong>Review Code:</strong> Get code review feedback and suggestions</li>
      <li><strong>Refactor:</strong> Intelligent code refactoring suggestions</li>
      <li><strong>Optimize:</strong> Performance optimization recommendations</li>
      <li><strong>Explain Code:</strong> Get detailed explanations of selected code</li>
      <li><strong>Generate Architectural Diagram:</strong> Create Mermaid diagrams from code</li>
      <li><strong>Interview Me:</strong> Practice coding interviews</li>
    </ul>
    <h3>Global Commands:</h3>
    <ul>
      <li><strong>Generate Commit Message:</strong> AI-powered commit message from staged changes</li>
      <li><strong>Inline Chat:</strong> Quick AI chat without leaving your editor</li>
      <li><strong>Analyze Codebase:</strong> Get answers about your entire codebase</li>
      <li><strong>Review Pull Request:</strong> AI-powered PR review</li>
      <li><strong>Index Workspace:</strong> Index your codebase for semantic search</li>
      <li><strong>Toggle Inline Completions:</strong> Enable/disable ghost text suggestions</li>
    </ul>
    <h3>Project Rules Commands:</h3>
    <ul>
      <li><strong>Open Project Rules:</strong> View/edit .codebuddy/rules.md</li>
      <li><strong>Initialize Project Rules:</strong> Create rules.md template</li>
      <li><strong>Reload Project Rules:</strong> Refresh rules from file</li>
    </ul>
    <p>Search for "CodeBuddy" in the Command Palette to see all available commands.</p>`,
  },
  {
    question: "WHAT KEYBOARD SHORTCUTS ARE AVAILABLE?",
    answer: `<p>CodeBuddy provides keyboard shortcuts for quick access to common features:</p>
    <h3>Code Actions (require text selection):</h3>
    <ul>
      <li><strong>Add Comment:</strong> <code>Cmd+Shift+J</code> (Mac) / <code>Ctrl+Shift+J</code> (Win)</li>
      <li><strong>Review Code:</strong> <code>Cmd+Shift+R</code> (Mac) / <code>Ctrl+Shift+R</code> (Win)</li>
      <li><strong>Refactor:</strong> <code>Cmd+Shift+;</code> (Mac) / <code>Ctrl+Shift+;</code> (Win)</li>
      <li><strong>Optimize:</strong> <code>Cmd+Shift+0</code> (Mac) / <code>Ctrl+Shift+0</code> (Win)</li>
      <li><strong>Explain Code:</strong> <code>Cmd+Shift+1</code> (Mac) / <code>Ctrl+Shift+1</code> (Win)</li>
      <li><strong>Generate Diagram:</strong> <code>Cmd+Shift+7</code> (Mac) / <code>Ctrl+Shift+7</code> (Win)</li>
    </ul>
    <h3>Global Shortcuts:</h3>
    <ul>
      <li><strong>Generate Commit:</strong> <code>Cmd+Shift+2</code> (Mac) / <code>Ctrl+Shift+2</code> (Win)</li>
      <li><strong>Codebase Analysis:</strong> <code>Cmd+Shift+6</code> (Mac) / <code>Ctrl+Shift+6</code> (Win)</li>
      <li><strong>Inline Chat:</strong> <code>Cmd+Shift+8</code> (Mac) / <code>Ctrl+Shift+8</code> (Win)</li>
      <li><strong>Open Project Rules:</strong> <code>Cmd+Shift+9</code> (Mac) / <code>Ctrl+Shift+9</code> (Win)</li>
    </ul>
    <p><strong>Tip:</strong> You can also access all commands from the right-click context menu when you have code selected!</p>`,
  },
  {
    question: "CHAT MODE VS AGENT MODE - WHAT'S THE DIFFERENCE?",
    answer: `<p>CodeBuddy offers two distinct modes for different use cases:</p>
    <h3>Chat Mode (Ask Mode):</h3>
    <ul>
      <li><strong>Simple Q&A:</strong> Ask coding questions and get responses</li>
      <li><strong>No File Modifications:</strong> The AI cannot directly edit files</li>
      <li><strong>Faster Responses:</strong> Less overhead, quicker for simple questions</li>
      <li><strong>Best For:</strong> Quick questions, learning concepts, getting code snippets</li>
    </ul>
    <h3>Agent Mode:</h3>
    <ul>
      <li><strong>Autonomous Execution:</strong> The AI can read/write files, run commands, search the web</li>
      <li><strong>Multi-Step Tasks:</strong> Can complete complex tasks involving multiple files</li>
      <li><strong>Tool Access:</strong> Full access to CodeBuddy's tool suite</li>
      <li><strong>Approval System:</strong> You can review and approve actions before execution</li>
      <li><strong>Best For:</strong> Refactoring, implementing features, debugging, project-wide changes</li>
    </ul>
    <h3>When to Use Each:</h3>
    <ul>
      <li><strong>Use Chat Mode</strong> when you need quick answers or want to stay in control of all edits</li>
      <li><strong>Use Agent Mode</strong> when you want the AI to actively help implement changes</li>
    </ul>
    <p>Switch between modes using the dropdown at the top of the sidebar or in Settings → Agents.</p>`,
  },
  {
    question: "WHAT IS THE ACTIVE WORKSPACE",
    answer: `<p>The <strong>Active Workspace</strong> display shows your current working context in CodeBuddy, dynamically updating as you navigate your project:</p>

<h3>How It Works:</h3>
<ul>
    <li><strong>Shows Current File:</strong> When you have a file open, it displays the relative path from your workspace root (e.g., <code>src/components/App.tsx</code>)</li>
    <li><strong>Auto-Updates:</strong> Automatically changes when you switch between files in VS Code</li>
    <li><strong>Untitled Files:</strong> Shows empty when editing unsaved/untitled files</li>
    <li><strong>Workspace Fallback:</strong> When no file is open, shows your workspace folder name</li>
</ul>

<h3>Context Integration:</h3>
<ul>
    <li><strong>Automatic Context:</strong> The currently displayed active file is <strong>automatically included as context</strong> when you send a message</li>
    <li><strong>Combined with @ Mentions:</strong> If you also add files using <strong>@file</strong> mentions, both the active file and @mentioned files are included together</li>
    <li><strong>Smart Deduplication:</strong> If you @mention the same file that's active, it won't be added twice</li>
</ul>

<p>This means CodeBuddy always has awareness of what you're currently working on, providing more relevant and contextual responses.</p>
`,
  },
  {
    question: "WHAT IS THE CHAT CONTEXT AND HOW CAN I USE @ MENTIONS?",
    answer: `

<p>Chat Context in CodeBuddy allows you to provide relevant files to the AI model for more accurate, contextual responses. With the new <strong>@ mention</strong> feature, adding context is easier than ever!</p>

<h3>How to Add Context:</h3>
<ul>
    <li><strong>Type @</strong> in the chat input to open the file selector</li>
    <li><strong>Fuzzy Search:</strong> Start typing any part of a filename to quickly filter results</li>
    <li><strong>Visual Icons:</strong> Files display with appropriate icons (📄 for files, 📁 for folders)</li>
    <li><strong>Full Paths:</strong> See the complete path to avoid confusion with similarly named files</li>
    <li><strong>Keyboard Navigation:</strong> Use ↑/↓ arrows and Enter to select files quickly</li>
</ul>

<h3>Smart Context Selection:</h3>
<p>CodeBuddy uses intelligent context management to stay within model limits:</p>
<ul>
    <li><strong>Token Budget Aware:</strong> Automatically adjusts context size based on your model's limits (4K for local models, 20K+ for cloud models)</li>
    <li><strong>Priority System:</strong> Your @mentioned files get highest priority, followed by the active file, then auto-gathered context</li>
    <li><strong>Relevance Scoring:</strong> When auto-gathering context, snippets are ranked by relevance to your question</li>
    <li><strong>Smart Extraction:</strong> Extracts function signatures and key code blocks rather than full files when space is limited</li>
</ul>

<h3>Context Sources (in priority order):</h3>
<ol>
    <li><strong>@ Mentioned Files:</strong> Files you explicitly select using @filename</li>
    <li><strong>Active File:</strong> The file currently displayed in your "Active workspace" (auto-included)</li>
    <li><strong>Auto-Gathered:</strong> Relevant code snippets found through codebase search (when asking codebase-related questions)</li>
</ol>

<h3>When to Use @ Mentions:</h3>
<ul>
    <li>When debugging issues that involve specific files</li>
    <li>When asking about implementation details in particular components</li>
    <li>When you want the AI to understand relationships between multiple files</li>
    <li>When seeking code review or optimization for specific files</li>
</ul>

<p>By combining automatic active file context with manual @ mentions, CodeBuddy understands your project deeply and provides highly relevant assistance.</p>
`,
  },

  {
    question: "APPLICATION GIVES CONTINUOUS ERROR",
    answer: `<p>If you're experiencing continuous errors, try these troubleshooting steps:</p>
    <ol>
      <li><strong>Clear Chat History:</strong> Go to Settings (gear icon) → Conversation or Privacy → Clear Chat History</li>
      <li><strong>Check API Key:</strong> Ensure your API key is correctly entered in VS Code settings</li>
      <li><strong>Verify Model Selection:</strong> Make sure you've selected a model that matches your API key</li>
      <li><strong>Check Connection:</strong> For cloud models, ensure you have internet connectivity</li>
      <li><strong>Local Model Issues:</strong> Verify Ollama/LM Studio is running and the model is loaded</li>
      <li><strong>Restart VS Code:</strong> Sometimes a fresh restart resolves connection issues</li>
      <li><strong>Check Output Panel:</strong> View → Output → Select "CodeBuddy" to see detailed error logs</li>
    </ol>
    <p>If issues persist, please report them on our <a href="https://github.com/olasunkanmi-SE/codebuddy/issues">GitHub Issues</a> page with the error details.</p>`,
  },
  {
    question: "DATA PRIVACY",
    answer: `<p>CodeBuddy is designed with your privacy as a priority:</p>
      <ul>
          <li>All user data and conversations remain within your local VS Code environment</li>
          <li>Your code snippets, queries, and chat history are stored locally in a .codebuddy file (which is automatically gitignored)</li>
          <li>When using cloud AI models (Gemini, Anthropic, OpenAI, etc.), your queries are sent directly to these services using your personal API keys</li>
          <li><strong>Local models (Ollama/LM Studio) keep everything on your machine</strong> - no data leaves your computer</li>
          <li>CodeBuddy itself does not collect, store, or transmit your data to any external servers</li>
          <li>Your API keys are stored securely in your VS Code settings</li>
          <li>The active file context feature sends only what's visible in your "Active workspace" display</li>
          <li>Smart context selection limits what code is sent based on token budgets</li>
      </ul>
      <p>For optimal privacy:</p>
      <ul>
          <li><strong>Use Local models</strong> for sensitive/proprietary code - nothing leaves your machine</li>
          <li>Regularly clear your chat history if working with sensitive code</li>
          <li>Be mindful of what code snippets you share with cloud LLM services</li>
          <li>Review the privacy policies of the specific AI model providers you choose to use</li>
      </ul>
      <p>We're committed to ensuring your code and data remain under your control at all times.</p>`,
  },
  {
    question: "CONTRIBUTION",
    answer: `<p>Codebuddy is an open source project and we appreciate contributions. New ideas from you can transform this extension into a better tool for everyone!</p>
    <ul>
      <li>Visit our <a href="https://github.com/olasunkanmi-SE/codebuddy">GitHub repository</a> to get started</li>
      <li>Check the issues section for open tasks or create a new one</li>
      <li>Fork the repository and submit pull requests with your improvements</li>
      <li>Contribute to documentation, add new features, or fix bugs</li>
      <li>Share your feedback and suggestions through GitHub issues</li>
    </ul>
    <p>Whether you're a developer, designer, or just have great ideas, your contributions help make Codebuddy more powerful and user-friendly. Join our community of contributors today!</p>`,
  },
  {
    question: "DISCOVER OUR ENGINEERING BLOG",
    answer: `<p>🚀 <strong>Dive into our Engineering Blog!</strong></p>
    <p>Curious about what powers CodeBuddy? Our engineering blog takes you behind the scenes with in-depth articles on:</p>
    <ul>
      <li>The comprehensive architecture that makes CodeBuddy possible</li>
      <li>Technical deep-dives into our latest features</li>
      <li>Best practices we've discovered along the way</li>
      <li>Challenges we've overcome and lessons learned</li>
    </ul>
    <p>Whether you're a developer interested in how we built CodeBuddy or just want to understand more about the tool you're using, our blog posts are written to both inform and inspire.</p>
    <p><a href="#">Coming soon</a></p>`,
  },
  {
    question: "HOW DO I CONNECT WITH THE FOUNDER",
    answer: `<p><strong>Oyinlola Olasunkanmi - Creator of CodeBuddy</strong></p>
    
    <p>Olasunkanmi continues to lead CodeBuddy's development, focusing on enhancing its AI capabilities while maintaining its developer-centric approach. His vision is to create a tool that serves as a true coding partner - one that understands your project, anticipates your needs, and respects your privacy.</p>
    
    <p>Connect with Olasunkanmi:</p>
    <ul>
    <li><a href="https://www.linkedin.com/in/oyinlola-olasunkanmi-raymond-71b6b8aa/">LinkedIn</a></li>
      <li><a href="https://github.com/olasunkanmi-SE">GitHub</a></li>
    </ul>`,
  },
];

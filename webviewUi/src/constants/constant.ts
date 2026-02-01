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
    value: "ai/llama3.2",
    label: "Llama 3.2 (3B)",
    description: "Efficient general purpose model",
  },
  {
    value: "ai/gemma3",
    label: "Gemma 3 (4B)",
    description: "Google's lightweight open model",
  },
  {
    value: "ai/qwen2.5",
    label: "Qwen 2.5 (7B)",
    description: "Strong general purpose model",
  },
  {
    value: "ai/mistral",
    label: "Mistral (7B)",
    description: "High performance general model",
  },
];

export const faqItems: FAQItem[] = [
  {
    question: "HOW DO I SET UP CODEBUDDY?",
    answer: `<p>Setting up CodeBuddy is simple:</p>
      <ol>
          <li>Obtain API keys for one of the supported LLMs: Gemini, Anthropic, Deepseek, OpenAI, Qwen, GLM, Groq, or use a Local model</li>
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
        <ul>
            <li><strong>Gemini:</strong> Gemini-2.0-flash or higher versions provide excellent results</li>
            <li><strong>Deepseek:</strong> DeepSeek-V3 or R1 models are highly capable for coding tasks</li>
            <li><strong>Anthropic:</strong> Claude 3.5 Sonnet is excellent for complex architectural reasoning</li>
            <li><strong>OpenAI:</strong> GPT-4o offers robust general-purpose coding assistance</li>
            <li><strong>Qwen:</strong> Qwen 2.5 Coder is a strong open-weight contender</li>
            <li><strong>Groq:</strong> Offers ultra-fast inference with Llama models</li>
            <li><strong>Local:</strong> Run your own models (like Llama 3, Mistral) via tools like Ollama or LM Studio</li>
        </ul>
        <p>The best model may depend on your specific use case and coding preferences.</p>`,
  },
  {
    question: "HOW DO I USE THE AGENT MODE?",
    answer: `<p>To use CodeBuddy's Agent Mode:</p>
      <ol>
          <li>Ensure you've selected a model in the settings</li>
          <li>Most supported models (Gemini, Anthropic, Deepseek, OpenAI, Qwen, GLM, Groq, Local) support agent functionality</li>
          <li>Open the CodeBuddy sidebar in VS Code</li>
          <li>Select "Agent" mode from the mode switcher</li>
      </ol>
      <p>Agent Mode allows CodeBuddy to use tools like file reading, writing, and web search to help you with your tasks.</p>`,
  },
  {
    question: "HOW DO I INSTALL LOCAL MODELS?",
    answer: `<p>To run local models with CodeBuddy, you need a local LLM server compatible with OpenAI's API format.</p>
    <h3>Option 1: Ollama (Recommended)</h3>
    <ol>
      <li>Download and install Ollama from <a href="https://ollama.com">ollama.com</a></li>
      <li>Run a model in your terminal: <code>ollama run llama3</code> or <code>ollama run deepseek-coder</code></li>
      <li>In CodeBuddy settings:
        <ul>
          <li>Set Model to <strong>Local</strong></li>
          <li>Set Base URL to <code>http://localhost:11434/v1</code></li>
          <li>Set Model Name to the model you pulled (e.g., <code>llama3</code>)</li>
        </ul>
      </li>
    </ol>
    <h3>Option 2: LM Studio</h3>
    <ol>
      <li>Download LM Studio from <a href="https://lmstudio.ai">lmstudio.ai</a></li>
      <li>Load a model and start the "Local Server"</li>
      <li>In CodeBuddy settings, use the URL provided by LM Studio (usually <code>http://localhost:1234/v1</code>)</li>
    </ol>
    <h3>Option 3: Docker (Ollama)</h3>
    <p>You can use the built-in Docker Compose support:</p>
    <ol>
      <li>In CodeBuddy settings, click <strong>"Start Server"</strong> under "Local Ollama (Docker Compose)".</li>
      <li>Or run manually: <code>docker compose up -d</code> (a <code>docker-compose.yml</code> file is included in the project root).</li>
      <li>Pull a model: <code>docker exec -it ollama ollama run llama3</code></li>
      <li>CodeBuddy connects to <code>http://localhost:11434/v1</code> by default.</li>
    </ol>
    <h3>Option 4: Docker Model Runner (Beta)</h3>
    <p>For Docker Desktop 4.40+ on macOS (Apple Silicon):</p>
    <ol>
      <li>Enable Model Runner with TCP: <code>docker desktop enable model-runner --tcp 12434</code> (or enable in Docker Desktop Settings > Beta Features)</li>
      <li>Pull a model (e.g., Llama 3.2): <code>docker model pull ai/llama3.2:3b</code></li>
      <li>In CodeBuddy settings:
        <ul>
          <li>Set Model to <strong>Local</strong></li>
          <li>Set Base URL to <code>http://localhost:12434/v1</code></li>
          <li>Set Model Name to the model you pulled (e.g., <code>ai/llama3.2:3b</code>)</li>
        </ul>
      </li>
    </ol>`,
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
      <p><strong>Note:</strong> The full Agent mode with all capabilities is exclusively available when using the Gemini model.</p>`,
  },

  {
    question: "CAN I DOWNLOAD MY CHAT HISTORY",
    answer: `Yes you can. This version of codebuddy give the data back to the user by creating a gitignored file called .codebuddy. This file can be found at the root level of your application. It houses your chatHistory and in the future, your logs.`,
  },
  {
    question: "WHAT IS THE ACTIVE WORKSPACE",
    answer: `<p>The active workspace displays the current working workspace of the user within VS Code, providing the following benefits:</p>

<ul>
    <li><strong>Workspace Context:</strong>Your current workspace appears at the top of the file and directory hierarchy as you navigate through your codebase, making it easier to stay oriented</li>
    <li><strong>Workspace Management:</strong> Particularly useful when different workspace is opened, as it confirms which project CodeBuddy is analyzing</li>
</ul>
`,
  },
  {
    question:
      "WHAT IS THE CHAT CONTEXT AND HOW CAN IT HELP ME TO ENHANCE MY CODING EXPERIENCE ",
    answer: `

<p>Chat Context in CodeBuddy is a powerful feature that allows you to add multiple files to provide relevant background information to the AI model when you ask questions. Here's how it works and why it's beneficial:</p>

<h3>How Chat Context Works:</h3> <ul> <li>When working on complex code problems, you can select specific files from your workspace to include as "context"</li> <li>These files are bundled together and sent to the LLM (Gemini, Anthropic, or Groq) along with your question</li> <li>The AI can then analyze these files to understand your codebase's structure, dependencies, and implementation details</li> <li>This gives the AI a more comprehensive understanding of your project, enabling it to provide more accurate and contextually relevant answers</li> </ul>

<h3>Benefits of Using Chat Context:</h3> <ul> <li><strong>More accurate responses:</strong> The AI can provide solutions that align with your existing code patterns and architectural decisions</li> <li><strong>Reduced explanation effort:</strong> Instead of describing your code structure in detail, you can simply include relevant files</li> <li><strong>Contextual debugging:</strong> Include error logs or problematic files to help the AI pinpoint issues faster</li> <li><strong>Project-aware recommendations:</strong> Receive suggestions that take into account your specific implementation, not just generic advice</li> <li><strong>Time savings:</strong> Eliminate back-and-forth exchanges where the AI requests more information about your code</li> </ul>

<h3>When to Use Chat Context:</h3> <ul> <li>When debugging complex issues that span multiple files</li> <li>When asking how to implement a feature that needs to integrate with your existing code</li> <li>When seeking code optimization advice for specific parts of your application</li> <li>When requesting explanations about code functionality across different components</li> </ul>

<p>By utilizing Chat Context, you transform CodeBuddy from a general coding assistant into a specialized collaborator that truly understands your unique project environment.</p> </div>
`,
  },

  {
    question: "APPLICATION GIVES CONTINUOUS ERROR",
    answer: "Clear your History.",
  },
  {
    question: "DATA PRIVACY",
    answer: `<p>CodeBuddy is designed with your privacy as a priority:</p>
      <ul>
          <li>All user data and conversations remain within your local VS Code environment</li>
          <li>Your code snippets, queries, and chat history are stored locally in a .codebuddy file (which is automatically gitignored)</li>
          <li>When using AI models (Gemini, Anthropic, or Groq), your queries are sent directly to these services using your personal API keys</li>
          <li>CodeBuddy itself does not collect, store, or transmit your data to any external servers</li>
          <li>Your API keys are stored securely in your VS Code settings</li>
          <li>When using Agent mode with web search, only your search queries are sent to external services, not your codebase</li>
      </ul>
      <p>For optimal privacy:</p>
      <ul>
          <li>Regularly clear your chat history if working with sensitive code</li>
          <li>Be mindful of what code snippets you share with the LLM services</li>
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

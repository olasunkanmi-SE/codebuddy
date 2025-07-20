import { FAQItem } from "../components/accordion";

export const modelOptions = [
  { value: "Gemini", label: "Gemini" },
  { value: "Anthropic", label: "Anthropic" },
  { value: "Groq", label: "Groq" },
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

export const faqItems: FAQItem[] = [
  {
    question: "HOW DO I SET UP CODEBUDDY?",
    answer: `<p>Setting up CodeBuddy is simple:</p>
      <ol>
          <li>Obtain API keys for one of the supported LLMs: Gemini, Anthropic, or Groq</li>
          <li>Open VS Code settings (File > Preferences > Settings)</li>
          <li>Search for "CodeBuddy" in the settings search bar</li>
          <li>Select your preferred AI model from the dropdown</li>
          <li>Enter your API key in the appropriate field</li>
          <li>Save your settings and restart VS Code if needed</li>
      </ol>
    <p>That's it! CodeBuddy should now be ready to assist you.</p>`,
  },
  {
    question: "WHICH AI MODELS WORK BEST WITH CODEBUDDY?",
    answer: `<p>For optimal performance with CodeBuddy, we recommend:</p>
        <ul>
            <li><strong>Gemini:</strong> Gemini-2.0-flash or higher versions provide excellent results</li>
            <li><strong>Groq:</strong> We recommend either:
                <ul>
                    <li>The latest Meta Llama models available through Groq</li>
                    <li>Any DeepSeek models provided by Groq</li>
                </ul>
            </li>
            <li><strong>Anthropic:</strong> Claude models work well for complex coding tasks</li>
        </ul>
        <p>The best model may depend on your specific use case and coding preferences.</p>`,
  },
  {
    question: "HOW DO I USE THE AGENT MODE?",
    answer: `<p>To use CodeBuddy's Agent Mode:</p>
      <ol>
          <li>First ensure you've selected "Gemini" as your model in the settings</li>
          <li>Gemini is currently the only LLM with full agent functionality support</li>
          <li>Open the CodeBuddy sidebar in VS Code</li>
      </ol>
      <p>Note: Agent Mode is exclusively available with the Gemini model for now</p>`,
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

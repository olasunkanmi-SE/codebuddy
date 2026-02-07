import { formatText } from "../utils/utils";
import { CodeCommandHandler } from "./handler";
import { CodebuddyAgentService } from "../agents/agentService";
import { WebViewProviderManager } from "../webview-providers/manager";
import { Logger, LogLevel } from "../infrastructure/logger/logger";
import { EditorHostService } from "../services/editor-host.service";

export class FixError extends CodeCommandHandler {
  constructor(action: string, context: any, error: string) {
    super(action, context, error);
  }

  async execute(action?: string, message?: string): Promise<void> {
    const logger = Logger.initialize("FixError", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    logger.info("Starting Auto-Fix execution");

    const selectedCode = this.getSelectedWindowArea();
    const errorMsg = this.error || message;

    if (!selectedCode && !errorMsg) {
      EditorHostService.getInstance()
        .getHost()
        .window.showErrorMessage("No error or code selected to fix.");
      return;
    }

    // Notify user we are trying to fix
    await EditorHostService.getInstance()
      .getHost()
      .window.withProgress(
        {
          location: "Notification",
          title: "CodeBuddy: Attempting to auto-fix error...",
          cancellable: true,
        },
        async (progress, token) => {
          try {
            const agentService = CodebuddyAgentService.getInstance();

            const prompt = `Task: Fix the following error in the current file.

Error Message:
${errorMsg}

Code Context:
${selectedCode}

Instructions:
1. Analyze the error and the code.
2. If you can fix it confidently, use the 'edit_file' tool to apply the fix directly.
3. If you apply a fix, verify it if possible (or at least ensure syntax is correct).
4. If you cannot fix it, or if it requires user input, provide a detailed explanation.
5. End your response with a summary of what you did.
`;

            let toolUsed = false;
            let agentResponse = "";

            // Run the agent
            for await (const event of agentService.runx(prompt)) {
              if (token.isCancellationRequested) {
                logger.info("Auto-fix cancelled by user");
                return;
              }

              // Check for tool usage
              // event.node === "tools" indicates tool execution
              // event.update?.messages?.[0]?.tool_calls indicates tool *request* (in agent node)
              if (
                event.node === "tools" ||
                event.update?.messages?.[0]?.tool_calls?.length > 0
              ) {
                toolUsed = true;
                progress.report({ message: "Applying fix..." });
              }

              // Check for reasoning/text
              if (event.node === "agent") {
                const content = event.update?.messages?.[0]?.content;
                if (typeof content === "string") {
                  agentResponse += content;
                  progress.report({ message: "Analyzing..." });
                }
              }
            }

            if (toolUsed) {
              EditorHostService.getInstance()
                .getHost()
                .window.showInformationMessage(
                  "CodeBuddy: Fix applied successfully!",
                );
            } else {
              // If no tool was used, it means the agent couldn't fix it or just explained it.
              // In this case, we "pass it to the webview" as requested.
              EditorHostService.getInstance()
                .getHost()
                .window.showInformationMessage(
                  "CodeBuddy: Could not auto-fix. Opening chat for details.",
                );

              // Send history/response to webview
              const providerManager = WebViewProviderManager.getInstance(
                this.context,
              );
              const provider = providerManager.getCurrentProvider();

              if (provider) {
                await EditorHostService.getInstance()
                  .getHost()
                  .commands.executeCommand("codebuddy.chatView.focus");
                // Post the agent's explanation to the chat
                await provider.currentWebView?.webview.postMessage({
                  type: "bot-response",
                  message:
                    agentResponse ||
                    "I analyzed the error but couldn't apply a fix automatically. Here is what I found...",
                });
              }
            }
          } catch (error: any) {
            logger.error("Auto-fix failed", error);
            EditorHostService.getInstance()
              .getHost()
              .window.showErrorMessage(`Auto-fix failed: ${error.message}`);

            // Fallback to legacy behavior (stream to chat)
            await super.execute(action, message);
          }
        },
      );
  }

  generatePrompt() {
    const PROMPT = `You are CodeBuddy, an expert debugging specialist. Analyze the error and provide a comprehensive fix with root cause analysis and prevention strategies.

## Error Analysis Framework

### 🚨 **Error Classification**
- **Type**: Syntax/Runtime/Logic/Type/Performance error
- **Severity**: CRITICAL/HIGH/MEDIUM/LOW
- **Impact**: What functionality is affected

### 🔍 **Root Cause Analysis**
Error Message: ${this.error ?? ""}

#### **Error Context**
1. **What Happened**: Immediate cause of the error
2. **Why It Happened**: Underlying conditions that led to the error
3. **When It Happens**: Specific scenarios or triggers
4. **Where It Originates**: Exact location and surrounding context

### 🛠️ **Complete Solution**

#### **Immediate Fix**
\`\`\`typescript
// Before: Error-prone code
function processData(data) {
  return data.map(item => item.value.toUpperCase()); // Error: item.value might be undefined
}

// After: Robust error handling
function processData(data: DataItem[]): string[] {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }
  
  return data
    .filter(item => item && typeof item.value === 'string')
    .map(item => item.value.toUpperCase());
}
// Fix: Added type safety, null checks, and input validation
\`\`\`

### 🛡️ **Defensive Programming**

#### **Error Prevention**
\`\`\`typescript
// Input validation
function validateInput(data: unknown): asserts data is ValidData {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid data format');
  }
}

// Graceful degradation
function safeProcess(data: any) {
  try {
    return processData(data);
  } catch (error:any) {
    this.logger.error('Processing failed:', error);
    return []; // Safe fallback
  }
}
\`\`\`

#### **Type Safety** (TypeScript)
\`\`\`typescript
interface DataItem {
  value: string;
  id: number;
}

function processData(data: DataItem[]): string[] {
  return data.map(item => item.value.toUpperCase());
}
\`\`\`

### 🧪 **Testing Strategy**
\`\`\`typescript
// Unit tests for error scenarios
describe('processData', () => {
  it('should handle empty arrays', () => {
    expect(processData([])).toEqual([]);
  });
  
  it('should handle null values', () => {
    expect(processData([{ value: null }])).toEqual([]);
  });
  
  it('should throw on invalid input', () => {
    expect(() => processData(null)).toThrow();
  });
});
\`\`\`

### 📊 **Error Monitoring**
\`\`\`typescript
// Logging and monitoring
function processWithLogging(data: any) {
  try {
    console.info('Processing started', { itemCount: data?.length });
    const result = processData(data);
    console.info('Processing completed', { resultCount: result.length });
    return result;
  } catch (error:any) {
    this.logger.error('Processing failed', { 
      error: error.message, 
      data: JSON.stringify(data, null, 2) 
    });
    throw error;
  }
}
\`\`\`

### 🔄 **Alternative Solutions**
1. **Option A**: Conservative approach with extensive validation
2. **Option B**: Performance-optimized with minimal checks
3. **Option C**: Functional approach with monadic error handling

### 🎯 **Prevention Checklist**
- [ ] Input validation implemented
- [ ] Error boundaries added
- [ ] Type safety enforced
- [ ] Unit tests cover error cases
- [ ] Logging and monitoring added
- [ ] Documentation updated

### 📚 **Best Practices Applied**
- **Fail Fast**: Validate inputs early
- **Graceful Degradation**: Provide fallbacks
- **Clear Error Messages**: Help debugging
- **Defensive Programming**: Assume inputs can be invalid

**Output**: Return only the corrected function(s) with comprehensive error handling and explanation of the fix strategy.`;
    return PROMPT.replace("{errorMessage}", this.error ?? "");
  }

  formatResponse(comment: string): string {
    return formatText(comment);
  }

  createPrompt(selectedCode: string): string {
    const prompt = this.generatePrompt();
    const fullPrompt = `${prompt} \n ${selectedCode}`;
    return fullPrompt;
  }
}

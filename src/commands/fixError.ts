import { formatText } from "../utils/utils";
import * as vscode from "vscode";
import { CodeCommandHandler } from "./handler";

export class FixError extends CodeCommandHandler {
  constructor(action: string, context: vscode.ExtensionContext, error: string) {
    super(action, context, error);
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

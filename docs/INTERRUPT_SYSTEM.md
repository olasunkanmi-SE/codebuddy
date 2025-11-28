# Human-in-the-Loop Interrupt System

## Overview

The CodeBuddy agent supports **human-in-the-loop (HITL) interrupts** for critical operations that require user approval before execution. This ensures safety and gives users control over file modifications.

## What Was Fixed

### ❌ **Before (Broken)**
```typescript
// In agent.ts line 152
interruptOn: {},  // Empty object - interrupts disabled!
```

The interrupt configuration method existed but was **never being used**. All file operations would execute without user approval.

### ✅ **After (Fixed)**
```typescript
// In agent.ts line 152
interruptOn: this.getInterruptConfiguration(),  // Properly configured!
```

Now interrupts are properly enabled for file write and edit operations.

## How It Works

### 1. Default Interrupt Configuration

By default, the following tools require user approval:

```typescript
{
  write_file: {
    allowedDecisions: ["approve", "edit", "reject"]
  },
  edit_file: {
    allowedDecisions: ["approve", "edit", "reject"]
  }
}
```

### 2. Decision Types

Users can make three types of decisions:

- **`approve`** - Execute the operation as proposed
- **`edit`** - Modify the operation before executing
- **`reject`** - Cancel the operation

### 3. Interrupt Flow

```
Agent wants to write file
  ↓
Interrupt triggered
  ↓
User presented with:
  - Tool name (write_file)
  - Tool input (file path, content)
  - Decision options (approve/edit/reject)
  ↓
User makes decision
  ↓
Agent proceeds based on decision
```

## Configuration

### Type Definitions

```typescript
/**
 * Human-in-the-loop interrupt decision types
 */
export type InterruptDecision = "approve" | "edit" | "reject";

/**
 * Configuration for a specific tool interrupt
 */
export interface IToolInterruptConfig {
  allowedDecisions: InterruptDecision[];
}

/**
 * Interrupt configuration for human-in-the-loop approval
 * Maps tool names to their interrupt configurations
 */
export type InterruptConfiguration = Record<string, IToolInterruptConfig>;
```

### Default Configuration

```typescript
private getInterruptConfiguration(): InterruptConfiguration {
  const defaultInterruptOn: InterruptConfiguration = {
    write_file: {
      allowedDecisions: ["approve", "edit", "reject"],
    },
    edit_file: {
      allowedDecisions: ["approve", "edit", "reject"],
    },
  };

  return this.config.interruptOn
    ? { ...defaultInterruptOn, ...this.config.interruptOn }
    : defaultInterruptOn;
}
```

## Customizing Interrupts

### Example 1: Add More Tools

```typescript
const agent = createAdvancedDeveloperAgent({
  interruptOn: {
    write_file: { allowedDecisions: ["approve", "edit", "reject"] },
    edit_file: { allowedDecisions: ["approve", "edit", "reject"] },
    delete_file: { allowedDecisions: ["approve", "reject"] },  // NEW
    run_command: { allowedDecisions: ["approve", "reject"] },  // NEW
  }
});
```

### Example 2: Approve-Only Mode

```typescript
const agent = createAdvancedDeveloperAgent({
  interruptOn: {
    write_file: { allowedDecisions: ["approve"] },  // Only approve, no edit/reject
    edit_file: { allowedDecisions: ["approve"] },
  }
});
```

### Example 3: Disable Interrupts

```typescript
const agent = createAdvancedDeveloperAgent({
  interruptOn: {}  // No interrupts - auto-approve everything (dangerous!)
});
```

### Example 4: Override Defaults

```typescript
const agent = createAdvancedDeveloperAgent({
  interruptOn: {
    // write_file and edit_file still use defaults
    // Add custom interrupt for new tool
    execute_code: { allowedDecisions: ["approve", "reject"] },
  }
});
```

## Implementation Details

### Agent Configuration

```typescript
// In DeveloperAgent.create()
return createDeepAgent({
  model: this.model,
  tools: this.tools,
  systemPrompt: this.getSystemPrompt(),
  backend: this.getBackendFactory(),
  store,
  checkpointer: checkPointer,
  name: "DeveloperAgent",
  subagents,
  interruptOn: this.getInterruptConfiguration(), // ✅ Properly configured
});
```

### Interrupt Handler (DeepAgents)

When an interrupt is triggered, DeepAgents will:

1. **Pause execution** at the tool call
2. **Save state** to checkpointer
3. **Wait for user decision**
4. **Resume execution** based on decision:
   - `approve` → Execute tool with original input
   - `edit` → Execute tool with modified input
   - `reject` → Skip tool execution, continue with next step

## UI Integration

### WebView Provider Example

```typescript
export class GeminiWebViewProvider {
  async handleInterrupt(interrupt: any) {
    // Show interrupt UI to user
    const decision = await this.showInterruptDialog({
      toolName: interrupt.toolName,
      toolInput: interrupt.toolInput,
      allowedDecisions: interrupt.allowedDecisions,
    });

    // Send decision back to agent
    await this.resumeWithDecision(interrupt.id, decision);
  }

  private async showInterruptDialog(options: any): Promise<InterruptDecision> {
    // Show modal with:
    // - Tool name and description
    // - Tool input (formatted)
    // - Buttons for each allowed decision
    
    return new Promise((resolve) => {
      this.postMessage({
        command: 'showInterrupt',
        data: options,
        callback: (decision: InterruptDecision) => resolve(decision)
      });
    });
  }
}
```

### Frontend UI Example

```tsx
function InterruptDialog({ interrupt, onDecision }) {
  return (
    <div className="interrupt-dialog">
      <h3>🛑 Approval Required</h3>
      <p>The agent wants to: <strong>{interrupt.toolName}</strong></p>
      
      <div className="tool-input">
        <h4>Details:</h4>
        <pre>{JSON.stringify(interrupt.toolInput, null, 2)}</pre>
      </div>

      <div className="actions">
        {interrupt.allowedDecisions.includes('approve') && (
          <button onClick={() => onDecision('approve')}>
            ✅ Approve
          </button>
        )}
        {interrupt.allowedDecisions.includes('edit') && (
          <button onClick={() => onDecision('edit')}>
            ✏️ Edit
          </button>
        )}
        {interrupt.allowedDecisions.includes('reject') && (
          <button onClick={() => onDecision('reject')}>
            ❌ Reject
          </button>
        )}
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Always Interrupt Destructive Operations

```typescript
interruptOn: {
  write_file: { allowedDecisions: ["approve", "edit", "reject"] },
  edit_file: { allowedDecisions: ["approve", "edit", "reject"] },
  delete_file: { allowedDecisions: ["approve", "reject"] },
  run_command: { allowedDecisions: ["approve", "reject"] },
}
```

### 2. Provide Clear Context

When showing interrupts to users, include:
- Tool name and description
- Full tool input (formatted)
- Expected outcome
- Potential risks

### 3. Save State

Always save agent state before showing interrupt:
```typescript
await checkpointer.put(config, checkpoint);
```

### 4. Handle Timeouts

Set reasonable timeouts for user decisions:
```typescript
const decision = await Promise.race([
  getUserDecision(),
  timeout(60000).then(() => 'reject')  // Auto-reject after 1 minute
]);
```

### 5. Log Decisions

Track user decisions for audit purposes:
```typescript
logger.info(`User decision for ${toolName}: ${decision}`, {
  toolInput,
  timestamp: Date.now(),
});
```

## Debugging

### Check Interrupt Configuration

```typescript
// In agent.ts
console.log('Interrupt config:', this.getInterruptConfiguration());
```

### Monitor Interrupts

```typescript
// In your code
agent.on('interrupt', (interrupt) => {
  console.log('Interrupt triggered:', interrupt);
});
```

### Test Interrupts

```typescript
// Trigger a file write to test
const result = await agent.invoke({
  messages: [{ role: 'user', content: 'Create a new file test.txt' }]
});

// Should pause at write_file and wait for approval
```

## Security Considerations

### 1. Never Auto-Approve Dangerous Operations

```typescript
// ❌ BAD - Auto-approves everything
interruptOn: {}

// ✅ GOOD - Requires approval for file operations
interruptOn: {
  write_file: { allowedDecisions: ["approve", "edit", "reject"] },
  edit_file: { allowedDecisions: ["approve", "edit", "reject"] },
}
```

### 2. Validate User Input

When allowing edits, validate the modified input:
```typescript
if (decision === 'edit') {
  const modifiedInput = validateToolInput(editedInput);
  if (!modifiedInput.isValid) {
    throw new Error('Invalid tool input');
  }
}
```

### 3. Limit Interrupt Scope

Only interrupt operations that truly need approval:
```typescript
// Don't interrupt read operations
interruptOn: {
  // read_file: NOT NEEDED
  write_file: { allowedDecisions: ["approve", "edit", "reject"] },
}
```

## Troubleshooting

### Interrupts Not Triggering

**Problem**: File operations execute without approval
**Solution**: 
1. Check `interruptOn` is not empty `{}`
2. Verify tool names match exactly (e.g., `write_file` not `writeFile`)
3. Ensure checkpointer is configured

### Can't Resume After Interrupt

**Problem**: Agent stuck after showing interrupt
**Solution**:
1. Verify state is saved to checkpointer
2. Check decision is sent back correctly
3. Ensure thread_id matches

### Edit Decision Not Working

**Problem**: Edited input not being used
**Solution**:
1. Verify `edit` is in `allowedDecisions`
2. Check modified input format matches tool schema
3. Ensure modified input is passed to tool correctly

## Summary

The interrupt system is now **fully functional**:

- ✅ **Properly configured** - Uses `getInterruptConfiguration()`
- ✅ **Type-safe** - Strong TypeScript types
- ✅ **Customizable** - Easy to add/remove interrupts
- ✅ **Documented** - Complete guide provided
- ✅ **Secure** - Defaults to requiring approval for file operations

Users now have **full control** over file modifications! 🛡️

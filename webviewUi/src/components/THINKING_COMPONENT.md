# Thinking Component Documentation

## Overview
The `ThinkingComponent` is a React component that handles model responses containing thinking processes. It separates the model's internal thought process (marked with `<think>...</think>` tags) from the regular response content and displays them in an intuitive, expandable UI.

## Features

### 1. **Automatic Content Parsing**
- Detects `<think>...</think>` tags in the response content
- Extracts thinking content and separates it from regular response
- Handles multiple thinking sections in a single response

### 2. **Expandable UI**
- Collapsible thinking section with a header similar to the attached image
- Visual indicators (✨ icon, "Thoughts (experimental)" label)
- Smooth expand/collapse animation
- "Auto" status indicator

### 3. **Copy Functionality**
- Separate copy button for thinking content only
- Visual feedback ("Copied!" message)
- Fallback for browsers without clipboard API support

### 4. **Accessibility**
- Proper ARIA attributes for screen readers
- Keyboard navigation support
- Focus management

## Usage

### Basic Usage
```tsx
import { ThinkingComponent } from './components/thinkingComponent';

// Content with thinking tags
const responseContent = `
<think>
I need to analyze this request carefully. The user is asking for a function that calculates the factorial of a number. I should provide both recursive and iterative solutions.
</think>

Here's a factorial function:

\`\`\`javascript
function factorial(n) {
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}
\`\`\`
`;

// Use the component
<ThinkingComponent content={responseContent} />
```

### Content Types Handled

1. **Content with thinking tags**
   - Shows expandable thinking section
   - Displays regular content below

2. **Content without thinking tags**
   - Shows only regular content
   - No thinking section displayed

3. **Multiple thinking sections**
   - Combines all thinking content
   - Shows in single expandable section

## Implementation Details

### Content Processing
The component uses a regular expression to parse content:
```javascript
const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
```

### Security
- Uses `DOMPurify` to sanitize HTML content
- Prevents XSS attacks while preserving formatting

### Styling
- Uses VS Code theme variables for consistent appearance
- Responsive design that works in webview environment
- Smooth transitions and hover effects

## Integration with Bot Messages

The component is integrated into the `BotMessage` component:
```tsx
// In botMessage.tsx
import { ThinkingComponent } from './thinkingComponent';

// Replace direct content rendering with:
<ThinkingComponent content={content} />
```

## Copy Functionality

### Main Response Copy
The main "MD" button copies the entire response but **excludes thinking content**:
```javascript
// Thinking tags are removed when copying main response
markdownContent = markdownContent.replace(/<think>([\s\S]*?)<\/think>/gi, '');
```

### Thinking Content Copy
The thinking section has its own copy button that copies **only the thinking content**:
```javascript
const copyThinkingContent = async () => {
  await navigator.clipboard.writeText(thinkingContent);
};
```

## Styling Classes

### Main Container
- `.thinking-container`: Main wrapper with border and background
- `.thinking-header`: Clickable header with hover effects
- `.thinking-content`: Expandable content area

### Interactive Elements
- `.thinking-copy-button`: Copy button for thinking content
- `.thinking-chevron`: Rotating chevron indicator
- `.thinking-status`: "Auto" status badge

## Browser Compatibility
- Modern browsers with clipboard API support
- Fallback methods for older browsers
- Graceful degradation for accessibility features

## Example Response Formats

### Simple Thinking
```
<think>Let me think about this problem step by step.</think>
Here's the solution...
```

### Multiple Thinking Sections
```
<think>First, I need to understand the requirements.</think>
Initial analysis shows...
<think>Now I should consider edge cases.</think>
The final implementation...
```

### Complex Thinking with Code
```
<think>
I need to:
1. Parse the input
2. Validate the data
3. Process the results

Let me start with input parsing...
</think>

Here's the complete solution:
\`\`\`javascript
// Implementation code here
\`\`\`
```

This component enhances the user experience by providing transparency into the model's reasoning process while keeping the interface clean and organized.

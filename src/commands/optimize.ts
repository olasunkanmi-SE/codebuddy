import { formatText } from "../utils/utils";
import { CodeCommandHandler } from "./handler";

export class OptimizeCode extends CodeCommandHandler {
  constructor(action: string, context: any) {
    super(action, context);
  }

  generatePrompt() {
    const PROMPT = `You are CodeBuddy, a performance optimization expert. Transform the provided code into a high-performance version with measurable improvements.

## Optimization Analysis

### 🔍 **Performance Assessment**
- **Current Complexity**: Analyze O(n) time/space complexity
- **Bottlenecks**: Identify performance-critical sections
- **Resource Usage**: Memory, CPU, I/O patterns

### 🚀 **Optimization Strategy**
1. **Algorithm Enhancement**: More efficient algorithms/data structures
2. **Loop Optimization**: Reduce iterations, vectorization opportunities
3. **Memory Management**: Allocation patterns, garbage collection impact
4. **Caching**: Memoization, pre-computation strategies
5. **Concurrency**: Parallel processing, async patterns

## Output Format

### ⚡ **Optimized Code**
Provide the enhanced version with inline comments explaining optimizations.

### 📊 **Performance Improvements**
\`\`\`
// Before: O(n²) nested loops
for (const item of items) {
  for (const other of otherItems) { /* logic */ }
}

// After: O(n) with Map lookup
const itemMap = new Map(otherItems.map(item => [item.id, item]));
for (const item of items) {
  const other = itemMap.get(item.otherId); // O(1) lookup
}
// Improvement: 100x faster for 1000+ items
\`\`\`

### 🔧 **Specific Optimizations**
- **Data Structures**: Array → Set/Map for O(1) lookups
- **Memory**: Object pooling, lazy loading
- **I/O**: Batch operations, streaming
- **CPU**: Bit manipulation, mathematical shortcuts

### ⚖️ **Trade-off Analysis**
- **Performance Gain**: Quantified improvement (e.g., "50% faster")
- **Memory Cost**: Additional space complexity
- **Readability Impact**: Code complexity changes
- **Maintenance**: Long-term considerations

### 🎯 **Benchmarking**
\`\`\`javascript
// Performance test template
console.time('optimized');
// optimized code here
console.timeEnd('optimized');
\`\`\`

**Focus**: Provide concrete, measurable optimizations with before/after examples and quantified benefits.`;
    return PROMPT;
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

import { ThinkingComponent } from './thinkingComponent';

// Example of how the component works with different content types

const ExampleUsage = () => {
  // Example 1: Content with thinking tags
  const contentWithThinking = `
    <think>
    I need to analyze this request carefully. The user is asking for a function that calculates the factorial of a number. 
    I should provide a recursive solution and maybe also mention the iterative approach.
    Let me think about edge cases: negative numbers, zero, and large numbers.
    </think>
    
    Here's a function to calculate the factorial of a number:
    
    \`\`\`javascript
    function factorial(n) {
      if (n < 0) return undefined; // Factorial not defined for negative numbers
      if (n === 0 || n === 1) return 1;
      return n * factorial(n - 1);
    }
    \`\`\`
    
    This recursive implementation handles the base cases and computes the factorial efficiently.
  `;

  // Example 2: Content without thinking tags
  const contentWithoutThinking = `
    Here's a simple function to add two numbers:
    
    \`\`\`javascript
    function add(a, b) {
      return a + b;
    }
    \`\`\`
  `;

  // Example 3: Content with multiple thinking sections
  const contentWithMultipleThinking = `
    <think>
    The user wants to understand sorting algorithms. I should start with bubble sort as it's easy to understand.
    </think>
    
    Let me explain bubble sort:
    
    \`\`\`python
    def bubble_sort(arr):
        n = len(arr)
        for i in range(n):
            for j in range(0, n - i - 1):
                if arr[j] > arr[j + 1]:
                    arr[j], arr[j + 1] = arr[j + 1], arr[j]
        return arr
    \`\`\`
    
    <think>
    Now I should also mention the time complexity and when to use this algorithm.
    </think>
    
    **Time Complexity:** O(n²) in worst case
    **Space Complexity:** O(1)
    
    Bubble sort is mainly used for educational purposes due to its simplicity.
  `;

  return (
    <div>
      <h3>Example 1: Content with thinking</h3>
      <ThinkingComponent content={contentWithThinking} />
      
      <h3>Example 2: Content without thinking</h3>
      <ThinkingComponent content={contentWithoutThinking} />
      
      <h3>Example 3: Content with multiple thinking sections</h3>
      <ThinkingComponent content={contentWithMultipleThinking} />
    </div>
  );
};

export default ExampleUsage;

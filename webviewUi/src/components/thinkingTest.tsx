import { ThinkingComponent } from "./thinkingComponent";

// Test data to verify the component is working
const testData = {
  // Test 1: Content with regular <think> tags
  contentWithThinking: `<think>
Okay, so I need to create a sample function for getExtendedMenuByRestaurantId based on the provided interface. Let me look at the interface first.

The interface IMenuService has a method getExtendedMenuByRestaurantId that takes a restaurantId as a string and returns a Promise of Result<IMenuResponseDTO[]>. So, the function needs to fetch an extended menu for a specific restaurant.

I remember that in the previous example, the assistant used a mock database and a delay to simulate an API call. I should follow that pattern.
</think>

Here's a sample implementation of the getExtendedMenuByRestaurantId function:

\`\`\`typescript
import { IMenuService } from '../interfaces/menu.interface';
import { Result } from '../domain/result/result';
import { IMenuResponseDTO } from '../dto/menu.dto';

export class MenuService implements IMenuService {
  private mockDatabase: IMenuResponseDTO[] = [
    {
      id: '1',
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce and mozzarella',
      price: 12.99,
      restaurantId: 'rest-001'
    },
    {
      id: '2', 
      name: 'Caesar Salad',
      description: 'Fresh romaine lettuce with Caesar dressing',
      price: 8.99,
      restaurantId: 'rest-001'
    }
  ];

  async getExtendedMenuByRestaurantId(restaurantId: string): Promise<Result<IMenuResponseDTO[]>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Filter menu items by restaurant ID
    const menuItems = this.mockDatabase.filter(item => item.restaurantId === restaurantId);
    
    console.log('Found ' + menuItems.length + ' menu items for restaurant ' + restaurantId);
    
    return Result.ok(menuItems);
  }
}
\`\`\`

This implementation includes:
- A mock database with sample menu items
- Filtering by restaurant ID
- Simulated async delay
- Proper return type wrapping`,

  // Test 2: Content with HTML-encoded thinking tags
  contentWithEncodedThinking: `&lt;think&gt;
This is a test with HTML-encoded thinking tags.
The user wants to see if the component can handle encoded tags.
&lt;/think&gt;

Regular content after encoded thinking tags.

\`\`\`javascript
function test() {
  console.log('This is a test');
}
\`\`\``,

  // Test 3: Content without thinking tags
  contentWithoutThinking: `This is regular content without any thinking tags.

\`\`\`python
def hello_world():
    print("Hello, World!")
\`\`\`

Some more regular content.`,

  // Test 4: Empty content
  emptyContent: "",

  // Test 5: Content with multiple thinking sections
  contentWithMultipleThinking: `<think>
First thinking section about the problem.
</think>

Some content here.

<think>
Second thinking section with more thoughts.
</think>

Final content after all thinking.`,
};

const ThinkingTestComponent = () => {
  return (
    <div style={{ padding: "20px", maxWidth: "800px" }}>
      <h1>Thinking Component Test</h1>

      <h2>Test 1: Content with regular thinking tags</h2>
      <ThinkingComponent content={testData.contentWithThinking} />

      <h2>Test 2: Content with HTML-encoded thinking tags</h2>
      <ThinkingComponent content={testData.contentWithEncodedThinking} />

      <h2>Test 3: Content without thinking tags</h2>
      <ThinkingComponent content={testData.contentWithoutThinking} />

      <h2>Test 4: Empty content</h2>
      <ThinkingComponent content={testData.emptyContent} />

      <h2>Test 5: Content with multiple thinking sections</h2>
      <ThinkingComponent content={testData.contentWithMultipleThinking} />
    </div>
  );
};

export default ThinkingTestComponent;

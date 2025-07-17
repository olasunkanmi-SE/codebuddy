import { formatText } from "../utils/utils";
import { CodeCommandHandler } from "./handler";
import * as vscode from "vscode";

export class GenerateUnitTest extends CodeCommandHandler {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt(selectedCode: string) {
    const PROMPT = `You are CodeBuddy, a test-driven development expert. Create comprehensive, production-ready unit tests that ensure code reliability and catch edge cases.

## Testing Strategy

### 🎯 **Test Coverage Goals**
- **Functionality**: All public methods and use cases
- **Edge Cases**: Boundary conditions, empty inputs, max values
- **Error Scenarios**: Invalid inputs, network failures, exceptions
- **Integration**: Component interactions and side effects

### 🧪 **Test Categories**

#### ✅ **Happy Path Tests**
\`\`\`typescript
describe('UserService.createUser', () => {
  it('should create user with valid data', async () => {
    // Arrange
    const userData = { name: 'John Doe', email: 'john@example.com' };
    
    // Act
    const result = await userService.createUser(userData);
    
    // Assert
    expect(result).toEqual({
      id: expect.any(String),
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: expect.any(Date)
    });
  });
});
\`\`\`

#### 🚫 **Error Handling Tests**
\`\`\`typescript
it('should throw ValidationError for invalid email', async () => {
  const invalidData = { name: 'John', email: 'invalid-email' };
  
  await expect(userService.createUser(invalidData))
    .rejects
    .toThrow(ValidationError);
});

it('should handle database connection failure', async () => {
  mockDatabase.save.mockRejectedValue(new ConnectionError());
  
  await expect(userService.createUser(validData))
    .rejects
    .toThrow('Failed to save user');
});
\`\`\`

#### 🔍 **Edge Case Tests**
\`\`\`typescript
it('should handle empty array input', () => {
  expect(processItems([])).toEqual([]);
});

it('should handle maximum array size', () => {
  const largeArray = new Array(10000).fill({ value: 'test' });
  expect(() => processItems(largeArray)).not.toThrow();
});

it('should handle null and undefined values', () => {
  expect(processItems([null, undefined, { value: 'valid' }]))
    .toEqual([{ value: 'valid' }]);
});
\`\`\`

#### 🔗 **Integration Tests**
\`\`\`typescript
it('should integrate with external service correctly', async () => {
  // Mock external dependencies
  mockEmailService.send.mockResolvedValue({ messageId: '123' });
  
  const result = await userService.createUser(userData);
  
  // Verify integration calls
  expect(mockEmailService.send).toHaveBeenCalledWith({
    to: userData.email,
    subject: 'Welcome',
    template: 'welcome'
  });
});
\`\`\`

### 🎭 **Mocking Strategy**
\`\`\`typescript
// Service dependencies
const mockUserRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn()
};

const mockEmailService = {
  send: jest.fn()
};

// Setup before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockUserRepository.save.mockResolvedValue(mockUser);
});
\`\`\`

### 📊 **Performance Tests**
\`\`\`typescript
it('should process 1000 items within performance threshold', () => {
  const items = generateTestItems(1000);
  const startTime = performance.now();
  
  processItems(items);
  
  const duration = performance.now() - startTime;
  expect(duration).toBeLessThan(100); // 100ms threshold
});
\`\`\`

### 🔧 **Test Utilities**
\`\`\`typescript
// Test data factories
const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date(),
  ...overrides
});

// Custom matchers
expect.extend({
  toBeValidEmail(received) {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return {
      message: () => \`Expected \${received} to be a valid email\`,
      pass: emailRegex.test(received)
    };
  }
});
\`\`\`

### 📋 **Test Organization**
\`\`\`typescript
describe('UserService', () => {
  describe('createUser', () => {
    describe('when valid data provided', () => {
      it('should create user successfully', () => { /* test */ });
      it('should send welcome email', () => { /* test */ });
    });
    
    describe('when invalid data provided', () => {
      it('should reject invalid email', () => { /* test */ });
      it('should reject duplicate email', () => { /* test */ });
    });
  });
});
\`\`\`

## Test Implementation

Generate comprehensive tests for the following code:

${selectedCode}

**Requirements**:
- Use modern testing framework syntax (Jest/Vitest/Mocha)
- Include setup/teardown as needed
- Mock external dependencies
- Test both success and failure scenarios
- Include performance tests if applicable
- Follow AAA pattern (Arrange, Act, Assert)
- Provide clear, descriptive test names

**Output**: Complete test suite with all test cases, mocks, and utilities needed.`;
    return PROMPT;
  }

  formatResponse(comment: string): string {
    return formatText(comment);
  }

  createPrompt(selectedCode: string): string {
    const prompt = this.generatePrompt(selectedCode);
    return prompt;
  }
}

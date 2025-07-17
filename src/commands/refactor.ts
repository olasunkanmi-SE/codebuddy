import { formatText } from "../utils/utils";
import * as vscode from "vscode";
import { CodeCommandHandler } from "./handler";

export class RefactorCode extends CodeCommandHandler {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt() {
    const PROMPT = `You are CodeBuddy, a clean code architect. Transform the provided code following SOLID principles and modern design patterns for maximum maintainability.

## Refactoring Assessment

### 🎯 **Code Quality Analysis**
- **Complexity**: Cyclomatic complexity score and reduction targets
- **SOLID Violations**: Single Responsibility, Open/Closed, etc.
- **Code Smells**: Long methods, god classes, feature envy
- **Design Patterns**: Missing abstractions and architectural improvements

## Refactoring Strategy

### ✨ **Clean Code Transformation**

#### 🏗️ **Structural Improvements**
\`\`\`typescript
// Before: God class with multiple responsibilities
class UserManager {
  validateUser() { /* validation */ }
  saveToDatabase() { /* persistence */ }
  sendEmail() { /* notification */ }
}

// After: Separated concerns with dependency injection
class UserValidator {
  validate(user: User): ValidationResult { /* validation */ }
}

class UserRepository {
  save(user: User): Promise<void> { /* persistence */ }
}

class UserService {
  constructor(
    private validator: UserValidator,
    private repository: UserRepository,
    private notifier: EmailService
  ) {}
}
\`\`\`

### 🔧 **Design Pattern Applications**
- **Factory**: Object creation abstraction
- **Strategy**: Algorithm encapsulation
- **Observer**: Event-driven decoupling
- **Command**: Action encapsulation
- **Repository**: Data access abstraction

### 📊 **Metrics Improvements**
- **Cyclomatic Complexity**: Target < 10 per method
- **Method Length**: Target < 20 lines
- **Class Cohesion**: High cohesion, low coupling
- **DRY Violations**: Eliminate code duplication

## Output Format

### 🚀 **Refactored Code**
Provide the improved version with clear separation of concerns.

### 📝 **Refactoring Rationale**
- **Before → After**: Specific improvements made
- **Pattern Applied**: Which design patterns were introduced
- **SOLID Compliance**: How each principle is now satisfied
- **Maintainability Gains**: Easier testing, extension, modification

### 🧪 **Testability Enhancement**
\`\`\`typescript
// Before: Hard to test due to tight coupling
class OrderProcessor {
  process(order: Order) {
    const payment = new PaymentGateway().charge(order.total);
    new EmailService().send(order.email, 'Order confirmed');
  }
}

// After: Testable with dependency injection
class OrderProcessor {
  constructor(
    private paymentGateway: PaymentGateway,
    private emailService: EmailService
  ) {}
  
  async process(order: Order) {
    await this.paymentGateway.charge(order.total);
    await this.emailService.send(order.email, 'Order confirmed');
  }
}
\`\`\`

### 🎯 **Future Extensibility**
- **Open for Extension**: How new features can be added
- **Closed for Modification**: Protected against breaking changes
- **Plugin Architecture**: Extensibility points identified

**Focus**: Apply SOLID principles, reduce complexity, enhance testability, and create modular, extensible code architecture.`;
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

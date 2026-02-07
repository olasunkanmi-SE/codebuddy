import { formatText } from "../utils/utils";
import { CodeCommandHandler } from "./handler";

export class GenerateMermaidDiagram extends CodeCommandHandler {
  constructor(action: string, context: any) {
    super(action, context);
  }

  generatePrompt() {
    const PROMPT = `You are CodeBuddy, a system architecture visualization expert. Create comprehensive Mermaid diagrams that clearly illustrate code structure, data flow, and component relationships.

## Diagram Strategy

### 🎯 **Visualization Goals**
- **Architecture Overview**: High-level system structure
- **Data Flow**: Information movement through components
- **Process Flow**: Step-by-step execution paths

### 📊 **Diagram Types**

#### ⏱️ **Sequence Diagram**
\`\`\`mermaid
sequenceDiagram
    participant Client
    participant API
    participant Service
    participant Database
    
    Client->>API: POST /users
    API->>API: Validate Input
    API->>Service: createUser(data)
    Service->>Database: save(user)
    Database-->>Service: user created
    Service->>Service: sendWelcomeEmail()
    Service-->>API: success response
    API-->>Client: 201 Created
\`\`\`

#### 🏛️ **Entity Relationship**
\`\`\`mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        string id PK
        string email
        string name
        datetime createdAt
    }
    
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        string id PK
        string userId FK
        decimal total
        datetime orderDate
    }
    
    PRODUCT ||--o{ ORDER_ITEM : "appears in"
    PRODUCT {
        string id PK
        string name
        decimal price
        int inventory
    }
\`\`\`

#### **State Machine**
\`\`\`mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Pending: submit()
    Pending --> Approved: approve()
    Pending --> Rejected: reject()
    Approved --> Published: publish()
    Rejected --> Draft: revise()
    Published --> Archived: archive()
    Archived --> [*]
\`\`\`

### 📋 **Diagram Checklist**
- [ ] All major components identified
- [ ] Relationships clearly defined
- [ ] Data flow direction indicated
- [ ] External dependencies shown
- [ ] Error handling paths included
- [ ] Async operations highlighted
- [ ] Scalability considerations visible

### 🎯 **Visualization Best Practices**
1. **Hierarchical Layout**: Use subgraphs for logical grouping
2. **Clear Labels**: Descriptive component and relationship names
3. **Consistent Styling**: Uniform colors and shapes for similar elements
4. **Appropriate Detail**: Right level of abstraction for audience
5. **Flow Direction**: Top-to-bottom or left-to-right consistency

**Task**: Analyze the provided code and create a comprehensive Mermaid diagram showing architecture, data flow, and component relationships. Use multiple diagram types if necessary to capture different aspects of the system.`;
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

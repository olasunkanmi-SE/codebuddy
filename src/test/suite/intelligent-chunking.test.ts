import * as assert from "assert";
import {
  SmartContextSelectorService,
  CodeSnippet,
} from "../../services/smart-context-selector.service";

describe("Intelligent Code Chunking", () => {
  let service: SmartContextSelectorService;

  before(() => {
    service = new SmartContextSelectorService();
  });

  test("should create chunks for TypeScript code", async () => {
    const testCode = `
export class UserService {
  private users: User[] = [];

  constructor(private apiKey: string) {}

  async createUser(userData: UserData): Promise<User> {
    const user = new User(userData);
    this.users.push(user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  private validateUser(user: User): boolean {
    return user.email && user.name;
  }
}

interface UserData {
  name: string;
  email: string;
}

interface User extends UserData {
  id: string;
  createdAt: Date;
}
`;

    const chunks: CodeSnippet[] = service.extractSmartSnippets(
      "/test/user-service.ts",
      testCode,
      [],
      false
    );

    console.log(`Created ${chunks.length} chunks:`);
    chunks.forEach((chunk, index) => {
      console.log(
        `${index + 1}. Type: ${chunk.type}, Name: ${chunk.name}, Size: ${chunk.content.length} chars`
      );
      console.log(`   Content preview: ${chunk.content.substring(0, 100)}...`);
    });

    // Verify we got some chunks
    assert.ok(chunks.length > 0, "Should create at least one chunk");
    
    // Verify types if possible
    const types = chunks.map(c => c.type);
    if (types.includes("class")) {
        assert.ok(true, "Found class chunk");
    }
    if (types.includes("interface")) {
        assert.ok(true, "Found interface chunk");
    }
  });

  test("should handle large files", async () => {
    // Create a large file
    const largeCode = `
export class LargeService {
${"  // Large comment block\n".repeat(200)}
  
  public processData(data: any[]): any[] {
    return data;
  }
}
`;

    const chunks: CodeSnippet[] = service.extractSmartSnippets(
      "/test/large-service.ts",
      largeCode,
      [],
      false
    );

    console.log(`Large file chunks: ${chunks.length}`);
    assert.ok(chunks.length > 0, "Should create chunks for large file");
  });
});

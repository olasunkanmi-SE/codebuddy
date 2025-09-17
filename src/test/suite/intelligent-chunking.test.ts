import * as assert from "assert";
import * as vscode from "vscode";
import { EmbeddingService } from "../../services/embedding-service";
import {
  VectorDatabaseService,
  CodeSnippet,
} from "../../services/vector-database.service";
import { VectorDbWorkerManager } from "../../services/vector-db-worker-manager";

describe("Intelligent Code Chunking", () => {
  let embeddingService: EmbeddingService;
  let mockContext: vscode.ExtensionContext;

  before(async () => {
    // Create mock context
    mockContext = {
      extensionPath: "/mock/path",
      globalState: { get: () => undefined, update: () => Promise.resolve() },
      workspaceState: { get: () => undefined, update: () => Promise.resolve() },
      subscriptions: [],
    } as any;

    // Initialize services
    const vectorDb = new VectorDatabaseService(mockContext, "test-api-key");
    const workerManager = new VectorDbWorkerManager(mockContext);
    embeddingService = new EmbeddingService(vectorDb, workerManager);
  });

  test("should create multiple chunks for TypeScript class with methods", async () => {
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

    // Use the private method through reflection for testing
    const createCodeSnippets = (
      embeddingService as any
    ).createCodeSnippets.bind(embeddingService);
    const chunks: CodeSnippet[] = await createCodeSnippets(
      "/test/user-service.ts",
      testCode,
      [],
    );

    console.log(`Created ${chunks.length} chunks:`);
    chunks.forEach((chunk, index) => {
      console.log(
        `${index + 1}. Type: ${chunk.type}, Name: ${chunk.name}, Size: ${chunk.content.length} chars`,
      );
      console.log(`   Content preview: ${chunk.content.substring(0, 100)}...`);
    });

    // Should create separate chunks for:
    // 1. UserService class
    // 2. createUser method
    // 3. getUserById method
    // 4. validateUser method
    // 5. UserData interface
    // 6. User interface
    assert.ok(
      chunks.length >= 6,
      `Expected at least 6 chunks, got ${chunks.length}`,
    );

    // Check that we have different types of chunks
    const chunkTypes = chunks.map((c: CodeSnippet) => c.type);
    assert.ok(chunkTypes.includes("class"), "Should include class chunks");
    assert.ok(
      chunkTypes.includes("function"),
      "Should include function chunks",
    );
    assert.ok(
      chunkTypes.includes("interface"),
      "Should include interface chunks",
    );

    // Check that chunks have reasonable sizes (not the entire file)
    const maxChunkSize = Math.max(
      ...chunks.map((c: CodeSnippet) => c.content.length),
    );
    const totalFileSize = testCode.length;
    assert.ok(
      maxChunkSize < totalFileSize * 0.8,
      "Individual chunks should be significantly smaller than the full file",
    );

    // Check that chunks have proper metadata
    chunks.forEach((chunk: CodeSnippet) => {
      assert.ok(chunk.metadata, "Chunk should have metadata");
      assert.ok(
        chunk.metadata!.startLine,
        "Chunk should have startLine metadata",
      );
      assert.ok(chunk.metadata!.endLine, "Chunk should have endLine metadata");
      assert.ok(
        chunk.metadata!.language === "typescript",
        "Chunk should have correct language",
      );
    });
  });

  test("should handle simple JavaScript functions", async () => {
    const testCode = `
function calculateTax(amount, rate) {
  return amount * rate;
}

const processPayment = async (paymentData) => {
  const tax = calculateTax(paymentData.amount, 0.1);
  return {
    ...paymentData,
    tax,
    total: paymentData.amount + tax
  };
};

class PaymentProcessor {
  process(payment) {
    return processPayment(payment);
  }
}
`;

    const createCodeSnippets = (
      embeddingService as any
    ).createCodeSnippets.bind(embeddingService);
    const chunks: CodeSnippet[] = await createCodeSnippets(
      "/test/payment.js",
      testCode,
      [],
    );

    console.log(`JavaScript chunks: ${chunks.length}`);
    chunks.forEach((chunk: CodeSnippet, index: number) => {
      console.log(`${index + 1}. Type: ${chunk.type}, Name: ${chunk.name}`);
    });

    assert.ok(
      chunks.length >= 3,
      `Expected at least 3 chunks for JS code, got ${chunks.length}`,
    );

    // Should find calculateTax function, processPayment arrow function, and PaymentProcessor class
    const chunkNames = chunks.map((c: CodeSnippet) => c.name);
    assert.ok(
      chunkNames.some((name: string) => name.includes("calculateTax")),
      "Should find calculateTax function",
    );
    assert.ok(
      chunkNames.some((name: string) => name.includes("PaymentProcessor")),
      "Should find PaymentProcessor class",
    );
  });

  test("should fallback to basic chunking for unsupported languages", async () => {
    const pythonCode = `
def calculate_tax(amount, rate):
    return amount * rate

class PaymentProcessor:
    def process(self, payment):
        tax = calculate_tax(payment['amount'], 0.1)
        return {
            **payment,
            'tax': tax,
            'total': payment['amount'] + tax
        }
`;

    const createCodeSnippets = (
      embeddingService as any
    ).createCodeSnippets.bind(embeddingService);
    const chunks: CodeSnippet[] = await createCodeSnippets(
      "/test/payment.py",
      pythonCode,
      [],
    );

    console.log(`Python chunks (basic): ${chunks.length}`);
    chunks.forEach((chunk: CodeSnippet, index: number) => {
      console.log(
        `${index + 1}. Type: ${chunk.type}, Name: ${chunk.name}, Size: ${chunk.content.length}`,
      );
    });

    // Should fallback to basic chunking (likely 1 chunk for small file)
    assert.ok(chunks.length >= 1, "Should create at least one chunk");
    assert.ok(
      chunks[0].type === "module",
      "Should use module type for basic chunking",
    );
  });

  test("should handle large files with basic chunking", async () => {
    // Create a large file that exceeds the chunk size limit
    const largeCode = `
export class LargeService {
${"  // Large comment block\\n".repeat(200)}
  
  public processData(data: any[]): ProcessedData[] {
    return data.map(item => ({
      id: item.id,
      processed: true,
      timestamp: new Date(),
      details: item
    }));
  }
}
`;

    const createCodeSnippets = (
      embeddingService as any
    ).createCodeSnippets.bind(embeddingService);
    const chunks: CodeSnippet[] = await createCodeSnippets(
      "/test/large-service.ts",
      largeCode,
      [],
    );

    console.log(`Large file chunks: ${chunks.length}`);
    chunks.forEach((chunk: CodeSnippet, index: number) => {
      console.log(
        `${index + 1}. Type: ${chunk.type}, Name: ${chunk.name}, Size: ${chunk.content.length} chars`,
      );
    });

    // Should create multiple chunks due to size
    if (largeCode.length > 1500) {
      assert.ok(
        chunks.length > 1,
        "Large files should be split into multiple chunks",
      );

      // Check that chunks overlap properly
      if (chunks.length > 1) {
        const firstChunk = chunks[0].content;
        const secondChunk = chunks[1].content;

        // Should have some overlap between chunks
        const firstEnd = firstChunk.slice(-50);
        assert.ok(
          secondChunk.includes(firstEnd.slice(0, 30)),
          "Chunks should have overlap for context",
        );
      }
    }
  });
});

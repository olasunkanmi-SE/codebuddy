# Smart Context Implementation Guide

## 🎯 Overview

This guide provides step-by-step instructions for implementing the Vector Database and Smart Context Extraction system in CodeBuddy. Follow these steps to enhance your codebase understanding capabilities with semantic search.

> **🎯 Important**: Before implementing, review the [Smart Embedding Strategy Guide](SMART_EMBEDDING_STRATEGY.md) to understand the multi-phase approach for optimal user experience and resource management.

## 📋 Prerequisites

### System Requirements

- Node.js 16+
- TypeScript 4.5+
- VS Code Extension Host
- Minimum 4GB RAM (8GB recommended)

### Dependencies Installation

```bash
# Core vector database
npm install chromadb

# Embedding support (choose one)
npm install openai                    # For OpenAI embeddings
npm install @tensorflow/tfjs-node    # For local embeddings

# Type definitions
npm install --save-dev @types/chromadb
```

## 🏗️ Implementation Steps

### Step 1: Create Vector Database Service

Create `src/services/vector-database.service.ts`:

```typescript
import * as path from "path";
import { ChromaApi, OpenAIEmbeddingFunction } from "chromadb";
import { Logger } from "../infrastructure/logger/logger";
import * as vscode from "vscode";

export interface CodeSnippet {
  id: string;
  filePath: string;
  type: "function" | "class" | "interface" | "enum" | "module";
  name: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  content: string;
  metadata: Record<string, any>;
  distance: number;
  relevanceScore: number;
}

export class VectorDatabaseService {
  private client: ChromaApi;
  private collection: any;
  private logger: Logger;
  private isInitialized = false;

  constructor(
    private context: vscode.ExtensionContext,
    private apiKey?: string
  ) {
    this.logger = Logger.initialize("VectorDatabaseService");
  }

  async initialize(): Promise<void> {
    try {
      // Initialize ChromaDB with local persistence
      const dbPath = path.join(this.context.extensionPath, "vector_db");

      this.client = new ChromaApi({
        path: dbPath,
      });

      // Create or get collection with embedding function
      const embeddingFunction = this.apiKey ? new OpenAIEmbeddingFunction({ openai_api_key: this.apiKey }) : undefined; // Use default embedding function

      this.collection = await this.client.getOrCreateCollection({
        name: "codebase_embeddings",
        embeddingFunction,
      });

      this.isInitialized = true;
      this.logger.info("Vector database initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize vector database:", error);
      throw error;
    }
  }

  async indexCodeSnippets(snippets: CodeSnippet[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Vector database not initialized");
    }

    if (snippets.length === 0) return;

    try {
      const documents = snippets.map((s) => s.content);
      const metadatas = snippets.map((s) => ({
        filePath: s.filePath,
        type: s.type,
        name: s.name,
        ...s.metadata,
      }));
      const ids = snippets.map((s) => s.id);

      await this.collection.add({
        documents,
        metadatas,
        ids,
      });

      this.logger.info(`Indexed ${snippets.length} code snippets`);
    } catch (error) {
      this.logger.error("Error indexing code snippets:", error);
      throw error;
    }
  }

  async semanticSearch(
    query: string,
    nResults: number = 10,
    filterOptions?: Record<string, any>
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      throw new Error("Vector database not initialized");
    }

    try {
      const queryOptions: any = {
        queryTexts: [query],
        nResults,
      };

      if (filterOptions) {
        queryOptions.where = filterOptions;
      }

      const results = await this.collection.query(queryOptions);

      if (!results.documents[0]) {
        return [];
      }

      return results.documents[0].map((doc: string, index: number) => ({
        content: doc,
        metadata: results.metadatas[0][index],
        distance: results.distances[0][index],
        relevanceScore: 1 - results.distances[0][index],
      }));
    } catch (error) {
      this.logger.error("Error performing semantic search:", error);
      return [];
    }
  }

  async deleteByFilePath(filePath: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const results = await this.collection.get({
        where: { filePath: { $eq: filePath } },
      });

      if (results.ids.length > 0) {
        await this.collection.delete({
          ids: results.ids,
        });

        this.logger.info(`Deleted ${results.ids.length} embeddings for ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting embeddings for ${filePath}:`, error);
    }
  }

  async clearAll(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await this.collection.delete();
      this.logger.info("Cleared all embeddings from vector database");
    } catch (error) {
      this.logger.error("Error clearing vector database:", error);
    }
  }

  getStats(): { isInitialized: boolean; collectionName?: string } {
    return {
      isInitialized: this.isInitialized,
      collectionName: this.collection?.name,
    };
  }
}
```

### Step 2: Create Vector DB Sync Service

Create `src/services/vector-db-sync.service.ts`:

```typescript
import * as vscode from "vscode";
import * as path from "path";
import { VectorDatabaseService, CodeSnippet } from "./vector-database.service";
import { TypeScriptAtsMapper } from "./typescript-ats.service";
import { CodeIndexingService } from "./code-indexing";
import { SqliteDatabaseService } from "./sqlite-database.service";
import { Logger } from "../infrastructure/logger/logger";

export class VectorDbSyncService {
  private watcher: vscode.FileSystemWatcher | undefined;
  private syncQueue: Set<string> = new Set();
  private syncTimer: NodeJS.Timeout | undefined;
  private readonly SYNC_DELAY = 2000; // 2 second debounce
  private logger: Logger;

  constructor(
    private vectorDb: VectorDatabaseService,
    private codeIndexing: CodeIndexingService,
    private sqliteDb: SqliteDatabaseService
  ) {
    this.logger = Logger.initialize("VectorDbSyncService");
  }

  async initializeAndSync(): Promise<void> {
    try {
      // Check if full reindex is needed
      const needsFullReindex = await this.checkIfFullReindexNeeded();

      if (needsFullReindex) {
        this.logger.info("Performing full reindex...");
        await this.performFullReindex();
      } else {
        this.logger.info("Vector DB appears to be in sync");
      }

      // Start monitoring for future changes
      this.setupFileWatcher();
    } catch (error) {
      this.logger.error("Error during initialization sync:", error);
    }
  }

  private async checkIfFullReindexNeeded(): Promise<boolean> {
    try {
      const gitState = await this.sqliteDb.getCurrentGitState();
      return gitState ? await this.sqliteDb.hasSignificantChanges(gitState) : true;
    } catch (error) {
      this.logger.warn("Could not check git state, assuming reindex needed:", error);
      return true;
    }
  }

  private setupFileWatcher(): void {
    // Watch TypeScript files
    this.watcher = vscode.workspace.createFileSystemWatcher(
      "**/*.{ts,tsx,js,jsx}",
      false, // don't ignore creates
      false, // don't ignore changes
      false // don't ignore deletes
    );

    // File events
    this.watcher.onDidCreate((uri) => {
      this.logger.debug(`File created: ${uri.fsPath}`);
      this.queueFileForSync(uri.fsPath, "created");
    });

    this.watcher.onDidChange((uri) => {
      this.logger.debug(`File changed: ${uri.fsPath}`);
      this.queueFileForSync(uri.fsPath, "modified");
    });

    this.watcher.onDidDelete((uri) => {
      this.logger.debug(`File deleted: ${uri.fsPath}`);
      this.queueFileForSync(uri.fsPath, "deleted");
    });
  }

  private queueFileForSync(filePath: string, operation: "created" | "modified" | "deleted"): void {
    this.syncQueue.add(`${operation}:${filePath}`);

    // Debounce processing
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.processSyncQueue();
    }, this.SYNC_DELAY);
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.size === 0) return;

    const operations = Array.from(this.syncQueue);
    this.syncQueue.clear();

    const created: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];

    // Categorize operations
    for (const op of operations) {
      const [operation, filePath] = op.split(":");
      switch (operation) {
        case "created":
          created.push(filePath);
          break;
        case "modified":
          modified.push(filePath);
          break;
        case "deleted":
          deleted.push(filePath);
          break;
      }
    }

    try {
      // Process deletions first
      if (deleted.length > 0) {
        await this.handleDeletedFiles(deleted);
      }

      // Process modifications and creations
      const filesToProcess = [...created, ...modified];
      if (filesToProcess.length > 0) {
        await this.handleModifiedFiles(filesToProcess);
      }

      this.logger.info(`Processed ${operations.length} file operations`);
    } catch (error) {
      this.logger.error("Error processing sync queue:", error);
    }
  }

  private async handleDeletedFiles(deletedFiles: string[]): Promise<void> {
    for (const filePath of deletedFiles) {
      await this.vectorDb.deleteByFilePath(filePath);
    }
  }

  private async handleModifiedFiles(modifiedFiles: string[]): Promise<void> {
    for (const filePath of modifiedFiles) {
      await this.reindexSingleFile(filePath);
    }
  }

  private async reindexSingleFile(filePath: string): Promise<void> {
    try {
      // Remove existing embeddings
      await this.vectorDb.deleteByFilePath(filePath);

      // Extract new code snippets
      const snippets = await this.extractSnippetsFromFile(filePath);

      if (snippets.length > 0) {
        await this.vectorDb.indexCodeSnippets(snippets);
        this.logger.debug(`Reindexed ${snippets.length} snippets from ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Error reindexing file ${filePath}:`, error);
    }
  }

  private async extractSnippetsFromFile(filePath: string): Promise<CodeSnippet[]> {
    try {
      const tsMapper = await TypeScriptAtsMapper.getInstance();

      // This would need to be implemented based on your existing structure
      // For now, this is a placeholder that shows the interface
      const functionData = await this.codeIndexing.buildFunctionStructureMap();

      return functionData
        .filter((f) => f.path === filePath)
        .map((f) => ({
          id: `${f.path}::${f.className}::${f.name}`,
          filePath: f.path || "",
          type: "function" as const,
          name: f.name || "",
          content: f.compositeText || f.description || "",
          metadata: {
            className: f.className,
            returnType: f.returnType,
            parameters: f.parameters,
          },
        }));
    } catch (error) {
      this.logger.error(`Error extracting snippets from ${filePath}:`, error);
      return [];
    }
  }

  async performFullReindex(): Promise<void> {
    try {
      // Clear existing vector DB
      await this.vectorDb.clearAll();

      // Get all function data from existing service
      const allFunctions = await this.codeIndexing.generateEmbeddings();

      // Convert to code snippets format
      const snippets: CodeSnippet[] = allFunctions.map((f) => ({
        id: `${f.path}::${f.className}::${f.name}`,
        filePath: f.path || "",
        type: "function" as const,
        name: f.name || "",
        content: f.compositeText || f.description || "",
        metadata: {
          className: f.className,
          returnType: f.returnType,
          parameters: f.parameters,
          embedding: f.embedding, // Store original embedding if available
        },
      }));

      // Index in batches
      const batchSize = 50;
      for (let i = 0; i < snippets.length; i += batchSize) {
        const batch = snippets.slice(i, i + batchSize);
        await this.vectorDb.indexCodeSnippets(batch);

        this.logger.info(`Indexed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(snippets.length / batchSize)}`);
      }

      this.logger.info(`Full reindex complete: ${snippets.length} functions indexed`);
    } catch (error) {
      this.logger.error("Error during full reindex:", error);
      throw error;
    }
  }

  dispose(): void {
    if (this.watcher) {
      this.watcher.dispose();
    }
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
  }
}
```

### Step 3: Enhance SmartContextExtractor

Update `src/services/smart-context-extractor.ts`:

```typescript
// Add this import
import { VectorDatabaseService, SearchResult } from "./vector-database.service";

// Add to constructor parameters
constructor(
  maxContextTokens: number = 6000,
  questionClassifier?: QuestionClassifierService,
  codebaseUnderstanding?: CodebaseUnderstandingService,
  private vectorDb?: VectorDatabaseService // Add this
) {
  // ... existing constructor code
}

// Add new method for vector-based context extraction
async extractRelevantContextWithVector(
  userQuestion: string,
  activeFile?: string
): Promise<string> {
  try {
    // Try vector search first if available
    if (this.vectorDb) {
      const vectorResults = await this.vectorDb.semanticSearch(userQuestion, 8);

      if (vectorResults.length > 0) {
        this.logger.info(`Found ${vectorResults.length} relevant code snippets via vector search`);
        return this.buildContextFromVectorResults(vectorResults, userQuestion);
      }
    }

    // Fallback to existing method
    this.logger.debug('Vector search returned no results, using fallback method');
    const fullContext = await this.codebaseUnderstanding.getCodebaseContext();
    return this.extractRelevantContext(fullContext, userQuestion, activeFile);

  } catch (error) {
    this.logger.error('Error in vector context extraction:', error);
    // Fallback to existing method
    const fullContext = await this.codebaseUnderstanding.getCodebaseContext();
    return this.extractRelevantContext(fullContext, userQuestion, activeFile);
  }
}

private buildContextFromVectorResults(results: SearchResult[], question: string): string {
  if (results.length === 0) return '';

  let context = `**Semantically Relevant Code (Vector Search Results):**\n\n`;

  for (const result of results.slice(0, 8)) { // Limit to top 8 results
    const metadata = result.metadata;
    const relevancePercentage = (result.relevanceScore * 100).toFixed(1);

    context += `**File: ${metadata.filePath}** (Relevance: ${relevancePercentage}%)\n`;
    if (metadata.name) {
      context += `**${metadata.type}: ${metadata.name}**\n`;
    }
    context += `\`\`\`typescript\n${result.content}\n\`\`\`\n\n`;
  }

  return context.trim();
}

// Update the main enhanceMessageWithSmartContext method
async enhanceMessageWithSmartContext(message: string): Promise<string> {
  try {
    const questionAnalysis = this.questionClassifier.categorizeQuestion(message);

    if (!questionAnalysis.isCodebaseRelated) {
      this.logger.debug("Question not codebase-related, returning original message");
      return message;
    }

    this.logger.info(
      `Detected codebase question with confidence: ${questionAnalysis.confidence}, categories: ${questionAnalysis.categories.join(", ")}`
    );

    // Use vector-enhanced context extraction
    const relevantContext = await this.extractRelevantContextWithVector(message);

    // Create enhanced prompt with specific instructions for implementation questions
    const isImplementationQuestion = message.toLowerCase().includes("implementation") ||
                                   message.toLowerCase().includes("how is") ||
                                   message.toLowerCase().includes("how does");

    const specificInstructions = isImplementationQuestion ?
      "Focus on concrete implementations, actual code examples, and specific methods/classes. Include code snippets where available and explain the technical approach used. Avoid generic descriptions - be specific about this codebase." :
      "Use the relevant codebase context above to provide accurate, specific answers about this project.";

    const enhancedMessage = `
**User Question**: ${message}

**Relevant Codebase Context** (Intelligently extracted and prioritized for your question):

${relevantContext}

**Instructions for AI**: ${specificInstructions} This context has been intelligently filtered to include the most relevant information. Reference actual files, classes, methods, and implementations found in the codebase analysis. Always include clickable file references (e.g., [[1]], [[2]]) so users can navigate directly to the source code. Provide concrete examples from the actual codebase rather than generic explanations.

IMPORTANT: Please provide a complete response with specific code examples and file references. Do not truncate your answer mid-sentence or mid-word. Ensure your response is fully finished before ending.
`.trim();

    this.logger.debug("Enhanced message with smart context extraction (vector-enabled)");
    return enhancedMessage;
  } catch (error) {
    this.logger.error("Error enhancing message with smart context", error);
    // Return original message if enhancement fails
    return message;
  }
}
```

### Step 4: Update BaseWebViewProvider Integration

Update `src/webview-providers/base.ts`:

```typescript
// Add import
import { VectorDatabaseService } from "../services/vector-database.service";
import { VectorDbSyncService } from "../services/vector-db-sync.service";

// Add properties to BaseWebViewProvider class
private readonly vectorDb: VectorDatabaseService;
private readonly vectorSync: VectorDbSyncService;

// Update constructor
constructor(
  private readonly _extensionUri: vscode.Uri,
  protected readonly apiKey: string,
  protected readonly generativeAiModel: string,
  context: vscode.ExtensionContext,
) {
  // ... existing initialization code ...

  // Initialize vector database with currently selected model
  const currentModel = getGenerativeAiModel();
  const { apiKey: selectedApiKey, model: selectedModel } = getAPIKeyAndModel(currentModel);
  this.vectorDb = new VectorDatabaseService(context, selectedApiKey, selectedModel);
  this.vectorSync = new VectorDbSyncService(
    this.vectorDb,
    this.codeIndexing,
    SqliteDatabaseService.getInstance()
  );

  // Update SmartContextExtractor with vector database
  this.smartContextExtractor = new SmartContextExtractor(
    6000,
    this.questionClassifier,
    this.codebaseUnderstanding,
    this.vectorDb // Add vector database
  );

  // Initialize vector database
  this.initializeVectorDatabase();
}

// Add initialization method
private async initializeVectorDatabase(): Promise<void> {
  try {
    await this.vectorDb.initialize();
    await this.vectorSync.initializeAndSync();
    this.logger.info('Vector database initialized and synced');
  } catch (error) {
    this.logger.error('Failed to initialize vector database:', error);
    // Continue without vector search capabilities
  }
}

// Update dispose method
public dispose(): void {
  this.logger.debug(
    `Disposing BaseWebViewProvider with ${this.disposables.length} disposables`,
  );
  this.disposables.forEach((d) => d.dispose());
  this.vectorSync?.dispose(); // Add vector sync disposal
  this.disposables.length = 0;
}
```

### Step 5: Smart Embedding Strategy Integration

> See [Smart Embedding Strategy Guide](SMART_EMBEDDING_STRATEGY.md) for the complete multi-phase approach.

Instead of a simple initialization, implement the orchestrated strategy:

```typescript
// Replace simple initialization with smart orchestrator
const embeddingOrchestrator = new SmartEmbeddingOrchestrator(context, workerManager);
await embeddingOrchestrator.initialize();
```

### Step 6: Configuration and Environment Setup

Add to your `package.json`:

```json
{
  "dependencies": {
    "chromadb": "^1.5.0"
  },
  "devDependencies": {
    "@types/chromadb": "^1.5.0"
  }
}
```

Create environment configuration in `src/config/vector-db.config.ts`:

```typescript
export interface VectorDbConfig {
  enabled: boolean;
  embeddingModel: "openai" | "local";
  maxTokens: number;
  batchSize: number;
  syncDelay: number;
  maxResults: number;
}

export const getVectorDbConfig = (): VectorDbConfig => ({
  enabled: process.env.VECTOR_DB_ENABLED !== "false",
  embeddingModel: (process.env.EMBEDDING_MODEL as any) || "openai",
  maxTokens: parseInt(process.env.MAX_CONTEXT_TOKENS || "6000"),
  batchSize: parseInt(process.env.INDEXING_BATCH_SIZE || "50"),
  syncDelay: parseInt(process.env.SYNC_DELAY_MS || "2000"),
  maxResults: parseInt(process.env.MAX_SEARCH_RESULTS || "10"),
});
```

## 🧪 Testing

### Unit Tests

Create `src/test/services/vector-database.service.test.ts`:

```typescript
import { VectorDatabaseService } from "../../services/vector-database.service";
import * as vscode from "vscode";

describe("VectorDatabaseService", () => {
  let service: VectorDatabaseService;
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    mockContext = {
      extensionPath: "/test/path",
    } as vscode.ExtensionContext;

    service = new VectorDatabaseService(mockContext);
  });

  test("should initialize successfully", async () => {
    await service.initialize();

    const stats = service.getStats();
    expect(stats.isInitialized).toBe(true);
  });

  test("should index and search code snippets", async () => {
    await service.initialize();

    const snippets = [
      {
        id: "test-1",
        filePath: "/test/file.ts",
        type: "function" as const,
        name: "testFunction",
        content: 'function testFunction() { return "hello"; }',
      },
    ];

    await service.indexCodeSnippets(snippets);

    const results = await service.semanticSearch("test function hello");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].metadata.name).toBe("testFunction");
  });
});
```

### Integration Tests

Create `src/test/integration/smart-context.integration.test.ts`:

````typescript
import { VectorSmartContextExtractor } from "../../services/smart-context-extractor";
import { VectorDatabaseService } from "../../services/vector-database.service";

describe("Smart Context Integration", () => {
  test("should extract relevant context using vector search", async () => {
    // Setup test environment
    const vectorDb = new VectorDatabaseService(mockContext);
    await vectorDb.initialize();

    // Index test code
    await vectorDb.indexCodeSnippets(testCodeSnippets);

    // Test context extraction
    const extractor = new VectorSmartContextExtractor(
      6000,
      mockQuestionClassifier,
      mockCodebaseUnderstanding,
      vectorDb
    );

    const context = await extractor.extractRelevantContextWithVector("How is user authentication implemented?");

    expect(context).toContain("authentication");
    expect(context).toContain("```typescript");
  });
});
````

## 🚀 Deployment

### Production Checklist

- [ ] Vector database initialized
- [ ] File watcher configured
- [ ] Embedding service connected
- [ ] Error handling implemented
- [ ] Performance monitoring enabled
- [ ] Memory usage optimized
- [ ] Backup strategy configured

### Performance Monitoring

Add to your monitoring dashboard:

```typescript
// Performance metrics collection
const metrics = {
  vectorSearchLatency: Date.now() - searchStart,
  indexingBatchSize: snippets.length,
  memoryUsage: process.memoryUsage(),
  vectorDbSize: await getVectorDbSize(),
};

// Log for analysis
this.logger.info("Vector DB Performance", metrics);
```

## 🐛 Troubleshooting

Common issues and solutions:

1. **ChromaDB initialization fails**

   - Check directory permissions
   - Verify Node.js version compatibility
   - Clear existing database files

2. **High memory usage**

   - Reduce batch sizes
   - Implement streaming for large datasets
   - Clear unused embeddings

3. **Slow search performance**
   - Optimize embedding dimensions
   - Implement result caching
   - Use filtering for large datasets

## 📚 Next Steps

After implementation:

1. Monitor performance metrics
2. Optimize embedding models
3. Add more code analysis types
4. Implement advanced filtering
5. Add user configuration options

For detailed troubleshooting, see [VECTOR_DB_TROUBLESHOOTING.md](VECTOR_DB_TROUBLESHOOTING.md).

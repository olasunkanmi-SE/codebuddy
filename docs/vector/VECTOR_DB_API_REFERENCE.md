# Vector Database API Reference

## 📚 Overview

This document provides comprehensive API documentation for the Vector Database and Smart Context Extraction system in CodeBuddy.

> **⚠️ Important**: The embedding system always uses **Gemini's `text-embedding-004`** model regardless of your selected chat model. This ensures vector space consistency and prevents compatibility issues when switching between different chat providers (Groq, Anthropic, etc.).

## 🗂️ Table of Contents

- [VectorDatabaseService](#vectordatabaseservice)
- [VectorDbSyncService](#vectordbsyncservice)
- [SmartContextExtractor](#smartcontextextractor)
- [Interfaces & Types](#interfaces--types)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

## VectorDatabaseService

Core service for managing vector embeddings and semantic search.

### Constructor

```typescript
new VectorDatabaseService(
  context: vscode.ExtensionContext,
  apiKey?: string,
  model?: string
)
```

**Parameters:**

- `context`: VS Code extension context for persistence
- `apiKey`: Optional OpenAI API key for embeddings

### Methods

#### `initialize(): Promise<void>`

Initializes the ChromaDB client and creates the embeddings collection.

````typescript
```typescript
// Always use Gemini for embeddings (regardless of selected chat model)
import { getAPIKeyAndModel } from '../utils/utils';

// Embedding service always uses Gemini for consistency
const embeddingProvider = "Gemini";
const { apiKey: geminiApiKey } = getAPIKeyAndModel(embeddingProvider);
const embeddingService = new EmbeddingService(geminiApiKey);
````

**Throws:**

- `Error` if ChromaDB initialization fails

---

#### `indexCodeSnippets(snippets: CodeSnippet[]): Promise<void>`

Adds code snippets and their embeddings to the vector database.

```typescript
const snippets: CodeSnippet[] = [
  {
    id: "file.ts::MyClass::myMethod",
    filePath: "/src/services/file.ts",
    type: "function",
    name: "myMethod",
    content: 'public myMethod(): string { return "hello"; }',
    metadata: { className: "MyClass", returnType: "string" },
  },
];

await vectorDb.indexCodeSnippets(snippets);
```

**Parameters:**

- `snippets`: Array of code snippets to index

**Throws:**

- `Error` if database not initialized
- `Error` if indexing operation fails

---

#### `semanticSearch(query: string, nResults?: number, filterOptions?: Record<string, any>): Promise<SearchResult[]>`

Performs semantic search to find relevant code snippets.

```typescript
const results = await vectorDb.semanticSearch("user authentication logic", 10, { type: "function" });
```

**Parameters:**

- `query`: Natural language search query
- `nResults`: Maximum number of results (default: 10)
- `filterOptions`: Optional metadata filters

**Returns:** Array of `SearchResult` objects with relevance scores

---

#### `deleteByFilePath(filePath: string): Promise<void>`

Removes all embeddings associated with a specific file.

```typescript
await vectorDb.deleteByFilePath("/src/services/old-service.ts");
```

**Parameters:**

- `filePath`: Path of the file to remove from index

---

#### `clearAll(): Promise<void>`

Removes all embeddings from the database.

```typescript
await vectorDb.clearAll();
```

**Use Case:** Full reindex or cleanup operations

---

#### `getStats(): DatabaseStats`

Returns current database statistics.

```typescript
const stats = vectorDb.getStats();
console.log(`Database initialized: ${stats.isInitialized}`);
```

**Returns:**

```typescript
interface DatabaseStats {
  isInitialized: boolean;
  collectionName?: string;
}
```

## VectorDbSyncService

Service for monitoring file changes and maintaining vector database synchronization.

### Constructor

```typescript
new VectorDbSyncService(
  vectorDb: VectorDatabaseService,
  codeIndexing: CodeIndexingService,
  sqliteDb: SqliteDatabaseService
)
```

**Parameters:**

- `vectorDb`: Vector database service instance
- `codeIndexing`: Code indexing service for analysis
- `sqliteDb`: SQLite database for caching

### Methods

#### `initializeAndSync(): Promise<void>`

Initializes file monitoring and performs initial synchronization.

```typescript
const syncService = new VectorDbSyncService(vectorDb, codeIndexing, sqliteDb);
await syncService.initializeAndSync();
```

**Behavior:**

- Checks if full reindex is needed
- Sets up file system watchers
- Performs incremental or full sync as needed

---

#### `performFullReindex(): Promise<void>`

Rebuilds the entire vector database from scratch.

```typescript
await syncService.performFullReindex();
```

**Use Cases:**

- Initial setup
- Significant codebase changes
- Database corruption recovery

---

#### `dispose(): void`

Cleans up file watchers and timers.

```typescript
syncService.dispose();
```

**Important:** Call this in your extension's `deactivate()` function

## SmartContextExtractor

Enhanced context extraction with vector search capabilities.

### Constructor

```typescript
new SmartContextExtractor(
  maxContextTokens?: number,
  questionClassifier?: QuestionClassifierService,
  codebaseUnderstanding?: CodebaseUnderstandingService,
  vectorDb?: VectorDatabaseService
)
```

**Parameters:**

- `maxContextTokens`: Maximum tokens for context (default: 6000)
- `questionClassifier`: Service for categorizing questions
- `codebaseUnderstanding`: Service for codebase analysis
- `vectorDb`: Optional vector database for semantic search

### Methods

#### `enhanceMessageWithSmartContext(message: string): Promise<string>`

Main method for enhancing user messages with relevant context.

```typescript
const extractor = new SmartContextExtractor(6000, classifier, understanding, vectorDb);
const enhancedMessage = await extractor.enhanceMessageWithSmartContext(
  "How is user authentication implemented in this codebase?"
);
```

**Returns:** Enhanced message with relevant code context and AI instructions

**Behavior:**

1. Categorizes the question
2. Performs vector search if available
3. Falls back to keyword-based search
4. Formats context with specific instructions

---

#### `extractRelevantContextWithVector(userQuestion: string, activeFile?: string): Promise<string>`

Extracts relevant context using vector search with fallback.

```typescript
const context = await extractor.extractRelevantContextWithVector("database connection logic", "/current/file.ts");
```

**Parameters:**

- `userQuestion`: User's question or query
- `activeFile`: Optional currently active file for context boosting

**Returns:** Formatted context string with code snippets and file references

## Interfaces & Types

### CodeSnippet

Represents a code snippet for vector indexing.

```typescript
interface CodeSnippet {
  id: string; // Unique identifier
  filePath: string; // Full file path
  type: "function" | "class" | "interface" | "enum" | "module";
  name: string; // Function/class name
  content: string; // Actual code content
  metadata?: Record<string, any>; // Additional metadata
}
```

**Example:**

```typescript
const snippet: CodeSnippet = {
  id: "auth.service.ts::AuthService::validateToken",
  filePath: "/src/services/auth.service.ts",
  type: "function",
  name: "validateToken",
  content: "public validateToken(token: string): boolean { /* ... */ }",
  metadata: {
    className: "AuthService",
    returnType: "boolean",
    parameters: ["token: string"],
    isPublic: true,
  },
};
```

### SearchResult

Represents a semantic search result.

```typescript
interface SearchResult {
  content: string; // Code content
  metadata: Record<string, any>; // Associated metadata
  distance: number; // Vector distance (lower = more similar)
  relevanceScore: number; // Normalized relevance (0-1, higher = more relevant)
}
```

**Example:**

```typescript
const result: SearchResult = {
  content: "public authenticate(credentials: LoginCredentials): Promise<User>",
  metadata: {
    filePath: "/src/auth/auth.service.ts",
    type: "function",
    name: "authenticate",
    className: "AuthService",
  },
  distance: 0.15,
  relevanceScore: 0.85,
};
```

### DatabaseStats

Database status information.

```typescript
interface DatabaseStats {
  isInitialized: boolean;
  collectionName?: string;
}
```

### VectorDbConfig

Configuration options for vector database.

```typescript
interface VectorDbConfig {
  enabled: boolean; // Enable/disable vector search
  embeddingModel: "openai" | "local"; // Embedding provider
  maxTokens: number; // Maximum context tokens
  batchSize: number; // Indexing batch size
  syncDelay: number; // File change debounce delay (ms)
  maxResults: number; // Maximum search results
}
```

## Error Handling

### Common Errors

#### `VectorDatabaseNotInitializedError`

```typescript
class VectorDatabaseNotInitializedError extends Error {
  constructor() {
    super("Vector database not initialized. Call initialize() first.");
  }
}
```

**Resolution:** Call `vectorDb.initialize()` before using other methods.

#### `EmbeddingGenerationError`

```typescript
class EmbeddingGenerationError extends Error {
  constructor(cause: string) {
    super(`Failed to generate embeddings: ${cause}`);
  }
}
```

**Common causes:**

- Invalid API key
- Network connectivity issues
- Malformed input text

#### `FileIndexingError`

```typescript
class FileIndexingError extends Error {
  constructor(filePath: string, cause: string) {
    super(`Failed to index file ${filePath}: ${cause}`);
  }
}
```

**Resolution:** Check file permissions and TypeScript parsing

### Error Handling Patterns

#### Graceful Degradation

```typescript
async extractContext(question: string): Promise<string> {
  try {
    // Try vector search first
    const vectorResults = await this.vectorDb.semanticSearch(question);
    if (vectorResults.length > 0) {
      return this.formatVectorResults(vectorResults);
    }
  } catch (error) {
    this.logger.warn('Vector search failed, using fallback:', error);
  }

  // Fallback to keyword-based search
  return this.fallbackContextExtraction(question);
}
```

#### Retry Logic

```typescript
async indexWithRetry(snippets: CodeSnippet[], maxRetries: number = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await this.vectorDb.indexCodeSnippets(snippets);
      return;
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Usage Examples

### Basic Setup

```typescript
import { VectorDatabaseService, VectorDbSyncService } from "./services";
import { getGenerativeAiModel, getAPIKeyAndModel } from "../utils/utils";

// Initialize vector database with fixed Gemini embedding model
const embeddingProvider = "Gemini"; // Fixed for consistency
const { apiKey: embeddingApiKey } = getAPIKeyAndModel(embeddingProvider);
const vectorDb = new VectorDatabaseService(context, embeddingApiKey);
await vectorDb.initialize();

// Setup automatic synchronization
const syncService = new VectorDbSyncService(vectorDb, codeIndexing, sqliteDb);
await syncService.initializeAndSync();
```

### Semantic Code Search

```typescript
// Search for authentication-related code
const authResults = await vectorDb.semanticSearch("user login authentication validation", 5, { type: "function" });

// Search for database operations
const dbResults = await vectorDb.semanticSearch("database query insert update delete", 10, {
  filePath: { $regex: ".*repository.*" },
});
```

### Context Enhancement

```typescript
// Enhance user question with relevant context - automatically uses current model
const smartExtractor = new SmartContextExtractor(6000, questionClassifier, codebaseUnderstanding, vectorDb);

const userQuestion = "How does the payment processing work?";
const enhancedMessage = await smartExtractor.enhanceMessageWithSmartContext(userQuestion);

// Send to currently selected AI model
const currentModel = getGenerativeAiModel();
const response = await generateModelResponse(enhancedMessage, currentModel);
```

### File Change Handling

```typescript
// Manual file reindexing
await syncService.reindexSingleFile("/src/services/new-service.ts");

// Bulk reindexing
const modifiedFiles = ["/src/models/user.ts", "/src/services/auth.service.ts", "/src/controllers/user.controller.ts"];

for (const file of modifiedFiles) {
  await syncService.reindexSingleFile(file);
}
```

### Performance Monitoring

```typescript
// Monitor search performance
const searchStart = Date.now();
const results = await vectorDb.semanticSearch(query);
const searchTime = Date.now() - searchStart;

logger.info(`Semantic search completed in ${searchTime}ms, found ${results.length} results`);

// Monitor indexing performance
const indexStart = Date.now();
await vectorDb.indexCodeSnippets(snippets);
const indexTime = Date.now() - indexStart;

logger.info(`Indexed ${snippets.length} snippets in ${indexTime}ms`);
```

### Custom Metadata Filtering

```typescript
// Search only in service files
const serviceResults = await vectorDb.semanticSearch("data processing logic", 10, {
  filePath: { $regex: ".*/services/.*" },
});

// Search for public methods only
const publicResults = await vectorDb.semanticSearch("public API methods", 5, {
  type: "function",
  isPublic: true,
});

// Search in specific class
const classResults = await vectorDb.semanticSearch("error handling", 8, { className: "ErrorHandler" });
```

## Performance Considerations

### Optimization Tips

1. **Batch Operations**

   ```typescript
   // Good: Batch index multiple snippets
   await vectorDb.indexCodeSnippets(allSnippets);

   // Avoid: Index one by one
   for (const snippet of allSnippets) {
     await vectorDb.indexCodeSnippets([snippet]); // Inefficient
   }
   ```

2. **Selective Filtering**

   ```typescript
   // Use metadata filters to reduce search space
   const results = await vectorDb.semanticSearch(
     query,
     10,
     { type: "function", isPublic: true } // Filters applied at DB level
   );
   ```

3. **Context Token Management**
   ```typescript
   // Adjust context size based on complexity
   const extractor = new SmartContextExtractor(
     question.includes("implementation") ? 8000 : 4000 // Dynamic sizing
   );
   ```

## Migration Guide

### From Keyword-Based to Vector Search

```typescript
// Old approach
const keywordResults = await searchByKeywords(query, files);

// New approach with fallback
async function hybridSearch(query: string): Promise<SearchResult[]> {
  try {
    const vectorResults = await vectorDb.semanticSearch(query);
    if (vectorResults.length > 0) {
      return vectorResults;
    }
  } catch (error) {
    logger.warn("Vector search failed, using keyword fallback");
  }

  // Fallback to existing keyword search
  return convertToSearchResults(keywordResults);
}
```

### Gradual Rollout

```typescript
// Feature flag for gradual rollout
const useVectorSearch = process.env.ENABLE_VECTOR_SEARCH === "true";

const contextExtractor = useVectorSearch ? new VectorSmartContextExtractor(config) : new SmartContextExtractor(config);
```

For additional information, see:

- [Implementation Guide](SMART_CONTEXT_IMPLEMENTATION.md)
- [Troubleshooting Guide](VECTOR_DB_TROUBLESHOOTING.md)
- [Performance Optimization](VECTOR_DB_PERFORMANCE.md)

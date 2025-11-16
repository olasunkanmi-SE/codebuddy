# Smart Embedding Strategy Guide

## 🎯 **Overview**

This guide outlines the comprehensive embedding strategy for CodeBuddy's vector database system. Instead of a simple "embed everything at once" approach, we use a sophisticated multi-phase strategy that prioritizes user productivity and system resources.

## 📊 **The Problem with Simple Approaches**

### **❌ Naive Approach: Embed Everything at Startup**

```typescript
// This blocks the UI for minutes and wastes resources
async activate(context) {
  const allFiles = await getAllCodeFiles(); // 2000+ files
  await embedAllFiles(allFiles); // 3-5 minutes of UI freeze
  // User can't work during this time
}
```

### **❌ Lazy Approach: Embed Nothing Until Asked**

```typescript
// This causes delays when user needs help
async onUserQuestion(question) {
  const relevantFiles = findRelevantFiles(question);
  await embedFiles(relevantFiles); // 30 second delay per question
  // Poor user experience
}
```

## ✅ **Smart Multi-Phase Strategy**

### **Phase 1: Immediate Embedding (0-10 seconds)**

**Goal**: Enable immediate productivity with essential context

```typescript
class ImmediateEmbeddingPhase {
  async embedEssentials(context: vscode.ExtensionContext): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Preparing CodeBuddy context...",
        cancellable: false,
      },
      async (progress) => {
        const essentialFiles = await this.identifyEssentialFiles();

        for (let i = 0; i < essentialFiles.length; i++) {
          await this.embedFile(essentialFiles[i]);
          progress.report({
            increment: 100 / essentialFiles.length,
            message: `Indexed ${path.basename(essentialFiles[i])}`,
          });
        }
      }
    );
  }

  private async identifyEssentialFiles(): Promise<string[]> {
    const essentials: string[] = [];

    // 1. Currently open files (highest priority)
    const openFiles = vscode.workspace.textDocuments
      .filter((doc) => doc.languageId === "typescript" && !doc.isUntitled)
      .map((doc) => doc.fileName);

    // 2. Entry points from package.json
    const entryPoints = await this.findEntryPoints();

    // 3. Recently modified files (last 7 days)
    const recentFiles = await this.getRecentlyModified(7);

    // 4. Most imported files (dependency analysis)
    const mostImported = await this.getMostImportedFiles(10);

    // 5. Main directories' index files
    const indexFiles = await this.findIndexFiles();

    return [...new Set([...openFiles, ...entryPoints, ...recentFiles.slice(0, 5), ...mostImported, ...indexFiles])];
  }

  private async findEntryPoints(): Promise<string[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return [];

    const entryPoints: string[] = [];

    for (const folder of workspaceFolders) {
      try {
        const packageJsonPath = path.join(folder.uri.fsPath, "package.json");
        const packageJson = JSON.parse(
          await vscode.workspace.fs.readFile(vscode.Uri.file(packageJsonPath)).then((data) => data.toString())
        );

        // Add main entry point
        if (packageJson.main) {
          const mainPath = path.resolve(folder.uri.fsPath, packageJson.main);
          entryPoints.push(mainPath);
        }

        // Add TypeScript entry points
        const commonEntries = ["src/index.ts", "src/main.ts", "index.ts", "main.ts"];
        for (const entry of commonEntries) {
          const entryPath = path.join(folder.uri.fsPath, entry);
          if (await this.fileExists(entryPath)) {
            entryPoints.push(entryPath);
          }
        }
      } catch (error) {
        // Continue if package.json doesn't exist
      }
    }

    return entryPoints;
  }
}
```

### **Phase 2: Context-Aware On-Demand (triggered by usage)**

**Goal**: Embed files based on user behavior and context

```typescript
class OnDemandEmbeddingPhase {
  constructor(private workerManager: VectorDbWorkerManager) {
    this.setupTriggers();
  }

  private setupTriggers(): void {
    // Trigger 1: User asks questions
    vscode.commands.registerCommand("codebuddy.askQuestion", async (question: string) => {
      await this.onUserQuestion(question);
    });

    // Trigger 2: File navigation
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      if (editor?.document.languageId === "typescript") {
        await this.onFileOpened(editor.document.fileName);
      }
    });

    // Trigger 3: File editing
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      if (event.document.languageId === "typescript") {
        await this.onFileEdited(event.document.fileName);
      }
    });
  }

  async onUserQuestion(question: string): Promise<void> {
    const relevantFiles = await this.identifyRelevantFiles(question);
    const unembedded = await this.filterUnembedded(relevantFiles);

    if (unembedded.length > 0) {
      // Show quick progress for context-specific embedding
      vscode.window.setStatusBarMessage(
        `🔍 Finding context for: "${question.substring(0, 30)}..."`,
        this.embedFilesQuietly(unembedded)
      );
    }
  }

  async onFileOpened(filePath: string): Promise<void> {
    // Find related files that should be embedded
    const relatedFiles = await this.findRelatedFiles(filePath);

    // Queue for background processing (no user feedback needed)
    this.queueForBackgroundEmbedding(relatedFiles);
  }

  private async identifyRelevantFiles(question: string): Promise<string[]> {
    const keywords = this.extractTechnicalKeywords(question);
    const candidates: string[] = [];

    // Search by filename patterns
    for (const keyword of keywords) {
      const matchingFiles = await this.findFilesByPattern(keyword);
      candidates.push(...matchingFiles);
    }

    // Search by content patterns (without full embedding)
    const contentMatches = await this.findFilesByContentKeywords(keywords);
    candidates.push(...contentMatches);

    // Rank by relevance to question
    return this.rankByRelevance(candidates, question);
  }

  private async findRelatedFiles(filePath: string): Promise<string[]> {
    const related: string[] = [];

    // 1. Direct imports/exports
    const imports = await this.parseImports(filePath);
    const exports = await this.findWhoImportsThis(filePath);

    // 2. Same directory files
    const siblings = await this.getSiblingFiles(filePath);

    // 3. Test files
    const testFiles = await this.findTestFiles(filePath);

    return [...imports, ...exports, ...siblings, ...testFiles];
  }
}
```

### **Phase 3: Background Processing (idle time)**

**Goal**: Gradually build comprehensive context during downtime

```typescript
class BackgroundEmbeddingPhase {
  private isUserIdle = false;
  private readonly IDLE_THRESHOLD = 3000; // 3 seconds
  private readonly BATCH_SIZE = 8; // Files per batch
  private idleTimer?: NodeJS.Timeout;

  startBackgroundProcessing(): void {
    this.setupIdleDetection();
    this.setupProgressiveIndexing();
  }

  private setupIdleDetection(): void {
    // Monitor user activity across different VS Code events
    const activityEvents = [
      vscode.workspace.onDidChangeTextDocument,
      vscode.window.onDidChangeActiveTextEditor,
      vscode.commands.registerCommand("codebuddy.userActivity", () => {}),
      vscode.window.onDidChangeTextEditorSelection,
    ];

    activityEvents.forEach((event) => {
      if (typeof event === "function") {
        event(() => this.resetIdleTimer());
      }
    });

    this.resetIdleTimer();
  }

  private resetIdleTimer(): void {
    this.isUserIdle = false;

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      this.isUserIdle = true;
      this.processBackgroundBatch();
    }, this.IDLE_THRESHOLD);
  }

  private async processBackgroundBatch(): Promise<void> {
    if (!this.isUserIdle) return;

    // Get next batch of unprocessed files
    const unprocessedFiles = await this.getUnprocessedFiles();
    if (unprocessedFiles.length === 0) {
      this.onBackgroundProcessingComplete();
      return;
    }

    const batch = this.prioritizeBatch(unprocessedFiles.slice(0, this.BATCH_SIZE));

    // Process silently in background
    try {
      vscode.window.setStatusBarMessage(
        `📚 Background indexing: ${batch.length} files...`,
        this.processBatchSilently(batch)
      );

      // Schedule next batch if still idle
      setTimeout(() => {
        if (this.isUserIdle) {
          this.processBackgroundBatch();
        }
      }, 2000);
    } catch (error) {
      // Silent failure - don't interrupt user
      console.warn("Background embedding failed:", error);
    }
  }

  private prioritizeBatch(files: string[]): string[] {
    // Sort by priority: test files < config files < source files
    return files.sort((a, b) => {
      const priorityA = this.getFilePriority(a);
      const priorityB = this.getFilePriority(b);
      return priorityB - priorityA; // Higher priority first
    });
  }

  private getFilePriority(filePath: string): number {
    if (filePath.includes(".test.") || filePath.includes(".spec.")) return 1;
    if (filePath.includes("config") || filePath.includes(".json")) return 2;
    if (filePath.includes("/src/")) return 4;
    if (filePath.includes("/lib/") || filePath.includes("/utils/")) return 3;
    return 2;
  }

  private async processBatchSilently(files: string[]): Promise<void> {
    await this.workerManager.indexFiles(files, {
      silent: true,
      lowPriority: true,
    });

    // Update progress tracking
    await this.updateBackgroundProgress(files);
  }
}
```

### **Phase 4: Bulk Processing (user-initiated)**

**Goal**: Complete codebase indexing when explicitly requested

```typescript
class BulkEmbeddingPhase {
  async registerBulkCommand(context: vscode.ExtensionContext): Promise<void> {
    const command = vscode.commands.registerCommand("codebuddy.indexEntireCodebase", () => this.processBulkEmbedding());

    context.subscriptions.push(command);
  }

  async processBulkEmbedding(): Promise<void> {
    const allFiles = await this.getAllCodeFiles();
    const unprocessed = await this.filterUnprocessed(allFiles);

    if (unprocessed.length === 0) {
      vscode.window.showInformationMessage("✅ Codebase is already fully indexed!");
      return;
    }

    const estimatedTime = Math.ceil(unprocessed.length / 10); // ~10 files per second
    const proceed = await vscode.window.showWarningMessage(
      `Index ${unprocessed.length} files? Estimated time: ${estimatedTime} seconds.`,
      { modal: true },
      "Yes, Index All",
      "Index in Background",
      "Cancel"
    );

    if (proceed === "Cancel" || !proceed) return;

    const inBackground = proceed === "Index in Background";

    if (inBackground) {
      this.processBulkInBackground(unprocessed);
    } else {
      await this.processBulkWithProgress(unprocessed);
    }
  }

  private async processBulkWithProgress(files: string[]): Promise<void> {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Indexing entire codebase",
        cancellable: true,
      },
      async (progress, token) => {
        const batchSize = 15;
        let processed = 0;

        for (let i = 0; i < files.length; i += batchSize) {
          if (token.isCancellationRequested) {
            vscode.window.showWarningMessage(`Indexing cancelled. Processed ${processed}/${files.length} files.`);
            break;
          }

          const batch = files.slice(i, i + batchSize);

          try {
            await this.workerManager.indexFiles(batch);
            processed += batch.length;

            progress.report({
              increment: (batch.length / files.length) * 100,
              message: `${processed}/${files.length} files indexed`,
            });
          } catch (error) {
            console.error(`Batch failed:`, error);
            // Continue with next batch
          }
        }

        vscode.window.showInformationMessage(`✅ Indexing complete! Processed ${processed} files.`);
      }
    );
  }

  private async processBulkInBackground(files: string[]): Promise<void> {
    vscode.window.showInformationMessage(
      `🔄 Started background indexing of ${files.length} files. Check status bar for progress.`
    );

    // Process in smaller batches with delays
    const batchSize = 8;
    let processed = 0;

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      vscode.window.setStatusBarMessage(
        `📚 Background indexing: ${processed + batch.length}/${files.length}`,
        this.workerManager.indexFiles(batch)
      );

      processed += batch.length;

      // Delay between batches to keep system responsive
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    vscode.window.showInformationMessage(`✅ Background indexing complete! Indexed ${processed} files.`);
  }
}
```

## 🎯 **Orchestrating All Phases**

```typescript
class SmartEmbeddingOrchestrator {
  private phases: {
    immediate: ImmediateEmbeddingPhase;
    onDemand: OnDemandEmbeddingPhase;
    background: BackgroundEmbeddingPhase;
    bulk: BulkEmbeddingPhase;
  };

  constructor(
    private context: vscode.ExtensionContext,
    private workerManager: VectorDbWorkerManager
  ) {
    this.phases = {
      immediate: new ImmediateEmbeddingPhase(workerManager),
      onDemand: new OnDemandEmbeddingPhase(workerManager),
      background: new BackgroundEmbeddingPhase(workerManager),
      bulk: new BulkEmbeddingPhase(workerManager),
    };
  }

  async initialize(): Promise<void> {
    // Phase 1: Immediate (blocking, but fast)
    await this.phases.immediate.embedEssentials(this.context);

    // Phase 2: Setup on-demand triggers
    this.phases.onDemand.setupTriggers();

    // Phase 3: Start background processing
    this.phases.background.startBackgroundProcessing();

    // Phase 4: Register bulk command
    await this.phases.bulk.registerBulkCommand(this.context);

    console.log("🚀 Smart embedding strategy initialized");
  }
}
```

## 📊 **Expected Performance & UX**

| Phase          | Files     | Time    | User Impact       | When            |
| -------------- | --------- | ------- | ----------------- | --------------- |
| **Immediate**  | 5-15      | 5-10s   | Brief loading     | Extension start |
| **On-Demand**  | 3-8       | 2-5s    | Context-aware     | User questions  |
| **Background** | Remaining | Gradual | None              | Idle time       |
| **Bulk**       | All       | 2-10min | Optional progress | User choice     |

## 🎯 **Benefits of This Strategy**

### **✅ User Experience**

- **Immediate productivity**: Essential files ready in 10 seconds
- **Responsive interface**: No long blocking operations
- **Contextual intelligence**: Files embedded when needed
- **Progress transparency**: Clear feedback on all operations

### **✅ Resource Efficiency**

- **Smart prioritization**: Most valuable files first
- **Idle utilization**: Background work during downtime
- **Adaptive batching**: Size based on system resources
- **Cancellable operations**: User maintains control

### **✅ Scalability**

- **Works with any codebase size**: 10 files or 10,000 files
- **Memory conscious**: Controlled batch processing
- **Network efficient**: Prioritized API usage
- **Fault tolerant**: Graceful degradation on failures

This multi-phase approach ensures CodeBuddy provides immediate value while building comprehensive context over time! 🚀

# App Server Dependency Audit

This document identifies all `vscode` API usages in the core logic ("Brain") of CodeBuddy and outlines the strategy for migrating them to the Headless App Server architecture.

## 🔍 Migration Strategies

| Strategy ID | Name | Description |
| :--- | :--- | :--- |
| **S1** | **Native Replacement** | Replace `vscode` API with standard Node.js modules (e.g., `fs`, `path`, `crypto`). |
| **S2** | **Protocol Injection** | Pass the data (e.g., config, workspace path) via the `initialize` handshake or `turn/start` request. |
| **S3** | **RPC Notification** | Replace UI feedback (progress, messages) with JSON-RPC notifications (`window/logMessage`, `turn/progress`). |
| **S4** | **MCP Tool Call** | The Server asks the Client to perform the action via an MCP Tool (e.g., `client_edit_file`, `client_git_commit`). |
| **S5** | **Polyfill/Mock** | Create a lightweight interface (e.g., `ICancellationToken`) that mimics VS Code but works in Node.js. |

---

## 📂 Module Analysis

### 1. `src/agents/developer/agent.ts`
*Core Agent Logic*

| VS Code API | Usage | Migration Strategy | Notes |
| :--- | :--- | :--- | :--- |
| `vscode.window.showWarningMessage` | Notify user of missing model | **S3** | Send `window/showMessage` notification. |
| `vscode.workspace.workspaceFolders` | Get root path for Ripgrep | **S2** | Root path is passed in `initialize` params. |
| `vscode.Disposable` | Resource cleanup | **S5** | Use generic `Disposable` interface. |

### 2. `src/services/file-service.ts`
*File System Abstraction*

| VS Code API | Usage | Migration Strategy | Notes |
| :--- | :--- | :--- | :--- |
| `vscode.workspace.fs.readFile` | Read file content | **S1** | Use Node.js `fs.promises.readFile`. |
| `vscode.workspace.fs.writeFile` | Write file content | **S1** | Use Node.js `fs.promises.writeFile`. |
| `vscode.workspace.fs.stat` | Get file metadata | **S1** | Use Node.js `fs.promises.stat`. |
| `vscode.workspace.findFiles` | Glob search with gitignore | **S1/S4** | Use `glob` or `ripgrep` (fast) locally, or `client_find_files` if remote. |

### 3. `src/services/workspace-service.ts`
*Workspace Management*

| VS Code API | Usage | Migration Strategy | Notes |
| :--- | :--- | :--- | :--- |
| `vscode.workspace.workspaceFolders` | Get root path | **S2** | Store `rootPath` in `ServerContext`. |
| `vscode.workspace.textDocuments` | Get open files | **S2** | Client sends `textDocument/didOpen` and `didClose` notifications. |
| `vscode.Uri.file` | Path handling | **S1** | Use `path` module or `vscode-uri` npm package. |

### 4. `src/services/codebase-understanding.service.ts`
*AST Analysis & Indexing*

| VS Code API | Usage | Migration Strategy | Notes |
| :--- | :--- | :--- | :--- |
| `vscode.CancellationToken` | Cancel long tasks | **S5** | Use standard `AbortSignal`. |
| `vscode.Progress` | Report progress | **S3** | Send `$/progress` notifications. |
| `vscode.workspace.findFiles` | Find package.json, etc. | **S1** | Use `glob` or `ripgrep`. |

### 5. `src/services/context-retriever.ts`
*Vector Store & RAG*

| VS Code API | Usage | Migration Strategy | Notes |
| :--- | :--- | :--- | :--- |
| `vscode.ExtensionContext` | Path to storage | **S2** | Pass `storagePath` in `initialize` params. |

### 6. `src/orchestrator.ts`
*Task Management*

| VS Code API | Usage | Migration Strategy | Notes |
| :--- | :--- | :--- | :--- |
| `vscode.Disposable` | Cleanup | **S5** | Use generic `Disposable`. |
| `vscode.window` | UI Events | **S3** | Move event listeners to `extension.ts` (Client) and forward via RPC. |

---

### 7. `src/agents/backends/filesystem.ts`
*Filesystem Backend (DeepAgents Adapter)*

| VS Code API | Usage | Migration Strategy | Notes |
| :--- | :--- | :--- | :--- |
| `DiffReviewService` | Intercepts writes for review | **S1/S4** | The current `VscodeFsBackend` is coupled to `DiffReviewService` (which uses `vscode`). Restore the **original** `deepagentsjs` filesystem backend (pure Node.js) for the Server. |

---

## 🏗 Recommended Interface Changes

### `IEditorHost` Interface
To decouple the code, we will introduce an `IEditorHost` interface that `DeveloperAgent` and Services depend on.

```typescript
export interface IEditorHost {
    // UI
    showMessage(type: 'info' | 'warn' | 'error', message: string): Promise<void>;
    
    // Workspace
    getWorkspaceRoot(): string | undefined;
    findFiles(include: string, exclude?: string): Promise<string[]>;
    readFile(path: string): Promise<string>;
    writeFile(path: string, content: string): Promise<void>;
    
    // State
    getGlobalState(key: string): Promise<any>;
    setGlobalState(key: string, value: any): Promise<void>;
}
```

**Implementations:**
1.  `VSCodeEditorHost`: Wraps `vscode.*` API (for legacy/testing).
2.  `ServerEditorHost`: Uses Node.js `fs` and sends JSON-RPC notifications for UI.

## 📅 Next Steps
1.  Create `src/interfaces/editor-host.interface.ts`.
2.  Refactor `FileService` to implement/use `IEditorHost`.
3.  Update `DeveloperAgent` to take `IEditorHost` in constructor.

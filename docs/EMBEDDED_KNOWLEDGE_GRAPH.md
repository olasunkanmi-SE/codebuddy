# 🕸️ Embedded Knowledge Graph for CodeBuddy VS Code Extension

## 🎯 Overview

A **lightweight, embedded knowledge graph** system that runs entirely within the VS Code extension without requiring external database setup. This provides the power of graph-based code understanding while maintaining the seamless user experience expected from a VS Code extension.

---

## 🏗️ Embedded Architecture Design

### **Core Principle: Zero External Dependencies**
```
📦 VS Code Extension
├── 💾 SQLite Database (existing)
├── 🧠 In-Memory Graph Store  
├── 🔍 Vector Embeddings (existing)
└── 📊 Graph Query Engine (new)
```

### **Hybrid Approach: SQLite + In-Memory Graph**

#### **Why This Works for VS Code Extensions:**
- ✅ **Zero Setup**: Works out of the box, no external services
- ✅ **Offline-First**: Fully functional without internet
- ✅ **Performance**: In-memory graph operations are lightning fast
- ✅ **Persistence**: SQLite stores graph structure permanently
- ✅ **VS Code Native**: Uses extension storage APIs
- ✅ **Resource Efficient**: Optimized for typical project sizes

```typescript
// src/services/embedded-knowledge-graph.service.ts
import * as vscode from 'vscode';
import Database from 'better-sqlite3';

interface GraphNode {
  id: string;
  type: 'File' | 'Class' | 'Method' | 'Interface' | 'Import' | 'Endpoint';
  properties: Record<string, any>;
  connections: Set<string>; // In-memory adjacency list
}

interface GraphEdge {
  id: string;
  from: string;
  to: string;
  type: 'CONTAINS' | 'CALLS' | 'DEPENDS_ON' | 'IMPLEMENTS' | 'IMPORTS';
  properties: Record<string, any>;
}

export class EmbeddedKnowledgeGraphService {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge> = new Map();
  private db: Database.Database;
  private context: vscode.ExtensionContext;
  
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    // Reuse existing SQLite database
    const dbPath = path.join(context.globalStorageUri.fsPath, 'codebuddy_graph.db');
    this.db = new Database(dbPath);
    this.initializeSchema();
    this.loadGraphFromStorage();
  }
}
```

---

## 📊 Embedded Graph Schema

### **SQLite Tables for Persistence**
```sql
-- Reuse existing database, add graph tables
CREATE TABLE IF NOT EXISTS graph_nodes (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    file_path TEXT,
    name TEXT,
    properties TEXT, -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS graph_edges (
    id TEXT PRIMARY KEY,
    from_node TEXT NOT NULL,
    to_node TEXT NOT NULL,
    edge_type TEXT NOT NULL,
    properties TEXT, -- JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_node) REFERENCES graph_nodes(id),
    FOREIGN KEY (to_node) REFERENCES graph_nodes(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_nodes_type ON graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_nodes_file_path ON graph_nodes(file_path);
CREATE INDEX IF NOT EXISTS idx_edges_from ON graph_edges(from_node);
CREATE INDEX IF NOT EXISTS idx_edges_to ON graph_edges(to_node);
CREATE INDEX IF NOT EXISTS idx_edges_type ON graph_edges(edge_type);
```

### **In-Memory Graph Structure**
```typescript
export class InMemoryGraph {
  private adjacencyList: Map<string, Set<string>> = new Map();
  private reverseAdjacencyList: Map<string, Set<string>> = new Map();
  private nodeIndex: Map<string, GraphNode> = new Map();
  
  addNode(node: GraphNode): void {
    this.nodeIndex.set(node.id, node);
    this.adjacencyList.set(node.id, new Set());
    this.reverseAdjacencyList.set(node.id, new Set());
  }
  
  addEdge(edge: GraphEdge): void {
    this.adjacencyList.get(edge.from)?.add(edge.to);
    this.reverseAdjacencyList.get(edge.to)?.add(edge.from);
  }
  
  findConnected(nodeId: string, maxDepth: number = 3): GraphNode[] {
    const visited = new Set<string>();
    const result: GraphNode[] = [];
    
    this.dfs(nodeId, 0, maxDepth, visited, result);
    return result;
  }
  
  private dfs(nodeId: string, depth: number, maxDepth: number, visited: Set<string>, result: GraphNode[]): void {
    if (depth > maxDepth || visited.has(nodeId)) return;
    
    visited.add(nodeId);
    const node = this.nodeIndex.get(nodeId);
    if (node) result.push(node);
    
    const connections = this.adjacencyList.get(nodeId) || new Set();
    for (const connectedId of connections) {
      this.dfs(connectedId, depth + 1, maxDepth, visited, result);
    }
  }
}
```

---

## 🔍 Code Analysis Integration

### **Enhanced AST Analysis for Graph Building**
```typescript
// src/services/ast-graph-builder.service.ts
import * as ts from 'typescript';
import * as vscode from 'vscode';

export class ASTGraphBuilderService {
  private graph: EmbeddedKnowledgeGraphService;
  
  async buildGraphFromWorkspace(): Promise<void> {
    const workspaceFiles = await vscode.workspace.findFiles('**/*.{ts,js,tsx,jsx}');
    
    for (const fileUri of workspaceFiles) {
      await this.processFile(fileUri);
    }
    
    // Build cross-file relationships
    await this.buildCrossFileRelationships();
  }
  
  private async processFile(fileUri: vscode.Uri): Promise<void> {
    const content = await vscode.workspace.fs.readFile(fileUri);
    const sourceFile = ts.createSourceFile(
      fileUri.fsPath,
      content.toString(),
      ts.ScriptTarget.Latest,
      true
    );
    
    const fileNode = this.createFileNode(fileUri);
    this.graph.addNode(fileNode);
    
    // Parse and create nodes for classes, methods, imports
    this.visitNode(sourceFile, fileNode.id);
  }
  
  private visitNode(node: ts.Node, parentId: string): void {
    switch (node.kind) {
      case ts.SyntaxKind.ClassDeclaration:
        this.handleClassDeclaration(node as ts.ClassDeclaration, parentId);
        break;
      case ts.SyntaxKind.FunctionDeclaration:
        this.handleFunctionDeclaration(node as ts.FunctionDeclaration, parentId);
        break;
      case ts.SyntaxKind.ImportDeclaration:
        this.handleImportDeclaration(node as ts.ImportDeclaration, parentId);
        break;
      case ts.SyntaxKind.CallExpression:
        this.handleCallExpression(node as ts.CallExpression, parentId);
        break;
    }
    
    ts.forEachChild(node, child => this.visitNode(child, parentId));
  }
  
  private handleClassDeclaration(node: ts.ClassDeclaration, fileId: string): void {
    const className = node.name?.text || 'Anonymous';
    const classNode: GraphNode = {
      id: `class_${fileId}_${className}`,
      type: 'Class',
      properties: {
        name: className,
        filePath: fileId,
        lineStart: this.getLineNumber(node),
        isExported: this.hasExportModifier(node),
        isAbstract: this.hasAbstractModifier(node)
      },
      connections: new Set()
    };
    
    this.graph.addNode(classNode);
    this.graph.addEdge({
      id: `contains_${fileId}_${classNode.id}`,
      from: fileId,
      to: classNode.id,
      type: 'CONTAINS',
      properties: {}
    });
    
    // Process methods and properties
    node.members.forEach(member => {
      if (ts.isMethodDeclaration(member)) {
        this.handleMethodDeclaration(member, classNode.id);
      }
    });
  }
}
```

### **Real-Time Graph Updates with File Watchers**
```typescript
// src/services/graph-watcher.service.ts
export class GraphWatcherService {
  private watcher: vscode.FileSystemWatcher;
  private graph: EmbeddedKnowledgeGraphService;
  
  constructor(graph: EmbeddedKnowledgeGraphService) {
    this.graph = graph;
    this.setupWatchers();
  }
  
  private setupWatchers(): void {
    // Watch for file changes
    this.watcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,js,tsx,jsx}');
    
    this.watcher.onDidCreate(uri => this.handleFileCreated(uri));
    this.watcher.onDidChange(uri => this.handleFileChanged(uri));
    this.watcher.onDidDelete(uri => this.handleFileDeleted(uri));
  }
  
  private async handleFileChanged(uri: vscode.Uri): Promise<void> {
    // Incremental graph update
    await this.graph.updateFileNodes(uri);
  }
  
  private async handleFileDeleted(uri: vscode.Uri): Promise<void> {
    // Clean up nodes and edges for deleted file
    await this.graph.removeFileNodes(uri);
  }
}
```

---

## 🚀 Graph Query Engine

### **Embedded Query Language (EQL)**
```typescript
// Simple query language for embedded graph
export class EmbeddedQueryLanguage {
  private graph: InMemoryGraph;
  
  // Find all methods that call a specific method
  findMethodCallers(methodName: string): GraphNode[] {
    const query = `
      FIND nodes
      WHERE type = 'Method' AND calls.includes('${methodName}')
      RETURN nodes
    `;
    return this.executeQuery(query);
  }
  
  // Find circular dependencies
  findCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recStack = new Set<string>();
    
    for (const [nodeId] of this.graph.nodeIndex) {
      if (!visited.has(nodeId)) {
        this.findCyclesFrom(nodeId, visited, recStack, [], cycles);
      }
    }
    
    return cycles;
  }
  
  // Find impact of changing a file
  findImpactRadius(fileId: string, maxDepth: number = 3): ImpactAnalysis {
    const affectedNodes = this.graph.findConnected(fileId, maxDepth);
    
    return {
      directImpact: affectedNodes.filter(n => this.getDistance(fileId, n.id) === 1),
      indirectImpact: affectedNodes.filter(n => this.getDistance(fileId, n.id) > 1),
      riskLevel: this.calculateRiskLevel(affectedNodes.length),
      affectedFiles: [...new Set(affectedNodes.map(n => n.properties.filePath))],
      affectedTests: affectedNodes.filter(n => n.properties.filePath?.includes('.test.')),
    };
  }
}
```

### **VS Code Command Integration**
```typescript
// src/commands/graph-commands.ts
export class GraphCommands {
  private graph: EmbeddedKnowledgeGraphService;
  
  constructor(graph: EmbeddedKnowledgeGraphService) {
    this.graph = graph;
  }
  
  registerCommands(context: vscode.ExtensionContext): void {
    // Show impact analysis for current file
    context.subscriptions.push(
      vscode.commands.registerCommand('codebuddy.showImpactAnalysis', () => {
        this.showImpactAnalysis();
      })
    );
    
    // Find related code
    context.subscriptions.push(
      vscode.commands.registerCommand('codebuddy.findRelatedCode', () => {
        this.findRelatedCode();
      })
    );
    
    // Show architectural insights
    context.subscriptions.push(
      vscode.commands.registerCommand('codebuddy.showArchInsights', () => {
        this.showArchitecturalInsights();
      })
    );
  }
  
  private async showImpactAnalysis(): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) return;
    
    const fileId = activeEditor.document.uri.fsPath;
    const impact = await this.graph.findImpactRadius(fileId);
    
    // Show in VS Code webview or info message
    const panel = vscode.window.createWebviewPanel(
      'impactAnalysis',
      'Impact Analysis',
      vscode.ViewColumn.Two,
      {}
    );
    
    panel.webview.html = this.generateImpactHTML(impact);
  }
}
```

---

## 📱 VS Code UI Integration

### **Graph Visualization in Webview**
```typescript
// src/webview/graph-visualization.ts
export class GraphVisualizationWebview {
  private panel: vscode.WebviewPanel;
  
  createVisualization(graphData: GraphData): void {
    this.panel = vscode.window.createWebviewPanel(
      'codeGraph',
      'Code Graph',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );
    
    this.panel.webview.html = this.getWebviewContent(graphData);
  }
  
  private getWebviewContent(graphData: GraphData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <script src="https://d3js.org/d3.v7.min.js"></script>
        <style>
            .node { cursor: pointer; }
            .link { stroke: #999; stroke-opacity: 0.6; }
            .node-file { fill: #69b3a2; }
            .node-class { fill: #404080; }
            .node-method { fill: #ff6b6b; }
        </style>
    </head>
    <body>
        <svg width="800" height="600"></svg>
        <script>
            const data = ${JSON.stringify(graphData)};
            
            const svg = d3.select("svg");
            const width = 800;
            const height = 600;
            
            const simulation = d3.forceSimulation(data.nodes)
                .force("link", d3.forceLink(data.links).id(d => d.id))
                .force("charge", d3.forceManyBody().strength(-300))
                .force("center", d3.forceCenter(width / 2, height / 2));
            
            // Render graph with D3.js
            const link = svg.append("g")
                .selectAll("line")
                .data(data.links)
                .enter().append("line")
                .attr("class", "link");
            
            const node = svg.append("g")
                .selectAll("circle")
                .data(data.nodes)
                .enter().append("circle")
                .attr("class", d => "node node-" + d.type.toLowerCase())
                .attr("r", 8)
                .call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));
            
            // Add labels
            const label = svg.append("g")
                .selectAll("text")
                .data(data.nodes)
                .enter().append("text")
                .text(d => d.name)
                .attr("font-size", "12px");
            
            simulation.on("tick", () => {
                link.attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y);
                
                node.attr("cx", d => d.x)
                    .attr("cy", d => d.y);
                
                label.attr("x", d => d.x + 10)
                     .attr("y", d => d.y + 3);
            });
        </script>
    </body>
    </html>`;
  }
}
```

### **Tree View for Code Relationships**
```typescript
// src/views/code-relationships-view.ts
export class CodeRelationshipsProvider implements vscode.TreeDataProvider<GraphNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<GraphNode | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  
  private graph: EmbeddedKnowledgeGraphService;
  
  constructor(graph: EmbeddedKnowledgeGraphService) {
    this.graph = graph;
  }
  
  getTreeItem(element: GraphNode): vscode.TreeItem {
    return {
      label: element.properties.name,
      tooltip: `${element.type}: ${element.properties.name}`,
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      iconPath: this.getIconForNodeType(element.type),
      command: {
        command: 'codebuddy.openNode',
        title: 'Open',
        arguments: [element]
      }
    };
  }
  
  async getChildren(element?: GraphNode): Promise<GraphNode[]> {
    if (!element) {
      // Root nodes - show current file's relationships
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) return [];
      
      const fileId = activeEditor.document.uri.fsPath;
      return this.graph.getConnectedNodes(fileId, 1);
    } else {
      // Child nodes
      return this.graph.getConnectedNodes(element.id, 1);
    }
  }
}
```

---

## ⚡ Performance Optimizations

### **Lazy Loading and Incremental Updates**
```typescript
export class PerformanceOptimizedGraph {
  private nodeCache: LRUCache<string, GraphNode>;
  private lastUpdateTime: Map<string, number> = new Map();
  
  constructor() {
    // Cache frequently accessed nodes
    this.nodeCache = new LRUCache({ max: 1000 });
  }
  
  async getNode(nodeId: string): Promise<GraphNode | undefined> {
    // Check cache first
    let node = this.nodeCache.get(nodeId);
    if (node) return node;
    
    // Load from database if not in cache
    node = await this.loadNodeFromDB(nodeId);
    if (node) {
      this.nodeCache.set(nodeId, node);
    }
    
    return node;
  }
  
  async updateFileIncremental(fileUri: vscode.Uri): Promise<void> {
    const filePath = fileUri.fsPath;
    const lastUpdate = this.lastUpdateTime.get(filePath) || 0;
    const fileStats = await vscode.workspace.fs.stat(fileUri);
    
    // Only update if file actually changed
    if (fileStats.mtime <= lastUpdate) return;
    
    // Remove old nodes for this file
    await this.removeFileNodes(filePath);
    
    // Add new nodes
    await this.processFile(fileUri);
    
    this.lastUpdateTime.set(filePath, Date.now());
  }
}
```

### **Memory Management**
```typescript
export class GraphMemoryManager {
  private readonly MAX_NODES_IN_MEMORY = 10000;
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes
  
  constructor(private graph: InMemoryGraph) {
    this.startCleanupTimer();
  }
  
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupUnusedNodes();
    }, this.CLEANUP_INTERVAL);
  }
  
  private cleanupUnusedNodes(): void {
    const nodeCount = this.graph.nodeIndex.size;
    
    if (nodeCount > this.MAX_NODES_IN_MEMORY) {
      // Remove least recently accessed nodes
      const sortedNodes = Array.from(this.graph.nodeIndex.entries())
        .sort(([, a], [, b]) => (a.lastAccessed || 0) - (b.lastAccessed || 0));
      
      const nodesToRemove = sortedNodes.slice(0, nodeCount - this.MAX_NODES_IN_MEMORY);
      
      for (const [nodeId] of nodesToRemove) {
        this.graph.removeNode(nodeId);
      }
    }
  }
}
```

---

## 🔧 VS Code Extension Integration

### **Package.json Configuration**
```json
{
  "contributes": {
    "commands": [
      {
        "command": "codebuddy.showImpactAnalysis",
        "title": "Show Impact Analysis",
        "category": "CodeBuddy"
      },
      {
        "command": "codebuddy.findRelatedCode",
        "title": "Find Related Code",
        "category": "CodeBuddy"
      },
      {
        "command": "codebuddy.showCodeGraph",
        "title": "Show Code Graph",
        "category": "CodeBuddy"
      },
      {
        "command": "codebuddy.detectCircularDeps",
        "title": "Detect Circular Dependencies",
        "category": "CodeBuddy"
      }
    ],
    "views": {
      "explorer": [
        {
          "id": "codebuddyRelationships",
          "name": "Code Relationships",
          "when": "codebuddy.graphEnabled"
        }
      ]
    },
    "menus": {
      "editor/context": [
        {
          "command": "codebuddy.showImpactAnalysis",
          "group": "CodeBuddy@1"
        },
        {
          "command": "codebuddy.findRelatedCode",
          "group": "CodeBuddy@2"
        }
      ]
    },
    "configuration": {
      "properties": {
        "codebuddy.graph.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable embedded knowledge graph features"
        },
        "codebuddy.graph.maxDepth": {
          "type": "number",
          "default": 3,
          "description": "Maximum depth for relationship traversal"
        },
        "codebuddy.graph.autoUpdate": {
          "type": "boolean",
          "default": true,
          "description": "Automatically update graph when files change"
        }
      }
    }
  }
}
```

### **Extension Activation**
```typescript
// src/extension.ts - Updated activation
export async function activate(context: vscode.ExtensionContext) {
  // ... existing code ...
  
  // Initialize embedded knowledge graph
  const embeddedGraph = new EmbeddedKnowledgeGraphService(context);
  
  // Register graph commands
  const graphCommands = new GraphCommands(embeddedGraph);
  graphCommands.registerCommands(context);
  
  // Register tree view
  const relationshipsProvider = new CodeRelationshipsProvider(embeddedGraph);
  vscode.window.createTreeView('codebuddyRelationships', {
    treeDataProvider: relationshipsProvider,
    showCollapseAll: true
  });
  
  // Start file watcher for real-time updates
  const graphWatcher = new GraphWatcherService(embeddedGraph);
  context.subscriptions.push(graphWatcher);
  
  // Build initial graph (background task)
  embeddedGraph.buildInitialGraph();
}
```

---

## 📈 Progressive Enhancement Strategy

### **Phase 1: Basic Graph (2-3 weeks)**
- ✅ SQLite storage for persistence
- ✅ In-memory adjacency lists for fast traversal
- ✅ Basic file/class/method node types
- ✅ Simple relationship tracking (contains, calls)

### **Phase 2: Smart Queries (3-4 weeks)**
- ✅ Impact analysis commands
- ✅ Related code finder
- ✅ Circular dependency detection
- ✅ Tree view integration

### **Phase 3: Visualization (2-3 weeks)**
- ✅ D3.js graph visualization in webview
- ✅ Interactive node exploration
- ✅ Relationship filtering and search

### **Phase 4: Advanced Features (4-5 weeks)**
- ✅ Architectural insights
- ✅ Code smell detection using graph patterns
- ✅ Refactoring suggestions based on relationships
- ✅ Integration with existing CodeBuddy features

---

## 💡 User Experience Examples

### **Right-Click Context Menu**
```
📁 user.service.ts
└── Right-click menu:
    ├── 🔍 CodeBuddy: Show Impact Analysis
    ├── 🕸️ CodeBuddy: Find Related Code  
    ├── 📊 CodeBuddy: Show in Graph View
    └── ⚠️ CodeBuddy: Check Dependencies
```

### **Command Palette**
```
Ctrl+Shift+P:
> CodeBuddy: Show Impact Analysis
> CodeBuddy: Find Circular Dependencies  
> CodeBuddy: Show Code Graph
> CodeBuddy: Find Related Code
```

### **Tree View in Explorer**
```
📂 EXPLORER
├── 📁 Files
├── 📁 Outline  
└── 🕸️ Code Relationships
    ├── 📄 Current File Dependencies
    │   ├── 🏗️ UserService
    │   ├── 📊 DatabaseService
    │   └── 🔐 AuthService
    ├── 📞 Called By (5)
    └── 📤 Calls (12)
```

---

## 🏁 Summary

This **embedded knowledge graph** approach gives you all the power of graph-based code understanding while maintaining the seamless VS Code extension experience:

### **✅ Benefits**
- **Zero Setup**: Works immediately after installation
- **Offline-First**: No external dependencies
- **Performance**: Lightning-fast in-memory operations
- **Storage**: Persistent graph in SQLite
- **VS Code Native**: Integrates perfectly with VS Code UI

### **📊 Resource Usage**
- **Memory**: ~50-100MB for typical projects (10k-50k LOC)
- **Storage**: ~10-50MB SQLite database  
- **CPU**: Minimal impact with incremental updates
- **Network**: Zero (fully offline)

### **🎯 Key Features**
- **Impact Analysis**: See what breaks when you change code
- **Related Code**: Find semantically connected code
- **Architecture Insights**: Detect circular dependencies, code smells
- **Visual Graphs**: Interactive D3.js visualizations
- **Real-time Updates**: Graph updates as you code

This approach gives CodeBuddy a **unique competitive advantage** without burdening users with external service setup requirements!

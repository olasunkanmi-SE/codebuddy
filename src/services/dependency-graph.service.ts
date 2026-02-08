import * as vscode from "vscode";
import * as path from "path";

export class DependencyGraphService implements vscode.Disposable {
  private static instance: DependencyGraphService;
  private cachedGraph: string | null = null;
  private watcher: vscode.FileSystemWatcher;
  private disposables: vscode.Disposable[] = [];

  private constructor() {
    // Watch for changes in supported file types to invalidate cache
    this.watcher = vscode.workspace.createFileSystemWatcher(
      "**/*.{ts,js,jsx,tsx,py,go}",
    );
    this.disposables.push(this.watcher);

    const invalidate = () => {
      this.cachedGraph = null;
    };

    this.watcher.onDidChange(invalidate);
    this.watcher.onDidCreate(invalidate);
    this.watcher.onDidDelete(invalidate);
  }

  public static getInstance(): DependencyGraphService {
    if (!DependencyGraphService.instance) {
      DependencyGraphService.instance = new DependencyGraphService();
    }
    return DependencyGraphService.instance;
  }

  public dispose() {
    this.disposables.forEach((d) => d.dispose());
  }

  /**
   * Generates a Mermaid flowchart string for the current workspace
   * @param force If true, bypasses the cache and regenerates the graph
   */
  public async generateGraph(force = false): Promise<string> {
    if (this.cachedGraph && !force) {
      return this.cachedGraph;
    }

    const files = await vscode.workspace.findFiles(
      "**/*.{ts,js,jsx,tsx,py,go}",
      "**/{node_modules,dist,out,.git,.vscode}/**",
      50, // Limit to 50 files to prevent huge graphs initially
    );

    const nodes = new Set<string>();
    const edges: { from: string; to: string }[] = [];

    for (const file of files) {
      const content = (await vscode.workspace.fs.readFile(file)).toString();
      const filename = path.basename(file.fsPath);
      nodes.add(filename);

      // Simple regex for imports
      // JS/TS: import ... from '...';
      const jsImportRegex = /import\s+.*?\s+from\s+['"](.+)['"]/g;

      let match;
      if (
        filename.endsWith(".ts") ||
        filename.endsWith(".js") ||
        filename.endsWith(".tsx") ||
        filename.endsWith(".jsx")
      ) {
        while ((match = jsImportRegex.exec(content)) !== null) {
          const importPath = match[1];
          // heuristic to find target file name from import path
          const targetName = path.basename(importPath);
          // Only add edge if it looks like a local file (simplified)
          if (importPath.startsWith(".")) {
            edges.push({ from: filename, to: targetName });
          }
        }
      }
    }

    // Build Mermaid string
    let mermaid = "graph TD\n";

    // Add nodes
    nodes.forEach((node) => {
      // Sanitize node ID
      const id = node.replace(/[^a-zA-Z0-9]/g, "_");
      mermaid += `  ${id}["${node}"]\n`;
    });

    // Add edges
    edges.forEach((edge) => {
      const fromId = edge.from.replace(/[^a-zA-Z0-9]/g, "_");
      // We need to find the full node name if possible, but for now we try to match partials
      // Or just create the node if it doesn't exist?
      // Let's iterate nodes to find best match for "to"
      const toNode = Array.from(nodes).find(
        (n) => n.startsWith(edge.to) || n.includes(edge.to),
      );

      if (toNode) {
        const toId = toNode.replace(/[^a-zA-Z0-9]/g, "_");
        if (fromId !== toId) {
          mermaid += `  ${fromId} --> ${toId}\n`;
        }
      }
    });

    this.cachedGraph = mermaid;
    return mermaid;
  }
}

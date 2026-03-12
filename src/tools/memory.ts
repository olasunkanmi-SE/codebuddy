import { SchemaType } from "@google/generative-ai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";

interface MemoryEntry {
  id: string;
  category: "Knowledge" | "Rule" | "Experience";
  content: string;
  keywords: string;
  title: string;
  scope: "user" | "project";
  timestamp: number;
}

export class MemoryTool {
  public static getFormattedMemories(): string {
    const tool = new MemoryTool();
    const memories = tool.loadAllMemories();
    if (memories.length === 0) return "";

    let prompt = "\n\n## 🧠 Core Memories (Context from previous sessions):\n";

    const userMemories = memories.filter((m) => m.scope === "user");
    if (userMemories.length > 0) {
      prompt += "\n### User Preferences & Habits:\n";
      userMemories.forEach((m) => {
        prompt += `- [${m.category}] ${m.title}: ${m.content}\n`;
      });
    }

    const projectMemories = memories.filter((m) => m.scope === "project");
    if (projectMemories.length > 0) {
      prompt += "\n### Project Knowledge & Rules:\n";
      projectMemories.forEach((m) => {
        prompt += `- [${m.category}] ${m.title}: ${m.content}\n`;
      });
    }

    return prompt;
  }

  /**
   * Global storage path for user-scoped memories.
   * Stored in ~/.codebuddy/user-memory.json so they persist across all workspaces.
   */
  private getGlobalStoragePath(): string {
    const globalDir = path.join(os.homedir(), ".codebuddy");
    if (!fs.existsSync(globalDir)) {
      fs.mkdirSync(globalDir, { recursive: true });
    }
    return path.join(globalDir, "user-memory.json");
  }

  /**
   * Workspace storage path for project-scoped memories.
   */
  private getWorkspaceStoragePath(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return undefined;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const codebuddyDir = path.join(rootPath, ".codebuddy");

    if (!fs.existsSync(codebuddyDir)) {
      fs.mkdirSync(codebuddyDir, { recursive: true });
    }

    return path.join(codebuddyDir, "memory.json");
  }

  private loadFromFile(filePath: string): MemoryEntry[] {
    if (!fs.existsSync(filePath)) return [];
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      return [];
    }
  }

  private saveToFile(filePath: string, memories: MemoryEntry[]): void {
    fs.writeFileSync(filePath, JSON.stringify(memories, null, 2));
  }

  /**
   * Loads all memories: global user memories + workspace project memories.
   */
  private loadAllMemories(): MemoryEntry[] {
    const globalMemories = this.loadFromFile(this.getGlobalStoragePath());
    const wsPath = this.getWorkspaceStoragePath();
    const wsMemories = wsPath ? this.loadFromFile(wsPath) : [];
    return [...globalMemories, ...wsMemories];
  }

  /**
   * Save a memory to the appropriate file based on scope.
   * user-scoped → global (~/.codebuddy/user-memory.json)
   * project-scoped → workspace (.codebuddy/memory.json)
   */
  private saveMemory(entry: MemoryEntry): void {
    if (entry.scope === "user") {
      const filePath = this.getGlobalStoragePath();
      const memories = this.loadFromFile(filePath);
      memories.push(entry);
      this.saveToFile(filePath, memories);
    } else {
      const filePath = this.getWorkspaceStoragePath();
      if (filePath) {
        const memories = this.loadFromFile(filePath);
        memories.push(entry);
        this.saveToFile(filePath, memories);
      }
    }
  }

  /**
   * Returns memories for the given scope from the correct file.
   */
  private getMemoriesForScope(scope: "user" | "project"): {
    memories: MemoryEntry[];
    filePath: string | undefined;
  } {
    if (scope === "user") {
      const filePath = this.getGlobalStoragePath();
      return { memories: this.loadFromFile(filePath), filePath };
    }
    const filePath = this.getWorkspaceStoragePath();
    return { memories: filePath ? this.loadFromFile(filePath) : [], filePath };
  }

  public async execute(
    action: string,
    memory?: Partial<MemoryEntry>,
    query?: string,
  ): Promise<string> {
    switch (action) {
      case "add": {
        if (
          !memory?.content ||
          !memory?.category ||
          !memory?.title ||
          !memory?.scope
        ) {
          return "Error: content, category, title, and scope are required for 'add'.";
        }
        const newMemory: MemoryEntry = {
          id: Math.random().toString(36).substring(7),
          category: memory.category,
          content: memory.content,
          keywords: memory.keywords || "",
          title: memory.title,
          scope: memory.scope,
          timestamp: Date.now(),
        };
        this.saveMemory(newMemory);
        return `Memory added: [${newMemory.category}] ${newMemory.title}`;
      }

      case "update": {
        if (!memory?.id) return "Error: Memory ID is required for 'update'.";
        // Find the memory in the correct scope file
        const scope = memory.scope || "user";
        const { memories, filePath } = this.getMemoriesForScope(scope);
        if (!filePath) return "Error: No storage path available.";
        const index = memories.findIndex((m) => m.id === memory.id);
        if (index === -1) {
          // Try the other scope
          const otherScope = scope === "user" ? "project" : "user";
          const other = this.getMemoriesForScope(
            otherScope as "user" | "project",
          );
          const otherIdx = other.memories.findIndex((m) => m.id === memory.id);
          if (otherIdx === -1 || !other.filePath)
            return `Error: Memory with ID ${memory.id} not found.`;
          other.memories[otherIdx] = {
            ...other.memories[otherIdx],
            ...memory,
            timestamp: Date.now(),
          };
          this.saveToFile(other.filePath, other.memories);
          return `Memory updated: ${other.memories[otherIdx].title}`;
        }
        memories[index] = {
          ...memories[index],
          ...memory,
          timestamp: Date.now(),
        };
        this.saveToFile(filePath, memories);
        return `Memory updated: ${memories[index].title}`;
      }

      case "delete": {
        if (!memory?.id) return "Error: Memory ID is required for 'delete'.";
        // Search both scopes for the ID
        for (const scope of ["user", "project"] as const) {
          const { memories, filePath } = this.getMemoriesForScope(scope);
          if (!filePath) continue;
          const filtered = memories.filter((m) => m.id !== memory.id);
          if (filtered.length < memories.length) {
            this.saveToFile(filePath, filtered);
            return "Memory deleted successfully.";
          }
        }
        return `Error: Memory with ID ${memory.id} not found.`;
      }

      case "search": {
        const allMemories = this.loadAllMemories();
        if (!query) return JSON.stringify(allMemories, null, 2);
        const lowerQuery = query.toLowerCase();
        const results = allMemories.filter(
          (m) =>
            m.title.toLowerCase().includes(lowerQuery) ||
            m.content.toLowerCase().includes(lowerQuery) ||
            m.keywords.toLowerCase().includes(lowerQuery),
        );
        return results.length > 0
          ? JSON.stringify(results, null, 2)
          : "No matching memories found.";
      }

      default:
        return "Error: Invalid action. Use 'add', 'update', 'delete', or 'search'.";
    }
  }

  config() {
    return {
      name: "manage_core_memory",
      description:
        "Manage persistent core memories (Knowledge, Rules, Experience) to maintain context across sessions. Use this to remember user preferences, architectural patterns, and lessons learned.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          action: {
            type: SchemaType.STRING,
            description:
              "The action to perform: 'add', 'update', 'delete', or 'search'.",
            enum: ["add", "update", "delete", "search"],
          },
          memory: {
            type: SchemaType.OBJECT,
            description: "Memory details (required for add/update/delete).",
            properties: {
              id: {
                type: SchemaType.STRING,
                description: "Memory ID (required for update/delete)",
              },
              category: {
                type: SchemaType.STRING,
                enum: ["Knowledge", "Rule", "Experience"],
              },
              content: {
                type: SchemaType.STRING,
                description: "Main content/rule",
              },
              title: { type: SchemaType.STRING, description: "Short title" },
              keywords: {
                type: SchemaType.STRING,
                description: "Keywords separated by |",
              },
              scope: { type: SchemaType.STRING, enum: ["user", "project"] },
            },
          },
          query: {
            type: SchemaType.STRING,
            description:
              "Search query string (used only with 'search' action).",
          },
        },
        required: ["action"],
      },
    };
  }
}

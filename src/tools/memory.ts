import { SchemaType } from "@google/generative-ai";
import * as fs from "fs";
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
    const memories = tool.loadMemories();
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

  private getStoragePath(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      return undefined;
    }
    const rootPath = workspaceFolders[0].uri.fsPath;
    const codebuddyDir = path.join(rootPath, ".codebuddy");

    if (!fs.existsSync(codebuddyDir)) {
      fs.mkdirSync(codebuddyDir);
    }

    return path.join(codebuddyDir, "memory.json");
  }

  private loadMemories(): MemoryEntry[] {
    const storagePath = this.getStoragePath();
    if (!storagePath || !fs.existsSync(storagePath)) {
      return [];
    }
    try {
      return JSON.parse(fs.readFileSync(storagePath, "utf8"));
    } catch {
      return [];
    }
  }

  private saveMemories(memories: MemoryEntry[]): void {
    const storagePath = this.getStoragePath();
    if (storagePath) {
      fs.writeFileSync(storagePath, JSON.stringify(memories, null, 2));
    }
  }

  public async execute(
    action: string,
    memory?: Partial<MemoryEntry>,
    query?: string,
  ): Promise<string> {
    const memories = this.loadMemories();

    switch (action) {
      case "add":
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
        memories.push(newMemory);
        this.saveMemories(memories);
        return `Memory added: [${newMemory.category}] ${newMemory.title}`;

      case "update":
        if (!memory?.id) return "Error: Memory ID is required for 'update'.";
        const index = memories.findIndex((m) => m.id === memory.id);
        if (index === -1)
          return `Error: Memory with ID ${memory.id} not found.`;

        memories[index] = {
          ...memories[index],
          ...memory,
          timestamp: Date.now(),
        };
        this.saveMemories(memories);
        return `Memory updated: ${memories[index].title}`;

      case "delete":
        if (!memory?.id) return "Error: Memory ID is required for 'delete'.";
        const initialLength = memories.length;
        const filtered = memories.filter((m) => m.id !== memory.id);
        if (filtered.length === initialLength)
          return `Error: Memory with ID ${memory.id} not found.`;

        this.saveMemories(filtered);
        return "Memory deleted successfully.";

      case "search":
        if (!query) return JSON.stringify(memories, null, 2);
        const lowerQuery = query.toLowerCase();
        const results = memories.filter(
          (m) =>
            m.title.toLowerCase().includes(lowerQuery) ||
            m.content.toLowerCase().includes(lowerQuery) ||
            m.keywords.toLowerCase().includes(lowerQuery),
        );
        return results.length > 0
          ? JSON.stringify(results, null, 2)
          : "No matching memories found.";

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

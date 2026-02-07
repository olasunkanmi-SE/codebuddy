import { SchemaType } from "@google/generative-ai";
import * as path from "path";
import { EditorHostService } from "../services/editor-host.service";
import { FileUtils } from "../utils/common-utils";

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
  public static async getFormattedMemories(): Promise<string> {
    const tool = new MemoryTool();
    const memories = await tool.loadMemories();
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

  private async getStoragePath(): Promise<string | undefined> {
    const rootPath =
      EditorHostService.getInstance().getHost().workspace.rootPath;
    if (!rootPath) {
      return undefined;
    }
    const codebuddyDir = path.join(rootPath, ".codebuddy");

    if (!(await FileUtils.fileExists(codebuddyDir))) {
      await EditorHostService.getInstance()
        .getHost()
        .workspace.fs.createDirectory(codebuddyDir);
    }

    return path.join(codebuddyDir, "memory.json");
  }

  private async loadMemories(): Promise<MemoryEntry[]> {
    const storagePath = await this.getStoragePath();
    if (!storagePath || !(await FileUtils.fileExists(storagePath))) {
      return [];
    }
    try {
      const contentBytes = await EditorHostService.getInstance()
        .getHost()
        .workspace.fs.readFile(storagePath);
      const content = new TextDecoder().decode(contentBytes);
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private async saveMemories(memories: MemoryEntry[]): Promise<void> {
    const storagePath = await this.getStoragePath();
    if (storagePath) {
      const content = JSON.stringify(memories, null, 2);
      const encoder = new TextEncoder();
      await EditorHostService.getInstance()
        .getHost()
        .workspace.fs.writeFile(storagePath, encoder.encode(content));
    }
  }

  public async execute(
    action: string,
    memory?: Partial<MemoryEntry>,
    query?: string,
  ): Promise<string> {
    const memories = await this.loadMemories();

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
        memories.push(newMemory);
        await this.saveMemories(memories);
        return `Memory added: [${newMemory.category}] ${newMemory.title}`;
      }

      case "update": {
        if (!memory?.id) return "Error: Memory ID is required for 'update'.";
        const index = memories.findIndex((m) => m.id === memory.id);
        if (index === -1)
          return `Error: Memory with ID ${memory.id} not found.`;

        memories[index] = {
          ...memories[index],
          ...memory,
          timestamp: Date.now(),
        };
        await this.saveMemories(memories);
        return `Memory updated: ${memories[index].title}`;
      }

      case "delete": {
        if (!memory?.id) return "Error: Memory ID is required for 'delete'.";
        const initialLength = memories.length;
        const filtered = memories.filter((m) => m.id !== memory.id);
        if (filtered.length === initialLength)
          return `Error: Memory with ID ${memory.id} not found.`;

        await this.saveMemories(filtered);
        return "Memory deleted successfully.";
      }

      case "search": {
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

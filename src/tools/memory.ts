import { SchemaType } from "@google/generative-ai";
import { promises as fsp } from "fs";
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

/** Simple in-process mutex to serialize per-file write operations. */
class FileMutex {
  private _p: Promise<void> = Promise.resolve();
  async lock<T>(fn: () => Promise<T>): Promise<T> {
    const next = this._p.then(
      () => fn(),
      () => fn(),
    );
    this._p = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}

/** Per-path lock map — serializes concurrent writes to the same file. */
const FILE_LOCKS = new Map<string, FileMutex>();

function getLock(filePath: string): FileMutex {
  let lock = FILE_LOCKS.get(filePath);
  if (!lock) {
    lock = new FileMutex();
    FILE_LOCKS.set(filePath, lock);
  }
  return lock;
}

export class MemoryTool {
  /**
   * Synchronous formatted memories for system prompt injection.
   * Uses a cached snapshot to avoid blocking the extension host.
   */
  public static getFormattedMemories(): string {
    const tool = new MemoryTool();
    // Kick off an async load but return cached/sync result for prompt building.
    // The first call may return empty; subsequent calls will have data.
    const memories = tool.loadAllMemoriesSync();
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
    return path.join(os.homedir(), ".codebuddy", "user-memory.json");
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
    return path.join(rootPath, ".codebuddy", "memory.json");
  }

  /** Async file read — returns [] if file doesn't exist or is invalid. */
  private async loadFromFileAsync(filePath: string): Promise<MemoryEntry[]> {
    try {
      const raw = await fsp.readFile(filePath, "utf8");
      return JSON.parse(raw) as MemoryEntry[];
    } catch (err: any) {
      if (err.code === "ENOENT") return [];
      console.warn(`[MemoryTool] Failed to read ${filePath}: ${err.message}`);
      return [];
    }
  }

  /** Atomic write: write to temp file then rename to prevent corrupt JSON. */
  private async saveToFileAsync(
    filePath: string,
    memories: MemoryEntry[],
  ): Promise<void> {
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(memories, null, 2), "utf8");
    await fsp.rename(tmp, filePath);
  }

  /**
   * Atomically update a memory file within a per-path mutex.
   * Prevents lost writes from concurrent tool calls.
   */
  private async updateMemoryFile(
    filePath: string,
    updater: (memories: MemoryEntry[]) => MemoryEntry[],
  ): Promise<void> {
    const lock = getLock(filePath);
    await lock.lock(async () => {
      const current = await this.loadFromFileAsync(filePath);
      const updated = updater(current);
      await this.saveToFileAsync(filePath, updated);
    });
  }

  /**
   * Synchronous fallback for getFormattedMemories (system prompt building).
   * Uses require('fs') sync APIs since this is called during prompt construction
   * which must be synchronous for the current API surface.
   */
  private loadAllMemoriesSync(): MemoryEntry[] {
    const fs = require("fs");
    const loadSync = (fp: string): MemoryEntry[] => {
      try {
        return JSON.parse(fs.readFileSync(fp, "utf8"));
      } catch {
        return [];
      }
    };
    const globalMemories = loadSync(this.getGlobalStoragePath());
    const wsPath = this.getWorkspaceStoragePath();
    const wsMemories = wsPath ? loadSync(wsPath) : [];
    return [...globalMemories, ...wsMemories];
  }

  /**
   * Loads all memories asynchronously: global user memories + workspace project memories.
   */
  private async loadAllMemories(): Promise<MemoryEntry[]> {
    const globalMemories = await this.loadFromFileAsync(
      this.getGlobalStoragePath(),
    );
    const wsPath = this.getWorkspaceStoragePath();
    const wsMemories = wsPath ? await this.loadFromFileAsync(wsPath) : [];
    return [...globalMemories, ...wsMemories];
  }

  /**
   * Resolve storage path for a given scope. Returns undefined if workspace
   * is not available for project scope.
   */
  private getStoragePath(scope: "user" | "project"): string | undefined {
    return scope === "user"
      ? this.getGlobalStoragePath()
      : this.getWorkspaceStoragePath();
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
        const filePath = this.getStoragePath(memory.scope);
        if (!filePath) return "Error: No storage path available.";

        const newMemory: MemoryEntry = {
          id: Math.random().toString(36).substring(7),
          category: memory.category,
          content: memory.content,
          keywords: memory.keywords || "",
          title: memory.title,
          scope: memory.scope,
          timestamp: Date.now(),
        };
        await this.updateMemoryFile(filePath, (memories) => [
          ...memories,
          newMemory,
        ]);
        return `Memory added: [${newMemory.category}] ${newMemory.title}`;
      }

      case "update": {
        if (!memory?.id) return "Error: Memory ID is required for 'update'.";

        // Search both scopes for the ID, updating in the scope where it lives.
        // The update is applied to the scope where the memory is found,
        // regardless of the caller-supplied scope, preventing cross-scope writes.
        for (const scope of ["user", "project"] as const) {
          const filePath = this.getStoragePath(scope);
          if (!filePath) continue;

          const memories = await this.loadFromFileAsync(filePath);
          const index = memories.findIndex((m) => m.id === memory.id);
          if (index === -1) continue;

          // Only allow updating fields that belong to MemoryEntry, not scope
          await this.updateMemoryFile(filePath, (current) => {
            const idx = current.findIndex((m) => m.id === memory.id);
            if (idx === -1) return current;
            current[idx] = {
              ...current[idx],
              ...(memory.category && { category: memory.category }),
              ...(memory.content && { content: memory.content }),
              ...(memory.keywords && { keywords: memory.keywords }),
              ...(memory.title && { title: memory.title }),
              timestamp: Date.now(),
            };
            return current;
          });
          return `Memory updated: ${memories[index].title}`;
        }
        return `Error: Memory with ID ${memory.id} not found.`;
      }

      case "delete": {
        if (!memory?.id) return "Error: Memory ID is required for 'delete'.";
        for (const scope of ["user", "project"] as const) {
          const filePath = this.getStoragePath(scope);
          if (!filePath) continue;

          const memories = await this.loadFromFileAsync(filePath);
          if (!memories.some((m) => m.id === memory.id)) continue;

          await this.updateMemoryFile(filePath, (current) =>
            current.filter((m) => m.id !== memory.id),
          );
          return "Memory deleted successfully.";
        }
        return `Error: Memory with ID ${memory.id} not found.`;
      }

      case "search": {
        const allMemories = await this.loadAllMemories();
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

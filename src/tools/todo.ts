import { SchemaType } from "@google/generative-ai";
import * as path from "path";
import { EditorHostService } from "../services/editor-host.service";
import { FileUtils } from "../utils/common-utils";

interface Task {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
}

export class TodoTool {
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

    return path.join(codebuddyDir, "tasks.json");
  }

  private async loadTasks(): Promise<Task[]> {
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

  private async saveTasks(tasks: Task[]): Promise<void> {
    const storagePath = await this.getStoragePath();
    if (storagePath) {
      const content = JSON.stringify(tasks, null, 2);
      const encoder = new TextEncoder();
      await EditorHostService.getInstance()
        .getHost()
        .workspace.fs.writeFile(storagePath, encoder.encode(content));
    }
  }

  public async execute(action: string, task?: Partial<Task>): Promise<string> {
    const tasks = await this.loadTasks();

    switch (action) {
      case "add": {
        if (!task?.content)
          return "Error: Task content is required for 'add' action.";
        const newTask: Task = {
          id: Math.random().toString(36).substring(7),
          content: task.content,
          status: task.status || "pending",
          priority: task.priority || "medium",
        };
        tasks.push(newTask);
        await this.saveTasks(tasks);
        return `Task added: [${newTask.id}] ${newTask.content}`;
      }

      case "update": {
        if (!task?.id) return "Error: Task ID is required for 'update' action.";
        const taskIndex = tasks.findIndex((t) => t.id === task.id);
        if (taskIndex === -1)
          return `Error: Task with ID ${task.id} not found.`;

        tasks[taskIndex] = { ...tasks[taskIndex], ...task };
        await this.saveTasks(tasks);
        return `Task updated: [${task.id}] ${tasks[taskIndex].content} (${tasks[taskIndex].status})`;
      }

      case "list":
        if (tasks.length === 0) return "No tasks found.";
        return tasks
          .map((t) => `[${t.status.toUpperCase()}] ${t.content} (ID: ${t.id})`)
          .join("\n");

      default:
        return "Error: Invalid action. Use 'add', 'update', or 'list'.";
    }
  }

  config() {
    return {
      name: "manage_tasks",
      description:
        "Manage a persistent list of tasks (todos) for the project. Use this to plan complex workflows and track progress.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          action: {
            type: SchemaType.STRING,
            description: "The action to perform: 'add', 'update', or 'list'.",
            enum: ["add", "update", "list"],
          },
          task: {
            type: SchemaType.OBJECT,
            description: "Task details (required for 'add' and 'update').",
            properties: {
              id: {
                type: SchemaType.STRING,
                description: "Task ID (required for update)",
              },
              content: {
                type: SchemaType.STRING,
                description: "Task description",
              },
              status: {
                type: SchemaType.STRING,
                enum: ["pending", "in_progress", "completed"],
              },
              priority: {
                type: SchemaType.STRING,
                enum: ["low", "medium", "high"],
              },
            },
          },
        },
        required: ["action"],
      },
    };
  }
}

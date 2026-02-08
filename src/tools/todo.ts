import { SchemaType } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

interface Task {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
}

export class TodoTool {
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

    return path.join(codebuddyDir, "tasks.json");
  }

  private loadTasks(): Task[] {
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

  private saveTasks(tasks: Task[]): void {
    const storagePath = this.getStoragePath();
    if (storagePath) {
      fs.writeFileSync(storagePath, JSON.stringify(tasks, null, 2));
    }
  }

  public async execute(action: string, task?: Partial<Task>): Promise<string> {
    const tasks = this.loadTasks();

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
        this.saveTasks(tasks);
        return `Task added: [${newTask.id}] ${newTask.content}`;
      }

      case "update": {
        if (!task?.id) return "Error: Task ID is required for 'update' action.";
        const taskIndex = tasks.findIndex((t) => t.id === task.id);
        if (taskIndex === -1)
          return `Error: Task with ID ${task.id} not found.`;

        tasks[taskIndex] = { ...tasks[taskIndex], ...task };
        this.saveTasks(tasks);
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

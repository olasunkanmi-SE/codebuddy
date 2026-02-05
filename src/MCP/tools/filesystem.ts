
import * as fs from "fs/promises";
import * as path from "path";
import { z } from "zod";

export const ListFilesSchema = z.object({
  path: z.string().optional().describe("The absolute path to the directory to list. If omitted, lists the current working directory."),
});

export const ReadFileSchema = z.object({
  path: z.string().describe("The absolute path to the file to read."),
});

export const EditFileSchema = z.object({
  path: z.string().describe("The absolute path to the file to edit."),
  mode: z.enum(["overwrite", "replace"]).describe("The editing mode."),
  content: z.string().optional().describe("New content for overwrite mode."),
  search: z.string().optional().describe("Text to search for in replace mode."),
  replace: z.string().optional().describe("Text to replace with in replace mode."),
});

export class FilesystemTools {
  static async listFiles(args: z.infer<typeof ListFilesSchema>) {
    const dirPath = args.path || process.cwd();
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.map((entry) => {
        const type = entry.isDirectory() ? "DIR" : "FILE";
        return `[${type}] ${entry.name}`;
      }).join("\n");
    } catch (error: any) {
      throw new Error(`Failed to list files in ${dirPath}: ${error.message}`);
    }
  }

  static async readFile(args: z.infer<typeof ReadFileSchema>) {
    try {
      const content = await fs.readFile(args.path, "utf-8");
      return content;
    } catch (error: any) {
      throw new Error(`Failed to read file ${args.path}: ${error.message}`);
    }
  }

  static async editFile(args: z.infer<typeof EditFileSchema>) {
    try {
      if (args.mode === "overwrite") {
        if (args.content === undefined) {
          throw new Error("Content is required for overwrite mode");
        }
        await fs.writeFile(args.path, args.content, "utf-8");
        return `Successfully overwrote ${args.path}`;
      } else if (args.mode === "replace") {
        if (!args.search || args.replace === undefined) {
          throw new Error("Search and replace strings are required for replace mode");
        }
        const content = await fs.readFile(args.path, "utf-8");
        if (!content.includes(args.search)) {
          throw new Error(`Search text not found in ${args.path}`);
        }
        const newContent = content.replace(args.search, args.replace);
        await fs.writeFile(args.path, newContent, "utf-8");
        return `Successfully replaced text in ${args.path}`;
      }
      return "Invalid mode";
    } catch (error: any) {
      throw new Error(`Failed to edit file ${args.path}: ${error.message}`);
    }
  }
}

import { Part } from "@google/generative-ai";
import * as vscode from "vscode";

export type Role = "function" | "user" | "model" | "assistant" | "system";

export interface IBaseMessage {
  [key: string]: any;
  createdAt?: string;
}

export interface IMessageInput {
  role: Role;
  parts?: Part[];
  content?: string;
}
interface MessageInput {
  role: Role;
  content?: string;
  parts?: Part[];
}

export type MessageOutput = { role: Role; content?: string; parts?: Part[] };

export class Message {
  readonly role: Role;
  readonly content?: string;
  readonly parts?: Part[];

  constructor(role: Role, content?: string, parts?: Part[]) {
    this.role = role;
    this.content = content;
    this.parts = parts;
  }

  static of(input: MessageInput): MessageOutput {
    const { role, content, parts } = input;

    if (content && parts) {
      vscode.window.showErrorMessage(
        "Model message must have either content or parts.",
      );
      throw new Error("Model message must have either content or parts.");
    }

    if (content) {
      return { role, content };
    }

    if (parts) {
      return { role, parts };
    }
    vscode.window.showErrorMessage(
      "Model message must have either content or parts.",
    );
    throw new Error("Model message must have either content or parts.");
  }
}

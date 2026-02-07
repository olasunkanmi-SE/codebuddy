import { Part } from "@google/generative-ai";
import { EditorHostService } from "../services/editor-host.service";

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
    let { role, content, parts } = input;

    if (!content && !parts) {
      EditorHostService.getInstance()
        .getHost()
        .window.showErrorMessage(
          "Model message must have either content or parts.",
        );
      throw new Error("Model message must have either content or parts.");
    }

    if (content && !parts) {
      parts = [{ text: content }];
    }

    if (!content && parts) {
      content = parts
        .map((part) => part.text || "")
        .join("\n")
        .trim();
    }

    return { role, content, parts };
  }
}

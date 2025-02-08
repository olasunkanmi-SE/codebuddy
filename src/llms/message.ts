import { Part } from "@google/generative-ai";

type Role = "function" | "user" | "model" | "assistant" | "system";

export interface IBaseMessage {
  [key: string]: any;
  createdAt?: string;
}

export interface IMessageInput {
  role: Role;
  parts?: Part[];
  content?: string;
}

export class Message {
  constructor(
    readonly role: Role,
    readonly content: string = "",
    readonly parts: Part[] = [],
  ) {}

  static of({ role, content, parts }: IMessageInput) {
    return new Message(role, content, parts);
  }

  createSnapShot(): IMessageInput {
    return {
      role: this.role,
      content: this.content,
      parts: this.parts,
    };
  }

  loadSnapShot(state: IMessageInput) {
    return Object.assign(this, state);
  }
}

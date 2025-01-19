import { showInfoMessage } from "../../application/utils";

export class Logger {
  constructor(private readonly context: string) {}

  info(message: string, ...args: any[]) {
    console.log(`[${this.context}] INFO:`, message, ...args);
    showInfoMessage(message);
  }

  error(message: string, error: any) {
    console.error(`[${this.context}] ERROR:`, message, error);
    showInfoMessage(message);
  }
}

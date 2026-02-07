import { formatText } from "../utils/utils";
import { CodeCommandHandler } from "./handler";
import { EditorHostService } from "../services/editor-host.service";

export class InLineChat extends CodeCommandHandler {
  selectedCode: string | undefined;
  constructor(action: string, context: any) {
    super(action, context);
  }

  getCurrentActiveEditorCode(): string | undefined {
    const editor =
      EditorHostService.getInstance().getHost().window.activeTextEditor;
    return editor ? editor?.document?.getText() : undefined;
  }

  formatResponse(comment: string): string {
    return formatText(comment);
  }

  async createPrompt(selectedCode: string): Promise<string> {
    const inlineChat = await this.getUserInLineChat();
    const context = this.getCurrentActiveEditorCode() ?? "";
    const fullPrompt = `${inlineChat} \n ${selectedCode} \n Here is the code context ${context}`;
    return fullPrompt;
  }
}

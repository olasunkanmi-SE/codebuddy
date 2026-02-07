import Groq from "groq-sdk";
import { GROQ_CONFIG } from "../../application/constant";
import { BaseLLM } from "../base";
import {
  ICodeCompleter,
  ICodeCompletionOptions,
  ILlmConfig,
} from "../interface";
import { IDisposable } from "../../interfaces/disposable";
import { EditorHostService } from "../../services/editor-host.service";

export class GroqLLM
  extends BaseLLM<any>
  implements IDisposable, ICodeCompleter
{
  private static instance: GroqLLM;
  private readonly groq: Groq;

  constructor(protected config: ILlmConfig) {
    super(config);
    this.groq = new Groq({ apiKey: this.config.apiKey });
  }

  static getInstance(config: ILlmConfig) {
    if (!GroqLLM.instance) {
      GroqLLM.instance = new GroqLLM(config);
    }
    return GroqLLM.instance;
  }

  async generateEmbeddings(text: string): Promise<number[]> {
    return [1, 2];
  }

  // TODO Implement function call, especially think for this model.
  async generateText(message: string): Promise<string> {
    try {
      const { temperature, top_p, stop } = GROQ_CONFIG;

      const chatCompletion = this.groq.chat.completions.create({
        messages: [{ role: "user", content: message }],
        model: this.config.model,
        temperature,
        top_p,
        stream: false,
        stop,
      });
      const response = (await chatCompletion).choices[0]?.message?.content;
      return response ?? "";
    } catch (error: any) {
      this.logger.error(
        "Model not responding, please resend your question",
        error.stack,
      );
      if (error.status === "401") {
        EditorHostService.getInstance()
          .getHost()
          .window.showErrorMessage(
            "Invalid API key. Please update your API key",
          );
      }
      throw error;
    }
  }

  async completeCode(
    prompt: string,
    options?: ICodeCompletionOptions,
  ): Promise<string> {
    const stop = options?.stopSequences;
    const maxTokens = options?.maxTokens || 128;
    const temperature = options?.temperature || 0.1;
    const model = options?.model || this.config.model;

    try {
      // Groq mainly supports Chat API
      const chatCompletion = await this.groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: model,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: false,
        stop: stop,
      });
      return chatCompletion.choices[0]?.message?.content || "";
    } catch (error: any) {
      this.logger.error("Failed to complete code", { error });
      return "";
    }
  }

  createSnapShot() {
    // Not implemented for Groq yet
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadSnapShot(snapshot: any) {
    // Not implemented for Groq yet
  }

  dispose() {
    // No cleanup required for Groq client
  }
}

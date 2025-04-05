import {
  CachedContent,
  createPartFromUri,
  createUserContent,
  GenerateContentResponse,
  GoogleGenAI,
} from "@google/genai";
import * as path from "path";
import * as vscode from "vscode";
import { BaseAiAgent } from "./base";
import { Orchestrator } from "./orchestrator";
import { IEventPayload } from "../emitter/interface";

export class FileUploadAgent extends BaseAiAgent implements vscode.Disposable {
  private readonly ai: GoogleGenAI;
  protected readonly orchestrator: Orchestrator;
  private static readonly PROCESSING_WAIT_TIME_MS = 6000;
  private static readonly MAX_CACHE_PAGE_SIZE = 10;
  private static readonly CACHE_MODEL = "gemini-1.5-flash-002";
  private readonly disposables: vscode.Disposable[] = [];
  private static instance: FileUploadAgent;
  constructor(private readonly apiKey: string) {
    super();
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    this.orchestrator = Orchestrator.getInstance();
    this.disposables.push(
      this.orchestrator.onFileUpload(this.handleLocalFileUpload.bind(this)),
    );
  }

  static initialize(apiKey: string) {
    if (!FileUploadAgent.instance) {
      FileUploadAgent.instance = new FileUploadAgent(apiKey);
    }
    return FileUploadAgent.instance;
  }

  private async handleLocalFileUpload(event: IEventPayload) {
    try {
      if (!event.message?.length) {
        this.logger.info("Error while uploading file, try again");
        return;
      }
      const data = JSON.parse(event.message);
      const { fileName, filePath } = data;
      if (fileName && filePath) {
        await this.uploadAndProcessFile(filePath, fileName);
      }
    } catch (error: any) {
      console.log(error);
      throw new Error(error);
    }
  }

  private async uploadFile(filePath: string, displayName: string) {
    try {
      return await this.ai.files.upload({
        file: filePath,
        config: { displayName },
      });
    } catch (error) {
      console.error(`Failed to upload file: ${filePath}`, error);
      throw new Error(
        `File upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async uploadAndProcessFile(
    filePath: string,
    displayName: string,
    prompt: string = "Summarize this document",
  ): Promise<string | undefined> {
    let file;
    try {
      file = (await this.uploadFile(filePath, displayName)) as any;
      const processedFile = await this.waitForProcessing(file.name);

      const result = await this.generateContentWithFile(processedFile, prompt);
      if (result.response) {
        this.orchestrator.publish("onResponse", JSON.stringify(result));
      }
      return result.response;
    } catch (error) {
      this.logger.info(`Failed to process file: ${file.name}`);
      throw new Error(
        `File processing pipeline failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async waitForProcessing(fileName: string, maxRetries = 10) {
    try {
      let getFile = await this.ai.files.get({ name: fileName });
      let retries = 0;
      while (getFile.state === "PROCESSING" && retries < maxRetries) {
        this.logger.info("☕ File upload in progress, grab a cup of coffee");
        await this.delay(FileUploadAgent.PROCESSING_WAIT_TIME_MS);
        getFile = await this.ai.files.get({ name: fileName });
        retries++;
      }
      if (getFile.state === "FAILED") {
        this.logger.info("File processing failed");
      }
      return getFile;
    } catch (error: any) {
      console.error("File processing failed.", error);
      throw new Error(error.message);
    }
  }

  private async generateContentWithFile(
    file: any,
    prompt: string,
    cacheName?: string,
  ): Promise<{
    response: string | undefined;
    fileName: string;
    cache: string | undefined;
  }> {
    try {
      const fileContent = createPartFromUri(file.uri, file.mimeType);
      let cached = cacheName
        ? await this.findOrCreateCache(cacheName, fileContent)
        : await this.createNewCache(fileContent);

      const response = await this.generateContentWithCache(
        prompt,
        cached.name ?? "",
      );
      const fileName = file.fsPath ? path.basename(file.fsPath) : "";

      return {
        response: response.text,
        fileName: fileName ?? file.displayName,
        cache: cached.name,
      };
    } catch (error) {
      this.logger.error("Failed to generate content with file", error);
      return {
        response: undefined,
        fileName: "",
        cache: undefined,
      };
    }
  }

  private async findOrCreateCache(
    cacheName: string,
    fileContent: any,
  ): Promise<CachedContent> {
    try {
      return await this.getDocCache(cacheName);
    } catch (error) {
      return await this.createNewCache(fileContent);
    }
  }

  private async createNewCache(fileContent: any): Promise<CachedContent> {
    const cached = await this.ai.caches.create({
      model: FileUploadAgent.CACHE_MODEL,
      config: {
        contents: createUserContent(fileContent),
        systemInstruction:
          "You are an expert analyzing documents. Give a detail analysis of this doc in markdown",
      },
    });
    this.logger.info("Cache created:", cached);
    return cached;
  }

  private async generateContentWithCache(
    prompt: string,
    cacheName: string,
  ): Promise<GenerateContentResponse> {
    return await this.ai.models.generateContent({
      model: FileUploadAgent.CACHE_MODEL,
      contents: prompt,
      config: { cachedContent: cacheName },
    });
  }

  private async getDocCache(name: string): Promise<CachedContent> {
    try {
      const cache = await this.ai.caches.get({ name });
      this.logger.info("Cache found:", cache);
      return cache;
    } catch (error: any) {
      throw new Error("Cache not found or error occurred:", error);
    }
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}

import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { Terminal } from "../../utils/terminal";

export interface LocalModel {
  name: string;
  size?: string;
  id?: string;
}

export class LocalModelService {
  private readonly logger: Logger;
  private readonly terminal: Terminal;
  private static instance: LocalModelService;

  constructor() {
    this.logger = Logger.initialize(LocalModelService.name, {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
    this.terminal = Terminal.getInstance();
  }

  static getInstance(): LocalModelService {
    if (!LocalModelService.instance) {
      LocalModelService.instance = new LocalModelService();
    }
    return LocalModelService.instance;
  }

  async isModelRunnerAvailable(): Promise<boolean> {
    return this.terminal.checkDockerModelRunner();
  }

  async getLocalModels(): Promise<LocalModel[]> {
    try {
      const output = await this.terminal.getLocalModelList();

      // Try to parse JSON first (if supported/returned)
      try {
        const json = JSON.parse(output);
        if (Array.isArray(json)) {
          return json.map((m: any) => ({
            name: m.Name || m.Repository + ":" + m.Tag,
            size: m.Size,
            id: m.ID || m.ImageID,
          }));
        }
      } catch (e) {
        // Fallback to text parsing (Table format)
        // REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
        const lines = output.trim().split("\n");
        if (lines.length <= 1) return [];

        const models: LocalModel[] = [];
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            // Assuming standard Docker format: REPO TAG ID CREATED SIZE
            const repo = parts[0];
            const tag = parts[1];
            const name =
              tag === "<none>" || tag === "latest" ? repo : `${repo}:${tag}`;

            models.push({
              name: name,
              size: parts[parts.length - 1], // Usually last column
            });
          }
        }
        return models;
      }
      return [];
    } catch (error) {
      this.logger.error("Failed to get local models", error);
      return [];
    }
  }

  async isOllamaRunning(): Promise<boolean> {
    try {
      const output = await this.terminal.getRunningOllamaContainer();
      return output.trim().length > 0;
    } catch (error) {
      return false;
    }
  }
}

import { Logger, LogLevel } from "../../infrastructure/logger/logger";
import { EditorHostService } from "../editor-host.service";
import { FileUtils } from "../../utils/common-utils";

export interface IAnalysisStrategy {
  analyze(files: string[]): Promise<any>;
}

export abstract class BaseAnalysisStrategy implements IAnalysisStrategy {
  protected readonly logger: Logger;

  constructor(protected readonly strategyName: string) {
    this.logger = Logger.initialize(`${strategyName}Strategy`, {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  abstract analyze(files: string[]): Promise<any>;

  protected async readFileContent(filePath: string): Promise<string | null> {
    try {
      if (!(await FileUtils.fileExists(filePath))) {
        return null;
      }
      // Use EditorHostService to read file content
      // Note: fs.read returns string directly
      const contentBytes = await EditorHostService.getInstance()
        .getHost()
        .workspace.fs.readFile(filePath);
      return new TextDecoder().decode(contentBytes);
    } catch (error: any) {
      this.logger.warn(`Failed to read file ${filePath}`, error);
      return null;
    }
  }

  protected filterFilesByExtensions(
    files: string[],
    extensions: string[],
  ): string[] {
    return files.filter((file) => extensions.some((ext) => file.endsWith(ext)));
  }

  protected filterFilesByPatterns(
    files: string[],
    patterns: RegExp[],
  ): string[] {
    return files.filter((file) =>
      patterns.some((pattern) => pattern.test(file)),
    );
  }
}

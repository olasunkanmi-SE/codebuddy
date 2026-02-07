import { IEditorHost } from "../interfaces/editor-host";
import { Logger } from "../infrastructure/logger/logger";

/**
 * Service to provide access to the current Editor Host.
 * Acts as a Service Locator for the platform-specific host implementation.
 */
export class EditorHostService {
  private static instance: EditorHostService;
  private host: IEditorHost | undefined;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.initialize("EditorHostService", {
      enableConsole: true,
      enableFile: false,
      enableTelemetry: false,
    });
  }

  public static getInstance(): EditorHostService {
    if (!EditorHostService.instance) {
      EditorHostService.instance = new EditorHostService();
    }
    return EditorHostService.instance;
  }

  public initialize(host: IEditorHost) {
    if (this.host) {
      this.logger.warn(
        "EditorHostService already initialized. Overwriting host.",
      );
    }
    this.host = host;
    this.logger.info("EditorHostService initialized with host.");
  }

  public getHost(): IEditorHost {
    if (!this.host) {
      throw new Error(
        "EditorHostService not initialized. Call initialize() first.",
      );
    }
    return this.host;
  }
}

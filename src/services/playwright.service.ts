import { chromium, Browser, BrowserContext, Page } from "playwright";
import * as path from "path";
import * as fs from "fs";
import { Logger, LogLevel } from "../infrastructure/logger/logger";

export class PlaywrightService {
  private static instance: PlaywrightService;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private logger: Logger;

  private constructor() {
    this.logger = Logger.initialize("PlaywrightService", {
      minLevel: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: true,
      enableTelemetry: true,
    });
  }

  public static getInstance(): PlaywrightService {
    if (!PlaywrightService.instance) {
      PlaywrightService.instance = new PlaywrightService();
    }
    return PlaywrightService.instance;
  }

  public async startSession(
    options: { headless?: boolean; storageState?: string } = {},
  ): Promise<void> {
    if (this.browser) return;

    const { headless = true, storageState } = options;

    this.logger.info(
      `Starting Playwright session (headless: ${headless}, storageState: ${storageState || "none"})`,
    );
    try {
      this.browser = await chromium.launch({ headless });

      const contextOptions: any = {};
      if (storageState && fs.existsSync(storageState)) {
        contextOptions.storageState = storageState;
        this.logger.info(`Loaded storage state from ${storageState}`);
      }

      this.context = await this.browser.newContext(contextOptions);
      this.page = await this.context.newPage();
    } catch (error: any) {
      this.logger.error("Failed to start Playwright session", error);
      throw error;
    }
  }

  public async closeSession(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      this.logger.info("Playwright session closed");
    }
  }

  public async navigate(url: string): Promise<string> {
    await this.ensureSession();
    this.logger.info(`Navigating to ${url}`);
    try {
      await this.page!.goto(url, { waitUntil: "domcontentloaded" });
      return await this.page!.title();
    } catch (error: any) {
      this.logger.error(`Failed to navigate to ${url}`, error);
      throw error;
    }
  }

  public async click(selector: string): Promise<void> {
    await this.ensureSession();
    this.logger.info(`Clicking selector: ${selector}`);
    try {
      await this.page!.click(selector);
    } catch (error: any) {
      this.logger.error(`Failed to click ${selector}`, error);
      throw error;
    }
  }

  public async fill(selector: string, value: string): Promise<void> {
    await this.ensureSession();
    this.logger.info(`Filling selector: ${selector} with value: ${value}`);
    try {
      await this.page!.fill(selector, value);
    } catch (error: any) {
      this.logger.error(`Failed to fill ${selector}`, error);
      throw error;
    }
  }

  public async getText(selector: string): Promise<string> {
    await this.ensureSession();
    try {
      const text = await this.page!.textContent(selector);
      return text || "";
    } catch (error: any) {
      this.logger.error(`Failed to get text for ${selector}`, error);
      throw error;
    }
  }

  public async getHtml(): Promise<string> {
    await this.ensureSession();
    return await this.page!.content();
  }

  public async screenshot(filePath: string): Promise<string> {
    await this.ensureSession();
    this.logger.info(`Taking screenshot to ${filePath}`);
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await this.page!.screenshot({ path: filePath });
      return filePath;
    } catch (error: any) {
      this.logger.error(`Failed to take screenshot`, error);
      throw error;
    }
  }

  public async runScript(script: string): Promise<any> {
    await this.ensureSession();
    this.logger.info("Running custom script");
    try {
      return await this.page!.evaluate(script);
    } catch (error: any) {
      this.logger.error("Failed to run script", error);
      throw error;
    }
  }

  private async ensureSession(): Promise<void> {
    if (!this.browser || !this.page) {
      await this.startSession();
    }
  }

  public async saveStorageState(path: string): Promise<void> {
    if (!this.context) throw new Error("No active browser context");
    await this.context.storageState({ path });
    this.logger.info(`Storage state saved to ${path}`);
  }
}

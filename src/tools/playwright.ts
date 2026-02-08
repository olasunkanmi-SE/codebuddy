import { SchemaType } from "@google/generative-ai";
import { PlaywrightService } from "../services/playwright.service";

export class PlaywrightTool {
  private service: PlaywrightService;

  constructor() {
    this.service = PlaywrightService.getInstance();
  }

  public async execute(
    action:
      | "navigate"
      | "click"
      | "fill"
      | "screenshot"
      | "evaluate"
      | "close"
      | "start",
    params: {
      url?: string;
      selector?: string;
      value?: string;
      path?: string;
      script?: string;
      storageState?: string;
    },
  ) {
    try {
      switch (action) {
        case "start":
          await this.service.startSession({
            storageState: params.storageState,
          });
          return `Playwright session started${params.storageState ? ` with storage state from ${params.storageState}` : ""}`;

        case "navigate": {
          if (!params.url) throw new Error("URL is required for navigate");
          const title = await this.service.navigate(params.url);
          return `Navigated to ${params.url}. Page Title: ${title}`;
        }

        case "click":
          if (!params.selector)
            throw new Error("Selector is required for click");
          await this.service.click(params.selector);
          return `Clicked ${params.selector}`;

        case "fill":
          if (!params.selector || params.value === undefined)
            throw new Error("Selector and value are required for fill");
          await this.service.fill(params.selector, params.value);
          return `Filled ${params.selector} with "${params.value}"`;

        case "screenshot": {
          const screenshotPath =
            params.path || `screenshot-${new Date().getTime()}.png`;
          await this.service.screenshot(screenshotPath);
          return `Screenshot saved to ${screenshotPath}`;
        }

        case "evaluate": {
          if (!params.script)
            throw new Error("Script is required for evaluate");
          const result = await this.service.runScript(params.script);
          return `Script executed. Result: ${JSON.stringify(result)}`;
        }

        case "close":
          await this.service.closeSession();
          return "Playwright session closed";

        default:
          return `Unknown action: ${action}`;
      }
    } catch (error: any) {
      return `Error executing ${action}: ${error.message}`;
    }
  }

  config() {
    return {
      name: "playwright",
      description:
        "Control a real browser to navigate, interact, and test web pages. Supports navigating, clicking, filling forms, screenshots, and running scripts.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          action: {
            type: SchemaType.STRING,
            description:
              "Action to perform: 'start', 'navigate', 'click', 'fill', 'screenshot', 'evaluate', 'close'",
            enum: [
              "start",
              "navigate",
              "click",
              "fill",
              "screenshot",
              "evaluate",
              "close",
            ],
          },
          url: {
            type: SchemaType.STRING,
            description: "URL to navigate to (required for 'navigate')",
          },
          storageState: {
            type: SchemaType.STRING,
            description:
              "Path to storage state JSON file (optional for 'start')",
          },
          selector: {
            type: SchemaType.STRING,
            description:
              "CSS selector to interact with (required for 'click', 'fill')",
          },
          value: {
            type: SchemaType.STRING,
            description: "Value to fill (required for 'fill')",
          },
          path: {
            type: SchemaType.STRING,
            description: "Path to save screenshot (optional for 'screenshot')",
          },
          script: {
            type: SchemaType.STRING,
            description:
              "JavaScript code to evaluate in the browser (required for 'evaluate')",
          },
        },
        required: ["action"],
      },
    };
  }
}

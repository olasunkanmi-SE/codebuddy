import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";

export class SimpleBrowserService implements vscode.Disposable {
  private static instance: SimpleBrowserService;
  private logger: Logger;
  private currentPanel: vscode.WebviewPanel | undefined;

  private constructor() {
    this.logger = Logger.initialize("SimpleBrowserService", {});
  }

  public static getInstance(): SimpleBrowserService {
    if (!SimpleBrowserService.instance) {
      SimpleBrowserService.instance = new SimpleBrowserService();
    }
    return SimpleBrowserService.instance;
  }

  public dispose(): void {
    if (this.currentPanel) {
      this.currentPanel.dispose();
      this.currentPanel = undefined;
    }
  }

  public async openBrowser(
    url: string = "https://www.google.com/webhp?hl=en",
  ): Promise<void> {
    if (this.currentPanel) {
      this.currentPanel.reveal(vscode.ViewColumn.One);
      this.currentPanel.webview.postMessage({ command: "navigate", url });
      return;
    }

    this.currentPanel = vscode.window.createWebviewPanel(
      "codeBuddyBrowser",
      "CodeBuddy Browser",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );

    this.currentPanel.onDidDispose(() => {
      this.currentPanel = undefined;
    });

    this.currentPanel.webview.html = this.getBrowserHtml(url);

    this.currentPanel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case "open-external":
          if (message.url) {
            vscode.env.openExternal(vscode.Uri.parse(message.url));
          }
          break;
        case "open-reader":
          if (message.url) {
            const { NewsReaderService } = await import("./news-reader.service");
            await NewsReaderService.getInstance().openReader(message.url);
          }
          break;
      }
    });
  }

  private getBrowserHtml(initialUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Browser</title>
    <style>
        :root {
            --bg-color: var(--vscode-editor-background);
            --text-color: var(--vscode-editor-foreground);
            --toolbar-bg: var(--vscode-editor-background);
            --toolbar-border: var(--vscode-widget-border);
            --input-bg: var(--vscode-input-background);
            --input-fg: var(--vscode-input-foreground);
            --input-border: var(--vscode-input-border);
        }
        
        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: var(--vscode-font-family, sans-serif);
        }

        #toolbar {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            background: var(--toolbar-bg);
            border-bottom: 1px solid var(--toolbar-border);
            height: 40px;
            box-sizing: border-box;
        }

        #url-input {
            flex: 1;
            background: var(--input-bg);
            color: var(--input-fg);
            border: 1px solid var(--input-border);
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 13px;
        }

        .tool-button {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            padding: 4px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            white-space: nowrap;
        }

        .tool-button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        #container {
            position: absolute;
            top: 40px;
            left: 0;
            right: 0;
            bottom: 0;
            background: white; /* Most websites expect white background */
        }

        iframe {
            width: 100%;
            height: 100%;
            border: none;
            transform-origin: top left;
        }

        .font-label {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div id="toolbar">
        <input type="text" id="url-input" value="${initialUrl}" placeholder="Enter URL...">
        <button class="tool-button" id="go-btn">Go</button>
        <button class="tool-button" id="reader-btn" title="Open in Reader Mode">Reader</button>
        <span class="font-label">Zoom:</span>
        <button class="tool-button" id="zoom-minus">-</button>
        <button class="tool-button" id="zoom-plus">+</button>
    </div>
    <div id="container">
        <iframe id="browser-iframe" src="${initialUrl}"></iframe>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const iframe = document.getElementById('browser-iframe');
        const urlInput = document.getElementById('url-input');
        const goBtn = document.getElementById('go-btn');
        const readerBtn = document.getElementById('reader-btn');
        const zoomPlus = document.getElementById('zoom-plus');
        const zoomMinus = document.getElementById('zoom-minus');
        
        let currentZoom = 1.0;

        function navigate() {
            let url = urlInput.value.trim();
            if (url && !url.startsWith('http')) {
                url = 'https://' + url;
            }
            if (url) {
                iframe.src = url;
                urlInput.value = url;
            }
        }

        goBtn.addEventListener('click', navigate);
        
        readerBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (url) {
                vscode.postMessage({ command: 'open-reader', url });
            }
        });

        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') navigate();
        });

        zoomPlus.addEventListener('click', () => {
            currentZoom += 0.1;
            updateZoom();
        });

        zoomMinus.addEventListener('click', () => {
            if (currentZoom > 0.3) {
                currentZoom -= 0.1;
                updateZoom();
            }
        });

        function updateZoom() {
            // Since we can't easily change font size inside cross-origin iframe,
            // we use CSS transform scale to emulate zooming.
            iframe.style.width = (100 / currentZoom) + '%';
            iframe.style.height = (100 / currentZoom) + '%';
            iframe.style.transform = 'scale(' + currentZoom + ')';
        }

        window.addEventListener('message', (event) => {
            const message = event.data;
            switch (message.command) {
                case 'navigate':
                    urlInput.value = message.url;
                    navigate();
                    break;
            }
        });
    </script>
</body>
</html>`;
  }
}

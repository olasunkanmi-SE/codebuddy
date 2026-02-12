import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";

export class SimpleBrowserService implements vscode.Disposable {
  private static instance: SimpleBrowserService;
  private logger: Logger;
  private currentPanel: vscode.WebviewPanel | undefined;
  private _onDidReceiveMessage = new vscode.EventEmitter<any>();
  public readonly onDidReceiveMessage = this._onDidReceiveMessage.event;

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
    this.logger.info("SimpleBrowserService disposed");
  }

  public async openBrowser(
    url: string,
    title = "Simple Browser",
  ): Promise<void> {
    if (this.currentPanel) {
      this.currentPanel.reveal(vscode.ViewColumn.Beside);
      this.currentPanel.webview.postMessage({ type: "navigate", url });
      return;
    }

    this.currentPanel = vscode.window.createWebviewPanel(
      "simpleBrowser",
      title,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true,
      },
    );

    this.currentPanel.onDidDispose(() => {
      this.currentPanel = undefined;
    });

    this.currentPanel.webview.onDidReceiveMessage((message) => {
      this.handleMessage(message);
    });

    this.currentPanel.webview.html = this.getBrowserHtml(url);
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case "log":
        this.logger.info(`[Browser Console] ${message.level}: ${message.data}`);
        this._onDidReceiveMessage.fire(message);
        break;
      case "elementSelected":
        this.logger.info(
          `[Browser Inspector] Element selected: ${message.selector}`,
        );
        this._onDidReceiveMessage.fire(message);
        break;
      case "urlChanged":
        this.logger.info(`[Browser] URL changed to: ${message.url}`);
        break;
    }
  }

  private getBrowserHtml(initialUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Simple Browser</title>
    <style>
        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: var(--vscode-font-family); background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
        .toolbar { display: flex; align-items: center; padding: 4px 8px; background: var(--vscode-breadcrumb-background); border-bottom: 1px solid var(--vscode-panel-border); gap: 8px; }
        .toolbar button { background: transparent; border: none; color: var(--vscode-foreground); cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
        .toolbar button:hover { background: var(--vscode-toolbar-hoverBackground); }
        .toolbar button:disabled { opacity: 0.5; cursor: not-allowed; }
        .address-bar { flex: 1; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); color: var(--vscode-input-foreground); padding: 4px 8px; border-radius: 2px; outline: none; }
        .address-bar:focus { border-color: var(--vscode-focusBorder); }
        .browser-container { height: calc(100% - 40px); position: relative; }
        iframe { width: 100%; height: 100%; border: none; background: white; }
        .inspector-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 100; }
        .inspect-mode-active iframe { pointer-events: none; }
        .inspect-mode-active .inspector-overlay { pointer-events: auto; cursor: crosshair; }
    </style>
</head>
<body class="">
    <div class="toolbar">
        <button id="back" title="Go Back">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10 3.5l-4 4 4 4 .707-.707L7.414 7.5l3.293-3.293L10 3.5z"/></svg>
        </button>
        <button id="forward" title="Go Forward">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M6 3.5l4 4-4 4-.707-.707L8.586 7.5 5.293 4.207 6 3.5z"/></svg>
        </button>
        <button id="reload" title="Reload">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 2l-.707.707L13.5 3.414A5.964 5.964 0 008 2a6 6 0 106 6h-1a5 5 0 11-5-5 4.97 4.97 0 014.586 3H10v1h4.5V2.5h-1V2z"/></svg>
        </button>
        <input type="text" id="address-bar" class="address-bar" value="${initialUrl}">
        <button id="inspect" title="Inspect Element">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8.5 2v1h5v5h1V2h-6zm-1 0h-5v5h1V3h4V2zm1 12v-1h5v-5h1v6h-6zm-1 0h-5v-5h1v4h4v1z"/></svg>
        </button>
    </div>
    <div class="browser-container" id="container">
        <iframe id="browser-iframe" src="${initialUrl}"></iframe>
        <div id="inspector-overlay" class="inspector-overlay"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const iframe = document.getElementById('browser-iframe');
        const addressBar = document.getElementById('address-bar');
        const backBtn = document.getElementById('back');
        const forwardBtn = document.getElementById('forward');
        const reloadBtn = document.getElementById('reload');
        const inspectBtn = document.getElementById('inspect');
        const container = document.getElementById('container');
        const overlay = document.getElementById('inspector-overlay');

        let inspectMode = false;

        // Message from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'navigate':
                    iframe.src = message.url;
                    addressBar.value = message.url;
                    break;
            }
        });

        // Toolbar actions
        backBtn.addEventListener('click', () => history.back());
        forwardBtn.addEventListener('click', () => history.forward());
        reloadBtn.addEventListener('click', () => iframe.src = iframe.src);
        
        addressBar.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                let url = addressBar.value;
                if (!url.startsWith('http')) url = 'http://' + url;
                iframe.src = url;
            }
        });

        // Inspect Mode
        inspectBtn.addEventListener('click', () => {
            inspectMode = !inspectMode;
            document.body.classList.toggle('inspect-mode-active', inspectMode);
            inspectBtn.style.background = inspectMode ? 'var(--vscode-button-background)' : 'transparent';
        });

        overlay.addEventListener('click', e => {
            if (!inspectMode) return;
            
            // Try to find the element at the click coordinates
            // This works if the iframe is same-origin
            try {
                const element = iframe.contentDocument.elementFromPoint(e.clientX, e.clientY - 40); // 40 is toolbar height
                if (element) {
                    const details = {
                        tagName: element.tagName,
                        id: element.id,
                        className: element.className,
                        textContent: element.textContent?.substring(0, 100),
                        innerHTML: element.innerHTML?.substring(0, 500)
                    };
                    vscode.postMessage({
                        type: 'elementSelected',
                        selector: details.tagName + (details.id ? '#' + details.id : '') + (details.className ? '.' + details.className.split(' ').join('.') : ''),
                        details: details
                    });
                }
            } catch (err) {
                // Cross-origin fallback
                vscode.postMessage({
                    type: 'elementSelected',
                    x: e.clientX,
                    y: e.clientY,
                    error: 'Cross-origin element access restricted'
                });
            }

            inspectMode = false;
            document.body.classList.toggle('inspect-mode-active', false);
            inspectBtn.style.background = 'transparent';
        });

        // Capture console logs (Requires same-origin or script injection)
        iframe.addEventListener('load', () => {
            try {
                const win = iframe.contentWindow;
                
                // Monitor for URL changes inside the iframe
                const observer = new MutationObserver(() => {
                    if (addressBar.value !== iframe.src) {
                        addressBar.value = iframe.src;
                        vscode.postMessage({ type: 'urlChanged', url: iframe.src });
                    }
                });
                observer.observe(iframe, { attributes: true, attributeFilter: ['src'] });

                // Override console methods
                const levels = ['log', 'debug', 'info', 'warn', 'error'];
                levels.forEach(level => {
                    const original = win.console[level];
                    win.console[level] = (...args) => {
                        vscode.postMessage({ 
                            type: 'log', 
                            level: level, 
                            data: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') 
                        });
                        original.apply(win.console, args);
                    };
                });
            } catch (e) {
                console.warn('Cannot capture console logs from cross-origin iframe');
            }
            
            vscode.postMessage({ type: 'urlChanged', url: iframe.src });
            addressBar.value = iframe.src;
        });
    </script>
</body>
</html>`;
  }
}

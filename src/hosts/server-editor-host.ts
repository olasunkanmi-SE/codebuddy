/* eslint-disable @typescript-eslint/no-empty-function */
import * as path from "path";
import * as fsp from "fs/promises";
import * as cp from "child_process";
import * as crypto from "crypto";
import { randomUUID } from "crypto";
import { EventEmitter } from "events";
import {
  IEditorHost,
  ITerminal,
  IWorkspaceConfiguration,
  ConfigurationTarget,
  IConfigurationChangeEvent,
  IOutputChannel,
  ISecretStorage,
  ISecretStorageChangeEvent,
  IInputBoxOptions,
  IAuthenticationSession,
  ITask,
  ITaskExecution,
  IAuthenticationSessionsChangeEvent,
  FileStat,
  FileType,
  ITextDocument,
  IWebviewViewProvider,
  ICancellationToken,
  IRange,
  IPosition,
  ISelection,
  ITextEditor,
  ITextEditorEdit,
  IQuickPickItem,
  IStatusBarItem,
  StatusBarAlignment,
  TaskRevealKind,
  TaskPanelKind,
} from "../interfaces/editor-host";
import { BackendProtocol } from "deepagents";
import { NodeFilesystemBackend } from "../agents/backends/node-filesystem";
import { IDisposable } from "../interfaces/disposable";

import { NodeEventEmitter } from "../emitter/node-emitter";

export interface IClientConnection {
  sendRequest(method: string, params: any): Promise<any>;
  sendNotification(method: string, params: any): void;
}

class ServerSecretStorage implements ISecretStorage {
  private storage = new Map<string, string>();
  private _onDidChange = new EventEmitter();

  async get(key: string): Promise<string | undefined> {
    return this.storage.get(key);
  }

  async store(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
    this._onDidChange.emit("change", { key });
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
    this._onDidChange.emit("change", { key });
  }

  get onDidChange(): (
    listener: (e: ISecretStorageChangeEvent) => any,
    thisArgs?: any,
    disposables?: IDisposable[],
  ) => IDisposable {
    return (
      listener: (e: ISecretStorageChangeEvent) => any,
      thisArgs?: any,
      disposables?: IDisposable[],
    ): IDisposable => {
      this._onDidChange.on("change", listener);
      const disposable = {
        dispose: () => this._onDidChange.off("change", listener),
      };
      if (disposables) {
        disposables.push(disposable);
      }
      return disposable;
    };
  }
}

class ServerTerminal implements ITerminal {
  private process: cp.ChildProcessWithoutNullStreams | undefined;
  private _onDidWriteData = new EventEmitter();
  public id: string;

  constructor(
    public name: string,
    shellPath = "/bin/bash",
    shellArgs: string[] = [],
  ) {
    this.id = crypto.randomUUID();
    // Simple spawn implementation for headless terminal
    // Note: Real interactive terminal would need node-pty
    try {
      this.process = cp.spawn(shellPath, shellArgs, {
        shell: true,
        cwd: process.cwd(), // Default to cwd, will be overridden by runCommand usually? No, runCommand sends text.
      });

      this.process.stdout.on("data", (data) => {
        this._onDidWriteData.emit("data", data.toString());
      });

      this.process.stderr.on("data", (data) => {
        this._onDidWriteData.emit("data", data.toString());
      });
    } catch (e) {
      console.error(`Failed to spawn terminal: ${e}`);
    }
  }

  sendText(text: string, addNewLine = true): void {
    if (this.process && this.process.stdin) {
      this.process.stdin.write(text + (addNewLine ? "\n" : ""));
    }
  }

  show(preserveFocus?: boolean): void {
    // No-op in headless
  }

  dispose(): void {
    if (this.process) {
      this.process.kill();
    }
  }

  // Custom method to subscribe to output (simulating onDidWriteData)
  onDidWriteData(listener: (data: string) => void): IDisposable {
    this._onDidWriteData.on("data", listener);
    return {
      dispose: () => this._onDidWriteData.off("data", listener),
    };
  }

  // Process ID
  get processId(): Promise<number | undefined> {
    return Promise.resolve(this.process?.pid);
  }
}

class ServerOutputChannel implements IOutputChannel {
  constructor(public name: string) {}

  append(value: string): void {
    process.stderr.write(`[${this.name}] ${value}`);
  }

  appendLine(value: string): void {
    process.stderr.write(`[${this.name}] ${value}\n`);
  }

  clear(): void {}
  show(preserveFocus?: boolean): void {}
  hide(): void {}
  dispose(): void {}
  replace(value: string): void {
    console.error(`[${this.name}] (Replace) ${value}`);
  }
}

class ServerWorkspaceConfiguration implements IWorkspaceConfiguration {
  get<T>(section: string, defaultValue?: T): T {
    // Simple environment variable mapping
    // e.g. "anthropic.apiKey" -> "ANTHROPIC_API_KEY"
    const envKey = section.replace(/\./g, "_").toUpperCase();
    const envValue = process.env[envKey];

    if (envValue !== undefined) {
      return envValue as unknown as T;
    }

    return defaultValue as T;
  }

  update(
    section: string,
    value: any,
    configurationTarget?: ConfigurationTarget | boolean,
  ): Promise<void> {
    console.error(`[Config] Update ${section} = ${JSON.stringify(value)}`);
    return Promise.resolve();
  }

  has(section: string): boolean {
    return false;
  }

  inspect<T>(section: string):
    | {
        key: string;
        defaultValue?: T;
        globalValue?: T;
        workspaceValue?: T;
        workspaceFolderValue?: T;
        defaultLanguageValue?: T;
        globalLanguageValue?: T;
        workspaceLanguageValue?: T;
        workspaceFolderLanguageValue?: T;
        languageIds?: string[];
      }
    | undefined {
    return undefined;
  }
}

export class ServerEditorHost implements IEditorHost {
  fs: BackendProtocol;
  private terminals: Map<string, ITerminal> = new Map();
  secrets: ISecretStorage;
  private clientConnection: IClientConnection | undefined;

  setClientConnection(connection: IClientConnection) {
    this.clientConnection = connection;
  }

  createEventEmitter<T>(): import("../interfaces/events").IEventEmitter<T> {
    return new NodeEventEmitter<T>();
  }

  createThemeColor(id: string): any {
    return { id };
  }

  uri = {
    file: (filePath: string) => ({
      fsPath: filePath,
      path: filePath,
      scheme: "file",
      toString: () => filePath,
    }),
    parse: (value: string, strict?: boolean) => ({
      fsPath: value,
      path: value,
      scheme: "file",
      toString: () => value,
    }),
    joinPath: (base: any, ...pathSegments: string[]) => {
      const joined = path.join(base.fsPath, ...pathSegments);
      return {
        fsPath: joined,
        path: joined,
        scheme: "file",
        toString: () => joined,
      };
    },
  };

  constructor(private workspaceRoot: string) {
    this.fs = new NodeFilesystemBackend({
      rootDir: workspaceRoot,
    });

    // Update workspace.rootPath and workspaceFolders
    this.workspace.rootPath = workspaceRoot;
    this.secrets = new ServerSecretStorage();
  }

  window = {
    activeTextEditor: undefined,
    activeTerminal: undefined,
    showInformationMessage: async (message: string, ...items: string[]) => {
      if (this.clientConnection) {
        return this.clientConnection.sendRequest(
          "window/showInformationMessage",
          { message, items },
        );
      }
      console.error(`[Info] ${message}`);
      return items[0];
    },
    showErrorMessage: async (message: string, ...items: string[]) => {
      if (this.clientConnection) {
        return this.clientConnection.sendRequest("window/showErrorMessage", {
          message,
          items,
        });
      }
      console.error(`[Error] ${message}`);
      return undefined;
    },
    showWarningMessage: async (message: string, ...items: string[]) => {
      if (this.clientConnection) {
        return this.clientConnection.sendRequest("window/showWarningMessage", {
          message,
          items,
        });
      }
      console.warn(`[Warning] ${message}`);
      return undefined;
    },
    showQuickPick: async (
      items: string[] | IQuickPickItem[],
      options?: { placeHolder?: string },
    ) => {
      if (this.clientConnection) {
        return this.clientConnection.sendRequest("window/showQuickPick", {
          items,
          options,
        });
      }
      const labels = items.map((i) => (typeof i === "string" ? i : i.label));
      console.error(
        `[QuickPick] ${options?.placeHolder}: ${labels.join(", ")}`,
      );
      // In headless, we might want to fail or pick first?
      // For now, picking first to unblock automation
      return items[0] as any;
    },
    showInputBox: async (options?: IInputBoxOptions) => {
      if (this.clientConnection) {
        return this.clientConnection.sendRequest("window/showInputBox", {
          options,
        });
      }
      console.error(`[InputBox] ${options?.prompt || options?.placeHolder}`);
      return undefined;
    },
    withProgress: async <R>(
      options: { location: any; title: string; cancellable?: boolean },
      task: (progress: any, token: any) => Promise<R>,
    ): Promise<R> => {
      if (this.clientConnection) {
        const progressId = randomUUID();

        // Start progress on client
        // We assume location is Notification (15) for now as it's the most common
        // or we can map it if needed.
        this.clientConnection.sendNotification("window/progress/start", {
          id: progressId,
          options: {
            location: 15,
            title: options.title,
            cancellable: options.cancellable,
          },
        });

        const progressReporter = {
          report: (value: { message?: string; increment?: number }) => {
            this.clientConnection!.sendNotification("window/progress/report", {
              id: progressId,
              message: value.message,
              increment: value.increment,
            });
          },
        };

        try {
          const result = await task(progressReporter, {
            isCancellationRequested: false,
            onCancellationRequested: () => {},
          });

          // End progress
          this.clientConnection.sendNotification("window/progress/end", {
            id: progressId,
          });

          return result;
        } catch (error) {
          this.clientConnection.sendNotification("window/progress/end", {
            id: progressId,
          });
          throw error;
        }
      }

      // Fallback implementation for when no client is connected
      console.error(`[Progress] ${options.title}`);
      return await task(
        {
          report: (msg: any) =>
            console.error(`[Progress Update] ${msg.message}`),
        },
        { isCancellationRequested: false, onCancellationRequested: () => {} },
      );
    },
    openFile: async (filePath: string) => {
      console.error(`[OpenFile] ${filePath}`);
    },
    createOutputChannel: (name: string): IOutputChannel => {
      return new ServerOutputChannel(name);
    },
    showOpenDialog: async (options: any) => {
      console.error(`[OpenDialog]`, options);
      return undefined;
    },
    createTerminal: (options: any) => {
      const term = new ServerTerminal(
        options.name || "Server Terminal",
        options.shellPath,
        options.shellArgs,
      );
      this.terminals.set(term.id, term);
      return term;
    },
    showTextDocument: async (
      document: ITextDocument,
      column?: any,
      preserveFocus?: boolean,
    ) => {
      console.error(`[ShowTextDocument] ${document.fileName}`);
      return {
        document,
        selection: {
          start: { line: 0, character: 0 },
          end: { line: 0, character: 0 },
          active: { start: 0, end: 0 },
          isEmpty: true,
        },
        edit: async () => true,
      } as unknown as ITextEditor;
    },
    registerWebviewViewProvider: (
      viewId: string,
      provider: IWebviewViewProvider,
      options?: any,
    ) => {
      console.error(`[Webview] Registered ${viewId}`);
      return { dispose: () => {} };
    },
    createStatusBarItem: (
      alignment?: StatusBarAlignment,
      priority?: number,
    ): IStatusBarItem => {
      return {
        alignment: alignment || StatusBarAlignment.Left,
        priority,
        text: "",
        show: () => {},
        hide: () => {},
        dispose: () => {},
      };
    },
    onDidChangeActiveTextEditor: (
      listener: (e: ITextEditor | undefined) => any,
      thisArgs?: any,
      disposables?: IDisposable[],
    ): IDisposable => {
      return { dispose: () => {} };
    },
  };

  env = {
    openExternal: async (uri: any) => {
      console.log(`[Env] Open External: ${uri}`);
      return true;
    },
  };

  commands = {
    executeCommand: async (command: string, ...rest: any[]) => {
      if (this.clientConnection) {
        // Forward commands to the client
        try {
          return await this.clientConnection.sendRequest(
            "commands/executeCommand",
            { command, args: rest },
          );
        } catch (e) {
          console.error(`RPC Command failed: ${command}`, e);
          // Continue to fallback
        }
      }
      console.error(`[Command] ${command}`, rest);
      if (command === "vscode.executeWorkspaceSymbolProvider") {
        // Fallback: simple regex search for symbols?
        // For now return empty array to avoid breaking
        return [];
      }
      if (command === "simpleBrowser.show") {
        console.error(`[Browser] Open ${rest[0]}`);
        return;
      }
      return undefined;
    },
  };

  terminal = {
    createTerminal: async (
      name?: string,
      shellPath?: string,
      shellArgs?: string[],
    ): Promise<ITerminal> => {
      const term = new ServerTerminal(
        name || "Server Terminal",
        shellPath,
        shellArgs,
      );
      this.terminals.set(term.id, term);
      return term;
    },
    runCommand: async (terminalId: string, command: string) => {
      const term = this.terminals.get(terminalId);
      if (term) {
        term.sendText(command);
      } else {
        console.error(`Terminal ${terminalId} not found`);
      }
    },
  };

  workspace = {
    rootPath: "", // Initialized in constructor
    get workspaceFolders() {
      return [
        {
          uri: { fsPath: this.rootPath },
          name: path.basename(this.rootPath),
          index: 0,
        },
      ];
    },
    textDocuments: [],
    openTextDocument: async (
      optionsOrFileName?: string | { language?: string; content?: string },
    ): Promise<ITextDocument> => {
      console.error(`[Workspace] OpenTextDocument`, optionsOrFileName);
      let content = "";
      let fileName = "untitled";
      let languageId = "plaintext";

      if (typeof optionsOrFileName === "string") {
        fileName = optionsOrFileName;
        try {
          content = await fsp.readFile(fileName, "utf-8");
          const ext = path.extname(fileName).toLowerCase();
          if (ext === ".ts" || ext === ".tsx") languageId = "typescript";
          else if (ext === ".js" || ext === ".jsx") languageId = "javascript";
          else if (ext === ".json") languageId = "json";
          else if (ext === ".md") languageId = "markdown";
          else if (ext === ".py") languageId = "python";
        } catch (e) {
          console.error(`Failed to read file ${fileName}: ${e}`);
        }
      } else if (typeof optionsOrFileName === "object") {
        content = optionsOrFileName.content || "";
        languageId = optionsOrFileName.language || "plaintext";
      }

      return {
        uri: { fsPath: fileName },
        fileName: fileName,
        isDirty: false,
        getText: () => content,
        offsetAt: () => 0,
        languageId: languageId,
      } as unknown as ITextDocument;
    },
    getConfiguration: (section: string): IWorkspaceConfiguration => {
      return new ServerWorkspaceConfiguration();
    },
    findFiles: async (
      include: string,
      exclude?: string,
      maxResults?: number,
      token?: ICancellationToken,
    ): Promise<string[]> => {
      // Use NodeFilesystemBackend globInfo
      const files = await (this.fs as NodeFilesystemBackend).globInfo(include);
      // TODO: Handle maxResults and exclude
      return files.map((f) => path.join(this.workspaceRoot, f.path));
    },
    fs: {
      stat: async (p: string): Promise<FileStat> => {
        const fullPath = path.join(this.workspaceRoot, p);
        try {
          const stat = await fsp.stat(fullPath);
          return {
            type: stat.isDirectory() ? FileType.Directory : FileType.File,
            ctime: stat.ctimeMs,
            mtime: stat.mtimeMs,
            size: stat.size,
          };
        } catch (e) {
          return { type: FileType.Unknown, ctime: 0, mtime: 0, size: 0 };
        }
      },
      readDirectory: async (p: string): Promise<[string, FileType][]> => {
        const fullPath = path.isAbsolute(p)
          ? p
          : path.join(this.workspaceRoot, p);
        try {
          const entries = await fsp.readdir(fullPath, { withFileTypes: true });
          return entries.map((e) => [
            e.name,
            e.isDirectory() ? FileType.Directory : FileType.File,
          ]);
        } catch (e) {
          return [];
        }
      },
      readFile: async (p: string): Promise<Uint8Array> => {
        const fullPath = path.isAbsolute(p)
          ? p
          : path.join(this.workspaceRoot, p);
        const buffer = await fsp.readFile(fullPath);
        return new Uint8Array(buffer);
      },
      writeFile: async (p: string, content: Uint8Array): Promise<void> => {
        const fullPath = path.isAbsolute(p)
          ? p
          : path.join(this.workspaceRoot, p);
        await fsp.writeFile(fullPath, content);
      },
      createDirectory: async (p: string): Promise<void> => {
        const fullPath = path.isAbsolute(p)
          ? p
          : path.join(this.workspaceRoot, p);
        await fsp.mkdir(fullPath, { recursive: true });
      },
      delete: async (
        p: string,
        options?: { recursive?: boolean; useTrash?: boolean },
      ): Promise<void> => {
        const fullPath = path.isAbsolute(p)
          ? p
          : path.join(this.workspaceRoot, p);
        // Node.js doesn't support trash natively easily without extra libs, so we just delete
        // If recursive is true, use rm with recursive option
        await fsp.rm(fullPath, {
          recursive: options?.recursive ?? false,
          force: true,
        });
      },
      appendFile: async (p: string, content: Uint8Array): Promise<void> => {
        const fullPath = path.isAbsolute(p)
          ? p
          : path.join(this.workspaceRoot, p);
        await fsp.appendFile(fullPath, content);
      },
    },
    onDidChangeWorkspaceFolders: (
      listener: (e: any) => any,
      thisArgs?: any,
      disposables?: IDisposable[],
    ): IDisposable => {
      return { dispose: () => {} };
    },
    createFileSystemWatcher: (pattern: string) => {
      return {
        onDidChange: (listener: any) => ({ dispose: () => {} }),
        onDidCreate: (listener: any) => ({ dispose: () => {} }),
        onDidDelete: (listener: any) => ({ dispose: () => {} }),
        dispose: () => {},
      };
    },
    onDidChangeConfiguration: (
      listener: (e: IConfigurationChangeEvent) => any,
      thisArgs?: any,
      disposables?: IDisposable[],
    ): IDisposable => {
      return { dispose: () => {} };
    },
    asRelativePath: (pathOrUri: string) => {
      return path.relative(this.workspaceRoot, pathOrUri);
    },
    findTextInFiles: async (
      query: { pattern: string; isRegExp?: boolean },
      options: { include?: string; exclude?: string },
      callback: (result: {
        uri: { fsPath: string };
        preview: { text: string };
        ranges: { start: { line: number } }[];
      }) => void,
    ): Promise<void> => {
      const matches = await (this.fs as NodeFilesystemBackend).grepRaw(
        query.pattern,
        "/",
        options.include || null,
      );
      if (typeof matches === "string") {
        console.error(`Grep failed: ${matches}`);
        return;
      }

      for (const m of matches) {
        callback({
          uri: { fsPath: path.join(this.workspaceRoot, m.path) },
          preview: { text: m.text },
          ranges: [{ start: { line: m.line - 1 } }],
        });
      }
    },
  };

  languages = {
    getDiagnostics: async (
      resource?: string,
    ): Promise<
      Array<{
        uri: { fsPath: string };
        range: {
          start: { line: number; character: number };
          end: { line: number; character: number };
        };
        message: string;
        severity: 0 | 1 | 2 | 3;
      }>
    > => {
      // No LSP in headless mode by default
      return [];
    },
  };

  authentication = {
    getSession: async (
      providerId: string,
      scopes: string[],
      options?: { createIfNone?: boolean },
    ): Promise<IAuthenticationSession | undefined> => {
      console.error(`[Auth] Requesting session for ${providerId}`);
      // In headless mode, we might need to support a token via env var or config
      return undefined;
    },
    onDidChangeSessions: (
      listener: (e: IAuthenticationSessionsChangeEvent) => any,
      thisArgs?: any,
      disposables?: IDisposable[],
    ): IDisposable => {
      return { dispose: () => {} };
    },
  };

  tasks = {
    createShellTask: (name: string, command: string): ITask => {
      return {
        name,
        isBackground: false,
        presentationOptions: {
          reveal: TaskRevealKind.Always,
          panel: TaskPanelKind.Shared,
          echo: true,
          showReuseMessage: true,
          clear: false,
        },
      };
    },
    executeTask: async (task: ITask): Promise<ITaskExecution> => {
      console.error(`[Tasks] Executing task: ${task.name}`);
      return {
        terminate: () => {
          console.error(`[Tasks] Terminating task: ${task.name}`);
        },
      };
    },
  };

  extensions = {
    getExtension: (id: string) => {
      console.error(`[Extensions] Requesting extension: ${id}`);
      return undefined;
    },
  };
}

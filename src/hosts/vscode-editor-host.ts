import * as vscode from "vscode";
import * as path from "path";
import { IOutputChannel } from "../interfaces/output-channel";
import {
  IEditorHost,
  ITerminal,
  IWorkspaceConfiguration,
  ConfigurationTarget,
  IConfigurationChangeEvent,
  ISelection,
  ITextEditor,
  IInputBoxOptions,
  IQuickPickItem,
  FileStat,
  FileType,
  StatusBarAlignment,
  IStatusBarItem,
  ITextEditorEdit,
  IRange,
  IPosition,
  IWebviewViewProvider,
  IWebviewView,
  IWebview,
  ICancellationToken,
  ITask,
  ITaskExecution,
} from "../interfaces/editor-host";
import { BackendProtocol } from "deepagents";
import { NodeFilesystemBackend } from "../agents/backends/node-filesystem";
import { rgPath } from "@vscode/ripgrep";
import { spawnSync, spawn } from "child_process";
import { IDisposable } from "../interfaces/disposable";

/**
 * VS Code implementation of IEditorHost.
 * Uses VscodeFsBackend (which integrates with DiffReviewService) and VS Code APIs.
 */
export class VSCodeEditorHost implements IEditorHost {
  fs: BackendProtocol;

  createEventEmitter<T>(): import("../interfaces/events").IEventEmitter<T> {
    const emitter = new vscode.EventEmitter<T>();
    return {
      event: emitter.event,
      fire: (data: T) => emitter.fire(data),
      dispose: () => emitter.dispose(),
    };
  }

  createThemeColor(id: string): any {
    return new vscode.ThemeColor(id);
  }

  env = {
    openExternal: async (uri: any) => {
      return vscode.env.openExternal(uri);
    },
  };

  uri = {
    file: (path: string) => vscode.Uri.file(path),
    parse: (value: string, strict?: boolean) => vscode.Uri.parse(value, strict),
    joinPath: (base: any, ...pathSegments: string[]) =>
      vscode.Uri.joinPath(base, ...pathSegments),
  };

  window = {
    get activeTerminal(): ITerminal | undefined {
      const term = vscode.window.activeTerminal;
      return term ? new VSCodeTerminal(term) : undefined;
    },
    get activeTextEditor(): ITextEditor | undefined {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return undefined;
      return {
        document: {
          uri: { fsPath: editor.document.uri.fsPath },
          fileName: editor.document.fileName,
          isDirty: editor.document.isDirty,
          getText: (range?: ISelection) => {
            if (range) {
              const vscodeRange = new vscode.Range(
                range.start.line,
                range.start.character,
                range.end.line,
                range.end.character,
              );
              return editor.document.getText(vscodeRange);
            }
            return editor.document.getText();
          },
          offsetAt: (position: { line: number; character: number }) => {
            return editor.document.offsetAt(
              new vscode.Position(position.line, position.character),
            );
          },
          languageId: editor.document.languageId,
        },
        selection: {
          start: {
            line: editor.selection.start.line,
            character: editor.selection.start.character,
          },
          end: {
            line: editor.selection.end.line,
            character: editor.selection.end.character,
          },
          active: {
            line: editor.selection.active.line,
            character: editor.selection.active.character,
          },
          isEmpty: editor.selection.isEmpty,
        },
        edit: (
          callback: (editBuilder: ITextEditorEdit) => void,
          options?: { undoStopBefore: boolean; undoStopAfter: boolean },
        ) => {
          return Promise.resolve(
            editor.edit((editBuilder) => {
              callback({
                replace: (range: IRange | ISelection, value: string) =>
                  editBuilder.replace(
                    new vscode.Range(
                      range.start.line,
                      range.start.character,
                      range.end.line,
                      range.end.character,
                    ),
                    value,
                  ),
                insert: (pos: IPosition, value: string) =>
                  editBuilder.insert(
                    new vscode.Position(pos.line, pos.character),
                    value,
                  ),
                delete: (range: IRange | ISelection) =>
                  editBuilder.delete(
                    new vscode.Range(
                      range.start.line,
                      range.start.character,
                      range.end.line,
                      range.end.character,
                    ),
                  ),
              });
            }, options),
          );
        },
      };
    },
    showInformationMessage: async (message: string, ...items: string[]) => {
      return vscode.window.showInformationMessage(message, ...items);
    },
    showErrorMessage: async (message: string, ...items: string[]) => {
      return vscode.window.showErrorMessage(message, ...items);
    },
    showWarningMessage: async (message: string, ...items: string[]) => {
      return vscode.window.showWarningMessage(message, ...items);
    },
    showQuickPick: async (
      items: string[] | IQuickPickItem[],
      options?: { placeHolder?: string; title?: string; canPickMany?: boolean },
    ) => {
      if (items.length === 0) return undefined;

      if (typeof items[0] === "string") {
        return vscode.window.showQuickPick(items as string[], {
          placeHolder: options?.placeHolder,
          title: options?.title,
          canPickMany: options?.canPickMany,
        });
      } else {
        const vscodeItems = (items as IQuickPickItem[]).map(
          (item) =>
            ({
              ...item,
              label: item.label, // Ensure label is present
            }) as vscode.QuickPickItem,
        );

        return vscode.window.showQuickPick(vscodeItems, {
          placeHolder: options?.placeHolder,
          title: options?.title,
          canPickMany: options?.canPickMany,
        });
      }
    },
    showInputBox: async (options?: IInputBoxOptions) => {
      return vscode.window.showInputBox({
        value: options?.value,
        valueSelection: options?.valueSelection,
        placeHolder: options?.placeHolder,
        password: options?.password,
        ignoreFocusOut: options?.ignoreFocusOut,
        prompt: options?.prompt,
        validateInput: options?.validateInput,
      });
    },
    showOpenDialog: async (options?: {
      canSelectFiles?: boolean;
      canSelectFolders?: boolean;
      canSelectMany?: boolean;
      filters?: { [name: string]: string[] };
      title?: string;
      openLabel?: string;
    }) => {
      const uris = await vscode.window.showOpenDialog({
        canSelectFiles: options?.canSelectFiles,
        canSelectFolders: options?.canSelectFolders,
        canSelectMany: options?.canSelectMany,
        filters: options?.filters,
        title: options?.title,
        openLabel: options?.openLabel,
      });
      return uris?.map((uri) => uri.fsPath);
    },
    withProgress: async <R>(
      options: { location: any; title: string; cancellable?: boolean },
      task: (progress: any, token: any) => Promise<R>,
    ): Promise<R> => {
      // Map location if it's a string, otherwise assume it's a valid VS Code ProgressLocation
      let location = options.location;
      if (typeof location === "string") {
        if (location === "Notification")
          location = vscode.ProgressLocation.Notification;
        else if (location === "Window")
          location = vscode.ProgressLocation.Window;
        else if (location === "SourceControl")
          location = vscode.ProgressLocation.SourceControl;
      }

      return vscode.window.withProgress(
        {
          location: location || vscode.ProgressLocation.Notification,
          title: options.title,
          cancellable: options.cancellable,
        },
        task,
      );
    },
    openFile: async (filePath: string) => {
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
    },
    showTextDocument: async (
      document: any,
      column?: number,
      preserveFocus?: boolean,
    ) => {
      // Ensure document is a VS Code document or convert it
      let vscodeDoc = document;
      if (document.uri && document.uri.fsPath && !document.getText) {
        // If it looks like ITextDocument but not vscode.TextDocument (which has getText but different signature?)
        // Actually vscode.TextDocument has getText too.
        // Let's assume if it's not a vscode object, we open it by path.
        vscodeDoc = await vscode.workspace.openTextDocument(
          vscode.Uri.file(document.uri.fsPath),
        );
      } else if (document.uri && document.uri.fsPath) {
        // Even if it has properties, let's just re-open to be safe if it's a plain object
        vscodeDoc = await vscode.workspace.openTextDocument(
          vscode.Uri.file(document.uri.fsPath),
        );
      }

      const editor = await vscode.window.showTextDocument(
        vscodeDoc,
        column,
        preserveFocus,
      );

      return {
        document: {
          uri: { fsPath: editor.document.uri.fsPath },
          fileName: editor.document.fileName,
          isDirty: editor.document.isDirty,
          getText: (range?: ISelection) => {
            if (range) {
              const vscodeRange = new vscode.Range(
                range.start.line,
                range.start.character,
                range.end.line,
                range.end.character,
              );
              return editor.document.getText(vscodeRange);
            }
            return editor.document.getText();
          },
          offsetAt: (position: { line: number; character: number }) => {
            return editor.document.offsetAt(
              new vscode.Position(position.line, position.character),
            );
          },
          languageId: editor.document.languageId,
        },
        selection: {
          start: {
            line: editor.selection.start.line,
            character: editor.selection.start.character,
          },
          end: {
            line: editor.selection.end.line,
            character: editor.selection.end.character,
          },
          active: {
            line: editor.selection.active.line,
            character: editor.selection.active.character,
          },
          isEmpty: editor.selection.isEmpty,
        },
        edit: (
          callback: (editBuilder: ITextEditorEdit) => void,
          options?: { undoStopBefore: boolean; undoStopAfter: boolean },
        ) => {
          return Promise.resolve(
            editor.edit((editBuilder) => {
              callback({
                replace: (range: IRange | ISelection, value: string) =>
                  editBuilder.replace(
                    new vscode.Range(
                      range.start.line,
                      range.start.character,
                      range.end.line,
                      range.end.character,
                    ),
                    value,
                  ),
                insert: (pos: IPosition, value: string) =>
                  editBuilder.insert(
                    new vscode.Position(pos.line, pos.character),
                    value,
                  ),
                delete: (range: IRange | ISelection) =>
                  editBuilder.delete(
                    new vscode.Range(
                      range.start.line,
                      range.start.character,
                      range.end.line,
                      range.end.character,
                    ),
                  ),
              });
            }, options),
          );
        },
      };
    },
    createOutputChannel: (name: string): IOutputChannel => {
      return new VSCodeOutputChannel(vscode.window.createOutputChannel(name));
    },
    createStatusBarItem: (
      alignment?: StatusBarAlignment,
      priority?: number,
    ): IStatusBarItem => {
      let vscodeAlignment: vscode.StatusBarAlignment | undefined;
      if (alignment === StatusBarAlignment.Left) {
        vscodeAlignment = vscode.StatusBarAlignment.Left;
      } else if (alignment === StatusBarAlignment.Right) {
        vscodeAlignment = vscode.StatusBarAlignment.Right;
      }

      const item = vscode.window.createStatusBarItem(vscodeAlignment, priority);
      return new VSCodeStatusBarItem(item);
    },
    createTerminal: (
      nameOrOptions?:
        | string
        | { name?: string; shellPath?: string; shellArgs?: string[] },
    ): ITerminal => {
      let options: any;
      if (typeof nameOrOptions === "string") {
        options = { name: nameOrOptions };
      } else {
        options = nameOrOptions || {};
      }

      const term = vscode.window.createTerminal({
        name: options.name || "CodeBuddy Terminal",
        shellPath: options.shellPath,
        shellArgs: options.shellArgs,
      });
      return new VSCodeTerminal(term);
    },
    onDidChangeActiveTextEditor: (
      listener: (e: ITextEditor | undefined) => any,
      thisArgs?: any,
      disposables?: IDisposable[],
    ): IDisposable => {
      return vscode.window.onDidChangeActiveTextEditor(
        (editor) => {
          if (!editor) {
            listener(undefined);
            return;
          }
          // Map VS Code editor to ITextEditor
          const mappedEditor: ITextEditor = {
            document: {
              uri: { fsPath: editor.document.uri.fsPath },
              fileName: editor.document.fileName,
              isDirty: editor.document.isDirty,
              getText: (range?: ISelection) => {
                if (range) {
                  const vscodeRange = new vscode.Range(
                    range.start.line,
                    range.start.character,
                    range.end.line,
                    range.end.character,
                  );
                  return editor.document.getText(vscodeRange);
                }
                return editor.document.getText();
              },
              offsetAt: (position: { line: number; character: number }) => {
                return editor.document.offsetAt(
                  new vscode.Position(position.line, position.character),
                );
              },
              languageId: editor.document.languageId,
            },
            selection: {
              start: {
                line: editor.selection.start.line,
                character: editor.selection.start.character,
              },
              end: {
                line: editor.selection.end.line,
                character: editor.selection.end.character,
              },
              active: {
                line: editor.selection.active.line,
                character: editor.selection.active.character,
              },
              isEmpty: editor.selection.isEmpty,
            },
            edit: (
              callback: (editBuilder: ITextEditorEdit) => void,
              options?: { undoStopBefore: boolean; undoStopAfter: boolean },
            ) => {
              return Promise.resolve(
                editor.edit((editBuilder) => {
                  callback({
                    replace: (range: IRange | ISelection, value: string) =>
                      editBuilder.replace(
                        new vscode.Range(
                          range.start.line,
                          range.start.character,
                          range.end.line,
                          range.end.character,
                        ),
                        value,
                      ),
                    insert: (pos: IPosition, value: string) =>
                      editBuilder.insert(
                        new vscode.Position(pos.line, pos.character),
                        value,
                      ),
                    delete: (range: IRange | ISelection) =>
                      editBuilder.delete(
                        new vscode.Range(
                          range.start.line,
                          range.start.character,
                          range.end.line,
                          range.end.character,
                        ),
                      ),
                  });
                }, options),
              );
            },
          };
          listener(mappedEditor);
        },
        thisArgs,
        disposables,
      );
    },
    registerWebviewViewProvider: (
      viewId: string,
      provider: IWebviewViewProvider,
      options?: { webviewOptions: { retainContextWhenHidden: boolean } },
    ): IDisposable => {
      return vscode.window.registerWebviewViewProvider(
        viewId,
        {
          resolveWebviewView: (
            webviewView: vscode.WebviewView,
            context: vscode.WebviewViewResolveContext,
            token: vscode.CancellationToken,
          ) => {
            const wrappedWebview: IWebview = {
              options: {
                ...webviewView.webview.options,
                localResourceRoots:
                  webviewView.webview.options.localResourceRoots?.map(
                    (uri) => uri.fsPath,
                  ),
              },
              html: "", // placeholder, getter/setter overridden below
              onDidReceiveMessage: webviewView.webview.onDidReceiveMessage,
              postMessage: webviewView.webview.postMessage.bind(
                webviewView.webview,
              ),
              asWebviewUri: (localResource: string) => {
                return webviewView.webview
                  .asWebviewUri(vscode.Uri.file(localResource))
                  .toString();
              },
              cspSource: webviewView.webview.cspSource,
            };

            Object.defineProperty(wrappedWebview, "html", {
              get: () => webviewView.webview.html,
              set: (value: string) => {
                webviewView.webview.html = value;
              },
              configurable: true,
            });

            const wrappedView: IWebviewView = {
              viewType: webviewView.viewType,
              webview: wrappedWebview,
              onDidChangeVisibility: webviewView.onDidChangeVisibility,
              visible: webviewView.visible,
              title: webviewView.title,
              description: webviewView.description,
              badge: webviewView.badge,
              show: (preserveFocus?: boolean) =>
                webviewView.show(preserveFocus),
            };

            provider.resolveWebviewView(wrappedView, context, token);
          },
        },
        options,
      );
    },
  };

  commands = {
    executeCommand: async (command: string, ...rest: any[]) => {
      return vscode.commands.executeCommand(command, ...rest);
    },
  };

  workspace = {
    get rootPath() {
      return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    },
    get workspaceFolders() {
      return vscode.workspace.workspaceFolders?.map((f) => ({
        uri: { fsPath: f.uri.fsPath },
        name: f.name,
        index: f.index,
      }));
    },
    get textDocuments() {
      return vscode.workspace.textDocuments.map((doc) => ({
        uri: { fsPath: doc.uri.fsPath },
        fileName: doc.fileName,
        isDirty: doc.isDirty,
        getText: (range?: ISelection) => {
          if (range) {
            const vscodeRange = new vscode.Range(
              range.start.line,
              range.start.character,
              range.end.line,
              range.end.character,
            );
            return doc.getText(vscodeRange);
          }
          return doc.getText();
        },
        offsetAt: (position: { line: number; character: number }) => {
          return doc.offsetAt(
            new vscode.Position(position.line, position.character),
          );
        },
        languageId: doc.languageId,
      }));
    },
    openTextDocument: async (
      optionsOrFileName?: { content?: string; language?: string } | string,
    ) => {
      let doc: vscode.TextDocument;
      if (typeof optionsOrFileName === "string") {
        doc = await vscode.workspace.openTextDocument(optionsOrFileName);
      } else {
        doc = await vscode.workspace.openTextDocument(optionsOrFileName);
      }
      return {
        uri: { fsPath: doc.uri.fsPath },
        fileName: doc.fileName,
        isDirty: doc.isDirty,
        getText: (range?: ISelection) => {
          if (range) {
            const vscodeRange = new vscode.Range(
              range.start.line,
              range.start.character,
              range.end.line,
              range.end.character,
            );
            return doc.getText(vscodeRange);
          }
          return doc.getText();
        },
        offsetAt: (position: { line: number; character: number }) => {
          return doc.offsetAt(
            new vscode.Position(position.line, position.character),
          );
        },
        languageId: doc.languageId,
      };
    },
    getConfiguration: (section: string): IWorkspaceConfiguration => {
      const config = vscode.workspace.getConfiguration(section);
      return new VSCodeWorkspaceConfiguration(config);
    },
    findFiles: async (
      include: string,
      exclude?: string,
      maxResults?: number,
      token?: ICancellationToken,
    ): Promise<string[]> => {
      const files = await vscode.workspace.findFiles(
        include,
        exclude,
        maxResults,
        token as any,
      );
      return files.map((uri) => uri.fsPath);
    },
    createFileSystemWatcher: (pattern: string) => {
      return vscode.workspace.createFileSystemWatcher(pattern);
    },
    onDidChangeConfiguration: (
      listener: (e: IConfigurationChangeEvent) => any,
      thisArgs?: any,
      disposables?: IDisposable[],
    ): IDisposable => {
      return vscode.workspace.onDidChangeConfiguration(
        listener,
        thisArgs,
        disposables,
      );
    },
    asRelativePath: (pathOrUri: string | { fsPath: string }) => {
      if (typeof pathOrUri === "string") {
        return vscode.workspace.asRelativePath(pathOrUri);
      }
      return vscode.workspace.asRelativePath(vscode.Uri.file(pathOrUri.fsPath));
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
      return new Promise((resolve, reject) => {
        const args = ["-n", "--no-heading"]; // line number, no grouping
        if (!query.isRegExp) {
          args.push("-F"); // Fixed string
        }
        if (options.include) {
          args.push("-g", options.include);
        }
        if (options.exclude) {
          args.push("-g", `!${options.exclude}`);
        }

        args.push(query.pattern);
        const cwd =
          vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
        args.push(cwd);

        const child = spawn(rgPath, args, { cwd });

        let buffer = "";
        child.stdout.on("data", (data) => {
          buffer += data.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line

          for (const line of lines) {
            const match = line.match(/^(.+):(\d+):(.*)$/);
            if (match) {
              const filePath = match[1];
              const lineNum = parseInt(match[2], 10) - 1;
              const content = match[3];

              // Check if filePath is absolute or relative
              // rg output is relative to cwd if cwd is passed? No, usually relative to cwd.
              // But we need fsPath.
              const fsPath = path.resolve(cwd, filePath);

              callback({
                uri: { fsPath },
                preview: { text: content },
                ranges: [{ start: { line: lineNum } }],
              });
            }
          }
        });

        child.stderr.on("data", (data) => {
          console.error(`rg stderr: ${data}`);
        });

        child.on("close", (code) => {
          if (code === 0 || code === 1) {
            // 1 means no matches found, which is success for us
            resolve();
          } else {
            reject(new Error(`rg exited with code ${code}`));
          }
        });

        child.on("error", (err) => {
          reject(err);
        });
      });
    },
    onDidChangeWorkspaceFolders: (
      listener: (e: any) => any,
      thisArgs?: any,
      disposables?: IDisposable[],
    ): IDisposable => {
      return vscode.workspace.onDidChangeWorkspaceFolders(
        listener,
        thisArgs,
        disposables,
      );
    },
    fs: {
      stat: async (path: string): Promise<FileStat> => {
        const stat = await vscode.workspace.fs.stat(vscode.Uri.file(path));
        return {
          type: stat.type as unknown as FileType,
          ctime: stat.ctime,
          mtime: stat.mtime,
          size: stat.size,
        };
      },
      readDirectory: async (path: string): Promise<[string, FileType][]> => {
        const results = await vscode.workspace.fs.readDirectory(
          vscode.Uri.file(path),
        );
        return results.map(([name, type]) => [
          name,
          type as unknown as FileType,
        ]);
      },
      readFile: async (path: string): Promise<Uint8Array> => {
        return vscode.workspace.fs.readFile(vscode.Uri.file(path));
      },
      writeFile: async (path: string, content: Uint8Array): Promise<void> => {
        return vscode.workspace.fs.writeFile(vscode.Uri.file(path), content);
      },
      createDirectory: async (path: string): Promise<void> => {
        return vscode.workspace.fs.createDirectory(vscode.Uri.file(path));
      },
      delete: async (
        path: string,
        options?: { recursive?: boolean; useTrash?: boolean },
      ): Promise<void> => {
        return vscode.workspace.fs.delete(vscode.Uri.file(path), options);
      },
      appendFile: async (path: string, content: Uint8Array): Promise<void> => {
        const uri = vscode.Uri.file(path);
        try {
          const existing = await vscode.workspace.fs.readFile(uri);
          const newContent = new Uint8Array(existing.length + content.length);
          newContent.set(existing);
          newContent.set(content, existing.length);
          await vscode.workspace.fs.writeFile(uri, newContent);
        } catch (error) {
          // File likely doesn't exist, create it
          await vscode.workspace.fs.writeFile(uri, content);
        }
      },
    },
  };

  languages = {
    getDiagnostics: async (resource?: string) => {
      if (resource) {
        const uri = vscode.Uri.file(resource);
        return vscode.languages.getDiagnostics(uri).map((d) => ({
          uri: { fsPath: uri.fsPath },
          range: d.range,
          message: d.message,
          severity: d.severity,
        }));
      }
      return vscode.languages.getDiagnostics().flatMap(([uri, diagnostics]) =>
        diagnostics.map((d) => ({
          uri: { fsPath: uri.fsPath },
          range: d.range,
          message: d.message,
          severity: d.severity,
        })),
      );
    },
  };

  secrets = {
    get: async (key: string) => {
      return this.context?.secrets.get(key);
    },
    store: async (key: string, value: string) => {
      await this.context?.secrets.store(key, value);
    },
    delete: async (key: string) => {
      await this.context?.secrets.delete(key);
    },
    onDidChange: (
      listener: (e: any) => any,
      thisArgs?: any,
      disposables?: IDisposable[],
    ) => {
      if (this.context) {
        return this.context.secrets.onDidChange(
          listener,
          thisArgs,
          disposables,
        );
      }
      return {
        dispose: () => {
          /* no-op */
        },
      };
    },
  };

  tasks = {
    createShellTask: (name: string, command: string) => {
      const task = new vscode.Task(
        { type: "shell" },
        vscode.TaskScope.Workspace,
        name,
        "CodeBuddy",
        new vscode.ShellExecution(command),
      );
      return task as unknown as ITask;
    },
    executeTask: async (task: any) => {
      const execution = await vscode.tasks.executeTask(task);
      return execution as unknown as ITaskExecution;
    },
  };

  authentication = {
    getSession: async (
      providerId: string,
      scopes: readonly string[],
      options?: { createIfNone?: boolean; clearSessionPreference?: boolean },
    ) => {
      const session = await vscode.authentication.getSession(
        providerId,
        scopes,
        options,
      );
      if (session) {
        return {
          id: session.id,
          accessToken: session.accessToken,
          account: {
            label: session.account.label,
            id: session.account.id,
          },
          scopes: session.scopes,
        };
      }
      return undefined;
    },
    onDidChangeSessions: (
      listener: (e: any) => any,
      thisArgs?: any,
      disposables?: IDisposable[],
    ) => {
      return vscode.authentication.onDidChangeSessions(
        listener,
        thisArgs,
        disposables,
      );
    },
  };

  private context?: vscode.ExtensionContext;

  constructor(context?: vscode.ExtensionContext) {
    this.context = context;
    const rootDir =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ||
      context?.extensionPath ||
      process.cwd();
    this.fs = new NodeFilesystemBackend({
      rootDir,
      ripgrepExec: rgPath,
    });
  }
}

class VSCodeWorkspaceConfiguration implements IWorkspaceConfiguration {
  constructor(private config: vscode.WorkspaceConfiguration) {}

  get<T>(section: string, defaultValue?: T): T {
    if (defaultValue !== undefined) {
      return this.config.get<T>(section, defaultValue);
    }
    return this.config.get<T>(section) as T;
  }

  has(section: string): boolean {
    return this.config.has(section);
  }

  async update(
    section: string,
    value: any,
    target?: ConfigurationTarget | boolean | null,
  ): Promise<void> {
    let vscodeTarget: vscode.ConfigurationTarget | boolean | undefined | null;
    if (target === ConfigurationTarget.Global) {
      vscodeTarget = vscode.ConfigurationTarget.Global;
    } else if (target === ConfigurationTarget.Workspace) {
      vscodeTarget = vscode.ConfigurationTarget.Workspace;
    } else if (target === ConfigurationTarget.WorkspaceFolder) {
      vscodeTarget = vscode.ConfigurationTarget.WorkspaceFolder;
    } else {
      vscodeTarget = target as boolean | undefined | null;
    }
    return this.config.update(section, value, vscodeTarget);
  }
}

class VSCodeOutputChannel implements IOutputChannel {
  constructor(private channel: vscode.OutputChannel) {}
  append(value: string) {
    this.channel.append(value);
  }
  appendLine(value: string) {
    this.channel.appendLine(value);
  }
  clear() {
    this.channel.clear();
  }
  show(preserveFocus?: boolean) {
    this.channel.show(preserveFocus);
  }
  hide() {
    this.channel.hide();
  }
  dispose() {
    this.channel.dispose();
  }
  get name() {
    return this.channel.name;
  }
}

class VSCodeStatusBarItem implements IStatusBarItem {
  constructor(private item: vscode.StatusBarItem) {}

  get alignment() {
    return this.item.alignment === vscode.StatusBarAlignment.Left
      ? StatusBarAlignment.Left
      : StatusBarAlignment.Right;
  }
  get priority() {
    return this.item.priority;
  }
  get text() {
    return this.item.text;
  }
  set text(value: string) {
    this.item.text = value;
  }
  get tooltip() {
    return this.item.tooltip;
  }
  set tooltip(value: string | any) {
    this.item.tooltip = value;
  }
  get color() {
    return this.item.color;
  }
  set color(value: string | any) {
    this.item.color = value;
  }
  get backgroundColor() {
    return this.item.backgroundColor;
  }
  set backgroundColor(value: any) {
    this.item.backgroundColor = value;
  }
  get command() {
    return this.item.command;
  }
  set command(value: string | any) {
    this.item.command = value;
  }

  show() {
    this.item.show();
  }
  hide() {
    this.item.hide();
  }
  dispose() {
    this.item.dispose();
  }
}

class VSCodeTerminal implements ITerminal {
  name: string;
  private _terminal: vscode.Terminal;

  constructor(terminal: vscode.Terminal) {
    this.name = terminal.name;
    this._terminal = terminal;
  }

  show(preserveFocus?: boolean) {
    this._terminal.show(preserveFocus);
  }

  sendText(text: string, addNewLine?: boolean) {
    this._terminal.sendText(text, addNewLine);
  }
}

class VSCodeTerminalRegistry {
  private static terminals = new Map<string, VSCodeTerminal>();

  static register(id: string, term: VSCodeTerminal) {
    this.terminals.set(id, term);
  }

  static unregister(id: string) {
    this.terminals.delete(id);
  }

  static get(id: string) {
    return this.terminals.get(id);
  }
}

import { BackendProtocol } from "deepagents";
import { IDisposable } from "./disposable";
import { IOutputChannel } from "./output-channel";
import { IEventEmitter, IEvent } from "./events";
import { IProgress } from "./progress";

export { IOutputChannel, IDisposable };

export interface IConfigurationChangeEvent {
  affectsConfiguration(section: string): boolean;
}

export interface ISecretStorageChangeEvent {
  key: string;
}

export interface ISecretStorage {
  get(key: string): Promise<string | undefined>;
  store(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  onDidChange: IEvent<ISecretStorageChangeEvent>;
}

export enum FileType {
  Unknown = 0,
  File = 1,
  Directory = 2,
  SymbolicLink = 64,
}

export interface IPosition {
  line: number;
  character: number;
}

export interface IRange {
  start: IPosition;
  end: IPosition;
}

export interface ISelection {
  start: IPosition;
  end: IPosition;
  active: IPosition;
  isEmpty: boolean;
}

export enum SymbolKind {
  File = 0,
  Module = 1,
  Namespace = 2,
  Package = 3,
  Class = 4,
  Method = 5,
  Property = 6,
  Field = 7,
  Constructor = 8,
  Enum = 9,
  Interface = 10,
  Function = 11,
  Variable = 12,
  Constant = 13,
  String = 14,
  Number = 15,
  Boolean = 16,
  Array = 17,
  Object = 18,
  Key = 19,
  Null = 20,
  EnumMember = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25,
}

export interface SymbolInformation {
  name: string;
  containerName: string;
  kind: SymbolKind;
  location: {
    uri: { fsPath: string };
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
  };
}

export interface FileStat {
  type: FileType;
  ctime: number;
  mtime: number;
  size: number;
}

export interface ITextDocument {
  uri: { fsPath: string };
  fileName: string;
  isDirty: boolean;
  getText(range?: ISelection): string;
  offsetAt(position: { line: number; character: number }): number;
  languageId: string;
}

export interface ITextEditorEdit {
  replace(range: IRange | ISelection, value: string): void;
  insert(position: IPosition, value: string): void;
  delete(range: IRange | ISelection): void;
}

export interface ITextEditor {
  document: ITextDocument;
  selection: ISelection;
  edit(
    callback: (editBuilder: ITextEditorEdit) => void,
    options?: { undoStopBefore: boolean; undoStopAfter: boolean },
  ): Promise<boolean>;
}

export interface IQuickPickItem {
  label: string;
  description?: string;
  detail?: string;
  picked?: boolean;
  alwaysShow?: boolean;
  [key: string]: any; // Allow custom properties
}

export interface IInputBoxOptions {
  value?: string;
  valueSelection?: [number, number];
  placeHolder?: string;
  password?: boolean;
  ignoreFocusOut?: boolean;
  prompt?: string;
  validateInput?: (
    value: string,
  ) => string | undefined | null | Promise<string | undefined | null>;
}

export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

export enum ProgressLocation {
  SourceControl = 1,
  Window = 10,
  Notification = 15,
}

export interface IStatusBarItem extends IDisposable {
  alignment: StatusBarAlignment;
  priority?: number;
  text: string;
  tooltip?: string | any;
  color?: string | any;
  backgroundColor?: any;
  command?: string | any;
  show(): void;
  hide(): void;
}

export interface IWebviewOptions {
  enableScripts?: boolean;
  localResourceRoots?: string[]; // strings instead of Uris
  retainContextWhenHidden?: boolean;
}

export interface IWebview {
  options: IWebviewOptions;
  html: string;
  onDidReceiveMessage: IEvent<any>;
  postMessage(message: any): Thenable<boolean>;
  asWebviewUri(localResource: string): string; // Abstracting asWebviewUri
  cspSource: string;
}

export interface IWebviewView {
  readonly viewType: string;
  readonly webview: IWebview;
  readonly onDidChangeVisibility: IEvent<void>;
  readonly visible: boolean;
  title?: string;
  description?: string;
  badge?: { tooltip: string; value: number };
  show?(preserveFocus?: boolean): void;
}

export interface IWebviewViewResolveContext {
  [key: string]: any;
}

export interface IWebviewViewProvider {
  resolveWebviewView(
    webviewView: IWebviewView,
    context: IWebviewViewResolveContext,
    token: any, // CancellationToken
  ): void | Thenable<void>;
}

export interface IExtensionContext {
  subscriptions: { dispose(): any }[];
  extensionPath: string;
  extensionUri?: any; // Keep generic for now if needed, but prefer string path
  globalStorageUri: { fsPath: string };
  globalState: {
    get<T>(key: string): T | undefined;
    update(key: string, value: any): Thenable<void>;
  };
  workspaceState: {
    get<T>(key: string): T | undefined;
    update(key: string, value: any): Thenable<void>;
  };
  secrets: ISecretStorage;
}

/**
 * Interface for Editor/Host interactions.
 * Abstracts the environment (VS Code, Headless Server, CLI) from the Agent logic.
 */
export interface IEditorHost {
  /**
   * File System access (using deepagents BackendProtocol)
   */
  fs: BackendProtocol;

  workspace: {
    rootPath: string | undefined;
    workspaceFolders:
      | Array<{ uri: { fsPath: string }; name: string; index: number }>
      | undefined;
    textDocuments: ITextDocument[];
    openTextDocument(
      optionsOrFileName?: string | { language?: string; content?: string },
    ): Promise<ITextDocument>;
    findFiles(
      include: string,
      exclude?: string,
      maxResults?: number,
      token?: ICancellationToken,
    ): Promise<string[]>;
    getConfiguration(section?: string): IWorkspaceConfiguration;
    onDidChangeConfiguration: IEvent<IConfigurationChangeEvent>;

    findTextInFiles(
      query: { pattern: string; isRegExp?: boolean },
      options: { include?: string; exclude?: string },
      callback: (result: {
        uri: { fsPath: string };
        preview: { text: string };
        ranges: { start: { line: number } }[];
      }) => void,
    ): Promise<void>;

    fs: {
      stat(path: string): Promise<FileStat>;
      readDirectory(path: string): Promise<[string, FileType][]>;
      readFile(path: string): Promise<Uint8Array>;
      writeFile(path: string, content: Uint8Array): Promise<void>;
      createDirectory(path: string): Promise<void>;
      delete(
        path: string,
        options?: { recursive?: boolean; useTrash?: boolean },
      ): Promise<void>;
      appendFile(path: string, content: Uint8Array): Promise<void>;
    };

    onDidChangeWorkspaceFolders: IEvent<any>;
    asRelativePath(pathOrUri: string | { fsPath: string }): string;
    createFileSystemWatcher(pattern: string): any;
  };

  /**
   * Window / UI interactions
   */
  window: {
    activeTextEditor: ITextEditor | undefined;
    activeTerminal: ITerminal | undefined;
    showInformationMessage(
      message: string,
      ...items: string[]
    ): Promise<string | undefined>;
    showErrorMessage(
      message: string,
      ...items: string[]
    ): Promise<string | undefined>;
    showWarningMessage(
      message: string,
      ...items: any[]
    ): Promise<string | undefined>;
    showInputBox(options?: IInputBoxOptions): Promise<string | undefined>;
    showQuickPick(
      items: string[] | IQuickPickItem[],
      options?: { placeHolder?: string; title?: string; canPickMany?: boolean },
    ): Promise<string | IQuickPickItem | undefined>;
    showOpenDialog(options?: {
      canSelectFiles?: boolean;
      canSelectFolders?: boolean;
      canSelectMany?: boolean;
      filters?: { [name: string]: string[] };
      title?: string;
      openLabel?: string;
    }): Promise<string[] | undefined>;
    withProgress<R>(
      options: { location: any; title: string; cancellable?: boolean },
      task: (progress: any, token: any) => Promise<R>,
    ): Promise<R>;
    createTerminal(
      nameOrOptions?:
        | string
        | { name?: string; shellPath?: string; shellArgs?: string[] },
    ): ITerminal;
    createOutputChannel(name: string): IOutputChannel;
    showTextDocument(
      document: ITextDocument | string,
      column?: number,
      preserveFocus?: boolean,
    ): Promise<ITextEditor>;
    createStatusBarItem(
      alignment?: StatusBarAlignment,
      priority?: number,
    ): IStatusBarItem;
    onDidChangeActiveTextEditor: IEvent<ITextEditor | undefined>;
    registerWebviewViewProvider(
      viewId: string,
      provider: IWebviewViewProvider,
      options?: { webviewOptions: { retainContextWhenHidden: boolean } },
    ): IDisposable;
  };

  env: {
    openExternal(uri: any): Promise<boolean>;
  };

  /**
   * Command execution
   */
  commands: {
    executeCommand(command: string, ...rest: any[]): Promise<any>;
  };

  /**
   * Language features
   */
  languages: {
    getDiagnostics(resource?: string): Promise<
      Array<{
        uri: { fsPath: string };
        range: {
          start: { line: number; character: number };
          end: { line: number; character: number };
        };
        message: string;
        severity: 0 | 1 | 2 | 3; // Error=0, Warning=1, Info=2, Hint=3
      }>
    >;
  };

  /**
   * Secret Storage
   */
  secrets: ISecretStorage;

  createEventEmitter<T>(): IEventEmitter<T>;

  createThemeColor(id: string): any;

  /**
   * URI utilities
   */
  uri: {
    file(path: string): any;
    parse(value: string, strict?: boolean): any;
    joinPath(base: any, ...pathSegments: string[]): any;
  };

  /**
   * Task management
   */
  tasks: {
    createShellTask(name: string, command: string): ITask;
    executeTask(task: ITask): Promise<ITaskExecution>;
  };

  /**
   * Authentication
   */
  authentication: {
    getSession(
      providerId: string,
      scopes: readonly string[],
      options?: { createIfNone?: boolean; clearSessionPreference?: boolean },
    ): Promise<IAuthenticationSession | undefined>;
    onDidChangeSessions: IEvent<IAuthenticationSessionsChangeEvent>;
  };
}

export interface IAuthenticationSession {
  id: string;
  accessToken: string;
  account: {
    label: string;
    id: string;
  };
  scopes: readonly string[];
}

export interface IAuthenticationSessionsChangeEvent {
  provider: {
    id: string;
    label: string;
  };
}

export interface ICancellationToken {
  isCancellationRequested: boolean;
  onCancellationRequested: IEvent<any>;
}

export enum InlineCompletionTriggerKind {
  Invoke = 0,
  Automatic = 1,
}

export interface IInlineCompletionContext {
  triggerKind: InlineCompletionTriggerKind;
  selectedCompletionInfo?: {
    range: IRange;
    text: string;
  };
}

export interface IInlineCompletionItem {
  insertText: string;
  filterText?: string;
  range?: IRange;
  command?: { title: string; command: string; arguments?: any[] };
}

export interface IInlineCompletionList {
  items: IInlineCompletionItem[];
}

export interface IInlineCompletionItemProvider {
  provideInlineCompletionItems(
    document: ITextDocument,
    position: IPosition,
    context: IInlineCompletionContext,
    token: ICancellationToken,
  ): Promise<
    IInlineCompletionItem[] | IInlineCompletionList | null | undefined
  >;
}

export enum ConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3,
}

export interface IWorkspaceConfiguration {
  get<T>(section: string): T | undefined;
  get<T>(section: string, defaultValue: T): T;
  has(section: string): boolean;
  update(
    section: string,
    value: any,
    target?: ConfigurationTarget | boolean | null,
  ): Promise<void>;
}

/**
 * Abstract Terminal interface
 */
export interface ITerminal {
  name: string;
  show(preserveFocus?: boolean): void;
  sendText(text: string, addNewLine?: boolean): void;
}

export interface ITaskExecution {
  terminate(): void;
}

export interface ITask {
  name: string;
  isBackground: boolean;
  presentationOptions: {
    reveal: number; // TaskRevealKind
    panel: number; // TaskPanelKind
    echo: boolean;
    showReuseMessage: boolean;
    clear: boolean;
  };
}

export enum TaskRevealKind {
  Always = 1,
  Silent = 2,
  Never = 3,
}

export enum TaskPanelKind {
  Shared = 1,
  Dedicated = 2,
  New = 3,
}

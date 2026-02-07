import { IEditorHost, FileType, SymbolKind } from "../../interfaces/editor-host";
import { EditorHostService } from "../../services/editor-host.service";
import { BackendProtocol } from "deepagents";

export function setupMockEditorHost() {
    const mockHost: IEditorHost = {
        fs: {} as BackendProtocol, // Simplified for now
        workspace: {
            rootPath: '/test/workspace',
            workspaceFolders: [{ uri: { fsPath: '/test/workspace' }, name: 'workspace', index: 0 }],
            textDocuments: [],
            openTextDocument: async () => ({
                uri: { fsPath: '/test/file.ts', path: '/test/file.ts', scheme: 'file', toString: () => '/test/file.ts' },
                fileName: '/test/file.ts',
                languageId: 'typescript',
                version: 1,
                lineCount: 1,
                getText: () => '',
                positionAt: () => ({ line: 0, character: 0 }),
                offsetAt: () => 0,
            }),
            findFiles: async () => [],
            getConfiguration: () => ({
                get: (key: string, def?: any) => def,
                update: async () => {},
                has: () => false,
                inspect: () => undefined,
            }),
            onDidChangeConfiguration: () => ({ dispose: () => {} }),
            findTextInFiles: async () => {},
            fs: {
                stat: async () => ({ type: FileType.File, ctime: 0, mtime: 0, size: 0 }),
                readDirectory: async () => [],
                readFile: async () => new Uint8Array(),
                writeFile: async () => {},
                createDirectory: async () => {},
                delete: async () => {},
                appendFile: async () => {},
            },
            onDidChangeWorkspaceFolders: () => ({ dispose: () => {} }),
            asRelativePath: (path: string) => path,
            createFileSystemWatcher: () => ({
                onDidChange: () => ({ dispose: () => {} }),
                onDidCreate: () => ({ dispose: () => {} }),
                onDidDelete: () => ({ dispose: () => {} }),
                dispose: () => {},
            }),
        },
        window: {
            activeTextEditor: undefined,
            activeTerminal: undefined,
            showInformationMessage: async () => undefined,
            showErrorMessage: async () => undefined,
            showWarningMessage: async () => undefined,
            showInputBox: async () => undefined,
            showQuickPick: async () => undefined,
            showOpenDialog: async () => undefined,
            createOutputChannel: () => ({
                name: 'mock',
                append: () => {},
                appendLine: () => {},
                clear: () => {},
                show: () => {},
                hide: () => {},
                dispose: () => {},
                replace: () => {},
            }),
            withProgress: async (options: any, task: any) => task({ report: () => {} }, {}),
            showTextDocument: async () => {},
            setStatusBarMessage: () => ({ dispose: () => {} }),
            createStatusBarItem: () => ({
                text: '',
                tooltip: '',
                command: '',
                show: () => {},
                hide: () => {},
                dispose: () => {},
            }),
            visibleTextEditors: [],
            onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
            createTextEditorDecorationType: () => ({ dispose: () => {} }),
            createTerminal: () => ({
                name: 'mock',
                processId: Promise.resolve(1),
                creationOptions: {},
                exitStatus: undefined,
                state: { isInteractedWith: false },
                sendText: () => {},
                show: () => {},
                hide: () => {},
                dispose: () => {},
            }),
            onDidCloseTerminal: () => ({ dispose: () => {} }),
        },
        secrets: {
            store: async () => {},
            get: async () => undefined,
            delete: async () => {},
            onDidChange: () => ({ dispose: () => {} }),
        },
        createEventEmitter: () => ({
            event: () => ({ dispose: () => {} }),
            fire: () => {},
            dispose: () => {},
        }),
        createThemeColor: (id: string) => ({ id }),
        uri: {
            file: (path: string) => ({ fsPath: path, path, scheme: 'file', toString: () => path }),
            parse: (path: string) => ({ fsPath: path, path, scheme: 'file', toString: () => path }),
            joinPath: (base: any, ...segments: string[]) => ({ fsPath: base.fsPath + '/' + segments.join('/'), path: base.fsPath + '/' + segments.join('/'), scheme: 'file', toString: () => base.fsPath + '/' + segments.join('/') }),
        },
        tasks: {
            createShellTask: () => ({}),
            executeTask: async () => ({}),
        },
    } as unknown as IEditorHost;

    EditorHostService.getInstance().initialize(mockHost);
}

import * as vscode from "vscode";
import { Logger } from "../infrastructure/logger/logger";
import { LogLevel } from "./telemetry";
import { Orchestrator } from "../agents/orchestrator";

export class FileWatcherService implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  protected logger: Logger;
  protected readonly orchestrator: Orchestrator;

  constructor() {
    this.orchestrator = Orchestrator.getInstance();
    this.logger = Logger.initialize(FileWatcherService.name, {
      minLevel: LogLevel.DEBUG,
    });
    this.registerDisposables();
  }

  registerDisposables() {
    this.disposables.push(
      // vscode.workspace.onDidChangeTextDocument(
      //   this.handleTextChangeEvent.bind(this)
      // ),
      vscode.workspace.onDidCreateFiles(this.handleFileCreatedEvent.bind(this)),
      vscode.workspace.onDidSaveTextDocument(
        this.handleSaveTextEvent.bind(this)
      ),
      vscode.workspace.onDidSaveTextDocument((e: vscode.TextDocument) => {
        this.handleSaveTextEvent.bind(this);
      }),
      vscode.workspace.onDidRenameFiles(this.handleFileRenamedEvent.bind(this)),
      vscode.workspace.onDidDeleteFiles(this.handleFileDeletedEvent.bind(this)) // Add this line
    );
  }

  handleFileDeletedEvent(e: vscode.FileDeleteEvent) {
    e.files.forEach((file) => {
      this.logger.debug(`File deleted: ${file.fsPath}`);
      this.orchestrator.publish("onFileDeleted", JSON.stringify(file.fsPath));
    });
  }

  handleFileRenamedEvent(e: vscode.FileRenameEvent) {
    e.files.forEach((file) => {
      this.logger.debug(
        `File renamed from ${file.oldUri.fsPath} to ${file.newUri.fsPath}`
      );
      this.orchestrator.publish(
        "onFileRenamed",
        JSON.stringify({
          oldUri: file.oldUri.fsPath,
          newUri: file.newUri.fsPath,
        })
      );
    });
  }

  handleFileCreatedEvent(e: vscode.FileCreateEvent) {
    this.logger.debug(`New file created: ${e.files}`);
    this.orchestrator.publish("onFileCreated", JSON.stringify(e.files));
  }

  // handleTextChangeEvent(e: vscode.TextDocumentChangeEvent) {
  //   this.logger.debug(`File changed: ${e.document.uri.fsPath}`);
  //   this.orchestrator.publish(
  //     "onTextChange",
  //     JSON.stringify(e.document.uri.fsPath)
  //   );
  // }

  handleSaveTextEvent(e: vscode.TextDocument) {
    this.logger.debug(`File saved: ${e.uri.fsPath}`);
    this.orchestrator.publish("OnSaveText", JSON.stringify(e.uri.fsPath));
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}

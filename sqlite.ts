import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as sqlite3 from "sqlite3";
import { OpenAIEmbeddings } from "@langchain/openai";
import { VectorStore } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";

interface CodeDocument extends Document {
  metadata: {
    source: string;
    language: string;
    [key: string]: any;
  };
}

class CodeBuddyVectorStore {
  private userId: string;
  private dbPath: string;
  private embeddings: OpenAIEmbeddings;
  private db: sqlite3.Database;

  constructor(userId: string, context: vscode.ExtensionContext) {
    this.userId = userId;

    // Create user-specific database path
    this.dbPath = path.join(
      context.globalStorageUri.fsPath,
      `vectorstore_${this.userId}.sqlite`
    );

    // Ensure storage directory exists
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });

    // Initialize database
    this.db = new sqlite3.Database(this.dbPath);

    // Initialize embeddings
    this.embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Setup initial database schema
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.run(`
            CREATE TABLE IF NOT EXISTS vector_store (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                embedding BLOB NOT NULL,
                metadata TEXT NOT NULL
            )
        `);
  }

  async addDocument(document: CodeDocument): Promise<void> {
    const embedding = await this.embeddings.embedDocuments([
      document.pageContent,
    ]);

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
                INSERT INTO vector_store (content, embedding, metadata) 
                VALUES (?, ?, ?)
            `);

      stmt.run(
        document.pageContent,
        JSON.stringify(embedding[0]),
        JSON.stringify(document.metadata),
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
      stmt.finalize();
    });
  }

  async similaritySearch(
    query: string,
    k: number = 5
  ): Promise<CodeDocument[]> {
    const queryEmbedding = await this.embeddings.embedQuery(query);

    return new Promise((resolve, reject) => {
      this.db.all(
        `
                SELECT content, metadata 
                FROM vector_store 
                ORDER BY (
                    SELECT dot_product(embedding, ?)
                ) DESC 
                LIMIT ?
            `,
        [JSON.stringify(queryEmbedding), k],
        (err, rows) => {
          if (err) reject(err);
          else {
            const results = rows.map((row) => ({
              pageContent: row.content,
              metadata: JSON.parse(row.metadata),
            }));
            resolve(results as CodeDocument[]);
          }
        }
      );
    });
  }

  close(): void {
    this.db.close();
  }
}

export class CodeBuddyExtension {
  private context: vscode.ExtensionContext;
  private vectorStore: CodeBuddyVectorStore;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;

    // Generate or retrieve user ID
    const userId = this.getUserId();

    // Initialize vector store
    this.vectorStore = new CodeBuddyVectorStore(userId, context);

    this.registerCommands();
  }

  private getUserId(): string {
    let userId = this.context.globalState.get<string>("userId");

    if (!userId) {
      userId = this.generateUniqueId();
      this.context.globalState.update("userId", userId);
    }

    return userId;
  }

  private generateUniqueId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private registerCommands(): void {
    // Command to ingest current file
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        "codebuddy.ingestCurrentFile",
        async () => {
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            const document = editor.document;

            try {
              await this.vectorStore.addDocument({
                pageContent: document.getText(),
                metadata: {
                  source: document.fileName,
                  language: document.languageId,
                  timestamp: new Date().toISOString(),
                },
              });

              vscode.window.showInformationMessage(
                "File ingested successfully"
              );
            } catch (error) {
              vscode.window.showErrorMessage(`Ingest failed: ${error}`);
            }
          }
        }
      )
    );

    // Command to perform similarity search
    this.context.subscriptions.push(
      vscode.commands.registerCommand("codebuddy.searchDocuments", async () => {
        const query = await vscode.window.showInputBox({
          prompt: "Enter search query",
        });

        if (query) {
          try {
            const results = await this.vectorStore.similaritySearch(query);

            // Display results in a new text document
            const resultsDoc = await vscode.workspace.openTextDocument({
              content: results
                .map(
                  (r) =>
                    `Source: ${r.metadata.source}\n` +
                    `Language: ${r.metadata.language}\n` +
                    `Content Preview: ${r.pageContent.substring(0, 200)}...\n\n`
                )
                .join("---\n"),
              language: "markdown",
            });

            await vscode.window.showTextDocument(resultsDoc);
          } catch (error) {
            vscode.window.showErrorMessage(`Search failed: ${error}`);
          }
        }
      })
    );
  }

  dispose(): void {
    this.vectorStore.close();
  }
}

export function activate(context: vscode.ExtensionContext) {
  const codeBuddyExtension = new CodeBuddyExtension(context);
  context.subscriptions.push(codeBuddyExtension);
}

export function deactivate() {
  // Cleanup logic if needed
}

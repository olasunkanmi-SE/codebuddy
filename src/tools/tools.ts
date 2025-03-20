import { SchemaType } from "@google/generative-ai";
import { ContextRetriever } from "../services/context-retriever";
import { IFileToolConfig } from "../application/interfaces/agent.interface";

class SearchTool {
  constructor(private readonly contextRetriever?: ContextRetriever) {}

  public async execute(query: string) {
    return await this.contextRetriever?.retrieveContext(query);
  }

  config() {
    return {
      name: "search_vector_db",
      description:
        "Perform a similarity search in the vector database based on user input",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description:
              "The user input to search for similar items in the vector database",
          },
        },
        example: ["How was authentication implemented within this codebase"],
        required: ["query"],
      },
    };
  }
}

export class WebTool {
  constructor(private readonly contextRetriever?: ContextRetriever) {}

  public async execute(query: string) {
    return await this.contextRetriever?.webSearch(query);
  }

  config() {
    return {
      name: "web_search",
      description:
        "Search the web for additional information and extract relevant content",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description:
              "The search query to find relevant information on the web",
          },
        },
        example: [
          "What is the general guideline on handling user session in software development",
        ],
        required: ["query"],
      },
    };
  }
}

export class FileTool {
  constructor(private readonly contextRetriever?: ContextRetriever) {}

  public async execute(fileConfigs: IFileToolConfig[]) {
    return await this.contextRetriever?.readFiles(fileConfigs);
  }
  config() {
    return {
      name: "analyze_files_for_question",
      description:
        "Analyze the contents of specified files to determine which best answers a given question",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          files: {
            type: SchemaType.ARRAY,
            description: SchemaType.STRING,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                class_name: {
                  type: SchemaType.STRING,
                  description:
                    "The class containing the function that may be responsible for the user query.",
                },
                function_name: {
                  type: SchemaType.STRING,
                  description:
                    "The function that may be responsible for the user query",
                },
                file_path: {
                  type: SchemaType.STRING,
                  description:
                    "The file path to the class that contains the function,",
                },
              },
              required: ["class_name", "function_name", "file_path"],
            },
          },
        },
        required: ["files"],
      },
    };
  }
}

export const TOOL_CONFIGS = {
  SearchTool: { tool: SearchTool, useContextRetriever: true },
  FileTool: { tool: FileTool, useContextRetriever: true },
  WebTool: { tool: WebTool, useContextRetriever: true },
};

import { SchemaType } from "@google/generative-ai";
import { IFileToolConfig } from "../application/interfaces/agent.interface";
import { ContextRetriever } from "../services/context-retriever";

// class SearchTool {
//   constructor(private readonly contextRetriever?: ContextRetriever) {}

//   public async execute(query: string) {
//     return await this.contextRetriever?.retrieveContext(query);
//   }

//   config() {
//     return {
//       name: "search_vector_db",
//       description:
//         "Search the codebase knowledge base for information related to the user's query. Use this to find code snippets, architectural decisions, or existing solutions within the project.",
//       parameters: {
//         type: SchemaType.OBJECT,
//         properties: {
//           query: {
//             type: SchemaType.STRING,
//             description:
//               "The user's question or topic to search for in the codebase knowledge base.",
//           },
//         },
//         example: ["How is user authentication handled in this project?"],
//         required: ["query"],
//       },
//     };
//   }
// }

export class WebTool {
  constructor(private readonly contextRetriever?: ContextRetriever) {}

  public async execute(query: string) {
    return await this.contextRetriever?.webSearch(query);
  }

  config() {
    return {
      name: "web_search",
      description:
        "Search the internet for general programming knowledge, best practices, or solutions to common coding problems. Useful for understanding concepts, exploring different approaches, or finding external libraries.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          query: {
            type: SchemaType.STRING,
            description:
              "The search query to use when searching the web for relevant information.",
          },
        },
        example: [
          "Best practices for handling user sessions in web applications",
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
        "Analyze specific code files to understand their functionality and answer user questions related to the code. Use this tool when the user is asking about specific parts of the codebase or how certain features are implemented.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          files: {
            type: SchemaType.ARRAY,
            description: "An array of file configurations to analyze.",
            items: {
              type: SchemaType.OBJECT,
              properties: {
                class_name: {
                  type: SchemaType.STRING,
                  description:
                    "The class name within the file that is relevant to the user's query.",
                },
                function_name: {
                  type: SchemaType.STRING,
                  description:
                    "The function name within the file that is relevant to the user's query.",
                },
                file_path: {
                  type: SchemaType.STRING,
                  description: "The path to the code file to be analyzed.",
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

// export class SynthesisTool {
//   public async execute(content: string) {
//     return content;
//   }
//   config() {
//     return {
//       name: "synthesize_web_data",
//       description:
//         "Use this tool for combining information from web searches into a concise answer.",
//       parameters: {
//         type: SchemaType.OBJECT,
//         properties: {
//           content: {
//             type: SchemaType.STRING,
//             description: "constains information from different web results",
//           },
//         },
//         required: ["content"],
//       },
//     };
//   }
// }

export class ThinkTool {
  public async execute(thought: string) {
    return thought[0];
  }

  config() {
    return {
      name: "think",
      description:
        "Use this tool to think through complex problems, analyze information, or plan multi-step solutions before taking action" +
        "This creates space for structured reasoning about code architecture, debugging approaches, " +
        "or implementation strategies. Use when analyzing tool outputs, making sequential decisions, " +
        "or following complex guidelines. This tool does not execute code or retrieve new information.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          thought: {
            type: SchemaType.STRING,
            description:
              "Describe your detailed analysis, thought process, reasoning steps, or plan of action.",
          },
        },
        required: ["thought"],
      },
    };
  }
}

export const TOOL_CONFIGS = {
  // SearchTool: { tool: SearchTool, useContextRetriever: true },
  FileTool: { tool: FileTool, useContextRetriever: true },
  WebTool: { tool: WebTool, useContextRetriever: true },
  ThinkTool: { tool: ThinkTool, useContextRetriever: true },
};

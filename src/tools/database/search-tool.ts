import { SchemaType } from "@google/generative-ai";
import { ContextRetriever } from "../../services/context-retriever";

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

export const TOOL_CONFIGS = {
  SearchTool: { tool: SearchTool, useContextRetriever: true },
};

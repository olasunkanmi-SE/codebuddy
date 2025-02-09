import { ContextRetriever } from "../../services/context-retriever";
import { CodeBuddyTool } from "../base";
import { SchemaType } from "@google/generative-ai";

class SearchTool extends CodeBuddyTool {
  constructor(
    private readonly contextRetriever?: Pick<
      ContextRetriever,
      "retrieveContext"
    >,
  ) {
    super({
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
    });
  }

  public async execute(query: string) {
    return await this.contextRetriever?.retrieveContext(query);
  }
}

export const TOOL_CONFIGS = {
  SearchTool: { tool: SearchTool, useContextRetriever: true },
};

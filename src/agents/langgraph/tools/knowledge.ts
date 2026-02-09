import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { KnowledgeTool } from "../../../tools/knowledge";

export class LangChainKnowledgeTool extends StructuredTool<any> {
  name = "manage_user_knowledge";
  description =
    "Access user knowledge profile, including topic proficiency and reading history. Use this to gauge what the user knows (technical topics) or check their recent learning activities. For general personal facts, use manage_core_memory instead.";

  schema = z.object({
    action: z
      .enum(["get_profile", "get_topic_details", "record_quiz_result"])
      .describe(
        "The action to perform: 'get_profile' for top topics, 'get_topic_details' for specific topics, 'record_quiz_result' to update proficiency after a quiz.",
      ),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Limit for profile results (default: 10)"),
    topics: z
      .array(z.string())
      .optional()
      .describe(
        "List of topics to query details for (required for get_topic_details)",
      ),
    topic: z
      .string()
      .optional()
      .describe("The topic quizzed on (required for record_quiz_result)"),
    is_correct: z
      .boolean()
      .optional()
      .describe(
        "Whether the user answered correctly (required for record_quiz_result)",
      ),
  });

  constructor(private tool: KnowledgeTool) {
    super();
  }

  async _call(args: {
    action: string;
    limit?: number;
    topics?: string[];
    topic?: string;
    is_correct?: boolean;
  }) {
    try {
      if (args.action === "get_profile") {
        const result = await this.tool.getProfile(args.limit);
        return JSON.stringify(result, null, 2);
      } else if (args.action === "get_topic_details") {
        if (!args.topics || args.topics.length === 0) {
          return "Please provide topics to query.";
        }
        const result = await this.tool.getTopicDetails(args.topics);
        return JSON.stringify(result, null, 2);
      } else if (args.action === "record_quiz_result") {
        if (!args.topic || args.is_correct === undefined) {
          return "Please provide 'topic' and 'is_correct' for record_quiz_result.";
        }
        const success = await this.tool.recordQuizResult(
          args.topic,
          args.is_correct,
        );
        if (!success) {
          return `Failed to record quiz result for topic '${args.topic}'. Database error.`;
        }
        return `Successfully recorded quiz result for topic '${args.topic}' (Correct: ${args.is_correct})`;
      }
      return "Invalid action.";
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

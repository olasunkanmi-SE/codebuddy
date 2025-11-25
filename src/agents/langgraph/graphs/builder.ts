// import { BaseMessage } from "@langchain/core/messages";
// import { Runnable } from "@langchain/core/runnables";
// import {
//   END,
//   MemorySaver,
//   MessagesAnnotation,
//   START,
//   StateGraph,
// } from "@langchain/langgraph";
// import { ToolNode } from "@langchain/langgraph/prebuilt";
// import { AGENT_NODES } from "../../interface/agent.interface";

// export interface IGraphBuilder {
//   build(
//     llmCall: (
//       state: typeof MessagesAnnotation.State,
//     ) => Promise<{ messages: BaseMessage[] }>,
//     shouldContinue: (state: typeof MessagesAnnotation.State) => string,
//     toolNode: ToolNode,
//   ): Runnable;
// }

// export class GraphBuilder implements IGraphBuilder {
//   build(
//     llmCall: (
//       state: typeof MessagesAnnotation.State,
//     ) => Promise<{ messages: BaseMessage[] }>,
//     shouldContinue: (state: typeof MessagesAnnotation.State) => string,
//     toolNode: ToolNode,
//   ): Runnable {
//     const checkpointer = new MemorySaver();

//     return new StateGraph(MessagesAnnotation)
//       .addNode(AGENT_NODES.LLM_CALL, llmCall)
//       .addNode(AGENT_NODES.TOOL_NODE, toolNode)
//       .addEdge(START, AGENT_NODES.LLM_CALL)
//       .addConditionalEdges(AGENT_NODES.LLM_CALL, shouldContinue, {
//         Action: AGENT_NODES.TOOL_NODE,
//         __end__: END,
//       })
//       .addEdge(AGENT_NODES.TOOL_NODE, AGENT_NODES.LLM_CALL)
//       .compile({ checkpointer });
//   }
// }

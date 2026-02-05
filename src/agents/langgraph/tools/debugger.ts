import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { DebuggerService } from "../../../services/debugger.service";

export class DebugGetStateTool extends StructuredTool {
  name = "debug_get_state";
  description = "Get the current debug session state, including threads.";
  schema = z.object({});

  async _call(_input: {}): Promise<string> {
    try {
      const service = DebuggerService.getInstance();
      const threads = await service.getThreads();
      return JSON.stringify({ threads });
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

export class DebugGetStackTraceTool extends StructuredTool {
  name = "debug_get_stack_trace";
  description = "Get the stack trace for a specific thread.";
  schema = z.object({
    threadId: z.number().describe("The ID of the thread to get stack trace for"),
    startFrame: z.number().optional().default(0),
    levels: z.number().optional().default(20),
  });

  async _call(input: { threadId: number; startFrame: number; levels: number }): Promise<string> {
    try {
      const service = DebuggerService.getInstance();
      const stackFrames = await service.getStackTrace(input.threadId, input.startFrame, input.levels);
      return JSON.stringify({ stackFrames });
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

export class DebugGetVariablesTool extends StructuredTool {
  name = "debug_get_variables";
  description = "Get variables for a specific stack frame. If frameId is not provided, tries to get variables for the top frame of the first thread (or active thread).";
  schema = z.object({
    frameId: z.number().optional().describe("The ID of the stack frame"),
    threadId: z.number().optional().describe("The ID of the thread (if frameId is not known, will use top frame)"),
  });

  async _call(input: { frameId?: number; threadId?: number }): Promise<string> {
    try {
      const service = DebuggerService.getInstance();
      let frameId = input.frameId;

      if (frameId === undefined) {
          // If no frameId, try to find one
          let threadId = input.threadId;
          if (threadId === undefined) {
             const threads = await service.getThreads();
             if (threads.length > 0) threadId = threads[0].id;
          }
          if (threadId !== undefined) {
              const stack = await service.getStackTrace(threadId, 0, 1);
              if (stack.length > 0) frameId = stack[0].id;
          }
      }

      if (frameId === undefined) {
          return "Error: Could not determine stack frame ID. Please provide frameId or threadId.";
      }

      const scopes = await service.getScopes(frameId);
      const variablesResult: any = {};
      
      for (const scope of scopes) {
          const vars = await service.getVariables(scope.variablesReference);
          variablesResult[scope.name] = vars;
      }

      return JSON.stringify(variablesResult);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

export class DebugEvaluateTool extends StructuredTool {
  name = "debug_evaluate";
  description = "Evaluate an expression in the context of a stack frame.";
  schema = z.object({
    expression: z.string().describe("The expression to evaluate"),
    frameId: z.number().optional().describe("The ID of the stack frame"),
  });

  async _call(input: { expression: string; frameId?: number }): Promise<string> {
    try {
      const service = DebuggerService.getInstance();
      const result = await service.evaluate(input.expression, input.frameId);
      return JSON.stringify(result);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

export class DebugControlTool extends StructuredTool {
  name = "debug_control";
  description = "Control the debugger execution (step, continue, pause).";
  schema = z.object({
    action: z.enum(["stepOver", "stepInto", "stepOut", "continue", "pause"]).describe("The action to perform"),
    threadId: z.number().describe("The ID of the thread to control"),
  });

  async _call(input: { action: "stepOver" | "stepInto" | "stepOut" | "continue" | "pause"; threadId: number }): Promise<string> {
    try {
      const service = DebuggerService.getInstance();
      switch (input.action) {
        case "stepOver": await service.stepOver(input.threadId); break;
        case "stepInto": await service.stepInto(input.threadId); break;
        case "stepOut": await service.stepOut(input.threadId); break;
        case "continue": await service.continue(input.threadId); break;
        case "pause": await service.pause(input.threadId); break;
      }
      return `Action ${input.action} executed on thread ${input.threadId}.`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

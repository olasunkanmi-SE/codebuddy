export interface AgentState {
  agentId: string;
  chatHistory: any[];
  planSteps: string[];
  currentStepIndex: number;
  initialThought: string;
  lastFunctionCalls: string[];
  createdAt: Date;
  updatedAt: Date;
  lastUserInput?: string;
  status: "idle" | "processing" | "error" | "completed";
  error?: string;
}

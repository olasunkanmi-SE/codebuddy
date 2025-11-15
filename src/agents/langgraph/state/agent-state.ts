import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

const stateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  planSteps: Annotation<string[]>,
  currentStepIndex: Annotation<number>,
  userQuery: Annotation<string>,
  errorCount: Annotation<number>,
  lastLLMResponseContent: Annotation<string>,
});

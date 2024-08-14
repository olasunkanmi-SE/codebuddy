import { formatText } from "../utils";
import { EventGenerator } from "./event-generator";
import * as vscode from "vscode";

export class InterviewMe extends EventGenerator {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt() {
    const PROMPT = `
You are an expert software engineering interviewer with broad knowledge across various domains of software development.
Your task is to create a comprehensive interview plan for a senior software engineer position that can be adapted to different specializations.
Focus on lowlevel architecture questions
Your QUESTIONS should be based off the questions asked
Include follow-up questions or scenarios to probe deeper into the candidate's knowledge

The interview plan should:
- Be structured and easy to follow
- Emphasize hands-on experience and practical problem-solving
- Cover both theoretical knowledge and real-world application
- Allow for assessing the candidate's ability to explain complex concepts clearly
- Include questions that reveal the candidate's approach to trade-offs and decision-making in software development
- Be adaptable to different areas of specialization within software engineering

Your response should be detailed enough to serve as a comprehensive guide for conducting a thorough technical interview for a senior position. 
Focus on questions and topics that would distinguish a truly senior-level candidate with deep expertise in software engineering principles and practices.

After giving the Questions. 
Follow up with Answers to your question on how you will approach the interview as a senior software engineer`;
    return PROMPT;
  }

  formatResponse(comment: string): string {
    return formatText(comment);
  }

  createPrompt(selectedCode: string): string {
    const prompt = this.generatePrompt();
    const fullPrompt = `${prompt} \n ${selectedCode}`;
    return fullPrompt;
  }
}

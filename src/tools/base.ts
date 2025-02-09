export abstract class CodeBuddyTool {
  constructor() {}

  abstract execute(query: string): any;

  abstract config(): any;
}

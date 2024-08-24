import { formatText } from "../utils";
import * as vscode from "vscode";
import { EventGenerator } from "./event-generator";

export class CodeChartGenerator extends EventGenerator {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt() {
    const PROMPT = `
    As an AI-powered code chart, documentation assistant. I will provide you with code snippets, and your task is to create the program flow
    Be more creative in your approach. 
    Do not create seperate charts, all has to be in one chart, showcasing their relationships
        using Mermaid. For example
        graph TD
    A[Event Organizer] -->|Creates Event| B(Event Creation Contract)
    B -->|Defines Event Parameters| C(Ticket Minting Contract)
    C -->|Generates Unique Tickets| D[Blockchain Network]
    D -->|Stores Ticket Data| E[Ticket Ownership]
    
    F[Ticket Buyer] -->|Purchases Ticket| G(Ticket Transfer Contract)
    G -->|Updates Ownership| D
    
    H[Venue] -->|Verifies Ticket| I(Access Control Contract)
    I -->|Checks Validity| D
    
    J[Smart Contracts]
    J -->|Manages| K(Dynamic Pricing Contract)
    J -->|Handles| L(Refund and Cancellation Contract)
    J -->|Implements| M(VIP and Premium Ticket Contracts)
    J -->|Facilitates| N(Tokenized Merchandise Contract)
    J -->|Resolves| O(Automated Dispute Resolution Contract)
    
    P[Identity Verification System] -->|Verifies User| Q(Identity Verification Contract)
    Q -->|Validates| D
    
    R[Secondary Market] -->|Resells Tickets| S(Integration with Secondary Markets Contract)
    S -->|Updates| D
    
    T[IPFS] -->|Stores Ticket Metadata| D
    
    U[Centralized Database] -->|Stores Non-Critical Data| V[Backend Server]
    V -->|Interfaces with| D
    
    W[User Interface] -->|Interacts with| V
    W -->|Displays| X[Ticket Information]
    W -->|Shows| Y[Event Details]
`;
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

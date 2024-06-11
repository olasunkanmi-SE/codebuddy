import { EventGenerator } from "./event-generator";
import * as vscode from "vscode";

export class Comments extends EventGenerator {
  selectedCode: string | undefined;
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt() {
    const CODE_LABEL = "Here is the code:";
    const COMMENT_LABEL = "Here is a good comment:";
    const PROMPT = `
        A good code review comment describes the intent behind the code without
        repeating information that's obvious from the code itself. Good comments
        describe "why", explain any "magic" values and non-obvious behaviour.
        Below are some examples of good code comments.
        Respond based on the programming language of the requested code. Unless stated otherwise.

        ${CODE_LABEL}
        async getRestaurantById(id: Types.ObjectId): Promise<Result<IRestaurantResponseDTO>> {
            await this.singleclientService.validateContext();
            const result = await this.restaurantRepository.findById(id);
            const restaurantId: Types.ObjectId = result.getValue().id;
            const restaurantWithSingleClientData: Restaurant = await this.restaurantRepository.getRestaurant(restaurantId);
            const context = this.contextService.getContext();
            const email = context.email;
            const userDoc = await this.singleclientRepository.findOne({ email });
            const user: SingleClient = userDoc.getValue();
            if (user.id.toString() !== restaurantWithSingleClientData.singleclient.id.toString()) {
            throwApplicationError(HttpStatus.UNAUTHORIZED, 'You dont have sufficient priviledge');
            }
            return Result.ok(
            RestaurantParser.createRestaurantResponse(restaurantWithSingleClientData),
            'Restaurant retrieved successfully',
            );
        }
        ${COMMENT_LABEL}
        <pre>
        <code>
        /**
         * Retrieves restaurant information by its ID asynchronously.
         * This function validates the user's context, by checking the user privileges 
         * Fetches the restaurant details.
         * @param id - The ID of the restaurant to retrieve
         * @returns A Promise that resolves to a Result object containing an IRestaurantResponseDTO object
         * @throws {ApplicationError} If the user does not have sufficient privileges
         */
        </code>
        </pre>
`;
    return PROMPT;
  }

  formatResponse(comment: string): string {
    return comment;
  }

  createPrompt(selectedCode: string): string {
    const prompt = this.generatePrompt();
    const fullPrompt = `${prompt} \n ${selectedCode}`;
    return fullPrompt;
  }
}

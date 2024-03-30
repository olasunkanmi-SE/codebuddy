import { EventGenerator } from "./event-generator";

export class Comments extends EventGenerator {
  selectedCode: string | undefined;
  constructor(action: string) {
    super(action);
  }

  generatePrompt() {
    const CODE_LABEL = "Here is the code:";
    const COMMENT_LABEL = "Here is a good comment:";
    const PROMPT = `
        A good code review comment describes the intent behind the code without
        repeating information that's obvious from the code itself. Good comments
        describe "why", explain any "magic" values and non-obvious behaviour.
        Below are some examples of good code comments.
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
        /**
         * Retrieves a restaurant by its ID, along with associated single client data,
         * and checks the user's privileges and context.
         *
         * @param id - The ID of the restaurant to retrieve
         * @returns A Promise that resolves to a Result object containing an IRestaurantResponseDTO object
         * @throws {ApplicationError} If the user does not have sufficient privileges
         */
`;
    return PROMPT;
  }

  formatResponse(comment: string): string | undefined {
    return comment;
  }

  createPrompt(selectedCode: string): string {
    const prompt = this.generatePrompt();
    const fullPrompt = `${prompt} \n ${selectedCode}`;
    return fullPrompt;
  }
}

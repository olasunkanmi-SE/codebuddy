"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateComment = void 0;
const vscode = require("vscode");
const generative_ai_1 = require("@google/generative-ai");
// Provide instructions for the AI language model
// This approach uses a few-shot technique, providing a few examples.
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
async function generateComment() {
    vscode.window.showInformationMessage("Generating comment...");
    const modelName = vscode.workspace
        .getConfiguration()
        .get("google.gemini.textModel", "models/gemini-1.0-pro-latest");
    // Get API Key from local user configuration
    const apiKey = vscode.workspace.getConfiguration().get("google.gemini.apiKey");
    if (!apiKey) {
        vscode.window.showErrorMessage("API key not configured. Check your settings.");
        return;
    }
    const genai = new generative_ai_1.GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({ model: modelName });
    // Text selection
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.debug("Abandon: no open text editor.");
        return;
    }
    const selection = editor.selection;
    const selectedCode = editor.document.getText(selection);
    // Build the full prompt using the template.
    const fullPrompt = `${PROMPT}
        ${CODE_LABEL}
        ${selectedCode}
        ${COMMENT_LABEL}
        `;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const comment = response.text();
    // Insert before selection.
    editor.edit((editBuilder) => {
        editBuilder.insert(selection.start, comment);
    });
}
exports.generateComment = generateComment;
//# sourceMappingURL=comments.js.map
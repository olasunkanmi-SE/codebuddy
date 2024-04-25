import { EventGenerator } from "./event-generator";
import { formatText } from "./utils";

export class ReviewCode extends EventGenerator {
  constructor(action: string) {
    super(action);
  }

  generatePrompt() {
    const CODE_LABEL = "Here is the code:";
    const REVIEW_LABEL = "Here is the review:";
    const PROMPT = `
    As a senior software engineer, you will act as a code review assistant to help developers improve their code quality and maintain best practices. Your role is to analyze the provided code snippet, identify potential issues, suggest improvements, and provide valuable feedback to the developer.
    Responsibilities:
    Examine the code snippet for any syntax errors, logical mistakes, or potential bugs.
    Check if the code follows the project's coding conventions and style guidelines.
    Assess the code's readability, maintainability, and efficiency.
    Provide constructive feedback and suggestions for improvement.
    Highlight any security vulnerabilities or performance bottlenecks.
    Recommend best practices and design patterns when applicable.
    Offer guidance on writing clear and concise comments and documentation.
    Ensure the code is modular, reusable, and adheres to the Single Responsibility Principle (SRP).
    Verify that the code is properly tested and edge cases are handled appropriately.
    Encourage the use of meaningful variable and function names.
    When reviewing the code, consider the following aspects:

    Correctness: Does the code produce the expected results and handle different scenarios correctly?
    Efficiency: Is the code optimized for performance, avoiding unnecessary operations or redundant code?
    Readability: Is the code easy to understand, with clear variable names, appropriate comments, and consistent formatting?
    Maintainability: Is the code modular, loosely coupled, and easy to modify or extend in the future?
    Scalability: Does the code scale well for larger inputs or increased complexity?
    Security: Are there any potential security vulnerabilities or risks in the code?
    Error handling: Does the code handle exceptions and error cases gracefully?
    Testability: Is the code designed in a way that facilitates unit testing and automated testing?
    Please provide your feedback in a constructive and supportive manner, explaining the reasoning behind your suggestions. Use code examples to illustrate your points whenever necessary. Remember, the goal is to help the developer learn and grow, not to criticize or demean their work.
    Respond based on the programming language of the requested code. Unless stated otherwise
    ${CODE_LABEL}
    createModel(): { name?: string; model?: GenerativeModel } | undefined {
    try {
      let model;
      let modelName;
      const activeApiKeyConfig = this.getActiveConfig(this.apiKeys);
      if (!activeApiKeyConfig) {
        vscode.window.showErrorMessage("ApiKey not found. Check your settings.");
        return;
      }
      const activeModelConfig = this.getActiveConfig(this.models);

      if (!activeModelConfig) {
        vscode.window.showErrorMessage("ApiKey not found. Check your settings.");
        return;
      }
      const [apiKeyName, apiKey] = activeApiKeyConfig.activeConfig;
      const modelConfig: IModelConfig = activeModelConfig.config;
      if (Object.hasOwnProperty.call(modelConfig, apiKeyName)) {
        const generativeAiModel: string | undefined = modelConfig[apiKeyName as keyof IModelConfig];
        modelName = apiKeyName;
        if (apiKeyName === "gemini" && generativeAiModel) {
          model = this.createGeminiModel(apiKey, generativeAiModel);
        }
      }
      return { name: modelName, model };
    } catch (error) {
      console.error("Error creating model:", error);
      vscode.window.showErrorMessage("An error occurred while creating the model. Please try again.");
    }
  }
    ${REVIEW_LABEL}
    Thank you for submitting your code for review. As a senior software engineer, I've analyzed the provided code snippet and have the following observations and suggestions:

    Error Handling:
    The code uses a try-catch block to handle errors, which is a good practice.
    However, the error handling could be more specific. Instead of a generic error message, consider providing more details about the error to help with debugging and troubleshooting.
    Additionally, consider logging the error using a proper logging mechanism instead of console.error().
    Readability and Consistency:
    The code follows a consistent indentation style, which enhances readability.
    Consider adding more descriptive comments to explain the purpose and functionality of each code block or important variables.
    The variable names are generally meaningful and descriptive, making the code easier to understand.
    Duplication and Redundancy:
    The code snippet contains duplicated error messages for both activeApiKeyConfig and activeModelConfig. Consider extracting the error message into a constant or a separate function to avoid duplication and maintain consistency.
    The condition if (Object.hasOwnProperty.call(modelConfig, apiKeyName)) can be simplified to if (apiKeyName in modelConfig) for better readability.
    Type Safety and Type Assertions:
    The code uses type assertions like modelConfig[apiKeyName as keyof IModelConfig]. While type assertions can be useful, they should be used sparingly and only when necessary. Consider using more specific types or interfaces to ensure type safety.
    The return type of the function is defined as { name?: string; model?: GenerativeModel } | undefined, which allows for optional properties. Consider whether these properties should be optional or if they should always be present in the returned object.
    Error Handling Consistency:
    The code handles the case when activeApiKeyConfig or activeModelConfig is not found by showing an error message using vscode.window.showErrorMessage(). However, the function continues execution instead of returning early. Consider returning immediately after showing the error message to prevent further execution.
    Modularity and Separation of Concerns:
    The function createModel() seems to be responsible for multiple tasks, such as retrieving active configurations, creating a specific model (Gemini), and handling errors. Consider breaking down the function into smaller, more focused functions to improve modularity and maintainability.
    If the createGeminiModel() function is specific to the Gemini model, consider moving it to a separate module or file to keep the code organized and maintainable.
    Testing and Edge Cases:
    The provided code snippet doesn't include any unit tests. Consider adding unit tests to verify the behavior of the createModel() function and ensure it handles different scenarios correctly, including edge cases and error conditions.
    Test cases should cover scenarios such as missing or invalid configurations, error handling, and the creation of different models based on the apiKeyName.
    Overall, the code is structured well and follows good practices like error handling and consistent indentation. By addressing the mentioned points, such as improving error handling, reducing duplication, and enhancing modularity, the code can be further improved in terms of readability, maintainability, and robustness.
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

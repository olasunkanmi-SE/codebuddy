import { ILlmConfig } from "../llms/interface";

export const validateLlmConfig = (config: ILlmConfig): string[] => {
  const errors: string[] = [];

  if (
    !config.model ||
    typeof config.model !== "string" ||
    config.model.trim() === ""
  ) {
    errors.push("Model must be a non-empty string");
  }

  if (!Array.isArray(config.tools)) {
    errors.push("Tools must be an array");
  }

  if (
    !config.apiKey ||
    typeof config.apiKey !== "string" ||
    config.apiKey.trim() === ""
  ) {
    errors.push("API key must be a non-empty string");
  }

  if (
    !config.baseUrl ||
    typeof config.baseUrl !== "string" ||
    config.baseUrl.trim() === ""
  ) {
    errors.push("Base URL must be a non-empty string");
  }

  // Validate additionalConfig (optional)
  if (config.additionalConfig !== undefined) {
    if (
      typeof config.additionalConfig !== "object" ||
      config.additionalConfig === null
    ) {
      errors.push("Additional config must be an object");
    }
  }

  return errors;
};

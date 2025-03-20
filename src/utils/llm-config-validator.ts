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

  if (config.tools && !Array.isArray(config?.tools)) {
    errors.push("Model Tools must be an array");
  }

  if (
    !config.apiKey ||
    typeof config.apiKey !== "string" ||
    config.apiKey.trim() === ""
  ) {
    errors.push("API key must be a non-empty string");
  }

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

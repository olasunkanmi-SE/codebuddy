import { IAnalysisStrategy } from "./base-analysis-strategy";
import { ApiEndpointStrategy } from "./api-endpoint-strategy";
import { DataModelStrategy } from "./data-model-strategy";

export enum AnalysisType {
  API_ENDPOINTS = "api-endpoints",
  DATA_MODELS = "data-models",
  DATABASE_SCHEMA = "database-schema",
}

export class AnalysisStrategyFactory {
  private static readonly strategies: Map<AnalysisType, IAnalysisStrategy> =
    new Map();

  public static getStrategy(type: AnalysisType): IAnalysisStrategy {
    if (!this.strategies.has(type)) {
      this.strategies.set(type, this.createStrategy(type));
    }

    return this.strategies.get(type)!;
  }

  private static createStrategy(type: AnalysisType): IAnalysisStrategy {
    switch (type) {
      case AnalysisType.API_ENDPOINTS:
        return new ApiEndpointStrategy();

      case AnalysisType.DATA_MODELS:
        return new DataModelStrategy();

      default:
        throw new Error(`Unsupported analysis type: ${type}`);
    }
  }

  public static clearStrategies(): void {
    this.strategies.clear();
  }
}

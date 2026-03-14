export type ProviderStatus = "healthy" | "degraded" | "down";

export type FailoverReason =
  | "auth"
  | "rate_limit"
  | "billing"
  | "timeout"
  | "model_not_found"
  | "format"
  | "overloaded"
  | "unknown";

export interface ProviderHealth {
  provider: string;
  status: ProviderStatus;
  errorCount: number;
  lastError?: string;
  lastErrorReason?: FailoverReason;
  lastSuccessAt?: number;
  cooldownUntil: number;
}

export interface ProviderHealthState {
  activeProvider: string;
  health: ProviderHealth[];
}

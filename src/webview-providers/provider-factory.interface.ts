import type { BaseWebViewProvider } from "./base";

/**
 * Abstraction for creating provider instances — used by Ask-mode failover
 * to obtain a temporary provider without coupling to WebViewProviderManager.
 */
export interface IProviderFactory {
  createProviderByName(
    providerName: string,
    apiKey: string,
    model: string,
  ): BaseWebViewProvider | undefined;
}

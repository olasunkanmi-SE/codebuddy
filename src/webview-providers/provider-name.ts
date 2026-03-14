/** Normalised (lowercase) provider identifier. */
export type ProviderKey = string & { readonly __brand: "ProviderKey" };

export function toProviderKey(raw: string): ProviderKey {
  const normalized = raw.trim().toLowerCase();
  if (!normalized) {
    throw new Error("Provider name cannot be empty");
  }
  return normalized as ProviderKey;
}

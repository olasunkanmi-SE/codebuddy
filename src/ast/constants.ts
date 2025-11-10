/**
 * Analysis Keywords Configuration
 *
 * Defines keyword patterns for different types of code analysis.
 */

export const authKeywords = [
  "auth",
  "login",
  "logout",
  "token",
  "jwt",
  "oauth",
  "session",
  "password",
  "credential",
  "authenticate",
  "authorize",
  "verify",
  "passport",
  "bcrypt",
  "signin",
  "signout",
  "signup",
];

export const securityKeywords = [
  "encrypt",
  "decrypt",
  "hash",
  "salt",
  "secure",
  "crypto",
  "certificate",
  "ssl",
  "tls",
];

export const apiKeywords = [
  "api",
  "endpoint",
  "route",
  "request",
  "response",
  "rest",
  "graphql",
] as const;

export type KeywordCategory = "auth" | "security" | "api";

export function getKeywordsByCategory(
  category: KeywordCategory,
): readonly string[] {
  switch (category) {
    case "auth":
      return authKeywords;
    case "security":
      return securityKeywords;
    case "api":
      return apiKeywords;
    default:
      return authKeywords;
  }
}

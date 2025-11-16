/**
 * Analysis Keywords Configuration
 *
 * Defines keyword patterns for different types of code analysis.
 */

import { ElementType } from "./query-types";

// export const authKeywords = [
//   "auth",
//   "login",
//   "logout",
//   "token",
//   "jwt",
//   "oauth",
//   "session",
//   "password",
//   "credential",
//   "authenticate",
//   "authorize",
//   "verify",
//   "passport",
//   "bcrypt",
//   "signin",
//   "signout",
//   "signup",
// ];

export const defaultIgnorePatterns = [
  "node_modules",
  "dist",
  "build",
  "out",
  ".git",
  ".vscode",
  ".idea",
  "vendor",
  "__pycache__",
  ".pytest_cache",
  "target",
  "bin",
  "obj",
  "coverage",
  ".nyc_output",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "Cargo.lock",
  "Gemfile.lock",
  "composer.lock",
  "poetry.lock",
  "*.min.js",
  "*.min.css",
  "*.map",
  "*.log",
  "*.swp",
  "*.bak",
  "*.tmp",
];

export const keywordWeights = new Map<string, number>([
  ["authenticate", 10],
  ["authorization", 10],
  ["login", 9],
  ["logout", 8],
  ["signin", 9],
  ["signout", 8],
  ["token", 8],
  ["jwt", 9],
  ["oauth", 9],
  ["session", 7],
  ["password", 8],
  ["credential", 8],
  ["verify", 6],
  ["auth", 5],
  ["passport", 7],
  ["bcrypt", 8],
]);

export const typeWeights = new Map<ElementType, number>([
  ["class", 10],
  ["method", 8],
  ["function", 8],
  ["variable", 4],
  ["other", 2],
]);

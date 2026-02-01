import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/suite/{qwen,glm,deepseek}-provider.test.js",
});

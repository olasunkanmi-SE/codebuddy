import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/suite/{qwen-provider,glm-provider,deepseek-provider,agent-safety-limits,agent-hitl,agent-tool-execution,filesystem-security}.test.js",
});

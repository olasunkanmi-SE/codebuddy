import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "out/test/suite/{qwen-provider,glm-provider,deepseek-provider,agent-safety-limits,agent-hitl,agent-tool-execution,filesystem-security,filesystem-optimizations,test-runner.service,composer.service,browser-handler,agent-core-paths,tool-names,memory,provider-failover.service,inline-review.service,token-budget,tree-sitter-analyzer,codebase-analysis-worker-utils,architectural-recommendation-utils}.test.js",
});

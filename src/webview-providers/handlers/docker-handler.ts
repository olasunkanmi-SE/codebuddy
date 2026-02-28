import * as vscode from "vscode";
import { WebviewMessageHandler, HandlerContext } from "./types";
import { DockerModelService } from "../../services/docker/DockerModelService";

export class DockerHandler implements WebviewMessageHandler {
  readonly commands = [
    "docker-enable-runner",
    "docker-start-compose",
    "docker-pull-ollama-model",
    "docker-pull-model",
    "docker-delete-model",
    "docker-use-model",
    "docker-get-models",
    "docker-get-local-model",
    "docker-check-ollama-status",
    "docker-check-status",
  ];

  async handle(message: any, ctx: HandlerContext): Promise<void> {
    const service = DockerModelService.getInstance();

    switch (message.command) {
      case "docker-enable-runner":
        try {
          const result = await service.enableModelRunner();
          await ctx.webview.webview.postMessage({
            type: "docker-runner-enabled",
            success: result.success,
            error: result.error,
          });
        } catch (error) {
          ctx.logger.error("Failed to enable Docker Model Runner", error);
        }
        break;

      case "docker-start-compose":
        try {
          const result = await service.startComposeOllama();
          await ctx.webview.webview.postMessage({
            type: "docker-compose-started",
            success: result.success,
            error: result.error,
          });
        } catch (error) {
          ctx.logger.error("Failed to start Docker Compose", error);
        }
        break;

      case "docker-pull-ollama-model":
        try {
          const success = await service.pullOllamaModel(message.message);
          await ctx.webview.webview.postMessage({
            type: "docker-model-pulled",
            model: message.message,
            success: success.success,
            error: success.error,
          });
        } catch (error) {
          ctx.logger.error("Failed to pull Ollama model", error);
        }
        break;

      case "docker-pull-model":
        try {
          const result = await service.pullModel(message.message);
          await ctx.webview.webview.postMessage({
            type: "docker-model-pulled",
            model: message.message,
            success: result.success,
            error: result.error,
          });
        } catch (error) {
          ctx.logger.error("Failed to pull Docker model", error);
          await ctx.webview.webview.postMessage({
            type: "docker-model-pulled",
            model: message.message,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        break;

      case "docker-delete-model":
        try {
          const result = await service.deleteModel(message.message);
          await ctx.webview.webview.postMessage({
            type: "docker-model-deleted",
            model: message.message,
            success: result.success,
            error: result.error,
          });
        } catch (error) {
          ctx.logger.error("Failed to delete Docker model", error);
        }
        break;

      case "docker-use-model":
        try {
          const config = vscode.workspace.getConfiguration("local");
          const isDockerModelRunner = message.message.startsWith("ai/");
          let baseUrl = isDockerModelRunner
            ? "http://localhost:12434/engines/llama.cpp/v1"
            : "http://localhost:11434/v1";

          if (isDockerModelRunner) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 1000);
              await fetch("http://localhost:12434", {
                method: "HEAD",
                signal: controller.signal,
              }).catch(() => {
                throw new Error("Connection failed");
              });
              clearTimeout(timeoutId);
            } catch {
              ctx.logger.info(
                "Docker Model Runner (12434) unreachable, falling back to Ollama (11434)",
              );
              baseUrl = "http://localhost:11434/v1";
            }
          }

          const modelName = isDockerModelRunner
            ? message.message.replace(/^ai\//, "")
            : message.message;

          await config.update(
            "model",
            modelName,
            vscode.ConfigurationTarget.Global,
          );
          await config.update(
            "baseUrl",
            baseUrl,
            vscode.ConfigurationTarget.Global,
          );

          const mainConfig = vscode.workspace.getConfiguration("generativeAi");
          await mainConfig.update(
            "option",
            "Local",
            vscode.ConfigurationTarget.Global,
          );

          ctx.logger.info(`Local model configured: ${modelName} at ${baseUrl}`);

          await ctx.webview.webview.postMessage({
            type: "docker-model-selected",
            model: message.message,
            success: true,
          });
        } catch (error) {
          ctx.logger.error("Failed to set local model", error);
          await ctx.webview.webview.postMessage({
            type: "docker-model-selected",
            model: message.message,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
        break;

      case "docker-get-models":
        try {
          const models = await service.getModels();
          await ctx.webview.webview.postMessage({
            type: "docker-models-list",
            models,
          });
        } catch (error) {
          ctx.logger.error("Failed to get Docker models", error);
        }
        break;

      case "docker-get-local-model":
        try {
          const config = vscode.workspace.getConfiguration("local");
          const model = config.get<string>("model");
          await ctx.webview.webview.postMessage({
            type: "docker-local-model",
            model,
          });
        } catch (error) {
          ctx.logger.error("Failed to get local model config", error);
        }
        break;

      case "docker-check-ollama-status":
        try {
          const running = await service.checkOllamaRunning();
          await ctx.webview.webview.postMessage({
            type: "docker-ollama-status",
            running,
          });
        } catch (error) {
          ctx.logger.error("Failed to check Ollama status", error);
        }
        break;

      case "docker-check-status":
        try {
          const available = await service.checkModelRunnerAvailable();
          await ctx.webview.webview.postMessage({
            type: "docker-status",
            available,
          });
        } catch (error) {
          ctx.logger.error("Failed to check Docker status", error);
        }
        break;
    }
  }
}

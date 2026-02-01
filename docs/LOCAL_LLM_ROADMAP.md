# Local LLM Support Roadmap

This roadmap outlines the plan to integrate Local LLM support (e.g., Ollama, LM Studio, LocalAI) into CodeBuddy. The integration will rely on the OpenAI-compatible API provided by most local LLM runners.

## Phase 1: Configuration & Architecture
**Goal:** Enable CodeBuddy to store and retrieve Local LLM settings.

1.  **Extension Configuration (`package.json`)**:
    *   Add new configuration section `local`.
    *   `local.baseUrl`: String, default `http://localhost:11434/v1` (Standard Ollama/OpenAI-compatible endpoint).
    *   `local.model`: String, default `llama3` (or empty to require user input).
    *   `local.apiKey`: String, default `not-needed` (Local LLMs usually don't require it, but some might).

2.  **Constants Update (`src/application/constant.ts`)**:
    *   Update `APP_CONFIG` to include mapping for `local.baseUrl`, `local.model`, and `local.apiKey`.
    *   Update `generativeAiModels` enum to include `LOCAL = "Local"`.

3.  **Utils Update (`src/utils/utils.ts`)**:
    *   Update `getAPIKeyAndModel` to handle the `LOCAL` case, returning the base URL as well.
    *   Create or update client factory to support `baseURL`.

## Phase 2: Backend Implementation
**Goal:** Implement the logic to communicate with Local LLMs.

1.  **Local LLM Class (`src/llms/local/local.ts`)**:
    *   Create a class `LocalLLM` implementing `BaseLLM`.
    *   Use the `openai` NPM package but initialize it with the user-provided `baseURL`.
    *   Implement `getModel()` to return the configured client.

2.  **Local Webview Provider (`src/webview-providers/local.ts`)**:
    *   Create `LocalWebViewProvider` extending `BaseWebViewProvider`.
    *   Initialize `LocalLLM` with config from settings.
    *   Handle chat history and message sending similar to `OpenAIWebViewProvider`.

3.  **Extension Initialization (`src/extension.ts`)**:
    *   Update `initializeWebViewProviders` to include the `LOCAL` provider mapping.
    *   Ensure the provider is initialized when "Local" is selected.

## Phase 3: Frontend (Webview) Implementation
**Goal:** Allow users to select and configure Local LLMs from the UI.

1.  **Model Constants (`webviewUi/src/constants/constant.ts`)**:
    *   Add `{ value: "Local", label: "Local LLM (Ollama/LM Studio)" }` to `modelOptions`.

2.  **Settings UI (`webviewUi/src/components/settings/sections/ModelsSettings.tsx`)**:
    *   Add conditional rendering: If `selectedModel === "Local"`, show input fields for:
        *   **Base URL**: (e.g., `http://localhost:11434/v1`)
        *   **Model Name**: (e.g., `llama3`, `mistral`)
    *   Ensure these inputs sync with the `local.baseUrl` and `local.model` VS Code settings.

## Phase 4: Verification & Documentation
**Goal:** Verify functionality and document usage.

1.  **Verification**:
    *   Test with **Ollama** running locally (`ollama serve`).
    *   Test with **LM Studio** (Start server).
    *   Verify chat, streaming, and context usage.

2.  **Documentation**:
    *   Update `README.md` with "Local LLM Support" section.
    *   Add `docs/LOCAL_LLM_SETUP.md` explaining how to connect common tools (Ollama, LM Studio).

## Timeline Estimate
*   **Phase 1 & 2 (Backend)**: 1-2 Hours
*   **Phase 3 (Frontend)**: 1-2 Hours
*   **Phase 4 (Testing/Docs)**: 1 Hour

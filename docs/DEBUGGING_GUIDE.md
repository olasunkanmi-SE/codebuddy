# Debugging CodeBuddy Extension

This guide walks you through configuring and running a debug session for the CodeBuddy VS Code extension, including troubleshooting common breakpoint and source map issues.

## Prerequisites

- VS Code version >= 1.78.0
- Node.js and npm installed
- Extension dependencies installed (`npm install`)

## 1. TypeScript Compiler Configuration

In your `tsconfig.json` ensure the following options:

```jsonc
{
  "compilerOptions": {
    // Output compiled JS into `out/`
    "outDir": "out",
    // Generate inline source maps for accurate mapping
    "sourceMap": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "rootDir": "src",
    // ... other settings ...
  }
}
```

## 2. Launch Configuration (`.vscode/launch.json`)

Configure a launch profile to start an Extension Host and attach the debugger:

```jsonc
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension (Clean Build)",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "preLaunchTask": "clean-and-compile",
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "resolveSourceMapLocations": [
        "${workspaceFolder}/out/**/*.js",
        "${workspaceFolder}/src/**/*.ts"
      ],
      "sourceMaps": true,
      "internalConsoleOptions": "openOnSessionStart"
    }
  ]
}
```

Key points:

- `preLaunchTask` should run a clean build (e.g., remove `out/` then `tsc`).
- `outFiles` points to compiled `.js` files in `out/`.
- `resolveSourceMapLocations` includes both `out/**/*.js` and `src/**/*.ts` so VS Code can locate inline maps.

## 3. Build Tasks (`.vscode/tasks.json`)

Include tasks for compilation:

```jsonc
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "clean-and-compile",
      "type": "shell",
      "command": "rm -rf out && npm run compile",
      "group": "build",
      "problemMatcher": "$tsc"
    },
    {
      "type": "npm",
      "script": "watch",
      "problemMatcher": "$tsc-watch",
      "isBackground": true,
      "group": "build"
    }
  ]
}
```

- Use `clean-and-compile` for fresh builds before debugging.
- Optionally run `watch` mode during development for incremental builds.

## 4. Running the Debug Session

1. Open VS Code and select the **Run and Debug** view (⇧⌘D).
2. Choose **Run Extension (Clean Build)** profile.
3. Click **Start Debugging** (F5).
4. A new Extension Development Host window will open.
5. In your primary window, set breakpoints in `src/` files (e.g., `extension.ts`).
6. Trigger commands or features to hit breakpoints.

## 5. Common Issues & Solutions

### Breakpoints Not Hit

- Ensure `activationEvents` in `package.json` include `*` or the specific event that fires your code.
- Verify inline source maps are generated and loaded (check `out/extension.js.map`).
- Confirm `main` in `package.json` points to `./out/extension.js`.
- Clean build and restart the debug session after config changes.

### Source Maps Not Loading

- Check your `launch.json` `resolveSourceMapLocations` includes correct globs.
- Use `trace: true` in launch config to inspect map loading in DEBUG CONSOLE.

## 6. Logging & Tracing

- Use the built-in `Logger` (in `src/infrastructure/logger`) set to `DEBUG`:
  ```ts
  const logger = Logger.initialize('extension', { minLevel: LogLevel.DEBUG });
  logger.debug('My debug message');
  ```
- Enable `

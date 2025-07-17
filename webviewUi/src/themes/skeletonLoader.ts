/**
 * Centralized skeleton loader styles with theme-specific color placeholders
 * This prevents duplication across theme files and provides a single source of truth
 */

export interface SkeletonLoaderThemeColors {
  background: string;
  border: string;
  lineBackground: string;
  lineHighlight: string;
}

/**
 * Generates skeleton loader CSS with theme-specific colors
 * @param colors - Theme-specific color values
 * @returns Complete CSS string for skeleton loader
 */
export function generateSkeletonLoaderCSS(
  colors: SkeletonLoaderThemeColors,
): string {
  return `
/* Skeleton Loader Styles */
.skeleton-loader-container {
  background: ${colors.background};
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  border: 1px solid ${colors.border};
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, 
    ${colors.lineBackground} 0%,
    ${colors.lineHighlight} 50%,
    ${colors.lineBackground} 100%
  );
  border-radius: 6px;
  background-size: 200px 100%;
  background-position: -200px 0;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-line-short {
  width: 30%;
}

.skeleton-line-medium {
  width: 60%;
}

.skeleton-line-long {
  width: 80%;
}

.skeleton-line-full {
  width: 100%;
}

@keyframes skeleton-pulse {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

/* Command Feedback Loader Styles */
.command-feedback-container {
  background: ${colors.background};
  border-radius: 12px;
  padding: 20px;
  margin: 12px 0;
  border: 1px solid ${colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.command-feedback-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.command-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.command-action {
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground, #c9d1d9);
  margin: 0;
}

.command-description {
  font-size: 12px;
  color: var(--vscode-descriptionForeground, #8b949e);
  margin: 0;
  opacity: 0.8;
}

.command-status {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid ${colors.border};
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--vscode-descriptionForeground, #8b949e);
}

.pulsing-dot {
  width: 8px;
  height: 8px;
  background: var(--vscode-progressBar-background, #0078d4);
  border-radius: 50%;
  animation: pulse-animation 1.5s ease-in-out infinite;
}

@keyframes pulse-animation {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}`;
}

/**
 * Pre-configured skeleton loader styles for common themes
 */
export const SKELETON_THEME_PRESETS = {
  tokyoNight: {
    background: "var(--vscode-editor-background, #1a1b26)",
    border: "var(--vscode-widget-border, #414868)",
    lineBackground: "var(--vscode-editor-background, #1a1b26)",
    lineHighlight: "var(--vscode-input-background, #24283b)",
  },
  atomOneDark: {
    background: "var(--vscode-editor-background, #282c34)",
    border: "var(--vscode-widget-border, #3e4451)",
    lineBackground: "var(--vscode-editor-background, #282c34)",
    lineHighlight: "var(--vscode-input-background, #3e4451)",
  },
  nightOwl: {
    background: "var(--vscode-editor-background, #011627)",
    border: "var(--vscode-widget-border, #1d3b53)",
    lineBackground: "var(--vscode-editor-background, #011627)",
    lineHighlight: "var(--vscode-input-background, #1d3b53)",
  },
  githubDark: {
    background: "var(--vscode-editor-background, #0d1117)",
    border: "var(--vscode-widget-border, #30363d)",
    lineBackground: "var(--vscode-editor-background, #0d1117)",
    lineHighlight: "var(--vscode-input-background, #21262d)",
  },
  codePen: {
    background: "var(--vscode-editor-background, #1e1e1e)",
    border: "var(--vscode-widget-border, #333)",
    lineBackground: "var(--vscode-editor-background, #1e1e1e)",
    lineHighlight: "var(--vscode-input-background, #333)",
  },
  felipec: {
    background: "var(--vscode-editor-background, #1e1e22)",
    border: "var(--vscode-widget-border, #333)",
    lineBackground: "var(--vscode-editor-background, #1e1e22)",
    lineHighlight: "var(--vscode-input-background, #333)",
  },
  irBlack: {
    background: "var(--vscode-editor-background, #000)",
    border: "var(--vscode-widget-border, #333)",
    lineBackground: "var(--vscode-editor-background, #000)",
    lineHighlight: "var(--vscode-input-background, #333)",
  },
  stackoverflow: {
    background: "var(--vscode-editor-background, #1c1c1c)",
    border: "var(--vscode-widget-border, #333)",
    lineBackground: "var(--vscode-editor-background, #1c1c1c)",
    lineHighlight: "var(--vscode-input-background, #333)",
  },
} as const;

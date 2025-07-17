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

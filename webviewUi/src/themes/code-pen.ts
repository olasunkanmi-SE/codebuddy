export const codePenCss = `/*
  codepen.io Embed Theme
  Author: Justin Perry <http://github.com/ourmaninamsterdam>
  Original theme - https://github.com/chriskempson/tomorrow-theme
*/

.hljs {
  background: transparent;
  color: #fff;
}

.hljs-comment,
.hljs-quote {
  color: #777;
}

.hljs-variable,
.hljs-template-variable,
.hljs-tag,
.hljs-regexp,
.hljs-meta,
.hljs-number,
.hljs-built_in,
.hljs-literal,
.hljs-params,
.hljs-symbol,
.hljs-bullet,
.hljs-link,
.hljs-deletion {
  color: #ab875d;
}

.hljs-section,
.hljs-title,
.hljs-name,
.hljs-selector-id,
.hljs-selector-class,
.hljs-type,
.hljs-attribute {
  color: #9b869b;
}

.hljs-string,
.hljs-keyword,
.hljs-selector-tag,
.hljs-addition {
  color: #8f9c6c;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}

/* Skeleton Loader Styles */
.skeleton-loader {
  background: var(--vscode-editor-background, #1e1e1e);
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  border: 1px solid var(--vscode-widget-border, #333);
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
    var(--vscode-editor-background, #1e1e1e) 0%,
    var(--vscode-input-background, #333) 50%,
    var(--vscode-editor-background, #1e1e1e) 100%
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

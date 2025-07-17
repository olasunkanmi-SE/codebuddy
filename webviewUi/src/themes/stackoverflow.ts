export const stackOverFlowCss = `/*!
  Theme: StackOverflow Dark
  Description: Dark theme as used on stackoverflow.com
  Author: stackoverflow.com
  Maintainer: @Hirse
  Website: https://github.com/StackExchange/Stacks
  License: MIT
  Updated: 2021-05-15

  Updated for @stackoverflow/stacks v0.64.0
  Code Blocks: /blob/v0.64.0/lib/css/components/_stacks-code-blocks.less
  Colors: /blob/v0.64.0/lib/css/exports/_stacks-constants-colors.less
*/

.hljs {
  /* var(--highlight-color) */
  color: #ffffff;
  /* var(--highlight-bg) */
  background: transparent
}

.hljs-subst {
  /* var(--highlight-color) */
  color: #ffffff;
}

.hljs-comment {
  /* var(--highlight-comment) */
  color: #999999;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-meta .hljs-keyword,
.hljs-doctag,
.hljs-section {
  /* var(--highlight-keyword) */
  color: #88aece;
}

.hljs-attr {
  /* var(--highlight-attribute); */
  color: #88aece;
}

.hljs-attribute {
  /* var(--highlight-symbol) */
  color: #c59bc1;
}

.hljs-name,
.hljs-type,
.hljs-number,
.hljs-selector-id,
.hljs-quote,
.hljs-template-tag {
  /* var(--highlight-namespace) */
  color: #f08d49;
}

.hljs-selector-class {
  /* var(--highlight-keyword) */
  color: #88aece;
}

.hljs-string,
.hljs-regexp,
.hljs-symbol,
.hljs-variable,
.hljs-template-variable,
.hljs-link,
.hljs-selector-attr {
  /* var(--highlight-variable) */
  color: #b5bd68;
}

.hljs-meta,
.hljs-selector-pseudo {
  /* var(--highlight-keyword) */
  color: #88aece;
}

.hljs-built_in,
.hljs-title,
.hljs-literal {
  /* var(--highlight-literal) */
  color: #f08d49;
}

.hljs-bullet,
.hljs-code {
  /* var(--highlight-punctuation) */
  color: #cccccc;
}

.hljs-meta .hljs-string {
  /* var(--highlight-variable) */
  color: #b5bd68;
}

.hljs-deletion {
  /* var(--highlight-deletion) */
  color: #de7176;
}

.hljs-addition {
  /* var(--highlight-addition) */
  color: #76c490;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}

.hljs-formula,
.hljs-operator,
.hljs-params,
.hljs-property,
.hljs-punctuation,
.hljs-tag {
  /* purposely ignored */
}

/* Skeleton Loader Styles */
.skeleton-loader {
  background: var(--vscode-editor-background, #1c1c1c);
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
    var(--vscode-editor-background, #1c1c1c) 0%,
    var(--vscode-input-background, #333) 50%,
    var(--vscode-editor-background, #1c1c1c) 100%
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

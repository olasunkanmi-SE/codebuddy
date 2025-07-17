export const githubDarkDimmed = `/*!
  Theme: GitHub Dark
  Description: Dark theme as seen on github.com
  Author: github.com
  Maintainer: @Hirse
  Updated: 2021-05-15

  Outdated base version: https://github.com/primer/github-syntax-dark
  Current colors taken from GitHub's CSS
*/

.hljs {
    color: #c9d1d9;
    background: transparent;
}

.hljs-doctag,
.hljs-keyword,
.hljs-meta .hljs-keyword,
.hljs-template-tag,
.hljs-template-variable,
.hljs-type,
.hljs-variable.language_ {
    /* prettylights-syntax-keyword */
    color: #ff7b72;
}

.hljs-title,
.hljs-title.class_,
.hljs-title.class_.inherited__,
.hljs-title.function_ {
    /* prettylights-syntax-entity */
    color: #d2a8ff;
}

.hljs-attr,
.hljs-attribute,
.hljs-literal,
.hljs-meta,
.hljs-number,
.hljs-operator,
.hljs-variable,
.hljs-selector-attr,
.hljs-selector-class,
.hljs-selector-id {
    /* prettylights-syntax-constant */
    color: #79c0ff;
}

.hljs-regexp,
.hljs-string,
.hljs-meta .hljs-string {
    /* prettylights-syntax-string */
    color: #a5d6ff;
}

.hljs-built_in,
.hljs-symbol {
    /* prettylights-syntax-variable */
    color: #ffa657;
}

.hljs-comment,
.hljs-code,
.hljs-formula {
    /* prettylights-syntax-comment */
    color: #8b949e;
}

.hljs-name,
.hljs-quote,
.hljs-selector-tag,
.hljs-selector-pseudo {
    /* prettylights-syntax-entity-tag */
    color: #7ee787;
}

.hljs-subst {
    /* prettylights-syntax-storage-modifier-import */
    color: #c9d1d9;
}

.hljs-section {
    /* prettylights-syntax-markup-heading */
    color: #1f6feb;
    font-weight: bold;
}

.hljs-bullet {
    /* prettylights-syntax-markup-list */
    color: #f2cc60;
}

.hljs-emphasis {
    /* prettylights-syntax-markup-italic */
    color: #c9d1d9;
    font-style: italic;
}

.hljs-strong {
    /* prettylights-syntax-markup-bold */
    color: #c9d1d9;
    font-weight: bold;
}

.hljs-addition {
    /* prettylights-syntax-markup-inserted */
    color: #aff5b4;
    background-color: #033a16;
}

.hljs-deletion {
    /* prettylights-syntax-markup-deleted */
    color: #ffdcd7;
    background-color: #67060c;
}

.hljs-char.escape_,
.hljs-link,
.hljs-params,
.hljs-property,
.hljs-punctuation,
.hljs-tag {
    /* purposely ignored */
}

/* Skeleton Loader Styles */
.skeleton-loader {
  background: var(--vscode-editor-background, #0d1117);
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  border: 1px solid var(--vscode-widget-border, #30363d);
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
    var(--vscode-editor-background, #0d1117) 0%,
    var(--vscode-input-background, #21262d) 50%,
    var(--vscode-editor-background, #0d1117) 100%
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

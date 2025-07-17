export const irBlack = `/*
  IR_Black style (c) Vasily Mikhailitchenko <vaskas@programica.ru>
*/

.hljs {
  background: #000;
  color: transparent;
}

.hljs-comment,
.hljs-quote,
.hljs-meta {
  color: #7c7c7c;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-tag,
.hljs-name {
  color: #96cbfe;
}

.hljs-attribute,
.hljs-selector-id {
  color: #ffffb6;
}

.hljs-string,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-addition {
  color: #a8ff60;
}

.hljs-subst {
  color: #daefa3;
}

.hljs-regexp,
.hljs-link {
  color: #e9c062;
}

.hljs-title,
.hljs-section,
.hljs-type,
.hljs-doctag {
  color: #ffffb6;
}

.hljs-symbol,
.hljs-bullet,
.hljs-variable,
.hljs-template-variable,
.hljs-literal {
  color: #c6c5fe;
}

.hljs-number,
.hljs-deletion {
  color:#ff73fd;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}

/* Skeleton Loader Styles */
.skeleton-loader {
  background: var(--vscode-editor-background, #000);
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
    var(--vscode-editor-background, #000) 0%,
    var(--vscode-input-background, #333) 50%,
    var(--vscode-editor-background, #000) 100%
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

/*

Atom One Dark With support for ReasonML by Gidi Morris, based off work by Daniel Gamage

Original One Dark Syntax theme from https://github.com/atom/one-dark-syntax

*/

export const oneDarkReasonableCss: string = `
.hljs {
    color: #abb2bf;
    background: transparent;
}
.hljs-keyword, .hljs-operator {
    color: #F92672;
}
.hljs-pattern-match {
    color: #F92672;
}
.hljs-pattern-match .hljs-constructor {
    color: #61aeee;
}
.hljs-function {
    color: #61aeee;
}
.hljs-function .hljs-params {
    color: #A6E22E;
}
.hljs-function .hljs-params .hljs-typing {
    color: #FD971F;
}
.hljs-module-access .hljs-module {
    color: #7e57c2;
}
.hljs-constructor {
    color: #e2b93d;
}
.hljs-constructor .hljs-string {
    color: #9CCC65;
}
.hljs-comment, .hljs-quote {
    color: #b18eb1;
    font-style: normal;
}
.hljs-doctag, .hljs-formula {
    color: #c678dd;
}
.hljs-section, .hljs-name, .hljs-selector-tag, .hljs-deletion, .hljs-subst {
    color: #e06c75;
}
.hljs-literal {
    color: #56b6c2;
}
.hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta .hljs-string {
    color: #98c379;
}
.hljs-built_in,
.hljs-title.class_,
.hljs-class .hljs-title {
    color: #e6c07b;
}
.hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-type, .hljs-selector-class, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-number {
    color: #d19a66;
}
.hljs-symbol, .hljs-bullet, .hljs-link, .hljs-meta, .hljs-selector-id, .hljs-title {
    color: #61aeee;
}
.hljs-emphasis {
    font-style: italic;
}
.hljs-strong {
    font-weight: bold;
}
.hljs-link {
    text-decoration: underline;
}

/* Skeleton Loader Styles */
.skeleton-loader {
  background: var(--vscode-editor-background, #282c34);
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  border: 1px solid var(--vscode-widget-border, #3e4451);
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
    var(--vscode-editor-background, #282c34) 0%,
    var(--vscode-input-background, #3e4451) 50%,
    var(--vscode-editor-background, #282c34) 100%
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

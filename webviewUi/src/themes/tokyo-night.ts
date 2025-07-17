export const tokyoNightCss = `/*!
  Theme: Tokyo-night-Dark
  origin: https://github.com/enkia/tokyo-night-vscode-theme
  Description: Original highlight.js style
  Author: (c) Henri Vandersleyen <hvandersleyen@gmail.com>
  License: see project LICENSE
  Touched: 2022
*/

/*  Comment */
.hljs-meta,
.hljs-comment {
  color: #565f89;
}

/* Red */
/*INFO: This keyword, HTML elements, Regex group symbol, CSS units, Terminal Red */
.hljs-tag,
.hljs-doctag,
.hljs-selector-id,
.hljs-selector-class,
.hljs-regexp,
.hljs-template-tag,
.hljs-selector-pseudo,
.hljs-selector-attr,
.hljs-variable.language_,
.hljs-deletion {
  color: #f7768e;
}

/*Orange */
/*INFO: Number and Boolean constants, Language support constants */
.hljs-variable,
.hljs-template-variable,
.hljs-number,
.hljs-literal,
.hljs-type,
.hljs-params,
.hljs-link {
  color: #ff9e64;
}


/*  Yellow */
/* INFO:  	Function parameters, Regex character sets, Terminal Yellow */
.hljs-built_in, 
.hljs-attribute {
  color: #e0af68;
}
/* cyan */
/* INFO: Language support functions, CSS HTML elements */
.hljs-selector-tag {
  color: #2ac3de;
}

/* light blue */
/* INFO: Object properties, Regex quantifiers and flags, Markdown headings, Terminal Cyan, Markdown code, Import/export keywords */
.hljs-keyword,
  .hljs-title.function_,
.hljs-title,
.hljs-title.class_,
.hljs-title.class_.inherited__,
.hljs-subst,
.hljs-property {color: #7dcfff;}

/*Green*/
/* INFO: Object literal keys, Markdown links, Terminal Green */
.hljs-selector-tag { color: #73daca;}


/*Green(er) */
/* INFO: Strings, CSS class names */
.hljs-quote,
.hljs-string,
.hljs-symbol,
.hljs-bullet,
.hljs-addition {
  color: #9ece6a;
}

/* Blue */
/* INFO:  	Function names, CSS property names, Terminal Blue */
.hljs-code,
.hljs-formula,
.hljs-section {
  color: #7aa2f7;
}



/* Magenta */
/*INFO: Control Keywords, Storage Types, Regex symbols and operators, HTML Attributes, Terminal Magenta */
.hljs-name,
.hljs-keyword,
.hljs-operator,
.hljs-keyword,
.hljs-char.escape_,
.hljs-attr {
  color: #bb9af7;
}

/* white*/
/* INFO: Variables, Class names, Terminal White */
.hljs-punctuation {color: #c0caf5}

.hljs {
  background: transparent;
  color: #9aa5ce;
    font-family: "Fira Sans", sans-serif;
  font-weight: 300;
  font-style: normal;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}

/* Skeleton Loader Styles */
.skeleton-loader {
  background: var(--vscode-editor-background, #1a1b26);
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  border: 1px solid var(--vscode-widget-border, #414868);
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
    var(--vscode-editor-background, #1a1b26) 0%,
    var(--vscode-input-background, #24283b) 50%,
    var(--vscode-editor-background, #1a1b26) 100%
  );
  border-radius: 6px;
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

.skeleton-line {
  background: linear-gradient(90deg, 
    var(--vscode-editor-background, #1a1b26) 0%,
    var(--vscode-input-background, #24283b) 50%,
    var(--vscode-editor-background, #1a1b26) 100%
  );
  background-size: 200px 100%;
  background-position: -200px 0;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}`;

export const nightOwlCss = `/*

Night Owl for highlight.js (c) Carl Baxter <carl@cbax.tech>

An adaptation of Sarah Drasner's Night Owl VS Code Theme
https://github.com/sdras/night-owl-vscode-theme

Copyright (c) 2018 Sarah Drasner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

.hljs {
  background: transparent;
  color: #d6deeb;
}

/* General Purpose */
.hljs-keyword {
  color: #c792ea;
  font-style: normal;
}
.hljs-built_in {
  color: #addb67;
  font-style: normal;
}
.hljs-type {
  color: #82aaff;
}
.hljs-literal {
  color: #ff5874;
}
.hljs-number {
  color: #F78C6C;
}
.hljs-regexp {
  color: #5ca7e4;
}
.hljs-string {
  color: #ecc48d;
}
.hljs-subst {
  color: #d3423e;
}
.hljs-symbol {
  color: #82aaff;
}
.hljs-class {
  color: #ffcb8b;
}
.hljs-function {
  color: #82AAFF;
}
.hljs-title {
  color: #DCDCAA;
  font-style: normal;
}
.hljs-params {
  color: #7fdbca;
}

/* Meta */
.hljs-comment {
  color: #637777;
  font-style: italic;
}
.hljs-doctag {
  color: #7fdbca;
}
.hljs-meta {
  color: #82aaff;
}
.hljs-meta .hljs-keyword {

  color: #82aaff;
}
.hljs-meta .hljs-string {
  color: #ecc48d;
}

/* Tags, attributes, config */
.hljs-section {
  color: #82b1ff;
}
.hljs-tag,
.hljs-name {
  color: #7fdbca;
}
.hljs-attr {
  color: #7fdbca;
}
.hljs-attribute {
  color: #80cbc4;
}
.hljs-variable {
  color: #addb67;
}

/* Markup */
.hljs-bullet {
  color: #d9f5dd;
}
.hljs-code {
  color: #80CBC4;
}
.hljs-emphasis {
  color: #c792ea;
  font-style: italic;
}
.hljs-strong {
  color: #addb67;
  font-weight: bold;
}
.hljs-formula {
  color: #c792ea;
}
.hljs-link {
  color: #ff869a;
}
.hljs-quote {
  color: #697098;
  font-style: italic;
}

/* CSS */
.hljs-selector-tag {
  color: #ff6363;
}

.hljs-selector-id {
  color: #fad430;
}

.hljs-selector-class {
  color: #addb67;
  font-style: normal;
}

.hljs-selector-attr,
.hljs-selector-pseudo {
  color: #c792ea;
  font-style: normal;
}

/* Templates */
.hljs-template-tag {
  color: #c792ea;
}
.hljs-template-variable {
  color: #addb67;
}

/* diff */
.hljs-addition {
  color: #addb67ff;
  font-style: italic;
}

.hljs-deletion {
  color: #EF535090;
  font-style: italic;
}

/* Skeleton Loader Styles */
.skeleton-loader {
  background: var(--vscode-editor-background, #011627);
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  border: 1px solid var(--vscode-widget-border, #1d3b53);
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
    var(--vscode-editor-background, #011627) 0%,
    var(--vscode-input-background, #1d3b53) 50%,
    var(--vscode-editor-background, #011627) 100%
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

const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/dagre-6UL2VRFP.js","assets/graph.js","assets/_baseUniq.js","assets/layout.js","assets/_basePickBy.js","assets/clone.js","assets/vendor.js","assets/cose-bilkent-S5V4N54A.js","assets/cytoscape.esm.js","assets/c4Diagram-YG6GDRKO.js","assets/chunk-TZMSLE5B.js","assets/flowDiagram-NV44I4VS.js","assets/chunk-FMBD7UC4.js","assets/chunk-55IACEB6.js","assets/chunk-QN33PNHL.js","assets/channel.js","assets/erDiagram-Q2GNP2WA.js","assets/gitGraphDiagram-NY62KEGX.js","assets/chunk-4BX2VUAB.js","assets/chunk-QZHKN3VN.js","assets/treemap-KMMF4GRG.js","assets/ganttDiagram-JELNMOA3.js","assets/linear.js","assets/init.js","assets/defaultLocale.js","assets/infoDiagram-WHAUD3N6.js","assets/pieDiagram-ADFJNKIX.js","assets/arc.js","assets/ordinal.js","assets/quadrantDiagram-AYHSOK5B.js","assets/xychartDiagram-PRI3JC2R.js","assets/requirementDiagram-UZGBJVZJ.js","assets/sequenceDiagram-WL72ISMW.js","assets/classDiagram-2ON5EDUG.js","assets/chunk-B4BG7PRW.js","assets/classDiagram-v2-WZHVMYZB.js","assets/stateDiagram-FKZM4ZOC.js","assets/chunk-DI55MBZ5.js","assets/stateDiagram-v2-4FDKWEC3.js","assets/journeyDiagram-XKPGCS4Q.js","assets/timeline-definition-IT6M3QCI.js","assets/mindmap-definition-VGOIOE7T.js","assets/kanban-definition-3W4ZIXB7.js","assets/sankeyDiagram-TZEHDZUN.js","assets/diagram-S2PKOQOG.js","assets/diagram-QEK2KX5R.js","assets/blockDiagram-VD42YOAC.js","assets/architectureDiagram-VXUJARFQ.js","assets/diagram-PSM6KHXK.js"])))=>i.map(i=>d[i]);
var Zk=Object.defineProperty;var Jk=(e,t,r)=>t in e?Zk(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var qt=(e,t,r)=>Jk(e,typeof t!="symbol"?t+"":t,r);import{r as V0,g as U0,a as Kk}from"./vendor.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function r(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(n){if(n.ep)return;n.ep=!0;const s=r(n);fetch(n.href,s)}})();var eh={exports:{}},zs={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var jf;function tC(){if(jf)return zs;jf=1;var e=V0(),t=Symbol.for("react.element"),r=Symbol.for("react.fragment"),i=Object.prototype.hasOwnProperty,n=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,s={key:!0,ref:!0,__self:!0,__source:!0};function o(a,l,c){var d,u={},p=null,f=null;c!==void 0&&(p=""+c),l.key!==void 0&&(p=""+l.key),l.ref!==void 0&&(f=l.ref);for(d in l)i.call(l,d)&&!s.hasOwnProperty(d)&&(u[d]=l[d]);if(a&&a.defaultProps)for(d in l=a.defaultProps,l)u[d]===void 0&&(u[d]=l[d]);return{$$typeof:t,type:a,key:p,ref:f,props:u,_owner:n.current}}return zs.Fragment=r,zs.jsx=o,zs.jsxs=o,zs}var Ef;function eC(){return Ef||(Ef=1,eh.exports=tC()),eh.exports}var h=eC(),M=V0();const Mr=U0(M);var ya={},Lf;function rC(){if(Lf)return ya;Lf=1;var e=Kk();return ya.createRoot=e.createRoot,ya.hydrateRoot=e.hydrateRoot,ya}var iC=rC();const $i=function(){if(typeof globalThis<"u")return globalThis;if(typeof global<"u")return global;if(typeof self<"u")return self;if(typeof window<"u")return window;try{return new Function("return this")()}catch{return{}}}();$i.trustedTypes===void 0&&($i.trustedTypes={createPolicy:(e,t)=>t});const G0={configurable:!1,enumerable:!1,writable:!1};$i.FAST===void 0&&Reflect.defineProperty($i,"FAST",Object.assign({value:Object.create(null)},G0));const jo=$i.FAST;if(jo.getById===void 0){const e=Object.create(null);Reflect.defineProperty(jo,"getById",Object.assign({value(t,r){let i=e[t];return i===void 0&&(i=r?e[t]=r():null),i}},G0))}const sn=Object.freeze([]);function Y0(){const e=new WeakMap;return function(t){let r=e.get(t);if(r===void 0){let i=Reflect.getPrototypeOf(t);for(;r===void 0&&i!==null;)r=e.get(i),i=Reflect.getPrototypeOf(i);r=r===void 0?[]:r.slice(0),e.set(t,r)}return r}}const rh=$i.FAST.getById(1,()=>{const e=[],t=[];function r(){if(t.length)throw t.shift()}function i(o){try{o.call()}catch(a){t.push(a),setTimeout(r,0)}}function n(){let a=0;for(;a<e.length;)if(i(e[a]),a++,a>1024){for(let l=0,c=e.length-a;l<c;l++)e[l]=e[l+a];e.length-=a,a=0}e.length=0}function s(o){e.length<1&&$i.requestAnimationFrame(n),e.push(o)}return Object.freeze({enqueue:s,process:n})}),X0=$i.trustedTypes.createPolicy("fast-html",{createHTML:e=>e});let ih=X0;const bo=`fast-${Math.random().toString(36).substring(2,8)}`,Q0=`${bo}{`,Fu=`}${bo}`,At=Object.freeze({supportsAdoptedStyleSheets:Array.isArray(document.adoptedStyleSheets)&&"replace"in CSSStyleSheet.prototype,setHTMLPolicy(e){if(ih!==X0)throw new Error("The HTML policy can only be set once.");ih=e},createHTML(e){return ih.createHTML(e)},isMarker(e){return e&&e.nodeType===8&&e.data.startsWith(bo)},extractDirectiveIndexFromMarker(e){return parseInt(e.data.replace(`${bo}:`,""))},createInterpolationPlaceholder(e){return`${Q0}${e}${Fu}`},createCustomAttributePlaceholder(e,t){return`${e}="${this.createInterpolationPlaceholder(t)}"`},createBlockPlaceholder(e){return`<!--${bo}:${e}-->`},queueUpdate:rh.enqueue,processUpdates:rh.process,nextUpdate(){return new Promise(rh.enqueue)},setAttribute(e,t,r){r==null?e.removeAttribute(t):e.setAttribute(t,r)},setBooleanAttribute(e,t,r){r?e.setAttribute(t,""):e.removeAttribute(t)},removeChildNodes(e){for(let t=e.firstChild;t!==null;t=e.firstChild)e.removeChild(t)},createTemplateWalker(e){return document.createTreeWalker(e,133,null,!1)}});class ml{constructor(t,r){this.sub1=void 0,this.sub2=void 0,this.spillover=void 0,this.source=t,this.sub1=r}has(t){return this.spillover===void 0?this.sub1===t||this.sub2===t:this.spillover.indexOf(t)!==-1}subscribe(t){const r=this.spillover;if(r===void 0){if(this.has(t))return;if(this.sub1===void 0){this.sub1=t;return}if(this.sub2===void 0){this.sub2=t;return}this.spillover=[this.sub1,this.sub2,t],this.sub1=void 0,this.sub2=void 0}else r.indexOf(t)===-1&&r.push(t)}unsubscribe(t){const r=this.spillover;if(r===void 0)this.sub1===t?this.sub1=void 0:this.sub2===t&&(this.sub2=void 0);else{const i=r.indexOf(t);i!==-1&&r.splice(i,1)}}notify(t){const r=this.spillover,i=this.source;if(r===void 0){const n=this.sub1,s=this.sub2;n!==void 0&&n.handleChange(i,t),s!==void 0&&s.handleChange(i,t)}else for(let n=0,s=r.length;n<s;++n)r[n].handleChange(i,t)}}class Z0{constructor(t){this.subscribers={},this.sourceSubscribers=null,this.source=t}notify(t){var r;const i=this.subscribers[t];i!==void 0&&i.notify(t),(r=this.sourceSubscribers)===null||r===void 0||r.notify(t)}subscribe(t,r){var i;if(r){let n=this.subscribers[r];n===void 0&&(this.subscribers[r]=n=new ml(this.source)),n.subscribe(t)}else this.sourceSubscribers=(i=this.sourceSubscribers)!==null&&i!==void 0?i:new ml(this.source),this.sourceSubscribers.subscribe(t)}unsubscribe(t,r){var i;if(r){const n=this.subscribers[r];n!==void 0&&n.unsubscribe(t)}else(i=this.sourceSubscribers)===null||i===void 0||i.unsubscribe(t)}}const $t=jo.getById(2,()=>{const e=/(:|&&|\|\||if)/,t=new WeakMap,r=At.queueUpdate;let i,n=c=>{throw new Error("Must call enableArrayObservation before observing arrays.")};function s(c){let d=c.$fastController||t.get(c);return d===void 0&&(Array.isArray(c)?d=n(c):t.set(c,d=new Z0(c))),d}const o=Y0();class a{constructor(d){this.name=d,this.field=`_${d}`,this.callback=`${d}Changed`}getValue(d){return i!==void 0&&i.watch(d,this.name),d[this.field]}setValue(d,u){const p=this.field,f=d[p];if(f!==u){d[p]=u;const g=d[this.callback];typeof g=="function"&&g.call(d,f,u),s(d).notify(this.name)}}}class l extends ml{constructor(d,u,p=!1){super(d,u),this.binding=d,this.isVolatileBinding=p,this.needsRefresh=!0,this.needsQueue=!0,this.first=this,this.last=null,this.propertySource=void 0,this.propertyName=void 0,this.notifier=void 0,this.next=void 0}observe(d,u){this.needsRefresh&&this.last!==null&&this.disconnect();const p=i;i=this.needsRefresh?this:void 0,this.needsRefresh=this.isVolatileBinding;const f=this.binding(d,u);return i=p,f}disconnect(){if(this.last!==null){let d=this.first;for(;d!==void 0;)d.notifier.unsubscribe(this,d.propertyName),d=d.next;this.last=null,this.needsRefresh=this.needsQueue=!0}}watch(d,u){const p=this.last,f=s(d),g=p===null?this.first:{};if(g.propertySource=d,g.propertyName=u,g.notifier=f,f.subscribe(this,u),p!==null){if(!this.needsRefresh){let x;i=void 0,x=p.propertySource[p.propertyName],i=this,d===x&&(this.needsRefresh=!0)}p.next=g}this.last=g}handleChange(){this.needsQueue&&(this.needsQueue=!1,r(this))}call(){this.last!==null&&(this.needsQueue=!0,this.notify(this))}records(){let d=this.first;return{next:()=>{const u=d;return u===void 0?{value:void 0,done:!0}:(d=d.next,{value:u,done:!1})},[Symbol.iterator]:function(){return this}}}}return Object.freeze({setArrayObserverFactory(c){n=c},getNotifier:s,track(c,d){i!==void 0&&i.watch(c,d)},trackVolatile(){i!==void 0&&(i.needsRefresh=!0)},notify(c,d){s(c).notify(d)},defineProperty(c,d){typeof d=="string"&&(d=new a(d)),o(c).push(d),Reflect.defineProperty(c,d.name,{enumerable:!0,get:function(){return d.getValue(this)},set:function(u){d.setValue(this,u)}})},getAccessors:o,binding(c,d,u=this.isVolatileBinding(c)){return new l(c,d,u)},isVolatileBinding(c){return e.test(c.toString())}})});function rt(e,t){$t.defineProperty(e,t)}function nC(e,t,r){return Object.assign({},r,{get:function(){return $t.trackVolatile(),r.get.apply(this)}})}const Bf=jo.getById(3,()=>{let e=null;return{get(){return e},set(t){e=t}}});class Eo{constructor(){this.index=0,this.length=0,this.parent=null,this.parentContext=null}get event(){return Bf.get()}get isEven(){return this.index%2===0}get isOdd(){return this.index%2!==0}get isFirst(){return this.index===0}get isInMiddle(){return!this.isFirst&&!this.isLast}get isLast(){return this.index===this.length-1}static setEvent(t){Bf.set(t)}}$t.defineProperty(Eo.prototype,"index");$t.defineProperty(Eo.prototype,"length");const yo=Object.seal(new Eo);class sc{constructor(){this.targetIndex=0}}class J0 extends sc{constructor(){super(...arguments),this.createPlaceholder=At.createInterpolationPlaceholder}}class Pu extends sc{constructor(t,r,i){super(),this.name=t,this.behavior=r,this.options=i}createPlaceholder(t){return At.createCustomAttributePlaceholder(this.name,t)}createBehavior(t){return new this.behavior(t,this.options)}}function sC(e,t){this.source=e,this.context=t,this.bindingObserver===null&&(this.bindingObserver=$t.binding(this.binding,this,this.isBindingVolatile)),this.updateTarget(this.bindingObserver.observe(e,t))}function oC(e,t){this.source=e,this.context=t,this.target.addEventListener(this.targetName,this)}function aC(){this.bindingObserver.disconnect(),this.source=null,this.context=null}function lC(){this.bindingObserver.disconnect(),this.source=null,this.context=null;const e=this.target.$fastView;e!==void 0&&e.isComposed&&(e.unbind(),e.needsBindOnly=!0)}function cC(){this.target.removeEventListener(this.targetName,this),this.source=null,this.context=null}function hC(e){At.setAttribute(this.target,this.targetName,e)}function dC(e){At.setBooleanAttribute(this.target,this.targetName,e)}function uC(e){if(e==null&&(e=""),e.create){this.target.textContent="";let t=this.target.$fastView;t===void 0?t=e.create():this.target.$fastTemplate!==e&&(t.isComposed&&(t.remove(),t.unbind()),t=e.create()),t.isComposed?t.needsBindOnly&&(t.needsBindOnly=!1,t.bind(this.source,this.context)):(t.isComposed=!0,t.bind(this.source,this.context),t.insertBefore(this.target),this.target.$fastView=t,this.target.$fastTemplate=e)}else{const t=this.target.$fastView;t!==void 0&&t.isComposed&&(t.isComposed=!1,t.remove(),t.needsBindOnly?t.needsBindOnly=!1:t.unbind()),this.target.textContent=e}}function pC(e){this.target[this.targetName]=e}function fC(e){const t=this.classVersions||Object.create(null),r=this.target;let i=this.version||0;if(e!=null&&e.length){const n=e.split(/\s+/);for(let s=0,o=n.length;s<o;++s){const a=n[s];a!==""&&(t[a]=i,r.classList.add(a))}}if(this.classVersions=t,this.version=i+1,i!==0){i-=1;for(const n in t)t[n]===i&&r.classList.remove(n)}}class Nu extends J0{constructor(t){super(),this.binding=t,this.bind=sC,this.unbind=aC,this.updateTarget=hC,this.isBindingVolatile=$t.isVolatileBinding(this.binding)}get targetName(){return this.originalTargetName}set targetName(t){if(this.originalTargetName=t,t!==void 0)switch(t[0]){case":":if(this.cleanedTargetName=t.substr(1),this.updateTarget=pC,this.cleanedTargetName==="innerHTML"){const r=this.binding;this.binding=(i,n)=>At.createHTML(r(i,n))}break;case"?":this.cleanedTargetName=t.substr(1),this.updateTarget=dC;break;case"@":this.cleanedTargetName=t.substr(1),this.bind=oC,this.unbind=cC;break;default:this.cleanedTargetName=t,t==="class"&&(this.updateTarget=fC);break}}targetAtContent(){this.updateTarget=uC,this.unbind=lC}createBehavior(t){return new gC(t,this.binding,this.isBindingVolatile,this.bind,this.unbind,this.updateTarget,this.cleanedTargetName)}}class gC{constructor(t,r,i,n,s,o,a){this.source=null,this.context=null,this.bindingObserver=null,this.target=t,this.binding=r,this.isBindingVolatile=i,this.bind=n,this.unbind=s,this.updateTarget=o,this.targetName=a}handleChange(){this.updateTarget(this.bindingObserver.observe(this.source,this.context))}handleEvent(t){Eo.setEvent(t);const r=this.binding(this.source,this.context);Eo.setEvent(null),r!==!0&&t.preventDefault()}}let nh=null;class zu{addFactory(t){t.targetIndex=this.targetIndex,this.behaviorFactories.push(t)}captureContentBinding(t){t.targetAtContent(),this.addFactory(t)}reset(){this.behaviorFactories=[],this.targetIndex=-1}release(){nh=this}static borrow(t){const r=nh||new zu;return r.directives=t,r.reset(),nh=null,r}}function mC(e){if(e.length===1)return e[0];let t;const r=e.length,i=e.map(o=>typeof o=="string"?()=>o:(t=o.targetName||t,o.binding)),n=(o,a)=>{let l="";for(let c=0;c<r;++c)l+=i[c](o,a);return l},s=new Nu(n);return s.targetName=t,s}const xC=Fu.length;function K0(e,t){const r=t.split(Q0);if(r.length===1)return null;const i=[];for(let n=0,s=r.length;n<s;++n){const o=r[n],a=o.indexOf(Fu);let l;if(a===-1)l=o;else{const c=parseInt(o.substring(0,a));i.push(e.directives[c]),l=o.substring(a+xC)}l!==""&&i.push(l)}return i}function Mf(e,t,r=!1){const i=t.attributes;for(let n=0,s=i.length;n<s;++n){const o=i[n],a=o.value,l=K0(e,a);let c=null;l===null?r&&(c=new Nu(()=>a),c.targetName=o.name):c=mC(l),c!==null&&(t.removeAttributeNode(o),n--,s--,e.addFactory(c))}}function bC(e,t,r){const i=K0(e,t.textContent);if(i!==null){let n=t;for(let s=0,o=i.length;s<o;++s){const a=i[s],l=s===0?t:n.parentNode.insertBefore(document.createTextNode(""),n.nextSibling);typeof a=="string"?l.textContent=a:(l.textContent=" ",e.captureContentBinding(a)),n=l,e.targetIndex++,l!==t&&r.nextNode()}e.targetIndex--}}function yC(e,t){const r=e.content;document.adoptNode(r);const i=zu.borrow(t);Mf(i,e,!0);const n=i.behaviorFactories;i.reset();const s=At.createTemplateWalker(r);let o;for(;o=s.nextNode();)switch(i.targetIndex++,o.nodeType){case 1:Mf(i,o);break;case 3:bC(i,o,s);break;case 8:At.isMarker(o)&&i.addFactory(t[At.extractDirectiveIndexFromMarker(o)])}let a=0;(At.isMarker(r.firstChild)||r.childNodes.length===1&&t.length)&&(r.insertBefore(document.createComment(""),r.firstChild),a=-1);const l=i.behaviorFactories;return i.release(),{fragment:r,viewBehaviorFactories:l,hostBehaviorFactories:n,targetOffset:a}}const sh=document.createRange();class tx{constructor(t,r){this.fragment=t,this.behaviors=r,this.source=null,this.context=null,this.firstChild=t.firstChild,this.lastChild=t.lastChild}appendTo(t){t.appendChild(this.fragment)}insertBefore(t){if(this.fragment.hasChildNodes())t.parentNode.insertBefore(this.fragment,t);else{const r=this.lastChild;if(t.previousSibling===r)return;const i=t.parentNode;let n=this.firstChild,s;for(;n!==r;)s=n.nextSibling,i.insertBefore(n,t),n=s;i.insertBefore(r,t)}}remove(){const t=this.fragment,r=this.lastChild;let i=this.firstChild,n;for(;i!==r;)n=i.nextSibling,t.appendChild(i),i=n;t.appendChild(r)}dispose(){const t=this.firstChild.parentNode,r=this.lastChild;let i=this.firstChild,n;for(;i!==r;)n=i.nextSibling,t.removeChild(i),i=n;t.removeChild(r);const s=this.behaviors,o=this.source;for(let a=0,l=s.length;a<l;++a)s[a].unbind(o)}bind(t,r){const i=this.behaviors;if(this.source!==t)if(this.source!==null){const n=this.source;this.source=t,this.context=r;for(let s=0,o=i.length;s<o;++s){const a=i[s];a.unbind(n),a.bind(t,r)}}else{this.source=t,this.context=r;for(let n=0,s=i.length;n<s;++n)i[n].bind(t,r)}}unbind(){if(this.source===null)return;const t=this.behaviors,r=this.source;for(let i=0,n=t.length;i<n;++i)t[i].unbind(r);this.source=null}static disposeContiguousBatch(t){if(t.length!==0){sh.setStartBefore(t[0].firstChild),sh.setEndAfter(t[t.length-1].lastChild),sh.deleteContents();for(let r=0,i=t.length;r<i;++r){const n=t[r],s=n.behaviors,o=n.source;for(let a=0,l=s.length;a<l;++a)s[a].unbind(o)}}}}class If{constructor(t,r){this.behaviorCount=0,this.hasHostBehaviors=!1,this.fragment=null,this.targetOffset=0,this.viewBehaviorFactories=null,this.hostBehaviorFactories=null,this.html=t,this.directives=r}create(t){if(this.fragment===null){let c;const d=this.html;if(typeof d=="string"){c=document.createElement("template"),c.innerHTML=At.createHTML(d);const p=c.content.firstElementChild;p!==null&&p.tagName==="TEMPLATE"&&(c=p)}else c=d;const u=yC(c,this.directives);this.fragment=u.fragment,this.viewBehaviorFactories=u.viewBehaviorFactories,this.hostBehaviorFactories=u.hostBehaviorFactories,this.targetOffset=u.targetOffset,this.behaviorCount=this.viewBehaviorFactories.length+this.hostBehaviorFactories.length,this.hasHostBehaviors=this.hostBehaviorFactories.length>0}const r=this.fragment.cloneNode(!0),i=this.viewBehaviorFactories,n=new Array(this.behaviorCount),s=At.createTemplateWalker(r);let o=0,a=this.targetOffset,l=s.nextNode();for(let c=i.length;o<c;++o){const d=i[o],u=d.targetIndex;for(;l!==null;)if(a===u){n[o]=d.createBehavior(l);break}else l=s.nextNode(),a++}if(this.hasHostBehaviors){const c=this.hostBehaviorFactories;for(let d=0,u=c.length;d<u;++d,++o)n[o]=c[d].createBehavior(t)}return new tx(r,n)}render(t,r,i){typeof r=="string"&&(r=document.getElementById(r)),i===void 0&&(i=r);const n=this.create(i);return n.bind(t,yo),n.appendTo(r),n}}const vC=/([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;function Rt(e,...t){const r=[];let i="";for(let n=0,s=e.length-1;n<s;++n){const o=e[n];let a=t[n];if(i+=o,a instanceof If){const l=a;a=()=>l}if(typeof a=="function"&&(a=new Nu(a)),a instanceof J0){const l=vC.exec(o);l!==null&&(a.targetName=l[2])}a instanceof sc?(i+=a.createPlaceholder(r.length),r.push(a)):i+=a}return i+=e[e.length-1],new If(i,r)}class Ke{constructor(){this.targets=new WeakSet}addStylesTo(t){this.targets.add(t)}removeStylesFrom(t){this.targets.delete(t)}isAttachedTo(t){return this.targets.has(t)}withBehaviors(...t){return this.behaviors=this.behaviors===null?t:this.behaviors.concat(t),this}}Ke.create=(()=>{if(At.supportsAdoptedStyleSheets){const e=new Map;return t=>new wC(t,e)}return e=>new SC(e)})();function Hu(e){return e.map(t=>t instanceof Ke?Hu(t.styles):[t]).reduce((t,r)=>t.concat(r),[])}function ex(e){return e.map(t=>t instanceof Ke?t.behaviors:null).reduce((t,r)=>r===null?t:(t===null&&(t=[]),t.concat(r)),null)}const rx=Symbol("prependToAdoptedStyleSheets");function ix(e){const t=[],r=[];return e.forEach(i=>(i[rx]?t:r).push(i)),{prepend:t,append:r}}let nx=(e,t)=>{const{prepend:r,append:i}=ix(t);e.adoptedStyleSheets=[...r,...e.adoptedStyleSheets,...i]},sx=(e,t)=>{e.adoptedStyleSheets=e.adoptedStyleSheets.filter(r=>t.indexOf(r)===-1)};if(At.supportsAdoptedStyleSheets)try{document.adoptedStyleSheets.push(),document.adoptedStyleSheets.splice(),nx=(e,t)=>{const{prepend:r,append:i}=ix(t);e.adoptedStyleSheets.splice(0,0,...r),e.adoptedStyleSheets.push(...i)},sx=(e,t)=>{for(const r of t){const i=e.adoptedStyleSheets.indexOf(r);i!==-1&&e.adoptedStyleSheets.splice(i,1)}}}catch{}class wC extends Ke{constructor(t,r){super(),this.styles=t,this.styleSheetCache=r,this._styleSheets=void 0,this.behaviors=ex(t)}get styleSheets(){if(this._styleSheets===void 0){const t=this.styles,r=this.styleSheetCache;this._styleSheets=Hu(t).map(i=>{if(i instanceof CSSStyleSheet)return i;let n=r.get(i);return n===void 0&&(n=new CSSStyleSheet,n.replaceSync(i),r.set(i,n)),n})}return this._styleSheets}addStylesTo(t){nx(t,this.styleSheets),super.addStylesTo(t)}removeStylesFrom(t){sx(t,this.styleSheets),super.removeStylesFrom(t)}}let kC=0;function CC(){return`fast-style-class-${++kC}`}class SC extends Ke{constructor(t){super(),this.styles=t,this.behaviors=null,this.behaviors=ex(t),this.styleSheets=Hu(t),this.styleClass=CC()}addStylesTo(t){const r=this.styleSheets,i=this.styleClass;t=this.normalizeTarget(t);for(let n=0;n<r.length;n++){const s=document.createElement("style");s.innerHTML=r[n],s.className=i,t.append(s)}super.addStylesTo(t)}removeStylesFrom(t){t=this.normalizeTarget(t);const r=t.querySelectorAll(`.${this.styleClass}`);for(let i=0,n=r.length;i<n;++i)t.removeChild(r[i]);super.removeStylesFrom(t)}isAttachedTo(t){return super.isAttachedTo(this.normalizeTarget(t))}normalizeTarget(t){return t===document?document.body:t}}const xl=Object.freeze({locate:Y0()}),ox={toView(e){return e?"true":"false"},fromView(e){return!(e==null||e==="false"||e===!1||e===0)}},Ir={toView(e){if(e==null)return null;const t=e*1;return isNaN(t)?null:t.toString()},fromView(e){if(e==null)return null;const t=e*1;return isNaN(t)?null:t}};class bl{constructor(t,r,i=r.toLowerCase(),n="reflect",s){this.guards=new Set,this.Owner=t,this.name=r,this.attribute=i,this.mode=n,this.converter=s,this.fieldName=`_${r}`,this.callbackName=`${r}Changed`,this.hasCallback=this.callbackName in t.prototype,n==="boolean"&&s===void 0&&(this.converter=ox)}setValue(t,r){const i=t[this.fieldName],n=this.converter;n!==void 0&&(r=n.fromView(r)),i!==r&&(t[this.fieldName]=r,this.tryReflectToAttribute(t),this.hasCallback&&t[this.callbackName](i,r),t.$fastController.notify(this.name))}getValue(t){return $t.track(t,this.name),t[this.fieldName]}onAttributeChangedCallback(t,r){this.guards.has(t)||(this.guards.add(t),this.setValue(t,r),this.guards.delete(t))}tryReflectToAttribute(t){const r=this.mode,i=this.guards;i.has(t)||r==="fromView"||At.queueUpdate(()=>{i.add(t);const n=t[this.fieldName];switch(r){case"reflect":const s=this.converter;At.setAttribute(t,this.attribute,s!==void 0?s.toView(n):n);break;case"boolean":At.setBooleanAttribute(t,this.attribute,n);break}i.delete(t)})}static collect(t,...r){const i=[];r.push(xl.locate(t));for(let n=0,s=r.length;n<s;++n){const o=r[n];if(o!==void 0)for(let a=0,l=o.length;a<l;++a){const c=o[a];typeof c=="string"?i.push(new bl(t,c)):i.push(new bl(t,c.property,c.attribute,c.mode,c.converter))}}return i}}function U(e,t){let r;function i(n,s){arguments.length>1&&(r.property=s),xl.locate(n.constructor).push(r)}if(arguments.length>1){r={},i(e,t);return}return r=e===void 0?{}:e,i}const Of={mode:"open"},Rf={},kd=jo.getById(4,()=>{const e=new Map;return Object.freeze({register(t){return e.has(t.type)?!1:(e.set(t.type,t),!0)},getByType(t){return e.get(t)}})});class Jo{constructor(t,r=t.definition){typeof r=="string"&&(r={name:r}),this.type=t,this.name=r.name,this.template=r.template;const i=bl.collect(t,r.attributes),n=new Array(i.length),s={},o={};for(let a=0,l=i.length;a<l;++a){const c=i[a];n[a]=c.attribute,s[c.name]=c,o[c.attribute]=c}this.attributes=i,this.observedAttributes=n,this.propertyLookup=s,this.attributeLookup=o,this.shadowOptions=r.shadowOptions===void 0?Of:r.shadowOptions===null?void 0:Object.assign(Object.assign({},Of),r.shadowOptions),this.elementOptions=r.elementOptions===void 0?Rf:Object.assign(Object.assign({},Rf),r.elementOptions),this.styles=r.styles===void 0?void 0:Array.isArray(r.styles)?Ke.create(r.styles):r.styles instanceof Ke?r.styles:Ke.create([r.styles])}get isDefined(){return!!kd.getByType(this.type)}define(t=customElements){const r=this.type;if(kd.register(this)){const i=this.attributes,n=r.prototype;for(let s=0,o=i.length;s<o;++s)$t.defineProperty(n,i[s]);Reflect.defineProperty(r,"observedAttributes",{value:this.observedAttributes,enumerable:!0})}return t.get(this.name)||t.define(this.name,r,this.elementOptions),this}}Jo.forType=kd.getByType;const ax=new WeakMap,_C={bubbles:!0,composed:!0,cancelable:!0};function oh(e){return e.shadowRoot||ax.get(e)||null}class qu extends Z0{constructor(t,r){super(t),this.boundObservables=null,this.behaviors=null,this.needsInitialization=!0,this._template=null,this._styles=null,this._isConnected=!1,this.$fastController=this,this.view=null,this.element=t,this.definition=r;const i=r.shadowOptions;if(i!==void 0){const s=t.attachShadow(i);i.mode==="closed"&&ax.set(t,s)}const n=$t.getAccessors(t);if(n.length>0){const s=this.boundObservables=Object.create(null);for(let o=0,a=n.length;o<a;++o){const l=n[o].name,c=t[l];c!==void 0&&(delete t[l],s[l]=c)}}}get isConnected(){return $t.track(this,"isConnected"),this._isConnected}setIsConnected(t){this._isConnected=t,$t.notify(this,"isConnected")}get template(){return this._template}set template(t){this._template!==t&&(this._template=t,this.needsInitialization||this.renderTemplate(t))}get styles(){return this._styles}set styles(t){this._styles!==t&&(this._styles!==null&&this.removeStyles(this._styles),this._styles=t,!this.needsInitialization&&t!==null&&this.addStyles(t))}addStyles(t){const r=oh(this.element)||this.element.getRootNode();if(t instanceof HTMLStyleElement)r.append(t);else if(!t.isAttachedTo(r)){const i=t.behaviors;t.addStylesTo(r),i!==null&&this.addBehaviors(i)}}removeStyles(t){const r=oh(this.element)||this.element.getRootNode();if(t instanceof HTMLStyleElement)r.removeChild(t);else if(t.isAttachedTo(r)){const i=t.behaviors;t.removeStylesFrom(r),i!==null&&this.removeBehaviors(i)}}addBehaviors(t){const r=this.behaviors||(this.behaviors=new Map),i=t.length,n=[];for(let s=0;s<i;++s){const o=t[s];r.has(o)?r.set(o,r.get(o)+1):(r.set(o,1),n.push(o))}if(this._isConnected){const s=this.element;for(let o=0;o<n.length;++o)n[o].bind(s,yo)}}removeBehaviors(t,r=!1){const i=this.behaviors;if(i===null)return;const n=t.length,s=[];for(let o=0;o<n;++o){const a=t[o];if(i.has(a)){const l=i.get(a)-1;l===0||r?i.delete(a)&&s.push(a):i.set(a,l)}}if(this._isConnected){const o=this.element;for(let a=0;a<s.length;++a)s[a].unbind(o)}}onConnectedCallback(){if(this._isConnected)return;const t=this.element;this.needsInitialization?this.finishInitialization():this.view!==null&&this.view.bind(t,yo);const r=this.behaviors;if(r!==null)for(const[i]of r)i.bind(t,yo);this.setIsConnected(!0)}onDisconnectedCallback(){if(!this._isConnected)return;this.setIsConnected(!1);const t=this.view;t!==null&&t.unbind();const r=this.behaviors;if(r!==null){const i=this.element;for(const[n]of r)n.unbind(i)}}onAttributeChangedCallback(t,r,i){const n=this.definition.attributeLookup[t];n!==void 0&&n.onAttributeChangedCallback(this.element,i)}emit(t,r,i){return this._isConnected?this.element.dispatchEvent(new CustomEvent(t,Object.assign(Object.assign({detail:r},_C),i))):!1}finishInitialization(){const t=this.element,r=this.boundObservables;if(r!==null){const n=Object.keys(r);for(let s=0,o=n.length;s<o;++s){const a=n[s];t[a]=r[a]}this.boundObservables=null}const i=this.definition;this._template===null&&(this.element.resolveTemplate?this._template=this.element.resolveTemplate():i.template&&(this._template=i.template||null)),this._template!==null&&this.renderTemplate(this._template),this._styles===null&&(this.element.resolveStyles?this._styles=this.element.resolveStyles():i.styles&&(this._styles=i.styles||null)),this._styles!==null&&this.addStyles(this._styles),this.needsInitialization=!1}renderTemplate(t){const r=this.element,i=oh(r)||r;this.view!==null?(this.view.dispose(),this.view=null):this.needsInitialization||At.removeChildNodes(i),t&&(this.view=t.render(r,i,r))}static forCustomElement(t){const r=t.$fastController;if(r!==void 0)return r;const i=Jo.forType(t.constructor);if(i===void 0)throw new Error("Missing FASTElement definition.");return t.$fastController=new qu(t,i)}}function Df(e){return class extends e{constructor(){super(),qu.forCustomElement(this)}$emit(t,r,i){return this.$fastController.emit(t,r,i)}connectedCallback(){this.$fastController.onConnectedCallback()}disconnectedCallback(){this.$fastController.onDisconnectedCallback()}attributeChangedCallback(t,r,i){this.$fastController.onAttributeChangedCallback(t,r,i)}}}const oc=Object.assign(Df(HTMLElement),{from(e){return Df(e)},define(e,t){return new Jo(e,t).define().type}});class lx{createCSS(){return""}createBehavior(){}}function TC(e,t){const r=[];let i="";const n=[];for(let s=0,o=e.length-1;s<o;++s){i+=e[s];let a=t[s];if(a instanceof lx){const l=a.createBehavior();a=a.createCSS(),l&&n.push(l)}a instanceof Ke||a instanceof CSSStyleSheet?(i.trim()!==""&&(r.push(i),i=""),r.push(a)):i+=a}return i+=e[e.length-1],i.trim()!==""&&r.push(i),{styles:r,behaviors:n}}function Kt(e,...t){const{styles:r,behaviors:i}=TC(e,t),n=Ke.create(r);return i.length&&n.withBehaviors(...i),n}function $r(e,t,r){return{index:e,removed:t,addedCount:r}}const cx=0,hx=1,Cd=2,Sd=3;function $C(e,t,r,i,n,s){const o=s-n+1,a=r-t+1,l=new Array(o);let c,d;for(let u=0;u<o;++u)l[u]=new Array(a),l[u][0]=u;for(let u=0;u<a;++u)l[0][u]=u;for(let u=1;u<o;++u)for(let p=1;p<a;++p)e[t+p-1]===i[n+u-1]?l[u][p]=l[u-1][p-1]:(c=l[u-1][p]+1,d=l[u][p-1]+1,l[u][p]=c<d?c:d);return l}function AC(e){let t=e.length-1,r=e[0].length-1,i=e[t][r];const n=[];for(;t>0||r>0;){if(t===0){n.push(Cd),r--;continue}if(r===0){n.push(Sd),t--;continue}const s=e[t-1][r-1],o=e[t-1][r],a=e[t][r-1];let l;o<a?l=o<s?o:s:l=a<s?a:s,l===s?(s===i?n.push(cx):(n.push(hx),i=s),t--,r--):l===o?(n.push(Sd),t--,i=o):(n.push(Cd),r--,i=a)}return n.reverse(),n}function jC(e,t,r){for(let i=0;i<r;++i)if(e[i]!==t[i])return i;return r}function EC(e,t,r){let i=e.length,n=t.length,s=0;for(;s<r&&e[--i]===t[--n];)s++;return s}function LC(e,t,r,i){return t<r||i<e?-1:t===r||i===e?0:e<r?t<i?t-r:i-r:i<t?i-e:t-e}function dx(e,t,r,i,n,s){let o=0,a=0;const l=Math.min(r-t,s-n);if(t===0&&n===0&&(o=jC(e,i,l)),r===e.length&&s===i.length&&(a=EC(e,i,l-o)),t+=o,n+=o,r-=a,s-=a,r-t===0&&s-n===0)return sn;if(t===r){const g=$r(t,[],0);for(;n<s;)g.removed.push(i[n++]);return[g]}else if(n===s)return[$r(t,[],r-t)];const c=AC($C(e,t,r,i,n,s)),d=[];let u,p=t,f=n;for(let g=0;g<c.length;++g)switch(c[g]){case cx:u!==void 0&&(d.push(u),u=void 0),p++,f++;break;case hx:u===void 0&&(u=$r(p,[],0)),u.addedCount++,p++,u.removed.push(i[f]),f++;break;case Cd:u===void 0&&(u=$r(p,[],0)),u.addedCount++,p++;break;case Sd:u===void 0&&(u=$r(p,[],0)),u.removed.push(i[f]),f++;break}return u!==void 0&&d.push(u),d}const Ff=Array.prototype.push;function BC(e,t,r,i){const n=$r(t,r,i);let s=!1,o=0;for(let a=0;a<e.length;a++){const l=e[a];if(l.index+=o,s)continue;const c=LC(n.index,n.index+n.removed.length,l.index,l.index+l.addedCount);if(c>=0){e.splice(a,1),a--,o-=l.addedCount-l.removed.length,n.addedCount+=l.addedCount-c;const d=n.removed.length+l.removed.length-c;if(!n.addedCount&&!d)s=!0;else{let u=l.removed;if(n.index<l.index){const p=n.removed.slice(0,l.index-n.index);Ff.apply(p,u),u=p}if(n.index+n.removed.length>l.index+l.addedCount){const p=n.removed.slice(l.index+l.addedCount-n.index);Ff.apply(u,p)}n.removed=u,l.index<n.index&&(n.index=l.index)}}else if(n.index<l.index){s=!0,e.splice(a,0,n),a++;const d=n.addedCount-n.removed.length;l.index+=d,o+=d}}s||e.push(n)}function MC(e){const t=[];for(let r=0,i=e.length;r<i;r++){const n=e[r];BC(t,n.index,n.removed,n.addedCount)}return t}function IC(e,t){let r=[];const i=MC(t);for(let n=0,s=i.length;n<s;++n){const o=i[n];if(o.addedCount===1&&o.removed.length===1){o.removed[0]!==e[o.index]&&r.push(o);continue}r=r.concat(dx(e,o.index,o.index+o.addedCount,o.removed,0,o.removed.length))}return r}let Pf=!1;function ah(e,t){let r=e.index;const i=t.length;return r>i?r=i-e.addedCount:r<0&&(r=i+e.removed.length+r-e.addedCount),r<0&&(r=0),e.index=r,e}class OC extends ml{constructor(t){super(t),this.oldCollection=void 0,this.splices=void 0,this.needsQueue=!0,this.call=this.flush,Reflect.defineProperty(t,"$fastController",{value:this,enumerable:!1})}subscribe(t){this.flush(),super.subscribe(t)}addSplice(t){this.splices===void 0?this.splices=[t]:this.splices.push(t),this.needsQueue&&(this.needsQueue=!1,At.queueUpdate(this))}reset(t){this.oldCollection=t,this.needsQueue&&(this.needsQueue=!1,At.queueUpdate(this))}flush(){const t=this.splices,r=this.oldCollection;if(t===void 0&&r===void 0)return;this.needsQueue=!0,this.splices=void 0,this.oldCollection=void 0;const i=r===void 0?IC(this.source,t):dx(this.source,0,this.source.length,r,0,r.length);this.notify(i)}}function RC(){if(Pf)return;Pf=!0,$t.setArrayObserverFactory(l=>new OC(l));const e=Array.prototype;if(e.$fastPatch)return;Reflect.defineProperty(e,"$fastPatch",{value:1,enumerable:!1});const t=e.pop,r=e.push,i=e.reverse,n=e.shift,s=e.sort,o=e.splice,a=e.unshift;e.pop=function(){const l=this.length>0,c=t.apply(this,arguments),d=this.$fastController;return d!==void 0&&l&&d.addSplice($r(this.length,[c],0)),c},e.push=function(){const l=r.apply(this,arguments),c=this.$fastController;return c!==void 0&&c.addSplice(ah($r(this.length-arguments.length,[],arguments.length),this)),l},e.reverse=function(){let l;const c=this.$fastController;c!==void 0&&(c.flush(),l=this.slice());const d=i.apply(this,arguments);return c!==void 0&&c.reset(l),d},e.shift=function(){const l=this.length>0,c=n.apply(this,arguments),d=this.$fastController;return d!==void 0&&l&&d.addSplice($r(0,[c],0)),c},e.sort=function(){let l;const c=this.$fastController;c!==void 0&&(c.flush(),l=this.slice());const d=s.apply(this,arguments);return c!==void 0&&c.reset(l),d},e.splice=function(){const l=o.apply(this,arguments),c=this.$fastController;return c!==void 0&&c.addSplice(ah($r(+arguments[0],l,arguments.length>2?arguments.length-2:0),this)),l},e.unshift=function(){const l=a.apply(this,arguments),c=this.$fastController;return c!==void 0&&c.addSplice(ah($r(0,[],arguments.length),this)),l}}class DC{constructor(t,r){this.target=t,this.propertyName=r}bind(t){t[this.propertyName]=this.target}unbind(){}}function He(e){return new Pu("fast-ref",DC,e)}const ux=e=>typeof e=="function",FC=()=>null;function Nf(e){return e===void 0?FC:ux(e)?e:()=>e}function Wu(e,t,r){const i=ux(e)?e:()=>e,n=Nf(t),s=Nf(r);return(o,a)=>i(o,a)?n(o,a):s(o,a)}function PC(e,t,r,i){e.bind(t[r],i)}function NC(e,t,r,i){const n=Object.create(i);n.index=r,n.length=t.length,e.bind(t[r],n)}class zC{constructor(t,r,i,n,s,o){this.location=t,this.itemsBinding=r,this.templateBinding=n,this.options=o,this.source=null,this.views=[],this.items=null,this.itemsObserver=null,this.originalContext=void 0,this.childContext=void 0,this.bindView=PC,this.itemsBindingObserver=$t.binding(r,this,i),this.templateBindingObserver=$t.binding(n,this,s),o.positioning&&(this.bindView=NC)}bind(t,r){this.source=t,this.originalContext=r,this.childContext=Object.create(r),this.childContext.parent=t,this.childContext.parentContext=this.originalContext,this.items=this.itemsBindingObserver.observe(t,this.originalContext),this.template=this.templateBindingObserver.observe(t,this.originalContext),this.observeItems(!0),this.refreshAllViews()}unbind(){this.source=null,this.items=null,this.itemsObserver!==null&&this.itemsObserver.unsubscribe(this),this.unbindAllViews(),this.itemsBindingObserver.disconnect(),this.templateBindingObserver.disconnect()}handleChange(t,r){t===this.itemsBinding?(this.items=this.itemsBindingObserver.observe(this.source,this.originalContext),this.observeItems(),this.refreshAllViews()):t===this.templateBinding?(this.template=this.templateBindingObserver.observe(this.source,this.originalContext),this.refreshAllViews(!0)):this.updateViews(r)}observeItems(t=!1){if(!this.items){this.items=sn;return}const r=this.itemsObserver,i=this.itemsObserver=$t.getNotifier(this.items),n=r!==i;n&&r!==null&&r.unsubscribe(this),(n||t)&&i.subscribe(this)}updateViews(t){const r=this.childContext,i=this.views,n=this.bindView,s=this.items,o=this.template,a=this.options.recycle,l=[];let c=0,d=0;for(let u=0,p=t.length;u<p;++u){const f=t[u],g=f.removed;let x=0,v=f.index;const y=v+f.addedCount,b=i.splice(f.index,g.length),w=d=l.length+b.length;for(;v<y;++v){const S=i[v],_=S?S.firstChild:this.location;let A;a&&d>0?(x<=w&&b.length>0?(A=b[x],x++):(A=l[c],c++),d--):A=o.create(),i.splice(v,0,A),n(A,s,v,r),A.insertBefore(_)}b[x]&&l.push(...b.slice(x))}for(let u=c,p=l.length;u<p;++u)l[u].dispose();if(this.options.positioning)for(let u=0,p=i.length;u<p;++u){const f=i[u].context;f.length=p,f.index=u}}refreshAllViews(t=!1){const r=this.items,i=this.childContext,n=this.template,s=this.location,o=this.bindView;let a=r.length,l=this.views,c=l.length;if((a===0||t||!this.options.recycle)&&(tx.disposeContiguousBatch(l),c=0),c===0){this.views=l=new Array(a);for(let d=0;d<a;++d){const u=n.create();o(u,r,d,i),l[d]=u,u.insertBefore(s)}}else{let d=0;for(;d<a;++d)if(d<c){const p=l[d];o(p,r,d,i)}else{const p=n.create();o(p,r,d,i),l.push(p),p.insertBefore(s)}const u=l.splice(d,c-d);for(d=0,a=u.length;d<a;++d)u[d].dispose()}}unbindAllViews(){const t=this.views;for(let r=0,i=t.length;r<i;++r)t[r].unbind()}}class px extends sc{constructor(t,r,i){super(),this.itemsBinding=t,this.templateBinding=r,this.options=i,this.createPlaceholder=At.createBlockPlaceholder,RC(),this.isItemsBindingVolatile=$t.isVolatileBinding(t),this.isTemplateBindingVolatile=$t.isVolatileBinding(r)}createBehavior(t){return new zC(t,this.itemsBinding,this.isItemsBindingVolatile,this.templateBinding,this.isTemplateBindingVolatile,this.options)}}function Vu(e){return e?function(t,r,i){return t.nodeType===1&&t.matches(e)}:function(t,r,i){return t.nodeType===1}}class fx{constructor(t,r){this.target=t,this.options=r,this.source=null}bind(t){const r=this.options.property;this.shouldUpdate=$t.getAccessors(t).some(i=>i.name===r),this.source=t,this.updateTarget(this.computeNodes()),this.shouldUpdate&&this.observe()}unbind(){this.updateTarget(sn),this.source=null,this.shouldUpdate&&this.disconnect()}handleEvent(){this.updateTarget(this.computeNodes())}computeNodes(){let t=this.getNodes();return this.options.filter!==void 0&&(t=t.filter(this.options.filter)),t}updateTarget(t){this.source[this.options.property]=t}}class HC extends fx{constructor(t,r){super(t,r)}observe(){this.target.addEventListener("slotchange",this)}disconnect(){this.target.removeEventListener("slotchange",this)}getNodes(){return this.target.assignedNodes(this.options)}}function xr(e){return typeof e=="string"&&(e={property:e}),new Pu("fast-slotted",HC,e)}class qC extends fx{constructor(t,r){super(t,r),this.observer=null,r.childList=!0}observe(){this.observer===null&&(this.observer=new MutationObserver(this.handleEvent.bind(this))),this.observer.observe(this.target,this.options)}disconnect(){this.observer.disconnect()}getNodes(){return"subtree"in this.options?Array.from(this.target.querySelectorAll(this.options.selector)):Array.from(this.target.childNodes)}}function gx(e){return typeof e=="string"&&(e={property:e}),new Pu("fast-children",qC,e)}class Ss{handleStartContentChange(){this.startContainer.classList.toggle("start",this.start.assignedNodes().length>0)}handleEndContentChange(){this.endContainer.classList.toggle("end",this.end.assignedNodes().length>0)}}const _s=(e,t)=>Rt`
    <span
        part="end"
        ${He("endContainer")}
        class=${r=>t.end?"end":void 0}
    >
        <slot name="end" ${He("end")} @slotchange="${r=>r.handleEndContentChange()}">
            ${t.end||""}
        </slot>
    </span>
`,Ts=(e,t)=>Rt`
    <span
        part="start"
        ${He("startContainer")}
        class="${r=>t.start?"start":void 0}"
    >
        <slot
            name="start"
            ${He("start")}
            @slotchange="${r=>r.handleStartContentChange()}"
        >
            ${t.start||""}
        </slot>
    </span>
`;Rt`
    <span part="end" ${He("endContainer")}>
        <slot
            name="end"
            ${He("end")}
            @slotchange="${e=>e.handleEndContentChange()}"
        ></slot>
    </span>
`;Rt`
    <span part="start" ${He("startContainer")}>
        <slot
            name="start"
            ${He("start")}
            @slotchange="${e=>e.handleStartContentChange()}"
        ></slot>
    </span>
`;/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */function I(e,t,r,i){var n=arguments.length,s=n<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,r):i,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s}const lh=new Map;"metadata"in Reflect||(Reflect.metadata=function(e,t){return function(r){Reflect.defineMetadata(e,t,r)}},Reflect.defineMetadata=function(e,t,r){let i=lh.get(r);i===void 0&&lh.set(r,i=new Map),i.set(e,t)},Reflect.getOwnMetadata=function(e,t){const r=lh.get(t);if(r!==void 0)return r.get(e)});class WC{constructor(t,r){this.container=t,this.key=r}instance(t){return this.registerResolver(0,t)}singleton(t){return this.registerResolver(1,t)}transient(t){return this.registerResolver(2,t)}callback(t){return this.registerResolver(3,t)}cachedCallback(t){return this.registerResolver(3,xx(t))}aliasTo(t){return this.registerResolver(5,t)}registerResolver(t,r){const{container:i,key:n}=this;return this.container=this.key=void 0,i.registerResolver(n,new mr(n,t,r))}}function Hs(e){const t=e.slice(),r=Object.keys(e),i=r.length;let n;for(let s=0;s<i;++s)n=r[s],bx(n)||(t[n]=e[n]);return t}const VC=Object.freeze({none(e){throw Error(`${e.toString()} not registered, did you forget to add @singleton()?`)},singleton(e){return new mr(e,1,e)},transient(e){return new mr(e,2,e)}}),ch=Object.freeze({default:Object.freeze({parentLocator:()=>null,responsibleForOwnerRequests:!1,defaultResolver:VC.singleton})}),zf=new Map;function Hf(e){return t=>Reflect.getOwnMetadata(e,t)}let qf=null;const Jt=Object.freeze({createContainer(e){return new vo(null,Object.assign({},ch.default,e))},findResponsibleContainer(e){const t=e.$$container$$;return t&&t.responsibleForOwnerRequests?t:Jt.findParentContainer(e)},findParentContainer(e){const t=new CustomEvent(mx,{bubbles:!0,composed:!0,cancelable:!0,detail:{container:void 0}});return e.dispatchEvent(t),t.detail.container||Jt.getOrCreateDOMContainer()},getOrCreateDOMContainer(e,t){return e?e.$$container$$||new vo(e,Object.assign({},ch.default,t,{parentLocator:Jt.findParentContainer})):qf||(qf=new vo(null,Object.assign({},ch.default,t,{parentLocator:()=>null})))},getDesignParamtypes:Hf("design:paramtypes"),getAnnotationParamtypes:Hf("di:paramtypes"),getOrCreateAnnotationParamTypes(e){let t=this.getAnnotationParamtypes(e);return t===void 0&&Reflect.defineMetadata("di:paramtypes",t=[],e),t},getDependencies(e){let t=zf.get(e);if(t===void 0){const r=e.inject;if(r===void 0){const i=Jt.getDesignParamtypes(e),n=Jt.getAnnotationParamtypes(e);if(i===void 0)if(n===void 0){const s=Object.getPrototypeOf(e);typeof s=="function"&&s!==Function.prototype?t=Hs(Jt.getDependencies(s)):t=[]}else t=Hs(n);else if(n===void 0)t=Hs(i);else{t=Hs(i);let s=n.length,o;for(let c=0;c<s;++c)o=n[c],o!==void 0&&(t[c]=o);const a=Object.keys(n);s=a.length;let l;for(let c=0;c<s;++c)l=a[c],bx(l)||(t[l]=n[l])}}else t=Hs(r);zf.set(e,t)}return t},defineProperty(e,t,r,i=!1){const n=`$di_${t}`;Reflect.defineProperty(e,t,{get:function(){let s=this[n];if(s===void 0&&(s=(this instanceof HTMLElement?Jt.findResponsibleContainer(this):Jt.getOrCreateDOMContainer()).get(r),this[n]=s,i&&this instanceof oc)){const a=this.$fastController,l=()=>{const d=Jt.findResponsibleContainer(this).get(r),u=this[n];d!==u&&(this[n]=s,a.notify(t))};a.subscribe({handleChange:l},"isConnected")}return s}})},createInterface(e,t){const r=typeof e=="function"?e:t,i=typeof e=="string"?e:e&&"friendlyName"in e&&e.friendlyName||Gf,n=typeof e=="string"?!1:e&&"respectConnection"in e&&e.respectConnection||!1,s=function(o,a,l){if(o==null||new.target!==void 0)throw new Error(`No registration for interface: '${s.friendlyName}'`);if(a)Jt.defineProperty(o,a,s,n);else{const c=Jt.getOrCreateAnnotationParamTypes(o);c[l]=s}};return s.$isInterface=!0,s.friendlyName=i??"(anonymous)",r!=null&&(s.register=function(o,a){return r(new WC(o,a??s))}),s.toString=function(){return`InterfaceSymbol<${s.friendlyName}>`},s},inject(...e){return function(t,r,i){if(typeof i=="number"){const n=Jt.getOrCreateAnnotationParamTypes(t),s=e[0];s!==void 0&&(n[i]=s)}else if(r)Jt.defineProperty(t,r,e[0]);else{const n=i?Jt.getOrCreateAnnotationParamTypes(i.value):Jt.getOrCreateAnnotationParamTypes(t);let s;for(let o=0;o<e.length;++o)s=e[o],s!==void 0&&(n[o]=s)}}},transient(e){return e.register=function(r){return Lo.transient(e,e).register(r)},e.registerInRequestor=!1,e},singleton(e,t=GC){return e.register=function(i){return Lo.singleton(e,e).register(i)},e.registerInRequestor=t.scoped,e}}),UC=Jt.createInterface("Container");Jt.inject;const GC={scoped:!1};class mr{constructor(t,r,i){this.key=t,this.strategy=r,this.state=i,this.resolving=!1}get $isResolver(){return!0}register(t){return t.registerResolver(this.key,this)}resolve(t,r){switch(this.strategy){case 0:return this.state;case 1:{if(this.resolving)throw new Error(`Cyclic dependency found: ${this.state.name}`);return this.resolving=!0,this.state=t.getFactory(this.state).construct(r),this.strategy=0,this.resolving=!1,this.state}case 2:{const i=t.getFactory(this.state);if(i===null)throw new Error(`Resolver for ${String(this.key)} returned a null factory`);return i.construct(r)}case 3:return this.state(t,r,this);case 4:return this.state[0].resolve(t,r);case 5:return r.get(this.state);default:throw new Error(`Invalid resolver strategy specified: ${this.strategy}.`)}}getFactory(t){var r,i,n;switch(this.strategy){case 1:case 2:return t.getFactory(this.state);case 5:return(n=(i=(r=t.getResolver(this.state))===null||r===void 0?void 0:r.getFactory)===null||i===void 0?void 0:i.call(r,t))!==null&&n!==void 0?n:null;default:return null}}}function Wf(e){return this.get(e)}function YC(e,t){return t(e)}class XC{constructor(t,r){this.Type=t,this.dependencies=r,this.transformers=null}construct(t,r){let i;return r===void 0?i=new this.Type(...this.dependencies.map(Wf,t)):i=new this.Type(...this.dependencies.map(Wf,t),...r),this.transformers==null?i:this.transformers.reduce(YC,i)}registerTransformer(t){(this.transformers||(this.transformers=[])).push(t)}}const QC={$isResolver:!0,resolve(e,t){return t}};function Ga(e){return typeof e.register=="function"}function ZC(e){return Ga(e)&&typeof e.registerInRequestor=="boolean"}function Vf(e){return ZC(e)&&e.registerInRequestor}function JC(e){return e.prototype!==void 0}const KC=new Set(["Array","ArrayBuffer","Boolean","DataView","Date","Error","EvalError","Float32Array","Float64Array","Function","Int8Array","Int16Array","Int32Array","Map","Number","Object","Promise","RangeError","ReferenceError","RegExp","Set","SharedArrayBuffer","String","SyntaxError","TypeError","Uint8Array","Uint8ClampedArray","Uint16Array","Uint32Array","URIError","WeakMap","WeakSet"]),mx="__DI_LOCATE_PARENT__",hh=new Map;class vo{constructor(t,r){this.owner=t,this.config=r,this._parent=void 0,this.registerDepth=0,this.context=null,t!==null&&(t.$$container$$=this),this.resolvers=new Map,this.resolvers.set(UC,QC),t instanceof Node&&t.addEventListener(mx,i=>{i.composedPath()[0]!==this.owner&&(i.detail.container=this,i.stopImmediatePropagation())})}get parent(){return this._parent===void 0&&(this._parent=this.config.parentLocator(this.owner)),this._parent}get depth(){return this.parent===null?0:this.parent.depth+1}get responsibleForOwnerRequests(){return this.config.responsibleForOwnerRequests}registerWithContext(t,...r){return this.context=t,this.register(...r),this.context=null,this}register(...t){if(++this.registerDepth===100)throw new Error("Unable to autoregister dependency");let r,i,n,s,o;const a=this.context;for(let l=0,c=t.length;l<c;++l)if(r=t[l],!!Yf(r))if(Ga(r))r.register(this,a);else if(JC(r))Lo.singleton(r,r).register(this);else for(i=Object.keys(r),s=0,o=i.length;s<o;++s)n=r[i[s]],Yf(n)&&(Ga(n)?n.register(this,a):this.register(n));return--this.registerDepth,this}registerResolver(t,r){va(t);const i=this.resolvers,n=i.get(t);return n==null?i.set(t,r):n instanceof mr&&n.strategy===4?n.state.push(r):i.set(t,new mr(t,4,[n,r])),r}registerTransformer(t,r){const i=this.getResolver(t);if(i==null)return!1;if(i.getFactory){const n=i.getFactory(this);return n==null?!1:(n.registerTransformer(r),!0)}return!1}getResolver(t,r=!0){if(va(t),t.resolve!==void 0)return t;let i=this,n;for(;i!=null;)if(n=i.resolvers.get(t),n==null){if(i.parent==null){const s=Vf(t)?this:i;return r?this.jitRegister(t,s):null}i=i.parent}else return n;return null}has(t,r=!1){return this.resolvers.has(t)?!0:r&&this.parent!=null?this.parent.has(t,!0):!1}get(t){if(va(t),t.$isResolver)return t.resolve(this,this);let r=this,i;for(;r!=null;)if(i=r.resolvers.get(t),i==null){if(r.parent==null){const n=Vf(t)?this:r;return i=this.jitRegister(t,n),i.resolve(r,this)}r=r.parent}else return i.resolve(r,this);throw new Error(`Unable to resolve key: ${String(t)}`)}getAll(t,r=!1){va(t);const i=this;let n=i,s;if(r){let o=sn;for(;n!=null;)s=n.resolvers.get(t),s!=null&&(o=o.concat(Uf(s,n,i))),n=n.parent;return o}else for(;n!=null;)if(s=n.resolvers.get(t),s==null){if(n=n.parent,n==null)return sn}else return Uf(s,n,i);return sn}getFactory(t){let r=hh.get(t);if(r===void 0){if(t5(t))throw new Error(`${t.name} is a native function and therefore cannot be safely constructed by DI. If this is intentional, please use a callback or cachedCallback resolver.`);hh.set(t,r=new XC(t,Jt.getDependencies(t)))}return r}registerFactory(t,r){hh.set(t,r)}createChild(t){return new vo(null,Object.assign({},this.config,t,{parentLocator:()=>this}))}jitRegister(t,r){if(typeof t!="function")throw new Error(`Attempted to jitRegister something that is not a constructor: '${t}'. Did you forget to register this dependency?`);if(KC.has(t.name))throw new Error(`Attempted to jitRegister an intrinsic type: ${t.name}. Did you forget to add @inject(Key)`);if(Ga(t)){const i=t.register(r);if(!(i instanceof Object)||i.resolve==null){const n=r.resolvers.get(t);if(n!=null)return n;throw new Error("A valid resolver was not returned from the static register method")}return i}else{if(t.$isInterface)throw new Error(`Attempted to jitRegister an interface: ${t.friendlyName}`);{const i=this.config.defaultResolver(t,r);return r.resolvers.set(t,i),i}}}}const dh=new WeakMap;function xx(e){return function(t,r,i){if(dh.has(i))return dh.get(i);const n=e(t,r,i);return dh.set(i,n),n}}const Lo=Object.freeze({instance(e,t){return new mr(e,0,t)},singleton(e,t){return new mr(e,1,t)},transient(e,t){return new mr(e,2,t)},callback(e,t){return new mr(e,3,t)},cachedCallback(e,t){return new mr(e,3,xx(t))},aliasTo(e,t){return new mr(t,5,e)}});function va(e){if(e==null)throw new Error("key/value cannot be null or undefined. Are you trying to inject/register something that doesn't exist with DI?")}function Uf(e,t,r){if(e instanceof mr&&e.strategy===4){const i=e.state;let n=i.length;const s=new Array(n);for(;n--;)s[n]=i[n].resolve(t,r);return s}return[e.resolve(t,r)]}const Gf="(anonymous)";function Yf(e){return typeof e=="object"&&e!==null||typeof e=="function"}const t5=function(){const e=new WeakMap;let t=!1,r="",i=0;return function(n){return t=e.get(n),t===void 0&&(r=n.toString(),i=r.length,t=i>=29&&i<=100&&r.charCodeAt(i-1)===125&&r.charCodeAt(i-2)<=32&&r.charCodeAt(i-3)===93&&r.charCodeAt(i-4)===101&&r.charCodeAt(i-5)===100&&r.charCodeAt(i-6)===111&&r.charCodeAt(i-7)===99&&r.charCodeAt(i-8)===32&&r.charCodeAt(i-9)===101&&r.charCodeAt(i-10)===118&&r.charCodeAt(i-11)===105&&r.charCodeAt(i-12)===116&&r.charCodeAt(i-13)===97&&r.charCodeAt(i-14)===110&&r.charCodeAt(i-15)===88,e.set(n,t)),t}}(),wa={};function bx(e){switch(typeof e){case"number":return e>=0&&(e|0)===e;case"string":{const t=wa[e];if(t!==void 0)return t;const r=e.length;if(r===0)return wa[e]=!1;let i=0;for(let n=0;n<r;++n)if(i=e.charCodeAt(n),n===0&&i===48&&r>1||i<48||i>57)return wa[e]=!1;return wa[e]=!0}default:return!1}}function Xf(e){return`${e.toLowerCase()}:presentation`}const ka=new Map,yx=Object.freeze({define(e,t,r){const i=Xf(e);ka.get(i)===void 0?ka.set(i,t):ka.set(i,!1),r.register(Lo.instance(i,t))},forTag(e,t){const r=Xf(e),i=ka.get(r);return i===!1?Jt.findResponsibleContainer(t).get(r):i||null}});class e5{constructor(t,r){this.template=t||null,this.styles=r===void 0?null:Array.isArray(r)?Ke.create(r):r instanceof Ke?r:Ke.create([r])}applyTo(t){const r=t.$fastController;r.template===null&&(r.template=this.template),r.styles===null&&(r.styles=this.styles)}}class Xt extends oc{constructor(){super(...arguments),this._presentation=void 0}get $presentation(){return this._presentation===void 0&&(this._presentation=yx.forTag(this.tagName,this)),this._presentation}templateChanged(){this.template!==void 0&&(this.$fastController.template=this.template)}stylesChanged(){this.styles!==void 0&&(this.$fastController.styles=this.styles)}connectedCallback(){this.$presentation!==null&&this.$presentation.applyTo(this),super.connectedCallback()}static compose(t){return(r={})=>new vx(this===Xt?class extends Xt{}:this,t,r)}}I([rt],Xt.prototype,"template",void 0);I([rt],Xt.prototype,"styles",void 0);function qs(e,t,r){return typeof e=="function"?e(t,r):e}class vx{constructor(t,r,i){this.type=t,this.elementDefinition=r,this.overrideDefinition=i,this.definition=Object.assign(Object.assign({},this.elementDefinition),this.overrideDefinition)}register(t,r){const i=this.definition,n=this.overrideDefinition,o=`${i.prefix||r.elementPrefix}-${i.baseName}`;r.tryDefineElement({name:o,type:this.type,baseClass:this.elementDefinition.baseClass,callback:a=>{const l=new e5(qs(i.template,a,i),qs(i.styles,a,i));a.definePresentation(l);let c=qs(i.shadowOptions,a,i);a.shadowRootMode&&(c?n.shadowOptions||(c.mode=a.shadowRootMode):c!==null&&(c={mode:a.shadowRootMode})),a.defineElement({elementOptions:qs(i.elementOptions,a,i),shadowOptions:c,attributes:qs(i.attributes,a,i)})}})}}function er(e,...t){const r=xl.locate(e);t.forEach(i=>{Object.getOwnPropertyNames(i.prototype).forEach(s=>{s!=="constructor"&&Object.defineProperty(e.prototype,s,Object.getOwnPropertyDescriptor(i.prototype,s))}),xl.locate(i).forEach(s=>r.push(s))})}const Uu={horizontal:"horizontal",vertical:"vertical"};function r5(e,t){let r=e.length;for(;r--;)if(t(e[r],r,e))return r;return-1}function i5(){return!!(typeof window<"u"&&window.document&&window.document.createElement)}function n5(...e){return e.every(t=>t instanceof HTMLElement)}function s5(){const e=document.querySelector('meta[property="csp-nonce"]');return e?e.getAttribute("content"):null}let Hi;function o5(){if(typeof Hi=="boolean")return Hi;if(!i5())return Hi=!1,Hi;const e=document.createElement("style"),t=s5();t!==null&&e.setAttribute("nonce",t),document.head.appendChild(e);try{e.sheet.insertRule("foo:focus-visible {color:inherit}",0),Hi=!0}catch{Hi=!1}finally{document.head.removeChild(e)}return Hi}const Qf="focus",Zf="focusin",ls="focusout",cs="keydown";var Jf;(function(e){e[e.alt=18]="alt",e[e.arrowDown=40]="arrowDown",e[e.arrowLeft=37]="arrowLeft",e[e.arrowRight=39]="arrowRight",e[e.arrowUp=38]="arrowUp",e[e.back=8]="back",e[e.backSlash=220]="backSlash",e[e.break=19]="break",e[e.capsLock=20]="capsLock",e[e.closeBracket=221]="closeBracket",e[e.colon=186]="colon",e[e.colon2=59]="colon2",e[e.comma=188]="comma",e[e.ctrl=17]="ctrl",e[e.delete=46]="delete",e[e.end=35]="end",e[e.enter=13]="enter",e[e.equals=187]="equals",e[e.equals2=61]="equals2",e[e.equals3=107]="equals3",e[e.escape=27]="escape",e[e.forwardSlash=191]="forwardSlash",e[e.function1=112]="function1",e[e.function10=121]="function10",e[e.function11=122]="function11",e[e.function12=123]="function12",e[e.function2=113]="function2",e[e.function3=114]="function3",e[e.function4=115]="function4",e[e.function5=116]="function5",e[e.function6=117]="function6",e[e.function7=118]="function7",e[e.function8=119]="function8",e[e.function9=120]="function9",e[e.home=36]="home",e[e.insert=45]="insert",e[e.menu=93]="menu",e[e.minus=189]="minus",e[e.minus2=109]="minus2",e[e.numLock=144]="numLock",e[e.numPad0=96]="numPad0",e[e.numPad1=97]="numPad1",e[e.numPad2=98]="numPad2",e[e.numPad3=99]="numPad3",e[e.numPad4=100]="numPad4",e[e.numPad5=101]="numPad5",e[e.numPad6=102]="numPad6",e[e.numPad7=103]="numPad7",e[e.numPad8=104]="numPad8",e[e.numPad9=105]="numPad9",e[e.numPadDivide=111]="numPadDivide",e[e.numPadDot=110]="numPadDot",e[e.numPadMinus=109]="numPadMinus",e[e.numPadMultiply=106]="numPadMultiply",e[e.numPadPlus=107]="numPadPlus",e[e.openBracket=219]="openBracket",e[e.pageDown=34]="pageDown",e[e.pageUp=33]="pageUp",e[e.period=190]="period",e[e.print=44]="print",e[e.quote=222]="quote",e[e.scrollLock=145]="scrollLock",e[e.shift=16]="shift",e[e.space=32]="space",e[e.tab=9]="tab",e[e.tilde=192]="tilde",e[e.windowsLeft=91]="windowsLeft",e[e.windowsOpera=219]="windowsOpera",e[e.windowsRight=92]="windowsRight"})(Jf||(Jf={}));const bn="ArrowDown",Bo="ArrowLeft",Mo="ArrowRight",yn="ArrowUp",Ko="Enter",ac="Escape",$s="Home",As="End",a5="F2",l5="PageDown",c5="PageUp",ta=" ",Gu="Tab",h5={ArrowDown:bn,ArrowLeft:Bo,ArrowRight:Mo,ArrowUp:yn};var hs;(function(e){e.ltr="ltr",e.rtl="rtl"})(hs||(hs={}));function d5(e,t,r){return Math.min(Math.max(r,e),t)}function Ca(e,t,r=0){return[t,r]=[t,r].sort((i,n)=>i-n),t<=e&&e<r}let u5=0;function yl(e=""){return`${e}${u5++}`}const p5=(e,t)=>Rt`
    <a
        class="control"
        part="control"
        download="${r=>r.download}"
        href="${r=>r.href}"
        hreflang="${r=>r.hreflang}"
        ping="${r=>r.ping}"
        referrerpolicy="${r=>r.referrerpolicy}"
        rel="${r=>r.rel}"
        target="${r=>r.target}"
        type="${r=>r.type}"
        aria-atomic="${r=>r.ariaAtomic}"
        aria-busy="${r=>r.ariaBusy}"
        aria-controls="${r=>r.ariaControls}"
        aria-current="${r=>r.ariaCurrent}"
        aria-describedby="${r=>r.ariaDescribedby}"
        aria-details="${r=>r.ariaDetails}"
        aria-disabled="${r=>r.ariaDisabled}"
        aria-errormessage="${r=>r.ariaErrormessage}"
        aria-expanded="${r=>r.ariaExpanded}"
        aria-flowto="${r=>r.ariaFlowto}"
        aria-haspopup="${r=>r.ariaHaspopup}"
        aria-hidden="${r=>r.ariaHidden}"
        aria-invalid="${r=>r.ariaInvalid}"
        aria-keyshortcuts="${r=>r.ariaKeyshortcuts}"
        aria-label="${r=>r.ariaLabel}"
        aria-labelledby="${r=>r.ariaLabelledby}"
        aria-live="${r=>r.ariaLive}"
        aria-owns="${r=>r.ariaOwns}"
        aria-relevant="${r=>r.ariaRelevant}"
        aria-roledescription="${r=>r.ariaRoledescription}"
        ${He("control")}
    >
        ${Ts(e,t)}
        <span class="content" part="content">
            <slot ${xr("defaultSlottedContent")}></slot>
        </span>
        ${_s(e,t)}
    </a>
`;class Qt{}I([U({attribute:"aria-atomic"})],Qt.prototype,"ariaAtomic",void 0);I([U({attribute:"aria-busy"})],Qt.prototype,"ariaBusy",void 0);I([U({attribute:"aria-controls"})],Qt.prototype,"ariaControls",void 0);I([U({attribute:"aria-current"})],Qt.prototype,"ariaCurrent",void 0);I([U({attribute:"aria-describedby"})],Qt.prototype,"ariaDescribedby",void 0);I([U({attribute:"aria-details"})],Qt.prototype,"ariaDetails",void 0);I([U({attribute:"aria-disabled"})],Qt.prototype,"ariaDisabled",void 0);I([U({attribute:"aria-errormessage"})],Qt.prototype,"ariaErrormessage",void 0);I([U({attribute:"aria-flowto"})],Qt.prototype,"ariaFlowto",void 0);I([U({attribute:"aria-haspopup"})],Qt.prototype,"ariaHaspopup",void 0);I([U({attribute:"aria-hidden"})],Qt.prototype,"ariaHidden",void 0);I([U({attribute:"aria-invalid"})],Qt.prototype,"ariaInvalid",void 0);I([U({attribute:"aria-keyshortcuts"})],Qt.prototype,"ariaKeyshortcuts",void 0);I([U({attribute:"aria-label"})],Qt.prototype,"ariaLabel",void 0);I([U({attribute:"aria-labelledby"})],Qt.prototype,"ariaLabelledby",void 0);I([U({attribute:"aria-live"})],Qt.prototype,"ariaLive",void 0);I([U({attribute:"aria-owns"})],Qt.prototype,"ariaOwns",void 0);I([U({attribute:"aria-relevant"})],Qt.prototype,"ariaRelevant",void 0);I([U({attribute:"aria-roledescription"})],Qt.prototype,"ariaRoledescription",void 0);class Or extends Xt{constructor(){super(...arguments),this.handleUnsupportedDelegatesFocus=()=>{var t;window.ShadowRoot&&!window.ShadowRoot.prototype.hasOwnProperty("delegatesFocus")&&(!((t=this.$fastController.definition.shadowOptions)===null||t===void 0)&&t.delegatesFocus)&&(this.focus=()=>{var r;(r=this.control)===null||r===void 0||r.focus()})}}connectedCallback(){super.connectedCallback(),this.handleUnsupportedDelegatesFocus()}}I([U],Or.prototype,"download",void 0);I([U],Or.prototype,"href",void 0);I([U],Or.prototype,"hreflang",void 0);I([U],Or.prototype,"ping",void 0);I([U],Or.prototype,"referrerpolicy",void 0);I([U],Or.prototype,"rel",void 0);I([U],Or.prototype,"target",void 0);I([U],Or.prototype,"type",void 0);I([rt],Or.prototype,"defaultSlottedContent",void 0);class Yu{}I([U({attribute:"aria-expanded"})],Yu.prototype,"ariaExpanded",void 0);er(Yu,Qt);er(Or,Ss,Yu);const f5=e=>{const t=e.closest("[dir]");return t!==null&&t.dir==="rtl"?hs.rtl:hs.ltr},wx=(e,t)=>Rt`
    <template class="${r=>r.circular?"circular":""}">
        <div class="control" part="control" style="${r=>r.generateBadgeStyle()}">
            <slot></slot>
        </div>
    </template>
`;let ea=class extends Xt{constructor(){super(...arguments),this.generateBadgeStyle=()=>{if(!this.fill&&!this.color)return;const t=`background-color: var(--badge-fill-${this.fill});`,r=`color: var(--badge-color-${this.color});`;return this.fill&&!this.color?t:this.color&&!this.fill?r:`${r} ${t}`}}};I([U({attribute:"fill"})],ea.prototype,"fill",void 0);I([U({attribute:"color"})],ea.prototype,"color",void 0);I([U({mode:"boolean"})],ea.prototype,"circular",void 0);const g5=(e,t)=>Rt`
    <button
        class="control"
        part="control"
        ?autofocus="${r=>r.autofocus}"
        ?disabled="${r=>r.disabled}"
        form="${r=>r.formId}"
        formaction="${r=>r.formaction}"
        formenctype="${r=>r.formenctype}"
        formmethod="${r=>r.formmethod}"
        formnovalidate="${r=>r.formnovalidate}"
        formtarget="${r=>r.formtarget}"
        name="${r=>r.name}"
        type="${r=>r.type}"
        value="${r=>r.value}"
        aria-atomic="${r=>r.ariaAtomic}"
        aria-busy="${r=>r.ariaBusy}"
        aria-controls="${r=>r.ariaControls}"
        aria-current="${r=>r.ariaCurrent}"
        aria-describedby="${r=>r.ariaDescribedby}"
        aria-details="${r=>r.ariaDetails}"
        aria-disabled="${r=>r.ariaDisabled}"
        aria-errormessage="${r=>r.ariaErrormessage}"
        aria-expanded="${r=>r.ariaExpanded}"
        aria-flowto="${r=>r.ariaFlowto}"
        aria-haspopup="${r=>r.ariaHaspopup}"
        aria-hidden="${r=>r.ariaHidden}"
        aria-invalid="${r=>r.ariaInvalid}"
        aria-keyshortcuts="${r=>r.ariaKeyshortcuts}"
        aria-label="${r=>r.ariaLabel}"
        aria-labelledby="${r=>r.ariaLabelledby}"
        aria-live="${r=>r.ariaLive}"
        aria-owns="${r=>r.ariaOwns}"
        aria-pressed="${r=>r.ariaPressed}"
        aria-relevant="${r=>r.ariaRelevant}"
        aria-roledescription="${r=>r.ariaRoledescription}"
        ${He("control")}
    >
        ${Ts(e,t)}
        <span class="content" part="content">
            <slot ${xr("defaultSlottedContent")}></slot>
        </span>
        ${_s(e,t)}
    </button>
`,Kf="form-associated-proxy",tg="ElementInternals",eg=tg in window&&"setFormValue"in window[tg].prototype,rg=new WeakMap;function ra(e){const t=class extends e{constructor(...r){super(...r),this.dirtyValue=!1,this.disabled=!1,this.proxyEventsToBlock=["change","click"],this.proxyInitialized=!1,this.required=!1,this.initialValue=this.initialValue||"",this.elementInternals||(this.formResetCallback=this.formResetCallback.bind(this))}static get formAssociated(){return eg}get validity(){return this.elementInternals?this.elementInternals.validity:this.proxy.validity}get form(){return this.elementInternals?this.elementInternals.form:this.proxy.form}get validationMessage(){return this.elementInternals?this.elementInternals.validationMessage:this.proxy.validationMessage}get willValidate(){return this.elementInternals?this.elementInternals.willValidate:this.proxy.willValidate}get labels(){if(this.elementInternals)return Object.freeze(Array.from(this.elementInternals.labels));if(this.proxy instanceof HTMLElement&&this.proxy.ownerDocument&&this.id){const r=this.proxy.labels,i=Array.from(this.proxy.getRootNode().querySelectorAll(`[for='${this.id}']`)),n=r?i.concat(Array.from(r)):i;return Object.freeze(n)}else return sn}valueChanged(r,i){this.dirtyValue=!0,this.proxy instanceof HTMLElement&&(this.proxy.value=this.value),this.currentValue=this.value,this.setFormValue(this.value),this.validate()}currentValueChanged(){this.value=this.currentValue}initialValueChanged(r,i){this.dirtyValue||(this.value=this.initialValue,this.dirtyValue=!1)}disabledChanged(r,i){this.proxy instanceof HTMLElement&&(this.proxy.disabled=this.disabled),At.queueUpdate(()=>this.classList.toggle("disabled",this.disabled))}nameChanged(r,i){this.proxy instanceof HTMLElement&&(this.proxy.name=this.name)}requiredChanged(r,i){this.proxy instanceof HTMLElement&&(this.proxy.required=this.required),At.queueUpdate(()=>this.classList.toggle("required",this.required)),this.validate()}get elementInternals(){if(!eg)return null;let r=rg.get(this);return r||(r=this.attachInternals(),rg.set(this,r)),r}connectedCallback(){super.connectedCallback(),this.addEventListener("keypress",this._keypressHandler),this.value||(this.value=this.initialValue,this.dirtyValue=!1),this.elementInternals||(this.attachProxy(),this.form&&this.form.addEventListener("reset",this.formResetCallback))}disconnectedCallback(){super.disconnectedCallback(),this.proxyEventsToBlock.forEach(r=>this.proxy.removeEventListener(r,this.stopPropagation)),!this.elementInternals&&this.form&&this.form.removeEventListener("reset",this.formResetCallback)}checkValidity(){return this.elementInternals?this.elementInternals.checkValidity():this.proxy.checkValidity()}reportValidity(){return this.elementInternals?this.elementInternals.reportValidity():this.proxy.reportValidity()}setValidity(r,i,n){this.elementInternals?this.elementInternals.setValidity(r,i,n):typeof i=="string"&&this.proxy.setCustomValidity(i)}formDisabledCallback(r){this.disabled=r}formResetCallback(){this.value=this.initialValue,this.dirtyValue=!1}attachProxy(){var r;this.proxyInitialized||(this.proxyInitialized=!0,this.proxy.style.display="none",this.proxyEventsToBlock.forEach(i=>this.proxy.addEventListener(i,this.stopPropagation)),this.proxy.disabled=this.disabled,this.proxy.required=this.required,typeof this.name=="string"&&(this.proxy.name=this.name),typeof this.value=="string"&&(this.proxy.value=this.value),this.proxy.setAttribute("slot",Kf),this.proxySlot=document.createElement("slot"),this.proxySlot.setAttribute("name",Kf)),(r=this.shadowRoot)===null||r===void 0||r.appendChild(this.proxySlot),this.appendChild(this.proxy)}detachProxy(){var r;this.removeChild(this.proxy),(r=this.shadowRoot)===null||r===void 0||r.removeChild(this.proxySlot)}validate(r){this.proxy instanceof HTMLElement&&this.setValidity(this.proxy.validity,this.proxy.validationMessage,r)}setFormValue(r,i){this.elementInternals&&this.elementInternals.setFormValue(r,i||r)}_keypressHandler(r){switch(r.key){case Ko:if(this.form instanceof HTMLFormElement){const i=this.form.querySelector("[type=submit]");i?.click()}break}}stopPropagation(r){r.stopPropagation()}};return U({mode:"boolean"})(t.prototype,"disabled"),U({mode:"fromView",attribute:"value"})(t.prototype,"initialValue"),U({attribute:"current-value"})(t.prototype,"currentValue"),U(t.prototype,"name"),U({mode:"boolean"})(t.prototype,"required"),rt(t.prototype,"value"),t}function kx(e){class t extends ra(e){}class r extends t{constructor(...n){super(n),this.dirtyChecked=!1,this.checkedAttribute=!1,this.checked=!1,this.dirtyChecked=!1}checkedAttributeChanged(){this.defaultChecked=this.checkedAttribute}defaultCheckedChanged(){this.dirtyChecked||(this.checked=this.defaultChecked,this.dirtyChecked=!1)}checkedChanged(n,s){this.dirtyChecked||(this.dirtyChecked=!0),this.currentChecked=this.checked,this.updateForm(),this.proxy instanceof HTMLInputElement&&(this.proxy.checked=this.checked),n!==void 0&&this.$emit("change"),this.validate()}currentCheckedChanged(n,s){this.checked=this.currentChecked}updateForm(){const n=this.checked?this.value:null;this.setFormValue(n,n)}connectedCallback(){super.connectedCallback(),this.updateForm()}formResetCallback(){super.formResetCallback(),this.checked=!!this.checkedAttribute,this.dirtyChecked=!1}}return U({attribute:"checked",mode:"boolean"})(r.prototype,"checkedAttribute"),U({attribute:"current-checked",converter:ox})(r.prototype,"currentChecked"),rt(r.prototype,"defaultChecked"),rt(r.prototype,"checked"),r}class m5 extends Xt{}class x5 extends ra(m5){constructor(){super(...arguments),this.proxy=document.createElement("input")}}let Rr=class extends x5{constructor(){super(...arguments),this.handleClick=t=>{var r;this.disabled&&((r=this.defaultSlottedContent)===null||r===void 0?void 0:r.length)<=1&&t.stopPropagation()},this.handleSubmission=()=>{if(!this.form)return;const t=this.proxy.isConnected;t||this.attachProxy(),typeof this.form.requestSubmit=="function"?this.form.requestSubmit(this.proxy):this.proxy.click(),t||this.detachProxy()},this.handleFormReset=()=>{var t;(t=this.form)===null||t===void 0||t.reset()},this.handleUnsupportedDelegatesFocus=()=>{var t;window.ShadowRoot&&!window.ShadowRoot.prototype.hasOwnProperty("delegatesFocus")&&(!((t=this.$fastController.definition.shadowOptions)===null||t===void 0)&&t.delegatesFocus)&&(this.focus=()=>{this.control.focus()})}}formactionChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.formAction=this.formaction)}formenctypeChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.formEnctype=this.formenctype)}formmethodChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.formMethod=this.formmethod)}formnovalidateChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.formNoValidate=this.formnovalidate)}formtargetChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.formTarget=this.formtarget)}typeChanged(t,r){this.proxy instanceof HTMLInputElement&&(this.proxy.type=this.type),r==="submit"&&this.addEventListener("click",this.handleSubmission),t==="submit"&&this.removeEventListener("click",this.handleSubmission),r==="reset"&&this.addEventListener("click",this.handleFormReset),t==="reset"&&this.removeEventListener("click",this.handleFormReset)}validate(){super.validate(this.control)}connectedCallback(){var t;super.connectedCallback(),this.proxy.setAttribute("type",this.type),this.handleUnsupportedDelegatesFocus();const r=Array.from((t=this.control)===null||t===void 0?void 0:t.children);r&&r.forEach(i=>{i.addEventListener("click",this.handleClick)})}disconnectedCallback(){var t;super.disconnectedCallback();const r=Array.from((t=this.control)===null||t===void 0?void 0:t.children);r&&r.forEach(i=>{i.removeEventListener("click",this.handleClick)})}};I([U({mode:"boolean"})],Rr.prototype,"autofocus",void 0);I([U({attribute:"form"})],Rr.prototype,"formId",void 0);I([U],Rr.prototype,"formaction",void 0);I([U],Rr.prototype,"formenctype",void 0);I([U],Rr.prototype,"formmethod",void 0);I([U({mode:"boolean"})],Rr.prototype,"formnovalidate",void 0);I([U],Rr.prototype,"formtarget",void 0);I([U],Rr.prototype,"type",void 0);I([rt],Rr.prototype,"defaultSlottedContent",void 0);class lc{}I([U({attribute:"aria-expanded"})],lc.prototype,"ariaExpanded",void 0);I([U({attribute:"aria-pressed"})],lc.prototype,"ariaPressed",void 0);er(lc,Qt);er(Rr,Ss,lc);const Sa={none:"none",default:"default",sticky:"sticky"},yi={default:"default",columnHeader:"columnheader",rowHeader:"rowheader"},wo={default:"default",header:"header",stickyHeader:"sticky-header"};let Ee=class extends Xt{constructor(){super(...arguments),this.rowType=wo.default,this.rowData=null,this.columnDefinitions=null,this.isActiveRow=!1,this.cellsRepeatBehavior=null,this.cellsPlaceholder=null,this.focusColumnIndex=0,this.refocusOnLoad=!1,this.updateRowStyle=()=>{this.style.gridTemplateColumns=this.gridTemplateColumns}}gridTemplateColumnsChanged(){this.$fastController.isConnected&&this.updateRowStyle()}rowTypeChanged(){this.$fastController.isConnected&&this.updateItemTemplate()}rowDataChanged(){if(this.rowData!==null&&this.isActiveRow){this.refocusOnLoad=!0;return}}cellItemTemplateChanged(){this.updateItemTemplate()}headerCellItemTemplateChanged(){this.updateItemTemplate()}connectedCallback(){super.connectedCallback(),this.cellsRepeatBehavior===null&&(this.cellsPlaceholder=document.createComment(""),this.appendChild(this.cellsPlaceholder),this.updateItemTemplate(),this.cellsRepeatBehavior=new px(t=>t.columnDefinitions,t=>t.activeCellItemTemplate,{positioning:!0}).createBehavior(this.cellsPlaceholder),this.$fastController.addBehaviors([this.cellsRepeatBehavior])),this.addEventListener("cell-focused",this.handleCellFocus),this.addEventListener(ls,this.handleFocusout),this.addEventListener(cs,this.handleKeydown),this.updateRowStyle(),this.refocusOnLoad&&(this.refocusOnLoad=!1,this.cellElements.length>this.focusColumnIndex&&this.cellElements[this.focusColumnIndex].focus())}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("cell-focused",this.handleCellFocus),this.removeEventListener(ls,this.handleFocusout),this.removeEventListener(cs,this.handleKeydown)}handleFocusout(t){this.contains(t.target)||(this.isActiveRow=!1,this.focusColumnIndex=0)}handleCellFocus(t){this.isActiveRow=!0,this.focusColumnIndex=this.cellElements.indexOf(t.target),this.$emit("row-focused",this)}handleKeydown(t){if(t.defaultPrevented)return;let r=0;switch(t.key){case Bo:r=Math.max(0,this.focusColumnIndex-1),this.cellElements[r].focus(),t.preventDefault();break;case Mo:r=Math.min(this.cellElements.length-1,this.focusColumnIndex+1),this.cellElements[r].focus(),t.preventDefault();break;case $s:t.ctrlKey||(this.cellElements[0].focus(),t.preventDefault());break;case As:t.ctrlKey||(this.cellElements[this.cellElements.length-1].focus(),t.preventDefault());break}}updateItemTemplate(){this.activeCellItemTemplate=this.rowType===wo.default&&this.cellItemTemplate!==void 0?this.cellItemTemplate:this.rowType===wo.default&&this.cellItemTemplate===void 0?this.defaultCellItemTemplate:this.headerCellItemTemplate!==void 0?this.headerCellItemTemplate:this.defaultHeaderCellItemTemplate}};I([U({attribute:"grid-template-columns"})],Ee.prototype,"gridTemplateColumns",void 0);I([U({attribute:"row-type"})],Ee.prototype,"rowType",void 0);I([rt],Ee.prototype,"rowData",void 0);I([rt],Ee.prototype,"columnDefinitions",void 0);I([rt],Ee.prototype,"cellItemTemplate",void 0);I([rt],Ee.prototype,"headerCellItemTemplate",void 0);I([rt],Ee.prototype,"rowIndex",void 0);I([rt],Ee.prototype,"isActiveRow",void 0);I([rt],Ee.prototype,"activeCellItemTemplate",void 0);I([rt],Ee.prototype,"defaultCellItemTemplate",void 0);I([rt],Ee.prototype,"defaultHeaderCellItemTemplate",void 0);I([rt],Ee.prototype,"cellElements",void 0);function b5(e){const t=e.tagFor(Ee);return Rt`
    <${t}
        :rowData="${r=>r}"
        :cellItemTemplate="${(r,i)=>i.parent.cellItemTemplate}"
        :headerCellItemTemplate="${(r,i)=>i.parent.headerCellItemTemplate}"
    ></${t}>
`}const y5=(e,t)=>{const r=b5(e),i=e.tagFor(Ee);return Rt`
        <template
            role="grid"
            tabindex="0"
            :rowElementTag="${()=>i}"
            :defaultRowItemTemplate="${r}"
            ${gx({property:"rowElements",filter:Vu("[role=row]")})}
        >
            <slot></slot>
        </template>
    `};let Le=class _d extends Xt{constructor(){super(),this.noTabbing=!1,this.generateHeader=Sa.default,this.rowsData=[],this.columnDefinitions=null,this.focusRowIndex=0,this.focusColumnIndex=0,this.rowsPlaceholder=null,this.generatedHeader=null,this.isUpdatingFocus=!1,this.pendingFocusUpdate=!1,this.rowindexUpdateQueued=!1,this.columnDefinitionsStale=!0,this.generatedGridTemplateColumns="",this.focusOnCell=(t,r,i)=>{if(this.rowElements.length===0){this.focusRowIndex=0,this.focusColumnIndex=0;return}const n=Math.max(0,Math.min(this.rowElements.length-1,t)),o=this.rowElements[n].querySelectorAll('[role="cell"], [role="gridcell"], [role="columnheader"], [role="rowheader"]'),a=Math.max(0,Math.min(o.length-1,r)),l=o[a];i&&this.scrollHeight!==this.clientHeight&&(n<this.focusRowIndex&&this.scrollTop>0||n>this.focusRowIndex&&this.scrollTop<this.scrollHeight-this.clientHeight)&&l.scrollIntoView({block:"center",inline:"center"}),l.focus()},this.onChildListChange=(t,r)=>{t&&t.length&&(t.forEach(i=>{i.addedNodes.forEach(n=>{n.nodeType===1&&n.getAttribute("role")==="row"&&(n.columnDefinitions=this.columnDefinitions)})}),this.queueRowIndexUpdate())},this.queueRowIndexUpdate=()=>{this.rowindexUpdateQueued||(this.rowindexUpdateQueued=!0,At.queueUpdate(this.updateRowIndexes))},this.updateRowIndexes=()=>{let t=this.gridTemplateColumns;if(t===void 0){if(this.generatedGridTemplateColumns===""&&this.rowElements.length>0){const r=this.rowElements[0];this.generatedGridTemplateColumns=new Array(r.cellElements.length).fill("1fr").join(" ")}t=this.generatedGridTemplateColumns}this.rowElements.forEach((r,i)=>{const n=r;n.rowIndex=i,n.gridTemplateColumns=t,this.columnDefinitionsStale&&(n.columnDefinitions=this.columnDefinitions)}),this.rowindexUpdateQueued=!1,this.columnDefinitionsStale=!1}}static generateTemplateColumns(t){let r="";return t.forEach(i=>{r=`${r}${r===""?"":" "}1fr`}),r}noTabbingChanged(){this.$fastController.isConnected&&(this.noTabbing?this.setAttribute("tabIndex","-1"):this.setAttribute("tabIndex",this.contains(document.activeElement)||this===document.activeElement?"-1":"0"))}generateHeaderChanged(){this.$fastController.isConnected&&this.toggleGeneratedHeader()}gridTemplateColumnsChanged(){this.$fastController.isConnected&&this.updateRowIndexes()}rowsDataChanged(){this.columnDefinitions===null&&this.rowsData.length>0&&(this.columnDefinitions=_d.generateColumns(this.rowsData[0])),this.$fastController.isConnected&&this.toggleGeneratedHeader()}columnDefinitionsChanged(){if(this.columnDefinitions===null){this.generatedGridTemplateColumns="";return}this.generatedGridTemplateColumns=_d.generateTemplateColumns(this.columnDefinitions),this.$fastController.isConnected&&(this.columnDefinitionsStale=!0,this.queueRowIndexUpdate())}headerCellItemTemplateChanged(){this.$fastController.isConnected&&this.generatedHeader!==null&&(this.generatedHeader.headerCellItemTemplate=this.headerCellItemTemplate)}focusRowIndexChanged(){this.$fastController.isConnected&&this.queueFocusUpdate()}focusColumnIndexChanged(){this.$fastController.isConnected&&this.queueFocusUpdate()}connectedCallback(){super.connectedCallback(),this.rowItemTemplate===void 0&&(this.rowItemTemplate=this.defaultRowItemTemplate),this.rowsPlaceholder=document.createComment(""),this.appendChild(this.rowsPlaceholder),this.toggleGeneratedHeader(),this.rowsRepeatBehavior=new px(t=>t.rowsData,t=>t.rowItemTemplate,{positioning:!0}).createBehavior(this.rowsPlaceholder),this.$fastController.addBehaviors([this.rowsRepeatBehavior]),this.addEventListener("row-focused",this.handleRowFocus),this.addEventListener(Qf,this.handleFocus),this.addEventListener(cs,this.handleKeydown),this.addEventListener(ls,this.handleFocusOut),this.observer=new MutationObserver(this.onChildListChange),this.observer.observe(this,{childList:!0}),this.noTabbing&&this.setAttribute("tabindex","-1"),At.queueUpdate(this.queueRowIndexUpdate)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("row-focused",this.handleRowFocus),this.removeEventListener(Qf,this.handleFocus),this.removeEventListener(cs,this.handleKeydown),this.removeEventListener(ls,this.handleFocusOut),this.observer.disconnect(),this.rowsPlaceholder=null,this.generatedHeader=null}handleRowFocus(t){this.isUpdatingFocus=!0;const r=t.target;this.focusRowIndex=this.rowElements.indexOf(r),this.focusColumnIndex=r.focusColumnIndex,this.setAttribute("tabIndex","-1"),this.isUpdatingFocus=!1}handleFocus(t){this.focusOnCell(this.focusRowIndex,this.focusColumnIndex,!0)}handleFocusOut(t){(t.relatedTarget===null||!this.contains(t.relatedTarget))&&this.setAttribute("tabIndex",this.noTabbing?"-1":"0")}handleKeydown(t){if(t.defaultPrevented)return;let r;const i=this.rowElements.length-1,n=this.offsetHeight+this.scrollTop,s=this.rowElements[i];switch(t.key){case yn:t.preventDefault(),this.focusOnCell(this.focusRowIndex-1,this.focusColumnIndex,!0);break;case bn:t.preventDefault(),this.focusOnCell(this.focusRowIndex+1,this.focusColumnIndex,!0);break;case c5:if(t.preventDefault(),this.rowElements.length===0){this.focusOnCell(0,0,!1);break}if(this.focusRowIndex===0){this.focusOnCell(0,this.focusColumnIndex,!1);return}for(r=this.focusRowIndex-1,r;r>=0;r--){const o=this.rowElements[r];if(o.offsetTop<this.scrollTop){this.scrollTop=o.offsetTop+o.clientHeight-this.clientHeight;break}}this.focusOnCell(r,this.focusColumnIndex,!1);break;case l5:if(t.preventDefault(),this.rowElements.length===0){this.focusOnCell(0,0,!1);break}if(this.focusRowIndex>=i||s.offsetTop+s.offsetHeight<=n){this.focusOnCell(i,this.focusColumnIndex,!1);return}for(r=this.focusRowIndex+1,r;r<=i;r++){const o=this.rowElements[r];if(o.offsetTop+o.offsetHeight>n){let a=0;this.generateHeader===Sa.sticky&&this.generatedHeader!==null&&(a=this.generatedHeader.clientHeight),this.scrollTop=o.offsetTop-a;break}}this.focusOnCell(r,this.focusColumnIndex,!1);break;case $s:t.ctrlKey&&(t.preventDefault(),this.focusOnCell(0,0,!0));break;case As:t.ctrlKey&&this.columnDefinitions!==null&&(t.preventDefault(),this.focusOnCell(this.rowElements.length-1,this.columnDefinitions.length-1,!0));break}}queueFocusUpdate(){this.isUpdatingFocus&&(this.contains(document.activeElement)||this===document.activeElement)||this.pendingFocusUpdate===!1&&(this.pendingFocusUpdate=!0,At.queueUpdate(()=>this.updateFocus()))}updateFocus(){this.pendingFocusUpdate=!1,this.focusOnCell(this.focusRowIndex,this.focusColumnIndex,!0)}toggleGeneratedHeader(){if(this.generatedHeader!==null&&(this.removeChild(this.generatedHeader),this.generatedHeader=null),this.generateHeader!==Sa.none&&this.rowsData.length>0){const t=document.createElement(this.rowElementTag);this.generatedHeader=t,this.generatedHeader.columnDefinitions=this.columnDefinitions,this.generatedHeader.gridTemplateColumns=this.gridTemplateColumns,this.generatedHeader.rowType=this.generateHeader===Sa.sticky?wo.stickyHeader:wo.header,(this.firstChild!==null||this.rowsPlaceholder!==null)&&this.insertBefore(t,this.firstChild!==null?this.firstChild:this.rowsPlaceholder);return}}};Le.generateColumns=e=>Object.getOwnPropertyNames(e).map((t,r)=>({columnDataKey:t,gridColumn:`${r}`}));I([U({attribute:"no-tabbing",mode:"boolean"})],Le.prototype,"noTabbing",void 0);I([U({attribute:"generate-header"})],Le.prototype,"generateHeader",void 0);I([U({attribute:"grid-template-columns"})],Le.prototype,"gridTemplateColumns",void 0);I([rt],Le.prototype,"rowsData",void 0);I([rt],Le.prototype,"columnDefinitions",void 0);I([rt],Le.prototype,"rowItemTemplate",void 0);I([rt],Le.prototype,"cellItemTemplate",void 0);I([rt],Le.prototype,"headerCellItemTemplate",void 0);I([rt],Le.prototype,"focusRowIndex",void 0);I([rt],Le.prototype,"focusColumnIndex",void 0);I([rt],Le.prototype,"defaultRowItemTemplate",void 0);I([rt],Le.prototype,"rowElementTag",void 0);I([rt],Le.prototype,"rowElements",void 0);const v5=Rt`
    <template>
        ${e=>e.rowData===null||e.columnDefinition===null||e.columnDefinition.columnDataKey===null?null:e.rowData[e.columnDefinition.columnDataKey]}
    </template>
`,w5=Rt`
    <template>
        ${e=>e.columnDefinition===null?null:e.columnDefinition.title===void 0?e.columnDefinition.columnDataKey:e.columnDefinition.title}
    </template>
`;let Mi=class extends Xt{constructor(){super(...arguments),this.cellType=yi.default,this.rowData=null,this.columnDefinition=null,this.isActiveCell=!1,this.customCellView=null,this.updateCellStyle=()=>{this.style.gridColumn=this.gridColumn}}cellTypeChanged(){this.$fastController.isConnected&&this.updateCellView()}gridColumnChanged(){this.$fastController.isConnected&&this.updateCellStyle()}columnDefinitionChanged(t,r){this.$fastController.isConnected&&this.updateCellView()}connectedCallback(){var t;super.connectedCallback(),this.addEventListener(Zf,this.handleFocusin),this.addEventListener(ls,this.handleFocusout),this.addEventListener(cs,this.handleKeydown),this.style.gridColumn=`${((t=this.columnDefinition)===null||t===void 0?void 0:t.gridColumn)===void 0?0:this.columnDefinition.gridColumn}`,this.updateCellView(),this.updateCellStyle()}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener(Zf,this.handleFocusin),this.removeEventListener(ls,this.handleFocusout),this.removeEventListener(cs,this.handleKeydown),this.disconnectCellView()}handleFocusin(t){if(!this.isActiveCell){switch(this.isActiveCell=!0,this.cellType){case yi.columnHeader:if(this.columnDefinition!==null&&this.columnDefinition.headerCellInternalFocusQueue!==!0&&typeof this.columnDefinition.headerCellFocusTargetCallback=="function"){const r=this.columnDefinition.headerCellFocusTargetCallback(this);r!==null&&r.focus()}break;default:if(this.columnDefinition!==null&&this.columnDefinition.cellInternalFocusQueue!==!0&&typeof this.columnDefinition.cellFocusTargetCallback=="function"){const r=this.columnDefinition.cellFocusTargetCallback(this);r!==null&&r.focus()}break}this.$emit("cell-focused",this)}}handleFocusout(t){this!==document.activeElement&&!this.contains(document.activeElement)&&(this.isActiveCell=!1)}handleKeydown(t){if(!(t.defaultPrevented||this.columnDefinition===null||this.cellType===yi.default&&this.columnDefinition.cellInternalFocusQueue!==!0||this.cellType===yi.columnHeader&&this.columnDefinition.headerCellInternalFocusQueue!==!0))switch(t.key){case Ko:case a5:if(this.contains(document.activeElement)&&document.activeElement!==this)return;switch(this.cellType){case yi.columnHeader:if(this.columnDefinition.headerCellFocusTargetCallback!==void 0){const r=this.columnDefinition.headerCellFocusTargetCallback(this);r!==null&&r.focus(),t.preventDefault()}break;default:if(this.columnDefinition.cellFocusTargetCallback!==void 0){const r=this.columnDefinition.cellFocusTargetCallback(this);r!==null&&r.focus(),t.preventDefault()}break}break;case ac:this.contains(document.activeElement)&&document.activeElement!==this&&(this.focus(),t.preventDefault());break}}updateCellView(){if(this.disconnectCellView(),this.columnDefinition!==null)switch(this.cellType){case yi.columnHeader:this.columnDefinition.headerCellTemplate!==void 0?this.customCellView=this.columnDefinition.headerCellTemplate.render(this,this):this.customCellView=w5.render(this,this);break;case void 0:case yi.rowHeader:case yi.default:this.columnDefinition.cellTemplate!==void 0?this.customCellView=this.columnDefinition.cellTemplate.render(this,this):this.customCellView=v5.render(this,this);break}}disconnectCellView(){this.customCellView!==null&&(this.customCellView.dispose(),this.customCellView=null)}};I([U({attribute:"cell-type"})],Mi.prototype,"cellType",void 0);I([U({attribute:"grid-column"})],Mi.prototype,"gridColumn",void 0);I([rt],Mi.prototype,"rowData",void 0);I([rt],Mi.prototype,"columnDefinition",void 0);function k5(e){const t=e.tagFor(Mi);return Rt`
    <${t}
        cell-type="${r=>r.isRowHeader?"rowheader":void 0}"
        grid-column="${(r,i)=>i.index+1}"
        :rowData="${(r,i)=>i.parent.rowData}"
        :columnDefinition="${r=>r}"
    ></${t}>
`}function C5(e){const t=e.tagFor(Mi);return Rt`
    <${t}
        cell-type="columnheader"
        grid-column="${(r,i)=>i.index+1}"
        :columnDefinition="${r=>r}"
    ></${t}>
`}const S5=(e,t)=>{const r=k5(e),i=C5(e);return Rt`
        <template
            role="row"
            class="${n=>n.rowType!=="default"?n.rowType:""}"
            :defaultCellItemTemplate="${r}"
            :defaultHeaderCellItemTemplate="${i}"
            ${gx({property:"cellElements",filter:Vu('[role="cell"],[role="gridcell"],[role="columnheader"],[role="rowheader"]')})}
        >
            <slot ${xr("slottedCellElements")}></slot>
        </template>
    `},_5=(e,t)=>Rt`
        <template
            tabindex="-1"
            role="${r=>!r.cellType||r.cellType==="default"?"gridcell":r.cellType}"
            class="
            ${r=>r.cellType==="columnheader"?"column-header":r.cellType==="rowheader"?"row-header":""}
            "
        >
            <slot></slot>
        </template>
    `,T5=(e,t)=>Rt`
    <template
        role="checkbox"
        aria-checked="${r=>r.checked}"
        aria-required="${r=>r.required}"
        aria-disabled="${r=>r.disabled}"
        aria-readonly="${r=>r.readOnly}"
        tabindex="${r=>r.disabled?null:0}"
        @keypress="${(r,i)=>r.keypressHandler(i.event)}"
        @click="${(r,i)=>r.clickHandler(i.event)}"
        class="${r=>r.readOnly?"readonly":""} ${r=>r.checked?"checked":""} ${r=>r.indeterminate?"indeterminate":""}"
    >
        <div part="control" class="control">
            <slot name="checked-indicator">
                ${t.checkedIndicator||""}
            </slot>
            <slot name="indeterminate-indicator">
                ${t.indeterminateIndicator||""}
            </slot>
        </div>
        <label
            part="label"
            class="${r=>r.defaultSlottedNodes&&r.defaultSlottedNodes.length?"label":"label label__hidden"}"
        >
            <slot ${xr("defaultSlottedNodes")}></slot>
        </label>
    </template>
`;class $5 extends Xt{}class A5 extends kx($5){constructor(){super(...arguments),this.proxy=document.createElement("input")}}let cc=class extends A5{constructor(){super(),this.initialValue="on",this.indeterminate=!1,this.keypressHandler=t=>{if(!this.readOnly)switch(t.key){case ta:this.indeterminate&&(this.indeterminate=!1),this.checked=!this.checked;break}},this.clickHandler=t=>{!this.disabled&&!this.readOnly&&(this.indeterminate&&(this.indeterminate=!1),this.checked=!this.checked)},this.proxy.setAttribute("type","checkbox")}readOnlyChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.readOnly=this.readOnly)}};I([U({attribute:"readonly",mode:"boolean"})],cc.prototype,"readOnly",void 0);I([rt],cc.prototype,"defaultSlottedNodes",void 0);I([rt],cc.prototype,"indeterminate",void 0);function Cx(e){return n5(e)&&(e.getAttribute("role")==="option"||e instanceof HTMLOptionElement)}class pi extends Xt{constructor(t,r,i,n){super(),this.defaultSelected=!1,this.dirtySelected=!1,this.selected=this.defaultSelected,this.dirtyValue=!1,t&&(this.textContent=t),r&&(this.initialValue=r),i&&(this.defaultSelected=i),n&&(this.selected=n),this.proxy=new Option(`${this.textContent}`,this.initialValue,this.defaultSelected,this.selected),this.proxy.disabled=this.disabled}checkedChanged(t,r){if(typeof r=="boolean"){this.ariaChecked=r?"true":"false";return}this.ariaChecked=null}contentChanged(t,r){this.proxy instanceof HTMLOptionElement&&(this.proxy.textContent=this.textContent),this.$emit("contentchange",null,{bubbles:!0})}defaultSelectedChanged(){this.dirtySelected||(this.selected=this.defaultSelected,this.proxy instanceof HTMLOptionElement&&(this.proxy.selected=this.defaultSelected))}disabledChanged(t,r){this.ariaDisabled=this.disabled?"true":"false",this.proxy instanceof HTMLOptionElement&&(this.proxy.disabled=this.disabled)}selectedAttributeChanged(){this.defaultSelected=this.selectedAttribute,this.proxy instanceof HTMLOptionElement&&(this.proxy.defaultSelected=this.defaultSelected)}selectedChanged(){this.ariaSelected=this.selected?"true":"false",this.dirtySelected||(this.dirtySelected=!0),this.proxy instanceof HTMLOptionElement&&(this.proxy.selected=this.selected)}initialValueChanged(t,r){this.dirtyValue||(this.value=this.initialValue,this.dirtyValue=!1)}get label(){var t;return(t=this.value)!==null&&t!==void 0?t:this.text}get text(){var t,r;return(r=(t=this.textContent)===null||t===void 0?void 0:t.replace(/\s+/g," ").trim())!==null&&r!==void 0?r:""}set value(t){const r=`${t??""}`;this._value=r,this.dirtyValue=!0,this.proxy instanceof HTMLOptionElement&&(this.proxy.value=r),$t.notify(this,"value")}get value(){var t;return $t.track(this,"value"),(t=this._value)!==null&&t!==void 0?t:this.text}get form(){return this.proxy?this.proxy.form:null}}I([rt],pi.prototype,"checked",void 0);I([rt],pi.prototype,"content",void 0);I([rt],pi.prototype,"defaultSelected",void 0);I([U({mode:"boolean"})],pi.prototype,"disabled",void 0);I([U({attribute:"selected",mode:"boolean"})],pi.prototype,"selectedAttribute",void 0);I([rt],pi.prototype,"selected",void 0);I([U({attribute:"value",mode:"fromView"})],pi.prototype,"initialValue",void 0);class js{}I([rt],js.prototype,"ariaChecked",void 0);I([rt],js.prototype,"ariaPosInSet",void 0);I([rt],js.prototype,"ariaSelected",void 0);I([rt],js.prototype,"ariaSetSize",void 0);er(js,Qt);er(pi,Ss,js);class ze extends Xt{constructor(){super(...arguments),this._options=[],this.selectedIndex=-1,this.selectedOptions=[],this.shouldSkipFocus=!1,this.typeaheadBuffer="",this.typeaheadExpired=!0,this.typeaheadTimeout=-1}get firstSelectedOption(){var t;return(t=this.selectedOptions[0])!==null&&t!==void 0?t:null}get hasSelectableOptions(){return this.options.length>0&&!this.options.every(t=>t.disabled)}get length(){var t,r;return(r=(t=this.options)===null||t===void 0?void 0:t.length)!==null&&r!==void 0?r:0}get options(){return $t.track(this,"options"),this._options}set options(t){this._options=t,$t.notify(this,"options")}get typeAheadExpired(){return this.typeaheadExpired}set typeAheadExpired(t){this.typeaheadExpired=t}clickHandler(t){const r=t.target.closest("option,[role=option]");if(r&&!r.disabled)return this.selectedIndex=this.options.indexOf(r),!0}focusAndScrollOptionIntoView(t=this.firstSelectedOption){this.contains(document.activeElement)&&t!==null&&(t.focus(),requestAnimationFrame(()=>{t.scrollIntoView({block:"nearest"})}))}focusinHandler(t){!this.shouldSkipFocus&&t.target===t.currentTarget&&(this.setSelectedOptions(),this.focusAndScrollOptionIntoView()),this.shouldSkipFocus=!1}getTypeaheadMatches(){const t=this.typeaheadBuffer.replace(/[.*+\-?^${}()|[\]\\]/g,"\\$&"),r=new RegExp(`^${t}`,"gi");return this.options.filter(i=>i.text.trim().match(r))}getSelectableIndex(t=this.selectedIndex,r){const i=t>r?-1:t<r?1:0,n=t+i;let s=null;switch(i){case-1:{s=this.options.reduceRight((o,a,l)=>!o&&!a.disabled&&l<n?a:o,s);break}case 1:{s=this.options.reduce((o,a,l)=>!o&&!a.disabled&&l>n?a:o,s);break}}return this.options.indexOf(s)}handleChange(t,r){switch(r){case"selected":{ze.slottedOptionFilter(t)&&(this.selectedIndex=this.options.indexOf(t)),this.setSelectedOptions();break}}}handleTypeAhead(t){this.typeaheadTimeout&&window.clearTimeout(this.typeaheadTimeout),this.typeaheadTimeout=window.setTimeout(()=>this.typeaheadExpired=!0,ze.TYPE_AHEAD_TIMEOUT_MS),!(t.length>1)&&(this.typeaheadBuffer=`${this.typeaheadExpired?"":this.typeaheadBuffer}${t}`)}keydownHandler(t){if(this.disabled)return!0;this.shouldSkipFocus=!1;const r=t.key;switch(r){case $s:{t.shiftKey||(t.preventDefault(),this.selectFirstOption());break}case bn:{t.shiftKey||(t.preventDefault(),this.selectNextOption());break}case yn:{t.shiftKey||(t.preventDefault(),this.selectPreviousOption());break}case As:{t.preventDefault(),this.selectLastOption();break}case Gu:return this.focusAndScrollOptionIntoView(),!0;case Ko:case ac:return!0;case ta:if(this.typeaheadExpired)return!0;default:return r.length===1&&this.handleTypeAhead(`${r}`),!0}}mousedownHandler(t){return this.shouldSkipFocus=!this.contains(document.activeElement),!0}multipleChanged(t,r){this.ariaMultiSelectable=r?"true":null}selectedIndexChanged(t,r){var i;if(!this.hasSelectableOptions){this.selectedIndex=-1;return}if(!((i=this.options[this.selectedIndex])===null||i===void 0)&&i.disabled&&typeof t=="number"){const n=this.getSelectableIndex(t,r),s=n>-1?n:t;this.selectedIndex=s,r===s&&this.selectedIndexChanged(r,s);return}this.setSelectedOptions()}selectedOptionsChanged(t,r){var i;const n=r.filter(ze.slottedOptionFilter);(i=this.options)===null||i===void 0||i.forEach(s=>{const o=$t.getNotifier(s);o.unsubscribe(this,"selected"),s.selected=n.includes(s),o.subscribe(this,"selected")})}selectFirstOption(){var t,r;this.disabled||(this.selectedIndex=(r=(t=this.options)===null||t===void 0?void 0:t.findIndex(i=>!i.disabled))!==null&&r!==void 0?r:-1)}selectLastOption(){this.disabled||(this.selectedIndex=r5(this.options,t=>!t.disabled))}selectNextOption(){!this.disabled&&this.selectedIndex<this.options.length-1&&(this.selectedIndex+=1)}selectPreviousOption(){!this.disabled&&this.selectedIndex>0&&(this.selectedIndex=this.selectedIndex-1)}setDefaultSelectedOption(){var t,r;this.selectedIndex=(r=(t=this.options)===null||t===void 0?void 0:t.findIndex(i=>i.defaultSelected))!==null&&r!==void 0?r:-1}setSelectedOptions(){var t,r,i;!((t=this.options)===null||t===void 0)&&t.length&&(this.selectedOptions=[this.options[this.selectedIndex]],this.ariaActiveDescendant=(i=(r=this.firstSelectedOption)===null||r===void 0?void 0:r.id)!==null&&i!==void 0?i:"",this.focusAndScrollOptionIntoView())}slottedOptionsChanged(t,r){this.options=r.reduce((n,s)=>(Cx(s)&&n.push(s),n),[]);const i=`${this.options.length}`;this.options.forEach((n,s)=>{n.id||(n.id=yl("option-")),n.ariaPosInSet=`${s+1}`,n.ariaSetSize=i}),this.$fastController.isConnected&&(this.setSelectedOptions(),this.setDefaultSelectedOption())}typeaheadBufferChanged(t,r){if(this.$fastController.isConnected){const i=this.getTypeaheadMatches();if(i.length){const n=this.options.indexOf(i[0]);n>-1&&(this.selectedIndex=n)}this.typeaheadExpired=!1}}}ze.slottedOptionFilter=e=>Cx(e)&&!e.hidden;ze.TYPE_AHEAD_TIMEOUT_MS=1e3;I([U({mode:"boolean"})],ze.prototype,"disabled",void 0);I([rt],ze.prototype,"selectedIndex",void 0);I([rt],ze.prototype,"selectedOptions",void 0);I([rt],ze.prototype,"slottedOptions",void 0);I([rt],ze.prototype,"typeaheadBuffer",void 0);class vn{}I([rt],vn.prototype,"ariaActiveDescendant",void 0);I([rt],vn.prototype,"ariaDisabled",void 0);I([rt],vn.prototype,"ariaExpanded",void 0);I([rt],vn.prototype,"ariaMultiSelectable",void 0);er(vn,Qt);er(ze,vn);const uh={above:"above",below:"below"};function Td(e){const t=e.parentElement;if(t)return t;{const r=e.getRootNode();if(r.host instanceof HTMLElement)return r.host}return null}function j5(e,t){let r=t;for(;r!==null;){if(r===e)return!0;r=Td(r)}return!1}const ai=document.createElement("div");function E5(e){return e instanceof oc}class Xu{setProperty(t,r){At.queueUpdate(()=>this.target.setProperty(t,r))}removeProperty(t){At.queueUpdate(()=>this.target.removeProperty(t))}}class L5 extends Xu{constructor(t){super();const r=new CSSStyleSheet;r[rx]=!0,this.target=r.cssRules[r.insertRule(":host{}")].style,t.$fastController.addStyles(Ke.create([r]))}}class B5 extends Xu{constructor(){super();const t=new CSSStyleSheet;this.target=t.cssRules[t.insertRule(":root{}")].style,document.adoptedStyleSheets=[...document.adoptedStyleSheets,t]}}class M5 extends Xu{constructor(){super(),this.style=document.createElement("style"),document.head.appendChild(this.style);const{sheet:t}=this.style;if(t){const r=t.insertRule(":root{}",t.cssRules.length);this.target=t.cssRules[r].style}}}class Sx{constructor(t){this.store=new Map,this.target=null;const r=t.$fastController;this.style=document.createElement("style"),r.addStyles(this.style),$t.getNotifier(r).subscribe(this,"isConnected"),this.handleChange(r,"isConnected")}targetChanged(){if(this.target!==null)for(const[t,r]of this.store.entries())this.target.setProperty(t,r)}setProperty(t,r){this.store.set(t,r),At.queueUpdate(()=>{this.target!==null&&this.target.setProperty(t,r)})}removeProperty(t){this.store.delete(t),At.queueUpdate(()=>{this.target!==null&&this.target.removeProperty(t)})}handleChange(t,r){const{sheet:i}=this.style;if(i){const n=i.insertRule(":host{}",i.cssRules.length);this.target=i.cssRules[n].style}else this.target=null}}I([rt],Sx.prototype,"target",void 0);class I5{constructor(t){this.target=t.style}setProperty(t,r){At.queueUpdate(()=>this.target.setProperty(t,r))}removeProperty(t){At.queueUpdate(()=>this.target.removeProperty(t))}}class me{setProperty(t,r){me.properties[t]=r;for(const i of me.roots.values())qn.getOrCreate(me.normalizeRoot(i)).setProperty(t,r)}removeProperty(t){delete me.properties[t];for(const r of me.roots.values())qn.getOrCreate(me.normalizeRoot(r)).removeProperty(t)}static registerRoot(t){const{roots:r}=me;if(!r.has(t)){r.add(t);const i=qn.getOrCreate(this.normalizeRoot(t));for(const n in me.properties)i.setProperty(n,me.properties[n])}}static unregisterRoot(t){const{roots:r}=me;if(r.has(t)){r.delete(t);const i=qn.getOrCreate(me.normalizeRoot(t));for(const n in me.properties)i.removeProperty(n)}}static normalizeRoot(t){return t===ai?document:t}}me.roots=new Set;me.properties={};const ph=new WeakMap,O5=At.supportsAdoptedStyleSheets?L5:Sx,qn=Object.freeze({getOrCreate(e){if(ph.has(e))return ph.get(e);let t;return e===ai?t=new me:e instanceof Document?t=At.supportsAdoptedStyleSheets?new B5:new M5:E5(e)?t=new O5(e):t=new I5(e),ph.set(e,t),t}});class De extends lx{constructor(t){super(),this.subscribers=new WeakMap,this._appliedTo=new Set,this.name=t.name,t.cssCustomPropertyName!==null&&(this.cssCustomProperty=`--${t.cssCustomPropertyName}`,this.cssVar=`var(${this.cssCustomProperty})`),this.id=De.uniqueId(),De.tokensById.set(this.id,this)}get appliedTo(){return[...this._appliedTo]}static from(t){return new De({name:typeof t=="string"?t:t.name,cssCustomPropertyName:typeof t=="string"?t:t.cssCustomPropertyName===void 0?t.name:t.cssCustomPropertyName})}static isCSSDesignToken(t){return typeof t.cssCustomProperty=="string"}static isDerivedDesignTokenValue(t){return typeof t=="function"}static getTokenById(t){return De.tokensById.get(t)}getOrCreateSubscriberSet(t=this){return this.subscribers.get(t)||this.subscribers.set(t,new Set)&&this.subscribers.get(t)}createCSS(){return this.cssVar||""}getValueFor(t){const r=ee.getOrCreate(t).get(this);if(r!==void 0)return r;throw new Error(`Value could not be retrieved for token named "${this.name}". Ensure the value is set for ${t} or an ancestor of ${t}.`)}setValueFor(t,r){return this._appliedTo.add(t),r instanceof De&&(r=this.alias(r)),ee.getOrCreate(t).set(this,r),this}deleteValueFor(t){return this._appliedTo.delete(t),ee.existsFor(t)&&ee.getOrCreate(t).delete(this),this}withDefault(t){return this.setValueFor(ai,t),this}subscribe(t,r){const i=this.getOrCreateSubscriberSet(r);r&&!ee.existsFor(r)&&ee.getOrCreate(r),i.has(t)||i.add(t)}unsubscribe(t,r){const i=this.subscribers.get(r||this);i&&i.has(t)&&i.delete(t)}notify(t){const r=Object.freeze({token:this,target:t});this.subscribers.has(this)&&this.subscribers.get(this).forEach(i=>i.handleChange(r)),this.subscribers.has(t)&&this.subscribers.get(t).forEach(i=>i.handleChange(r))}alias(t){return r=>t.getValueFor(r)}}De.uniqueId=(()=>{let e=0;return()=>(e++,e.toString(16))})();De.tokensById=new Map;class R5{startReflection(t,r){t.subscribe(this,r),this.handleChange({token:t,target:r})}stopReflection(t,r){t.unsubscribe(this,r),this.remove(t,r)}handleChange(t){const{token:r,target:i}=t;this.add(r,i)}add(t,r){qn.getOrCreate(r).setProperty(t.cssCustomProperty,this.resolveCSSValue(ee.getOrCreate(r).get(t)))}remove(t,r){qn.getOrCreate(r).removeProperty(t.cssCustomProperty)}resolveCSSValue(t){return t&&typeof t.createCSS=="function"?t.createCSS():t}}class D5{constructor(t,r,i){this.source=t,this.token=r,this.node=i,this.dependencies=new Set,this.observer=$t.binding(t,this,!1),this.observer.handleChange=this.observer.call,this.handleChange()}disconnect(){this.observer.disconnect()}handleChange(){try{this.node.store.set(this.token,this.observer.observe(this.node.target,yo))}catch(t){console.error(t)}}}class F5{constructor(){this.values=new Map}set(t,r){this.values.get(t)!==r&&(this.values.set(t,r),$t.getNotifier(this).notify(t.id))}get(t){return $t.track(this,t.id),this.values.get(t)}delete(t){this.values.delete(t),$t.getNotifier(this).notify(t.id)}all(){return this.values.entries()}}const Ws=new WeakMap,Vs=new WeakMap;class ee{constructor(t){this.target=t,this.store=new F5,this.children=[],this.assignedValues=new Map,this.reflecting=new Set,this.bindingObservers=new Map,this.tokenValueChangeHandler={handleChange:(r,i)=>{const n=De.getTokenById(i);n&&(n.notify(this.target),this.updateCSSTokenReflection(r,n))}},Ws.set(t,this),$t.getNotifier(this.store).subscribe(this.tokenValueChangeHandler),t instanceof oc?t.$fastController.addBehaviors([this]):t.isConnected&&this.bind()}static getOrCreate(t){return Ws.get(t)||new ee(t)}static existsFor(t){return Ws.has(t)}static findParent(t){if(ai!==t.target){let r=Td(t.target);for(;r!==null;){if(Ws.has(r))return Ws.get(r);r=Td(r)}return ee.getOrCreate(ai)}return null}static findClosestAssignedNode(t,r){let i=r;do{if(i.has(t))return i;i=i.parent?i.parent:i.target!==ai?ee.getOrCreate(ai):null}while(i!==null);return null}get parent(){return Vs.get(this)||null}updateCSSTokenReflection(t,r){if(De.isCSSDesignToken(r)){const i=this.parent,n=this.isReflecting(r);if(i){const s=i.get(r),o=t.get(r);s!==o&&!n?this.reflectToCSS(r):s===o&&n&&this.stopReflectToCSS(r)}else n||this.reflectToCSS(r)}}has(t){return this.assignedValues.has(t)}get(t){const r=this.store.get(t);if(r!==void 0)return r;const i=this.getRaw(t);if(i!==void 0)return this.hydrate(t,i),this.get(t)}getRaw(t){var r;return this.assignedValues.has(t)?this.assignedValues.get(t):(r=ee.findClosestAssignedNode(t,this))===null||r===void 0?void 0:r.getRaw(t)}set(t,r){De.isDerivedDesignTokenValue(this.assignedValues.get(t))&&this.tearDownBindingObserver(t),this.assignedValues.set(t,r),De.isDerivedDesignTokenValue(r)?this.setupBindingObserver(t,r):this.store.set(t,r)}delete(t){this.assignedValues.delete(t),this.tearDownBindingObserver(t);const r=this.getRaw(t);r?this.hydrate(t,r):this.store.delete(t)}bind(){const t=ee.findParent(this);t&&t.appendChild(this);for(const r of this.assignedValues.keys())r.notify(this.target)}unbind(){this.parent&&Vs.get(this).removeChild(this);for(const t of this.bindingObservers.keys())this.tearDownBindingObserver(t)}appendChild(t){t.parent&&Vs.get(t).removeChild(t);const r=this.children.filter(i=>t.contains(i));Vs.set(t,this),this.children.push(t),r.forEach(i=>t.appendChild(i)),$t.getNotifier(this.store).subscribe(t);for(const[i,n]of this.store.all())t.hydrate(i,this.bindingObservers.has(i)?this.getRaw(i):n),t.updateCSSTokenReflection(t.store,i)}removeChild(t){const r=this.children.indexOf(t);if(r!==-1&&this.children.splice(r,1),$t.getNotifier(this.store).unsubscribe(t),t.parent!==this)return!1;const i=Vs.delete(t);for(const[n]of this.store.all())t.hydrate(n,t.getRaw(n)),t.updateCSSTokenReflection(t.store,n);return i}contains(t){return j5(this.target,t.target)}reflectToCSS(t){this.isReflecting(t)||(this.reflecting.add(t),ee.cssCustomPropertyReflector.startReflection(t,this.target))}stopReflectToCSS(t){this.isReflecting(t)&&(this.reflecting.delete(t),ee.cssCustomPropertyReflector.stopReflection(t,this.target))}isReflecting(t){return this.reflecting.has(t)}handleChange(t,r){const i=De.getTokenById(r);i&&(this.hydrate(i,this.getRaw(i)),this.updateCSSTokenReflection(this.store,i))}hydrate(t,r){if(!this.has(t)){const i=this.bindingObservers.get(t);De.isDerivedDesignTokenValue(r)?i?i.source!==r&&(this.tearDownBindingObserver(t),this.setupBindingObserver(t,r)):this.setupBindingObserver(t,r):(i&&this.tearDownBindingObserver(t),this.store.set(t,r))}}setupBindingObserver(t,r){const i=new D5(r,t,this);return this.bindingObservers.set(t,i),i}tearDownBindingObserver(t){return this.bindingObservers.has(t)?(this.bindingObservers.get(t).disconnect(),this.bindingObservers.delete(t),!0):!1}}ee.cssCustomPropertyReflector=new R5;I([rt],ee.prototype,"children",void 0);function P5(e){return De.from(e)}const _x=Object.freeze({create:P5,notifyConnection(e){return!e.isConnected||!ee.existsFor(e)?!1:(ee.getOrCreate(e).bind(),!0)},notifyDisconnection(e){return e.isConnected||!ee.existsFor(e)?!1:(ee.getOrCreate(e).unbind(),!0)},registerRoot(e=ai){me.registerRoot(e)},unregisterRoot(e=ai){me.unregisterRoot(e)}}),fh=Object.freeze({definitionCallbackOnly:null,ignoreDuplicate:Symbol()}),gh=new Map,Ya=new Map;let Gn=null;const Us=Jt.createInterface(e=>e.cachedCallback(t=>(Gn===null&&(Gn=new $x(null,t)),Gn))),Tx=Object.freeze({tagFor(e){return Ya.get(e)},responsibleFor(e){const t=e.$$designSystem$$;return t||Jt.findResponsibleContainer(e).get(Us)},getOrCreate(e){if(!e)return Gn===null&&(Gn=Jt.getOrCreateDOMContainer().get(Us)),Gn;const t=e.$$designSystem$$;if(t)return t;const r=Jt.getOrCreateDOMContainer(e);if(r.has(Us,!1))return r.get(Us);{const i=new $x(e,r);return r.register(Lo.instance(Us,i)),i}}});function N5(e,t,r){return typeof e=="string"?{name:e,type:t,callback:r}:e}class $x{constructor(t,r){this.owner=t,this.container=r,this.designTokensInitialized=!1,this.prefix="fast",this.shadowRootMode=void 0,this.disambiguate=()=>fh.definitionCallbackOnly,t!==null&&(t.$$designSystem$$=this)}withPrefix(t){return this.prefix=t,this}withShadowRootMode(t){return this.shadowRootMode=t,this}withElementDisambiguation(t){return this.disambiguate=t,this}withDesignTokenRoot(t){return this.designTokenRoot=t,this}register(...t){const r=this.container,i=[],n=this.disambiguate,s=this.shadowRootMode,o={elementPrefix:this.prefix,tryDefineElement(a,l,c){const d=N5(a,l,c),{name:u,callback:p,baseClass:f}=d;let{type:g}=d,x=u,v=gh.get(x),y=!0;for(;v;){const b=n(x,g,v);switch(b){case fh.ignoreDuplicate:return;case fh.definitionCallbackOnly:y=!1,v=void 0;break;default:x=b,v=gh.get(x);break}}y&&((Ya.has(g)||g===Xt)&&(g=class extends g{}),gh.set(x,g),Ya.set(g,x),f&&Ya.set(f,x)),i.push(new z5(r,x,g,s,p,y))}};this.designTokensInitialized||(this.designTokensInitialized=!0,this.designTokenRoot!==null&&_x.registerRoot(this.designTokenRoot)),r.registerWithContext(o,...t);for(const a of i)a.callback(a),a.willDefine&&a.definition!==null&&a.definition.define();return this}}class z5{constructor(t,r,i,n,s,o){this.container=t,this.name=r,this.type=i,this.shadowRootMode=n,this.callback=s,this.willDefine=o,this.definition=null}definePresentation(t){yx.define(this.name,t,this.container)}defineElement(t){this.definition=new Jo(this.type,Object.assign(Object.assign({},t),{name:this.name}))}tagFor(t){return Tx.tagFor(t)}}const H5=(e,t)=>Rt`
    <template role="${r=>r.role}" aria-orientation="${r=>r.orientation}"></template>
`,q5={separator:"separator",presentation:"presentation"};let Qu=class extends Xt{constructor(){super(...arguments),this.role=q5.separator,this.orientation=Uu.horizontal}};I([U],Qu.prototype,"role",void 0);I([U],Qu.prototype,"orientation",void 0);const W5=(e,t)=>Rt`
    <template
        aria-checked="${r=>r.ariaChecked}"
        aria-disabled="${r=>r.ariaDisabled}"
        aria-posinset="${r=>r.ariaPosInSet}"
        aria-selected="${r=>r.ariaSelected}"
        aria-setsize="${r=>r.ariaSetSize}"
        class="${r=>[r.checked&&"checked",r.selected&&"selected",r.disabled&&"disabled"].filter(Boolean).join(" ")}"
        role="option"
    >
        ${Ts(e,t)}
        <span class="content" part="content">
            <slot ${xr("content")}></slot>
        </span>
        ${_s(e,t)}
    </template>
`;class hc extends ze{constructor(){super(...arguments),this.activeIndex=-1,this.rangeStartIndex=-1}get activeOption(){return this.options[this.activeIndex]}get checkedOptions(){var t;return(t=this.options)===null||t===void 0?void 0:t.filter(r=>r.checked)}get firstSelectedOptionIndex(){return this.options.indexOf(this.firstSelectedOption)}activeIndexChanged(t,r){var i,n;this.ariaActiveDescendant=(n=(i=this.options[r])===null||i===void 0?void 0:i.id)!==null&&n!==void 0?n:"",this.focusAndScrollOptionIntoView()}checkActiveIndex(){if(!this.multiple)return;const t=this.activeOption;t&&(t.checked=!0)}checkFirstOption(t=!1){t?(this.rangeStartIndex===-1&&(this.rangeStartIndex=this.activeIndex+1),this.options.forEach((r,i)=>{r.checked=Ca(i,this.rangeStartIndex)})):this.uncheckAllOptions(),this.activeIndex=0,this.checkActiveIndex()}checkLastOption(t=!1){t?(this.rangeStartIndex===-1&&(this.rangeStartIndex=this.activeIndex),this.options.forEach((r,i)=>{r.checked=Ca(i,this.rangeStartIndex,this.options.length)})):this.uncheckAllOptions(),this.activeIndex=this.options.length-1,this.checkActiveIndex()}connectedCallback(){super.connectedCallback(),this.addEventListener("focusout",this.focusoutHandler)}disconnectedCallback(){this.removeEventListener("focusout",this.focusoutHandler),super.disconnectedCallback()}checkNextOption(t=!1){t?(this.rangeStartIndex===-1&&(this.rangeStartIndex=this.activeIndex),this.options.forEach((r,i)=>{r.checked=Ca(i,this.rangeStartIndex,this.activeIndex+1)})):this.uncheckAllOptions(),this.activeIndex+=this.activeIndex<this.options.length-1?1:0,this.checkActiveIndex()}checkPreviousOption(t=!1){t?(this.rangeStartIndex===-1&&(this.rangeStartIndex=this.activeIndex),this.checkedOptions.length===1&&(this.rangeStartIndex+=1),this.options.forEach((r,i)=>{r.checked=Ca(i,this.activeIndex,this.rangeStartIndex)})):this.uncheckAllOptions(),this.activeIndex-=this.activeIndex>0?1:0,this.checkActiveIndex()}clickHandler(t){var r;if(!this.multiple)return super.clickHandler(t);const i=(r=t.target)===null||r===void 0?void 0:r.closest("[role=option]");if(!(!i||i.disabled))return this.uncheckAllOptions(),this.activeIndex=this.options.indexOf(i),this.checkActiveIndex(),this.toggleSelectedForAllCheckedOptions(),!0}focusAndScrollOptionIntoView(){super.focusAndScrollOptionIntoView(this.activeOption)}focusinHandler(t){if(!this.multiple)return super.focusinHandler(t);!this.shouldSkipFocus&&t.target===t.currentTarget&&(this.uncheckAllOptions(),this.activeIndex===-1&&(this.activeIndex=this.firstSelectedOptionIndex!==-1?this.firstSelectedOptionIndex:0),this.checkActiveIndex(),this.setSelectedOptions(),this.focusAndScrollOptionIntoView()),this.shouldSkipFocus=!1}focusoutHandler(t){this.multiple&&this.uncheckAllOptions()}keydownHandler(t){if(!this.multiple)return super.keydownHandler(t);if(this.disabled)return!0;const{key:r,shiftKey:i}=t;switch(this.shouldSkipFocus=!1,r){case $s:{this.checkFirstOption(i);return}case bn:{this.checkNextOption(i);return}case yn:{this.checkPreviousOption(i);return}case As:{this.checkLastOption(i);return}case Gu:return this.focusAndScrollOptionIntoView(),!0;case ac:return this.uncheckAllOptions(),this.checkActiveIndex(),!0;case ta:if(t.preventDefault(),this.typeAheadExpired){this.toggleSelectedForAllCheckedOptions();return}default:return r.length===1&&this.handleTypeAhead(`${r}`),!0}}mousedownHandler(t){if(t.offsetX>=0&&t.offsetX<=this.scrollWidth)return super.mousedownHandler(t)}multipleChanged(t,r){var i;this.ariaMultiSelectable=r?"true":null,(i=this.options)===null||i===void 0||i.forEach(n=>{n.checked=r?!1:void 0}),this.setSelectedOptions()}setSelectedOptions(){if(!this.multiple){super.setSelectedOptions();return}this.$fastController.isConnected&&this.options&&(this.selectedOptions=this.options.filter(t=>t.selected),this.focusAndScrollOptionIntoView())}sizeChanged(t,r){var i;const n=Math.max(0,parseInt((i=r?.toFixed())!==null&&i!==void 0?i:"",10));n!==r&&At.queueUpdate(()=>{this.size=n})}toggleSelectedForAllCheckedOptions(){const t=this.checkedOptions.filter(i=>!i.disabled),r=!t.every(i=>i.selected);t.forEach(i=>i.selected=r),this.selectedIndex=this.options.indexOf(t[t.length-1]),this.setSelectedOptions()}typeaheadBufferChanged(t,r){if(!this.multiple){super.typeaheadBufferChanged(t,r);return}if(this.$fastController.isConnected){const i=this.getTypeaheadMatches(),n=this.options.indexOf(i[0]);n>-1&&(this.activeIndex=n,this.uncheckAllOptions(),this.checkActiveIndex()),this.typeAheadExpired=!1}}uncheckAllOptions(t=!1){this.options.forEach(r=>r.checked=this.multiple?!1:void 0),t||(this.rangeStartIndex=-1)}}I([rt],hc.prototype,"activeIndex",void 0);I([U({mode:"boolean"})],hc.prototype,"multiple",void 0);I([U({converter:Ir})],hc.prototype,"size",void 0);class V5 extends Xt{}class U5 extends ra(V5){constructor(){super(...arguments),this.proxy=document.createElement("input")}}const G5={email:"email",password:"password",tel:"tel",text:"text",url:"url"};let cr=class extends U5{constructor(){super(...arguments),this.type=G5.text}readOnlyChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.readOnly=this.readOnly,this.validate())}autofocusChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.autofocus=this.autofocus,this.validate())}placeholderChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.placeholder=this.placeholder)}typeChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.type=this.type,this.validate())}listChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.setAttribute("list",this.list),this.validate())}maxlengthChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.maxLength=this.maxlength,this.validate())}minlengthChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.minLength=this.minlength,this.validate())}patternChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.pattern=this.pattern,this.validate())}sizeChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.size=this.size)}spellcheckChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.spellcheck=this.spellcheck)}connectedCallback(){super.connectedCallback(),this.proxy.setAttribute("type",this.type),this.validate(),this.autofocus&&At.queueUpdate(()=>{this.focus()})}select(){this.control.select(),this.$emit("select")}handleTextInput(){this.value=this.control.value}handleChange(){this.$emit("change")}validate(){super.validate(this.control)}};I([U({attribute:"readonly",mode:"boolean"})],cr.prototype,"readOnly",void 0);I([U({mode:"boolean"})],cr.prototype,"autofocus",void 0);I([U],cr.prototype,"placeholder",void 0);I([U],cr.prototype,"type",void 0);I([U],cr.prototype,"list",void 0);I([U({converter:Ir})],cr.prototype,"maxlength",void 0);I([U({converter:Ir})],cr.prototype,"minlength",void 0);I([U],cr.prototype,"pattern",void 0);I([U({converter:Ir})],cr.prototype,"size",void 0);I([U({mode:"boolean"})],cr.prototype,"spellcheck",void 0);I([rt],cr.prototype,"defaultSlottedNodes",void 0);class Zu{}er(Zu,Qt);er(cr,Ss,Zu);const ig=44,Y5=(e,t)=>Rt`
    <template
        role="progressbar"
        aria-valuenow="${r=>r.value}"
        aria-valuemin="${r=>r.min}"
        aria-valuemax="${r=>r.max}"
        class="${r=>r.paused?"paused":""}"
    >
        ${Wu(r=>typeof r.value=="number",Rt`
                <svg
                    class="progress"
                    part="progress"
                    viewBox="0 0 16 16"
                    slot="determinate"
                >
                    <circle
                        class="background"
                        part="background"
                        cx="8px"
                        cy="8px"
                        r="7px"
                    ></circle>
                    <circle
                        class="determinate"
                        part="determinate"
                        style="stroke-dasharray: ${r=>ig*r.percentComplete/100}px ${ig}px"
                        cx="8px"
                        cy="8px"
                        r="7px"
                    ></circle>
                </svg>
            `,Rt`
                <slot name="indeterminate" slot="indeterminate">
                    ${t.indeterminateIndicator||""}
                </slot>
            `)}
    </template>
`;class Es extends Xt{constructor(){super(...arguments),this.percentComplete=0}valueChanged(){this.$fastController.isConnected&&this.updatePercentComplete()}minChanged(){this.$fastController.isConnected&&this.updatePercentComplete()}maxChanged(){this.$fastController.isConnected&&this.updatePercentComplete()}connectedCallback(){super.connectedCallback(),this.updatePercentComplete()}updatePercentComplete(){const t=typeof this.min=="number"?this.min:0,r=typeof this.max=="number"?this.max:100,i=typeof this.value=="number"?this.value:0,n=r-t;this.percentComplete=n===0?0:Math.fround((i-t)/n*100)}}I([U({converter:Ir})],Es.prototype,"value",void 0);I([U({converter:Ir})],Es.prototype,"min",void 0);I([U({converter:Ir})],Es.prototype,"max",void 0);I([U({mode:"boolean"})],Es.prototype,"paused",void 0);I([rt],Es.prototype,"percentComplete",void 0);const X5=(e,t)=>Rt`
    <template
        role="radiogroup"
        aria-disabled="${r=>r.disabled}"
        aria-readonly="${r=>r.readOnly}"
        @click="${(r,i)=>r.clickHandler(i.event)}"
        @keydown="${(r,i)=>r.keydownHandler(i.event)}"
        @focusout="${(r,i)=>r.focusOutHandler(i.event)}"
    >
        <slot name="label"></slot>
        <div
            class="positioning-region ${r=>r.orientation===Uu.horizontal?"horizontal":"vertical"}"
            part="positioning-region"
        >
            <slot
                ${xr({property:"slottedRadioButtons",filter:Vu("[role=radio]")})}
            ></slot>
        </div>
    </template>
`;let Ii=class extends Xt{constructor(){super(...arguments),this.orientation=Uu.horizontal,this.radioChangeHandler=t=>{const r=t.target;r.checked&&(this.slottedRadioButtons.forEach(i=>{i!==r&&(i.checked=!1,this.isInsideFoundationToolbar||i.setAttribute("tabindex","-1"))}),this.selectedRadio=r,this.value=r.value,r.setAttribute("tabindex","0"),this.focusedRadio=r),t.stopPropagation()},this.moveToRadioByIndex=(t,r)=>{const i=t[r];this.isInsideToolbar||(i.setAttribute("tabindex","0"),i.readOnly?this.slottedRadioButtons.forEach(n=>{n!==i&&n.setAttribute("tabindex","-1")}):(i.checked=!0,this.selectedRadio=i)),this.focusedRadio=i,i.focus()},this.moveRightOffGroup=()=>{var t;(t=this.nextElementSibling)===null||t===void 0||t.focus()},this.moveLeftOffGroup=()=>{var t;(t=this.previousElementSibling)===null||t===void 0||t.focus()},this.focusOutHandler=t=>{const r=this.slottedRadioButtons,i=t.target,n=i!==null?r.indexOf(i):0,s=this.focusedRadio?r.indexOf(this.focusedRadio):-1;return(s===0&&n===s||s===r.length-1&&s===n)&&(this.selectedRadio?(this.focusedRadio=this.selectedRadio,this.isInsideFoundationToolbar||(this.selectedRadio.setAttribute("tabindex","0"),r.forEach(o=>{o!==this.selectedRadio&&o.setAttribute("tabindex","-1")}))):(this.focusedRadio=r[0],this.focusedRadio.setAttribute("tabindex","0"),r.forEach(o=>{o!==this.focusedRadio&&o.setAttribute("tabindex","-1")}))),!0},this.clickHandler=t=>{const r=t.target;if(r){const i=this.slottedRadioButtons;r.checked||i.indexOf(r)===0?(r.setAttribute("tabindex","0"),this.selectedRadio=r):(r.setAttribute("tabindex","-1"),this.selectedRadio=null),this.focusedRadio=r}t.preventDefault()},this.shouldMoveOffGroupToTheRight=(t,r,i)=>t===r.length&&this.isInsideToolbar&&i===Mo,this.shouldMoveOffGroupToTheLeft=(t,r)=>(this.focusedRadio?t.indexOf(this.focusedRadio)-1:0)<0&&this.isInsideToolbar&&r===Bo,this.checkFocusedRadio=()=>{this.focusedRadio!==null&&!this.focusedRadio.readOnly&&!this.focusedRadio.checked&&(this.focusedRadio.checked=!0,this.focusedRadio.setAttribute("tabindex","0"),this.focusedRadio.focus(),this.selectedRadio=this.focusedRadio)},this.moveRight=t=>{const r=this.slottedRadioButtons;let i=0;if(i=this.focusedRadio?r.indexOf(this.focusedRadio)+1:1,this.shouldMoveOffGroupToTheRight(i,r,t.key)){this.moveRightOffGroup();return}else i===r.length&&(i=0);for(;i<r.length&&r.length>1;)if(r[i].disabled){if(this.focusedRadio&&i===r.indexOf(this.focusedRadio))break;if(i+1>=r.length){if(this.isInsideToolbar)break;i=0}else i+=1}else{this.moveToRadioByIndex(r,i);break}},this.moveLeft=t=>{const r=this.slottedRadioButtons;let i=0;if(i=this.focusedRadio?r.indexOf(this.focusedRadio)-1:0,i=i<0?r.length-1:i,this.shouldMoveOffGroupToTheLeft(r,t.key)){this.moveLeftOffGroup();return}for(;i>=0&&r.length>1;)if(r[i].disabled){if(this.focusedRadio&&i===r.indexOf(this.focusedRadio))break;i-1<0?i=r.length-1:i-=1}else{this.moveToRadioByIndex(r,i);break}},this.keydownHandler=t=>{const r=t.key;if(r in h5&&this.isInsideFoundationToolbar)return!0;switch(r){case Ko:{this.checkFocusedRadio();break}case Mo:case bn:{this.direction===hs.ltr?this.moveRight(t):this.moveLeft(t);break}case Bo:case yn:{this.direction===hs.ltr?this.moveLeft(t):this.moveRight(t);break}default:return!0}}}readOnlyChanged(){this.slottedRadioButtons!==void 0&&this.slottedRadioButtons.forEach(t=>{this.readOnly?t.readOnly=!0:t.readOnly=!1})}disabledChanged(){this.slottedRadioButtons!==void 0&&this.slottedRadioButtons.forEach(t=>{this.disabled?t.disabled=!0:t.disabled=!1})}nameChanged(){this.slottedRadioButtons&&this.slottedRadioButtons.forEach(t=>{t.setAttribute("name",this.name)})}valueChanged(){this.slottedRadioButtons&&this.slottedRadioButtons.forEach(t=>{t.value===this.value&&(t.checked=!0,this.selectedRadio=t)}),this.$emit("change")}slottedRadioButtonsChanged(t,r){this.slottedRadioButtons&&this.slottedRadioButtons.length>0&&this.setupRadioButtons()}get parentToolbar(){return this.closest('[role="toolbar"]')}get isInsideToolbar(){var t;return(t=this.parentToolbar)!==null&&t!==void 0?t:!1}get isInsideFoundationToolbar(){var t;return!!(!((t=this.parentToolbar)===null||t===void 0)&&t.$fastController)}connectedCallback(){super.connectedCallback(),this.direction=f5(this),this.setupRadioButtons()}disconnectedCallback(){this.slottedRadioButtons.forEach(t=>{t.removeEventListener("change",this.radioChangeHandler)})}setupRadioButtons(){const t=this.slottedRadioButtons.filter(n=>n.hasAttribute("checked")),r=t?t.length:0;if(r>1){const n=t[r-1];n.checked=!0}let i=!1;if(this.slottedRadioButtons.forEach(n=>{this.name!==void 0&&n.setAttribute("name",this.name),this.disabled&&(n.disabled=!0),this.readOnly&&(n.readOnly=!0),this.value&&this.value===n.value?(this.selectedRadio=n,this.focusedRadio=n,n.checked=!0,n.setAttribute("tabindex","0"),i=!0):(this.isInsideFoundationToolbar||n.setAttribute("tabindex","-1"),n.checked=!1),n.addEventListener("change",this.radioChangeHandler)}),this.value===void 0&&this.slottedRadioButtons.length>0){const n=this.slottedRadioButtons.filter(o=>o.hasAttribute("checked")),s=n!==null?n.length:0;if(s>0&&!i){const o=n[s-1];o.checked=!0,this.focusedRadio=o,o.setAttribute("tabindex","0")}else this.slottedRadioButtons[0].setAttribute("tabindex","0"),this.focusedRadio=this.slottedRadioButtons[0]}}};I([U({attribute:"readonly",mode:"boolean"})],Ii.prototype,"readOnly",void 0);I([U({attribute:"disabled",mode:"boolean"})],Ii.prototype,"disabled",void 0);I([U],Ii.prototype,"name",void 0);I([U],Ii.prototype,"value",void 0);I([U],Ii.prototype,"orientation",void 0);I([rt],Ii.prototype,"childItems",void 0);I([rt],Ii.prototype,"slottedRadioButtons",void 0);const Q5=(e,t)=>Rt`
    <template
        role="radio"
        class="${r=>r.checked?"checked":""} ${r=>r.readOnly?"readonly":""}"
        aria-checked="${r=>r.checked}"
        aria-required="${r=>r.required}"
        aria-disabled="${r=>r.disabled}"
        aria-readonly="${r=>r.readOnly}"
        @keypress="${(r,i)=>r.keypressHandler(i.event)}"
        @click="${(r,i)=>r.clickHandler(i.event)}"
    >
        <div part="control" class="control">
            <slot name="checked-indicator">
                ${t.checkedIndicator||""}
            </slot>
        </div>
        <label
            part="label"
            class="${r=>r.defaultSlottedNodes&&r.defaultSlottedNodes.length?"label":"label label__hidden"}"
        >
            <slot ${xr("defaultSlottedNodes")}></slot>
        </label>
    </template>
`;class Z5 extends Xt{}class J5 extends kx(Z5){constructor(){super(...arguments),this.proxy=document.createElement("input")}}let dc=class extends J5{constructor(){super(),this.initialValue="on",this.keypressHandler=t=>{switch(t.key){case ta:!this.checked&&!this.readOnly&&(this.checked=!0);return}return!0},this.proxy.setAttribute("type","radio")}readOnlyChanged(){this.proxy instanceof HTMLInputElement&&(this.proxy.readOnly=this.readOnly)}defaultCheckedChanged(){var t;this.$fastController.isConnected&&!this.dirtyChecked&&(this.isInsideRadioGroup()||(this.checked=(t=this.defaultChecked)!==null&&t!==void 0?t:!1,this.dirtyChecked=!1))}connectedCallback(){var t,r;super.connectedCallback(),this.validate(),((t=this.parentElement)===null||t===void 0?void 0:t.getAttribute("role"))!=="radiogroup"&&this.getAttribute("tabindex")===null&&(this.disabled||this.setAttribute("tabindex","0")),this.checkedAttribute&&(this.dirtyChecked||this.isInsideRadioGroup()||(this.checked=(r=this.defaultChecked)!==null&&r!==void 0?r:!1,this.dirtyChecked=!1))}isInsideRadioGroup(){return this.closest("[role=radiogroup]")!==null}clickHandler(t){!this.disabled&&!this.readOnly&&!this.checked&&(this.checked=!0)}};I([U({attribute:"readonly",mode:"boolean"})],dc.prototype,"readOnly",void 0);I([rt],dc.prototype,"name",void 0);I([rt],dc.prototype,"defaultSlottedNodes",void 0);function K5(e,t,r){return e.nodeType!==Node.TEXT_NODE?!0:typeof e.nodeValue=="string"&&!!e.nodeValue.trim().length}class tS extends hc{}class eS extends ra(tS){constructor(){super(...arguments),this.proxy=document.createElement("select")}}let Oi=class extends eS{constructor(){super(...arguments),this.open=!1,this.forcedPosition=!1,this.listboxId=yl("listbox-"),this.maxHeight=0}openChanged(t,r){if(this.collapsible){if(this.open){this.ariaControls=this.listboxId,this.ariaExpanded="true",this.setPositioning(),this.focusAndScrollOptionIntoView(),this.indexWhenOpened=this.selectedIndex,At.queueUpdate(()=>this.focus());return}this.ariaControls="",this.ariaExpanded="false"}}get collapsible(){return!(this.multiple||typeof this.size=="number")}get value(){return $t.track(this,"value"),this._value}set value(t){var r,i,n,s,o,a,l;const c=`${this._value}`;if(!((r=this._options)===null||r===void 0)&&r.length){const d=this._options.findIndex(f=>f.value===t),u=(n=(i=this._options[this.selectedIndex])===null||i===void 0?void 0:i.value)!==null&&n!==void 0?n:null,p=(o=(s=this._options[d])===null||s===void 0?void 0:s.value)!==null&&o!==void 0?o:null;(d===-1||u!==p)&&(t="",this.selectedIndex=d),t=(l=(a=this.firstSelectedOption)===null||a===void 0?void 0:a.value)!==null&&l!==void 0?l:t}c!==t&&(this._value=t,super.valueChanged(c,t),$t.notify(this,"value"),this.updateDisplayValue())}updateValue(t){var r,i;this.$fastController.isConnected&&(this.value=(i=(r=this.firstSelectedOption)===null||r===void 0?void 0:r.value)!==null&&i!==void 0?i:""),t&&(this.$emit("input"),this.$emit("change",this,{bubbles:!0,composed:void 0}))}selectedIndexChanged(t,r){super.selectedIndexChanged(t,r),this.updateValue()}positionChanged(t,r){this.positionAttribute=r,this.setPositioning()}setPositioning(){const t=this.getBoundingClientRect(),i=window.innerHeight-t.bottom;this.position=this.forcedPosition?this.positionAttribute:t.top>i?uh.above:uh.below,this.positionAttribute=this.forcedPosition?this.positionAttribute:this.position,this.maxHeight=this.position===uh.above?~~t.top:~~i}get displayValue(){var t,r;return $t.track(this,"displayValue"),(r=(t=this.firstSelectedOption)===null||t===void 0?void 0:t.text)!==null&&r!==void 0?r:""}disabledChanged(t,r){super.disabledChanged&&super.disabledChanged(t,r),this.ariaDisabled=this.disabled?"true":"false"}formResetCallback(){this.setProxyOptions(),super.setDefaultSelectedOption(),this.selectedIndex===-1&&(this.selectedIndex=0)}clickHandler(t){if(!this.disabled){if(this.open){const r=t.target.closest("option,[role=option]");if(r&&r.disabled)return}return super.clickHandler(t),this.open=this.collapsible&&!this.open,!this.open&&this.indexWhenOpened!==this.selectedIndex&&this.updateValue(!0),!0}}focusoutHandler(t){var r;if(super.focusoutHandler(t),!this.open)return!0;const i=t.relatedTarget;if(this.isSameNode(i)){this.focus();return}!((r=this.options)===null||r===void 0)&&r.includes(i)||(this.open=!1,this.indexWhenOpened!==this.selectedIndex&&this.updateValue(!0))}handleChange(t,r){super.handleChange(t,r),r==="value"&&this.updateValue()}slottedOptionsChanged(t,r){this.options.forEach(i=>{$t.getNotifier(i).unsubscribe(this,"value")}),super.slottedOptionsChanged(t,r),this.options.forEach(i=>{$t.getNotifier(i).subscribe(this,"value")}),this.setProxyOptions(),this.updateValue()}mousedownHandler(t){var r;return t.offsetX>=0&&t.offsetX<=((r=this.listbox)===null||r===void 0?void 0:r.scrollWidth)?super.mousedownHandler(t):this.collapsible}multipleChanged(t,r){super.multipleChanged(t,r),this.proxy&&(this.proxy.multiple=r)}selectedOptionsChanged(t,r){var i;super.selectedOptionsChanged(t,r),(i=this.options)===null||i===void 0||i.forEach((n,s)=>{var o;const a=(o=this.proxy)===null||o===void 0?void 0:o.options.item(s);a&&(a.selected=n.selected)})}setDefaultSelectedOption(){var t;const r=(t=this.options)!==null&&t!==void 0?t:Array.from(this.children).filter(ze.slottedOptionFilter),i=r?.findIndex(n=>n.hasAttribute("selected")||n.selected||n.value===this.value);if(i!==-1){this.selectedIndex=i;return}this.selectedIndex=0}setProxyOptions(){this.proxy instanceof HTMLSelectElement&&this.options&&(this.proxy.options.length=0,this.options.forEach(t=>{const r=t.proxy||(t instanceof HTMLOptionElement?t.cloneNode():null);r&&this.proxy.options.add(r)}))}keydownHandler(t){super.keydownHandler(t);const r=t.key||t.key.charCodeAt(0);switch(r){case ta:{t.preventDefault(),this.collapsible&&this.typeAheadExpired&&(this.open=!this.open);break}case $s:case As:{t.preventDefault();break}case Ko:{t.preventDefault(),this.open=!this.open;break}case ac:{this.collapsible&&this.open&&(t.preventDefault(),this.open=!1);break}case Gu:return this.collapsible&&this.open&&(t.preventDefault(),this.open=!1),!0}return!this.open&&this.indexWhenOpened!==this.selectedIndex&&(this.updateValue(!0),this.indexWhenOpened=this.selectedIndex),!(r===bn||r===yn)}connectedCallback(){super.connectedCallback(),this.forcedPosition=!!this.positionAttribute,this.addEventListener("contentchange",this.updateDisplayValue)}disconnectedCallback(){this.removeEventListener("contentchange",this.updateDisplayValue),super.disconnectedCallback()}sizeChanged(t,r){super.sizeChanged(t,r),this.proxy&&(this.proxy.size=r)}updateDisplayValue(){this.collapsible&&$t.notify(this,"displayValue")}};I([U({attribute:"open",mode:"boolean"})],Oi.prototype,"open",void 0);I([nC],Oi.prototype,"collapsible",null);I([rt],Oi.prototype,"control",void 0);I([U({attribute:"position"})],Oi.prototype,"positionAttribute",void 0);I([rt],Oi.prototype,"position",void 0);I([rt],Oi.prototype,"maxHeight",void 0);class Ju{}I([rt],Ju.prototype,"ariaControls",void 0);er(Ju,vn);er(Oi,Ss,Ju);const rS=(e,t)=>Rt`
    <template
        class="${r=>[r.collapsible&&"collapsible",r.collapsible&&r.open&&"open",r.disabled&&"disabled",r.collapsible&&r.position].filter(Boolean).join(" ")}"
        aria-activedescendant="${r=>r.ariaActiveDescendant}"
        aria-controls="${r=>r.ariaControls}"
        aria-disabled="${r=>r.ariaDisabled}"
        aria-expanded="${r=>r.ariaExpanded}"
        aria-haspopup="${r=>r.collapsible?"listbox":null}"
        aria-multiselectable="${r=>r.ariaMultiSelectable}"
        ?open="${r=>r.open}"
        role="combobox"
        tabindex="${r=>r.disabled?null:"0"}"
        @click="${(r,i)=>r.clickHandler(i.event)}"
        @focusin="${(r,i)=>r.focusinHandler(i.event)}"
        @focusout="${(r,i)=>r.focusoutHandler(i.event)}"
        @keydown="${(r,i)=>r.keydownHandler(i.event)}"
        @mousedown="${(r,i)=>r.mousedownHandler(i.event)}"
    >
        ${Wu(r=>r.collapsible,Rt`
                <div
                    class="control"
                    part="control"
                    ?disabled="${r=>r.disabled}"
                    ${He("control")}
                >
                    ${Ts(e,t)}
                    <slot name="button-container">
                        <div class="selected-value" part="selected-value">
                            <slot name="selected-value">${r=>r.displayValue}</slot>
                        </div>
                        <div aria-hidden="true" class="indicator" part="indicator">
                            <slot name="indicator">
                                ${t.indicator||""}
                            </slot>
                        </div>
                    </slot>
                    ${_s(e,t)}
                </div>
            `)}
        <div
            class="listbox"
            id="${r=>r.listboxId}"
            part="listbox"
            role="listbox"
            ?disabled="${r=>r.disabled}"
            ?hidden="${r=>r.collapsible?!r.open:!1}"
            ${He("listbox")}
        >
            <slot
                ${xr({filter:ze.slottedOptionFilter,flatten:!0,property:"slottedOptions"})}
            ></slot>
        </div>
    </template>
`,iS=(e,t)=>Rt`
    <template slot="tabpanel" role="tabpanel">
        <slot></slot>
    </template>
`;class nS extends Xt{}const sS=(e,t)=>Rt`
    <template slot="tab" role="tab" aria-disabled="${r=>r.disabled}">
        <slot></slot>
    </template>
`;let Ax=class extends Xt{};I([U({mode:"boolean"})],Ax.prototype,"disabled",void 0);const oS=(e,t)=>Rt`
    <template class="${r=>r.orientation}">
        ${Ts(e,t)}
        <div class="tablist" part="tablist" role="tablist">
            <slot class="tab" name="tab" part="tab" ${xr("tabs")}></slot>

            ${Wu(r=>r.showActiveIndicator,Rt`
                    <div
                        ${He("activeIndicatorRef")}
                        class="activeIndicator"
                        part="activeIndicator"
                    ></div>
                `)}
        </div>
        ${_s(e,t)}
        <div class="tabpanel" part="tabpanel">
            <slot name="tabpanel" ${xr("tabpanels")}></slot>
        </div>
    </template>
`,$d={vertical:"vertical",horizontal:"horizontal"};class fi extends Xt{constructor(){super(...arguments),this.orientation=$d.horizontal,this.activeindicator=!0,this.showActiveIndicator=!0,this.prevActiveTabIndex=0,this.activeTabIndex=0,this.ticking=!1,this.change=()=>{this.$emit("change",this.activetab)},this.isDisabledElement=t=>t.getAttribute("aria-disabled")==="true",this.isHiddenElement=t=>t.hasAttribute("hidden"),this.isFocusableElement=t=>!this.isDisabledElement(t)&&!this.isHiddenElement(t),this.setTabs=()=>{const t="gridColumn",r="gridRow",i=this.isHorizontal()?t:r;this.activeTabIndex=this.getActiveIndex(),this.showActiveIndicator=!1,this.tabs.forEach((n,s)=>{if(n.slot==="tab"){const o=this.activeTabIndex===s&&this.isFocusableElement(n);this.activeindicator&&this.isFocusableElement(n)&&(this.showActiveIndicator=!0);const a=this.tabIds[s],l=this.tabpanelIds[s];n.setAttribute("id",a),n.setAttribute("aria-selected",o?"true":"false"),n.setAttribute("aria-controls",l),n.addEventListener("click",this.handleTabClick),n.addEventListener("keydown",this.handleTabKeyDown),n.setAttribute("tabindex",o?"0":"-1"),o&&(this.activetab=n,this.activeid=a)}n.style[t]="",n.style[r]="",n.style[i]=`${s+1}`,this.isHorizontal()?n.classList.remove("vertical"):n.classList.add("vertical")})},this.setTabPanels=()=>{this.tabpanels.forEach((t,r)=>{const i=this.tabIds[r],n=this.tabpanelIds[r];t.setAttribute("id",n),t.setAttribute("aria-labelledby",i),this.activeTabIndex!==r?t.setAttribute("hidden",""):t.removeAttribute("hidden")})},this.handleTabClick=t=>{const r=t.currentTarget;r.nodeType===1&&this.isFocusableElement(r)&&(this.prevActiveTabIndex=this.activeTabIndex,this.activeTabIndex=this.tabs.indexOf(r),this.setComponent())},this.handleTabKeyDown=t=>{if(this.isHorizontal())switch(t.key){case Bo:t.preventDefault(),this.adjustBackward(t);break;case Mo:t.preventDefault(),this.adjustForward(t);break}else switch(t.key){case yn:t.preventDefault(),this.adjustBackward(t);break;case bn:t.preventDefault(),this.adjustForward(t);break}switch(t.key){case $s:t.preventDefault(),this.adjust(-this.activeTabIndex);break;case As:t.preventDefault(),this.adjust(this.tabs.length-this.activeTabIndex-1);break}},this.adjustForward=t=>{const r=this.tabs;let i=0;for(i=this.activetab?r.indexOf(this.activetab)+1:1,i===r.length&&(i=0);i<r.length&&r.length>1;)if(this.isFocusableElement(r[i])){this.moveToTabByIndex(r,i);break}else{if(this.activetab&&i===r.indexOf(this.activetab))break;i+1>=r.length?i=0:i+=1}},this.adjustBackward=t=>{const r=this.tabs;let i=0;for(i=this.activetab?r.indexOf(this.activetab)-1:0,i=i<0?r.length-1:i;i>=0&&r.length>1;)if(this.isFocusableElement(r[i])){this.moveToTabByIndex(r,i);break}else i-1<0?i=r.length-1:i-=1},this.moveToTabByIndex=(t,r)=>{const i=t[r];this.activetab=i,this.prevActiveTabIndex=this.activeTabIndex,this.activeTabIndex=r,i.focus(),this.setComponent()}}orientationChanged(){this.$fastController.isConnected&&(this.setTabs(),this.setTabPanels(),this.handleActiveIndicatorPosition())}activeidChanged(t,r){this.$fastController.isConnected&&this.tabs.length<=this.tabpanels.length&&(this.prevActiveTabIndex=this.tabs.findIndex(i=>i.id===t),this.setTabs(),this.setTabPanels(),this.handleActiveIndicatorPosition())}tabsChanged(){this.$fastController.isConnected&&this.tabs.length<=this.tabpanels.length&&(this.tabIds=this.getTabIds(),this.tabpanelIds=this.getTabPanelIds(),this.setTabs(),this.setTabPanels(),this.handleActiveIndicatorPosition())}tabpanelsChanged(){this.$fastController.isConnected&&this.tabpanels.length<=this.tabs.length&&(this.tabIds=this.getTabIds(),this.tabpanelIds=this.getTabPanelIds(),this.setTabs(),this.setTabPanels(),this.handleActiveIndicatorPosition())}getActiveIndex(){return this.activeid!==void 0?this.tabIds.indexOf(this.activeid)===-1?0:this.tabIds.indexOf(this.activeid):0}getTabIds(){return this.tabs.map(t=>{var r;return(r=t.getAttribute("id"))!==null&&r!==void 0?r:`tab-${yl()}`})}getTabPanelIds(){return this.tabpanels.map(t=>{var r;return(r=t.getAttribute("id"))!==null&&r!==void 0?r:`panel-${yl()}`})}setComponent(){this.activeTabIndex!==this.prevActiveTabIndex&&(this.activeid=this.tabIds[this.activeTabIndex],this.focusTab(),this.change())}isHorizontal(){return this.orientation===$d.horizontal}handleActiveIndicatorPosition(){this.showActiveIndicator&&this.activeindicator&&this.activeTabIndex!==this.prevActiveTabIndex&&(this.ticking?this.ticking=!1:(this.ticking=!0,this.animateActiveIndicator()))}animateActiveIndicator(){this.ticking=!0;const t=this.isHorizontal()?"gridColumn":"gridRow",r=this.isHorizontal()?"translateX":"translateY",i=this.isHorizontal()?"offsetLeft":"offsetTop",n=this.activeIndicatorRef[i];this.activeIndicatorRef.style[t]=`${this.activeTabIndex+1}`;const s=this.activeIndicatorRef[i];this.activeIndicatorRef.style[t]=`${this.prevActiveTabIndex+1}`;const o=s-n;this.activeIndicatorRef.style.transform=`${r}(${o}px)`,this.activeIndicatorRef.classList.add("activeIndicatorTransition"),this.activeIndicatorRef.addEventListener("transitionend",()=>{this.ticking=!1,this.activeIndicatorRef.style[t]=`${this.activeTabIndex+1}`,this.activeIndicatorRef.style.transform=`${r}(0px)`,this.activeIndicatorRef.classList.remove("activeIndicatorTransition")})}adjust(t){const r=this.tabs.filter(o=>this.isFocusableElement(o)),i=r.indexOf(this.activetab),n=d5(0,r.length-1,i+t),s=this.tabs.indexOf(r[n]);s>-1&&this.moveToTabByIndex(this.tabs,s)}focusTab(){this.tabs[this.activeTabIndex].focus()}connectedCallback(){super.connectedCallback(),this.tabIds=this.getTabIds(),this.tabpanelIds=this.getTabPanelIds(),this.activeTabIndex=this.getActiveIndex()}}I([U],fi.prototype,"orientation",void 0);I([U],fi.prototype,"activeid",void 0);I([rt],fi.prototype,"tabs",void 0);I([rt],fi.prototype,"tabpanels",void 0);I([U({mode:"boolean"})],fi.prototype,"activeindicator",void 0);I([rt],fi.prototype,"activeIndicatorRef",void 0);I([rt],fi.prototype,"showActiveIndicator",void 0);er(fi,Ss);class aS extends Xt{}class lS extends ra(aS){constructor(){super(...arguments),this.proxy=document.createElement("textarea")}}const jx={none:"none",both:"both",horizontal:"horizontal",vertical:"vertical"};let Ue=class extends lS{constructor(){super(...arguments),this.resize=jx.none,this.cols=20,this.handleTextInput=()=>{this.value=this.control.value}}readOnlyChanged(){this.proxy instanceof HTMLTextAreaElement&&(this.proxy.readOnly=this.readOnly)}autofocusChanged(){this.proxy instanceof HTMLTextAreaElement&&(this.proxy.autofocus=this.autofocus)}listChanged(){this.proxy instanceof HTMLTextAreaElement&&this.proxy.setAttribute("list",this.list)}maxlengthChanged(){this.proxy instanceof HTMLTextAreaElement&&(this.proxy.maxLength=this.maxlength)}minlengthChanged(){this.proxy instanceof HTMLTextAreaElement&&(this.proxy.minLength=this.minlength)}spellcheckChanged(){this.proxy instanceof HTMLTextAreaElement&&(this.proxy.spellcheck=this.spellcheck)}select(){this.control.select(),this.$emit("select")}handleChange(){this.$emit("change")}validate(){super.validate(this.control)}};I([U({mode:"boolean"})],Ue.prototype,"readOnly",void 0);I([U],Ue.prototype,"resize",void 0);I([U({mode:"boolean"})],Ue.prototype,"autofocus",void 0);I([U({attribute:"form"})],Ue.prototype,"formId",void 0);I([U],Ue.prototype,"list",void 0);I([U({converter:Ir})],Ue.prototype,"maxlength",void 0);I([U({converter:Ir})],Ue.prototype,"minlength",void 0);I([U],Ue.prototype,"name",void 0);I([U],Ue.prototype,"placeholder",void 0);I([U({converter:Ir,mode:"fromView"})],Ue.prototype,"cols",void 0);I([U({converter:Ir,mode:"fromView"})],Ue.prototype,"rows",void 0);I([U({mode:"boolean"})],Ue.prototype,"spellcheck",void 0);I([rt],Ue.prototype,"defaultSlottedNodes",void 0);er(Ue,Zu);const cS=(e,t)=>Rt`
    <template
        class="
            ${r=>r.readOnly?"readonly":""}
            ${r=>r.resize!==jx.none?`resize-${r.resize}`:""}"
    >
        <label
            part="label"
            for="control"
            class="${r=>r.defaultSlottedNodes&&r.defaultSlottedNodes.length?"label":"label label__hidden"}"
        >
            <slot ${xr("defaultSlottedNodes")}></slot>
        </label>
        <textarea
            part="control"
            class="control"
            id="control"
            ?autofocus="${r=>r.autofocus}"
            cols="${r=>r.cols}"
            ?disabled="${r=>r.disabled}"
            form="${r=>r.form}"
            list="${r=>r.list}"
            maxlength="${r=>r.maxlength}"
            minlength="${r=>r.minlength}"
            name="${r=>r.name}"
            placeholder="${r=>r.placeholder}"
            ?readonly="${r=>r.readOnly}"
            ?required="${r=>r.required}"
            rows="${r=>r.rows}"
            ?spellcheck="${r=>r.spellcheck}"
            :value="${r=>r.value}"
            aria-atomic="${r=>r.ariaAtomic}"
            aria-busy="${r=>r.ariaBusy}"
            aria-controls="${r=>r.ariaControls}"
            aria-current="${r=>r.ariaCurrent}"
            aria-describedby="${r=>r.ariaDescribedby}"
            aria-details="${r=>r.ariaDetails}"
            aria-disabled="${r=>r.ariaDisabled}"
            aria-errormessage="${r=>r.ariaErrormessage}"
            aria-flowto="${r=>r.ariaFlowto}"
            aria-haspopup="${r=>r.ariaHaspopup}"
            aria-hidden="${r=>r.ariaHidden}"
            aria-invalid="${r=>r.ariaInvalid}"
            aria-keyshortcuts="${r=>r.ariaKeyshortcuts}"
            aria-label="${r=>r.ariaLabel}"
            aria-labelledby="${r=>r.ariaLabelledby}"
            aria-live="${r=>r.ariaLive}"
            aria-owns="${r=>r.ariaOwns}"
            aria-relevant="${r=>r.ariaRelevant}"
            aria-roledescription="${r=>r.ariaRoledescription}"
            @input="${(r,i)=>r.handleTextInput()}"
            @change="${r=>r.handleChange()}"
            ${He("control")}
        ></textarea>
    </template>
`,hS=(e,t)=>Rt`
    <template
        class="
            ${r=>r.readOnly?"readonly":""}
        "
    >
        <label
            part="label"
            for="control"
            class="${r=>r.defaultSlottedNodes&&r.defaultSlottedNodes.length?"label":"label label__hidden"}"
        >
            <slot
                ${xr({property:"defaultSlottedNodes",filter:K5})}
            ></slot>
        </label>
        <div class="root" part="root">
            ${Ts(e,t)}
            <input
                class="control"
                part="control"
                id="control"
                @input="${r=>r.handleTextInput()}"
                @change="${r=>r.handleChange()}"
                ?autofocus="${r=>r.autofocus}"
                ?disabled="${r=>r.disabled}"
                list="${r=>r.list}"
                maxlength="${r=>r.maxlength}"
                minlength="${r=>r.minlength}"
                pattern="${r=>r.pattern}"
                placeholder="${r=>r.placeholder}"
                ?readonly="${r=>r.readOnly}"
                ?required="${r=>r.required}"
                size="${r=>r.size}"
                ?spellcheck="${r=>r.spellcheck}"
                :value="${r=>r.value}"
                type="${r=>r.type}"
                aria-atomic="${r=>r.ariaAtomic}"
                aria-busy="${r=>r.ariaBusy}"
                aria-controls="${r=>r.ariaControls}"
                aria-current="${r=>r.ariaCurrent}"
                aria-describedby="${r=>r.ariaDescribedby}"
                aria-details="${r=>r.ariaDetails}"
                aria-disabled="${r=>r.ariaDisabled}"
                aria-errormessage="${r=>r.ariaErrormessage}"
                aria-flowto="${r=>r.ariaFlowto}"
                aria-haspopup="${r=>r.ariaHaspopup}"
                aria-hidden="${r=>r.ariaHidden}"
                aria-invalid="${r=>r.ariaInvalid}"
                aria-keyshortcuts="${r=>r.ariaKeyshortcuts}"
                aria-label="${r=>r.ariaLabel}"
                aria-labelledby="${r=>r.ariaLabelledby}"
                aria-live="${r=>r.ariaLive}"
                aria-owns="${r=>r.ariaOwns}"
                aria-relevant="${r=>r.ariaRelevant}"
                aria-roledescription="${r=>r.ariaRoledescription}"
                ${He("control")}
            />
            ${_s(e,t)}
        </div>
    </template>
`,Ai="not-allowed",dS=":host([hidden]){display:none}";function Be(e){return`${dS}:host{display:${e}}`}const je=o5()?"focus-visible":"focus",uS=new Set(["children","localName","ref","style","className"]),pS=Object.freeze(Object.create(null)),ng="_default",_a=new Map;function fS(e,t){typeof e=="function"?e(t):e.current=t}function Ex(e,t){if(!t.name){const r=Jo.forType(e);if(r)t.name=r.name;else throw new Error("React wrappers must wrap a FASTElement or be configured with a name.")}return t.name}function Ad(e){return e.events||(e.events={})}function sg(e,t,r){return uS.has(r)?(console.warn(`${Ex(e,t)} contains property ${r} which is a React reserved property. It will be used by React and not set on the element.`),!1):!0}function gS(e,t){if(!t.keys)if(t.properties)t.keys=new Set(t.properties.concat(Object.keys(Ad(t))));else{const r=new Set(Object.keys(Ad(t))),i=$t.getAccessors(e.prototype);if(i.length>0)for(const n of i)sg(e,t,n.name)&&r.add(n.name);else for(const n in e.prototype)!(n in HTMLElement.prototype)&&sg(e,t,n)&&r.add(n);t.keys=r}return t.keys}function mS(e,t){let r=[];const i={register(s,...o){r.forEach(a=>a.register(s,...o)),r=[]}};function n(s,o={}){var a,l;s instanceof vx&&(t?t.register(s):r.push(s),s=s.type);const c=_a.get(s);if(c){const p=c.get((a=o.name)!==null&&a!==void 0?a:ng);if(p)return p}class d extends e.Component{constructor(){super(...arguments),this._element=null}_updateElement(f){const g=this._element;if(g===null)return;const x=this.props,v=f||pS,y=Ad(o);for(const b in this._elementProps){const w=x[b],S=y[b];if(S===void 0)g[b]=w;else{const _=v[b];if(w===_)continue;_!==void 0&&g.removeEventListener(S,_),w!==void 0&&g.addEventListener(S,w)}}}componentDidMount(){this._updateElement()}componentDidUpdate(f){this._updateElement(f)}render(){const f=this.props.__forwardedRef;(this._ref===void 0||this._userRef!==f)&&(this._ref=b=>{this._element===null&&(this._element=b),f!==null&&fS(f,b),this._userRef=f});const g={ref:this._ref},x=this._elementProps={},v=gS(s,o),y=this.props;for(const b in y){const w=y[b];v.has(b)?x[b]=w:g[b==="className"?"class":b]=w}return e.createElement(Ex(s,o),g)}}const u=e.forwardRef((p,f)=>e.createElement(d,Object.assign(Object.assign({},p),{__forwardedRef:f}),p?.children));return _a.has(s)||_a.set(s,new Map),_a.get(s).set((l=o.name)!==null&&l!==void 0?l:ng,u),u}return{wrap:n,registry:i}}function xS(e){return Tx.getOrCreate(e).withPrefix("vscode")}function bS(e){window.addEventListener("load",()=>{new MutationObserver(()=>{og(e)}).observe(document.body,{attributes:!0,attributeFilter:["class"]}),og(e)})}function og(e){const t=getComputedStyle(document.body),r=document.querySelector("body");if(r){const i=r.getAttribute("data-vscode-theme-kind");for(const[n,s]of e){let o=t.getPropertyValue(n).toString();if(i==="vscode-high-contrast")o.length===0&&s.name.includes("background")&&(o="transparent"),s.name==="button-icon-hover-background"&&(o="transparent");else if(i==="vscode-high-contrast-light"){if(o.length===0&&s.name.includes("background"))switch(s.name){case"button-primary-hover-background":o="#0F4A85";break;case"button-secondary-hover-background":o="transparent";break;case"button-icon-hover-background":o="transparent";break}}else s.name==="contrast-active-border"&&(o="transparent");s.setValueFor(r,o)}}}const ag=new Map;let lg=!1;function et(e,t){const r=_x.create(e);if(t){if(t.includes("--fake-vscode-token")){const i="id"+Math.random().toString(16).slice(2);t=`${t}-${i}`}ag.set(t,r)}return lg||(bS(ag),lg=!0),r}const yS=et("background","--vscode-editor-background").withDefault("#1e1e1e"),Bt=et("border-width").withDefault(1),Lx=et("contrast-active-border","--vscode-contrastActiveBorder").withDefault("#f38518");et("contrast-border","--vscode-contrastBorder").withDefault("#6fc3df");const ia=et("corner-radius").withDefault(0),Yn=et("corner-radius-round").withDefault(2),Ct=et("design-unit").withDefault(4),wn=et("disabled-opacity").withDefault(.4),ie=et("focus-border","--vscode-focusBorder").withDefault("#007fd4"),kr=et("font-family","--vscode-font-family").withDefault("-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol");et("font-weight","--vscode-font-weight").withDefault("400");const _e=et("foreground","--vscode-foreground").withDefault("#cccccc"),Xa=et("input-height").withDefault("26"),Ku=et("input-min-width").withDefault("100px"),qe=et("type-ramp-base-font-size","--vscode-font-size").withDefault("13px"),tr=et("type-ramp-base-line-height").withDefault("normal"),Bx=et("type-ramp-minus1-font-size").withDefault("11px"),Mx=et("type-ramp-minus1-line-height").withDefault("16px");et("type-ramp-minus2-font-size").withDefault("9px");et("type-ramp-minus2-line-height").withDefault("16px");et("type-ramp-plus1-font-size").withDefault("16px");et("type-ramp-plus1-line-height").withDefault("24px");const vS=et("scrollbarWidth").withDefault("10px"),wS=et("scrollbarHeight").withDefault("10px"),kS=et("scrollbar-slider-background","--vscode-scrollbarSlider-background").withDefault("#79797966"),CS=et("scrollbar-slider-hover-background","--vscode-scrollbarSlider-hoverBackground").withDefault("#646464b3"),SS=et("scrollbar-slider-active-background","--vscode-scrollbarSlider-activeBackground").withDefault("#bfbfbf66"),Ix=et("badge-background","--vscode-badge-background").withDefault("#4d4d4d"),Ox=et("badge-foreground","--vscode-badge-foreground").withDefault("#ffffff"),tp=et("button-border","--vscode-button-border").withDefault("transparent"),cg=et("button-icon-background").withDefault("transparent"),_S=et("button-icon-corner-radius").withDefault("5px"),TS=et("button-icon-outline-offset").withDefault(0),hg=et("button-icon-hover-background","--fake-vscode-token").withDefault("rgba(90, 93, 94, 0.31)"),$S=et("button-icon-padding").withDefault("3px"),Xn=et("button-primary-background","--vscode-button-background").withDefault("#0e639c"),Rx=et("button-primary-foreground","--vscode-button-foreground").withDefault("#ffffff"),Dx=et("button-primary-hover-background","--vscode-button-hoverBackground").withDefault("#1177bb"),mh=et("button-secondary-background","--vscode-button-secondaryBackground").withDefault("#3a3d41"),AS=et("button-secondary-foreground","--vscode-button-secondaryForeground").withDefault("#ffffff"),jS=et("button-secondary-hover-background","--vscode-button-secondaryHoverBackground").withDefault("#45494e"),ES=et("button-padding-horizontal").withDefault("11px"),LS=et("button-padding-vertical").withDefault("4px"),oi=et("checkbox-background","--vscode-checkbox-background").withDefault("#3c3c3c"),Wn=et("checkbox-border","--vscode-checkbox-border").withDefault("#3c3c3c"),BS=et("checkbox-corner-radius").withDefault(3);et("checkbox-foreground","--vscode-checkbox-foreground").withDefault("#f0f0f0");const Qi=et("list-active-selection-background","--vscode-list-activeSelectionBackground").withDefault("#094771"),Qn=et("list-active-selection-foreground","--vscode-list-activeSelectionForeground").withDefault("#ffffff"),MS=et("list-hover-background","--vscode-list-hoverBackground").withDefault("#2a2d2e"),IS=et("divider-background","--vscode-settings-dropdownListBorder").withDefault("#454545"),Ta=et("dropdown-background","--vscode-dropdown-background").withDefault("#3c3c3c"),_i=et("dropdown-border","--vscode-dropdown-border").withDefault("#3c3c3c");et("dropdown-foreground","--vscode-dropdown-foreground").withDefault("#f0f0f0");const OS=et("dropdown-list-max-height").withDefault("200px"),Zi=et("input-background","--vscode-input-background").withDefault("#3c3c3c"),Fx=et("input-foreground","--vscode-input-foreground").withDefault("#cccccc");et("input-placeholder-foreground","--vscode-input-placeholderForeground").withDefault("#cccccc");const dg=et("link-active-foreground","--vscode-textLink-activeForeground").withDefault("#3794ff"),RS=et("link-foreground","--vscode-textLink-foreground").withDefault("#3794ff"),DS=et("progress-background","--vscode-progressBar-background").withDefault("#0e70c0"),FS=et("panel-tab-active-border","--vscode-panelTitle-activeBorder").withDefault("#e7e7e7"),Nn=et("panel-tab-active-foreground","--vscode-panelTitle-activeForeground").withDefault("#e7e7e7"),PS=et("panel-tab-foreground","--vscode-panelTitle-inactiveForeground").withDefault("#e7e7e799");et("panel-view-background","--vscode-panel-background").withDefault("#1e1e1e");et("panel-view-border","--vscode-panel-border").withDefault("#80808059");const NS=et("tag-corner-radius").withDefault("2px"),zS=(e,t)=>Kt`
	${Be("inline-block")} :host {
		box-sizing: border-box;
		font-family: ${kr};
		font-size: ${Bx};
		line-height: ${Mx};
		text-align: center;
	}
	.control {
		align-items: center;
		background-color: ${Ix};
		border: calc(${Bt} * 1px) solid ${tp};
		border-radius: 11px;
		box-sizing: border-box;
		color: ${Ox};
		display: flex;
		height: calc(${Ct} * 4px);
		justify-content: center;
		min-width: calc(${Ct} * 4px + 2px);
		min-height: calc(${Ct} * 4px + 2px);
		padding: 3px 6px;
	}
`;let HS=class extends ea{connectedCallback(){super.connectedCallback(),this.circular||(this.circular=!0)}};const qS=HS.compose({baseName:"badge",template:wx,styles:zS});function WS(e,t,r,i){var n=arguments.length,s=n<3?t:i===null?i=Object.getOwnPropertyDescriptor(t,r):i,o;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")s=Reflect.decorate(e,t,r,i);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(s=(n<3?o(s):n>3?o(t,r,s):o(t,r))||s);return n>3&&s&&Object.defineProperty(t,r,s),s}const VS=Kt`
	${Be("inline-flex")} :host {
		outline: none;
		font-family: ${kr};
		font-size: ${qe};
		line-height: ${tr};
		color: ${Rx};
		background: ${Xn};
		border-radius: calc(${Yn} * 1px);
		fill: currentColor;
		cursor: pointer;
	}
	.control {
		background: transparent;
		height: inherit;
		flex-grow: 1;
		box-sizing: border-box;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		padding: ${LS} ${ES};
		white-space: wrap;
		outline: none;
		text-decoration: none;
		border: calc(${Bt} * 1px) solid ${tp};
		color: inherit;
		border-radius: inherit;
		fill: inherit;
		cursor: inherit;
		font-family: inherit;
	}
	:host(:hover) {
		background: ${Dx};
	}
	:host(:active) {
		background: ${Xn};
	}
	.control:${je} {
		outline: calc(${Bt} * 1px) solid ${ie};
		outline-offset: calc(${Bt} * 2px);
	}
	.control::-moz-focus-inner {
		border: 0;
	}
	:host([disabled]) {
		opacity: ${wn};
		background: ${Xn};
		cursor: ${Ai};
	}
	.content {
		display: flex;
	}
	.start {
		display: flex;
	}
	::slotted(svg),
	::slotted(span) {
		width: calc(${Ct} * 4px);
		height: calc(${Ct} * 4px);
	}
	.start {
		margin-inline-end: 8px;
	}
`,US=Kt`
	:host([appearance='primary']) {
		background: ${Xn};
		color: ${Rx};
	}
	:host([appearance='primary']:hover) {
		background: ${Dx};
	}
	:host([appearance='primary']:active) .control:active {
		background: ${Xn};
	}
	:host([appearance='primary']) .control:${je} {
		outline: calc(${Bt} * 1px) solid ${ie};
		outline-offset: calc(${Bt} * 2px);
	}
	:host([appearance='primary'][disabled]) {
		background: ${Xn};
	}
`,GS=Kt`
	:host([appearance='secondary']) {
		background: ${mh};
		color: ${AS};
	}
	:host([appearance='secondary']:hover) {
		background: ${jS};
	}
	:host([appearance='secondary']:active) .control:active {
		background: ${mh};
	}
	:host([appearance='secondary']) .control:${je} {
		outline: calc(${Bt} * 1px) solid ${ie};
		outline-offset: calc(${Bt} * 2px);
	}
	:host([appearance='secondary'][disabled]) {
		background: ${mh};
	}
`,YS=Kt`
	:host([appearance='icon']) {
		background: ${cg};
		border-radius: ${_S};
		color: ${_e};
	}
	:host([appearance='icon']:hover) {
		background: ${hg};
		outline: 1px dotted ${Lx};
		outline-offset: -1px;
	}
	:host([appearance='icon']) .control {
		padding: ${$S};
		border: none;
	}
	:host([appearance='icon']:active) .control:active {
		background: ${hg};
	}
	:host([appearance='icon']) .control:${je} {
		outline: calc(${Bt} * 1px) solid ${ie};
		outline-offset: ${TS};
	}
	:host([appearance='icon'][disabled]) {
		background: ${cg};
	}
`,XS=(e,t)=>Kt`
	${VS}
	${US}
	${GS}
	${YS}
`;let Px=class extends Rr{connectedCallback(){if(super.connectedCallback(),!this.appearance){const t=this.getAttribute("appearance");this.appearance=t}}attributeChangedCallback(t,r,i){t==="appearance"&&i==="icon"&&(this.getAttribute("aria-label")||(this.ariaLabel="Icon Button")),t==="aria-label"&&(this.ariaLabel=i),t==="disabled"&&(this.disabled=i!==null)}};WS([U],Px.prototype,"appearance",void 0);const QS=Px.compose({baseName:"button",template:g5,styles:XS,shadowOptions:{delegatesFocus:!0}}),ZS=(e,t)=>Kt`
	${Be("inline-flex")} :host {
		align-items: center;
		outline: none;
		margin: calc(${Ct} * 1px) 0;
		user-select: none;
		font-size: ${qe};
		line-height: ${tr};
	}
	.control {
		position: relative;
		width: calc(${Ct} * 4px + 2px);
		height: calc(${Ct} * 4px + 2px);
		box-sizing: border-box;
		border-radius: calc(${BS} * 1px);
		border: calc(${Bt} * 1px) solid ${Wn};
		background: ${oi};
		outline: none;
		cursor: pointer;
	}
	.label {
		font-family: ${kr};
		color: ${_e};
		padding-inline-start: calc(${Ct} * 2px + 2px);
		margin-inline-end: calc(${Ct} * 2px + 2px);
		cursor: pointer;
	}
	.label__hidden {
		display: none;
		visibility: hidden;
	}
	.checked-indicator {
		width: 100%;
		height: 100%;
		display: block;
		fill: ${_e};
		opacity: 0;
		pointer-events: none;
	}
	.indeterminate-indicator {
		border-radius: 2px;
		background: ${_e};
		position: absolute;
		top: 50%;
		left: 50%;
		width: 50%;
		height: 50%;
		transform: translate(-50%, -50%);
		opacity: 0;
	}
	:host(:enabled) .control:hover {
		background: ${oi};
		border-color: ${Wn};
	}
	:host(:enabled) .control:active {
		background: ${oi};
		border-color: ${ie};
	}
	:host(:${je}) .control {
		border: calc(${Bt} * 1px) solid ${ie};
	}
	:host(.disabled) .label,
	:host(.readonly) .label,
	:host(.readonly) .control,
	:host(.disabled) .control {
		cursor: ${Ai};
	}
	:host(.checked:not(.indeterminate)) .checked-indicator,
	:host(.indeterminate) .indeterminate-indicator {
		opacity: 1;
	}
	:host(.disabled) {
		opacity: ${wn};
	}
`;class JS extends cc{connectedCallback(){super.connectedCallback(),this.textContent?this.setAttribute("aria-label",this.textContent):this.setAttribute("aria-label","Checkbox")}}const KS=JS.compose({baseName:"checkbox",template:T5,styles:ZS,checkedIndicator:`
		<svg 
			part="checked-indicator"
			class="checked-indicator"
			width="16" 
			height="16" 
			viewBox="0 0 16 16" 
			xmlns="http://www.w3.org/2000/svg" 
			fill="currentColor"
		>
			<path 
				fill-rule="evenodd" 
				clip-rule="evenodd" 
				d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z"
			/>
		</svg>
	`,indeterminateIndicator:`
		<div part="indeterminate-indicator" class="indeterminate-indicator"></div>
	`}),t_=(e,t)=>Kt`
	:host {
		display: flex;
		position: relative;
		flex-direction: column;
		width: 100%;
	}
`,e_=(e,t)=>Kt`
	:host {
		display: grid;
		padding: calc((${Ct} / 4) * 1px) 0;
		box-sizing: border-box;
		width: 100%;
		background: transparent;
	}
	:host(.header) {
	}
	:host(.sticky-header) {
		background: ${yS};
		position: sticky;
		top: 0;
	}
	:host(:hover) {
		background: ${MS};
		outline: 1px dotted ${Lx};
		outline-offset: -1px;
	}
`,r_=(e,t)=>Kt`
	:host {
		padding: calc(${Ct} * 1px) calc(${Ct} * 3px);
		color: ${_e};
		opacity: 1;
		box-sizing: border-box;
		font-family: ${kr};
		font-size: ${qe};
		line-height: ${tr};
		font-weight: 400;
		border: solid calc(${Bt} * 1px) transparent;
		border-radius: calc(${ia} * 1px);
		white-space: wrap;
		overflow-wrap: anywhere;
	}
	:host(.column-header) {
		font-weight: 600;
	}
	:host(:${je}),
	:host(:focus),
	:host(:active) {
		background: ${Qi};
		border: solid calc(${Bt} * 1px) ${ie};
		color: ${Qn};
		outline: none;
	}
	:host(:${je}) ::slotted(*),
	:host(:focus) ::slotted(*),
	:host(:active) ::slotted(*) {
		color: ${Qn} !important;
	}
`;class i_ extends Le{connectedCallback(){super.connectedCallback(),this.getAttribute("aria-label")||this.setAttribute("aria-label","Data Grid")}}const n_=i_.compose({baseName:"data-grid",baseClass:Le,template:y5,styles:t_});class s_ extends Ee{}const o_=s_.compose({baseName:"data-grid-row",baseClass:Ee,template:S5,styles:e_});class a_ extends Mi{}const l_=a_.compose({baseName:"data-grid-cell",baseClass:Mi,template:_5,styles:r_}),c_=(e,t)=>Kt`
	${Be("block")} :host {
		border: none;
		border-top: calc(${Bt} * 1px) solid ${IS};
		box-sizing: content-box;
		height: 0;
		margin: calc(${Ct} * 1px) 0;
		width: 100%;
	}
`;class h_ extends Qu{}const d_=h_.compose({baseName:"divider",template:H5,styles:c_}),u_=(e,t)=>Kt`
	${Be("inline-flex")} :host {
		background: ${Ta};
		border-radius: calc(${Yn} * 1px);
		box-sizing: border-box;
		color: ${_e};
		contain: contents;
		font-family: ${kr};
		height: calc(${Xa} * 1px);
		position: relative;
		user-select: none;
		min-width: ${Ku};
		outline: none;
		vertical-align: top;
	}
	.control {
		align-items: center;
		box-sizing: border-box;
		border: calc(${Bt} * 1px) solid ${_i};
		border-radius: calc(${Yn} * 1px);
		cursor: pointer;
		display: flex;
		font-family: inherit;
		font-size: ${qe};
		line-height: ${tr};
		min-height: 100%;
		padding: 2px 6px 2px 8px;
		width: 100%;
	}
	.listbox {
		background: ${Ta};
		border: calc(${Bt} * 1px) solid ${ie};
		border-radius: calc(${Yn} * 1px);
		box-sizing: border-box;
		display: inline-flex;
		flex-direction: column;
		left: 0;
		max-height: ${OS};
		padding: 0;
		overflow-y: auto;
		position: absolute;
		width: 100%;
		z-index: 1;
	}
	.listbox[hidden] {
		display: none;
	}
	:host(:${je}) .control {
		border-color: ${ie};
	}
	:host(:not([disabled]):hover) {
		background: ${Ta};
		border-color: ${_i};
	}
	:host(:${je}) ::slotted([aria-selected="true"][role="option"]:not([disabled])) {
		background: ${Qi};
		border: calc(${Bt} * 1px) solid transparent;
		color: ${Qn};
	}
	:host([disabled]) {
		cursor: ${Ai};
		opacity: ${wn};
	}
	:host([disabled]) .control {
		cursor: ${Ai};
		user-select: none;
	}
	:host([disabled]:hover) {
		background: ${Ta};
		color: ${_e};
		fill: currentcolor;
	}
	:host(:not([disabled])) .control:active {
		border-color: ${ie};
	}
	:host(:empty) .listbox {
		display: none;
	}
	:host([open]) .control {
		border-color: ${ie};
	}
	:host([open][position='above']) .listbox {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}
	:host([open][position='below']) .listbox {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}
	:host([open][position='above']) .listbox {
		bottom: calc(${Xa} * 1px);
	}
	:host([open][position='below']) .listbox {
		top: calc(${Xa} * 1px);
	}
	.selected-value {
		flex: 1 1 auto;
		font-family: inherit;
		overflow: hidden;
		text-align: start;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.indicator {
		flex: 0 0 auto;
		margin-inline-start: 1em;
	}
	slot[name='listbox'] {
		display: none;
		width: 100%;
	}
	:host([open]) slot[name='listbox'] {
		display: flex;
		position: absolute;
	}
	.end {
		margin-inline-start: auto;
	}
	.start,
	.end,
	.indicator,
	.select-indicator,
	::slotted(svg),
	::slotted(span) {
		fill: currentcolor;
		height: 1em;
		min-height: calc(${Ct} * 4px);
		min-width: calc(${Ct} * 4px);
		width: 1em;
	}
	::slotted([role='option']),
	::slotted(option) {
		flex: 0 0 auto;
	}
`;let p_=class extends Oi{};const f_=p_.compose({baseName:"dropdown",template:rS,styles:u_,indicator:`
		<svg 
			class="select-indicator"
			part="select-indicator"
			width="16" 
			height="16" 
			viewBox="0 0 16 16" 
			xmlns="http://www.w3.org/2000/svg" 
			fill="currentColor"
		>
			<path 
				fill-rule="evenodd" 
				clip-rule="evenodd" 
				d="M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z"
			/>
		</svg>
	`}),g_=(e,t)=>Kt`
	${Be("inline-flex")} :host {
		background: transparent;
		box-sizing: border-box;
		color: ${RS};
		cursor: pointer;
		fill: currentcolor;
		font-family: ${kr};
		font-size: ${qe};
		line-height: ${tr};
		outline: none;
	}
	.control {
		background: transparent;
		border: calc(${Bt} * 1px) solid transparent;
		border-radius: calc(${ia} * 1px);
		box-sizing: border-box;
		color: inherit;
		cursor: inherit;
		fill: inherit;
		font-family: inherit;
		height: inherit;
		padding: 0;
		outline: none;
		text-decoration: none;
		word-break: break-word;
	}
	.control::-moz-focus-inner {
		border: 0;
	}
	:host(:hover) {
		color: ${dg};
	}
	:host(:hover) .content {
		text-decoration: underline;
	}
	:host(:active) {
		background: transparent;
		color: ${dg};
	}
	:host(:${je}) .control,
	:host(:focus) .control {
		border: calc(${Bt} * 1px) solid ${ie};
	}
`;class m_ extends Or{}const x_=m_.compose({baseName:"link",template:p5,styles:g_,shadowOptions:{delegatesFocus:!0}}),b_=(e,t)=>Kt`
	${Be("inline-flex")} :host {
		font-family: var(--body-font);
		border-radius: ${ia};
		border: calc(${Bt} * 1px) solid transparent;
		box-sizing: border-box;
		color: ${_e};
		cursor: pointer;
		fill: currentcolor;
		font-size: ${qe};
		line-height: ${tr};
		margin: 0;
		outline: none;
		overflow: hidden;
		padding: 0 calc((${Ct} / 2) * 1px)
			calc((${Ct} / 4) * 1px);
		user-select: none;
		white-space: nowrap;
	}
	:host(:${je}) {
		border-color: ${ie};
		background: ${Qi};
		color: ${_e};
	}
	:host([aria-selected='true']) {
		background: ${Qi};
		border: calc(${Bt} * 1px) solid transparent;
		color: ${Qn};
	}
	:host(:active) {
		background: ${Qi};
		color: ${Qn};
	}
	:host(:not([aria-selected='true']):hover) {
		background: ${Qi};
		border: calc(${Bt} * 1px) solid transparent;
		color: ${Qn};
	}
	:host(:not([aria-selected='true']):active) {
		background: ${Qi};
		color: ${_e};
	}
	:host([disabled]) {
		cursor: ${Ai};
		opacity: ${wn};
	}
	:host([disabled]:hover) {
		background-color: inherit;
	}
	.content {
		grid-column-start: 2;
		justify-self: start;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`;let y_=class extends pi{connectedCallback(){super.connectedCallback(),this.textContent?this.setAttribute("aria-label",this.textContent):this.setAttribute("aria-label","Option")}};const v_=y_.compose({baseName:"option",template:W5,styles:b_}),w_=(e,t)=>Kt`
	${Be("grid")} :host {
		box-sizing: border-box;
		font-family: ${kr};
		font-size: ${qe};
		line-height: ${tr};
		color: ${_e};
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto 1fr;
		overflow-x: auto;
	}
	.tablist {
		display: grid;
		grid-template-rows: auto auto;
		grid-template-columns: auto;
		column-gap: calc(${Ct} * 8px);
		position: relative;
		width: max-content;
		align-self: end;
		padding: calc(${Ct} * 1px) calc(${Ct} * 1px) 0;
		box-sizing: border-box;
	}
	.start,
	.end {
		align-self: center;
	}
	.activeIndicator {
		grid-row: 2;
		grid-column: 1;
		width: 100%;
		height: calc((${Ct} / 4) * 1px);
		justify-self: center;
		background: ${Nn};
		margin: 0;
		border-radius: calc(${ia} * 1px);
	}
	.activeIndicatorTransition {
		transition: transform 0.01s linear;
	}
	.tabpanel {
		grid-row: 2;
		grid-column-start: 1;
		grid-column-end: 4;
		position: relative;
	}
`,k_=(e,t)=>Kt`
	${Be("inline-flex")} :host {
		box-sizing: border-box;
		font-family: ${kr};
		font-size: ${qe};
		line-height: ${tr};
		height: calc(${Ct} * 7px);
		padding: calc(${Ct} * 1px) 0;
		color: ${PS};
		fill: currentcolor;
		border-radius: calc(${ia} * 1px);
		border: solid calc(${Bt} * 1px) transparent;
		align-items: center;
		justify-content: center;
		grid-row: 1;
		cursor: pointer;
	}
	:host(:hover) {
		color: ${Nn};
		fill: currentcolor;
	}
	:host(:active) {
		color: ${Nn};
		fill: currentcolor;
	}
	:host([aria-selected='true']) {
		background: transparent;
		color: ${Nn};
		fill: currentcolor;
	}
	:host([aria-selected='true']:hover) {
		background: transparent;
		color: ${Nn};
		fill: currentcolor;
	}
	:host([aria-selected='true']:active) {
		background: transparent;
		color: ${Nn};
		fill: currentcolor;
	}
	:host(:${je}) {
		outline: none;
		border: solid calc(${Bt} * 1px) ${FS};
	}
	:host(:focus) {
		outline: none;
	}
	::slotted(vscode-badge) {
		margin-inline-start: calc(${Ct} * 2px);
	}
`,C_=(e,t)=>Kt`
	${Be("flex")} :host {
		color: inherit;
		background-color: transparent;
		border: solid calc(${Bt} * 1px) transparent;
		box-sizing: border-box;
		font-size: ${qe};
		line-height: ${tr};
		padding: 10px calc((${Ct} + 2) * 1px);
	}
`;class S_ extends fi{connectedCallback(){super.connectedCallback(),this.orientation&&(this.orientation=$d.horizontal),this.getAttribute("aria-label")||this.setAttribute("aria-label","Panels")}}const __=S_.compose({baseName:"panels",template:oS,styles:w_});class T_ extends Ax{connectedCallback(){super.connectedCallback(),this.disabled&&(this.disabled=!1),this.textContent&&this.setAttribute("aria-label",this.textContent)}}const $_=T_.compose({baseName:"panel-tab",template:sS,styles:k_});class A_ extends nS{}const j_=A_.compose({baseName:"panel-view",template:iS,styles:C_}),E_=(e,t)=>Kt`
	${Be("flex")} :host {
		align-items: center;
		outline: none;
		height: calc(${Ct} * 7px);
		width: calc(${Ct} * 7px);
		margin: 0;
	}
	.progress {
		height: 100%;
		width: 100%;
	}
	.background {
		fill: none;
		stroke: transparent;
		stroke-width: calc(${Ct} / 2 * 1px);
	}
	.indeterminate-indicator-1 {
		fill: none;
		stroke: ${DS};
		stroke-width: calc(${Ct} / 2 * 1px);
		stroke-linecap: square;
		transform-origin: 50% 50%;
		transform: rotate(-90deg);
		transition: all 0.2s ease-in-out;
		animation: spin-infinite 2s linear infinite;
	}
	@keyframes spin-infinite {
		0% {
			stroke-dasharray: 0.01px 43.97px;
			transform: rotate(0deg);
		}
		50% {
			stroke-dasharray: 21.99px 21.99px;
			transform: rotate(450deg);
		}
		100% {
			stroke-dasharray: 0.01px 43.97px;
			transform: rotate(1080deg);
		}
	}
`;class L_ extends Es{connectedCallback(){super.connectedCallback(),this.paused&&(this.paused=!1),this.setAttribute("aria-label","Loading"),this.setAttribute("aria-live","assertive"),this.setAttribute("role","alert")}attributeChangedCallback(t,r,i){t==="value"&&this.removeAttribute("value")}}const B_=L_.compose({baseName:"progress-ring",template:Y5,styles:E_,indeterminateIndicator:`
		<svg class="progress" part="progress" viewBox="0 0 16 16">
			<circle
				class="background"
				part="background"
				cx="8px"
				cy="8px"
				r="7px"
			></circle>
			<circle
				class="indeterminate-indicator-1"
				part="indeterminate-indicator-1"
				cx="8px"
				cy="8px"
				r="7px"
			></circle>
		</svg>
	`}),M_=(e,t)=>Kt`
	${Be("flex")} :host {
		align-items: flex-start;
		margin: calc(${Ct} * 1px) 0;
		flex-direction: column;
	}
	.positioning-region {
		display: flex;
		flex-wrap: wrap;
	}
	:host([orientation='vertical']) .positioning-region {
		flex-direction: column;
	}
	:host([orientation='horizontal']) .positioning-region {
		flex-direction: row;
	}
	::slotted([slot='label']) {
		color: ${_e};
		font-size: ${qe};
		margin: calc(${Ct} * 1px) 0;
	}
`;class I_ extends Ii{connectedCallback(){super.connectedCallback();const t=this.querySelector("label");if(t){const r="radio-group-"+Math.random().toString(16).slice(2);t.setAttribute("id",r),this.setAttribute("aria-labelledby",r)}}}const O_=I_.compose({baseName:"radio-group",template:X5,styles:M_}),R_=(e,t)=>Kt`
	${Be("inline-flex")} :host {
		align-items: center;
		flex-direction: row;
		font-size: ${qe};
		line-height: ${tr};
		margin: calc(${Ct} * 1px) 0;
		outline: none;
		position: relative;
		transition: all 0.2s ease-in-out;
		user-select: none;
	}
	.control {
		background: ${oi};
		border-radius: 999px;
		border: calc(${Bt} * 1px) solid ${Wn};
		box-sizing: border-box;
		cursor: pointer;
		height: calc(${Ct} * 4px);
		position: relative;
		outline: none;
		width: calc(${Ct} * 4px);
	}
	.label {
		color: ${_e};
		cursor: pointer;
		font-family: ${kr};
		margin-inline-end: calc(${Ct} * 2px + 2px);
		padding-inline-start: calc(${Ct} * 2px + 2px);
	}
	.label__hidden {
		display: none;
		visibility: hidden;
	}
	.control,
	.checked-indicator {
		flex-shrink: 0;
	}
	.checked-indicator {
		background: ${_e};
		border-radius: 999px;
		display: inline-block;
		inset: calc(${Ct} * 1px);
		opacity: 0;
		pointer-events: none;
		position: absolute;
	}
	:host(:not([disabled])) .control:hover {
		background: ${oi};
		border-color: ${Wn};
	}
	:host(:not([disabled])) .control:active {
		background: ${oi};
		border-color: ${ie};
	}
	:host(:${je}) .control {
		border: calc(${Bt} * 1px) solid ${ie};
	}
	:host([aria-checked='true']) .control {
		background: ${oi};
		border: calc(${Bt} * 1px) solid ${Wn};
	}
	:host([aria-checked='true']:not([disabled])) .control:hover {
		background: ${oi};
		border: calc(${Bt} * 1px) solid ${Wn};
	}
	:host([aria-checked='true']:not([disabled])) .control:active {
		background: ${oi};
		border: calc(${Bt} * 1px) solid ${ie};
	}
	:host([aria-checked="true"]:${je}:not([disabled])) .control {
		border: calc(${Bt} * 1px) solid ${ie};
	}
	:host([disabled]) .label,
	:host([readonly]) .label,
	:host([readonly]) .control,
	:host([disabled]) .control {
		cursor: ${Ai};
	}
	:host([aria-checked='true']) .checked-indicator {
		opacity: 1;
	}
	:host([disabled]) {
		opacity: ${wn};
	}
`;class D_ extends dc{connectedCallback(){super.connectedCallback(),this.textContent?this.setAttribute("aria-label",this.textContent):this.setAttribute("aria-label","Radio")}}const F_=D_.compose({baseName:"radio",template:Q5,styles:R_,checkedIndicator:`
		<div part="checked-indicator" class="checked-indicator"></div>
	`}),P_=(e,t)=>Kt`
	${Be("inline-block")} :host {
		box-sizing: border-box;
		font-family: ${kr};
		font-size: ${Bx};
		line-height: ${Mx};
	}
	.control {
		background-color: ${Ix};
		border: calc(${Bt} * 1px) solid ${tp};
		border-radius: ${NS};
		color: ${Ox};
		padding: calc(${Ct} * 0.5px) calc(${Ct} * 1px);
		text-transform: uppercase;
	}
`;let N_=class extends ea{connectedCallback(){super.connectedCallback(),this.circular&&(this.circular=!1)}};const z_=N_.compose({baseName:"tag",template:wx,styles:P_}),H_=(e,t)=>Kt`
	${Be("inline-block")} :host {
		font-family: ${kr};
		outline: none;
		user-select: none;
	}
	.control {
		box-sizing: border-box;
		position: relative;
		color: ${Fx};
		background: ${Zi};
		border-radius: calc(${Yn} * 1px);
		border: calc(${Bt} * 1px) solid ${_i};
		font: inherit;
		font-size: ${qe};
		line-height: ${tr};
		padding: calc(${Ct} * 2px + 1px);
		width: 100%;
		min-width: ${Ku};
		resize: none;
	}
	.control:hover:enabled {
		background: ${Zi};
		border-color: ${_i};
	}
	.control:active:enabled {
		background: ${Zi};
		border-color: ${ie};
	}
	.control:hover,
	.control:${je},
	.control:disabled,
	.control:active {
		outline: none;
	}
	.control::-webkit-scrollbar {
		width: ${vS};
		height: ${wS};
	}
	.control::-webkit-scrollbar-corner {
		background: ${Zi};
	}
	.control::-webkit-scrollbar-thumb {
		background: ${kS};
	}
	.control::-webkit-scrollbar-thumb:hover {
		background: ${CS};
	}
	.control::-webkit-scrollbar-thumb:active {
		background: ${SS};
	}
	:host(:focus-within:not([disabled])) .control {
		border-color: ${ie};
	}
	:host([resize='both']) .control {
		resize: both;
	}
	:host([resize='horizontal']) .control {
		resize: horizontal;
	}
	:host([resize='vertical']) .control {
		resize: vertical;
	}
	.label {
		display: block;
		color: ${_e};
		cursor: pointer;
		font-size: ${qe};
		line-height: ${tr};
		margin-bottom: 2px;
	}
	.label__hidden {
		display: none;
		visibility: hidden;
	}
	:host([disabled]) .label,
	:host([readonly]) .label,
	:host([readonly]) .control,
	:host([disabled]) .control {
		cursor: ${Ai};
	}
	:host([disabled]) {
		opacity: ${wn};
	}
	:host([disabled]) .control {
		border-color: ${_i};
	}
`;let q_=class extends Ue{connectedCallback(){super.connectedCallback(),this.textContent?this.setAttribute("aria-label",this.textContent):this.setAttribute("aria-label","Text area")}};const W_=q_.compose({baseName:"text-area",template:cS,styles:H_,shadowOptions:{delegatesFocus:!0}}),V_=(e,t)=>Kt`
	${Be("inline-block")} :host {
		font-family: ${kr};
		outline: none;
		user-select: none;
	}
	.root {
		box-sizing: border-box;
		position: relative;
		display: flex;
		flex-direction: row;
		color: ${Fx};
		background: ${Zi};
		border-radius: calc(${Yn} * 1px);
		border: calc(${Bt} * 1px) solid ${_i};
		height: calc(${Xa} * 1px);
		min-width: ${Ku};
	}
	.control {
		-webkit-appearance: none;
		font: inherit;
		background: transparent;
		border: 0;
		color: inherit;
		height: calc(100% - (${Ct} * 1px));
		width: 100%;
		margin-top: auto;
		margin-bottom: auto;
		border: none;
		padding: 0 calc(${Ct} * 2px + 1px);
		font-size: ${qe};
		line-height: ${tr};
	}
	.control:hover,
	.control:${je},
	.control:disabled,
	.control:active {
		outline: none;
	}
	.label {
		display: block;
		color: ${_e};
		cursor: pointer;
		font-size: ${qe};
		line-height: ${tr};
		margin-bottom: 2px;
	}
	.label__hidden {
		display: none;
		visibility: hidden;
	}
	.start,
	.end {
		display: flex;
		margin: auto;
		fill: currentcolor;
	}
	::slotted(svg),
	::slotted(span) {
		width: calc(${Ct} * 4px);
		height: calc(${Ct} * 4px);
	}
	.start {
		margin-inline-start: calc(${Ct} * 2px);
	}
	.end {
		margin-inline-end: calc(${Ct} * 2px);
	}
	:host(:hover:not([disabled])) .root {
		background: ${Zi};
		border-color: ${_i};
	}
	:host(:active:not([disabled])) .root {
		background: ${Zi};
		border-color: ${ie};
	}
	:host(:focus-within:not([disabled])) .root {
		border-color: ${ie};
	}
	:host([disabled]) .label,
	:host([readonly]) .label,
	:host([readonly]) .control,
	:host([disabled]) .control {
		cursor: ${Ai};
	}
	:host([disabled]) {
		opacity: ${wn};
	}
	:host([disabled]) .control {
		border-color: ${_i};
	}
`;class U_ extends cr{connectedCallback(){super.connectedCallback(),this.textContent?this.setAttribute("aria-label",this.textContent):this.setAttribute("aria-label","Text field")}}const G_=U_.compose({baseName:"text-field",template:hS,styles:V_,shadowOptions:{delegatesFocus:!0}}),{wrap:fe}=mS(Mr,xS());fe(qS(),{name:"vscode-badge"});const Y_=fe(QS(),{name:"vscode-button"});fe(KS(),{name:"vscode-checkbox",events:{onChange:"change"}});fe(n_(),{name:"vscode-data-grid"});fe(l_(),{name:"vscode-data-grid-cell"});fe(o_(),{name:"vscode-data-grid-row"});fe(d_(),{name:"vscode-divider"});fe(f_(),{name:"vscode-dropdown",events:{onChange:"change"}});fe(x_(),{name:"vscode-link"});fe(v_(),{name:"vscode-option"});const X_=fe(__(),{name:"vscode-panels",events:{onChange:"change"}}),Gs=fe($_(),{name:"vscode-panel-tab"}),qi=fe(j_(),{name:"vscode-panel-view"});fe(B_(),{name:"vscode-progress-ring"});fe(F_(),{name:"vscode-radio",events:{onChange:"change"}});fe(O_(),{name:"vscode-radio-group",events:{onChange:"change"}});fe(z_(),{name:"vscode-tag"});const Q_=fe(W_(),{name:"vscode-text-area",events:{onChange:"change",onInput:"input"}});fe(G_(),{name:"vscode-text-field",events:{onChange:"change",onInput:"input"}});var Ze=function(){return Ze=Object.assign||function(t){for(var r,i=1,n=arguments.length;i<n;i++){r=arguments[i];for(var s in r)Object.prototype.hasOwnProperty.call(r,s)&&(t[s]=r[s])}return t},Ze.apply(this,arguments)};function Io(e,t,r){if(r||arguments.length===2)for(var i=0,n=t.length,s;i<n;i++)(s||!(i in t))&&(s||(s=Array.prototype.slice.call(t,0,i)),s[i]=t[i]);return e.concat(s||Array.prototype.slice.call(t))}var Vt="-ms-",ko="-moz-",Pt="-webkit-",Nx="comm",uc="rule",ep="decl",Z_="@import",zx="@keyframes",J_="@layer",Hx=Math.abs,rp=String.fromCharCode,jd=Object.assign;function K_(e,t){return xe(e,0)^45?(((t<<2^xe(e,0))<<2^xe(e,1))<<2^xe(e,2))<<2^xe(e,3):0}function qx(e){return e.trim()}function si(e,t){return(e=t.exec(e))?e[0]:e}function _t(e,t,r){return e.replace(t,r)}function Qa(e,t,r){return e.indexOf(t,r)}function xe(e,t){return e.charCodeAt(t)|0}function ds(e,t,r){return e.slice(t,r)}function Vr(e){return e.length}function Wx(e){return e.length}function ao(e,t){return t.push(e),e}function tT(e,t){return e.map(t).join("")}function ug(e,t){return e.filter(function(r){return!si(r,t)})}var pc=1,us=1,Vx=0,br=0,oe=0,Ls="";function fc(e,t,r,i,n,s,o,a){return{value:e,root:t,parent:r,type:i,props:n,children:s,line:pc,column:us,length:o,return:"",siblings:a}}function vi(e,t){return jd(fc("",null,null,"",null,null,0,e.siblings),e,{length:-e.length},t)}function Mn(e){for(;e.root;)e=vi(e.root,{children:[e]});ao(e,e.siblings)}function eT(){return oe}function rT(){return oe=br>0?xe(Ls,--br):0,us--,oe===10&&(us=1,pc--),oe}function Er(){return oe=br<Vx?xe(Ls,br++):0,us++,oe===10&&(us=1,pc++),oe}function on(){return xe(Ls,br)}function Za(){return br}function gc(e,t){return ds(Ls,e,t)}function Ed(e){switch(e){case 0:case 9:case 10:case 13:case 32:return 5;case 33:case 43:case 44:case 47:case 62:case 64:case 126:case 59:case 123:case 125:return 4;case 58:return 3;case 34:case 39:case 40:case 91:return 2;case 41:case 93:return 1}return 0}function iT(e){return pc=us=1,Vx=Vr(Ls=e),br=0,[]}function nT(e){return Ls="",e}function xh(e){return qx(gc(br-1,Ld(e===91?e+2:e===40?e+1:e)))}function sT(e){for(;(oe=on())&&oe<33;)Er();return Ed(e)>2||Ed(oe)>3?"":" "}function oT(e,t){for(;--t&&Er()&&!(oe<48||oe>102||oe>57&&oe<65||oe>70&&oe<97););return gc(e,Za()+(t<6&&on()==32&&Er()==32))}function Ld(e){for(;Er();)switch(oe){case e:return br;case 34:case 39:e!==34&&e!==39&&Ld(oe);break;case 40:e===41&&Ld(e);break;case 92:Er();break}return br}function aT(e,t){for(;Er()&&e+oe!==57;)if(e+oe===84&&on()===47)break;return"/*"+gc(t,br-1)+"*"+rp(e===47?e:Er())}function lT(e){for(;!Ed(on());)Er();return gc(e,br)}function cT(e){return nT(Ja("",null,null,null,[""],e=iT(e),0,[0],e))}function Ja(e,t,r,i,n,s,o,a,l){for(var c=0,d=0,u=o,p=0,f=0,g=0,x=1,v=1,y=1,b=0,w="",S=n,_=s,A=i,C=w;v;)switch(g=b,b=Er()){case 40:if(g!=108&&xe(C,u-1)==58){Qa(C+=_t(xh(b),"&","&\f"),"&\f",Hx(c?a[c-1]:0))!=-1&&(y=-1);break}case 34:case 39:case 91:C+=xh(b);break;case 9:case 10:case 13:case 32:C+=sT(g);break;case 92:C+=oT(Za()-1,7);continue;case 47:switch(on()){case 42:case 47:ao(hT(aT(Er(),Za()),t,r,l),l);break;default:C+="/"}break;case 123*x:a[c++]=Vr(C)*y;case 125*x:case 59:case 0:switch(b){case 0:case 125:v=0;case 59+d:y==-1&&(C=_t(C,/\f/g,"")),f>0&&Vr(C)-u&&ao(f>32?fg(C+";",i,r,u-1,l):fg(_t(C," ","")+";",i,r,u-2,l),l);break;case 59:C+=";";default:if(ao(A=pg(C,t,r,c,d,n,a,w,S=[],_=[],u,s),s),b===123)if(d===0)Ja(C,t,A,A,S,s,u,a,_);else switch(p===99&&xe(C,3)===110?100:p){case 100:case 108:case 109:case 115:Ja(e,A,A,i&&ao(pg(e,A,A,0,0,n,a,w,n,S=[],u,_),_),n,_,u,a,i?S:_);break;default:Ja(C,A,A,A,[""],_,0,a,_)}}c=d=f=0,x=y=1,w=C="",u=o;break;case 58:u=1+Vr(C),f=g;default:if(x<1){if(b==123)--x;else if(b==125&&x++==0&&rT()==125)continue}switch(C+=rp(b),b*x){case 38:y=d>0?1:(C+="\f",-1);break;case 44:a[c++]=(Vr(C)-1)*y,y=1;break;case 64:on()===45&&(C+=xh(Er())),p=on(),d=u=Vr(w=C+=lT(Za())),b++;break;case 45:g===45&&Vr(C)==2&&(x=0)}}return s}function pg(e,t,r,i,n,s,o,a,l,c,d,u){for(var p=n-1,f=n===0?s:[""],g=Wx(f),x=0,v=0,y=0;x<i;++x)for(var b=0,w=ds(e,p+1,p=Hx(v=o[x])),S=e;b<g;++b)(S=qx(v>0?f[b]+" "+w:_t(w,/&\f/g,f[b])))&&(l[y++]=S);return fc(e,t,r,n===0?uc:a,l,c,d,u)}function hT(e,t,r,i){return fc(e,t,r,Nx,rp(eT()),ds(e,2,-2),0,i)}function fg(e,t,r,i,n){return fc(e,t,r,ep,ds(e,0,i),ds(e,i+1,-1),i,n)}function Ux(e,t,r){switch(K_(e,t)){case 5103:return Pt+"print-"+e+e;case 5737:case 4201:case 3177:case 3433:case 1641:case 4457:case 2921:case 5572:case 6356:case 5844:case 3191:case 6645:case 3005:case 6391:case 5879:case 5623:case 6135:case 4599:case 4855:case 4215:case 6389:case 5109:case 5365:case 5621:case 3829:return Pt+e+e;case 4789:return ko+e+e;case 5349:case 4246:case 4810:case 6968:case 2756:return Pt+e+ko+e+Vt+e+e;case 5936:switch(xe(e,t+11)){case 114:return Pt+e+Vt+_t(e,/[svh]\w+-[tblr]{2}/,"tb")+e;case 108:return Pt+e+Vt+_t(e,/[svh]\w+-[tblr]{2}/,"tb-rl")+e;case 45:return Pt+e+Vt+_t(e,/[svh]\w+-[tblr]{2}/,"lr")+e}case 6828:case 4268:case 2903:return Pt+e+Vt+e+e;case 6165:return Pt+e+Vt+"flex-"+e+e;case 5187:return Pt+e+_t(e,/(\w+).+(:[^]+)/,Pt+"box-$1$2"+Vt+"flex-$1$2")+e;case 5443:return Pt+e+Vt+"flex-item-"+_t(e,/flex-|-self/g,"")+(si(e,/flex-|baseline/)?"":Vt+"grid-row-"+_t(e,/flex-|-self/g,""))+e;case 4675:return Pt+e+Vt+"flex-line-pack"+_t(e,/align-content|flex-|-self/g,"")+e;case 5548:return Pt+e+Vt+_t(e,"shrink","negative")+e;case 5292:return Pt+e+Vt+_t(e,"basis","preferred-size")+e;case 6060:return Pt+"box-"+_t(e,"-grow","")+Pt+e+Vt+_t(e,"grow","positive")+e;case 4554:return Pt+_t(e,/([^-])(transform)/g,"$1"+Pt+"$2")+e;case 6187:return _t(_t(_t(e,/(zoom-|grab)/,Pt+"$1"),/(image-set)/,Pt+"$1"),e,"")+e;case 5495:case 3959:return _t(e,/(image-set\([^]*)/,Pt+"$1$`$1");case 4968:return _t(_t(e,/(.+:)(flex-)?(.*)/,Pt+"box-pack:$3"+Vt+"flex-pack:$3"),/s.+-b[^;]+/,"justify")+Pt+e+e;case 4200:if(!si(e,/flex-|baseline/))return Vt+"grid-column-align"+ds(e,t)+e;break;case 2592:case 3360:return Vt+_t(e,"template-","")+e;case 4384:case 3616:return r&&r.some(function(i,n){return t=n,si(i.props,/grid-\w+-end/)})?~Qa(e+(r=r[t].value),"span",0)?e:Vt+_t(e,"-start","")+e+Vt+"grid-row-span:"+(~Qa(r,"span",0)?si(r,/\d+/):+si(r,/\d+/)-+si(e,/\d+/))+";":Vt+_t(e,"-start","")+e;case 4896:case 4128:return r&&r.some(function(i){return si(i.props,/grid-\w+-start/)})?e:Vt+_t(_t(e,"-end","-span"),"span ","")+e;case 4095:case 3583:case 4068:case 2532:return _t(e,/(.+)-inline(.+)/,Pt+"$1$2")+e;case 8116:case 7059:case 5753:case 5535:case 5445:case 5701:case 4933:case 4677:case 5533:case 5789:case 5021:case 4765:if(Vr(e)-1-t>6)switch(xe(e,t+1)){case 109:if(xe(e,t+4)!==45)break;case 102:return _t(e,/(.+:)(.+)-([^]+)/,"$1"+Pt+"$2-$3$1"+ko+(xe(e,t+3)==108?"$3":"$2-$3"))+e;case 115:return~Qa(e,"stretch",0)?Ux(_t(e,"stretch","fill-available"),t,r)+e:e}break;case 5152:case 5920:return _t(e,/(.+?):(\d+)(\s*\/\s*(span)?\s*(\d+))?(.*)/,function(i,n,s,o,a,l,c){return Vt+n+":"+s+c+(o?Vt+n+"-span:"+(a?l:+l-+s)+c:"")+e});case 4949:if(xe(e,t+6)===121)return _t(e,":",":"+Pt)+e;break;case 6444:switch(xe(e,xe(e,14)===45?18:11)){case 120:return _t(e,/(.+:)([^;\s!]+)(;|(\s+)?!.+)?/,"$1"+Pt+(xe(e,14)===45?"inline-":"")+"box$3$1"+Pt+"$2$3$1"+Vt+"$2box$3")+e;case 100:return _t(e,":",":"+Vt)+e}break;case 5719:case 2647:case 2135:case 3927:case 2391:return _t(e,"scroll-","scroll-snap-")+e}return e}function vl(e,t){for(var r="",i=0;i<e.length;i++)r+=t(e[i],i,e,t)||"";return r}function dT(e,t,r,i){switch(e.type){case J_:if(e.children.length)break;case Z_:case ep:return e.return=e.return||e.value;case Nx:return"";case zx:return e.return=e.value+"{"+vl(e.children,i)+"}";case uc:if(!Vr(e.value=e.props.join(",")))return""}return Vr(r=vl(e.children,i))?e.return=e.value+"{"+r+"}":""}function uT(e){var t=Wx(e);return function(r,i,n,s){for(var o="",a=0;a<t;a++)o+=e[a](r,i,n,s)||"";return o}}function pT(e){return function(t){t.root||(t=t.return)&&e(t)}}function fT(e,t,r,i){if(e.length>-1&&!e.return)switch(e.type){case ep:e.return=Ux(e.value,e.length,r);return;case zx:return vl([vi(e,{value:_t(e.value,"@","@"+Pt)})],i);case uc:if(e.length)return tT(r=e.props,function(n){switch(si(n,i=/(::plac\w+|:read-\w+)/)){case":read-only":case":read-write":Mn(vi(e,{props:[_t(n,/:(read-\w+)/,":"+ko+"$1")]})),Mn(vi(e,{props:[n]})),jd(e,{props:ug(r,i)});break;case"::placeholder":Mn(vi(e,{props:[_t(n,/:(plac\w+)/,":"+Pt+"input-$1")]})),Mn(vi(e,{props:[_t(n,/:(plac\w+)/,":"+ko+"$1")]})),Mn(vi(e,{props:[_t(n,/:(plac\w+)/,Vt+"input-$1")]})),Mn(vi(e,{props:[n]})),jd(e,{props:ug(r,i)});break}return""})}}var gT={animationIterationCount:1,aspectRatio:1,borderImageOutset:1,borderImageSlice:1,borderImageWidth:1,boxFlex:1,boxFlexGroup:1,boxOrdinalGroup:1,columnCount:1,columns:1,flex:1,flexGrow:1,flexPositive:1,flexShrink:1,flexNegative:1,flexOrder:1,gridRow:1,gridRowEnd:1,gridRowSpan:1,gridRowStart:1,gridColumn:1,gridColumnEnd:1,gridColumnSpan:1,gridColumnStart:1,msGridRow:1,msGridRowSpan:1,msGridColumn:1,msGridColumnSpan:1,fontWeight:1,lineHeight:1,opacity:1,order:1,orphans:1,tabSize:1,widows:1,zIndex:1,zoom:1,WebkitLineClamp:1,fillOpacity:1,floodOpacity:1,stopOpacity:1,strokeDasharray:1,strokeDashoffset:1,strokeMiterlimit:1,strokeOpacity:1,strokeWidth:1},or={},ps=typeof process<"u"&&or!==void 0&&(or.REACT_APP_SC_ATTR||or.SC_ATTR)||"data-styled",Gx="active",Yx="data-styled-version",mc="6.1.19",ip=`/*!sc*/
`,wl=typeof window<"u"&&typeof document<"u",mT=!!(typeof SC_DISABLE_SPEEDY=="boolean"?SC_DISABLE_SPEEDY:typeof process<"u"&&or!==void 0&&or.REACT_APP_SC_DISABLE_SPEEDY!==void 0&&or.REACT_APP_SC_DISABLE_SPEEDY!==""?or.REACT_APP_SC_DISABLE_SPEEDY!=="false"&&or.REACT_APP_SC_DISABLE_SPEEDY:typeof process<"u"&&or!==void 0&&or.SC_DISABLE_SPEEDY!==void 0&&or.SC_DISABLE_SPEEDY!==""&&or.SC_DISABLE_SPEEDY!=="false"&&or.SC_DISABLE_SPEEDY),xc=Object.freeze([]),fs=Object.freeze({});function xT(e,t,r){return r===void 0&&(r=fs),e.theme!==r.theme&&e.theme||t||r.theme}var Xx=new Set(["a","abbr","address","area","article","aside","audio","b","base","bdi","bdo","big","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","data","datalist","dd","del","details","dfn","dialog","div","dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","hr","html","i","iframe","img","input","ins","kbd","keygen","label","legend","li","link","main","map","mark","menu","menuitem","meta","meter","nav","noscript","object","ol","optgroup","option","output","p","param","picture","pre","progress","q","rp","rt","ruby","s","samp","script","section","select","small","source","span","strong","style","sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","track","u","ul","use","var","video","wbr","circle","clipPath","defs","ellipse","foreignObject","g","image","line","linearGradient","marker","mask","path","pattern","polygon","polyline","radialGradient","rect","stop","svg","text","tspan"]),bT=/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~-]+/g,yT=/(^-|-$)/g;function gg(e){return e.replace(bT,"-").replace(yT,"")}var vT=/(a)(d)/gi,$a=52,mg=function(e){return String.fromCharCode(e+(e>25?39:97))};function Bd(e){var t,r="";for(t=Math.abs(e);t>$a;t=t/$a|0)r=mg(t%$a)+r;return(mg(t%$a)+r).replace(vT,"$1-$2")}var bh,Qx=5381,Vn=function(e,t){for(var r=t.length;r;)e=33*e^t.charCodeAt(--r);return e},Zx=function(e){return Vn(Qx,e)};function Jx(e){return Bd(Zx(e)>>>0)}function wT(e){return e.displayName||e.name||"Component"}function yh(e){return typeof e=="string"&&!0}var Kx=typeof Symbol=="function"&&Symbol.for,tb=Kx?Symbol.for("react.memo"):60115,kT=Kx?Symbol.for("react.forward_ref"):60112,CT={childContextTypes:!0,contextType:!0,contextTypes:!0,defaultProps:!0,displayName:!0,getDefaultProps:!0,getDerivedStateFromError:!0,getDerivedStateFromProps:!0,mixins:!0,propTypes:!0,type:!0},ST={name:!0,length:!0,prototype:!0,caller:!0,callee:!0,arguments:!0,arity:!0},eb={$$typeof:!0,compare:!0,defaultProps:!0,displayName:!0,propTypes:!0,type:!0},_T=((bh={})[kT]={$$typeof:!0,render:!0,defaultProps:!0,displayName:!0,propTypes:!0},bh[tb]=eb,bh);function xg(e){return("type"in(t=e)&&t.type.$$typeof)===tb?eb:"$$typeof"in e?_T[e.$$typeof]:CT;var t}var TT=Object.defineProperty,$T=Object.getOwnPropertyNames,bg=Object.getOwnPropertySymbols,AT=Object.getOwnPropertyDescriptor,jT=Object.getPrototypeOf,yg=Object.prototype;function rb(e,t,r){if(typeof t!="string"){if(yg){var i=jT(t);i&&i!==yg&&rb(e,i,r)}var n=$T(t);bg&&(n=n.concat(bg(t)));for(var s=xg(e),o=xg(t),a=0;a<n.length;++a){var l=n[a];if(!(l in ST||r&&r[l]||o&&l in o||s&&l in s)){var c=AT(t,l);try{TT(e,l,c)}catch{}}}}return e}function gs(e){return typeof e=="function"}function np(e){return typeof e=="object"&&"styledComponentId"in e}function Ji(e,t){return e&&t?"".concat(e," ").concat(t):e||t||""}function Md(e,t){if(e.length===0)return"";for(var r=e[0],i=1;i<e.length;i++)r+=e[i];return r}function Oo(e){return e!==null&&typeof e=="object"&&e.constructor.name===Object.name&&!("props"in e&&e.$$typeof)}function Id(e,t,r){if(r===void 0&&(r=!1),!r&&!Oo(e)&&!Array.isArray(e))return t;if(Array.isArray(t))for(var i=0;i<t.length;i++)e[i]=Id(e[i],t[i]);else if(Oo(t))for(var i in t)e[i]=Id(e[i],t[i]);return e}function sp(e,t){Object.defineProperty(e,"toString",{value:t})}function na(e){for(var t=[],r=1;r<arguments.length;r++)t[r-1]=arguments[r];return new Error("An error occurred. See https://github.com/styled-components/styled-components/blob/main/packages/styled-components/src/utils/errors.md#".concat(e," for more information.").concat(t.length>0?" Args: ".concat(t.join(", ")):""))}var ET=function(){function e(t){this.groupSizes=new Uint32Array(512),this.length=512,this.tag=t}return e.prototype.indexOfGroup=function(t){for(var r=0,i=0;i<t;i++)r+=this.groupSizes[i];return r},e.prototype.insertRules=function(t,r){if(t>=this.groupSizes.length){for(var i=this.groupSizes,n=i.length,s=n;t>=s;)if((s<<=1)<0)throw na(16,"".concat(t));this.groupSizes=new Uint32Array(s),this.groupSizes.set(i),this.length=s;for(var o=n;o<s;o++)this.groupSizes[o]=0}for(var a=this.indexOfGroup(t+1),l=(o=0,r.length);o<l;o++)this.tag.insertRule(a,r[o])&&(this.groupSizes[t]++,a++)},e.prototype.clearGroup=function(t){if(t<this.length){var r=this.groupSizes[t],i=this.indexOfGroup(t),n=i+r;this.groupSizes[t]=0;for(var s=i;s<n;s++)this.tag.deleteRule(i)}},e.prototype.getGroup=function(t){var r="";if(t>=this.length||this.groupSizes[t]===0)return r;for(var i=this.groupSizes[t],n=this.indexOfGroup(t),s=n+i,o=n;o<s;o++)r+="".concat(this.tag.getRule(o)).concat(ip);return r},e}(),Ka=new Map,kl=new Map,tl=1,Aa=function(e){if(Ka.has(e))return Ka.get(e);for(;kl.has(tl);)tl++;var t=tl++;return Ka.set(e,t),kl.set(t,e),t},LT=function(e,t){tl=t+1,Ka.set(e,t),kl.set(t,e)},BT="style[".concat(ps,"][").concat(Yx,'="').concat(mc,'"]'),MT=new RegExp("^".concat(ps,'\\.g(\\d+)\\[id="([\\w\\d-]+)"\\].*?"([^"]*)')),IT=function(e,t,r){for(var i,n=r.split(","),s=0,o=n.length;s<o;s++)(i=n[s])&&e.registerName(t,i)},OT=function(e,t){for(var r,i=((r=t.textContent)!==null&&r!==void 0?r:"").split(ip),n=[],s=0,o=i.length;s<o;s++){var a=i[s].trim();if(a){var l=a.match(MT);if(l){var c=0|parseInt(l[1],10),d=l[2];c!==0&&(LT(d,c),IT(e,d,l[3]),e.getTag().insertRules(c,n)),n.length=0}else n.push(a)}}},vg=function(e){for(var t=document.querySelectorAll(BT),r=0,i=t.length;r<i;r++){var n=t[r];n&&n.getAttribute(ps)!==Gx&&(OT(e,n),n.parentNode&&n.parentNode.removeChild(n))}};function RT(){return typeof __webpack_nonce__<"u"?__webpack_nonce__:null}var ib=function(e){var t=document.head,r=e||t,i=document.createElement("style"),n=function(a){var l=Array.from(a.querySelectorAll("style[".concat(ps,"]")));return l[l.length-1]}(r),s=n!==void 0?n.nextSibling:null;i.setAttribute(ps,Gx),i.setAttribute(Yx,mc);var o=RT();return o&&i.setAttribute("nonce",o),r.insertBefore(i,s),i},DT=function(){function e(t){this.element=ib(t),this.element.appendChild(document.createTextNode("")),this.sheet=function(r){if(r.sheet)return r.sheet;for(var i=document.styleSheets,n=0,s=i.length;n<s;n++){var o=i[n];if(o.ownerNode===r)return o}throw na(17)}(this.element),this.length=0}return e.prototype.insertRule=function(t,r){try{return this.sheet.insertRule(r,t),this.length++,!0}catch{return!1}},e.prototype.deleteRule=function(t){this.sheet.deleteRule(t),this.length--},e.prototype.getRule=function(t){var r=this.sheet.cssRules[t];return r&&r.cssText?r.cssText:""},e}(),FT=function(){function e(t){this.element=ib(t),this.nodes=this.element.childNodes,this.length=0}return e.prototype.insertRule=function(t,r){if(t<=this.length&&t>=0){var i=document.createTextNode(r);return this.element.insertBefore(i,this.nodes[t]||null),this.length++,!0}return!1},e.prototype.deleteRule=function(t){this.element.removeChild(this.nodes[t]),this.length--},e.prototype.getRule=function(t){return t<this.length?this.nodes[t].textContent:""},e}(),PT=function(){function e(t){this.rules=[],this.length=0}return e.prototype.insertRule=function(t,r){return t<=this.length&&(this.rules.splice(t,0,r),this.length++,!0)},e.prototype.deleteRule=function(t){this.rules.splice(t,1),this.length--},e.prototype.getRule=function(t){return t<this.length?this.rules[t]:""},e}(),wg=wl,NT={isServer:!wl,useCSSOMInjection:!mT},nb=function(){function e(t,r,i){t===void 0&&(t=fs),r===void 0&&(r={});var n=this;this.options=Ze(Ze({},NT),t),this.gs=r,this.names=new Map(i),this.server=!!t.isServer,!this.server&&wl&&wg&&(wg=!1,vg(this)),sp(this,function(){return function(s){for(var o=s.getTag(),a=o.length,l="",c=function(u){var p=function(y){return kl.get(y)}(u);if(p===void 0)return"continue";var f=s.names.get(p),g=o.getGroup(u);if(f===void 0||!f.size||g.length===0)return"continue";var x="".concat(ps,".g").concat(u,'[id="').concat(p,'"]'),v="";f!==void 0&&f.forEach(function(y){y.length>0&&(v+="".concat(y,","))}),l+="".concat(g).concat(x,'{content:"').concat(v,'"}').concat(ip)},d=0;d<a;d++)c(d);return l}(n)})}return e.registerId=function(t){return Aa(t)},e.prototype.rehydrate=function(){!this.server&&wl&&vg(this)},e.prototype.reconstructWithOptions=function(t,r){return r===void 0&&(r=!0),new e(Ze(Ze({},this.options),t),this.gs,r&&this.names||void 0)},e.prototype.allocateGSInstance=function(t){return this.gs[t]=(this.gs[t]||0)+1},e.prototype.getTag=function(){return this.tag||(this.tag=(t=function(r){var i=r.useCSSOMInjection,n=r.target;return r.isServer?new PT(n):i?new DT(n):new FT(n)}(this.options),new ET(t)));var t},e.prototype.hasNameForId=function(t,r){return this.names.has(t)&&this.names.get(t).has(r)},e.prototype.registerName=function(t,r){if(Aa(t),this.names.has(t))this.names.get(t).add(r);else{var i=new Set;i.add(r),this.names.set(t,i)}},e.prototype.insertRules=function(t,r,i){this.registerName(t,r),this.getTag().insertRules(Aa(t),i)},e.prototype.clearNames=function(t){this.names.has(t)&&this.names.get(t).clear()},e.prototype.clearRules=function(t){this.getTag().clearGroup(Aa(t)),this.clearNames(t)},e.prototype.clearTag=function(){this.tag=void 0},e}(),zT=/&/g,HT=/^\s*\/\/.*$/gm;function sb(e,t){return e.map(function(r){return r.type==="rule"&&(r.value="".concat(t," ").concat(r.value),r.value=r.value.replaceAll(",",",".concat(t," ")),r.props=r.props.map(function(i){return"".concat(t," ").concat(i)})),Array.isArray(r.children)&&r.type!=="@keyframes"&&(r.children=sb(r.children,t)),r})}function qT(e){var t,r,i,n=fs,s=n.options,o=s===void 0?fs:s,a=n.plugins,l=a===void 0?xc:a,c=function(p,f,g){return g.startsWith(r)&&g.endsWith(r)&&g.replaceAll(r,"").length>0?".".concat(t):p},d=l.slice();d.push(function(p){p.type===uc&&p.value.includes("&")&&(p.props[0]=p.props[0].replace(zT,r).replace(i,c))}),o.prefix&&d.push(fT),d.push(dT);var u=function(p,f,g,x){f===void 0&&(f=""),g===void 0&&(g=""),x===void 0&&(x="&"),t=x,r=f,i=new RegExp("\\".concat(r,"\\b"),"g");var v=p.replace(HT,""),y=cT(g||f?"".concat(g," ").concat(f," { ").concat(v," }"):v);o.namespace&&(y=sb(y,o.namespace));var b=[];return vl(y,uT(d.concat(pT(function(w){return b.push(w)})))),b};return u.hash=l.length?l.reduce(function(p,f){return f.name||na(15),Vn(p,f.name)},Qx).toString():"",u}var WT=new nb,Od=qT(),ob=Mr.createContext({shouldForwardProp:void 0,styleSheet:WT,stylis:Od});ob.Consumer;Mr.createContext(void 0);function kg(){return M.useContext(ob)}var ab=function(){function e(t,r){var i=this;this.inject=function(n,s){s===void 0&&(s=Od);var o=i.name+s.hash;n.hasNameForId(i.id,o)||n.insertRules(i.id,o,s(i.rules,o,"@keyframes"))},this.name=t,this.id="sc-keyframes-".concat(t),this.rules=r,sp(this,function(){throw na(12,String(i.name))})}return e.prototype.getName=function(t){return t===void 0&&(t=Od),this.name+t.hash},e}(),VT=function(e){return e>="A"&&e<="Z"};function Cg(e){for(var t="",r=0;r<e.length;r++){var i=e[r];if(r===1&&i==="-"&&e[0]==="-")return e;VT(i)?t+="-"+i.toLowerCase():t+=i}return t.startsWith("ms-")?"-"+t:t}var lb=function(e){return e==null||e===!1||e===""},cb=function(e){var t,r,i=[];for(var n in e){var s=e[n];e.hasOwnProperty(n)&&!lb(s)&&(Array.isArray(s)&&s.isCss||gs(s)?i.push("".concat(Cg(n),":"),s,";"):Oo(s)?i.push.apply(i,Io(Io(["".concat(n," {")],cb(s),!1),["}"],!1)):i.push("".concat(Cg(n),": ").concat((t=n,(r=s)==null||typeof r=="boolean"||r===""?"":typeof r!="number"||r===0||t in gT||t.startsWith("--")?String(r).trim():"".concat(r,"px")),";")))}return i};function an(e,t,r,i){if(lb(e))return[];if(np(e))return[".".concat(e.styledComponentId)];if(gs(e)){if(!gs(s=e)||s.prototype&&s.prototype.isReactComponent||!t)return[e];var n=e(t);return an(n,t,r,i)}var s;return e instanceof ab?r?(e.inject(r,i),[e.getName(i)]):[e]:Oo(e)?cb(e):Array.isArray(e)?Array.prototype.concat.apply(xc,e.map(function(o){return an(o,t,r,i)})):[e.toString()]}function UT(e){for(var t=0;t<e.length;t+=1){var r=e[t];if(gs(r)&&!np(r))return!1}return!0}var GT=Zx(mc),YT=function(){function e(t,r,i){this.rules=t,this.staticRulesId="",this.isStatic=(i===void 0||i.isStatic)&&UT(t),this.componentId=r,this.baseHash=Vn(GT,r),this.baseStyle=i,nb.registerId(r)}return e.prototype.generateAndInjectStyles=function(t,r,i){var n=this.baseStyle?this.baseStyle.generateAndInjectStyles(t,r,i):"";if(this.isStatic&&!i.hash)if(this.staticRulesId&&r.hasNameForId(this.componentId,this.staticRulesId))n=Ji(n,this.staticRulesId);else{var s=Md(an(this.rules,t,r,i)),o=Bd(Vn(this.baseHash,s)>>>0);if(!r.hasNameForId(this.componentId,o)){var a=i(s,".".concat(o),void 0,this.componentId);r.insertRules(this.componentId,o,a)}n=Ji(n,o),this.staticRulesId=o}else{for(var l=Vn(this.baseHash,i.hash),c="",d=0;d<this.rules.length;d++){var u=this.rules[d];if(typeof u=="string")c+=u;else if(u){var p=Md(an(u,t,r,i));l=Vn(l,p+d),c+=p}}if(c){var f=Bd(l>>>0);r.hasNameForId(this.componentId,f)||r.insertRules(this.componentId,f,i(c,".".concat(f),void 0,this.componentId)),n=Ji(n,f)}}return n},e}(),hb=Mr.createContext(void 0);hb.Consumer;var vh={};function XT(e,t,r){var i=np(e),n=e,s=!yh(e),o=t.attrs,a=o===void 0?xc:o,l=t.componentId,c=l===void 0?function(S,_){var A=typeof S!="string"?"sc":gg(S);vh[A]=(vh[A]||0)+1;var C="".concat(A,"-").concat(Jx(mc+A+vh[A]));return _?"".concat(_,"-").concat(C):C}(t.displayName,t.parentComponentId):l,d=t.displayName,u=d===void 0?function(S){return yh(S)?"styled.".concat(S):"Styled(".concat(wT(S),")")}(e):d,p=t.displayName&&t.componentId?"".concat(gg(t.displayName),"-").concat(t.componentId):t.componentId||c,f=i&&n.attrs?n.attrs.concat(a).filter(Boolean):a,g=t.shouldForwardProp;if(i&&n.shouldForwardProp){var x=n.shouldForwardProp;if(t.shouldForwardProp){var v=t.shouldForwardProp;g=function(S,_){return x(S,_)&&v(S,_)}}else g=x}var y=new YT(r,p,i?n.componentStyle:void 0);function b(S,_){return function(A,C,E){var P=A.attrs,z=A.componentStyle,D=A.defaultProps,V=A.foldedComponentIds,H=A.styledComponentId,O=A.target,R=Mr.useContext(hb),T=kg(),L=A.shouldForwardProp||T.shouldForwardProp,$=xT(C,R,D)||fs,N=function(W,it,pt){for(var Dt,Zt=Ze(Ze({},it),{className:void 0,theme:pt}),Wt=0;Wt<W.length;Wt+=1){var ge=gs(Dt=W[Wt])?Dt(Zt):Dt;for(var le in ge)Zt[le]=le==="className"?Ji(Zt[le],ge[le]):le==="style"?Ze(Ze({},Zt[le]),ge[le]):ge[le]}return it.className&&(Zt.className=Ji(Zt.className,it.className)),Zt}(P,C,$),G=N.as||O,Q={};for(var Y in N)N[Y]===void 0||Y[0]==="$"||Y==="as"||Y==="theme"&&N.theme===$||(Y==="forwardedAs"?Q.as=N.forwardedAs:L&&!L(Y,G)||(Q[Y]=N[Y]));var F=function(W,it){var pt=kg(),Dt=W.generateAndInjectStyles(it,pt.styleSheet,pt.stylis);return Dt}(z,N),J=Ji(V,H);return F&&(J+=" "+F),N.className&&(J+=" "+N.className),Q[yh(G)&&!Xx.has(G)?"class":"className"]=J,E&&(Q.ref=E),M.createElement(G,Q)}(w,S,_)}b.displayName=u;var w=Mr.forwardRef(b);return w.attrs=f,w.componentStyle=y,w.displayName=u,w.shouldForwardProp=g,w.foldedComponentIds=i?Ji(n.foldedComponentIds,n.styledComponentId):"",w.styledComponentId=p,w.target=i?n.target:e,Object.defineProperty(w,"defaultProps",{get:function(){return this._foldedDefaultProps},set:function(S){this._foldedDefaultProps=i?function(_){for(var A=[],C=1;C<arguments.length;C++)A[C-1]=arguments[C];for(var E=0,P=A;E<P.length;E++)Id(_,P[E],!0);return _}({},n.defaultProps,S):S}}),sp(w,function(){return".".concat(w.styledComponentId)}),s&&rb(w,e,{attrs:!0,componentStyle:!0,displayName:!0,foldedComponentIds:!0,shouldForwardProp:!0,styledComponentId:!0,target:!0}),w}function Sg(e,t){for(var r=[e[0]],i=0,n=t.length;i<n;i+=1)r.push(t[i],e[i+1]);return r}var _g=function(e){return Object.assign(e,{isCss:!0})};function db(e){for(var t=[],r=1;r<arguments.length;r++)t[r-1]=arguments[r];if(gs(e)||Oo(e))return _g(an(Sg(xc,Io([e],t,!0))));var i=e;return t.length===0&&i.length===1&&typeof i[0]=="string"?an(i):_g(an(Sg(i,t)))}function Rd(e,t,r){if(r===void 0&&(r=fs),!t)throw na(1,t);var i=function(n){for(var s=[],o=1;o<arguments.length;o++)s[o-1]=arguments[o];return e(t,r,db.apply(void 0,Io([n],s,!1)))};return i.attrs=function(n){return Rd(e,t,Ze(Ze({},r),{attrs:Array.prototype.concat(r.attrs,n).filter(Boolean)}))},i.withConfig=function(n){return Rd(e,t,Ze(Ze({},r),n))},i}var ub=function(e){return Rd(XT,e)},k=ub;Xx.forEach(function(e){k[e]=ub(e)});function Cr(e){for(var t=[],r=1;r<arguments.length;r++)t[r-1]=arguments[r];var i=Md(db.apply(void 0,Io([e],t,!1))),n=Jx(i);return new ab(n,i)}const Tg=[{value:"Gemini",label:"Google Gemini"},{value:"Anthropic",label:"Anthropic Claude"},{value:"Groq",label:"Groq (Llama)"},{value:"Deepseek",label:"Deepseek"},{value:"OpenAI",label:"OpenAI"},{value:"Qwen",label:"Alibaba Qwen"},{value:"GLM",label:"Zhipu GLM"},{value:"Local",label:"Local (OpenAI Compatible)"}],$g=[{value:"Agent",label:"Agent"},{value:"Ask",label:"Ask"}],Ag=[{value:"tokyo night",label:"Tokyo Night"},{value:"Atom One Dark",label:"Atom One Dark"},{value:"github dark",label:"GitHub Dark"},{value:"night owl",label:"Night Owl"},{value:"stackoverflow",label:"Stack Overflow"},{value:"Code Pen",label:"Code Pen"},{value:"ir black",label:"IR Black"},{value:"felipec",label:"Felipec"},{value:"Atom One Dark Reasonable",label:"Atom One Dark Reasonable"}],jg=[{value:"qwen2.5-coder",label:"Qwen 2.5 Coder (7B)",description:"Excellent for code tasks - Recommended"},{value:"qwen2.5-coder:3b",label:"Qwen 2.5 Coder (3B)",description:"Faster, lighter coding model"},{value:"llama3.2",label:"Llama 3.2 (3B)",description:"Efficient general purpose model"},{value:"deepseek-coder",label:"DeepSeek Coder",description:"Strong code completion capabilities"},{value:"codellama",label:"CodeLlama (7B)",description:"Meta's code-focused model"}],QT=[{question:"HOW DO I SET UP CODEBUDDY?",answer:`<p>Setting up CodeBuddy is simple:</p>
      <ol>
          <li>Obtain API keys for one of the supported LLMs: Gemini, Anthropic, Deepseek, OpenAI, Qwen, GLM, Groq, or use a Local model</li>
          <li>Open VS Code settings (File > Preferences > Settings)</li>
          <li>Search for "CodeBuddy" in the settings search bar</li>
          <li>Select your preferred AI model from the dropdown</li>
          <li>Enter your API key (or Base URL for Local models) in the appropriate field</li>
          <li>Save your settings and restart VS Code if needed</li>
      </ol>
    <p>That's it! CodeBuddy should now be ready to assist you.</p>`},{question:"WHICH AI MODELS WORK BEST WITH CODEBUDDY?",answer:`<p>For optimal performance with CodeBuddy, we recommend:</p>
        <h3>Cloud Models:</h3>
        <ul>
            <li><strong>Gemini:</strong> Gemini-2.0-flash or higher versions provide excellent results</li>
            <li><strong>Deepseek:</strong> DeepSeek-V3 or R1 models are highly capable for coding tasks</li>
            <li><strong>Anthropic:</strong> Claude 3.5 Sonnet is excellent for complex architectural reasoning</li>
            <li><strong>OpenAI:</strong> GPT-4o offers robust general-purpose coding assistance</li>
            <li><strong>Qwen:</strong> Qwen 2.5 Coder is a strong open-weight contender</li>
            <li><strong>Groq:</strong> Offers ultra-fast inference with Llama models</li>
        </ul>
        <h3>Local Models (Privacy-First):</h3>
        <ul>
            <li><strong>Qwen 2.5 Coder (7B):</strong> Excellent code understanding and generation - <em>recommended for local use</em></li>
            <li><strong>Qwen 2.5 Coder (3B):</strong> Faster, lighter version for quick tasks</li>
            <li><strong>DeepSeek Coder:</strong> Strong performance on coding benchmarks</li>
            <li><strong>CodeLlama:</strong> Meta's code-specialized model</li>
            <li><strong>Llama 3.2:</strong> Good general-purpose model that handles code well</li>
        </ul>
        <p><strong>Tip:</strong> Local models via Ollama work great for both Chat and Agent modes, keeping your code completely private!</p>
        <p>The best model depends on your use case: cloud models for maximum capability, local models for privacy and offline access.</p>`},{question:"HOW DO I USE THE AGENT MODE?",answer:`<p>To use CodeBuddy's Agent Mode:</p>
      <ol>
          <li>Ensure you've selected a model in the settings</li>
          <li>Agent mode works with all supported models: Gemini, Anthropic, Deepseek, OpenAI, Qwen, GLM, Groq, and <strong>Local models</strong></li>
          <li>Open the CodeBuddy sidebar in VS Code</li>
          <li>Select "Agent" mode from the mode switcher at the top</li>
      </ol>
      <h3>What Agent Mode Does:</h3>
      <ul>
          <li><strong>File Operations:</strong> Read, write, and edit files in your workspace</li>
          <li><strong>Web Search:</strong> Search for documentation, solutions, and best practices</li>
          <li><strong>Code Analysis:</strong> Analyze your codebase structure and dependencies</li>
          <li><strong>Context Awareness:</strong> Automatically includes your active file and @mentioned files</li>
      </ul>
      <h3>Using Local Models with Agent:</h3>
      <p>Local models like <strong>Qwen 2.5 Coder</strong> (via Ollama) fully support Agent mode, allowing you to:</p>
      <ul>
          <li>Keep all your code completely private (nothing leaves your machine)</li>
          <li>Work offline without internet connectivity</li>
          <li>Avoid API costs for frequent usage</li>
      </ul>
      <p><strong>Tip:</strong> The smart context system respects local model token limits (typically 4K tokens), automatically selecting the most relevant code snippets.</p>`},{question:"HOW DO I INSTALL LOCAL MODELS?",answer:`<p>To run local models with CodeBuddy, you need a local LLM server compatible with OpenAI's API format.</p>
    
    <h3>Option 1: CodeBuddy Settings UI (Easiest)</h3>
    <ol>
      <li>Open CodeBuddy sidebar and go to <strong>Settings → Local Models</strong></li>
      <li>Click <strong>"Start Server"</strong> to launch Ollama via Docker Compose</li>
      <li>Select a model from the predefined list (e.g., Qwen 2.5 Coder, Llama 3.2)</li>
      <li>Click <strong>"Pull"</strong> to download the model</li>
      <li>Once pulled, click <strong>"Use"</strong> to configure CodeBuddy to use it</li>
    </ol>
    <p><em>The UI shows model status, allows pulling/deleting models, and automatically configures the API endpoint.</em></p>
    
    <h3>Option 2: Ollama (Manual)</h3>
    <ol>
      <li>Download and install Ollama from <a href="https://ollama.com">ollama.com</a></li>
      <li>Run a model in your terminal: <code>ollama run qwen2.5-coder</code> or <code>ollama run llama3</code></li>
      <li>In CodeBuddy settings:
        <ul>
          <li>Set Model to <strong>Local</strong></li>
          <li>Set Base URL to <code>http://localhost:11434/v1</code></li>
          <li>Set Model Name to the model you pulled (e.g., <code>qwen2.5-coder</code>)</li>
        </ul>
      </li>
    </ol>
    
    <h3>Option 3: LM Studio</h3>
    <ol>
      <li>Download LM Studio from <a href="https://lmstudio.ai">lmstudio.ai</a></li>
      <li>Load a model and start the "Local Server"</li>
      <li>In CodeBuddy settings, use the URL provided by LM Studio (usually <code>http://localhost:1234/v1</code>)</li>
    </ol>
    
    <h3>Option 4: Docker Compose (Recommended for Teams)</h3>
    <p>Use the built-in Docker Compose support with 32GB memory allocation:</p>
    <ol>
      <li>Click <strong>"Start Server"</strong> in Settings → Local Models, or run: <code>docker compose -f docker-compose.yml up -d</code></li>
      <li>Pull a model via UI or: <code>docker exec -it ollama ollama pull qwen2.5-coder</code></li>
      <li>CodeBuddy auto-connects to <code>http://localhost:11434/v1</code></li>
    </ol>
    
    <h3>Recommended Models for Coding:</h3>
    <ul>
      <li><strong>qwen2.5-coder (7B)</strong> - Excellent for code generation and understanding</li>
      <li><strong>qwen2.5-coder:3b</strong> - Faster, lighter version for quick tasks</li>
      <li><strong>deepseek-coder</strong> - Strong code completion capabilities</li>
      <li><strong>codellama</strong> - Meta's code-focused model</li>
    </ul>
    
    <p><strong>Note:</strong> Local models work with both Chat and Agent modes in CodeBuddy!</p>`},{question:"WHAT ARE THE CODEBUDDY AGENT CAPABILITIES?",answer:`<p>The CodeBuddy Agent is a sophisticated AI-powered assistant integrated within VS Code that offers several advanced capabilities to enhance your coding experience:</p>
      <h3>Detailed Capabilities</h3>
      <ol>
        <li><strong>Reasoning Ability</strong>
          <ul>
            <li>Can understand complex coding questions and requirements</li>
            <li>Provides logical explanations for coding solutions</li>
            <li>Helps troubleshoot bugs by analyzing code logic</li>
            <li>Offers architectural recommendations with supporting rationale</li>
          </ul>
        </li>
        <li><strong>Web Search Integration</strong>
          <ul>
            <li>Searches the internet for relevant coding documentation</li>
            <li>Finds solutions to specific error messages or bugs</li>
            <li>Gathers information about libraries, frameworks, and best practices</li>
            <li>Stays current with the latest programming techniques and standards</li>
          </ul>
        </li>
        <li><strong>Workspace File Access</strong>
          <ul>
            <li>Reads and analyzes files within your VS Code workspace</li>
            <li>Understands project structure and dependencies</li>
            <li>Examines related code files for context when solving problems</li>
            <li>Can reference existing implementations to maintain code consistency</li>
          </ul>
        </li>
        <li><strong>Smart Context Selection</strong>
          <ul>
            <li>Automatically includes your active file as context</li>
            <li>Respects token limits based on your model (4K for local, 20K+ for cloud)</li>
            <li>Prioritizes @mentioned files over auto-gathered context</li>
            <li>Uses relevance scoring to select the most helpful code snippets</li>
          </ul>
        </li>
        <li><strong>RAG-Based Architecture</strong> (Retrieval-Augmented Generation)
          <ul>
            <li>Combines knowledge retrieval with generative AI capabilities</li>
            <li>Provides more accurate and contextually relevant responses</li>
            <li>Accesses specialized coding knowledge beyond its base training</li>
            <li>Offers higher-quality solutions by retrieving pertinent information before generating responses</li>
          </ul>
        </li>
      </ol>
      <p>The CodeBuddy Agent is specifically designed to function as your intelligent coding companion, helping you write better, more efficient code while saving time on research and debugging.</p>
      <p><strong>Supported Models:</strong> Agent mode works with Gemini, Anthropic, Deepseek, OpenAI, Qwen, GLM, Groq, and <strong>Local models</strong> (like Qwen 2.5 Coder via Ollama).</p>`},{question:"CAN I DOWNLOAD MY CHAT HISTORY",answer:"Yes you can. This version of codebuddy give the data back to the user by creating a gitignored file called .codebuddy. This file can be found at the root level of your application. It houses your chatHistory and in the future, your logs."},{question:"WHAT IS THE ACTIVE WORKSPACE",answer:`<p>The <strong>Active Workspace</strong> display shows your current working context in CodeBuddy, dynamically updating as you navigate your project:</p>

<h3>How It Works:</h3>
<ul>
    <li><strong>Shows Current File:</strong> When you have a file open, it displays the relative path from your workspace root (e.g., <code>src/components/App.tsx</code>)</li>
    <li><strong>Auto-Updates:</strong> Automatically changes when you switch between files in VS Code</li>
    <li><strong>Untitled Files:</strong> Shows empty when editing unsaved/untitled files</li>
    <li><strong>Workspace Fallback:</strong> When no file is open, shows your workspace folder name</li>
</ul>

<h3>Context Integration:</h3>
<ul>
    <li><strong>Automatic Context:</strong> The currently displayed active file is <strong>automatically included as context</strong> when you send a message</li>
    <li><strong>Combined with @ Mentions:</strong> If you also add files using <strong>@file</strong> mentions, both the active file and @mentioned files are included together</li>
    <li><strong>Smart Deduplication:</strong> If you @mention the same file that's active, it won't be added twice</li>
</ul>

<p>This means CodeBuddy always has awareness of what you're currently working on, providing more relevant and contextual responses.</p>
`},{question:"WHAT IS THE CHAT CONTEXT AND HOW CAN I USE @ MENTIONS?",answer:`

<p>Chat Context in CodeBuddy allows you to provide relevant files to the AI model for more accurate, contextual responses. With the new <strong>@ mention</strong> feature, adding context is easier than ever!</p>

<h3>How to Add Context:</h3>
<ul>
    <li><strong>Type @</strong> in the chat input to open the file selector</li>
    <li><strong>Fuzzy Search:</strong> Start typing any part of a filename to quickly filter results</li>
    <li><strong>Visual Icons:</strong> Files display with appropriate icons (📄 for files, 📁 for folders)</li>
    <li><strong>Full Paths:</strong> See the complete path to avoid confusion with similarly named files</li>
    <li><strong>Keyboard Navigation:</strong> Use ↑/↓ arrows and Enter to select files quickly</li>
</ul>

<h3>Smart Context Selection:</h3>
<p>CodeBuddy uses intelligent context management to stay within model limits:</p>
<ul>
    <li><strong>Token Budget Aware:</strong> Automatically adjusts context size based on your model's limits (4K for local models, 20K+ for cloud models)</li>
    <li><strong>Priority System:</strong> Your @mentioned files get highest priority, followed by the active file, then auto-gathered context</li>
    <li><strong>Relevance Scoring:</strong> When auto-gathering context, snippets are ranked by relevance to your question</li>
    <li><strong>Smart Extraction:</strong> Extracts function signatures and key code blocks rather than full files when space is limited</li>
</ul>

<h3>Context Sources (in priority order):</h3>
<ol>
    <li><strong>@ Mentioned Files:</strong> Files you explicitly select using @filename</li>
    <li><strong>Active File:</strong> The file currently displayed in your "Active workspace" (auto-included)</li>
    <li><strong>Auto-Gathered:</strong> Relevant code snippets found through codebase search (when asking codebase-related questions)</li>
</ol>

<h3>When to Use @ Mentions:</h3>
<ul>
    <li>When debugging issues that involve specific files</li>
    <li>When asking about implementation details in particular components</li>
    <li>When you want the AI to understand relationships between multiple files</li>
    <li>When seeking code review or optimization for specific files</li>
</ul>

<p>By combining automatic active file context with manual @ mentions, CodeBuddy understands your project deeply and provides highly relevant assistance.</p>
`},{question:"APPLICATION GIVES CONTINUOUS ERROR",answer:"Clear your History."},{question:"DATA PRIVACY",answer:`<p>CodeBuddy is designed with your privacy as a priority:</p>
      <ul>
          <li>All user data and conversations remain within your local VS Code environment</li>
          <li>Your code snippets, queries, and chat history are stored locally in a .codebuddy file (which is automatically gitignored)</li>
          <li>When using cloud AI models (Gemini, Anthropic, OpenAI, etc.), your queries are sent directly to these services using your personal API keys</li>
          <li><strong>Local models (Ollama/LM Studio) keep everything on your machine</strong> - no data leaves your computer</li>
          <li>CodeBuddy itself does not collect, store, or transmit your data to any external servers</li>
          <li>Your API keys are stored securely in your VS Code settings</li>
          <li>The active file context feature sends only what's visible in your "Active workspace" display</li>
          <li>Smart context selection limits what code is sent based on token budgets</li>
      </ul>
      <p>For optimal privacy:</p>
      <ul>
          <li><strong>Use Local models</strong> for sensitive/proprietary code - nothing leaves your machine</li>
          <li>Regularly clear your chat history if working with sensitive code</li>
          <li>Be mindful of what code snippets you share with cloud LLM services</li>
          <li>Review the privacy policies of the specific AI model providers you choose to use</li>
      </ul>
      <p>We're committed to ensuring your code and data remain under your control at all times.</p>`},{question:"CONTRIBUTION",answer:`<p>Codebuddy is an open source project and we appreciate contributions. New ideas from you can transform this extension into a better tool for everyone!</p>
    <ul>
      <li>Visit our <a href="https://github.com/olasunkanmi-SE/codebuddy">GitHub repository</a> to get started</li>
      <li>Check the issues section for open tasks or create a new one</li>
      <li>Fork the repository and submit pull requests with your improvements</li>
      <li>Contribute to documentation, add new features, or fix bugs</li>
      <li>Share your feedback and suggestions through GitHub issues</li>
    </ul>
    <p>Whether you're a developer, designer, or just have great ideas, your contributions help make Codebuddy more powerful and user-friendly. Join our community of contributors today!</p>`},{question:"DISCOVER OUR ENGINEERING BLOG",answer:`<p>🚀 <strong>Dive into our Engineering Blog!</strong></p>
    <p>Curious about what powers CodeBuddy? Our engineering blog takes you behind the scenes with in-depth articles on:</p>
    <ul>
      <li>The comprehensive architecture that makes CodeBuddy possible</li>
      <li>Technical deep-dives into our latest features</li>
      <li>Best practices we've discovered along the way</li>
      <li>Challenges we've overcome and lessons learned</li>
    </ul>
    <p>Whether you're a developer interested in how we built CodeBuddy or just want to understand more about the tool you're using, our blog posts are written to both inform and inspire.</p>
    <p><a href="#">Coming soon</a></p>`},{question:"HOW DO I CONNECT WITH THE FOUNDER",answer:`<p><strong>Oyinlola Olasunkanmi - Creator of CodeBuddy</strong></p>
    
    <p>Olasunkanmi continues to lead CodeBuddy's development, focusing on enhancing its AI capabilities while maintaining its developer-centric approach. His vision is to create a tool that serves as a true coding partner - one that understands your project, anticipates your needs, and respects your privacy.</p>
    
    <p>Connect with Olasunkanmi:</p>
    <ul>
    <li><a href="https://www.linkedin.com/in/oyinlola-olasunkanmi-raymond-71b6b8aa/">LinkedIn</a></li>
      <li><a href="https://github.com/olasunkanmi-SE">GitHub</a></li>
    </ul>`}],te={START:"onStreamStart",END:"onStreamEnd",CHUNK:"onStreamChunk",TOOL_START:"onToolStart",TOOL_END:"onToolEnd",TOOL_PROGRESS:"onToolProgress",PLANNING:"onPlanning",SUMMARIZING:"onSummarizing",THINKING:"onThinking",THINKING_START:"onThinkingStart",THINKING_UPDATE:"onThinkingUpdate",THINKING_END:"onThinkingEnd",ERROR:"onStreamError",METADATA:"streamMetadata",DECISION:"onDecision",READING:"onReading",SEARCHING:"onSearching",REVIEWING:"onReviewing",ANALYZING:"onAnalyzing",EXECUTING:"onExecuting",WORKING:"onWorking",TERMINAL_OUTPUT:"onTerminalOutput"},ZT=(e,t={})=>{const{enableStreaming:r=!0,onLegacyMessage:i}=t,[n,s]=M.useState([]),[o,a]=M.useState(null),[l,c]=M.useState(!1),[d,u]=M.useState([]),[p,f]=M.useState(null),g=M.useRef(null),x=M.useMemo(()=>{const T=o?[...n,o]:n;if(T.length===0)return T;const L=T.length-1;return T.map(($,N)=>N===L&&$.type==="bot"&&d.length>0?{...$,activities:d}:($.type==="bot"&&$.activities&&$.activities.length>0,$))},[n,o,d]),v=M.useCallback(T=>{const L={...T,id:`msg-${Date.now()}-${Math.random()}`,timestamp:Date.now()};return s($=>[...$,L]),L},[]),y=M.useCallback(()=>{s([]),a(null),u([]),g.current=null},[]),b=M.useCallback(T=>{if(console.log("Stream start payload:",T),!r)return;const L=`temp-${T.requestId||Date.now()}`;g.current=T.requestId,c(!1),u([]),f(null),a({id:L,type:"bot",content:"",isStreaming:!0,timestamp:Date.now(),language:T.language||"Typescript",alias:T.alias||"O"})},[r]),w=M.useCallback(T=>{r&&T.requestId===g.current&&a(L=>{if(!L)return null;const $=T.accumulated??L.content+T.content;return{...L,content:$}})},[r]),S=M.useCallback(T=>{r&&T.requestId===g.current&&(a(L=>{if(!L)return null;const $=T.content??L.content,N={...L,id:`bot-${Date.now()}`,isStreaming:!1,content:$,activities:[...d]};return s(G=>[...G,N]),null}),setTimeout(()=>{u([])},2e3),g.current=null)},[r,d]),_=M.useCallback(T=>{if(!r||T.requestId!==g.current)return;u($=>$.map(N=>N.status==="active"?{...N,status:"failed"}:N));const L=T.error||"An error occurred during streaming";a($=>{const N={id:`error-${Date.now()}`,type:"bot",isStreaming:!1,content:L,timestamp:Date.now(),language:$?.language||"text",alias:$?.alias||"O"};return s(G=>[...G,N]),null}),setTimeout(()=>{u([])},3e3),g.current=null,c(!1)},[r]),A=M.useCallback(T=>{const $=(Y=>{if(!Y||typeof Y!="object")return null;if(typeof Y.command=="string")return`command: ${Y.command.length>120?`${Y.command.slice(0,117)}...`:Y.command}`;const F=Object.entries(Y).slice(0,2);if(F.length===0)return null;const J=F.map(([it,pt])=>{const Dt=typeof pt=="string"?pt:JSON.stringify(pt),Zt=Dt.length>60?`${Dt.slice(0,57)}...`:Dt;return`${it}=${Zt}`}),W=Object.keys(Y).length>2?", …":"";return J.join(", ")+W})(T.args),N=T.description||`Running ${T.toolName||"tool"}`,G=$?`${N} (${$})`:N,Q={id:T.toolId||`activity-${Date.now()}`,type:"tool_start",toolName:T.toolName,description:G,status:"active",timestamp:Date.now()};u(Y=>[...Y,Q])},[]),C=M.useCallback(T=>{u(L=>L.map($=>($.toolName===T.toolName||$.id===T.toolId)&&$.status==="active"?{...$,status:T.status==="failed"?"failed":"completed",result:T.result,duration:T.duration}:$))},[]),E=M.useCallback(T=>{u(L=>L.map($=>$.toolName===T.toolName&&$.status==="active"?{...$,description:T.message||$.description}:$))},[]),P=M.useCallback(T=>{const L={id:`planning-${Date.now()}`,type:"planning",toolName:"planning",description:T.content||"Analyzing your request...",status:"active",timestamp:Date.now()};u($=>[...$.filter(G=>G.type!=="planning"),L]),setTimeout(()=>{u($=>$.map(N=>N.type==="planning"&&N.status==="active"?{...N,status:"completed"}:N))},1500)},[]),z=M.useCallback(T=>{const L={id:`summarizing-${Date.now()}`,type:"summarizing",toolName:"summarizing",description:T.content||"Preparing response...",status:"active",timestamp:Date.now()};u($=>[...$,L]),setTimeout(()=>{u($=>$.map(N=>N.type==="summarizing"&&N.status==="active"?{...N,status:"completed"}:N))},1e3)},[]),D=M.useCallback(T=>{if(T?.status)switch(T.status){case"interrupt_waiting":const L=T.description||(T.toolName?`Preparing to run ${T.toolName}`:"Preparing to run tool");f({toolName:T.toolName,description:L});break;case"interrupt_approved":f(null);break}},[]),V=M.useCallback((T,L,$="active")=>{if(T==="working"){u(G=>{const Q=G[G.length-1];return Q&&Q.type==="working"&&Q.description===L.content?G:[...G,{id:L.id||`activity-${Date.now()}`,type:T,description:L.content||"Working...",status:$,timestamp:Date.now()}]});return}const N={id:L.id||`activity-${Date.now()}`,type:T,description:L.content||`Agent is ${T}...`,status:$,timestamp:Date.now()};u(G=>[...G,N])},[]),H=M.useCallback(T=>{u(L=>{const $=L.findLastIndex(N=>N.status==="active"&&(N.type==="executing"||N.toolName==="run_command"||N.toolName==="command"));if($!==-1){const N=[...L],G=N[$];return N[$]={...G,terminalOutput:(G.terminalOutput||"")+T.content},N}return L})},[]),O=M.useCallback(T=>{const L={id:`bot-${Date.now()}`,type:"bot",content:T.message||T.content||"",language:T.language||"Typescript",alias:T.alias||"O",isStreaming:!1,timestamp:Date.now()};s($=>[...$,L]),c(!1),i&&i([L])},[i]),R=M.useCallback((T,L)=>{const $={id:`user-${Date.now()}`,type:"user",content:T,timestamp:Date.now(),alias:L?.alias||"O",...L};s(N=>[...N,$]),c(!0),e.postMessage({command:"user-input",message:T,metaData:L})},[e]);return M.useEffect(()=>{const T=L=>{console.log("[useStreamingChat] Received message event:",L.data);const $=L.data,{command:N,type:G}=$,Q=N||G;switch(console.log("[useStreamingChat] Processing messageType:",Q),Q){case te.START:console.log("[useStreamingChat] STREAM_START:",$.payload),b($.payload);break;case te.CHUNK:w($.payload);break;case te.END:console.log("[useStreamingChat] STREAM_END:",$.payload),S($.payload);break;case te.ERROR:console.log("[useStreamingChat] STREAM_ERROR:",$.payload),_($.payload);break;case te.TOOL_START:console.log("[useStreamingChat] TOOL_START:",$.payload),A($.payload);break;case te.TOOL_END:console.log("[useStreamingChat] TOOL_END:",$.payload),C($.payload);break;case te.TOOL_PROGRESS:E($.payload);break;case te.PLANNING:console.log("[useStreamingChat] PLANNING:",$.payload),P($.payload);break;case te.SUMMARIZING:console.log("[useStreamingChat] SUMMARIZING:",$.payload),z($.payload);break;case te.THINKING:console.log("[useStreamingChat] THINKING:",$.payload),V("thinking",$.payload);break;case te.THINKING_START:console.log("[useStreamingChat] THINKING_START:",$.payload),V("thinking",$.payload,"active");break;case te.THINKING_UPDATE:console.log("[useStreamingChat] THINKING_UPDATE:",$.payload),u(Y=>{const F=Y.findLastIndex(W=>W.type==="thinking");if(F===-1)return Y;const J=[...Y];return J[F]={...J[F],description:$.payload.content||J[F].description},J});break;case te.THINKING_END:console.log("[useStreamingChat] THINKING_END:",$.payload),u(Y=>Y.map(F=>F.type==="thinking"&&F.status==="active"?{...F,status:"completed"}:F));break;case te.METADATA:console.log("[useStreamingChat] METADATA:",$.payload),D($.payload);break;case te.DECISION:console.log("[useStreamingChat] DECISION:",$.payload),V("decision",$.payload);break;case te.READING:console.log("[useStreamingChat] READING:",$.payload),V("reading",$.payload);break;case te.SEARCHING:console.log("[useStreamingChat] SEARCHING:",$.payload),V("searching",$.payload);break;case te.REVIEWING:console.log("[useStreamingChat] REVIEWING:",$.payload),V("reviewing",$.payload);break;case te.ANALYZING:V("analyzing",$.payload);break;case te.EXECUTING:V("executing",$.payload);break;case te.WORKING:V("working",$.payload);break;case te.TERMINAL_OUTPUT:H($.payload);break;case"bot-response":(!r||!g.current)&&O($);break}};return window.addEventListener("message",T),()=>{window.removeEventListener("message",T)}},[r,b,w,S,_,A,C,E,P,z,D,V,H,O]),{messages:x,activities:d,isStreaming:!!o,isLoading:l||!!o,sendMessage:R,addMessage:v,clearMessages:y,setMessages:s,pendingApproval:p}};function gi(e){return`
/* Skeleton Loader Styles */
.skeleton-loader-container {
  background: ${e.background};
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  border: 1px solid ${e.border};
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
    ${e.lineBackground} 0%,
    ${e.lineHighlight} 50%,
    ${e.lineBackground} 100%
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
  background: ${e.background};
  border-radius: 12px;
  padding: 20px;
  margin: 12px 0;
  border: 1px solid ${e.border};
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
  border-top: 1px solid ${e.border};
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
}`}const mi={tokyoNight:{background:"var(--vscode-editor-background, #1a1b26)",border:"var(--vscode-widget-border, #414868)",lineBackground:"var(--vscode-editor-background, #1a1b26)",lineHighlight:"var(--vscode-input-background, #24283b)"},atomOneDark:{background:"var(--vscode-editor-background, #282c34)",border:"var(--vscode-widget-border, #3e4451)",lineBackground:"var(--vscode-editor-background, #282c34)",lineHighlight:"var(--vscode-input-background, #3e4451)"},nightOwl:{background:"var(--vscode-editor-background, #011627)",border:"var(--vscode-widget-border, #1d3b53)",lineBackground:"var(--vscode-editor-background, #011627)",lineHighlight:"var(--vscode-input-background, #1d3b53)"},githubDark:{background:"var(--vscode-editor-background, #0d1117)",border:"var(--vscode-widget-border, #30363d)",lineBackground:"var(--vscode-editor-background, #0d1117)",lineHighlight:"var(--vscode-input-background, #21262d)"},codePen:{background:"var(--vscode-editor-background, #1e1e1e)",border:"var(--vscode-widget-border, #333)",lineBackground:"var(--vscode-editor-background, #1e1e1e)",lineHighlight:"var(--vscode-input-background, #333)"},felipec:{background:"var(--vscode-editor-background, #1e1e22)",border:"var(--vscode-widget-border, #333)",lineBackground:"var(--vscode-editor-background, #1e1e22)",lineHighlight:"var(--vscode-input-background, #333)"},irBlack:{background:"var(--vscode-editor-background, #000)",border:"var(--vscode-widget-border, #333)",lineBackground:"var(--vscode-editor-background, #000)",lineHighlight:"var(--vscode-input-background, #333)"},stackoverflow:{background:"var(--vscode-editor-background, #1c1c1c)",border:"var(--vscode-widget-border, #333)",lineBackground:"var(--vscode-editor-background, #1c1c1c)",lineHighlight:"var(--vscode-input-background, #333)"}},JT=`/*

Atom One Dark by Daniel Gamage
Original One Dark Syntax theme from https://github.com/atom/one-dark-syntax

base:    #282c34
mono-1:  #abb2bf
mono-2:  #818896
mono-3:  #5c6370
hue-1:   #56b6c2
hue-2:   #61aeee
hue-3:   #c678dd
hue-4:   #98c379
hue-5:   #e06c75
hue-5-2: #be5046
hue-6:   #d19a66
hue-6-2: #e6c07b

*/

.hljs {
  color: #abb2bf;
  background: transparent;
}

.hljs-comment,
.hljs-quote {
  color: #5c6370;
  font-style: italic;
}

.hljs-doctag,
.hljs-keyword,
.hljs-formula {
  color: #c678dd;
}

.hljs-section,
.hljs-name,
.hljs-selector-tag,
.hljs-deletion,
.hljs-subst {
  color: #e06c75;
}

.hljs-literal {
  color: #56b6c2;
}

.hljs-string,
.hljs-regexp,
.hljs-addition,
.hljs-attribute,
.hljs-meta .hljs-string {
  color: #98c379;
}

.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-type,
.hljs-selector-class,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-number {
  color: #d19a66;
}

.hljs-symbol,
.hljs-bullet,
.hljs-link,
.hljs-meta,
.hljs-selector-id,
.hljs-title {
  color: #61aeee;
}

.hljs-built_in,
.hljs-title.class_,
.hljs-class .hljs-title {
  color: #e6c07b;
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

${gi(mi.atomOneDark)}`,KT=`
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

${gi(mi.atomOneDark)}`,t$=`/*
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

${gi(mi.codePen)}`,e$=`/*!
 * Theme: FelipeC
 * Author: (c) 2021 Felipe Contreras <felipe.contreras@gmail.com>
 * Website: https://github.com/felipec/vim-felipec
 *
 * Autogenerated with vim-felipec's generator.
*/

.hljs {
  color: #dddde1;
  background: transparent;
}

.hljs::selection,
.hljs ::selection {
  color: #1e1e22;
  background: #bf8fef;
}

.hljs-comment,
.hljs-code,
.hljs-quote {
  color: #888896;
}

.hljs-number,
.hljs-literal,
.hljs-deletion {
  color: #ef8f8f;
}

.hljs-punctuation,
.hljs-meta,
.hljs-operator,
.hljs-subst,
.hljs-doctag,
.hljs-template-variable,
.hljs-selector-attr {
  color: #efbf8f;
}

.hljs-type {
  color: #efef8f;
}

.hljs-tag,
.hljs-title,
.hljs-selector-class,
.hljs-selector-id {
  color: #bfef8f;
}

.hljs-string,
.hljs-regexp,
.hljs-addition {
  color: #8fef8f;
}

.hljs-class,
.hljs-property {
  color: #8fefbf;
}

.hljs-name,
.hljs-selector-tag {
  color: #8fefef;
}

.hljs-keyword,
.hljs-built_in {
  color: #8fbfef;
}

.hljs-section,
.hljs-bullet {
  color: #8f8fef;
}

.hljs-selector-pseudo {
  color: #bf8fef;
}

.hljs-variable,
.hljs-params,
.hljs-attr,
.hljs-attribute {
  color: #ef8fef;
}

.hljs-symbol,
.hljs-link {
  color: #ef8fbf;
}

.hljs-strong,
.hljs-literal,
.hljs-title {
  font-weight: bold;
}

.hljs-emphasis {
  font-style: italic;
}

${gi(mi.felipec)}`,r$=`/*!
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

${gi(mi.githubDark)}`,i$=`/*
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

${gi(mi.irBlack)}`,n$=`/*

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

${gi(mi.nightOwl)}`,s$=`/*!
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

${gi(mi.stackoverflow)}`,o$=`/*!
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

${gi(mi.tokyoNight)}`;function a$(e){let t="";switch(e){case"Atom One Dark":t=JT;break;case"Atom One Dark Reasonable":t=KT;break;case"Code Pen":t=t$;break;case"felipec":t=e$;break;case"github dark":t=r$;break;case"ir black":t=i$;break;case"night owl":t=n$;break;case"stackoverflow":t=s$;break;case"tokyo night":t=o$;break}return`${t}`}const l$=e=>{const t="dynamic-chat-css",r=document.createElement("style");r.id=t,r.innerHTML=e,document.head.appendChild(r)};function c$(e){const t=document.createElement("textarea");return t.innerHTML=e,t.value}const h$=(e,t)=>{!e||t?.length<=0||document.querySelectorAll("pre code:not(.hljs-done):not(.mermaid-processed)").forEach(r=>{let i=null;const n=Array.from(r.classList).find(s=>s.startsWith("language-"));if(n&&(i=n.substring(9)),i==="mermaid"){r.classList.add("mermaid-processed");return}try{const s=c$(r.textContent??""),o=i??e.highlightAuto(s).language;if(o!=null){const a=e.highlight(s,{language:o}).value;r.setHTMLUnsafe(a),r.classList.add("hljs-done");const l=document.createElement("button");l.innerHTML="Copy",l.classList.add("copy-button"),l.setAttribute("aria-label","Copy code to clipboard"),l.addEventListener("click",()=>{try{navigator.clipboard.writeText(r.textContent??""),l.textContent="Copied!",setTimeout(()=>{l.textContent="Copy"},2e3)}catch(d){console.error("Failed to copy text: ",d),l.textContent="Error"}});const c=r.closest("pre");if(c&&!c.querySelector(".code-block-wrapper")){const d=document.createElement("div");d.classList.add("code-block-wrapper"),d.style.position="relative",d.style.marginBottom="1rem";const u=document.createElement("div");u.classList.add("individual-code-header"),u.style.display="flex",u.style.justifyContent="space-between",u.style.alignItems="center",u.style.padding="0.5rem 1rem",u.style.backgroundColor="var(--vscode-editor-background)",u.style.borderBottom="1px solid var(--vscode-panel-border)",u.style.fontSize="0.875rem";const p=document.createElement("span");p.textContent=o||"code",p.style.color="var(--vscode-editor-foreground)",p.style.opacity="0.8",l.style.position="static",l.style.margin="0",u.appendChild(p),u.appendChild(l),c.parentNode?.insertBefore(d,c),d.appendChild(u),d.appendChild(c)}}}catch(s){console.error("Highlighting failed:",s),r.classList.add("hljs-error")}})},d$=k.div`
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
`,u$=k.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`,pb=k.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 16px 0;
  text-align: left;
  font-weight: 500;
  background-color: transparent;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  transition: color 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.95);
  }
`,p$=k.span`
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.2s ease;

  ${pb}:hover & {
    color: rgba(255, 255, 255, 0.6);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`,f$=k.div`
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
  max-height: ${e=>e.$isOpen?"5000px":"0"};
  opacity: ${e=>e.$isOpen?"1":"0"};
  padding: ${e=>e.$isOpen?"0 0 16px 0":"0"};
`,g$=k.div`
  font-size: 12px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.6);
  text-align: left;
  
  p {
    margin: 0 0 12px 0;
    text-align: left;
  }

  p:last-child {
    margin-bottom: 0;
  }

  h3 {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    margin: 16px 0 10px 0;
  }

  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  li {
    margin: 6px 0;
    color: rgba(255, 255, 255, 0.55);
  }

  strong {
    color: rgba(255, 255, 255, 0.75);
    font-weight: 500;
  }

  a {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;

    &:hover {
      color: rgba(255, 255, 255, 0.9);
      border-bottom-color: rgba(255, 255, 255, 0.5);
    }
  }

  code {
    background: rgba(255, 255, 255, 0.04);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-family: 'Consolas', 'Monaco', monospace;
  }
`,m$=({items:e,questionClassName:t="",answerClassName:r="",containerClassName:i="",itemClassName:n=""})=>{const[s,o]=M.useState(null),a=l=>{o(s===l?null:l)};return h.jsx(d$,{className:i,children:h.jsx("div",{children:e.map((l,c)=>h.jsxs(u$,{className:n,children:[h.jsxs(pb,{className:t,onClick:()=>a(c),"aria-expanded":s===c,"aria-controls":`answer-${c}`,children:[l.question,h.jsx(p$,{children:s===c?h.jsx("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:h.jsx("path",{d:"M5 12H19",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round"})}):h.jsx("svg",{width:"24",height:"24",viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:h.jsx("path",{d:"M12 5V19M5 12H19",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round"})})})]}),h.jsx(f$,{id:`answer-${c}`,$isOpen:s===c,className:r,children:h.jsx(g$,{children:Mr.isValidElement(l.answer)?l.answer:h.jsx("div",{dangerouslySetInnerHTML:{__html:l.answer}})})})]},c))})})};/*! @license DOMPurify 3.3.1 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.3.1/LICENSE */const{entries:fb,setPrototypeOf:Eg,isFrozen:x$,getPrototypeOf:b$,getOwnPropertyDescriptor:y$}=Object;let{freeze:We,seal:yr,create:Dd}=Object,{apply:Fd,construct:Pd}=typeof Reflect<"u"&&Reflect;We||(We=function(t){return t});yr||(yr=function(t){return t});Fd||(Fd=function(t,r){for(var i=arguments.length,n=new Array(i>2?i-2:0),s=2;s<i;s++)n[s-2]=arguments[s];return t.apply(r,n)});Pd||(Pd=function(t){for(var r=arguments.length,i=new Array(r>1?r-1:0),n=1;n<r;n++)i[n-1]=arguments[n];return new t(...i)});const ja=Ve(Array.prototype.forEach),v$=Ve(Array.prototype.lastIndexOf),Lg=Ve(Array.prototype.pop),Ys=Ve(Array.prototype.push),w$=Ve(Array.prototype.splice),el=Ve(String.prototype.toLowerCase),wh=Ve(String.prototype.toString),kh=Ve(String.prototype.match),Xs=Ve(String.prototype.replace),k$=Ve(String.prototype.indexOf),C$=Ve(String.prototype.trim),Sr=Ve(Object.prototype.hasOwnProperty),Oe=Ve(RegExp.prototype.test),Qs=S$(TypeError);function Ve(e){return function(t){t instanceof RegExp&&(t.lastIndex=0);for(var r=arguments.length,i=new Array(r>1?r-1:0),n=1;n<r;n++)i[n-1]=arguments[n];return Fd(e,t,i)}}function S$(e){return function(){for(var t=arguments.length,r=new Array(t),i=0;i<t;i++)r[i]=arguments[i];return Pd(e,r)}}function Tt(e,t){let r=arguments.length>2&&arguments[2]!==void 0?arguments[2]:el;Eg&&Eg(e,null);let i=t.length;for(;i--;){let n=t[i];if(typeof n=="string"){const s=r(n);s!==n&&(x$(t)||(t[i]=s),n=s)}e[n]=!0}return e}function _$(e){for(let t=0;t<e.length;t++)Sr(e,t)||(e[t]=null);return e}function zr(e){const t=Dd(null);for(const[r,i]of fb(e))Sr(e,r)&&(Array.isArray(i)?t[r]=_$(i):i&&typeof i=="object"&&i.constructor===Object?t[r]=zr(i):t[r]=i);return t}function Zs(e,t){for(;e!==null;){const i=y$(e,t);if(i){if(i.get)return Ve(i.get);if(typeof i.value=="function")return Ve(i.value)}e=b$(e)}function r(){return null}return r}const Bg=We(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","search","section","select","shadow","slot","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),Ch=We(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","enterkeyhint","exportparts","filter","font","g","glyph","glyphref","hkern","image","inputmode","line","lineargradient","marker","mask","metadata","mpath","part","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),Sh=We(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),T$=We(["animate","color-profile","cursor","discard","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),_h=We(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover","mprescripts"]),$$=We(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),Mg=We(["#text"]),Ig=We(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","exportparts","face","for","headers","height","hidden","high","href","hreflang","id","inert","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","part","pattern","placeholder","playsinline","popover","popovertarget","popovertargetaction","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","slot","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","wrap","xmlns","slot"]),Th=We(["accent-height","accumulate","additive","alignment-baseline","amplitude","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dur","edgemode","elevation","end","exponent","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","intercept","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","mask-type","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","slope","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","tablevalues","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-rendering","textlength","type","u1","u2","unicode","values","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),Og=We(["accent","accentunder","align","bevelled","close","columnsalign","columnlines","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lspace","lquote","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),Ea=We(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),A$=yr(/\{\{[\w\W]*|[\w\W]*\}\}/gm),j$=yr(/<%[\w\W]*|[\w\W]*%>/gm),E$=yr(/\$\{[\w\W]*/gm),L$=yr(/^data-[\-\w.\u00B7-\uFFFF]+$/),B$=yr(/^aria-[\-\w]+$/),gb=yr(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),M$=yr(/^(?:\w+script|data):/i),I$=yr(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),mb=yr(/^html$/i),O$=yr(/^[a-z][.\w]*(-[.\w]+)+$/i);var Rg=Object.freeze({__proto__:null,ARIA_ATTR:B$,ATTR_WHITESPACE:I$,CUSTOM_ELEMENT:O$,DATA_ATTR:L$,DOCTYPE_NAME:mb,ERB_EXPR:j$,IS_ALLOWED_URI:gb,IS_SCRIPT_OR_DATA:M$,MUSTACHE_EXPR:A$,TMPLIT_EXPR:E$});const Js={element:1,attribute:2,text:3,cdataSection:4,entityReference:5,entityNode:6,progressingInstruction:7,comment:8,document:9,documentType:10,documentFragment:11,notation:12},R$=function(){return typeof window>"u"?null:window},D$=function(t,r){if(typeof t!="object"||typeof t.createPolicy!="function")return null;let i=null;const n="data-tt-policy-suffix";r&&r.hasAttribute(n)&&(i=r.getAttribute(n));const s="dompurify"+(i?"#"+i:"");try{return t.createPolicy(s,{createHTML(o){return o},createScriptURL(o){return o}})}catch{return console.warn("TrustedTypes policy "+s+" could not be created."),null}},Dg=function(){return{afterSanitizeAttributes:[],afterSanitizeElements:[],afterSanitizeShadowDOM:[],beforeSanitizeAttributes:[],beforeSanitizeElements:[],beforeSanitizeShadowDOM:[],uponSanitizeAttribute:[],uponSanitizeElement:[],uponSanitizeShadowNode:[]}};function xb(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:R$();const t=dt=>xb(dt);if(t.version="3.3.1",t.removed=[],!e||!e.document||e.document.nodeType!==Js.document||!e.Element)return t.isSupported=!1,t;let{document:r}=e;const i=r,n=i.currentScript,{DocumentFragment:s,HTMLTemplateElement:o,Node:a,Element:l,NodeFilter:c,NamedNodeMap:d=e.NamedNodeMap||e.MozNamedAttrMap,HTMLFormElement:u,DOMParser:p,trustedTypes:f}=e,g=l.prototype,x=Zs(g,"cloneNode"),v=Zs(g,"remove"),y=Zs(g,"nextSibling"),b=Zs(g,"childNodes"),w=Zs(g,"parentNode");if(typeof o=="function"){const dt=r.createElement("template");dt.content&&dt.content.ownerDocument&&(r=dt.content.ownerDocument)}let S,_="";const{implementation:A,createNodeIterator:C,createDocumentFragment:E,getElementsByTagName:P}=r,{importNode:z}=i;let D=Dg();t.isSupported=typeof fb=="function"&&typeof w=="function"&&A&&A.createHTMLDocument!==void 0;const{MUSTACHE_EXPR:V,ERB_EXPR:H,TMPLIT_EXPR:O,DATA_ATTR:R,ARIA_ATTR:T,IS_SCRIPT_OR_DATA:L,ATTR_WHITESPACE:$,CUSTOM_ELEMENT:N}=Rg;let{IS_ALLOWED_URI:G}=Rg,Q=null;const Y=Tt({},[...Bg,...Ch,...Sh,..._h,...Mg]);let F=null;const J=Tt({},[...Ig,...Th,...Og,...Ea]);let W=Object.seal(Dd(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),it=null,pt=null;const Dt=Object.seal(Dd(null,{tagCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeCheck:{writable:!0,configurable:!1,enumerable:!0,value:null}}));let Zt=!0,Wt=!0,ge=!1,le=!0,rr=!1,$n=!0,Zr=!1,Fs=!1,Ps=!1,bi=!1,An=!1,jn=!1,K=!0,St=!1;const Ie="user-content-";let Ft=!0,Ni=!1,ir={},Fr=null;const Yc=Tt({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","style","svg","template","thead","title","video","xmp"]);let ff=null;const gf=Tt({},["audio","video","img","source","image","track"]);let Xc=null;const mf=Tt({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),ga="http://www.w3.org/1998/Math/MathML",ma="http://www.w3.org/2000/svg",Jr="http://www.w3.org/1999/xhtml";let En=Jr,Qc=!1,Zc=null;const Wk=Tt({},[ga,ma,Jr],wh);let xa=Tt({},["mi","mo","mn","ms","mtext"]),ba=Tt({},["annotation-xml"]);const Vk=Tt({},["title","style","font","a","script"]);let Ns=null;const Uk=["application/xhtml+xml","text/html"],Gk="text/html";let ce=null,Ln=null;const Yk=r.createElement("form"),xf=function(j){return j instanceof RegExp||j instanceof Function},Jc=function(){let j=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};if(!(Ln&&Ln===j)){if((!j||typeof j!="object")&&(j={}),j=zr(j),Ns=Uk.indexOf(j.PARSER_MEDIA_TYPE)===-1?Gk:j.PARSER_MEDIA_TYPE,ce=Ns==="application/xhtml+xml"?wh:el,Q=Sr(j,"ALLOWED_TAGS")?Tt({},j.ALLOWED_TAGS,ce):Y,F=Sr(j,"ALLOWED_ATTR")?Tt({},j.ALLOWED_ATTR,ce):J,Zc=Sr(j,"ALLOWED_NAMESPACES")?Tt({},j.ALLOWED_NAMESPACES,wh):Wk,Xc=Sr(j,"ADD_URI_SAFE_ATTR")?Tt(zr(mf),j.ADD_URI_SAFE_ATTR,ce):mf,ff=Sr(j,"ADD_DATA_URI_TAGS")?Tt(zr(gf),j.ADD_DATA_URI_TAGS,ce):gf,Fr=Sr(j,"FORBID_CONTENTS")?Tt({},j.FORBID_CONTENTS,ce):Yc,it=Sr(j,"FORBID_TAGS")?Tt({},j.FORBID_TAGS,ce):zr({}),pt=Sr(j,"FORBID_ATTR")?Tt({},j.FORBID_ATTR,ce):zr({}),ir=Sr(j,"USE_PROFILES")?j.USE_PROFILES:!1,Zt=j.ALLOW_ARIA_ATTR!==!1,Wt=j.ALLOW_DATA_ATTR!==!1,ge=j.ALLOW_UNKNOWN_PROTOCOLS||!1,le=j.ALLOW_SELF_CLOSE_IN_ATTR!==!1,rr=j.SAFE_FOR_TEMPLATES||!1,$n=j.SAFE_FOR_XML!==!1,Zr=j.WHOLE_DOCUMENT||!1,bi=j.RETURN_DOM||!1,An=j.RETURN_DOM_FRAGMENT||!1,jn=j.RETURN_TRUSTED_TYPE||!1,Ps=j.FORCE_BODY||!1,K=j.SANITIZE_DOM!==!1,St=j.SANITIZE_NAMED_PROPS||!1,Ft=j.KEEP_CONTENT!==!1,Ni=j.IN_PLACE||!1,G=j.ALLOWED_URI_REGEXP||gb,En=j.NAMESPACE||Jr,xa=j.MATHML_TEXT_INTEGRATION_POINTS||xa,ba=j.HTML_INTEGRATION_POINTS||ba,W=j.CUSTOM_ELEMENT_HANDLING||{},j.CUSTOM_ELEMENT_HANDLING&&xf(j.CUSTOM_ELEMENT_HANDLING.tagNameCheck)&&(W.tagNameCheck=j.CUSTOM_ELEMENT_HANDLING.tagNameCheck),j.CUSTOM_ELEMENT_HANDLING&&xf(j.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)&&(W.attributeNameCheck=j.CUSTOM_ELEMENT_HANDLING.attributeNameCheck),j.CUSTOM_ELEMENT_HANDLING&&typeof j.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements=="boolean"&&(W.allowCustomizedBuiltInElements=j.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements),rr&&(Wt=!1),An&&(bi=!0),ir&&(Q=Tt({},Mg),F=[],ir.html===!0&&(Tt(Q,Bg),Tt(F,Ig)),ir.svg===!0&&(Tt(Q,Ch),Tt(F,Th),Tt(F,Ea)),ir.svgFilters===!0&&(Tt(Q,Sh),Tt(F,Th),Tt(F,Ea)),ir.mathMl===!0&&(Tt(Q,_h),Tt(F,Og),Tt(F,Ea))),j.ADD_TAGS&&(typeof j.ADD_TAGS=="function"?Dt.tagCheck=j.ADD_TAGS:(Q===Y&&(Q=zr(Q)),Tt(Q,j.ADD_TAGS,ce))),j.ADD_ATTR&&(typeof j.ADD_ATTR=="function"?Dt.attributeCheck=j.ADD_ATTR:(F===J&&(F=zr(F)),Tt(F,j.ADD_ATTR,ce))),j.ADD_URI_SAFE_ATTR&&Tt(Xc,j.ADD_URI_SAFE_ATTR,ce),j.FORBID_CONTENTS&&(Fr===Yc&&(Fr=zr(Fr)),Tt(Fr,j.FORBID_CONTENTS,ce)),j.ADD_FORBID_CONTENTS&&(Fr===Yc&&(Fr=zr(Fr)),Tt(Fr,j.ADD_FORBID_CONTENTS,ce)),Ft&&(Q["#text"]=!0),Zr&&Tt(Q,["html","head","body"]),Q.table&&(Tt(Q,["tbody"]),delete it.tbody),j.TRUSTED_TYPES_POLICY){if(typeof j.TRUSTED_TYPES_POLICY.createHTML!="function")throw Qs('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');if(typeof j.TRUSTED_TYPES_POLICY.createScriptURL!="function")throw Qs('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');S=j.TRUSTED_TYPES_POLICY,_=S.createHTML("")}else S===void 0&&(S=D$(f,n)),S!==null&&typeof _=="string"&&(_=S.createHTML(""));We&&We(j),Ln=j}},bf=Tt({},[...Ch,...Sh,...T$]),yf=Tt({},[..._h,...$$]),Xk=function(j){let X=w(j);(!X||!X.tagName)&&(X={namespaceURI:En,tagName:"template"});const ct=el(j.tagName),Gt=el(X.tagName);return Zc[j.namespaceURI]?j.namespaceURI===ma?X.namespaceURI===Jr?ct==="svg":X.namespaceURI===ga?ct==="svg"&&(Gt==="annotation-xml"||xa[Gt]):!!bf[ct]:j.namespaceURI===ga?X.namespaceURI===Jr?ct==="math":X.namespaceURI===ma?ct==="math"&&ba[Gt]:!!yf[ct]:j.namespaceURI===Jr?X.namespaceURI===ma&&!ba[Gt]||X.namespaceURI===ga&&!xa[Gt]?!1:!yf[ct]&&(Vk[ct]||!bf[ct]):!!(Ns==="application/xhtml+xml"&&Zc[j.namespaceURI]):!1},Pr=function(j){Ys(t.removed,{element:j});try{w(j).removeChild(j)}catch{v(j)}},zi=function(j,X){try{Ys(t.removed,{attribute:X.getAttributeNode(j),from:X})}catch{Ys(t.removed,{attribute:null,from:X})}if(X.removeAttribute(j),j==="is")if(bi||An)try{Pr(X)}catch{}else try{X.setAttribute(j,"")}catch{}},vf=function(j){let X=null,ct=null;if(Ps)j="<remove></remove>"+j;else{const se=kh(j,/^[\r\n\t ]+/);ct=se&&se[0]}Ns==="application/xhtml+xml"&&En===Jr&&(j='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+j+"</body></html>");const Gt=S?S.createHTML(j):j;if(En===Jr)try{X=new p().parseFromString(Gt,Ns)}catch{}if(!X||!X.documentElement){X=A.createDocument(En,"template",null);try{X.documentElement.innerHTML=Qc?_:Gt}catch{}}const we=X.body||X.documentElement;return j&&ct&&we.insertBefore(r.createTextNode(ct),we.childNodes[0]||null),En===Jr?P.call(X,Zr?"html":"body")[0]:Zr?X.documentElement:we},wf=function(j){return C.call(j.ownerDocument||j,j,c.SHOW_ELEMENT|c.SHOW_COMMENT|c.SHOW_TEXT|c.SHOW_PROCESSING_INSTRUCTION|c.SHOW_CDATA_SECTION,null)},Kc=function(j){return j instanceof u&&(typeof j.nodeName!="string"||typeof j.textContent!="string"||typeof j.removeChild!="function"||!(j.attributes instanceof d)||typeof j.removeAttribute!="function"||typeof j.setAttribute!="function"||typeof j.namespaceURI!="string"||typeof j.insertBefore!="function"||typeof j.hasChildNodes!="function")},kf=function(j){return typeof a=="function"&&j instanceof a};function Kr(dt,j,X){ja(dt,ct=>{ct.call(t,j,X,Ln)})}const Cf=function(j){let X=null;if(Kr(D.beforeSanitizeElements,j,null),Kc(j))return Pr(j),!0;const ct=ce(j.nodeName);if(Kr(D.uponSanitizeElement,j,{tagName:ct,allowedTags:Q}),$n&&j.hasChildNodes()&&!kf(j.firstElementChild)&&Oe(/<[/\w!]/g,j.innerHTML)&&Oe(/<[/\w!]/g,j.textContent)||j.nodeType===Js.progressingInstruction||$n&&j.nodeType===Js.comment&&Oe(/<[/\w]/g,j.data))return Pr(j),!0;if(!(Dt.tagCheck instanceof Function&&Dt.tagCheck(ct))&&(!Q[ct]||it[ct])){if(!it[ct]&&_f(ct)&&(W.tagNameCheck instanceof RegExp&&Oe(W.tagNameCheck,ct)||W.tagNameCheck instanceof Function&&W.tagNameCheck(ct)))return!1;if(Ft&&!Fr[ct]){const Gt=w(j)||j.parentNode,we=b(j)||j.childNodes;if(we&&Gt){const se=we.length;for(let Ge=se-1;Ge>=0;--Ge){const ti=x(we[Ge],!0);ti.__removalCount=(j.__removalCount||0)+1,Gt.insertBefore(ti,y(j))}}}return Pr(j),!0}return j instanceof l&&!Xk(j)||(ct==="noscript"||ct==="noembed"||ct==="noframes")&&Oe(/<\/no(script|embed|frames)/i,j.innerHTML)?(Pr(j),!0):(rr&&j.nodeType===Js.text&&(X=j.textContent,ja([V,H,O],Gt=>{X=Xs(X,Gt," ")}),j.textContent!==X&&(Ys(t.removed,{element:j.cloneNode()}),j.textContent=X)),Kr(D.afterSanitizeElements,j,null),!1)},Sf=function(j,X,ct){if(K&&(X==="id"||X==="name")&&(ct in r||ct in Yk))return!1;if(!(Wt&&!pt[X]&&Oe(R,X))){if(!(Zt&&Oe(T,X))){if(!(Dt.attributeCheck instanceof Function&&Dt.attributeCheck(X,j))){if(!F[X]||pt[X]){if(!(_f(j)&&(W.tagNameCheck instanceof RegExp&&Oe(W.tagNameCheck,j)||W.tagNameCheck instanceof Function&&W.tagNameCheck(j))&&(W.attributeNameCheck instanceof RegExp&&Oe(W.attributeNameCheck,X)||W.attributeNameCheck instanceof Function&&W.attributeNameCheck(X,j))||X==="is"&&W.allowCustomizedBuiltInElements&&(W.tagNameCheck instanceof RegExp&&Oe(W.tagNameCheck,ct)||W.tagNameCheck instanceof Function&&W.tagNameCheck(ct))))return!1}else if(!Xc[X]){if(!Oe(G,Xs(ct,$,""))){if(!((X==="src"||X==="xlink:href"||X==="href")&&j!=="script"&&k$(ct,"data:")===0&&ff[j])){if(!(ge&&!Oe(L,Xs(ct,$,"")))){if(ct)return!1}}}}}}}return!0},_f=function(j){return j!=="annotation-xml"&&kh(j,N)},Tf=function(j){Kr(D.beforeSanitizeAttributes,j,null);const{attributes:X}=j;if(!X||Kc(j))return;const ct={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:F,forceKeepAttr:void 0};let Gt=X.length;for(;Gt--;){const we=X[Gt],{name:se,namespaceURI:Ge,value:ti}=we,Bn=ce(se),th=ti;let be=se==="value"?th:C$(th);if(ct.attrName=Bn,ct.attrValue=be,ct.keepAttr=!0,ct.forceKeepAttr=void 0,Kr(D.uponSanitizeAttribute,j,ct),be=ct.attrValue,St&&(Bn==="id"||Bn==="name")&&(zi(se,j),be=Ie+be),$n&&Oe(/((--!?|])>)|<\/(style|title|textarea)/i,be)){zi(se,j);continue}if(Bn==="attributename"&&kh(be,"href")){zi(se,j);continue}if(ct.forceKeepAttr)continue;if(!ct.keepAttr){zi(se,j);continue}if(!le&&Oe(/\/>/i,be)){zi(se,j);continue}rr&&ja([V,H,O],Af=>{be=Xs(be,Af," ")});const $f=ce(j.nodeName);if(!Sf($f,Bn,be)){zi(se,j);continue}if(S&&typeof f=="object"&&typeof f.getAttributeType=="function"&&!Ge)switch(f.getAttributeType($f,Bn)){case"TrustedHTML":{be=S.createHTML(be);break}case"TrustedScriptURL":{be=S.createScriptURL(be);break}}if(be!==th)try{Ge?j.setAttributeNS(Ge,se,be):j.setAttribute(se,be),Kc(j)?Pr(j):Lg(t.removed)}catch{zi(se,j)}}Kr(D.afterSanitizeAttributes,j,null)},Qk=function dt(j){let X=null;const ct=wf(j);for(Kr(D.beforeSanitizeShadowDOM,j,null);X=ct.nextNode();)Kr(D.uponSanitizeShadowNode,X,null),Cf(X),Tf(X),X.content instanceof s&&dt(X.content);Kr(D.afterSanitizeShadowDOM,j,null)};return t.sanitize=function(dt){let j=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},X=null,ct=null,Gt=null,we=null;if(Qc=!dt,Qc&&(dt="<!-->"),typeof dt!="string"&&!kf(dt))if(typeof dt.toString=="function"){if(dt=dt.toString(),typeof dt!="string")throw Qs("dirty is not a string, aborting")}else throw Qs("toString is not a function");if(!t.isSupported)return dt;if(Fs||Jc(j),t.removed=[],typeof dt=="string"&&(Ni=!1),Ni){if(dt.nodeName){const ti=ce(dt.nodeName);if(!Q[ti]||it[ti])throw Qs("root node is forbidden and cannot be sanitized in-place")}}else if(dt instanceof a)X=vf("<!---->"),ct=X.ownerDocument.importNode(dt,!0),ct.nodeType===Js.element&&ct.nodeName==="BODY"||ct.nodeName==="HTML"?X=ct:X.appendChild(ct);else{if(!bi&&!rr&&!Zr&&dt.indexOf("<")===-1)return S&&jn?S.createHTML(dt):dt;if(X=vf(dt),!X)return bi?null:jn?_:""}X&&Ps&&Pr(X.firstChild);const se=wf(Ni?dt:X);for(;Gt=se.nextNode();)Cf(Gt),Tf(Gt),Gt.content instanceof s&&Qk(Gt.content);if(Ni)return dt;if(bi){if(An)for(we=E.call(X.ownerDocument);X.firstChild;)we.appendChild(X.firstChild);else we=X;return(F.shadowroot||F.shadowrootmode)&&(we=z.call(i,we,!0)),we}let Ge=Zr?X.outerHTML:X.innerHTML;return Zr&&Q["!doctype"]&&X.ownerDocument&&X.ownerDocument.doctype&&X.ownerDocument.doctype.name&&Oe(mb,X.ownerDocument.doctype.name)&&(Ge="<!DOCTYPE "+X.ownerDocument.doctype.name+`>
`+Ge),rr&&ja([V,H,O],ti=>{Ge=Xs(Ge,ti," ")}),S&&jn?S.createHTML(Ge):Ge},t.setConfig=function(){let dt=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};Jc(dt),Fs=!0},t.clearConfig=function(){Ln=null,Fs=!1},t.isValidAttribute=function(dt,j,X){Ln||Jc({});const ct=ce(dt),Gt=ce(j);return Sf(ct,Gt,X)},t.addHook=function(dt,j){typeof j=="function"&&Ys(D[dt],j)},t.removeHook=function(dt,j){if(j!==void 0){const X=v$(D[dt],j);return X===-1?void 0:w$(D[dt],X,1)[0]}return Lg(D[dt])},t.removeHooks=function(dt){D[dt]=[]},t.removeAllHooks=function(){D=Dg()},t}var ar=xb();const F$="modulepreload",P$=function(e){return"/"+e},Fg={},Ht=function(t,r,i){let n=Promise.resolve();if(r&&r.length>0){document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),a=o?.nonce||o?.getAttribute("nonce");n=Promise.allSettled(r.map(l=>{if(l=P$(l),l in Fg)return;Fg[l]=!0;const c=l.endsWith(".css"),d=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${d}`))return;const u=document.createElement("link");if(u.rel=c?"stylesheet":F$,c||(u.as="script"),u.crossOrigin="",u.href=l,a&&u.setAttribute("nonce",a),document.head.appendChild(u),c)return new Promise((p,f)=>{u.addEventListener("load",p),u.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${l}`)))})}))}function s(o){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=o,window.dispatchEvent(a),!a.defaultPrevented)throw o}return n.then(o=>{for(const a of o||[])a.status==="rejected"&&s(a.reason);return t().catch(s)})};var Pg={name:"mermaid",version:"11.12.2",description:"Markdown-ish syntax for generating flowcharts, mindmaps, sequence diagrams, class diagrams, gantt charts, git graphs and more.",type:"module",module:"./dist/mermaid.core.mjs",types:"./dist/mermaid.d.ts",exports:{".":{types:"./dist/mermaid.d.ts",import:"./dist/mermaid.core.mjs",default:"./dist/mermaid.core.mjs"},"./*":"./*"},keywords:["diagram","markdown","flowchart","sequence diagram","gantt","class diagram","git graph","mindmap","packet diagram","c4 diagram","er diagram","pie chart","pie diagram","quadrant chart","requirement diagram","graph"],scripts:{clean:"rimraf dist",dev:"pnpm -w dev","docs:code":"typedoc src/defaultConfig.ts src/config.ts src/mermaid.ts && prettier --write ./src/docs/config/setup","docs:build":"rimraf ../../docs && pnpm docs:code && pnpm docs:spellcheck && tsx scripts/docs.cli.mts","docs:verify":"pnpm docs:code && pnpm docs:spellcheck && tsx scripts/docs.cli.mts --verify","docs:pre:vitepress":"pnpm --filter ./src/docs prefetch && rimraf src/vitepress && pnpm docs:code && tsx scripts/docs.cli.mts --vitepress && pnpm --filter ./src/vitepress install --no-frozen-lockfile --ignore-scripts","docs:build:vitepress":"pnpm docs:pre:vitepress && (cd src/vitepress && pnpm run build) && cpy --flat src/docs/landing/ ./src/vitepress/.vitepress/dist/landing","docs:dev":'pnpm docs:pre:vitepress && concurrently "pnpm --filter ./src/vitepress dev" "tsx scripts/docs.cli.mts --watch --vitepress"',"docs:dev:docker":'pnpm docs:pre:vitepress && concurrently "pnpm --filter ./src/vitepress dev:docker" "tsx scripts/docs.cli.mts --watch --vitepress"',"docs:serve":"pnpm docs:build:vitepress && vitepress serve src/vitepress","docs:spellcheck":'cspell "src/docs/**/*.md"',"docs:release-version":"tsx scripts/update-release-version.mts","docs:verify-version":"tsx scripts/update-release-version.mts --verify","types:build-config":"tsx scripts/create-types-from-json-schema.mts","types:verify-config":"tsx scripts/create-types-from-json-schema.mts --verify",checkCircle:"npx madge --circular ./src",prepublishOnly:"pnpm docs:verify-version"},repository:{type:"git",url:"https://github.com/mermaid-js/mermaid"},author:"Knut Sveidqvist",license:"MIT",standard:{ignore:["**/parser/*.js","dist/**/*.js","cypress/**/*.js"],globals:["page"]},dependencies:{"@braintree/sanitize-url":"^7.1.1","@iconify/utils":"^3.0.1","@mermaid-js/parser":"workspace:^","@types/d3":"^7.4.3",cytoscape:"^3.29.3","cytoscape-cose-bilkent":"^4.1.0","cytoscape-fcose":"^2.2.0",d3:"^7.9.0","d3-sankey":"^0.12.3","dagre-d3-es":"7.0.13",dayjs:"^1.11.18",dompurify:"^3.2.5",katex:"^0.16.22",khroma:"^2.1.0","lodash-es":"^4.17.21",marked:"^16.2.1",roughjs:"^4.6.6",stylis:"^4.3.6","ts-dedent":"^2.2.0",uuid:"^11.1.0"},devDependencies:{"@adobe/jsonschema2md":"^8.0.5","@iconify/types":"^2.0.0","@types/cytoscape":"^3.21.9","@types/cytoscape-fcose":"^2.2.4","@types/d3-sankey":"^0.12.4","@types/d3-scale":"^4.0.9","@types/d3-scale-chromatic":"^3.1.0","@types/d3-selection":"^3.0.11","@types/d3-shape":"^3.1.7","@types/jsdom":"^21.1.7","@types/katex":"^0.16.7","@types/lodash-es":"^4.17.12","@types/micromatch":"^4.0.9","@types/stylis":"^4.2.7","@types/uuid":"^10.0.0",ajv:"^8.17.1",canvas:"^3.1.2",chokidar:"3.6.0",concurrently:"^9.1.2","csstree-validator":"^4.0.1",globby:"^14.1.0",jison:"^0.4.18","js-base64":"^3.7.8",jsdom:"^26.1.0","json-schema-to-typescript":"^15.0.4",micromatch:"^4.0.8","path-browserify":"^1.0.1",prettier:"^3.5.3",remark:"^15.0.1","remark-frontmatter":"^5.0.0","remark-gfm":"^4.0.1",rimraf:"^6.0.1","start-server-and-test":"^2.0.13","type-fest":"^4.35.0",typedoc:"^0.28.12","typedoc-plugin-markdown":"^4.8.1",typescript:"~5.7.3","unist-util-flatmap":"^1.0.0","unist-util-visit":"^5.0.0",vitepress:"^1.6.4","vitepress-plugin-search":"1.0.4-alpha.22"},files:["dist/","README.md"],publishConfig:{access:"public"}},rl={exports:{}},N$=rl.exports,Ng;function z$(){return Ng||(Ng=1,function(e,t){(function(r,i){e.exports=i()})(N$,function(){var r=1e3,i=6e4,n=36e5,s="millisecond",o="second",a="minute",l="hour",c="day",d="week",u="month",p="quarter",f="year",g="date",x="Invalid Date",v=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[Tt\s]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,y=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,b={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),ordinal:function(O){var R=["th","st","nd","rd"],T=O%100;return"["+O+(R[(T-20)%10]||R[T]||R[0])+"]"}},w=function(O,R,T){var L=String(O);return!L||L.length>=R?O:""+Array(R+1-L.length).join(T)+O},S={s:w,z:function(O){var R=-O.utcOffset(),T=Math.abs(R),L=Math.floor(T/60),$=T%60;return(R<=0?"+":"-")+w(L,2,"0")+":"+w($,2,"0")},m:function O(R,T){if(R.date()<T.date())return-O(T,R);var L=12*(T.year()-R.year())+(T.month()-R.month()),$=R.clone().add(L,u),N=T-$<0,G=R.clone().add(L+(N?-1:1),u);return+(-(L+(T-$)/(N?$-G:G-$))||0)},a:function(O){return O<0?Math.ceil(O)||0:Math.floor(O)},p:function(O){return{M:u,y:f,w:d,d:c,D:g,h:l,m:a,s:o,ms:s,Q:p}[O]||String(O||"").toLowerCase().replace(/s$/,"")},u:function(O){return O===void 0}},_="en",A={};A[_]=b;var C="$isDayjsObject",E=function(O){return O instanceof V||!(!O||!O[C])},P=function O(R,T,L){var $;if(!R)return _;if(typeof R=="string"){var N=R.toLowerCase();A[N]&&($=N),T&&(A[N]=T,$=N);var G=R.split("-");if(!$&&G.length>1)return O(G[0])}else{var Q=R.name;A[Q]=R,$=Q}return!L&&$&&(_=$),$||!L&&_},z=function(O,R){if(E(O))return O.clone();var T=typeof R=="object"?R:{};return T.date=O,T.args=arguments,new V(T)},D=S;D.l=P,D.i=E,D.w=function(O,R){return z(O,{locale:R.$L,utc:R.$u,x:R.$x,$offset:R.$offset})};var V=function(){function O(T){this.$L=P(T.locale,null,!0),this.parse(T),this.$x=this.$x||T.x||{},this[C]=!0}var R=O.prototype;return R.parse=function(T){this.$d=function(L){var $=L.date,N=L.utc;if($===null)return new Date(NaN);if(D.u($))return new Date;if($ instanceof Date)return new Date($);if(typeof $=="string"&&!/Z$/i.test($)){var G=$.match(v);if(G){var Q=G[2]-1||0,Y=(G[7]||"0").substring(0,3);return N?new Date(Date.UTC(G[1],Q,G[3]||1,G[4]||0,G[5]||0,G[6]||0,Y)):new Date(G[1],Q,G[3]||1,G[4]||0,G[5]||0,G[6]||0,Y)}}return new Date($)}(T),this.init()},R.init=function(){var T=this.$d;this.$y=T.getFullYear(),this.$M=T.getMonth(),this.$D=T.getDate(),this.$W=T.getDay(),this.$H=T.getHours(),this.$m=T.getMinutes(),this.$s=T.getSeconds(),this.$ms=T.getMilliseconds()},R.$utils=function(){return D},R.isValid=function(){return this.$d.toString()!==x},R.isSame=function(T,L){var $=z(T);return this.startOf(L)<=$&&$<=this.endOf(L)},R.isAfter=function(T,L){return z(T)<this.startOf(L)},R.isBefore=function(T,L){return this.endOf(L)<z(T)},R.$g=function(T,L,$){return D.u(T)?this[L]:this.set($,T)},R.unix=function(){return Math.floor(this.valueOf()/1e3)},R.valueOf=function(){return this.$d.getTime()},R.startOf=function(T,L){var $=this,N=!!D.u(L)||L,G=D.p(T),Q=function(Zt,Wt){var ge=D.w($.$u?Date.UTC($.$y,Wt,Zt):new Date($.$y,Wt,Zt),$);return N?ge:ge.endOf(c)},Y=function(Zt,Wt){return D.w($.toDate()[Zt].apply($.toDate("s"),(N?[0,0,0,0]:[23,59,59,999]).slice(Wt)),$)},F=this.$W,J=this.$M,W=this.$D,it="set"+(this.$u?"UTC":"");switch(G){case f:return N?Q(1,0):Q(31,11);case u:return N?Q(1,J):Q(0,J+1);case d:var pt=this.$locale().weekStart||0,Dt=(F<pt?F+7:F)-pt;return Q(N?W-Dt:W+(6-Dt),J);case c:case g:return Y(it+"Hours",0);case l:return Y(it+"Minutes",1);case a:return Y(it+"Seconds",2);case o:return Y(it+"Milliseconds",3);default:return this.clone()}},R.endOf=function(T){return this.startOf(T,!1)},R.$set=function(T,L){var $,N=D.p(T),G="set"+(this.$u?"UTC":""),Q=($={},$[c]=G+"Date",$[g]=G+"Date",$[u]=G+"Month",$[f]=G+"FullYear",$[l]=G+"Hours",$[a]=G+"Minutes",$[o]=G+"Seconds",$[s]=G+"Milliseconds",$)[N],Y=N===c?this.$D+(L-this.$W):L;if(N===u||N===f){var F=this.clone().set(g,1);F.$d[Q](Y),F.init(),this.$d=F.set(g,Math.min(this.$D,F.daysInMonth())).$d}else Q&&this.$d[Q](Y);return this.init(),this},R.set=function(T,L){return this.clone().$set(T,L)},R.get=function(T){return this[D.p(T)]()},R.add=function(T,L){var $,N=this;T=Number(T);var G=D.p(L),Q=function(J){var W=z(N);return D.w(W.date(W.date()+Math.round(J*T)),N)};if(G===u)return this.set(u,this.$M+T);if(G===f)return this.set(f,this.$y+T);if(G===c)return Q(1);if(G===d)return Q(7);var Y=($={},$[a]=i,$[l]=n,$[o]=r,$)[G]||1,F=this.$d.getTime()+T*Y;return D.w(F,this)},R.subtract=function(T,L){return this.add(-1*T,L)},R.format=function(T){var L=this,$=this.$locale();if(!this.isValid())return $.invalidDate||x;var N=T||"YYYY-MM-DDTHH:mm:ssZ",G=D.z(this),Q=this.$H,Y=this.$m,F=this.$M,J=$.weekdays,W=$.months,it=$.meridiem,pt=function(Wt,ge,le,rr){return Wt&&(Wt[ge]||Wt(L,N))||le[ge].slice(0,rr)},Dt=function(Wt){return D.s(Q%12||12,Wt,"0")},Zt=it||function(Wt,ge,le){var rr=Wt<12?"AM":"PM";return le?rr.toLowerCase():rr};return N.replace(y,function(Wt,ge){return ge||function(le){switch(le){case"YY":return String(L.$y).slice(-2);case"YYYY":return D.s(L.$y,4,"0");case"M":return F+1;case"MM":return D.s(F+1,2,"0");case"MMM":return pt($.monthsShort,F,W,3);case"MMMM":return pt(W,F);case"D":return L.$D;case"DD":return D.s(L.$D,2,"0");case"d":return String(L.$W);case"dd":return pt($.weekdaysMin,L.$W,J,2);case"ddd":return pt($.weekdaysShort,L.$W,J,3);case"dddd":return J[L.$W];case"H":return String(Q);case"HH":return D.s(Q,2,"0");case"h":return Dt(1);case"hh":return Dt(2);case"a":return Zt(Q,Y,!0);case"A":return Zt(Q,Y,!1);case"m":return String(Y);case"mm":return D.s(Y,2,"0");case"s":return String(L.$s);case"ss":return D.s(L.$s,2,"0");case"SSS":return D.s(L.$ms,3,"0");case"Z":return G}return null}(Wt)||G.replace(":","")})},R.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},R.diff=function(T,L,$){var N,G=this,Q=D.p(L),Y=z(T),F=(Y.utcOffset()-this.utcOffset())*i,J=this-Y,W=function(){return D.m(G,Y)};switch(Q){case f:N=W()/12;break;case u:N=W();break;case p:N=W()/3;break;case d:N=(J-F)/6048e5;break;case c:N=(J-F)/864e5;break;case l:N=J/n;break;case a:N=J/i;break;case o:N=J/r;break;default:N=J}return $?N:D.a(N)},R.daysInMonth=function(){return this.endOf(u).$D},R.$locale=function(){return A[this.$L]},R.locale=function(T,L){if(!T)return this.$L;var $=this.clone(),N=P(T,L,!0);return N&&($.$L=N),$},R.clone=function(){return D.w(this.$d,this)},R.toDate=function(){return new Date(this.valueOf())},R.toJSON=function(){return this.isValid()?this.toISOString():null},R.toISOString=function(){return this.$d.toISOString()},R.toString=function(){return this.$d.toUTCString()},O}(),H=V.prototype;return z.prototype=H,[["$ms",s],["$s",o],["$m",a],["$H",l],["$W",c],["$M",u],["$y",f],["$D",g]].forEach(function(O){H[O[1]]=function(R){return this.$g(R,O[0],O[1])}}),z.extend=function(O,R){return O.$i||(O(R,V,z),O.$i=!0),z},z.locale=P,z.isDayjs=E,z.unix=function(O){return z(1e3*O)},z.en=A[_],z.Ls=A,z.p={},z})}(rl)),rl.exports}var H$=z$();const q$=U0(H$);var bb=Object.defineProperty,m=(e,t)=>bb(e,"name",{value:t,configurable:!0}),W$=(e,t)=>{for(var r in t)bb(e,r,{get:t[r],enumerable:!0})},ei={trace:0,debug:1,info:2,warn:3,error:4,fatal:5},q={trace:m((...e)=>{},"trace"),debug:m((...e)=>{},"debug"),info:m((...e)=>{},"info"),warn:m((...e)=>{},"warn"),error:m((...e)=>{},"error"),fatal:m((...e)=>{},"fatal")},op=m(function(e="fatal"){let t=ei.fatal;typeof e=="string"?e.toLowerCase()in ei&&(t=ei[e]):typeof e=="number"&&(t=e),q.trace=()=>{},q.debug=()=>{},q.info=()=>{},q.warn=()=>{},q.error=()=>{},q.fatal=()=>{},t<=ei.fatal&&(q.fatal=console.error?console.error.bind(console,hr("FATAL"),"color: orange"):console.log.bind(console,"\x1B[35m",hr("FATAL"))),t<=ei.error&&(q.error=console.error?console.error.bind(console,hr("ERROR"),"color: orange"):console.log.bind(console,"\x1B[31m",hr("ERROR"))),t<=ei.warn&&(q.warn=console.warn?console.warn.bind(console,hr("WARN"),"color: orange"):console.log.bind(console,"\x1B[33m",hr("WARN"))),t<=ei.info&&(q.info=console.info?console.info.bind(console,hr("INFO"),"color: lightblue"):console.log.bind(console,"\x1B[34m",hr("INFO"))),t<=ei.debug&&(q.debug=console.debug?console.debug.bind(console,hr("DEBUG"),"color: lightgreen"):console.log.bind(console,"\x1B[32m",hr("DEBUG"))),t<=ei.trace&&(q.trace=console.debug?console.debug.bind(console,hr("TRACE"),"color: lightgreen"):console.log.bind(console,"\x1B[32m",hr("TRACE")))},"setLogLevel"),hr=m(e=>`%c${q$().format("ss.SSS")} : ${e} : `,"format");const il={min:{r:0,g:0,b:0,s:0,l:0,a:0},max:{r:255,g:255,b:255,h:360,s:100,l:100,a:1},clamp:{r:e=>e>=255?255:e<0?0:e,g:e=>e>=255?255:e<0?0:e,b:e=>e>=255?255:e<0?0:e,h:e=>e%360,s:e=>e>=100?100:e<0?0:e,l:e=>e>=100?100:e<0?0:e,a:e=>e>=1?1:e<0?0:e},toLinear:e=>{const t=e/255;return e>.03928?Math.pow((t+.055)/1.055,2.4):t/12.92},hue2rgb:(e,t,r)=>(r<0&&(r+=1),r>1&&(r-=1),r<1/6?e+(t-e)*6*r:r<1/2?t:r<2/3?e+(t-e)*(2/3-r)*6:e),hsl2rgb:({h:e,s:t,l:r},i)=>{if(!t)return r*2.55;e/=360,t/=100,r/=100;const n=r<.5?r*(1+t):r+t-r*t,s=2*r-n;switch(i){case"r":return il.hue2rgb(s,n,e+1/3)*255;case"g":return il.hue2rgb(s,n,e)*255;case"b":return il.hue2rgb(s,n,e-1/3)*255}},rgb2hsl:({r:e,g:t,b:r},i)=>{e/=255,t/=255,r/=255;const n=Math.max(e,t,r),s=Math.min(e,t,r),o=(n+s)/2;if(i==="l")return o*100;if(n===s)return 0;const a=n-s,l=o>.5?a/(2-n-s):a/(n+s);if(i==="s")return l*100;switch(n){case e:return((t-r)/a+(t<r?6:0))*60;case t:return((r-e)/a+2)*60;case r:return((e-t)/a+4)*60;default:return-1}}},V$={clamp:(e,t,r)=>t>r?Math.min(t,Math.max(r,e)):Math.min(r,Math.max(t,e)),round:e=>Math.round(e*1e10)/1e10},U$={dec2hex:e=>{const t=Math.round(e).toString(16);return t.length>1?t:`0${t}`}},kt={channel:il,lang:V$,unit:U$},wi={};for(let e=0;e<=255;e++)wi[e]=kt.unit.dec2hex(e);const ke={ALL:0,RGB:1,HSL:2};class G${constructor(){this.type=ke.ALL}get(){return this.type}set(t){if(this.type&&this.type!==t)throw new Error("Cannot change both RGB and HSL channels at the same time");this.type=t}reset(){this.type=ke.ALL}is(t){return this.type===t}}class Y${constructor(t,r){this.color=r,this.changed=!1,this.data=t,this.type=new G$}set(t,r){return this.color=r,this.changed=!1,this.data=t,this.type.type=ke.ALL,this}_ensureHSL(){const t=this.data,{h:r,s:i,l:n}=t;r===void 0&&(t.h=kt.channel.rgb2hsl(t,"h")),i===void 0&&(t.s=kt.channel.rgb2hsl(t,"s")),n===void 0&&(t.l=kt.channel.rgb2hsl(t,"l"))}_ensureRGB(){const t=this.data,{r,g:i,b:n}=t;r===void 0&&(t.r=kt.channel.hsl2rgb(t,"r")),i===void 0&&(t.g=kt.channel.hsl2rgb(t,"g")),n===void 0&&(t.b=kt.channel.hsl2rgb(t,"b"))}get r(){const t=this.data,r=t.r;return!this.type.is(ke.HSL)&&r!==void 0?r:(this._ensureHSL(),kt.channel.hsl2rgb(t,"r"))}get g(){const t=this.data,r=t.g;return!this.type.is(ke.HSL)&&r!==void 0?r:(this._ensureHSL(),kt.channel.hsl2rgb(t,"g"))}get b(){const t=this.data,r=t.b;return!this.type.is(ke.HSL)&&r!==void 0?r:(this._ensureHSL(),kt.channel.hsl2rgb(t,"b"))}get h(){const t=this.data,r=t.h;return!this.type.is(ke.RGB)&&r!==void 0?r:(this._ensureRGB(),kt.channel.rgb2hsl(t,"h"))}get s(){const t=this.data,r=t.s;return!this.type.is(ke.RGB)&&r!==void 0?r:(this._ensureRGB(),kt.channel.rgb2hsl(t,"s"))}get l(){const t=this.data,r=t.l;return!this.type.is(ke.RGB)&&r!==void 0?r:(this._ensureRGB(),kt.channel.rgb2hsl(t,"l"))}get a(){return this.data.a}set r(t){this.type.set(ke.RGB),this.changed=!0,this.data.r=t}set g(t){this.type.set(ke.RGB),this.changed=!0,this.data.g=t}set b(t){this.type.set(ke.RGB),this.changed=!0,this.data.b=t}set h(t){this.type.set(ke.HSL),this.changed=!0,this.data.h=t}set s(t){this.type.set(ke.HSL),this.changed=!0,this.data.s=t}set l(t){this.type.set(ke.HSL),this.changed=!0,this.data.l=t}set a(t){this.changed=!0,this.data.a=t}}const bc=new Y$({r:0,g:0,b:0,a:0},"transparent"),Zn={re:/^#((?:[a-f0-9]{2}){2,4}|[a-f0-9]{3})$/i,parse:e=>{if(e.charCodeAt(0)!==35)return;const t=e.match(Zn.re);if(!t)return;const r=t[1],i=parseInt(r,16),n=r.length,s=n%4===0,o=n>4,a=o?1:17,l=o?8:4,c=s?0:-1,d=o?255:15;return bc.set({r:(i>>l*(c+3)&d)*a,g:(i>>l*(c+2)&d)*a,b:(i>>l*(c+1)&d)*a,a:s?(i&d)*a/255:1},e)},stringify:e=>{const{r:t,g:r,b:i,a:n}=e;return n<1?`#${wi[Math.round(t)]}${wi[Math.round(r)]}${wi[Math.round(i)]}${wi[Math.round(n*255)]}`:`#${wi[Math.round(t)]}${wi[Math.round(r)]}${wi[Math.round(i)]}`}},Ki={re:/^hsla?\(\s*?(-?(?:\d+(?:\.\d+)?|(?:\.\d+))(?:e-?\d+)?(?:deg|grad|rad|turn)?)\s*?(?:,|\s)\s*?(-?(?:\d+(?:\.\d+)?|(?:\.\d+))(?:e-?\d+)?%)\s*?(?:,|\s)\s*?(-?(?:\d+(?:\.\d+)?|(?:\.\d+))(?:e-?\d+)?%)(?:\s*?(?:,|\/)\s*?\+?(-?(?:\d+(?:\.\d+)?|(?:\.\d+))(?:e-?\d+)?(%)?))?\s*?\)$/i,hueRe:/^(.+?)(deg|grad|rad|turn)$/i,_hue2deg:e=>{const t=e.match(Ki.hueRe);if(t){const[,r,i]=t;switch(i){case"grad":return kt.channel.clamp.h(parseFloat(r)*.9);case"rad":return kt.channel.clamp.h(parseFloat(r)*180/Math.PI);case"turn":return kt.channel.clamp.h(parseFloat(r)*360)}}return kt.channel.clamp.h(parseFloat(e))},parse:e=>{const t=e.charCodeAt(0);if(t!==104&&t!==72)return;const r=e.match(Ki.re);if(!r)return;const[,i,n,s,o,a]=r;return bc.set({h:Ki._hue2deg(i),s:kt.channel.clamp.s(parseFloat(n)),l:kt.channel.clamp.l(parseFloat(s)),a:o?kt.channel.clamp.a(a?parseFloat(o)/100:parseFloat(o)):1},e)},stringify:e=>{const{h:t,s:r,l:i,a:n}=e;return n<1?`hsla(${kt.lang.round(t)}, ${kt.lang.round(r)}%, ${kt.lang.round(i)}%, ${n})`:`hsl(${kt.lang.round(t)}, ${kt.lang.round(r)}%, ${kt.lang.round(i)}%)`}},Co={colors:{aliceblue:"#f0f8ff",antiquewhite:"#faebd7",aqua:"#00ffff",aquamarine:"#7fffd4",azure:"#f0ffff",beige:"#f5f5dc",bisque:"#ffe4c4",black:"#000000",blanchedalmond:"#ffebcd",blue:"#0000ff",blueviolet:"#8a2be2",brown:"#a52a2a",burlywood:"#deb887",cadetblue:"#5f9ea0",chartreuse:"#7fff00",chocolate:"#d2691e",coral:"#ff7f50",cornflowerblue:"#6495ed",cornsilk:"#fff8dc",crimson:"#dc143c",cyanaqua:"#00ffff",darkblue:"#00008b",darkcyan:"#008b8b",darkgoldenrod:"#b8860b",darkgray:"#a9a9a9",darkgreen:"#006400",darkgrey:"#a9a9a9",darkkhaki:"#bdb76b",darkmagenta:"#8b008b",darkolivegreen:"#556b2f",darkorange:"#ff8c00",darkorchid:"#9932cc",darkred:"#8b0000",darksalmon:"#e9967a",darkseagreen:"#8fbc8f",darkslateblue:"#483d8b",darkslategray:"#2f4f4f",darkslategrey:"#2f4f4f",darkturquoise:"#00ced1",darkviolet:"#9400d3",deeppink:"#ff1493",deepskyblue:"#00bfff",dimgray:"#696969",dimgrey:"#696969",dodgerblue:"#1e90ff",firebrick:"#b22222",floralwhite:"#fffaf0",forestgreen:"#228b22",fuchsia:"#ff00ff",gainsboro:"#dcdcdc",ghostwhite:"#f8f8ff",gold:"#ffd700",goldenrod:"#daa520",gray:"#808080",green:"#008000",greenyellow:"#adff2f",grey:"#808080",honeydew:"#f0fff0",hotpink:"#ff69b4",indianred:"#cd5c5c",indigo:"#4b0082",ivory:"#fffff0",khaki:"#f0e68c",lavender:"#e6e6fa",lavenderblush:"#fff0f5",lawngreen:"#7cfc00",lemonchiffon:"#fffacd",lightblue:"#add8e6",lightcoral:"#f08080",lightcyan:"#e0ffff",lightgoldenrodyellow:"#fafad2",lightgray:"#d3d3d3",lightgreen:"#90ee90",lightgrey:"#d3d3d3",lightpink:"#ffb6c1",lightsalmon:"#ffa07a",lightseagreen:"#20b2aa",lightskyblue:"#87cefa",lightslategray:"#778899",lightslategrey:"#778899",lightsteelblue:"#b0c4de",lightyellow:"#ffffe0",lime:"#00ff00",limegreen:"#32cd32",linen:"#faf0e6",magenta:"#ff00ff",maroon:"#800000",mediumaquamarine:"#66cdaa",mediumblue:"#0000cd",mediumorchid:"#ba55d3",mediumpurple:"#9370db",mediumseagreen:"#3cb371",mediumslateblue:"#7b68ee",mediumspringgreen:"#00fa9a",mediumturquoise:"#48d1cc",mediumvioletred:"#c71585",midnightblue:"#191970",mintcream:"#f5fffa",mistyrose:"#ffe4e1",moccasin:"#ffe4b5",navajowhite:"#ffdead",navy:"#000080",oldlace:"#fdf5e6",olive:"#808000",olivedrab:"#6b8e23",orange:"#ffa500",orangered:"#ff4500",orchid:"#da70d6",palegoldenrod:"#eee8aa",palegreen:"#98fb98",paleturquoise:"#afeeee",palevioletred:"#db7093",papayawhip:"#ffefd5",peachpuff:"#ffdab9",peru:"#cd853f",pink:"#ffc0cb",plum:"#dda0dd",powderblue:"#b0e0e6",purple:"#800080",rebeccapurple:"#663399",red:"#ff0000",rosybrown:"#bc8f8f",royalblue:"#4169e1",saddlebrown:"#8b4513",salmon:"#fa8072",sandybrown:"#f4a460",seagreen:"#2e8b57",seashell:"#fff5ee",sienna:"#a0522d",silver:"#c0c0c0",skyblue:"#87ceeb",slateblue:"#6a5acd",slategray:"#708090",slategrey:"#708090",snow:"#fffafa",springgreen:"#00ff7f",tan:"#d2b48c",teal:"#008080",thistle:"#d8bfd8",transparent:"#00000000",turquoise:"#40e0d0",violet:"#ee82ee",wheat:"#f5deb3",white:"#ffffff",whitesmoke:"#f5f5f5",yellow:"#ffff00",yellowgreen:"#9acd32"},parse:e=>{e=e.toLowerCase();const t=Co.colors[e];if(t)return Zn.parse(t)},stringify:e=>{const t=Zn.stringify(e);for(const r in Co.colors)if(Co.colors[r]===t)return r}},lo={re:/^rgba?\(\s*?(-?(?:\d+(?:\.\d+)?|(?:\.\d+))(?:e\d+)?(%?))\s*?(?:,|\s)\s*?(-?(?:\d+(?:\.\d+)?|(?:\.\d+))(?:e\d+)?(%?))\s*?(?:,|\s)\s*?(-?(?:\d+(?:\.\d+)?|(?:\.\d+))(?:e\d+)?(%?))(?:\s*?(?:,|\/)\s*?\+?(-?(?:\d+(?:\.\d+)?|(?:\.\d+))(?:e\d+)?(%?)))?\s*?\)$/i,parse:e=>{const t=e.charCodeAt(0);if(t!==114&&t!==82)return;const r=e.match(lo.re);if(!r)return;const[,i,n,s,o,a,l,c,d]=r;return bc.set({r:kt.channel.clamp.r(n?parseFloat(i)*2.55:parseFloat(i)),g:kt.channel.clamp.g(o?parseFloat(s)*2.55:parseFloat(s)),b:kt.channel.clamp.b(l?parseFloat(a)*2.55:parseFloat(a)),a:c?kt.channel.clamp.a(d?parseFloat(c)/100:parseFloat(c)):1},e)},stringify:e=>{const{r:t,g:r,b:i,a:n}=e;return n<1?`rgba(${kt.lang.round(t)}, ${kt.lang.round(r)}, ${kt.lang.round(i)}, ${kt.lang.round(n)})`:`rgb(${kt.lang.round(t)}, ${kt.lang.round(r)}, ${kt.lang.round(i)})`}},Gr={format:{keyword:Co,hex:Zn,rgb:lo,rgba:lo,hsl:Ki,hsla:Ki},parse:e=>{if(typeof e!="string")return e;const t=Zn.parse(e)||lo.parse(e)||Ki.parse(e)||Co.parse(e);if(t)return t;throw new Error(`Unsupported color format: "${e}"`)},stringify:e=>!e.changed&&e.color?e.color:e.type.is(ke.HSL)||e.data.r===void 0?Ki.stringify(e):e.a<1||!Number.isInteger(e.r)||!Number.isInteger(e.g)||!Number.isInteger(e.b)?lo.stringify(e):Zn.stringify(e)},yb=(e,t)=>{const r=Gr.parse(e);for(const i in t)r[i]=kt.channel.clamp[i](t[i]);return Gr.stringify(r)},So=(e,t,r=0,i=1)=>{if(typeof e!="number")return yb(e,{a:t});const n=bc.set({r:kt.channel.clamp.r(e),g:kt.channel.clamp.g(t),b:kt.channel.clamp.b(r),a:kt.channel.clamp.a(i)});return Gr.stringify(n)},X$=e=>{const{r:t,g:r,b:i}=Gr.parse(e),n=.2126*kt.channel.toLinear(t)+.7152*kt.channel.toLinear(r)+.0722*kt.channel.toLinear(i);return kt.lang.round(n)},Q$=e=>X$(e)>=.5,sa=e=>!Q$(e),vb=(e,t,r)=>{const i=Gr.parse(e),n=i[t],s=kt.channel.clamp[t](n+r);return n!==s&&(i[t]=s),Gr.stringify(i)},nt=(e,t)=>vb(e,"l",t),ut=(e,t)=>vb(e,"l",-t),B=(e,t)=>{const r=Gr.parse(e),i={};for(const n in t)t[n]&&(i[n]=r[n]+t[n]);return yb(e,i)},Z$=(e,t,r=50)=>{const{r:i,g:n,b:s,a:o}=Gr.parse(e),{r:a,g:l,b:c,a:d}=Gr.parse(t),u=r/100,p=u*2-1,f=o-d,x=((p*f===-1?p:(p+f)/(1+p*f))+1)/2,v=1-x,y=i*x+a*v,b=n*x+l*v,w=s*x+c*v,S=o*u+d*(1-u);return So(y,b,w,S)},Z=(e,t=100)=>{const r=Gr.parse(e);return r.r=255-r.r,r.g=255-r.g,r.b=255-r.b,Z$(r,e,t)};var wb=/^-{3}\s*[\n\r](.*?)[\n\r]-{3}\s*[\n\r]+/s,_o=/%{2}{\s*(?:(\w+)\s*:|(\w+))\s*(?:(\w+)|((?:(?!}%{2}).|\r?\n)*))?\s*(?:}%{2})?/gi,J$=/\s*%%.*\n/gm,ts,kb=(ts=class extends Error{constructor(t){super(t),this.name="UnknownDiagramError"}},m(ts,"UnknownDiagramError"),ts),hn={},ap=m(function(e,t){e=e.replace(wb,"").replace(_o,"").replace(J$,`
`);for(const[r,{detector:i}]of Object.entries(hn))if(i(e,t))return r;throw new kb(`No diagram type detected matching given configuration for text: ${e}`)},"detectType"),Nd=m((...e)=>{for(const{id:t,detector:r,loader:i}of e)Cb(t,r,i)},"registerLazyLoadedDiagrams"),Cb=m((e,t,r)=>{hn[e]&&q.warn(`Detector with key ${e} already exists. Overwriting.`),hn[e]={detector:t,loader:r},q.debug(`Detector with key ${e} added${r?" with loader":""}`)},"addDetector"),K$=m(e=>hn[e].loader,"getDiagramLoader"),zd=m((e,t,{depth:r=2,clobber:i=!1}={})=>{const n={depth:r,clobber:i};return Array.isArray(t)&&!Array.isArray(e)?(t.forEach(s=>zd(e,s,n)),e):Array.isArray(t)&&Array.isArray(e)?(t.forEach(s=>{e.includes(s)||e.push(s)}),e):e===void 0||r<=0?e!=null&&typeof e=="object"&&typeof t=="object"?Object.assign(e,t):t:(t!==void 0&&typeof e=="object"&&typeof t=="object"&&Object.keys(t).forEach(s=>{typeof t[s]=="object"&&(e[s]===void 0||typeof e[s]=="object")?(e[s]===void 0&&(e[s]=Array.isArray(t[s])?[]:{}),e[s]=zd(e[s],t[s],{depth:r-1,clobber:i})):(i||typeof e[s]!="object"&&typeof t[s]!="object")&&(e[s]=t[s])}),e)},"assignWithDepth"),de=zd,yc="#ffffff",vc="#f2f2f2",Fe=m((e,t)=>t?B(e,{s:-40,l:10}):B(e,{s:-40,l:-10}),"mkBorder"),es,tA=(es=class{constructor(){this.background="#f4f4f4",this.primaryColor="#fff4dd",this.noteBkgColor="#fff5ad",this.noteTextColor="#333",this.THEME_COLOR_LIMIT=12,this.fontFamily='"trebuchet ms", verdana, arial, sans-serif',this.fontSize="16px"}updateColors(){if(this.primaryTextColor=this.primaryTextColor||(this.darkMode?"#eee":"#333"),this.secondaryColor=this.secondaryColor||B(this.primaryColor,{h:-120}),this.tertiaryColor=this.tertiaryColor||B(this.primaryColor,{h:180,l:5}),this.primaryBorderColor=this.primaryBorderColor||Fe(this.primaryColor,this.darkMode),this.secondaryBorderColor=this.secondaryBorderColor||Fe(this.secondaryColor,this.darkMode),this.tertiaryBorderColor=this.tertiaryBorderColor||Fe(this.tertiaryColor,this.darkMode),this.noteBorderColor=this.noteBorderColor||Fe(this.noteBkgColor,this.darkMode),this.noteBkgColor=this.noteBkgColor||"#fff5ad",this.noteTextColor=this.noteTextColor||"#333",this.secondaryTextColor=this.secondaryTextColor||Z(this.secondaryColor),this.tertiaryTextColor=this.tertiaryTextColor||Z(this.tertiaryColor),this.lineColor=this.lineColor||Z(this.background),this.arrowheadColor=this.arrowheadColor||Z(this.background),this.textColor=this.textColor||this.primaryTextColor,this.border2=this.border2||this.tertiaryBorderColor,this.nodeBkg=this.nodeBkg||this.primaryColor,this.mainBkg=this.mainBkg||this.primaryColor,this.nodeBorder=this.nodeBorder||this.primaryBorderColor,this.clusterBkg=this.clusterBkg||this.tertiaryColor,this.clusterBorder=this.clusterBorder||this.tertiaryBorderColor,this.defaultLinkColor=this.defaultLinkColor||this.lineColor,this.titleColor=this.titleColor||this.tertiaryTextColor,this.edgeLabelBackground=this.edgeLabelBackground||(this.darkMode?ut(this.secondaryColor,30):this.secondaryColor),this.nodeTextColor=this.nodeTextColor||this.primaryTextColor,this.actorBorder=this.actorBorder||this.primaryBorderColor,this.actorBkg=this.actorBkg||this.mainBkg,this.actorTextColor=this.actorTextColor||this.primaryTextColor,this.actorLineColor=this.actorLineColor||this.actorBorder,this.labelBoxBkgColor=this.labelBoxBkgColor||this.actorBkg,this.signalColor=this.signalColor||this.textColor,this.signalTextColor=this.signalTextColor||this.textColor,this.labelBoxBorderColor=this.labelBoxBorderColor||this.actorBorder,this.labelTextColor=this.labelTextColor||this.actorTextColor,this.loopTextColor=this.loopTextColor||this.actorTextColor,this.activationBorderColor=this.activationBorderColor||ut(this.secondaryColor,10),this.activationBkgColor=this.activationBkgColor||this.secondaryColor,this.sequenceNumberColor=this.sequenceNumberColor||Z(this.lineColor),this.sectionBkgColor=this.sectionBkgColor||this.tertiaryColor,this.altSectionBkgColor=this.altSectionBkgColor||"white",this.sectionBkgColor=this.sectionBkgColor||this.secondaryColor,this.sectionBkgColor2=this.sectionBkgColor2||this.primaryColor,this.excludeBkgColor=this.excludeBkgColor||"#eeeeee",this.taskBorderColor=this.taskBorderColor||this.primaryBorderColor,this.taskBkgColor=this.taskBkgColor||this.primaryColor,this.activeTaskBorderColor=this.activeTaskBorderColor||this.primaryColor,this.activeTaskBkgColor=this.activeTaskBkgColor||nt(this.primaryColor,23),this.gridColor=this.gridColor||"lightgrey",this.doneTaskBkgColor=this.doneTaskBkgColor||"lightgrey",this.doneTaskBorderColor=this.doneTaskBorderColor||"grey",this.critBorderColor=this.critBorderColor||"#ff8888",this.critBkgColor=this.critBkgColor||"red",this.todayLineColor=this.todayLineColor||"red",this.vertLineColor=this.vertLineColor||"navy",this.taskTextColor=this.taskTextColor||this.textColor,this.taskTextOutsideColor=this.taskTextOutsideColor||this.textColor,this.taskTextLightColor=this.taskTextLightColor||this.textColor,this.taskTextColor=this.taskTextColor||this.primaryTextColor,this.taskTextDarkColor=this.taskTextDarkColor||this.textColor,this.taskTextClickableColor=this.taskTextClickableColor||"#003163",this.personBorder=this.personBorder||this.primaryBorderColor,this.personBkg=this.personBkg||this.mainBkg,this.darkMode?(this.rowOdd=this.rowOdd||ut(this.mainBkg,5)||"#ffffff",this.rowEven=this.rowEven||ut(this.mainBkg,10)):(this.rowOdd=this.rowOdd||nt(this.mainBkg,75)||"#ffffff",this.rowEven=this.rowEven||nt(this.mainBkg,5)),this.transitionColor=this.transitionColor||this.lineColor,this.transitionLabelColor=this.transitionLabelColor||this.textColor,this.stateLabelColor=this.stateLabelColor||this.stateBkg||this.primaryTextColor,this.stateBkg=this.stateBkg||this.mainBkg,this.labelBackgroundColor=this.labelBackgroundColor||this.stateBkg,this.compositeBackground=this.compositeBackground||this.background||this.tertiaryColor,this.altBackground=this.altBackground||this.tertiaryColor,this.compositeTitleBackground=this.compositeTitleBackground||this.mainBkg,this.compositeBorder=this.compositeBorder||this.nodeBorder,this.innerEndBackground=this.nodeBorder,this.errorBkgColor=this.errorBkgColor||this.tertiaryColor,this.errorTextColor=this.errorTextColor||this.tertiaryTextColor,this.transitionColor=this.transitionColor||this.lineColor,this.specialStateColor=this.lineColor,this.cScale0=this.cScale0||this.primaryColor,this.cScale1=this.cScale1||this.secondaryColor,this.cScale2=this.cScale2||this.tertiaryColor,this.cScale3=this.cScale3||B(this.primaryColor,{h:30}),this.cScale4=this.cScale4||B(this.primaryColor,{h:60}),this.cScale5=this.cScale5||B(this.primaryColor,{h:90}),this.cScale6=this.cScale6||B(this.primaryColor,{h:120}),this.cScale7=this.cScale7||B(this.primaryColor,{h:150}),this.cScale8=this.cScale8||B(this.primaryColor,{h:210,l:150}),this.cScale9=this.cScale9||B(this.primaryColor,{h:270}),this.cScale10=this.cScale10||B(this.primaryColor,{h:300}),this.cScale11=this.cScale11||B(this.primaryColor,{h:330}),this.darkMode)for(let r=0;r<this.THEME_COLOR_LIMIT;r++)this["cScale"+r]=ut(this["cScale"+r],75);else for(let r=0;r<this.THEME_COLOR_LIMIT;r++)this["cScale"+r]=ut(this["cScale"+r],25);for(let r=0;r<this.THEME_COLOR_LIMIT;r++)this["cScaleInv"+r]=this["cScaleInv"+r]||Z(this["cScale"+r]);for(let r=0;r<this.THEME_COLOR_LIMIT;r++)this.darkMode?this["cScalePeer"+r]=this["cScalePeer"+r]||nt(this["cScale"+r],10):this["cScalePeer"+r]=this["cScalePeer"+r]||ut(this["cScale"+r],10);this.scaleLabelColor=this.scaleLabelColor||this.labelTextColor;for(let r=0;r<this.THEME_COLOR_LIMIT;r++)this["cScaleLabel"+r]=this["cScaleLabel"+r]||this.scaleLabelColor;const t=this.darkMode?-4:-1;for(let r=0;r<5;r++)this["surface"+r]=this["surface"+r]||B(this.mainBkg,{h:180,s:-15,l:t*(5+r*3)}),this["surfacePeer"+r]=this["surfacePeer"+r]||B(this.mainBkg,{h:180,s:-15,l:t*(8+r*3)});this.classText=this.classText||this.textColor,this.fillType0=this.fillType0||this.primaryColor,this.fillType1=this.fillType1||this.secondaryColor,this.fillType2=this.fillType2||B(this.primaryColor,{h:64}),this.fillType3=this.fillType3||B(this.secondaryColor,{h:64}),this.fillType4=this.fillType4||B(this.primaryColor,{h:-64}),this.fillType5=this.fillType5||B(this.secondaryColor,{h:-64}),this.fillType6=this.fillType6||B(this.primaryColor,{h:128}),this.fillType7=this.fillType7||B(this.secondaryColor,{h:128}),this.pie1=this.pie1||this.primaryColor,this.pie2=this.pie2||this.secondaryColor,this.pie3=this.pie3||this.tertiaryColor,this.pie4=this.pie4||B(this.primaryColor,{l:-10}),this.pie5=this.pie5||B(this.secondaryColor,{l:-10}),this.pie6=this.pie6||B(this.tertiaryColor,{l:-10}),this.pie7=this.pie7||B(this.primaryColor,{h:60,l:-10}),this.pie8=this.pie8||B(this.primaryColor,{h:-60,l:-10}),this.pie9=this.pie9||B(this.primaryColor,{h:120,l:0}),this.pie10=this.pie10||B(this.primaryColor,{h:60,l:-20}),this.pie11=this.pie11||B(this.primaryColor,{h:-60,l:-20}),this.pie12=this.pie12||B(this.primaryColor,{h:120,l:-10}),this.pieTitleTextSize=this.pieTitleTextSize||"25px",this.pieTitleTextColor=this.pieTitleTextColor||this.taskTextDarkColor,this.pieSectionTextSize=this.pieSectionTextSize||"17px",this.pieSectionTextColor=this.pieSectionTextColor||this.textColor,this.pieLegendTextSize=this.pieLegendTextSize||"17px",this.pieLegendTextColor=this.pieLegendTextColor||this.taskTextDarkColor,this.pieStrokeColor=this.pieStrokeColor||"black",this.pieStrokeWidth=this.pieStrokeWidth||"2px",this.pieOuterStrokeWidth=this.pieOuterStrokeWidth||"2px",this.pieOuterStrokeColor=this.pieOuterStrokeColor||"black",this.pieOpacity=this.pieOpacity||"0.7",this.radar={axisColor:this.radar?.axisColor||this.lineColor,axisStrokeWidth:this.radar?.axisStrokeWidth||2,axisLabelFontSize:this.radar?.axisLabelFontSize||12,curveOpacity:this.radar?.curveOpacity||.5,curveStrokeWidth:this.radar?.curveStrokeWidth||2,graticuleColor:this.radar?.graticuleColor||"#DEDEDE",graticuleStrokeWidth:this.radar?.graticuleStrokeWidth||1,graticuleOpacity:this.radar?.graticuleOpacity||.3,legendBoxSize:this.radar?.legendBoxSize||12,legendFontSize:this.radar?.legendFontSize||12},this.archEdgeColor=this.archEdgeColor||"#777",this.archEdgeArrowColor=this.archEdgeArrowColor||"#777",this.archEdgeWidth=this.archEdgeWidth||"3",this.archGroupBorderColor=this.archGroupBorderColor||"#000",this.archGroupBorderWidth=this.archGroupBorderWidth||"2px",this.quadrant1Fill=this.quadrant1Fill||this.primaryColor,this.quadrant2Fill=this.quadrant2Fill||B(this.primaryColor,{r:5,g:5,b:5}),this.quadrant3Fill=this.quadrant3Fill||B(this.primaryColor,{r:10,g:10,b:10}),this.quadrant4Fill=this.quadrant4Fill||B(this.primaryColor,{r:15,g:15,b:15}),this.quadrant1TextFill=this.quadrant1TextFill||this.primaryTextColor,this.quadrant2TextFill=this.quadrant2TextFill||B(this.primaryTextColor,{r:-5,g:-5,b:-5}),this.quadrant3TextFill=this.quadrant3TextFill||B(this.primaryTextColor,{r:-10,g:-10,b:-10}),this.quadrant4TextFill=this.quadrant4TextFill||B(this.primaryTextColor,{r:-15,g:-15,b:-15}),this.quadrantPointFill=this.quadrantPointFill||sa(this.quadrant1Fill)?nt(this.quadrant1Fill):ut(this.quadrant1Fill),this.quadrantPointTextFill=this.quadrantPointTextFill||this.primaryTextColor,this.quadrantXAxisTextFill=this.quadrantXAxisTextFill||this.primaryTextColor,this.quadrantYAxisTextFill=this.quadrantYAxisTextFill||this.primaryTextColor,this.quadrantInternalBorderStrokeFill=this.quadrantInternalBorderStrokeFill||this.primaryBorderColor,this.quadrantExternalBorderStrokeFill=this.quadrantExternalBorderStrokeFill||this.primaryBorderColor,this.quadrantTitleFill=this.quadrantTitleFill||this.primaryTextColor,this.xyChart={backgroundColor:this.xyChart?.backgroundColor||this.background,titleColor:this.xyChart?.titleColor||this.primaryTextColor,xAxisTitleColor:this.xyChart?.xAxisTitleColor||this.primaryTextColor,xAxisLabelColor:this.xyChart?.xAxisLabelColor||this.primaryTextColor,xAxisTickColor:this.xyChart?.xAxisTickColor||this.primaryTextColor,xAxisLineColor:this.xyChart?.xAxisLineColor||this.primaryTextColor,yAxisTitleColor:this.xyChart?.yAxisTitleColor||this.primaryTextColor,yAxisLabelColor:this.xyChart?.yAxisLabelColor||this.primaryTextColor,yAxisTickColor:this.xyChart?.yAxisTickColor||this.primaryTextColor,yAxisLineColor:this.xyChart?.yAxisLineColor||this.primaryTextColor,plotColorPalette:this.xyChart?.plotColorPalette||"#FFF4DD,#FFD8B1,#FFA07A,#ECEFF1,#D6DBDF,#C3E0A8,#FFB6A4,#FFD74D,#738FA7,#FFFFF0"},this.requirementBackground=this.requirementBackground||this.primaryColor,this.requirementBorderColor=this.requirementBorderColor||this.primaryBorderColor,this.requirementBorderSize=this.requirementBorderSize||"1",this.requirementTextColor=this.requirementTextColor||this.primaryTextColor,this.relationColor=this.relationColor||this.lineColor,this.relationLabelBackground=this.relationLabelBackground||(this.darkMode?ut(this.secondaryColor,30):this.secondaryColor),this.relationLabelColor=this.relationLabelColor||this.actorTextColor,this.git0=this.git0||this.primaryColor,this.git1=this.git1||this.secondaryColor,this.git2=this.git2||this.tertiaryColor,this.git3=this.git3||B(this.primaryColor,{h:-30}),this.git4=this.git4||B(this.primaryColor,{h:-60}),this.git5=this.git5||B(this.primaryColor,{h:-90}),this.git6=this.git6||B(this.primaryColor,{h:60}),this.git7=this.git7||B(this.primaryColor,{h:120}),this.darkMode?(this.git0=nt(this.git0,25),this.git1=nt(this.git1,25),this.git2=nt(this.git2,25),this.git3=nt(this.git3,25),this.git4=nt(this.git4,25),this.git5=nt(this.git5,25),this.git6=nt(this.git6,25),this.git7=nt(this.git7,25)):(this.git0=ut(this.git0,25),this.git1=ut(this.git1,25),this.git2=ut(this.git2,25),this.git3=ut(this.git3,25),this.git4=ut(this.git4,25),this.git5=ut(this.git5,25),this.git6=ut(this.git6,25),this.git7=ut(this.git7,25)),this.gitInv0=this.gitInv0||Z(this.git0),this.gitInv1=this.gitInv1||Z(this.git1),this.gitInv2=this.gitInv2||Z(this.git2),this.gitInv3=this.gitInv3||Z(this.git3),this.gitInv4=this.gitInv4||Z(this.git4),this.gitInv5=this.gitInv5||Z(this.git5),this.gitInv6=this.gitInv6||Z(this.git6),this.gitInv7=this.gitInv7||Z(this.git7),this.branchLabelColor=this.branchLabelColor||(this.darkMode?"black":this.labelTextColor),this.gitBranchLabel0=this.gitBranchLabel0||this.branchLabelColor,this.gitBranchLabel1=this.gitBranchLabel1||this.branchLabelColor,this.gitBranchLabel2=this.gitBranchLabel2||this.branchLabelColor,this.gitBranchLabel3=this.gitBranchLabel3||this.branchLabelColor,this.gitBranchLabel4=this.gitBranchLabel4||this.branchLabelColor,this.gitBranchLabel5=this.gitBranchLabel5||this.branchLabelColor,this.gitBranchLabel6=this.gitBranchLabel6||this.branchLabelColor,this.gitBranchLabel7=this.gitBranchLabel7||this.branchLabelColor,this.tagLabelColor=this.tagLabelColor||this.primaryTextColor,this.tagLabelBackground=this.tagLabelBackground||this.primaryColor,this.tagLabelBorder=this.tagBorder||this.primaryBorderColor,this.tagLabelFontSize=this.tagLabelFontSize||"10px",this.commitLabelColor=this.commitLabelColor||this.secondaryTextColor,this.commitLabelBackground=this.commitLabelBackground||this.secondaryColor,this.commitLabelFontSize=this.commitLabelFontSize||"10px",this.attributeBackgroundColorOdd=this.attributeBackgroundColorOdd||yc,this.attributeBackgroundColorEven=this.attributeBackgroundColorEven||vc}calculate(t){if(typeof t!="object"){this.updateColors();return}const r=Object.keys(t);r.forEach(i=>{this[i]=t[i]}),this.updateColors(),r.forEach(i=>{this[i]=t[i]})}},m(es,"Theme"),es),eA=m(e=>{const t=new tA;return t.calculate(e),t},"getThemeVariables"),rs,rA=(rs=class{constructor(){this.background="#333",this.primaryColor="#1f2020",this.secondaryColor=nt(this.primaryColor,16),this.tertiaryColor=B(this.primaryColor,{h:-160}),this.primaryBorderColor=Z(this.background),this.secondaryBorderColor=Fe(this.secondaryColor,this.darkMode),this.tertiaryBorderColor=Fe(this.tertiaryColor,this.darkMode),this.primaryTextColor=Z(this.primaryColor),this.secondaryTextColor=Z(this.secondaryColor),this.tertiaryTextColor=Z(this.tertiaryColor),this.lineColor=Z(this.background),this.textColor=Z(this.background),this.mainBkg="#1f2020",this.secondBkg="calculated",this.mainContrastColor="lightgrey",this.darkTextColor=nt(Z("#323D47"),10),this.lineColor="calculated",this.border1="#ccc",this.border2=So(255,255,255,.25),this.arrowheadColor="calculated",this.fontFamily='"trebuchet ms", verdana, arial, sans-serif',this.fontSize="16px",this.labelBackground="#181818",this.textColor="#ccc",this.THEME_COLOR_LIMIT=12,this.nodeBkg="calculated",this.nodeBorder="calculated",this.clusterBkg="calculated",this.clusterBorder="calculated",this.defaultLinkColor="calculated",this.titleColor="#F9FFFE",this.edgeLabelBackground="calculated",this.actorBorder="calculated",this.actorBkg="calculated",this.actorTextColor="calculated",this.actorLineColor="calculated",this.signalColor="calculated",this.signalTextColor="calculated",this.labelBoxBkgColor="calculated",this.labelBoxBorderColor="calculated",this.labelTextColor="calculated",this.loopTextColor="calculated",this.noteBorderColor="calculated",this.noteBkgColor="#fff5ad",this.noteTextColor="calculated",this.activationBorderColor="calculated",this.activationBkgColor="calculated",this.sequenceNumberColor="black",this.sectionBkgColor=ut("#EAE8D9",30),this.altSectionBkgColor="calculated",this.sectionBkgColor2="#EAE8D9",this.excludeBkgColor=ut(this.sectionBkgColor,10),this.taskBorderColor=So(255,255,255,70),this.taskBkgColor="calculated",this.taskTextColor="calculated",this.taskTextLightColor="calculated",this.taskTextOutsideColor="calculated",this.taskTextClickableColor="#003163",this.activeTaskBorderColor=So(255,255,255,50),this.activeTaskBkgColor="#81B1DB",this.gridColor="calculated",this.doneTaskBkgColor="calculated",this.doneTaskBorderColor="grey",this.critBorderColor="#E83737",this.critBkgColor="#E83737",this.taskTextDarkColor="calculated",this.todayLineColor="#DB5757",this.vertLineColor="#00BFFF",this.personBorder=this.primaryBorderColor,this.personBkg=this.mainBkg,this.archEdgeColor="calculated",this.archEdgeArrowColor="calculated",this.archEdgeWidth="3",this.archGroupBorderColor=this.primaryBorderColor,this.archGroupBorderWidth="2px",this.rowOdd=this.rowOdd||nt(this.mainBkg,5)||"#ffffff",this.rowEven=this.rowEven||ut(this.mainBkg,10),this.labelColor="calculated",this.errorBkgColor="#a44141",this.errorTextColor="#ddd"}updateColors(){this.secondBkg=nt(this.mainBkg,16),this.lineColor=this.mainContrastColor,this.arrowheadColor=this.mainContrastColor,this.nodeBkg=this.mainBkg,this.nodeBorder=this.border1,this.clusterBkg=this.secondBkg,this.clusterBorder=this.border2,this.defaultLinkColor=this.lineColor,this.edgeLabelBackground=nt(this.labelBackground,25),this.actorBorder=this.border1,this.actorBkg=this.mainBkg,this.actorTextColor=this.mainContrastColor,this.actorLineColor=this.actorBorder,this.signalColor=this.mainContrastColor,this.signalTextColor=this.mainContrastColor,this.labelBoxBkgColor=this.actorBkg,this.labelBoxBorderColor=this.actorBorder,this.labelTextColor=this.mainContrastColor,this.loopTextColor=this.mainContrastColor,this.noteBorderColor=this.secondaryBorderColor,this.noteBkgColor=this.secondBkg,this.noteTextColor=this.secondaryTextColor,this.activationBorderColor=this.border1,this.activationBkgColor=this.secondBkg,this.altSectionBkgColor=this.background,this.taskBkgColor=nt(this.mainBkg,23),this.taskTextColor=this.darkTextColor,this.taskTextLightColor=this.mainContrastColor,this.taskTextOutsideColor=this.taskTextLightColor,this.gridColor=this.mainContrastColor,this.doneTaskBkgColor=this.mainContrastColor,this.taskTextDarkColor=this.darkTextColor,this.archEdgeColor=this.lineColor,this.archEdgeArrowColor=this.lineColor,this.transitionColor=this.transitionColor||this.lineColor,this.transitionLabelColor=this.transitionLabelColor||this.textColor,this.stateLabelColor=this.stateLabelColor||this.stateBkg||this.primaryTextColor,this.stateBkg=this.stateBkg||this.mainBkg,this.labelBackgroundColor=this.labelBackgroundColor||this.stateBkg,this.compositeBackground=this.compositeBackground||this.background||this.tertiaryColor,this.altBackground=this.altBackground||"#555",this.compositeTitleBackground=this.compositeTitleBackground||this.mainBkg,this.compositeBorder=this.compositeBorder||this.nodeBorder,this.innerEndBackground=this.primaryBorderColor,this.specialStateColor="#f4f4f4",this.errorBkgColor=this.errorBkgColor||this.tertiaryColor,this.errorTextColor=this.errorTextColor||this.tertiaryTextColor,this.fillType0=this.primaryColor,this.fillType1=this.secondaryColor,this.fillType2=B(this.primaryColor,{h:64}),this.fillType3=B(this.secondaryColor,{h:64}),this.fillType4=B(this.primaryColor,{h:-64}),this.fillType5=B(this.secondaryColor,{h:-64}),this.fillType6=B(this.primaryColor,{h:128}),this.fillType7=B(this.secondaryColor,{h:128}),this.cScale1=this.cScale1||"#0b0000",this.cScale2=this.cScale2||"#4d1037",this.cScale3=this.cScale3||"#3f5258",this.cScale4=this.cScale4||"#4f2f1b",this.cScale5=this.cScale5||"#6e0a0a",this.cScale6=this.cScale6||"#3b0048",this.cScale7=this.cScale7||"#995a01",this.cScale8=this.cScale8||"#154706",this.cScale9=this.cScale9||"#161722",this.cScale10=this.cScale10||"#00296f",this.cScale11=this.cScale11||"#01629c",this.cScale12=this.cScale12||"#010029",this.cScale0=this.cScale0||this.primaryColor,this.cScale1=this.cScale1||this.secondaryColor,this.cScale2=this.cScale2||this.tertiaryColor,this.cScale3=this.cScale3||B(this.primaryColor,{h:30}),this.cScale4=this.cScale4||B(this.primaryColor,{h:60}),this.cScale5=this.cScale5||B(this.primaryColor,{h:90}),this.cScale6=this.cScale6||B(this.primaryColor,{h:120}),this.cScale7=this.cScale7||B(this.primaryColor,{h:150}),this.cScale8=this.cScale8||B(this.primaryColor,{h:210}),this.cScale9=this.cScale9||B(this.primaryColor,{h:270}),this.cScale10=this.cScale10||B(this.primaryColor,{h:300}),this.cScale11=this.cScale11||B(this.primaryColor,{h:330});for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["cScaleInv"+t]=this["cScaleInv"+t]||Z(this["cScale"+t]);for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["cScalePeer"+t]=this["cScalePeer"+t]||nt(this["cScale"+t],10);for(let t=0;t<5;t++)this["surface"+t]=this["surface"+t]||B(this.mainBkg,{h:30,s:-30,l:-(-10+t*4)}),this["surfacePeer"+t]=this["surfacePeer"+t]||B(this.mainBkg,{h:30,s:-30,l:-(-7+t*4)});this.scaleLabelColor=this.scaleLabelColor||(this.darkMode?"black":this.labelTextColor);for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["cScaleLabel"+t]=this["cScaleLabel"+t]||this.scaleLabelColor;for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["pie"+t]=this["cScale"+t];this.pieTitleTextSize=this.pieTitleTextSize||"25px",this.pieTitleTextColor=this.pieTitleTextColor||this.taskTextDarkColor,this.pieSectionTextSize=this.pieSectionTextSize||"17px",this.pieSectionTextColor=this.pieSectionTextColor||this.textColor,this.pieLegendTextSize=this.pieLegendTextSize||"17px",this.pieLegendTextColor=this.pieLegendTextColor||this.taskTextDarkColor,this.pieStrokeColor=this.pieStrokeColor||"black",this.pieStrokeWidth=this.pieStrokeWidth||"2px",this.pieOuterStrokeWidth=this.pieOuterStrokeWidth||"2px",this.pieOuterStrokeColor=this.pieOuterStrokeColor||"black",this.pieOpacity=this.pieOpacity||"0.7",this.quadrant1Fill=this.quadrant1Fill||this.primaryColor,this.quadrant2Fill=this.quadrant2Fill||B(this.primaryColor,{r:5,g:5,b:5}),this.quadrant3Fill=this.quadrant3Fill||B(this.primaryColor,{r:10,g:10,b:10}),this.quadrant4Fill=this.quadrant4Fill||B(this.primaryColor,{r:15,g:15,b:15}),this.quadrant1TextFill=this.quadrant1TextFill||this.primaryTextColor,this.quadrant2TextFill=this.quadrant2TextFill||B(this.primaryTextColor,{r:-5,g:-5,b:-5}),this.quadrant3TextFill=this.quadrant3TextFill||B(this.primaryTextColor,{r:-10,g:-10,b:-10}),this.quadrant4TextFill=this.quadrant4TextFill||B(this.primaryTextColor,{r:-15,g:-15,b:-15}),this.quadrantPointFill=this.quadrantPointFill||sa(this.quadrant1Fill)?nt(this.quadrant1Fill):ut(this.quadrant1Fill),this.quadrantPointTextFill=this.quadrantPointTextFill||this.primaryTextColor,this.quadrantXAxisTextFill=this.quadrantXAxisTextFill||this.primaryTextColor,this.quadrantYAxisTextFill=this.quadrantYAxisTextFill||this.primaryTextColor,this.quadrantInternalBorderStrokeFill=this.quadrantInternalBorderStrokeFill||this.primaryBorderColor,this.quadrantExternalBorderStrokeFill=this.quadrantExternalBorderStrokeFill||this.primaryBorderColor,this.quadrantTitleFill=this.quadrantTitleFill||this.primaryTextColor,this.xyChart={backgroundColor:this.xyChart?.backgroundColor||this.background,titleColor:this.xyChart?.titleColor||this.primaryTextColor,xAxisTitleColor:this.xyChart?.xAxisTitleColor||this.primaryTextColor,xAxisLabelColor:this.xyChart?.xAxisLabelColor||this.primaryTextColor,xAxisTickColor:this.xyChart?.xAxisTickColor||this.primaryTextColor,xAxisLineColor:this.xyChart?.xAxisLineColor||this.primaryTextColor,yAxisTitleColor:this.xyChart?.yAxisTitleColor||this.primaryTextColor,yAxisLabelColor:this.xyChart?.yAxisLabelColor||this.primaryTextColor,yAxisTickColor:this.xyChart?.yAxisTickColor||this.primaryTextColor,yAxisLineColor:this.xyChart?.yAxisLineColor||this.primaryTextColor,plotColorPalette:this.xyChart?.plotColorPalette||"#3498db,#2ecc71,#e74c3c,#f1c40f,#bdc3c7,#ffffff,#34495e,#9b59b6,#1abc9c,#e67e22"},this.packet={startByteColor:this.primaryTextColor,endByteColor:this.primaryTextColor,labelColor:this.primaryTextColor,titleColor:this.primaryTextColor,blockStrokeColor:this.primaryTextColor,blockFillColor:this.background},this.radar={axisColor:this.radar?.axisColor||this.lineColor,axisStrokeWidth:this.radar?.axisStrokeWidth||2,axisLabelFontSize:this.radar?.axisLabelFontSize||12,curveOpacity:this.radar?.curveOpacity||.5,curveStrokeWidth:this.radar?.curveStrokeWidth||2,graticuleColor:this.radar?.graticuleColor||"#DEDEDE",graticuleStrokeWidth:this.radar?.graticuleStrokeWidth||1,graticuleOpacity:this.radar?.graticuleOpacity||.3,legendBoxSize:this.radar?.legendBoxSize||12,legendFontSize:this.radar?.legendFontSize||12},this.classText=this.primaryTextColor,this.requirementBackground=this.requirementBackground||this.primaryColor,this.requirementBorderColor=this.requirementBorderColor||this.primaryBorderColor,this.requirementBorderSize=this.requirementBorderSize||"1",this.requirementTextColor=this.requirementTextColor||this.primaryTextColor,this.relationColor=this.relationColor||this.lineColor,this.relationLabelBackground=this.relationLabelBackground||(this.darkMode?ut(this.secondaryColor,30):this.secondaryColor),this.relationLabelColor=this.relationLabelColor||this.actorTextColor,this.git0=nt(this.secondaryColor,20),this.git1=nt(this.pie2||this.secondaryColor,20),this.git2=nt(this.pie3||this.tertiaryColor,20),this.git3=nt(this.pie4||B(this.primaryColor,{h:-30}),20),this.git4=nt(this.pie5||B(this.primaryColor,{h:-60}),20),this.git5=nt(this.pie6||B(this.primaryColor,{h:-90}),10),this.git6=nt(this.pie7||B(this.primaryColor,{h:60}),10),this.git7=nt(this.pie8||B(this.primaryColor,{h:120}),20),this.gitInv0=this.gitInv0||Z(this.git0),this.gitInv1=this.gitInv1||Z(this.git1),this.gitInv2=this.gitInv2||Z(this.git2),this.gitInv3=this.gitInv3||Z(this.git3),this.gitInv4=this.gitInv4||Z(this.git4),this.gitInv5=this.gitInv5||Z(this.git5),this.gitInv6=this.gitInv6||Z(this.git6),this.gitInv7=this.gitInv7||Z(this.git7),this.gitBranchLabel0=this.gitBranchLabel0||Z(this.labelTextColor),this.gitBranchLabel1=this.gitBranchLabel1||this.labelTextColor,this.gitBranchLabel2=this.gitBranchLabel2||this.labelTextColor,this.gitBranchLabel3=this.gitBranchLabel3||Z(this.labelTextColor),this.gitBranchLabel4=this.gitBranchLabel4||this.labelTextColor,this.gitBranchLabel5=this.gitBranchLabel5||this.labelTextColor,this.gitBranchLabel6=this.gitBranchLabel6||this.labelTextColor,this.gitBranchLabel7=this.gitBranchLabel7||this.labelTextColor,this.tagLabelColor=this.tagLabelColor||this.primaryTextColor,this.tagLabelBackground=this.tagLabelBackground||this.primaryColor,this.tagLabelBorder=this.tagBorder||this.primaryBorderColor,this.tagLabelFontSize=this.tagLabelFontSize||"10px",this.commitLabelColor=this.commitLabelColor||this.secondaryTextColor,this.commitLabelBackground=this.commitLabelBackground||this.secondaryColor,this.commitLabelFontSize=this.commitLabelFontSize||"10px",this.attributeBackgroundColorOdd=this.attributeBackgroundColorOdd||nt(this.background,12),this.attributeBackgroundColorEven=this.attributeBackgroundColorEven||nt(this.background,2),this.nodeBorder=this.nodeBorder||"#999"}calculate(t){if(typeof t!="object"){this.updateColors();return}const r=Object.keys(t);r.forEach(i=>{this[i]=t[i]}),this.updateColors(),r.forEach(i=>{this[i]=t[i]})}},m(rs,"Theme"),rs),iA=m(e=>{const t=new rA;return t.calculate(e),t},"getThemeVariables"),is,nA=(is=class{constructor(){this.background="#f4f4f4",this.primaryColor="#ECECFF",this.secondaryColor=B(this.primaryColor,{h:120}),this.secondaryColor="#ffffde",this.tertiaryColor=B(this.primaryColor,{h:-160}),this.primaryBorderColor=Fe(this.primaryColor,this.darkMode),this.secondaryBorderColor=Fe(this.secondaryColor,this.darkMode),this.tertiaryBorderColor=Fe(this.tertiaryColor,this.darkMode),this.primaryTextColor=Z(this.primaryColor),this.secondaryTextColor=Z(this.secondaryColor),this.tertiaryTextColor=Z(this.tertiaryColor),this.lineColor=Z(this.background),this.textColor=Z(this.background),this.background="white",this.mainBkg="#ECECFF",this.secondBkg="#ffffde",this.lineColor="#333333",this.border1="#9370DB",this.border2="#aaaa33",this.arrowheadColor="#333333",this.fontFamily='"trebuchet ms", verdana, arial, sans-serif',this.fontSize="16px",this.labelBackground="rgba(232,232,232, 0.8)",this.textColor="#333",this.THEME_COLOR_LIMIT=12,this.nodeBkg="calculated",this.nodeBorder="calculated",this.clusterBkg="calculated",this.clusterBorder="calculated",this.defaultLinkColor="calculated",this.titleColor="calculated",this.edgeLabelBackground="calculated",this.actorBorder="calculated",this.actorBkg="calculated",this.actorTextColor="black",this.actorLineColor="calculated",this.signalColor="calculated",this.signalTextColor="calculated",this.labelBoxBkgColor="calculated",this.labelBoxBorderColor="calculated",this.labelTextColor="calculated",this.loopTextColor="calculated",this.noteBorderColor="calculated",this.noteBkgColor="#fff5ad",this.noteTextColor="calculated",this.activationBorderColor="#666",this.activationBkgColor="#f4f4f4",this.sequenceNumberColor="white",this.sectionBkgColor="calculated",this.altSectionBkgColor="calculated",this.sectionBkgColor2="calculated",this.excludeBkgColor="#eeeeee",this.taskBorderColor="calculated",this.taskBkgColor="calculated",this.taskTextLightColor="calculated",this.taskTextColor=this.taskTextLightColor,this.taskTextDarkColor="calculated",this.taskTextOutsideColor=this.taskTextDarkColor,this.taskTextClickableColor="calculated",this.activeTaskBorderColor="calculated",this.activeTaskBkgColor="calculated",this.gridColor="calculated",this.doneTaskBkgColor="calculated",this.doneTaskBorderColor="calculated",this.critBorderColor="calculated",this.critBkgColor="calculated",this.todayLineColor="calculated",this.vertLineColor="calculated",this.sectionBkgColor=So(102,102,255,.49),this.altSectionBkgColor="white",this.sectionBkgColor2="#fff400",this.taskBorderColor="#534fbc",this.taskBkgColor="#8a90dd",this.taskTextLightColor="white",this.taskTextColor="calculated",this.taskTextDarkColor="black",this.taskTextOutsideColor="calculated",this.taskTextClickableColor="#003163",this.activeTaskBorderColor="#534fbc",this.activeTaskBkgColor="#bfc7ff",this.gridColor="lightgrey",this.doneTaskBkgColor="lightgrey",this.doneTaskBorderColor="grey",this.critBorderColor="#ff8888",this.critBkgColor="red",this.todayLineColor="red",this.vertLineColor="navy",this.personBorder=this.primaryBorderColor,this.personBkg=this.mainBkg,this.archEdgeColor="calculated",this.archEdgeArrowColor="calculated",this.archEdgeWidth="3",this.archGroupBorderColor=this.primaryBorderColor,this.archGroupBorderWidth="2px",this.rowOdd="calculated",this.rowEven="calculated",this.labelColor="black",this.errorBkgColor="#552222",this.errorTextColor="#552222",this.updateColors()}updateColors(){this.cScale0=this.cScale0||this.primaryColor,this.cScale1=this.cScale1||this.secondaryColor,this.cScale2=this.cScale2||this.tertiaryColor,this.cScale3=this.cScale3||B(this.primaryColor,{h:30}),this.cScale4=this.cScale4||B(this.primaryColor,{h:60}),this.cScale5=this.cScale5||B(this.primaryColor,{h:90}),this.cScale6=this.cScale6||B(this.primaryColor,{h:120}),this.cScale7=this.cScale7||B(this.primaryColor,{h:150}),this.cScale8=this.cScale8||B(this.primaryColor,{h:210}),this.cScale9=this.cScale9||B(this.primaryColor,{h:270}),this.cScale10=this.cScale10||B(this.primaryColor,{h:300}),this.cScale11=this.cScale11||B(this.primaryColor,{h:330}),this.cScalePeer1=this.cScalePeer1||ut(this.secondaryColor,45),this.cScalePeer2=this.cScalePeer2||ut(this.tertiaryColor,40);for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["cScale"+t]=ut(this["cScale"+t],10),this["cScalePeer"+t]=this["cScalePeer"+t]||ut(this["cScale"+t],25);for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["cScaleInv"+t]=this["cScaleInv"+t]||B(this["cScale"+t],{h:180});for(let t=0;t<5;t++)this["surface"+t]=this["surface"+t]||B(this.mainBkg,{h:30,l:-(5+t*5)}),this["surfacePeer"+t]=this["surfacePeer"+t]||B(this.mainBkg,{h:30,l:-(7+t*5)});if(this.scaleLabelColor=this.scaleLabelColor!=="calculated"&&this.scaleLabelColor?this.scaleLabelColor:this.labelTextColor,this.labelTextColor!=="calculated"){this.cScaleLabel0=this.cScaleLabel0||Z(this.labelTextColor),this.cScaleLabel3=this.cScaleLabel3||Z(this.labelTextColor);for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["cScaleLabel"+t]=this["cScaleLabel"+t]||this.labelTextColor}this.nodeBkg=this.mainBkg,this.nodeBorder=this.border1,this.clusterBkg=this.secondBkg,this.clusterBorder=this.border2,this.defaultLinkColor=this.lineColor,this.titleColor=this.textColor,this.edgeLabelBackground=this.labelBackground,this.actorBorder=nt(this.border1,23),this.actorBkg=this.mainBkg,this.labelBoxBkgColor=this.actorBkg,this.signalColor=this.textColor,this.signalTextColor=this.textColor,this.labelBoxBorderColor=this.actorBorder,this.labelTextColor=this.actorTextColor,this.loopTextColor=this.actorTextColor,this.noteBorderColor=this.border2,this.noteTextColor=this.actorTextColor,this.actorLineColor=this.actorBorder,this.taskTextColor=this.taskTextLightColor,this.taskTextOutsideColor=this.taskTextDarkColor,this.archEdgeColor=this.lineColor,this.archEdgeArrowColor=this.lineColor,this.rowOdd=this.rowOdd||nt(this.primaryColor,75)||"#ffffff",this.rowEven=this.rowEven||nt(this.primaryColor,1),this.transitionColor=this.transitionColor||this.lineColor,this.transitionLabelColor=this.transitionLabelColor||this.textColor,this.stateLabelColor=this.stateLabelColor||this.stateBkg||this.primaryTextColor,this.stateBkg=this.stateBkg||this.mainBkg,this.labelBackgroundColor=this.labelBackgroundColor||this.stateBkg,this.compositeBackground=this.compositeBackground||this.background||this.tertiaryColor,this.altBackground=this.altBackground||"#f0f0f0",this.compositeTitleBackground=this.compositeTitleBackground||this.mainBkg,this.compositeBorder=this.compositeBorder||this.nodeBorder,this.innerEndBackground=this.nodeBorder,this.specialStateColor=this.lineColor,this.errorBkgColor=this.errorBkgColor||this.tertiaryColor,this.errorTextColor=this.errorTextColor||this.tertiaryTextColor,this.transitionColor=this.transitionColor||this.lineColor,this.classText=this.primaryTextColor,this.fillType0=this.primaryColor,this.fillType1=this.secondaryColor,this.fillType2=B(this.primaryColor,{h:64}),this.fillType3=B(this.secondaryColor,{h:64}),this.fillType4=B(this.primaryColor,{h:-64}),this.fillType5=B(this.secondaryColor,{h:-64}),this.fillType6=B(this.primaryColor,{h:128}),this.fillType7=B(this.secondaryColor,{h:128}),this.pie1=this.pie1||this.primaryColor,this.pie2=this.pie2||this.secondaryColor,this.pie3=this.pie3||B(this.tertiaryColor,{l:-40}),this.pie4=this.pie4||B(this.primaryColor,{l:-10}),this.pie5=this.pie5||B(this.secondaryColor,{l:-30}),this.pie6=this.pie6||B(this.tertiaryColor,{l:-20}),this.pie7=this.pie7||B(this.primaryColor,{h:60,l:-20}),this.pie8=this.pie8||B(this.primaryColor,{h:-60,l:-40}),this.pie9=this.pie9||B(this.primaryColor,{h:120,l:-40}),this.pie10=this.pie10||B(this.primaryColor,{h:60,l:-40}),this.pie11=this.pie11||B(this.primaryColor,{h:-90,l:-40}),this.pie12=this.pie12||B(this.primaryColor,{h:120,l:-30}),this.pieTitleTextSize=this.pieTitleTextSize||"25px",this.pieTitleTextColor=this.pieTitleTextColor||this.taskTextDarkColor,this.pieSectionTextSize=this.pieSectionTextSize||"17px",this.pieSectionTextColor=this.pieSectionTextColor||this.textColor,this.pieLegendTextSize=this.pieLegendTextSize||"17px",this.pieLegendTextColor=this.pieLegendTextColor||this.taskTextDarkColor,this.pieStrokeColor=this.pieStrokeColor||"black",this.pieStrokeWidth=this.pieStrokeWidth||"2px",this.pieOuterStrokeWidth=this.pieOuterStrokeWidth||"2px",this.pieOuterStrokeColor=this.pieOuterStrokeColor||"black",this.pieOpacity=this.pieOpacity||"0.7",this.quadrant1Fill=this.quadrant1Fill||this.primaryColor,this.quadrant2Fill=this.quadrant2Fill||B(this.primaryColor,{r:5,g:5,b:5}),this.quadrant3Fill=this.quadrant3Fill||B(this.primaryColor,{r:10,g:10,b:10}),this.quadrant4Fill=this.quadrant4Fill||B(this.primaryColor,{r:15,g:15,b:15}),this.quadrant1TextFill=this.quadrant1TextFill||this.primaryTextColor,this.quadrant2TextFill=this.quadrant2TextFill||B(this.primaryTextColor,{r:-5,g:-5,b:-5}),this.quadrant3TextFill=this.quadrant3TextFill||B(this.primaryTextColor,{r:-10,g:-10,b:-10}),this.quadrant4TextFill=this.quadrant4TextFill||B(this.primaryTextColor,{r:-15,g:-15,b:-15}),this.quadrantPointFill=this.quadrantPointFill||sa(this.quadrant1Fill)?nt(this.quadrant1Fill):ut(this.quadrant1Fill),this.quadrantPointTextFill=this.quadrantPointTextFill||this.primaryTextColor,this.quadrantXAxisTextFill=this.quadrantXAxisTextFill||this.primaryTextColor,this.quadrantYAxisTextFill=this.quadrantYAxisTextFill||this.primaryTextColor,this.quadrantInternalBorderStrokeFill=this.quadrantInternalBorderStrokeFill||this.primaryBorderColor,this.quadrantExternalBorderStrokeFill=this.quadrantExternalBorderStrokeFill||this.primaryBorderColor,this.quadrantTitleFill=this.quadrantTitleFill||this.primaryTextColor,this.radar={axisColor:this.radar?.axisColor||this.lineColor,axisStrokeWidth:this.radar?.axisStrokeWidth||2,axisLabelFontSize:this.radar?.axisLabelFontSize||12,curveOpacity:this.radar?.curveOpacity||.5,curveStrokeWidth:this.radar?.curveStrokeWidth||2,graticuleColor:this.radar?.graticuleColor||"#DEDEDE",graticuleStrokeWidth:this.radar?.graticuleStrokeWidth||1,graticuleOpacity:this.radar?.graticuleOpacity||.3,legendBoxSize:this.radar?.legendBoxSize||12,legendFontSize:this.radar?.legendFontSize||12},this.xyChart={backgroundColor:this.xyChart?.backgroundColor||this.background,titleColor:this.xyChart?.titleColor||this.primaryTextColor,xAxisTitleColor:this.xyChart?.xAxisTitleColor||this.primaryTextColor,xAxisLabelColor:this.xyChart?.xAxisLabelColor||this.primaryTextColor,xAxisTickColor:this.xyChart?.xAxisTickColor||this.primaryTextColor,xAxisLineColor:this.xyChart?.xAxisLineColor||this.primaryTextColor,yAxisTitleColor:this.xyChart?.yAxisTitleColor||this.primaryTextColor,yAxisLabelColor:this.xyChart?.yAxisLabelColor||this.primaryTextColor,yAxisTickColor:this.xyChart?.yAxisTickColor||this.primaryTextColor,yAxisLineColor:this.xyChart?.yAxisLineColor||this.primaryTextColor,plotColorPalette:this.xyChart?.plotColorPalette||"#ECECFF,#8493A6,#FFC3A0,#DCDDE1,#B8E994,#D1A36F,#C3CDE6,#FFB6C1,#496078,#F8F3E3"},this.requirementBackground=this.requirementBackground||this.primaryColor,this.requirementBorderColor=this.requirementBorderColor||this.primaryBorderColor,this.requirementBorderSize=this.requirementBorderSize||"1",this.requirementTextColor=this.requirementTextColor||this.primaryTextColor,this.relationColor=this.relationColor||this.lineColor,this.relationLabelBackground=this.relationLabelBackground||this.labelBackground,this.relationLabelColor=this.relationLabelColor||this.actorTextColor,this.git0=this.git0||this.primaryColor,this.git1=this.git1||this.secondaryColor,this.git2=this.git2||this.tertiaryColor,this.git3=this.git3||B(this.primaryColor,{h:-30}),this.git4=this.git4||B(this.primaryColor,{h:-60}),this.git5=this.git5||B(this.primaryColor,{h:-90}),this.git6=this.git6||B(this.primaryColor,{h:60}),this.git7=this.git7||B(this.primaryColor,{h:120}),this.darkMode?(this.git0=nt(this.git0,25),this.git1=nt(this.git1,25),this.git2=nt(this.git2,25),this.git3=nt(this.git3,25),this.git4=nt(this.git4,25),this.git5=nt(this.git5,25),this.git6=nt(this.git6,25),this.git7=nt(this.git7,25)):(this.git0=ut(this.git0,25),this.git1=ut(this.git1,25),this.git2=ut(this.git2,25),this.git3=ut(this.git3,25),this.git4=ut(this.git4,25),this.git5=ut(this.git5,25),this.git6=ut(this.git6,25),this.git7=ut(this.git7,25)),this.gitInv0=this.gitInv0||ut(Z(this.git0),25),this.gitInv1=this.gitInv1||Z(this.git1),this.gitInv2=this.gitInv2||Z(this.git2),this.gitInv3=this.gitInv3||Z(this.git3),this.gitInv4=this.gitInv4||Z(this.git4),this.gitInv5=this.gitInv5||Z(this.git5),this.gitInv6=this.gitInv6||Z(this.git6),this.gitInv7=this.gitInv7||Z(this.git7),this.gitBranchLabel0=this.gitBranchLabel0||Z(this.labelTextColor),this.gitBranchLabel1=this.gitBranchLabel1||this.labelTextColor,this.gitBranchLabel2=this.gitBranchLabel2||this.labelTextColor,this.gitBranchLabel3=this.gitBranchLabel3||Z(this.labelTextColor),this.gitBranchLabel4=this.gitBranchLabel4||this.labelTextColor,this.gitBranchLabel5=this.gitBranchLabel5||this.labelTextColor,this.gitBranchLabel6=this.gitBranchLabel6||this.labelTextColor,this.gitBranchLabel7=this.gitBranchLabel7||this.labelTextColor,this.tagLabelColor=this.tagLabelColor||this.primaryTextColor,this.tagLabelBackground=this.tagLabelBackground||this.primaryColor,this.tagLabelBorder=this.tagBorder||this.primaryBorderColor,this.tagLabelFontSize=this.tagLabelFontSize||"10px",this.commitLabelColor=this.commitLabelColor||this.secondaryTextColor,this.commitLabelBackground=this.commitLabelBackground||this.secondaryColor,this.commitLabelFontSize=this.commitLabelFontSize||"10px",this.attributeBackgroundColorOdd=this.attributeBackgroundColorOdd||yc,this.attributeBackgroundColorEven=this.attributeBackgroundColorEven||vc}calculate(t){if(Object.keys(this).forEach(i=>{this[i]==="calculated"&&(this[i]=void 0)}),typeof t!="object"){this.updateColors();return}const r=Object.keys(t);r.forEach(i=>{this[i]=t[i]}),this.updateColors(),r.forEach(i=>{this[i]=t[i]})}},m(is,"Theme"),is),sA=m(e=>{const t=new nA;return t.calculate(e),t},"getThemeVariables"),ns,oA=(ns=class{constructor(){this.background="#f4f4f4",this.primaryColor="#cde498",this.secondaryColor="#cdffb2",this.background="white",this.mainBkg="#cde498",this.secondBkg="#cdffb2",this.lineColor="green",this.border1="#13540c",this.border2="#6eaa49",this.arrowheadColor="green",this.fontFamily='"trebuchet ms", verdana, arial, sans-serif',this.fontSize="16px",this.tertiaryColor=nt("#cde498",10),this.primaryBorderColor=Fe(this.primaryColor,this.darkMode),this.secondaryBorderColor=Fe(this.secondaryColor,this.darkMode),this.tertiaryBorderColor=Fe(this.tertiaryColor,this.darkMode),this.primaryTextColor=Z(this.primaryColor),this.secondaryTextColor=Z(this.secondaryColor),this.tertiaryTextColor=Z(this.primaryColor),this.lineColor=Z(this.background),this.textColor=Z(this.background),this.THEME_COLOR_LIMIT=12,this.nodeBkg="calculated",this.nodeBorder="calculated",this.clusterBkg="calculated",this.clusterBorder="calculated",this.defaultLinkColor="calculated",this.titleColor="#333",this.edgeLabelBackground="#e8e8e8",this.actorBorder="calculated",this.actorBkg="calculated",this.actorTextColor="black",this.actorLineColor="calculated",this.signalColor="#333",this.signalTextColor="#333",this.labelBoxBkgColor="calculated",this.labelBoxBorderColor="#326932",this.labelTextColor="calculated",this.loopTextColor="calculated",this.noteBorderColor="calculated",this.noteBkgColor="#fff5ad",this.noteTextColor="calculated",this.activationBorderColor="#666",this.activationBkgColor="#f4f4f4",this.sequenceNumberColor="white",this.sectionBkgColor="#6eaa49",this.altSectionBkgColor="white",this.sectionBkgColor2="#6eaa49",this.excludeBkgColor="#eeeeee",this.taskBorderColor="calculated",this.taskBkgColor="#487e3a",this.taskTextLightColor="white",this.taskTextColor="calculated",this.taskTextDarkColor="black",this.taskTextOutsideColor="calculated",this.taskTextClickableColor="#003163",this.activeTaskBorderColor="calculated",this.activeTaskBkgColor="calculated",this.gridColor="lightgrey",this.doneTaskBkgColor="lightgrey",this.doneTaskBorderColor="grey",this.critBorderColor="#ff8888",this.critBkgColor="red",this.todayLineColor="red",this.vertLineColor="#00BFFF",this.personBorder=this.primaryBorderColor,this.personBkg=this.mainBkg,this.archEdgeColor="calculated",this.archEdgeArrowColor="calculated",this.archEdgeWidth="3",this.archGroupBorderColor=this.primaryBorderColor,this.archGroupBorderWidth="2px",this.labelColor="black",this.errorBkgColor="#552222",this.errorTextColor="#552222"}updateColors(){this.actorBorder=ut(this.mainBkg,20),this.actorBkg=this.mainBkg,this.labelBoxBkgColor=this.actorBkg,this.labelTextColor=this.actorTextColor,this.loopTextColor=this.actorTextColor,this.noteBorderColor=this.border2,this.noteTextColor=this.actorTextColor,this.actorLineColor=this.actorBorder,this.cScale0=this.cScale0||this.primaryColor,this.cScale1=this.cScale1||this.secondaryColor,this.cScale2=this.cScale2||this.tertiaryColor,this.cScale3=this.cScale3||B(this.primaryColor,{h:30}),this.cScale4=this.cScale4||B(this.primaryColor,{h:60}),this.cScale5=this.cScale5||B(this.primaryColor,{h:90}),this.cScale6=this.cScale6||B(this.primaryColor,{h:120}),this.cScale7=this.cScale7||B(this.primaryColor,{h:150}),this.cScale8=this.cScale8||B(this.primaryColor,{h:210}),this.cScale9=this.cScale9||B(this.primaryColor,{h:270}),this.cScale10=this.cScale10||B(this.primaryColor,{h:300}),this.cScale11=this.cScale11||B(this.primaryColor,{h:330}),this.cScalePeer1=this.cScalePeer1||ut(this.secondaryColor,45),this.cScalePeer2=this.cScalePeer2||ut(this.tertiaryColor,40);for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["cScale"+t]=ut(this["cScale"+t],10),this["cScalePeer"+t]=this["cScalePeer"+t]||ut(this["cScale"+t],25);for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["cScaleInv"+t]=this["cScaleInv"+t]||B(this["cScale"+t],{h:180});this.scaleLabelColor=this.scaleLabelColor!=="calculated"&&this.scaleLabelColor?this.scaleLabelColor:this.labelTextColor;for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["cScaleLabel"+t]=this["cScaleLabel"+t]||this.scaleLabelColor;for(let t=0;t<5;t++)this["surface"+t]=this["surface"+t]||B(this.mainBkg,{h:30,s:-30,l:-(5+t*5)}),this["surfacePeer"+t]=this["surfacePeer"+t]||B(this.mainBkg,{h:30,s:-30,l:-(8+t*5)});this.nodeBkg=this.mainBkg,this.nodeBorder=this.border1,this.clusterBkg=this.secondBkg,this.clusterBorder=this.border2,this.defaultLinkColor=this.lineColor,this.taskBorderColor=this.border1,this.taskTextColor=this.taskTextLightColor,this.taskTextOutsideColor=this.taskTextDarkColor,this.activeTaskBorderColor=this.taskBorderColor,this.activeTaskBkgColor=this.mainBkg,this.archEdgeColor=this.lineColor,this.archEdgeArrowColor=this.lineColor,this.rowOdd=this.rowOdd||nt(this.mainBkg,75)||"#ffffff",this.rowEven=this.rowEven||nt(this.mainBkg,20),this.transitionColor=this.transitionColor||this.lineColor,this.transitionLabelColor=this.transitionLabelColor||this.textColor,this.stateLabelColor=this.stateLabelColor||this.stateBkg||this.primaryTextColor,this.stateBkg=this.stateBkg||this.mainBkg,this.labelBackgroundColor=this.labelBackgroundColor||this.stateBkg,this.compositeBackground=this.compositeBackground||this.background||this.tertiaryColor,this.altBackground=this.altBackground||"#f0f0f0",this.compositeTitleBackground=this.compositeTitleBackground||this.mainBkg,this.compositeBorder=this.compositeBorder||this.nodeBorder,this.innerEndBackground=this.primaryBorderColor,this.specialStateColor=this.lineColor,this.errorBkgColor=this.errorBkgColor||this.tertiaryColor,this.errorTextColor=this.errorTextColor||this.tertiaryTextColor,this.transitionColor=this.transitionColor||this.lineColor,this.classText=this.primaryTextColor,this.fillType0=this.primaryColor,this.fillType1=this.secondaryColor,this.fillType2=B(this.primaryColor,{h:64}),this.fillType3=B(this.secondaryColor,{h:64}),this.fillType4=B(this.primaryColor,{h:-64}),this.fillType5=B(this.secondaryColor,{h:-64}),this.fillType6=B(this.primaryColor,{h:128}),this.fillType7=B(this.secondaryColor,{h:128}),this.pie1=this.pie1||this.primaryColor,this.pie2=this.pie2||this.secondaryColor,this.pie3=this.pie3||this.tertiaryColor,this.pie4=this.pie4||B(this.primaryColor,{l:-30}),this.pie5=this.pie5||B(this.secondaryColor,{l:-30}),this.pie6=this.pie6||B(this.tertiaryColor,{h:40,l:-40}),this.pie7=this.pie7||B(this.primaryColor,{h:60,l:-10}),this.pie8=this.pie8||B(this.primaryColor,{h:-60,l:-10}),this.pie9=this.pie9||B(this.primaryColor,{h:120,l:0}),this.pie10=this.pie10||B(this.primaryColor,{h:60,l:-50}),this.pie11=this.pie11||B(this.primaryColor,{h:-60,l:-50}),this.pie12=this.pie12||B(this.primaryColor,{h:120,l:-50}),this.pieTitleTextSize=this.pieTitleTextSize||"25px",this.pieTitleTextColor=this.pieTitleTextColor||this.taskTextDarkColor,this.pieSectionTextSize=this.pieSectionTextSize||"17px",this.pieSectionTextColor=this.pieSectionTextColor||this.textColor,this.pieLegendTextSize=this.pieLegendTextSize||"17px",this.pieLegendTextColor=this.pieLegendTextColor||this.taskTextDarkColor,this.pieStrokeColor=this.pieStrokeColor||"black",this.pieStrokeWidth=this.pieStrokeWidth||"2px",this.pieOuterStrokeWidth=this.pieOuterStrokeWidth||"2px",this.pieOuterStrokeColor=this.pieOuterStrokeColor||"black",this.pieOpacity=this.pieOpacity||"0.7",this.quadrant1Fill=this.quadrant1Fill||this.primaryColor,this.quadrant2Fill=this.quadrant2Fill||B(this.primaryColor,{r:5,g:5,b:5}),this.quadrant3Fill=this.quadrant3Fill||B(this.primaryColor,{r:10,g:10,b:10}),this.quadrant4Fill=this.quadrant4Fill||B(this.primaryColor,{r:15,g:15,b:15}),this.quadrant1TextFill=this.quadrant1TextFill||this.primaryTextColor,this.quadrant2TextFill=this.quadrant2TextFill||B(this.primaryTextColor,{r:-5,g:-5,b:-5}),this.quadrant3TextFill=this.quadrant3TextFill||B(this.primaryTextColor,{r:-10,g:-10,b:-10}),this.quadrant4TextFill=this.quadrant4TextFill||B(this.primaryTextColor,{r:-15,g:-15,b:-15}),this.quadrantPointFill=this.quadrantPointFill||sa(this.quadrant1Fill)?nt(this.quadrant1Fill):ut(this.quadrant1Fill),this.quadrantPointTextFill=this.quadrantPointTextFill||this.primaryTextColor,this.quadrantXAxisTextFill=this.quadrantXAxisTextFill||this.primaryTextColor,this.quadrantYAxisTextFill=this.quadrantYAxisTextFill||this.primaryTextColor,this.quadrantInternalBorderStrokeFill=this.quadrantInternalBorderStrokeFill||this.primaryBorderColor,this.quadrantExternalBorderStrokeFill=this.quadrantExternalBorderStrokeFill||this.primaryBorderColor,this.quadrantTitleFill=this.quadrantTitleFill||this.primaryTextColor,this.packet={startByteColor:this.primaryTextColor,endByteColor:this.primaryTextColor,labelColor:this.primaryTextColor,titleColor:this.primaryTextColor,blockStrokeColor:this.primaryTextColor,blockFillColor:this.mainBkg},this.radar={axisColor:this.radar?.axisColor||this.lineColor,axisStrokeWidth:this.radar?.axisStrokeWidth||2,axisLabelFontSize:this.radar?.axisLabelFontSize||12,curveOpacity:this.radar?.curveOpacity||.5,curveStrokeWidth:this.radar?.curveStrokeWidth||2,graticuleColor:this.radar?.graticuleColor||"#DEDEDE",graticuleStrokeWidth:this.radar?.graticuleStrokeWidth||1,graticuleOpacity:this.radar?.graticuleOpacity||.3,legendBoxSize:this.radar?.legendBoxSize||12,legendFontSize:this.radar?.legendFontSize||12},this.xyChart={backgroundColor:this.xyChart?.backgroundColor||this.background,titleColor:this.xyChart?.titleColor||this.primaryTextColor,xAxisTitleColor:this.xyChart?.xAxisTitleColor||this.primaryTextColor,xAxisLabelColor:this.xyChart?.xAxisLabelColor||this.primaryTextColor,xAxisTickColor:this.xyChart?.xAxisTickColor||this.primaryTextColor,xAxisLineColor:this.xyChart?.xAxisLineColor||this.primaryTextColor,yAxisTitleColor:this.xyChart?.yAxisTitleColor||this.primaryTextColor,yAxisLabelColor:this.xyChart?.yAxisLabelColor||this.primaryTextColor,yAxisTickColor:this.xyChart?.yAxisTickColor||this.primaryTextColor,yAxisLineColor:this.xyChart?.yAxisLineColor||this.primaryTextColor,plotColorPalette:this.xyChart?.plotColorPalette||"#CDE498,#FF6B6B,#A0D2DB,#D7BDE2,#F0F0F0,#FFC3A0,#7FD8BE,#FF9A8B,#FAF3E0,#FFF176"},this.requirementBackground=this.requirementBackground||this.primaryColor,this.requirementBorderColor=this.requirementBorderColor||this.primaryBorderColor,this.requirementBorderSize=this.requirementBorderSize||"1",this.requirementTextColor=this.requirementTextColor||this.primaryTextColor,this.relationColor=this.relationColor||this.lineColor,this.relationLabelBackground=this.relationLabelBackground||this.edgeLabelBackground,this.relationLabelColor=this.relationLabelColor||this.actorTextColor,this.git0=this.git0||this.primaryColor,this.git1=this.git1||this.secondaryColor,this.git2=this.git2||this.tertiaryColor,this.git3=this.git3||B(this.primaryColor,{h:-30}),this.git4=this.git4||B(this.primaryColor,{h:-60}),this.git5=this.git5||B(this.primaryColor,{h:-90}),this.git6=this.git6||B(this.primaryColor,{h:60}),this.git7=this.git7||B(this.primaryColor,{h:120}),this.darkMode?(this.git0=nt(this.git0,25),this.git1=nt(this.git1,25),this.git2=nt(this.git2,25),this.git3=nt(this.git3,25),this.git4=nt(this.git4,25),this.git5=nt(this.git5,25),this.git6=nt(this.git6,25),this.git7=nt(this.git7,25)):(this.git0=ut(this.git0,25),this.git1=ut(this.git1,25),this.git2=ut(this.git2,25),this.git3=ut(this.git3,25),this.git4=ut(this.git4,25),this.git5=ut(this.git5,25),this.git6=ut(this.git6,25),this.git7=ut(this.git7,25)),this.gitInv0=this.gitInv0||Z(this.git0),this.gitInv1=this.gitInv1||Z(this.git1),this.gitInv2=this.gitInv2||Z(this.git2),this.gitInv3=this.gitInv3||Z(this.git3),this.gitInv4=this.gitInv4||Z(this.git4),this.gitInv5=this.gitInv5||Z(this.git5),this.gitInv6=this.gitInv6||Z(this.git6),this.gitInv7=this.gitInv7||Z(this.git7),this.gitBranchLabel0=this.gitBranchLabel0||Z(this.labelTextColor),this.gitBranchLabel1=this.gitBranchLabel1||this.labelTextColor,this.gitBranchLabel2=this.gitBranchLabel2||this.labelTextColor,this.gitBranchLabel3=this.gitBranchLabel3||Z(this.labelTextColor),this.gitBranchLabel4=this.gitBranchLabel4||this.labelTextColor,this.gitBranchLabel5=this.gitBranchLabel5||this.labelTextColor,this.gitBranchLabel6=this.gitBranchLabel6||this.labelTextColor,this.gitBranchLabel7=this.gitBranchLabel7||this.labelTextColor,this.tagLabelColor=this.tagLabelColor||this.primaryTextColor,this.tagLabelBackground=this.tagLabelBackground||this.primaryColor,this.tagLabelBorder=this.tagBorder||this.primaryBorderColor,this.tagLabelFontSize=this.tagLabelFontSize||"10px",this.commitLabelColor=this.commitLabelColor||this.secondaryTextColor,this.commitLabelBackground=this.commitLabelBackground||this.secondaryColor,this.commitLabelFontSize=this.commitLabelFontSize||"10px",this.attributeBackgroundColorOdd=this.attributeBackgroundColorOdd||yc,this.attributeBackgroundColorEven=this.attributeBackgroundColorEven||vc}calculate(t){if(typeof t!="object"){this.updateColors();return}const r=Object.keys(t);r.forEach(i=>{this[i]=t[i]}),this.updateColors(),r.forEach(i=>{this[i]=t[i]})}},m(ns,"Theme"),ns),aA=m(e=>{const t=new oA;return t.calculate(e),t},"getThemeVariables"),ss,lA=(ss=class{constructor(){this.primaryColor="#eee",this.contrast="#707070",this.secondaryColor=nt(this.contrast,55),this.background="#ffffff",this.tertiaryColor=B(this.primaryColor,{h:-160}),this.primaryBorderColor=Fe(this.primaryColor,this.darkMode),this.secondaryBorderColor=Fe(this.secondaryColor,this.darkMode),this.tertiaryBorderColor=Fe(this.tertiaryColor,this.darkMode),this.primaryTextColor=Z(this.primaryColor),this.secondaryTextColor=Z(this.secondaryColor),this.tertiaryTextColor=Z(this.tertiaryColor),this.lineColor=Z(this.background),this.textColor=Z(this.background),this.mainBkg="#eee",this.secondBkg="calculated",this.lineColor="#666",this.border1="#999",this.border2="calculated",this.note="#ffa",this.text="#333",this.critical="#d42",this.done="#bbb",this.arrowheadColor="#333333",this.fontFamily='"trebuchet ms", verdana, arial, sans-serif',this.fontSize="16px",this.THEME_COLOR_LIMIT=12,this.nodeBkg="calculated",this.nodeBorder="calculated",this.clusterBkg="calculated",this.clusterBorder="calculated",this.defaultLinkColor="calculated",this.titleColor="calculated",this.edgeLabelBackground="white",this.actorBorder="calculated",this.actorBkg="calculated",this.actorTextColor="calculated",this.actorLineColor=this.actorBorder,this.signalColor="calculated",this.signalTextColor="calculated",this.labelBoxBkgColor="calculated",this.labelBoxBorderColor="calculated",this.labelTextColor="calculated",this.loopTextColor="calculated",this.noteBorderColor="calculated",this.noteBkgColor="calculated",this.noteTextColor="calculated",this.activationBorderColor="#666",this.activationBkgColor="#f4f4f4",this.sequenceNumberColor="white",this.sectionBkgColor="calculated",this.altSectionBkgColor="white",this.sectionBkgColor2="calculated",this.excludeBkgColor="#eeeeee",this.taskBorderColor="calculated",this.taskBkgColor="calculated",this.taskTextLightColor="white",this.taskTextColor="calculated",this.taskTextDarkColor="calculated",this.taskTextOutsideColor="calculated",this.taskTextClickableColor="#003163",this.activeTaskBorderColor="calculated",this.activeTaskBkgColor="calculated",this.gridColor="calculated",this.doneTaskBkgColor="calculated",this.doneTaskBorderColor="calculated",this.critBkgColor="calculated",this.critBorderColor="calculated",this.todayLineColor="calculated",this.vertLineColor="calculated",this.personBorder=this.primaryBorderColor,this.personBkg=this.mainBkg,this.archEdgeColor="calculated",this.archEdgeArrowColor="calculated",this.archEdgeWidth="3",this.archGroupBorderColor=this.primaryBorderColor,this.archGroupBorderWidth="2px",this.rowOdd=this.rowOdd||nt(this.mainBkg,75)||"#ffffff",this.rowEven=this.rowEven||"#f4f4f4",this.labelColor="black",this.errorBkgColor="#552222",this.errorTextColor="#552222"}updateColors(){this.secondBkg=nt(this.contrast,55),this.border2=this.contrast,this.actorBorder=nt(this.border1,23),this.actorBkg=this.mainBkg,this.actorTextColor=this.text,this.actorLineColor=this.actorBorder,this.signalColor=this.text,this.signalTextColor=this.text,this.labelBoxBkgColor=this.actorBkg,this.labelBoxBorderColor=this.actorBorder,this.labelTextColor=this.text,this.loopTextColor=this.text,this.noteBorderColor="#999",this.noteBkgColor="#666",this.noteTextColor="#fff",this.cScale0=this.cScale0||"#555",this.cScale1=this.cScale1||"#F4F4F4",this.cScale2=this.cScale2||"#555",this.cScale3=this.cScale3||"#BBB",this.cScale4=this.cScale4||"#777",this.cScale5=this.cScale5||"#999",this.cScale6=this.cScale6||"#DDD",this.cScale7=this.cScale7||"#FFF",this.cScale8=this.cScale8||"#DDD",this.cScale9=this.cScale9||"#BBB",this.cScale10=this.cScale10||"#999",this.cScale11=this.cScale11||"#777";for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["cScaleInv"+t]=this["cScaleInv"+t]||Z(this["cScale"+t]);for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this.darkMode?this["cScalePeer"+t]=this["cScalePeer"+t]||nt(this["cScale"+t],10):this["cScalePeer"+t]=this["cScalePeer"+t]||ut(this["cScale"+t],10);this.scaleLabelColor=this.scaleLabelColor||(this.darkMode?"black":this.labelTextColor),this.cScaleLabel0=this.cScaleLabel0||this.cScale1,this.cScaleLabel2=this.cScaleLabel2||this.cScale1;for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["cScaleLabel"+t]=this["cScaleLabel"+t]||this.scaleLabelColor;for(let t=0;t<5;t++)this["surface"+t]=this["surface"+t]||B(this.mainBkg,{l:-(5+t*5)}),this["surfacePeer"+t]=this["surfacePeer"+t]||B(this.mainBkg,{l:-(8+t*5)});this.nodeBkg=this.mainBkg,this.nodeBorder=this.border1,this.clusterBkg=this.secondBkg,this.clusterBorder=this.border2,this.defaultLinkColor=this.lineColor,this.titleColor=this.text,this.sectionBkgColor=nt(this.contrast,30),this.sectionBkgColor2=nt(this.contrast,30),this.taskBorderColor=ut(this.contrast,10),this.taskBkgColor=this.contrast,this.taskTextColor=this.taskTextLightColor,this.taskTextDarkColor=this.text,this.taskTextOutsideColor=this.taskTextDarkColor,this.activeTaskBorderColor=this.taskBorderColor,this.activeTaskBkgColor=this.mainBkg,this.gridColor=nt(this.border1,30),this.doneTaskBkgColor=this.done,this.doneTaskBorderColor=this.lineColor,this.critBkgColor=this.critical,this.critBorderColor=ut(this.critBkgColor,10),this.todayLineColor=this.critBkgColor,this.vertLineColor=this.critBkgColor,this.archEdgeColor=this.lineColor,this.archEdgeArrowColor=this.lineColor,this.transitionColor=this.transitionColor||"#000",this.transitionLabelColor=this.transitionLabelColor||this.textColor,this.stateLabelColor=this.stateLabelColor||this.stateBkg||this.primaryTextColor,this.stateBkg=this.stateBkg||this.mainBkg,this.labelBackgroundColor=this.labelBackgroundColor||this.stateBkg,this.compositeBackground=this.compositeBackground||this.background||this.tertiaryColor,this.altBackground=this.altBackground||"#f4f4f4",this.compositeTitleBackground=this.compositeTitleBackground||this.mainBkg,this.stateBorder=this.stateBorder||"#000",this.innerEndBackground=this.primaryBorderColor,this.specialStateColor="#222",this.errorBkgColor=this.errorBkgColor||this.tertiaryColor,this.errorTextColor=this.errorTextColor||this.tertiaryTextColor,this.classText=this.primaryTextColor,this.fillType0=this.primaryColor,this.fillType1=this.secondaryColor,this.fillType2=B(this.primaryColor,{h:64}),this.fillType3=B(this.secondaryColor,{h:64}),this.fillType4=B(this.primaryColor,{h:-64}),this.fillType5=B(this.secondaryColor,{h:-64}),this.fillType6=B(this.primaryColor,{h:128}),this.fillType7=B(this.secondaryColor,{h:128});for(let t=0;t<this.THEME_COLOR_LIMIT;t++)this["pie"+t]=this["cScale"+t];this.pie12=this.pie0,this.pieTitleTextSize=this.pieTitleTextSize||"25px",this.pieTitleTextColor=this.pieTitleTextColor||this.taskTextDarkColor,this.pieSectionTextSize=this.pieSectionTextSize||"17px",this.pieSectionTextColor=this.pieSectionTextColor||this.textColor,this.pieLegendTextSize=this.pieLegendTextSize||"17px",this.pieLegendTextColor=this.pieLegendTextColor||this.taskTextDarkColor,this.pieStrokeColor=this.pieStrokeColor||"black",this.pieStrokeWidth=this.pieStrokeWidth||"2px",this.pieOuterStrokeWidth=this.pieOuterStrokeWidth||"2px",this.pieOuterStrokeColor=this.pieOuterStrokeColor||"black",this.pieOpacity=this.pieOpacity||"0.7",this.quadrant1Fill=this.quadrant1Fill||this.primaryColor,this.quadrant2Fill=this.quadrant2Fill||B(this.primaryColor,{r:5,g:5,b:5}),this.quadrant3Fill=this.quadrant3Fill||B(this.primaryColor,{r:10,g:10,b:10}),this.quadrant4Fill=this.quadrant4Fill||B(this.primaryColor,{r:15,g:15,b:15}),this.quadrant1TextFill=this.quadrant1TextFill||this.primaryTextColor,this.quadrant2TextFill=this.quadrant2TextFill||B(this.primaryTextColor,{r:-5,g:-5,b:-5}),this.quadrant3TextFill=this.quadrant3TextFill||B(this.primaryTextColor,{r:-10,g:-10,b:-10}),this.quadrant4TextFill=this.quadrant4TextFill||B(this.primaryTextColor,{r:-15,g:-15,b:-15}),this.quadrantPointFill=this.quadrantPointFill||sa(this.quadrant1Fill)?nt(this.quadrant1Fill):ut(this.quadrant1Fill),this.quadrantPointTextFill=this.quadrantPointTextFill||this.primaryTextColor,this.quadrantXAxisTextFill=this.quadrantXAxisTextFill||this.primaryTextColor,this.quadrantYAxisTextFill=this.quadrantYAxisTextFill||this.primaryTextColor,this.quadrantInternalBorderStrokeFill=this.quadrantInternalBorderStrokeFill||this.primaryBorderColor,this.quadrantExternalBorderStrokeFill=this.quadrantExternalBorderStrokeFill||this.primaryBorderColor,this.quadrantTitleFill=this.quadrantTitleFill||this.primaryTextColor,this.xyChart={backgroundColor:this.xyChart?.backgroundColor||this.background,titleColor:this.xyChart?.titleColor||this.primaryTextColor,xAxisTitleColor:this.xyChart?.xAxisTitleColor||this.primaryTextColor,xAxisLabelColor:this.xyChart?.xAxisLabelColor||this.primaryTextColor,xAxisTickColor:this.xyChart?.xAxisTickColor||this.primaryTextColor,xAxisLineColor:this.xyChart?.xAxisLineColor||this.primaryTextColor,yAxisTitleColor:this.xyChart?.yAxisTitleColor||this.primaryTextColor,yAxisLabelColor:this.xyChart?.yAxisLabelColor||this.primaryTextColor,yAxisTickColor:this.xyChart?.yAxisTickColor||this.primaryTextColor,yAxisLineColor:this.xyChart?.yAxisLineColor||this.primaryTextColor,plotColorPalette:this.xyChart?.plotColorPalette||"#EEE,#6BB8E4,#8ACB88,#C7ACD6,#E8DCC2,#FFB2A8,#FFF380,#7E8D91,#FFD8B1,#FAF3E0"},this.radar={axisColor:this.radar?.axisColor||this.lineColor,axisStrokeWidth:this.radar?.axisStrokeWidth||2,axisLabelFontSize:this.radar?.axisLabelFontSize||12,curveOpacity:this.radar?.curveOpacity||.5,curveStrokeWidth:this.radar?.curveStrokeWidth||2,graticuleColor:this.radar?.graticuleColor||"#DEDEDE",graticuleStrokeWidth:this.radar?.graticuleStrokeWidth||1,graticuleOpacity:this.radar?.graticuleOpacity||.3,legendBoxSize:this.radar?.legendBoxSize||12,legendFontSize:this.radar?.legendFontSize||12},this.requirementBackground=this.requirementBackground||this.primaryColor,this.requirementBorderColor=this.requirementBorderColor||this.primaryBorderColor,this.requirementBorderSize=this.requirementBorderSize||"1",this.requirementTextColor=this.requirementTextColor||this.primaryTextColor,this.relationColor=this.relationColor||this.lineColor,this.relationLabelBackground=this.relationLabelBackground||this.edgeLabelBackground,this.relationLabelColor=this.relationLabelColor||this.actorTextColor,this.git0=ut(this.pie1,25)||this.primaryColor,this.git1=this.pie2||this.secondaryColor,this.git2=this.pie3||this.tertiaryColor,this.git3=this.pie4||B(this.primaryColor,{h:-30}),this.git4=this.pie5||B(this.primaryColor,{h:-60}),this.git5=this.pie6||B(this.primaryColor,{h:-90}),this.git6=this.pie7||B(this.primaryColor,{h:60}),this.git7=this.pie8||B(this.primaryColor,{h:120}),this.gitInv0=this.gitInv0||Z(this.git0),this.gitInv1=this.gitInv1||Z(this.git1),this.gitInv2=this.gitInv2||Z(this.git2),this.gitInv3=this.gitInv3||Z(this.git3),this.gitInv4=this.gitInv4||Z(this.git4),this.gitInv5=this.gitInv5||Z(this.git5),this.gitInv6=this.gitInv6||Z(this.git6),this.gitInv7=this.gitInv7||Z(this.git7),this.branchLabelColor=this.branchLabelColor||this.labelTextColor,this.gitBranchLabel0=this.branchLabelColor,this.gitBranchLabel1="white",this.gitBranchLabel2=this.branchLabelColor,this.gitBranchLabel3="white",this.gitBranchLabel4=this.branchLabelColor,this.gitBranchLabel5=this.branchLabelColor,this.gitBranchLabel6=this.branchLabelColor,this.gitBranchLabel7=this.branchLabelColor,this.tagLabelColor=this.tagLabelColor||this.primaryTextColor,this.tagLabelBackground=this.tagLabelBackground||this.primaryColor,this.tagLabelBorder=this.tagBorder||this.primaryBorderColor,this.tagLabelFontSize=this.tagLabelFontSize||"10px",this.commitLabelColor=this.commitLabelColor||this.secondaryTextColor,this.commitLabelBackground=this.commitLabelBackground||this.secondaryColor,this.commitLabelFontSize=this.commitLabelFontSize||"10px",this.attributeBackgroundColorOdd=this.attributeBackgroundColorOdd||yc,this.attributeBackgroundColorEven=this.attributeBackgroundColorEven||vc}calculate(t){if(typeof t!="object"){this.updateColors();return}const r=Object.keys(t);r.forEach(i=>{this[i]=t[i]}),this.updateColors(),r.forEach(i=>{this[i]=t[i]})}},m(ss,"Theme"),ss),cA=m(e=>{const t=new lA;return t.calculate(e),t},"getThemeVariables"),li={base:{getThemeVariables:eA},dark:{getThemeVariables:iA},default:{getThemeVariables:sA},forest:{getThemeVariables:aA},neutral:{getThemeVariables:cA}},Nr={flowchart:{useMaxWidth:!0,titleTopMargin:25,subGraphTitleMargin:{top:0,bottom:0},diagramPadding:8,htmlLabels:!0,nodeSpacing:50,rankSpacing:50,curve:"basis",padding:15,defaultRenderer:"dagre-wrapper",wrappingWidth:200,inheritDir:!1},sequence:{useMaxWidth:!0,hideUnusedParticipants:!1,activationWidth:10,diagramMarginX:50,diagramMarginY:10,actorMargin:50,width:150,height:65,boxMargin:10,boxTextMargin:5,noteMargin:10,messageMargin:35,messageAlign:"center",mirrorActors:!0,forceMenus:!1,bottomMarginAdj:1,rightAngles:!1,showSequenceNumbers:!1,actorFontSize:14,actorFontFamily:'"Open Sans", sans-serif',actorFontWeight:400,noteFontSize:14,noteFontFamily:'"trebuchet ms", verdana, arial, sans-serif',noteFontWeight:400,noteAlign:"center",messageFontSize:16,messageFontFamily:'"trebuchet ms", verdana, arial, sans-serif',messageFontWeight:400,wrap:!1,wrapPadding:10,labelBoxWidth:50,labelBoxHeight:20},gantt:{useMaxWidth:!0,titleTopMargin:25,barHeight:20,barGap:4,topPadding:50,rightPadding:75,leftPadding:75,gridLineStartPadding:35,fontSize:11,sectionFontSize:11,numberSectionStyles:4,axisFormat:"%Y-%m-%d",topAxis:!1,displayMode:"",weekday:"sunday"},journey:{useMaxWidth:!0,diagramMarginX:50,diagramMarginY:10,leftMargin:150,maxLabelWidth:360,width:150,height:50,boxMargin:10,boxTextMargin:5,noteMargin:10,messageMargin:35,messageAlign:"center",bottomMarginAdj:1,rightAngles:!1,taskFontSize:14,taskFontFamily:'"Open Sans", sans-serif',taskMargin:50,activationWidth:10,textPlacement:"fo",actorColours:["#8FBC8F","#7CFC00","#00FFFF","#20B2AA","#B0E0E6","#FFFFE0"],sectionFills:["#191970","#8B008B","#4B0082","#2F4F4F","#800000","#8B4513","#00008B"],sectionColours:["#fff"],titleColor:"",titleFontFamily:'"trebuchet ms", verdana, arial, sans-serif',titleFontSize:"4ex"},class:{useMaxWidth:!0,titleTopMargin:25,arrowMarkerAbsolute:!1,dividerMargin:10,padding:5,textHeight:10,defaultRenderer:"dagre-wrapper",htmlLabels:!1,hideEmptyMembersBox:!1},state:{useMaxWidth:!0,titleTopMargin:25,dividerMargin:10,sizeUnit:5,padding:8,textHeight:10,titleShift:-15,noteMargin:10,forkWidth:70,forkHeight:7,miniPadding:2,fontSizeFactor:5.02,fontSize:24,labelHeight:16,edgeLengthFactor:"20",compositTitleSize:35,radius:5,defaultRenderer:"dagre-wrapper"},er:{useMaxWidth:!0,titleTopMargin:25,diagramPadding:20,layoutDirection:"TB",minEntityWidth:100,minEntityHeight:75,entityPadding:15,nodeSpacing:140,rankSpacing:80,stroke:"gray",fill:"honeydew",fontSize:12},pie:{useMaxWidth:!0,textPosition:.75},quadrantChart:{useMaxWidth:!0,chartWidth:500,chartHeight:500,titleFontSize:20,titlePadding:10,quadrantPadding:5,xAxisLabelPadding:5,yAxisLabelPadding:5,xAxisLabelFontSize:16,yAxisLabelFontSize:16,quadrantLabelFontSize:16,quadrantTextTopPadding:5,pointTextPadding:5,pointLabelFontSize:12,pointRadius:5,xAxisPosition:"top",yAxisPosition:"left",quadrantInternalBorderStrokeWidth:1,quadrantExternalBorderStrokeWidth:2},xyChart:{useMaxWidth:!0,width:700,height:500,titleFontSize:20,titlePadding:10,showDataLabel:!1,showTitle:!0,xAxis:{$ref:"#/$defs/XYChartAxisConfig",showLabel:!0,labelFontSize:14,labelPadding:5,showTitle:!0,titleFontSize:16,titlePadding:5,showTick:!0,tickLength:5,tickWidth:2,showAxisLine:!0,axisLineWidth:2},yAxis:{$ref:"#/$defs/XYChartAxisConfig",showLabel:!0,labelFontSize:14,labelPadding:5,showTitle:!0,titleFontSize:16,titlePadding:5,showTick:!0,tickLength:5,tickWidth:2,showAxisLine:!0,axisLineWidth:2},chartOrientation:"vertical",plotReservedSpacePercent:50},requirement:{useMaxWidth:!0,rect_fill:"#f9f9f9",text_color:"#333",rect_border_size:"0.5px",rect_border_color:"#bbb",rect_min_width:200,rect_min_height:200,fontSize:14,rect_padding:10,line_height:20},mindmap:{useMaxWidth:!0,padding:10,maxNodeWidth:200,layoutAlgorithm:"cose-bilkent"},kanban:{useMaxWidth:!0,padding:8,sectionWidth:200,ticketBaseUrl:""},timeline:{useMaxWidth:!0,diagramMarginX:50,diagramMarginY:10,leftMargin:150,width:150,height:50,boxMargin:10,boxTextMargin:5,noteMargin:10,messageMargin:35,messageAlign:"center",bottomMarginAdj:1,rightAngles:!1,taskFontSize:14,taskFontFamily:'"Open Sans", sans-serif',taskMargin:50,activationWidth:10,textPlacement:"fo",actorColours:["#8FBC8F","#7CFC00","#00FFFF","#20B2AA","#B0E0E6","#FFFFE0"],sectionFills:["#191970","#8B008B","#4B0082","#2F4F4F","#800000","#8B4513","#00008B"],sectionColours:["#fff"],disableMulticolor:!1},gitGraph:{useMaxWidth:!0,titleTopMargin:25,diagramPadding:8,nodeLabel:{width:75,height:100,x:-25,y:0},mainBranchName:"main",mainBranchOrder:0,showCommitLabel:!0,showBranches:!0,rotateCommitLabel:!0,parallelCommits:!1,arrowMarkerAbsolute:!1},c4:{useMaxWidth:!0,diagramMarginX:50,diagramMarginY:10,c4ShapeMargin:50,c4ShapePadding:20,width:216,height:60,boxMargin:10,c4ShapeInRow:4,nextLinePaddingX:0,c4BoundaryInRow:2,personFontSize:14,personFontFamily:'"Open Sans", sans-serif',personFontWeight:"normal",external_personFontSize:14,external_personFontFamily:'"Open Sans", sans-serif',external_personFontWeight:"normal",systemFontSize:14,systemFontFamily:'"Open Sans", sans-serif',systemFontWeight:"normal",external_systemFontSize:14,external_systemFontFamily:'"Open Sans", sans-serif',external_systemFontWeight:"normal",system_dbFontSize:14,system_dbFontFamily:'"Open Sans", sans-serif',system_dbFontWeight:"normal",external_system_dbFontSize:14,external_system_dbFontFamily:'"Open Sans", sans-serif',external_system_dbFontWeight:"normal",system_queueFontSize:14,system_queueFontFamily:'"Open Sans", sans-serif',system_queueFontWeight:"normal",external_system_queueFontSize:14,external_system_queueFontFamily:'"Open Sans", sans-serif',external_system_queueFontWeight:"normal",boundaryFontSize:14,boundaryFontFamily:'"Open Sans", sans-serif',boundaryFontWeight:"normal",messageFontSize:12,messageFontFamily:'"Open Sans", sans-serif',messageFontWeight:"normal",containerFontSize:14,containerFontFamily:'"Open Sans", sans-serif',containerFontWeight:"normal",external_containerFontSize:14,external_containerFontFamily:'"Open Sans", sans-serif',external_containerFontWeight:"normal",container_dbFontSize:14,container_dbFontFamily:'"Open Sans", sans-serif',container_dbFontWeight:"normal",external_container_dbFontSize:14,external_container_dbFontFamily:'"Open Sans", sans-serif',external_container_dbFontWeight:"normal",container_queueFontSize:14,container_queueFontFamily:'"Open Sans", sans-serif',container_queueFontWeight:"normal",external_container_queueFontSize:14,external_container_queueFontFamily:'"Open Sans", sans-serif',external_container_queueFontWeight:"normal",componentFontSize:14,componentFontFamily:'"Open Sans", sans-serif',componentFontWeight:"normal",external_componentFontSize:14,external_componentFontFamily:'"Open Sans", sans-serif',external_componentFontWeight:"normal",component_dbFontSize:14,component_dbFontFamily:'"Open Sans", sans-serif',component_dbFontWeight:"normal",external_component_dbFontSize:14,external_component_dbFontFamily:'"Open Sans", sans-serif',external_component_dbFontWeight:"normal",component_queueFontSize:14,component_queueFontFamily:'"Open Sans", sans-serif',component_queueFontWeight:"normal",external_component_queueFontSize:14,external_component_queueFontFamily:'"Open Sans", sans-serif',external_component_queueFontWeight:"normal",wrap:!0,wrapPadding:10,person_bg_color:"#08427B",person_border_color:"#073B6F",external_person_bg_color:"#686868",external_person_border_color:"#8A8A8A",system_bg_color:"#1168BD",system_border_color:"#3C7FC0",system_db_bg_color:"#1168BD",system_db_border_color:"#3C7FC0",system_queue_bg_color:"#1168BD",system_queue_border_color:"#3C7FC0",external_system_bg_color:"#999999",external_system_border_color:"#8A8A8A",external_system_db_bg_color:"#999999",external_system_db_border_color:"#8A8A8A",external_system_queue_bg_color:"#999999",external_system_queue_border_color:"#8A8A8A",container_bg_color:"#438DD5",container_border_color:"#3C7FC0",container_db_bg_color:"#438DD5",container_db_border_color:"#3C7FC0",container_queue_bg_color:"#438DD5",container_queue_border_color:"#3C7FC0",external_container_bg_color:"#B3B3B3",external_container_border_color:"#A6A6A6",external_container_db_bg_color:"#B3B3B3",external_container_db_border_color:"#A6A6A6",external_container_queue_bg_color:"#B3B3B3",external_container_queue_border_color:"#A6A6A6",component_bg_color:"#85BBF0",component_border_color:"#78A8D8",component_db_bg_color:"#85BBF0",component_db_border_color:"#78A8D8",component_queue_bg_color:"#85BBF0",component_queue_border_color:"#78A8D8",external_component_bg_color:"#CCCCCC",external_component_border_color:"#BFBFBF",external_component_db_bg_color:"#CCCCCC",external_component_db_border_color:"#BFBFBF",external_component_queue_bg_color:"#CCCCCC",external_component_queue_border_color:"#BFBFBF"},sankey:{useMaxWidth:!0,width:600,height:400,linkColor:"gradient",nodeAlignment:"justify",showValues:!0,prefix:"",suffix:""},block:{useMaxWidth:!0,padding:8},packet:{useMaxWidth:!0,rowHeight:32,bitWidth:32,bitsPerRow:32,showBits:!0,paddingX:5,paddingY:5},architecture:{useMaxWidth:!0,padding:40,iconSize:80,fontSize:16},radar:{useMaxWidth:!0,width:600,height:600,marginTop:50,marginRight:50,marginBottom:50,marginLeft:50,axisScaleFactor:1,axisLabelFactor:1.05,curveTension:.17},theme:"default",look:"classic",handDrawnSeed:0,layout:"dagre",maxTextSize:5e4,maxEdges:500,darkMode:!1,fontFamily:'"trebuchet ms", verdana, arial, sans-serif;',logLevel:5,securityLevel:"strict",startOnLoad:!0,arrowMarkerAbsolute:!1,secure:["secure","securityLevel","startOnLoad","maxTextSize","suppressErrorRendering","maxEdges"],legacyMathML:!1,forceLegacyMathML:!1,deterministicIds:!1,fontSize:16,markdownAutoWrap:!0,suppressErrorRendering:!1},Sb={...Nr,deterministicIDSeed:void 0,elk:{mergeEdges:!1,nodePlacementStrategy:"BRANDES_KOEPF",forceNodeModelOrder:!1,considerModelOrder:"NODES_AND_EDGES"},themeCSS:void 0,themeVariables:li.default.getThemeVariables(),sequence:{...Nr.sequence,messageFont:m(function(){return{fontFamily:this.messageFontFamily,fontSize:this.messageFontSize,fontWeight:this.messageFontWeight}},"messageFont"),noteFont:m(function(){return{fontFamily:this.noteFontFamily,fontSize:this.noteFontSize,fontWeight:this.noteFontWeight}},"noteFont"),actorFont:m(function(){return{fontFamily:this.actorFontFamily,fontSize:this.actorFontSize,fontWeight:this.actorFontWeight}},"actorFont")},class:{hideEmptyMembersBox:!1},gantt:{...Nr.gantt,tickInterval:void 0,useWidth:void 0},c4:{...Nr.c4,useWidth:void 0,personFont:m(function(){return{fontFamily:this.personFontFamily,fontSize:this.personFontSize,fontWeight:this.personFontWeight}},"personFont"),flowchart:{...Nr.flowchart,inheritDir:!1},external_personFont:m(function(){return{fontFamily:this.external_personFontFamily,fontSize:this.external_personFontSize,fontWeight:this.external_personFontWeight}},"external_personFont"),systemFont:m(function(){return{fontFamily:this.systemFontFamily,fontSize:this.systemFontSize,fontWeight:this.systemFontWeight}},"systemFont"),external_systemFont:m(function(){return{fontFamily:this.external_systemFontFamily,fontSize:this.external_systemFontSize,fontWeight:this.external_systemFontWeight}},"external_systemFont"),system_dbFont:m(function(){return{fontFamily:this.system_dbFontFamily,fontSize:this.system_dbFontSize,fontWeight:this.system_dbFontWeight}},"system_dbFont"),external_system_dbFont:m(function(){return{fontFamily:this.external_system_dbFontFamily,fontSize:this.external_system_dbFontSize,fontWeight:this.external_system_dbFontWeight}},"external_system_dbFont"),system_queueFont:m(function(){return{fontFamily:this.system_queueFontFamily,fontSize:this.system_queueFontSize,fontWeight:this.system_queueFontWeight}},"system_queueFont"),external_system_queueFont:m(function(){return{fontFamily:this.external_system_queueFontFamily,fontSize:this.external_system_queueFontSize,fontWeight:this.external_system_queueFontWeight}},"external_system_queueFont"),containerFont:m(function(){return{fontFamily:this.containerFontFamily,fontSize:this.containerFontSize,fontWeight:this.containerFontWeight}},"containerFont"),external_containerFont:m(function(){return{fontFamily:this.external_containerFontFamily,fontSize:this.external_containerFontSize,fontWeight:this.external_containerFontWeight}},"external_containerFont"),container_dbFont:m(function(){return{fontFamily:this.container_dbFontFamily,fontSize:this.container_dbFontSize,fontWeight:this.container_dbFontWeight}},"container_dbFont"),external_container_dbFont:m(function(){return{fontFamily:this.external_container_dbFontFamily,fontSize:this.external_container_dbFontSize,fontWeight:this.external_container_dbFontWeight}},"external_container_dbFont"),container_queueFont:m(function(){return{fontFamily:this.container_queueFontFamily,fontSize:this.container_queueFontSize,fontWeight:this.container_queueFontWeight}},"container_queueFont"),external_container_queueFont:m(function(){return{fontFamily:this.external_container_queueFontFamily,fontSize:this.external_container_queueFontSize,fontWeight:this.external_container_queueFontWeight}},"external_container_queueFont"),componentFont:m(function(){return{fontFamily:this.componentFontFamily,fontSize:this.componentFontSize,fontWeight:this.componentFontWeight}},"componentFont"),external_componentFont:m(function(){return{fontFamily:this.external_componentFontFamily,fontSize:this.external_componentFontSize,fontWeight:this.external_componentFontWeight}},"external_componentFont"),component_dbFont:m(function(){return{fontFamily:this.component_dbFontFamily,fontSize:this.component_dbFontSize,fontWeight:this.component_dbFontWeight}},"component_dbFont"),external_component_dbFont:m(function(){return{fontFamily:this.external_component_dbFontFamily,fontSize:this.external_component_dbFontSize,fontWeight:this.external_component_dbFontWeight}},"external_component_dbFont"),component_queueFont:m(function(){return{fontFamily:this.component_queueFontFamily,fontSize:this.component_queueFontSize,fontWeight:this.component_queueFontWeight}},"component_queueFont"),external_component_queueFont:m(function(){return{fontFamily:this.external_component_queueFontFamily,fontSize:this.external_component_queueFontSize,fontWeight:this.external_component_queueFontWeight}},"external_component_queueFont"),boundaryFont:m(function(){return{fontFamily:this.boundaryFontFamily,fontSize:this.boundaryFontSize,fontWeight:this.boundaryFontWeight}},"boundaryFont"),messageFont:m(function(){return{fontFamily:this.messageFontFamily,fontSize:this.messageFontSize,fontWeight:this.messageFontWeight}},"messageFont")},pie:{...Nr.pie,useWidth:984},xyChart:{...Nr.xyChart,useWidth:void 0},requirement:{...Nr.requirement,useWidth:void 0},packet:{...Nr.packet},radar:{...Nr.radar},treemap:{useMaxWidth:!0,padding:10,diagramPadding:8,showValues:!0,nodeWidth:100,nodeHeight:40,borderWidth:1,valueFontSize:12,labelFontSize:14,valueFormat:","}},_b=m((e,t="")=>Object.keys(e).reduce((r,i)=>Array.isArray(e[i])?r:typeof e[i]=="object"&&e[i]!==null?[...r,t+i,..._b(e[i],"")]:[...r,t+i],[]),"keyify"),hA=new Set(_b(Sb,"")),Tb=Sb,Cl=m(e=>{if(q.debug("sanitizeDirective called with",e),!(typeof e!="object"||e==null)){if(Array.isArray(e)){e.forEach(t=>Cl(t));return}for(const t of Object.keys(e)){if(q.debug("Checking key",t),t.startsWith("__")||t.includes("proto")||t.includes("constr")||!hA.has(t)||e[t]==null){q.debug("sanitize deleting key: ",t),delete e[t];continue}if(typeof e[t]=="object"){q.debug("sanitizing object",t),Cl(e[t]);continue}const r=["themeCSS","fontFamily","altFontFamily"];for(const i of r)t.includes(i)&&(q.debug("sanitizing css option",t),e[t]=dA(e[t]))}if(e.themeVariables)for(const t of Object.keys(e.themeVariables)){const r=e.themeVariables[t];r?.match&&!r.match(/^[\d "#%(),.;A-Za-z]+$/)&&(e.themeVariables[t]="")}q.debug("After sanitization",e)}},"sanitizeDirective"),dA=m(e=>{let t=0,r=0;for(const i of e){if(t<r)return"{ /* ERROR: Unbalanced CSS */ }";i==="{"?t++:i==="}"&&r++}return t!==r?"{ /* ERROR: Unbalanced CSS */ }":e},"sanitizeCss"),ms=Object.freeze(Tb),Xe=de({},ms),Sl,dn=[],To=de({},ms),wc=m((e,t)=>{let r=de({},e),i={};for(const n of t)jb(n),i=de(i,n);if(r=de(r,i),i.theme&&i.theme in li){const n=de({},Sl),s=de(n.themeVariables||{},i.themeVariables);r.theme&&r.theme in li&&(r.themeVariables=li[r.theme].getThemeVariables(s))}return To=r,Eb(To),To},"updateCurrentConfig"),uA=m(e=>(Xe=de({},ms),Xe=de(Xe,e),e.theme&&li[e.theme]&&(Xe.themeVariables=li[e.theme].getThemeVariables(e.themeVariables)),wc(Xe,dn),Xe),"setSiteConfig"),pA=m(e=>{Sl=de({},e)},"saveConfigFromInitialize"),fA=m(e=>(Xe=de(Xe,e),wc(Xe,dn),Xe),"updateSiteConfig"),$b=m(()=>de({},Xe),"getSiteConfig"),Ab=m(e=>(Eb(e),de(To,e),Te()),"setConfig"),Te=m(()=>de({},To),"getConfig"),jb=m(e=>{e&&(["secure",...Xe.secure??[]].forEach(t=>{Object.hasOwn(e,t)&&(q.debug(`Denied attempt to modify a secure key ${t}`,e[t]),delete e[t])}),Object.keys(e).forEach(t=>{t.startsWith("__")&&delete e[t]}),Object.keys(e).forEach(t=>{typeof e[t]=="string"&&(e[t].includes("<")||e[t].includes(">")||e[t].includes("url(data:"))&&delete e[t],typeof e[t]=="object"&&jb(e[t])}))},"sanitize"),gA=m(e=>{Cl(e),e.fontFamily&&!e.themeVariables?.fontFamily&&(e.themeVariables={...e.themeVariables,fontFamily:e.fontFamily}),dn.push(e),wc(Xe,dn)},"addDirective"),_l=m((e=Xe)=>{dn=[],wc(e,dn)},"reset"),mA={LAZY_LOAD_DEPRECATED:"The configuration options lazyLoadedDiagrams and loadExternalDiagramsAtStartup are deprecated. Please use registerExternalDiagrams instead."},zg={},xA=m(e=>{zg[e]||(q.warn(mA[e]),zg[e]=!0)},"issueWarning"),Eb=m(e=>{e&&(e.lazyLoadedDiagrams||e.loadExternalDiagramsAtStartup)&&xA("LAZY_LOAD_DEPRECATED")},"checkConfig"),m7=m(()=>{let e={};Sl&&(e=de(e,Sl));for(const t of dn)e=de(e,t);return e},"getUserDefinedConfig"),oa=/<br\s*\/?>/gi,bA=m(e=>e?Mb(e).replace(/\\n/g,"#br#").split("#br#"):[""],"getRows"),yA=(()=>{let e=!1;return()=>{e||(Lb(),e=!0)}})();function Lb(){const e="data-temp-href-target";ar.addHook("beforeSanitizeAttributes",t=>{t.tagName==="A"&&t.hasAttribute("target")&&t.setAttribute(e,t.getAttribute("target")??"")}),ar.addHook("afterSanitizeAttributes",t=>{t.tagName==="A"&&t.hasAttribute(e)&&(t.setAttribute("target",t.getAttribute(e)??""),t.removeAttribute(e),t.getAttribute("target")==="_blank"&&t.setAttribute("rel","noopener"))})}m(Lb,"setupDompurifyHooks");var Bb=m(e=>(yA(),ar.sanitize(e)),"removeScript"),Hg=m((e,t)=>{if(t.flowchart?.htmlLabels!==!1){const r=t.securityLevel;r==="antiscript"||r==="strict"?e=Bb(e):r!=="loose"&&(e=Mb(e),e=e.replace(/</g,"&lt;").replace(/>/g,"&gt;"),e=e.replace(/=/g,"&equals;"),e=CA(e))}return e},"sanitizeMore"),vr=m((e,t)=>e&&(t.dompurifyConfig?e=ar.sanitize(Hg(e,t),t.dompurifyConfig).toString():e=ar.sanitize(Hg(e,t),{FORBID_TAGS:["style"]}).toString(),e),"sanitizeText"),vA=m((e,t)=>typeof e=="string"?vr(e,t):e.flat().map(r=>vr(r,t)),"sanitizeTextOrArray"),wA=m(e=>oa.test(e),"hasBreaks"),kA=m(e=>e.split(oa),"splitBreaks"),CA=m(e=>e.replace(/#br#/g,"<br/>"),"placeholderToBreak"),Mb=m(e=>e.replace(oa,"#br#"),"breakToPlaceholder"),SA=m(e=>{let t="";return e&&(t=window.location.protocol+"//"+window.location.host+window.location.pathname+window.location.search,t=CSS.escape(t)),t},"getUrl"),pe=m(e=>!(e===!1||["false","null","0"].includes(String(e).trim().toLowerCase())),"evaluate"),_A=m(function(...e){const t=e.filter(r=>!isNaN(r));return Math.max(...t)},"getMax"),TA=m(function(...e){const t=e.filter(r=>!isNaN(r));return Math.min(...t)},"getMin"),qg=m(function(e){const t=e.split(/(,)/),r=[];for(let i=0;i<t.length;i++){let n=t[i];if(n===","&&i>0&&i+1<t.length){const s=t[i-1],o=t[i+1];$A(s,o)&&(n=s+","+o,i++,r.pop())}r.push(AA(n))}return r.join("")},"parseGenericTypes"),Hd=m((e,t)=>Math.max(0,e.split(t).length-1),"countOccurrence"),$A=m((e,t)=>{const r=Hd(e,"~"),i=Hd(t,"~");return r===1&&i===1},"shouldCombineSets"),AA=m(e=>{const t=Hd(e,"~");let r=!1;if(t<=1)return e;t%2!==0&&e.startsWith("~")&&(e=e.substring(1),r=!0);const i=[...e];let n=i.indexOf("~"),s=i.lastIndexOf("~");for(;n!==-1&&s!==-1&&n!==s;)i[n]="<",i[s]=">",n=i.indexOf("~"),s=i.lastIndexOf("~");return r&&i.unshift("~"),i.join("")},"processSet"),Wg=m(()=>window.MathMLElement!==void 0,"isMathMLSupported"),qd=/\$\$(.*)\$\$/g,xs=m(e=>(e.match(qd)?.length??0)>0,"hasKatex"),x7=m(async(e,t)=>{const r=document.createElement("div");r.innerHTML=await lp(e,t),r.id="katex-temp",r.style.visibility="hidden",r.style.position="absolute",r.style.top="0",document.querySelector("body")?.insertAdjacentElement("beforeend",r);const n={width:r.clientWidth,height:r.clientHeight};return r.remove(),n},"calculateMathMLDimensions"),jA=m(async(e,t)=>{if(!xs(e))return e;if(!(Wg()||t.legacyMathML||t.forceLegacyMathML))return e.replace(qd,"MathML is unsupported in this environment.");{const{default:r}=await Ht(async()=>{const{default:n}=await import("./katex.js");return{default:n}},[]),i=t.forceLegacyMathML||!Wg()&&t.legacyMathML?"htmlAndMathml":"mathml";return e.split(oa).map(n=>xs(n)?`<div style="display: flex; align-items: center; justify-content: center; white-space: nowrap;">${n}</div>`:`<div>${n}</div>`).join("").replace(qd,(n,s)=>r.renderToString(s,{throwOnError:!0,displayMode:!0,output:i}).replace(/\n/g," ").replace(/<annotation.*<\/annotation>/g,""))}},"renderKatexUnsanitized"),lp=m(async(e,t)=>vr(await jA(e,t),t),"renderKatexSanitized"),Bs={getRows:bA,sanitizeText:vr,sanitizeTextOrArray:vA,hasBreaks:wA,splitBreaks:kA,lineBreakRegex:oa,removeScript:Bb,getUrl:SA,evaluate:pe,getMax:_A,getMin:TA},EA=m(function(e,t){for(let r of t)e.attr(r[0],r[1])},"d3Attrs"),LA=m(function(e,t,r){let i=new Map;return r?(i.set("width","100%"),i.set("style",`max-width: ${t}px;`)):(i.set("height",e),i.set("width",t)),i},"calculateSvgSizeAttrs"),Ib=m(function(e,t,r,i){const n=LA(t,r,i);EA(e,n)},"configureSvgSize"),BA=m(function(e,t,r,i){const n=t.node().getBBox(),s=n.width,o=n.height;q.info(`SVG bounds: ${s}x${o}`,n);let a=0,l=0;q.info(`Graph bounds: ${a}x${l}`,e),a=s+r*2,l=o+r*2,q.info(`Calculated bounds: ${a}x${l}`),Ib(t,l,a,i);const c=`${n.x-r} ${n.y-r} ${n.width+2*r} ${n.height+2*r}`;t.attr("viewBox",c)},"setupGraphViewbox"),nl={},MA=m((e,t,r)=>{let i="";return e in nl&&nl[e]?i=nl[e](r):q.warn(`No theme found for ${e}`),` & {
    font-family: ${r.fontFamily};
    font-size: ${r.fontSize};
    fill: ${r.textColor}
  }
  @keyframes edge-animation-frame {
    from {
      stroke-dashoffset: 0;
    }
  }
  @keyframes dash {
    to {
      stroke-dashoffset: 0;
    }
  }
  & .edge-animation-slow {
    stroke-dasharray: 9,5 !important;
    stroke-dashoffset: 900;
    animation: dash 50s linear infinite;
    stroke-linecap: round;
  }
  & .edge-animation-fast {
    stroke-dasharray: 9,5 !important;
    stroke-dashoffset: 900;
    animation: dash 20s linear infinite;
    stroke-linecap: round;
  }
  /* Classes common for multiple diagrams */

  & .error-icon {
    fill: ${r.errorBkgColor};
  }
  & .error-text {
    fill: ${r.errorTextColor};
    stroke: ${r.errorTextColor};
  }

  & .edge-thickness-normal {
    stroke-width: 1px;
  }
  & .edge-thickness-thick {
    stroke-width: 3.5px
  }
  & .edge-pattern-solid {
    stroke-dasharray: 0;
  }
  & .edge-thickness-invisible {
    stroke-width: 0;
    fill: none;
  }
  & .edge-pattern-dashed{
    stroke-dasharray: 3;
  }
  .edge-pattern-dotted {
    stroke-dasharray: 2;
  }

  & .marker {
    fill: ${r.lineColor};
    stroke: ${r.lineColor};
  }
  & .marker.cross {
    stroke: ${r.lineColor};
  }

  & svg {
    font-family: ${r.fontFamily};
    font-size: ${r.fontSize};
  }
   & p {
    margin: 0
   }

  ${i}

  ${t}
`},"getStyles"),IA=m((e,t)=>{t!==void 0&&(nl[e]=t)},"addStylesForDiagram"),OA=MA,Ob={};W$(Ob,{clear:()=>RA,getAccDescription:()=>NA,getAccTitle:()=>FA,getDiagramTitle:()=>HA,setAccDescription:()=>PA,setAccTitle:()=>DA,setDiagramTitle:()=>zA});var cp="",hp="",dp="",up=m(e=>vr(e,Te()),"sanitizeText"),RA=m(()=>{cp="",dp="",hp=""},"clear"),DA=m(e=>{cp=up(e).replace(/^\s+/g,"")},"setAccTitle"),FA=m(()=>cp,"getAccTitle"),PA=m(e=>{dp=up(e).replace(/\n\s+/g,`
`)},"setAccDescription"),NA=m(()=>dp,"getAccDescription"),zA=m(e=>{hp=up(e)},"setDiagramTitle"),HA=m(()=>hp,"getDiagramTitle"),Vg=q,qA=op,Nt=Te,b7=Ab,y7=ms,pp=m(e=>vr(e,Nt()),"sanitizeText"),WA=BA,VA=m(()=>Ob,"getCommonDb"),Tl={},$l=m((e,t,r)=>{Tl[e]&&Vg.warn(`Diagram with id ${e} already registered. Overwriting.`),Tl[e]=t,r&&Cb(e,r),IA(e,t.styles),t.injectUtils?.(Vg,qA,Nt,pp,WA,VA(),()=>{})},"registerDiagram"),Wd=m(e=>{if(e in Tl)return Tl[e];throw new UA(e)},"getDiagram"),os,UA=(os=class extends Error{constructor(t){super(`Diagram ${t} not found.`)}},m(os,"DiagramNotFoundError"),os),GA={value:()=>{}};function Rb(){for(var e=0,t=arguments.length,r={},i;e<t;++e){if(!(i=arguments[e]+"")||i in r||/[\s.]/.test(i))throw new Error("illegal type: "+i);r[i]=[]}return new sl(r)}function sl(e){this._=e}function YA(e,t){return e.trim().split(/^|\s+/).map(function(r){var i="",n=r.indexOf(".");if(n>=0&&(i=r.slice(n+1),r=r.slice(0,n)),r&&!t.hasOwnProperty(r))throw new Error("unknown type: "+r);return{type:r,name:i}})}sl.prototype=Rb.prototype={constructor:sl,on:function(e,t){var r=this._,i=YA(e+"",r),n,s=-1,o=i.length;if(arguments.length<2){for(;++s<o;)if((n=(e=i[s]).type)&&(n=XA(r[n],e.name)))return n;return}if(t!=null&&typeof t!="function")throw new Error("invalid callback: "+t);for(;++s<o;)if(n=(e=i[s]).type)r[n]=Ug(r[n],e.name,t);else if(t==null)for(n in r)r[n]=Ug(r[n],e.name,null);return this},copy:function(){var e={},t=this._;for(var r in t)e[r]=t[r].slice();return new sl(e)},call:function(e,t){if((n=arguments.length-2)>0)for(var r=new Array(n),i=0,n,s;i<n;++i)r[i]=arguments[i+2];if(!this._.hasOwnProperty(e))throw new Error("unknown type: "+e);for(s=this._[e],i=0,n=s.length;i<n;++i)s[i].value.apply(t,r)},apply:function(e,t,r){if(!this._.hasOwnProperty(e))throw new Error("unknown type: "+e);for(var i=this._[e],n=0,s=i.length;n<s;++n)i[n].value.apply(t,r)}};function XA(e,t){for(var r=0,i=e.length,n;r<i;++r)if((n=e[r]).name===t)return n.value}function Ug(e,t,r){for(var i=0,n=e.length;i<n;++i)if(e[i].name===t){e[i]=GA,e=e.slice(0,i).concat(e.slice(i+1));break}return r!=null&&e.push({name:t,value:r}),e}var Vd="http://www.w3.org/1999/xhtml";const Gg={svg:"http://www.w3.org/2000/svg",xhtml:Vd,xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace",xmlns:"http://www.w3.org/2000/xmlns/"};function kc(e){var t=e+="",r=t.indexOf(":");return r>=0&&(t=e.slice(0,r))!=="xmlns"&&(e=e.slice(r+1)),Gg.hasOwnProperty(t)?{space:Gg[t],local:e}:e}function QA(e){return function(){var t=this.ownerDocument,r=this.namespaceURI;return r===Vd&&t.documentElement.namespaceURI===Vd?t.createElement(e):t.createElementNS(r,e)}}function ZA(e){return function(){return this.ownerDocument.createElementNS(e.space,e.local)}}function Db(e){var t=kc(e);return(t.local?ZA:QA)(t)}function JA(){}function fp(e){return e==null?JA:function(){return this.querySelector(e)}}function KA(e){typeof e!="function"&&(e=fp(e));for(var t=this._groups,r=t.length,i=new Array(r),n=0;n<r;++n)for(var s=t[n],o=s.length,a=i[n]=new Array(o),l,c,d=0;d<o;++d)(l=s[d])&&(c=e.call(l,l.__data__,d,s))&&("__data__"in l&&(c.__data__=l.__data__),a[d]=c);return new lr(i,this._parents)}function tj(e){return e==null?[]:Array.isArray(e)?e:Array.from(e)}function ej(){return[]}function Fb(e){return e==null?ej:function(){return this.querySelectorAll(e)}}function rj(e){return function(){return tj(e.apply(this,arguments))}}function ij(e){typeof e=="function"?e=rj(e):e=Fb(e);for(var t=this._groups,r=t.length,i=[],n=[],s=0;s<r;++s)for(var o=t[s],a=o.length,l,c=0;c<a;++c)(l=o[c])&&(i.push(e.call(l,l.__data__,c,o)),n.push(l));return new lr(i,n)}function Pb(e){return function(){return this.matches(e)}}function Nb(e){return function(t){return t.matches(e)}}var nj=Array.prototype.find;function sj(e){return function(){return nj.call(this.children,e)}}function oj(){return this.firstElementChild}function aj(e){return this.select(e==null?oj:sj(typeof e=="function"?e:Nb(e)))}var lj=Array.prototype.filter;function cj(){return Array.from(this.children)}function hj(e){return function(){return lj.call(this.children,e)}}function dj(e){return this.selectAll(e==null?cj:hj(typeof e=="function"?e:Nb(e)))}function uj(e){typeof e!="function"&&(e=Pb(e));for(var t=this._groups,r=t.length,i=new Array(r),n=0;n<r;++n)for(var s=t[n],o=s.length,a=i[n]=[],l,c=0;c<o;++c)(l=s[c])&&e.call(l,l.__data__,c,s)&&a.push(l);return new lr(i,this._parents)}function zb(e){return new Array(e.length)}function pj(){return new lr(this._enter||this._groups.map(zb),this._parents)}function Al(e,t){this.ownerDocument=e.ownerDocument,this.namespaceURI=e.namespaceURI,this._next=null,this._parent=e,this.__data__=t}Al.prototype={constructor:Al,appendChild:function(e){return this._parent.insertBefore(e,this._next)},insertBefore:function(e,t){return this._parent.insertBefore(e,t)},querySelector:function(e){return this._parent.querySelector(e)},querySelectorAll:function(e){return this._parent.querySelectorAll(e)}};function fj(e){return function(){return e}}function gj(e,t,r,i,n,s){for(var o=0,a,l=t.length,c=s.length;o<c;++o)(a=t[o])?(a.__data__=s[o],i[o]=a):r[o]=new Al(e,s[o]);for(;o<l;++o)(a=t[o])&&(n[o]=a)}function mj(e,t,r,i,n,s,o){var a,l,c=new Map,d=t.length,u=s.length,p=new Array(d),f;for(a=0;a<d;++a)(l=t[a])&&(p[a]=f=o.call(l,l.__data__,a,t)+"",c.has(f)?n[a]=l:c.set(f,l));for(a=0;a<u;++a)f=o.call(e,s[a],a,s)+"",(l=c.get(f))?(i[a]=l,l.__data__=s[a],c.delete(f)):r[a]=new Al(e,s[a]);for(a=0;a<d;++a)(l=t[a])&&c.get(p[a])===l&&(n[a]=l)}function xj(e){return e.__data__}function bj(e,t){if(!arguments.length)return Array.from(this,xj);var r=t?mj:gj,i=this._parents,n=this._groups;typeof e!="function"&&(e=fj(e));for(var s=n.length,o=new Array(s),a=new Array(s),l=new Array(s),c=0;c<s;++c){var d=i[c],u=n[c],p=u.length,f=yj(e.call(d,d&&d.__data__,c,i)),g=f.length,x=a[c]=new Array(g),v=o[c]=new Array(g),y=l[c]=new Array(p);r(d,u,x,v,y,f,t);for(var b=0,w=0,S,_;b<g;++b)if(S=x[b]){for(b>=w&&(w=b+1);!(_=v[w])&&++w<g;);S._next=_||null}}return o=new lr(o,i),o._enter=a,o._exit=l,o}function yj(e){return typeof e=="object"&&"length"in e?e:Array.from(e)}function vj(){return new lr(this._exit||this._groups.map(zb),this._parents)}function wj(e,t,r){var i=this.enter(),n=this,s=this.exit();return typeof e=="function"?(i=e(i),i&&(i=i.selection())):i=i.append(e+""),t!=null&&(n=t(n),n&&(n=n.selection())),r==null?s.remove():r(s),i&&n?i.merge(n).order():n}function kj(e){for(var t=e.selection?e.selection():e,r=this._groups,i=t._groups,n=r.length,s=i.length,o=Math.min(n,s),a=new Array(n),l=0;l<o;++l)for(var c=r[l],d=i[l],u=c.length,p=a[l]=new Array(u),f,g=0;g<u;++g)(f=c[g]||d[g])&&(p[g]=f);for(;l<n;++l)a[l]=r[l];return new lr(a,this._parents)}function Cj(){for(var e=this._groups,t=-1,r=e.length;++t<r;)for(var i=e[t],n=i.length-1,s=i[n],o;--n>=0;)(o=i[n])&&(s&&o.compareDocumentPosition(s)^4&&s.parentNode.insertBefore(o,s),s=o);return this}function Sj(e){e||(e=_j);function t(u,p){return u&&p?e(u.__data__,p.__data__):!u-!p}for(var r=this._groups,i=r.length,n=new Array(i),s=0;s<i;++s){for(var o=r[s],a=o.length,l=n[s]=new Array(a),c,d=0;d<a;++d)(c=o[d])&&(l[d]=c);l.sort(t)}return new lr(n,this._parents).order()}function _j(e,t){return e<t?-1:e>t?1:e>=t?0:NaN}function Tj(){var e=arguments[0];return arguments[0]=this,e.apply(null,arguments),this}function $j(){return Array.from(this)}function Aj(){for(var e=this._groups,t=0,r=e.length;t<r;++t)for(var i=e[t],n=0,s=i.length;n<s;++n){var o=i[n];if(o)return o}return null}function jj(){let e=0;for(const t of this)++e;return e}function Ej(){return!this.node()}function Lj(e){for(var t=this._groups,r=0,i=t.length;r<i;++r)for(var n=t[r],s=0,o=n.length,a;s<o;++s)(a=n[s])&&e.call(a,a.__data__,s,n);return this}function Bj(e){return function(){this.removeAttribute(e)}}function Mj(e){return function(){this.removeAttributeNS(e.space,e.local)}}function Ij(e,t){return function(){this.setAttribute(e,t)}}function Oj(e,t){return function(){this.setAttributeNS(e.space,e.local,t)}}function Rj(e,t){return function(){var r=t.apply(this,arguments);r==null?this.removeAttribute(e):this.setAttribute(e,r)}}function Dj(e,t){return function(){var r=t.apply(this,arguments);r==null?this.removeAttributeNS(e.space,e.local):this.setAttributeNS(e.space,e.local,r)}}function Fj(e,t){var r=kc(e);if(arguments.length<2){var i=this.node();return r.local?i.getAttributeNS(r.space,r.local):i.getAttribute(r)}return this.each((t==null?r.local?Mj:Bj:typeof t=="function"?r.local?Dj:Rj:r.local?Oj:Ij)(r,t))}function Hb(e){return e.ownerDocument&&e.ownerDocument.defaultView||e.document&&e||e.defaultView}function Pj(e){return function(){this.style.removeProperty(e)}}function Nj(e,t,r){return function(){this.style.setProperty(e,t,r)}}function zj(e,t,r){return function(){var i=t.apply(this,arguments);i==null?this.style.removeProperty(e):this.style.setProperty(e,i,r)}}function Hj(e,t,r){return arguments.length>1?this.each((t==null?Pj:typeof t=="function"?zj:Nj)(e,t,r??"")):bs(this.node(),e)}function bs(e,t){return e.style.getPropertyValue(t)||Hb(e).getComputedStyle(e,null).getPropertyValue(t)}function qj(e){return function(){delete this[e]}}function Wj(e,t){return function(){this[e]=t}}function Vj(e,t){return function(){var r=t.apply(this,arguments);r==null?delete this[e]:this[e]=r}}function Uj(e,t){return arguments.length>1?this.each((t==null?qj:typeof t=="function"?Vj:Wj)(e,t)):this.node()[e]}function qb(e){return e.trim().split(/^|\s+/)}function gp(e){return e.classList||new Wb(e)}function Wb(e){this._node=e,this._names=qb(e.getAttribute("class")||"")}Wb.prototype={add:function(e){var t=this._names.indexOf(e);t<0&&(this._names.push(e),this._node.setAttribute("class",this._names.join(" ")))},remove:function(e){var t=this._names.indexOf(e);t>=0&&(this._names.splice(t,1),this._node.setAttribute("class",this._names.join(" ")))},contains:function(e){return this._names.indexOf(e)>=0}};function Vb(e,t){for(var r=gp(e),i=-1,n=t.length;++i<n;)r.add(t[i])}function Ub(e,t){for(var r=gp(e),i=-1,n=t.length;++i<n;)r.remove(t[i])}function Gj(e){return function(){Vb(this,e)}}function Yj(e){return function(){Ub(this,e)}}function Xj(e,t){return function(){(t.apply(this,arguments)?Vb:Ub)(this,e)}}function Qj(e,t){var r=qb(e+"");if(arguments.length<2){for(var i=gp(this.node()),n=-1,s=r.length;++n<s;)if(!i.contains(r[n]))return!1;return!0}return this.each((typeof t=="function"?Xj:t?Gj:Yj)(r,t))}function Zj(){this.textContent=""}function Jj(e){return function(){this.textContent=e}}function Kj(e){return function(){var t=e.apply(this,arguments);this.textContent=t??""}}function tE(e){return arguments.length?this.each(e==null?Zj:(typeof e=="function"?Kj:Jj)(e)):this.node().textContent}function eE(){this.innerHTML=""}function rE(e){return function(){this.innerHTML=e}}function iE(e){return function(){var t=e.apply(this,arguments);this.innerHTML=t??""}}function nE(e){return arguments.length?this.each(e==null?eE:(typeof e=="function"?iE:rE)(e)):this.node().innerHTML}function sE(){this.nextSibling&&this.parentNode.appendChild(this)}function oE(){return this.each(sE)}function aE(){this.previousSibling&&this.parentNode.insertBefore(this,this.parentNode.firstChild)}function lE(){return this.each(aE)}function cE(e){var t=typeof e=="function"?e:Db(e);return this.select(function(){return this.appendChild(t.apply(this,arguments))})}function hE(){return null}function dE(e,t){var r=typeof e=="function"?e:Db(e),i=t==null?hE:typeof t=="function"?t:fp(t);return this.select(function(){return this.insertBefore(r.apply(this,arguments),i.apply(this,arguments)||null)})}function uE(){var e=this.parentNode;e&&e.removeChild(this)}function pE(){return this.each(uE)}function fE(){var e=this.cloneNode(!1),t=this.parentNode;return t?t.insertBefore(e,this.nextSibling):e}function gE(){var e=this.cloneNode(!0),t=this.parentNode;return t?t.insertBefore(e,this.nextSibling):e}function mE(e){return this.select(e?gE:fE)}function xE(e){return arguments.length?this.property("__data__",e):this.node().__data__}function bE(e){return function(t){e.call(this,t,this.__data__)}}function yE(e){return e.trim().split(/^|\s+/).map(function(t){var r="",i=t.indexOf(".");return i>=0&&(r=t.slice(i+1),t=t.slice(0,i)),{type:t,name:r}})}function vE(e){return function(){var t=this.__on;if(t){for(var r=0,i=-1,n=t.length,s;r<n;++r)s=t[r],(!e.type||s.type===e.type)&&s.name===e.name?this.removeEventListener(s.type,s.listener,s.options):t[++i]=s;++i?t.length=i:delete this.__on}}}function wE(e,t,r){return function(){var i=this.__on,n,s=bE(t);if(i){for(var o=0,a=i.length;o<a;++o)if((n=i[o]).type===e.type&&n.name===e.name){this.removeEventListener(n.type,n.listener,n.options),this.addEventListener(n.type,n.listener=s,n.options=r),n.value=t;return}}this.addEventListener(e.type,s,r),n={type:e.type,name:e.name,value:t,listener:s,options:r},i?i.push(n):this.__on=[n]}}function kE(e,t,r){var i=yE(e+""),n,s=i.length,o;if(arguments.length<2){var a=this.node().__on;if(a){for(var l=0,c=a.length,d;l<c;++l)for(n=0,d=a[l];n<s;++n)if((o=i[n]).type===d.type&&o.name===d.name)return d.value}return}for(a=t?wE:vE,n=0;n<s;++n)this.each(a(i[n],t,r));return this}function Gb(e,t,r){var i=Hb(e),n=i.CustomEvent;typeof n=="function"?n=new n(t,r):(n=i.document.createEvent("Event"),r?(n.initEvent(t,r.bubbles,r.cancelable),n.detail=r.detail):n.initEvent(t,!1,!1)),e.dispatchEvent(n)}function CE(e,t){return function(){return Gb(this,e,t)}}function SE(e,t){return function(){return Gb(this,e,t.apply(this,arguments))}}function _E(e,t){return this.each((typeof t=="function"?SE:CE)(e,t))}function*TE(){for(var e=this._groups,t=0,r=e.length;t<r;++t)for(var i=e[t],n=0,s=i.length,o;n<s;++n)(o=i[n])&&(yield o)}var Yb=[null];function lr(e,t){this._groups=e,this._parents=t}function aa(){return new lr([[document.documentElement]],Yb)}function $E(){return this}lr.prototype=aa.prototype={constructor:lr,select:KA,selectAll:ij,selectChild:aj,selectChildren:dj,filter:uj,data:bj,enter:pj,exit:vj,join:wj,merge:kj,selection:$E,order:Cj,sort:Sj,call:Tj,nodes:$j,node:Aj,size:jj,empty:Ej,each:Lj,attr:Fj,style:Hj,property:Uj,classed:Qj,text:tE,html:nE,raise:oE,lower:lE,append:cE,insert:dE,remove:pE,clone:mE,datum:xE,on:kE,dispatch:_E,[Symbol.iterator]:TE};function Lt(e){return typeof e=="string"?new lr([[document.querySelector(e)]],[document.documentElement]):new lr([[e]],Yb)}function mp(e,t,r){e.prototype=t.prototype=r,r.constructor=e}function Xb(e,t){var r=Object.create(e.prototype);for(var i in t)r[i]=t[i];return r}function la(){}var Ro=.7,jl=1/Ro,Jn="\\s*([+-]?\\d+)\\s*",Do="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",Ur="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",AE=/^#([0-9a-f]{3,8})$/,jE=new RegExp(`^rgb\\(${Jn},${Jn},${Jn}\\)$`),EE=new RegExp(`^rgb\\(${Ur},${Ur},${Ur}\\)$`),LE=new RegExp(`^rgba\\(${Jn},${Jn},${Jn},${Do}\\)$`),BE=new RegExp(`^rgba\\(${Ur},${Ur},${Ur},${Do}\\)$`),ME=new RegExp(`^hsl\\(${Do},${Ur},${Ur}\\)$`),IE=new RegExp(`^hsla\\(${Do},${Ur},${Ur},${Do}\\)$`),Yg={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};mp(la,Fo,{copy(e){return Object.assign(new this.constructor,this,e)},displayable(){return this.rgb().displayable()},hex:Xg,formatHex:Xg,formatHex8:OE,formatHsl:RE,formatRgb:Qg,toString:Qg});function Xg(){return this.rgb().formatHex()}function OE(){return this.rgb().formatHex8()}function RE(){return Qb(this).formatHsl()}function Qg(){return this.rgb().formatRgb()}function Fo(e){var t,r;return e=(e+"").trim().toLowerCase(),(t=AE.exec(e))?(r=t[1].length,t=parseInt(t[1],16),r===6?Zg(t):r===3?new Je(t>>8&15|t>>4&240,t>>4&15|t&240,(t&15)<<4|t&15,1):r===8?La(t>>24&255,t>>16&255,t>>8&255,(t&255)/255):r===4?La(t>>12&15|t>>8&240,t>>8&15|t>>4&240,t>>4&15|t&240,((t&15)<<4|t&15)/255):null):(t=jE.exec(e))?new Je(t[1],t[2],t[3],1):(t=EE.exec(e))?new Je(t[1]*255/100,t[2]*255/100,t[3]*255/100,1):(t=LE.exec(e))?La(t[1],t[2],t[3],t[4]):(t=BE.exec(e))?La(t[1]*255/100,t[2]*255/100,t[3]*255/100,t[4]):(t=ME.exec(e))?tm(t[1],t[2]/100,t[3]/100,1):(t=IE.exec(e))?tm(t[1],t[2]/100,t[3]/100,t[4]):Yg.hasOwnProperty(e)?Zg(Yg[e]):e==="transparent"?new Je(NaN,NaN,NaN,0):null}function Zg(e){return new Je(e>>16&255,e>>8&255,e&255,1)}function La(e,t,r,i){return i<=0&&(e=t=r=NaN),new Je(e,t,r,i)}function DE(e){return e instanceof la||(e=Fo(e)),e?(e=e.rgb(),new Je(e.r,e.g,e.b,e.opacity)):new Je}function Ud(e,t,r,i){return arguments.length===1?DE(e):new Je(e,t,r,i??1)}function Je(e,t,r,i){this.r=+e,this.g=+t,this.b=+r,this.opacity=+i}mp(Je,Ud,Xb(la,{brighter(e){return e=e==null?jl:Math.pow(jl,e),new Je(this.r*e,this.g*e,this.b*e,this.opacity)},darker(e){return e=e==null?Ro:Math.pow(Ro,e),new Je(this.r*e,this.g*e,this.b*e,this.opacity)},rgb(){return this},clamp(){return new Je(ln(this.r),ln(this.g),ln(this.b),El(this.opacity))},displayable(){return-.5<=this.r&&this.r<255.5&&-.5<=this.g&&this.g<255.5&&-.5<=this.b&&this.b<255.5&&0<=this.opacity&&this.opacity<=1},hex:Jg,formatHex:Jg,formatHex8:FE,formatRgb:Kg,toString:Kg}));function Jg(){return`#${tn(this.r)}${tn(this.g)}${tn(this.b)}`}function FE(){return`#${tn(this.r)}${tn(this.g)}${tn(this.b)}${tn((isNaN(this.opacity)?1:this.opacity)*255)}`}function Kg(){const e=El(this.opacity);return`${e===1?"rgb(":"rgba("}${ln(this.r)}, ${ln(this.g)}, ${ln(this.b)}${e===1?")":`, ${e})`}`}function El(e){return isNaN(e)?1:Math.max(0,Math.min(1,e))}function ln(e){return Math.max(0,Math.min(255,Math.round(e)||0))}function tn(e){return e=ln(e),(e<16?"0":"")+e.toString(16)}function tm(e,t,r,i){return i<=0?e=t=r=NaN:r<=0||r>=1?e=t=NaN:t<=0&&(e=NaN),new Ar(e,t,r,i)}function Qb(e){if(e instanceof Ar)return new Ar(e.h,e.s,e.l,e.opacity);if(e instanceof la||(e=Fo(e)),!e)return new Ar;if(e instanceof Ar)return e;e=e.rgb();var t=e.r/255,r=e.g/255,i=e.b/255,n=Math.min(t,r,i),s=Math.max(t,r,i),o=NaN,a=s-n,l=(s+n)/2;return a?(t===s?o=(r-i)/a+(r<i)*6:r===s?o=(i-t)/a+2:o=(t-r)/a+4,a/=l<.5?s+n:2-s-n,o*=60):a=l>0&&l<1?0:o,new Ar(o,a,l,e.opacity)}function PE(e,t,r,i){return arguments.length===1?Qb(e):new Ar(e,t,r,i??1)}function Ar(e,t,r,i){this.h=+e,this.s=+t,this.l=+r,this.opacity=+i}mp(Ar,PE,Xb(la,{brighter(e){return e=e==null?jl:Math.pow(jl,e),new Ar(this.h,this.s,this.l*e,this.opacity)},darker(e){return e=e==null?Ro:Math.pow(Ro,e),new Ar(this.h,this.s,this.l*e,this.opacity)},rgb(){var e=this.h%360+(this.h<0)*360,t=isNaN(e)||isNaN(this.s)?0:this.s,r=this.l,i=r+(r<.5?r:1-r)*t,n=2*r-i;return new Je($h(e>=240?e-240:e+120,n,i),$h(e,n,i),$h(e<120?e+240:e-120,n,i),this.opacity)},clamp(){return new Ar(em(this.h),Ba(this.s),Ba(this.l),El(this.opacity))},displayable(){return(0<=this.s&&this.s<=1||isNaN(this.s))&&0<=this.l&&this.l<=1&&0<=this.opacity&&this.opacity<=1},formatHsl(){const e=El(this.opacity);return`${e===1?"hsl(":"hsla("}${em(this.h)}, ${Ba(this.s)*100}%, ${Ba(this.l)*100}%${e===1?")":`, ${e})`}`}}));function em(e){return e=(e||0)%360,e<0?e+360:e}function Ba(e){return Math.max(0,Math.min(1,e||0))}function $h(e,t,r){return(e<60?t+(r-t)*e/60:e<180?r:e<240?t+(r-t)*(240-e)/60:t)*255}const xp=e=>()=>e;function Zb(e,t){return function(r){return e+r*t}}function NE(e,t,r){return e=Math.pow(e,r),t=Math.pow(t,r)-e,r=1/r,function(i){return Math.pow(e+i*t,r)}}function v7(e,t){var r=t-e;return r?Zb(e,r>180||r<-180?r-360*Math.round(r/360):r):xp(isNaN(e)?t:e)}function zE(e){return(e=+e)==1?Jb:function(t,r){return r-t?NE(t,r,e):xp(isNaN(t)?r:t)}}function Jb(e,t){var r=t-e;return r?Zb(e,r):xp(isNaN(e)?t:e)}const rm=function e(t){var r=zE(t);function i(n,s){var o=r((n=Ud(n)).r,(s=Ud(s)).r),a=r(n.g,s.g),l=r(n.b,s.b),c=Jb(n.opacity,s.opacity);return function(d){return n.r=o(d),n.g=a(d),n.b=l(d),n.opacity=c(d),n+""}}return i.gamma=e,i}(1);function ki(e,t){return e=+e,t=+t,function(r){return e*(1-r)+t*r}}var Gd=/[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,Ah=new RegExp(Gd.source,"g");function HE(e){return function(){return e}}function qE(e){return function(t){return e(t)+""}}function WE(e,t){var r=Gd.lastIndex=Ah.lastIndex=0,i,n,s,o=-1,a=[],l=[];for(e=e+"",t=t+"";(i=Gd.exec(e))&&(n=Ah.exec(t));)(s=n.index)>r&&(s=t.slice(r,s),a[o]?a[o]+=s:a[++o]=s),(i=i[0])===(n=n[0])?a[o]?a[o]+=n:a[++o]=n:(a[++o]=null,l.push({i:o,x:ki(i,n)})),r=Ah.lastIndex;return r<t.length&&(s=t.slice(r),a[o]?a[o]+=s:a[++o]=s),a.length<2?l[0]?qE(l[0].x):HE(t):(t=l.length,function(c){for(var d=0,u;d<t;++d)a[(u=l[d]).i]=u.x(c);return a.join("")})}var im=180/Math.PI,Yd={translateX:0,translateY:0,rotate:0,skewX:0,scaleX:1,scaleY:1};function Kb(e,t,r,i,n,s){var o,a,l;return(o=Math.sqrt(e*e+t*t))&&(e/=o,t/=o),(l=e*r+t*i)&&(r-=e*l,i-=t*l),(a=Math.sqrt(r*r+i*i))&&(r/=a,i/=a,l/=a),e*i<t*r&&(e=-e,t=-t,l=-l,o=-o),{translateX:n,translateY:s,rotate:Math.atan2(t,e)*im,skewX:Math.atan(l)*im,scaleX:o,scaleY:a}}var Ma;function VE(e){const t=new(typeof DOMMatrix=="function"?DOMMatrix:WebKitCSSMatrix)(e+"");return t.isIdentity?Yd:Kb(t.a,t.b,t.c,t.d,t.e,t.f)}function UE(e){return e==null||(Ma||(Ma=document.createElementNS("http://www.w3.org/2000/svg","g")),Ma.setAttribute("transform",e),!(e=Ma.transform.baseVal.consolidate()))?Yd:(e=e.matrix,Kb(e.a,e.b,e.c,e.d,e.e,e.f))}function ty(e,t,r,i){function n(c){return c.length?c.pop()+" ":""}function s(c,d,u,p,f,g){if(c!==u||d!==p){var x=f.push("translate(",null,t,null,r);g.push({i:x-4,x:ki(c,u)},{i:x-2,x:ki(d,p)})}else(u||p)&&f.push("translate("+u+t+p+r)}function o(c,d,u,p){c!==d?(c-d>180?d+=360:d-c>180&&(c+=360),p.push({i:u.push(n(u)+"rotate(",null,i)-2,x:ki(c,d)})):d&&u.push(n(u)+"rotate("+d+i)}function a(c,d,u,p){c!==d?p.push({i:u.push(n(u)+"skewX(",null,i)-2,x:ki(c,d)}):d&&u.push(n(u)+"skewX("+d+i)}function l(c,d,u,p,f,g){if(c!==u||d!==p){var x=f.push(n(f)+"scale(",null,",",null,")");g.push({i:x-4,x:ki(c,u)},{i:x-2,x:ki(d,p)})}else(u!==1||p!==1)&&f.push(n(f)+"scale("+u+","+p+")")}return function(c,d){var u=[],p=[];return c=e(c),d=e(d),s(c.translateX,c.translateY,d.translateX,d.translateY,u,p),o(c.rotate,d.rotate,u,p),a(c.skewX,d.skewX,u,p),l(c.scaleX,c.scaleY,d.scaleX,d.scaleY,u,p),c=d=null,function(f){for(var g=-1,x=p.length,v;++g<x;)u[(v=p[g]).i]=v.x(f);return u.join("")}}}var GE=ty(VE,"px, ","px)","deg)"),YE=ty(UE,", ",")",")"),ys=0,co=0,Ks=0,ey=1e3,Ll,ho,Bl=0,un=0,Cc=0,Po=typeof performance=="object"&&performance.now?performance:Date,ry=typeof window=="object"&&window.requestAnimationFrame?window.requestAnimationFrame.bind(window):function(e){setTimeout(e,17)};function bp(){return un||(ry(XE),un=Po.now()+Cc)}function XE(){un=0}function Ml(){this._call=this._time=this._next=null}Ml.prototype=iy.prototype={constructor:Ml,restart:function(e,t,r){if(typeof e!="function")throw new TypeError("callback is not a function");r=(r==null?bp():+r)+(t==null?0:+t),!this._next&&ho!==this&&(ho?ho._next=this:Ll=this,ho=this),this._call=e,this._time=r,Xd()},stop:function(){this._call&&(this._call=null,this._time=1/0,Xd())}};function iy(e,t,r){var i=new Ml;return i.restart(e,t,r),i}function QE(){bp(),++ys;for(var e=Ll,t;e;)(t=un-e._time)>=0&&e._call.call(void 0,t),e=e._next;--ys}function nm(){un=(Bl=Po.now())+Cc,ys=co=0;try{QE()}finally{ys=0,JE(),un=0}}function ZE(){var e=Po.now(),t=e-Bl;t>ey&&(Cc-=t,Bl=e)}function JE(){for(var e,t=Ll,r,i=1/0;t;)t._call?(i>t._time&&(i=t._time),e=t,t=t._next):(r=t._next,t._next=null,t=e?e._next=r:Ll=r);ho=e,Xd(i)}function Xd(e){if(!ys){co&&(co=clearTimeout(co));var t=e-un;t>24?(e<1/0&&(co=setTimeout(nm,e-Po.now()-Cc)),Ks&&(Ks=clearInterval(Ks))):(Ks||(Bl=Po.now(),Ks=setInterval(ZE,ey)),ys=1,ry(nm))}}function sm(e,t,r){var i=new Ml;return t=t==null?0:+t,i.restart(n=>{i.stop(),e(n+t)},t,r),i}var KE=Rb("start","end","cancel","interrupt"),tL=[],ny=0,om=1,Qd=2,ol=3,am=4,Zd=5,al=6;function Sc(e,t,r,i,n,s){var o=e.__transition;if(!o)e.__transition={};else if(r in o)return;eL(e,r,{name:t,index:i,group:n,on:KE,tween:tL,time:s.time,delay:s.delay,duration:s.duration,ease:s.ease,timer:null,state:ny})}function yp(e,t){var r=Dr(e,t);if(r.state>ny)throw new Error("too late; already scheduled");return r}function Xr(e,t){var r=Dr(e,t);if(r.state>ol)throw new Error("too late; already running");return r}function Dr(e,t){var r=e.__transition;if(!r||!(r=r[t]))throw new Error("transition not found");return r}function eL(e,t,r){var i=e.__transition,n;i[t]=r,r.timer=iy(s,0,r.time);function s(c){r.state=om,r.timer.restart(o,r.delay,r.time),r.delay<=c&&o(c-r.delay)}function o(c){var d,u,p,f;if(r.state!==om)return l();for(d in i)if(f=i[d],f.name===r.name){if(f.state===ol)return sm(o);f.state===am?(f.state=al,f.timer.stop(),f.on.call("interrupt",e,e.__data__,f.index,f.group),delete i[d]):+d<t&&(f.state=al,f.timer.stop(),f.on.call("cancel",e,e.__data__,f.index,f.group),delete i[d])}if(sm(function(){r.state===ol&&(r.state=am,r.timer.restart(a,r.delay,r.time),a(c))}),r.state=Qd,r.on.call("start",e,e.__data__,r.index,r.group),r.state===Qd){for(r.state=ol,n=new Array(p=r.tween.length),d=0,u=-1;d<p;++d)(f=r.tween[d].value.call(e,e.__data__,r.index,r.group))&&(n[++u]=f);n.length=u+1}}function a(c){for(var d=c<r.duration?r.ease.call(null,c/r.duration):(r.timer.restart(l),r.state=Zd,1),u=-1,p=n.length;++u<p;)n[u].call(e,d);r.state===Zd&&(r.on.call("end",e,e.__data__,r.index,r.group),l())}function l(){r.state=al,r.timer.stop(),delete i[t];for(var c in i)return;delete e.__transition}}function rL(e,t){var r=e.__transition,i,n,s=!0,o;if(r){t=t==null?null:t+"";for(o in r){if((i=r[o]).name!==t){s=!1;continue}n=i.state>Qd&&i.state<Zd,i.state=al,i.timer.stop(),i.on.call(n?"interrupt":"cancel",e,e.__data__,i.index,i.group),delete r[o]}s&&delete e.__transition}}function iL(e){return this.each(function(){rL(this,e)})}function nL(e,t){var r,i;return function(){var n=Xr(this,e),s=n.tween;if(s!==r){i=r=s;for(var o=0,a=i.length;o<a;++o)if(i[o].name===t){i=i.slice(),i.splice(o,1);break}}n.tween=i}}function sL(e,t,r){var i,n;if(typeof r!="function")throw new Error;return function(){var s=Xr(this,e),o=s.tween;if(o!==i){n=(i=o).slice();for(var a={name:t,value:r},l=0,c=n.length;l<c;++l)if(n[l].name===t){n[l]=a;break}l===c&&n.push(a)}s.tween=n}}function oL(e,t){var r=this._id;if(e+="",arguments.length<2){for(var i=Dr(this.node(),r).tween,n=0,s=i.length,o;n<s;++n)if((o=i[n]).name===e)return o.value;return null}return this.each((t==null?nL:sL)(r,e,t))}function vp(e,t,r){var i=e._id;return e.each(function(){var n=Xr(this,i);(n.value||(n.value={}))[t]=r.apply(this,arguments)}),function(n){return Dr(n,i).value[t]}}function sy(e,t){var r;return(typeof t=="number"?ki:t instanceof Fo?rm:(r=Fo(t))?(t=r,rm):WE)(e,t)}function aL(e){return function(){this.removeAttribute(e)}}function lL(e){return function(){this.removeAttributeNS(e.space,e.local)}}function cL(e,t,r){var i,n=r+"",s;return function(){var o=this.getAttribute(e);return o===n?null:o===i?s:s=t(i=o,r)}}function hL(e,t,r){var i,n=r+"",s;return function(){var o=this.getAttributeNS(e.space,e.local);return o===n?null:o===i?s:s=t(i=o,r)}}function dL(e,t,r){var i,n,s;return function(){var o,a=r(this),l;return a==null?void this.removeAttribute(e):(o=this.getAttribute(e),l=a+"",o===l?null:o===i&&l===n?s:(n=l,s=t(i=o,a)))}}function uL(e,t,r){var i,n,s;return function(){var o,a=r(this),l;return a==null?void this.removeAttributeNS(e.space,e.local):(o=this.getAttributeNS(e.space,e.local),l=a+"",o===l?null:o===i&&l===n?s:(n=l,s=t(i=o,a)))}}function pL(e,t){var r=kc(e),i=r==="transform"?YE:sy;return this.attrTween(e,typeof t=="function"?(r.local?uL:dL)(r,i,vp(this,"attr."+e,t)):t==null?(r.local?lL:aL)(r):(r.local?hL:cL)(r,i,t))}function fL(e,t){return function(r){this.setAttribute(e,t.call(this,r))}}function gL(e,t){return function(r){this.setAttributeNS(e.space,e.local,t.call(this,r))}}function mL(e,t){var r,i;function n(){var s=t.apply(this,arguments);return s!==i&&(r=(i=s)&&gL(e,s)),r}return n._value=t,n}function xL(e,t){var r,i;function n(){var s=t.apply(this,arguments);return s!==i&&(r=(i=s)&&fL(e,s)),r}return n._value=t,n}function bL(e,t){var r="attr."+e;if(arguments.length<2)return(r=this.tween(r))&&r._value;if(t==null)return this.tween(r,null);if(typeof t!="function")throw new Error;var i=kc(e);return this.tween(r,(i.local?mL:xL)(i,t))}function yL(e,t){return function(){yp(this,e).delay=+t.apply(this,arguments)}}function vL(e,t){return t=+t,function(){yp(this,e).delay=t}}function wL(e){var t=this._id;return arguments.length?this.each((typeof e=="function"?yL:vL)(t,e)):Dr(this.node(),t).delay}function kL(e,t){return function(){Xr(this,e).duration=+t.apply(this,arguments)}}function CL(e,t){return t=+t,function(){Xr(this,e).duration=t}}function SL(e){var t=this._id;return arguments.length?this.each((typeof e=="function"?kL:CL)(t,e)):Dr(this.node(),t).duration}function _L(e,t){if(typeof t!="function")throw new Error;return function(){Xr(this,e).ease=t}}function TL(e){var t=this._id;return arguments.length?this.each(_L(t,e)):Dr(this.node(),t).ease}function $L(e,t){return function(){var r=t.apply(this,arguments);if(typeof r!="function")throw new Error;Xr(this,e).ease=r}}function AL(e){if(typeof e!="function")throw new Error;return this.each($L(this._id,e))}function jL(e){typeof e!="function"&&(e=Pb(e));for(var t=this._groups,r=t.length,i=new Array(r),n=0;n<r;++n)for(var s=t[n],o=s.length,a=i[n]=[],l,c=0;c<o;++c)(l=s[c])&&e.call(l,l.__data__,c,s)&&a.push(l);return new hi(i,this._parents,this._name,this._id)}function EL(e){if(e._id!==this._id)throw new Error;for(var t=this._groups,r=e._groups,i=t.length,n=r.length,s=Math.min(i,n),o=new Array(i),a=0;a<s;++a)for(var l=t[a],c=r[a],d=l.length,u=o[a]=new Array(d),p,f=0;f<d;++f)(p=l[f]||c[f])&&(u[f]=p);for(;a<i;++a)o[a]=t[a];return new hi(o,this._parents,this._name,this._id)}function LL(e){return(e+"").trim().split(/^|\s+/).every(function(t){var r=t.indexOf(".");return r>=0&&(t=t.slice(0,r)),!t||t==="start"})}function BL(e,t,r){var i,n,s=LL(t)?yp:Xr;return function(){var o=s(this,e),a=o.on;a!==i&&(n=(i=a).copy()).on(t,r),o.on=n}}function ML(e,t){var r=this._id;return arguments.length<2?Dr(this.node(),r).on.on(e):this.each(BL(r,e,t))}function IL(e){return function(){var t=this.parentNode;for(var r in this.__transition)if(+r!==e)return;t&&t.removeChild(this)}}function OL(){return this.on("end.remove",IL(this._id))}function RL(e){var t=this._name,r=this._id;typeof e!="function"&&(e=fp(e));for(var i=this._groups,n=i.length,s=new Array(n),o=0;o<n;++o)for(var a=i[o],l=a.length,c=s[o]=new Array(l),d,u,p=0;p<l;++p)(d=a[p])&&(u=e.call(d,d.__data__,p,a))&&("__data__"in d&&(u.__data__=d.__data__),c[p]=u,Sc(c[p],t,r,p,c,Dr(d,r)));return new hi(s,this._parents,t,r)}function DL(e){var t=this._name,r=this._id;typeof e!="function"&&(e=Fb(e));for(var i=this._groups,n=i.length,s=[],o=[],a=0;a<n;++a)for(var l=i[a],c=l.length,d,u=0;u<c;++u)if(d=l[u]){for(var p=e.call(d,d.__data__,u,l),f,g=Dr(d,r),x=0,v=p.length;x<v;++x)(f=p[x])&&Sc(f,t,r,x,p,g);s.push(p),o.push(d)}return new hi(s,o,t,r)}var FL=aa.prototype.constructor;function PL(){return new FL(this._groups,this._parents)}function NL(e,t){var r,i,n;return function(){var s=bs(this,e),o=(this.style.removeProperty(e),bs(this,e));return s===o?null:s===r&&o===i?n:n=t(r=s,i=o)}}function oy(e){return function(){this.style.removeProperty(e)}}function zL(e,t,r){var i,n=r+"",s;return function(){var o=bs(this,e);return o===n?null:o===i?s:s=t(i=o,r)}}function HL(e,t,r){var i,n,s;return function(){var o=bs(this,e),a=r(this),l=a+"";return a==null&&(l=a=(this.style.removeProperty(e),bs(this,e))),o===l?null:o===i&&l===n?s:(n=l,s=t(i=o,a))}}function qL(e,t){var r,i,n,s="style."+t,o="end."+s,a;return function(){var l=Xr(this,e),c=l.on,d=l.value[s]==null?a||(a=oy(t)):void 0;(c!==r||n!==d)&&(i=(r=c).copy()).on(o,n=d),l.on=i}}function WL(e,t,r){var i=(e+="")=="transform"?GE:sy;return t==null?this.styleTween(e,NL(e,i)).on("end.style."+e,oy(e)):typeof t=="function"?this.styleTween(e,HL(e,i,vp(this,"style."+e,t))).each(qL(this._id,e)):this.styleTween(e,zL(e,i,t),r).on("end.style."+e,null)}function VL(e,t,r){return function(i){this.style.setProperty(e,t.call(this,i),r)}}function UL(e,t,r){var i,n;function s(){var o=t.apply(this,arguments);return o!==n&&(i=(n=o)&&VL(e,o,r)),i}return s._value=t,s}function GL(e,t,r){var i="style."+(e+="");if(arguments.length<2)return(i=this.tween(i))&&i._value;if(t==null)return this.tween(i,null);if(typeof t!="function")throw new Error;return this.tween(i,UL(e,t,r??""))}function YL(e){return function(){this.textContent=e}}function XL(e){return function(){var t=e(this);this.textContent=t??""}}function QL(e){return this.tween("text",typeof e=="function"?XL(vp(this,"text",e)):YL(e==null?"":e+""))}function ZL(e){return function(t){this.textContent=e.call(this,t)}}function JL(e){var t,r;function i(){var n=e.apply(this,arguments);return n!==r&&(t=(r=n)&&ZL(n)),t}return i._value=e,i}function KL(e){var t="text";if(arguments.length<1)return(t=this.tween(t))&&t._value;if(e==null)return this.tween(t,null);if(typeof e!="function")throw new Error;return this.tween(t,JL(e))}function tB(){for(var e=this._name,t=this._id,r=ay(),i=this._groups,n=i.length,s=0;s<n;++s)for(var o=i[s],a=o.length,l,c=0;c<a;++c)if(l=o[c]){var d=Dr(l,t);Sc(l,e,r,c,o,{time:d.time+d.delay+d.duration,delay:0,duration:d.duration,ease:d.ease})}return new hi(i,this._parents,e,r)}function eB(){var e,t,r=this,i=r._id,n=r.size();return new Promise(function(s,o){var a={value:o},l={value:function(){--n===0&&s()}};r.each(function(){var c=Xr(this,i),d=c.on;d!==e&&(t=(e=d).copy(),t._.cancel.push(a),t._.interrupt.push(a),t._.end.push(l)),c.on=t}),n===0&&s()})}var rB=0;function hi(e,t,r,i){this._groups=e,this._parents=t,this._name=r,this._id=i}function ay(){return++rB}var ri=aa.prototype;hi.prototype={constructor:hi,select:RL,selectAll:DL,selectChild:ri.selectChild,selectChildren:ri.selectChildren,filter:jL,merge:EL,selection:PL,transition:tB,call:ri.call,nodes:ri.nodes,node:ri.node,size:ri.size,empty:ri.empty,each:ri.each,on:ML,attr:pL,attrTween:bL,style:WL,styleTween:GL,text:QL,textTween:KL,remove:OL,tween:oL,delay:wL,duration:SL,ease:TL,easeVarying:AL,end:eB,[Symbol.iterator]:ri[Symbol.iterator]};function iB(e){return((e*=2)<=1?e*e*e:(e-=2)*e*e+2)/2}var nB={time:null,delay:0,duration:250,ease:iB};function sB(e,t){for(var r;!(r=e.__transition)||!(r=r[t]);)if(!(e=e.parentNode))throw new Error(`transition ${t} not found`);return r}function oB(e){var t,r;e instanceof hi?(t=e._id,e=e._name):(t=ay(),(r=nB).time=bp(),e=e==null?null:e+"");for(var i=this._groups,n=i.length,s=0;s<n;++s)for(var o=i[s],a=o.length,l,c=0;c<a;++c)(l=o[c])&&Sc(l,e,t,c,o,r||sB(l,t));return new hi(i,this._parents,e,t)}aa.prototype.interrupt=iL;aa.prototype.transition=oB;const Jd=Math.PI,Kd=2*Jd,Gi=1e-6,aB=Kd-Gi;function ly(e){this._+=e[0];for(let t=1,r=e.length;t<r;++t)this._+=arguments[t]+e[t]}function lB(e){let t=Math.floor(e);if(!(t>=0))throw new Error(`invalid digits: ${e}`);if(t>15)return ly;const r=10**t;return function(i){this._+=i[0];for(let n=1,s=i.length;n<s;++n)this._+=Math.round(arguments[n]*r)/r+i[n]}}class cB{constructor(t){this._x0=this._y0=this._x1=this._y1=null,this._="",this._append=t==null?ly:lB(t)}moveTo(t,r){this._append`M${this._x0=this._x1=+t},${this._y0=this._y1=+r}`}closePath(){this._x1!==null&&(this._x1=this._x0,this._y1=this._y0,this._append`Z`)}lineTo(t,r){this._append`L${this._x1=+t},${this._y1=+r}`}quadraticCurveTo(t,r,i,n){this._append`Q${+t},${+r},${this._x1=+i},${this._y1=+n}`}bezierCurveTo(t,r,i,n,s,o){this._append`C${+t},${+r},${+i},${+n},${this._x1=+s},${this._y1=+o}`}arcTo(t,r,i,n,s){if(t=+t,r=+r,i=+i,n=+n,s=+s,s<0)throw new Error(`negative radius: ${s}`);let o=this._x1,a=this._y1,l=i-t,c=n-r,d=o-t,u=a-r,p=d*d+u*u;if(this._x1===null)this._append`M${this._x1=t},${this._y1=r}`;else if(p>Gi)if(!(Math.abs(u*l-c*d)>Gi)||!s)this._append`L${this._x1=t},${this._y1=r}`;else{let f=i-o,g=n-a,x=l*l+c*c,v=f*f+g*g,y=Math.sqrt(x),b=Math.sqrt(p),w=s*Math.tan((Jd-Math.acos((x+p-v)/(2*y*b)))/2),S=w/b,_=w/y;Math.abs(S-1)>Gi&&this._append`L${t+S*d},${r+S*u}`,this._append`A${s},${s},0,0,${+(u*f>d*g)},${this._x1=t+_*l},${this._y1=r+_*c}`}}arc(t,r,i,n,s,o){if(t=+t,r=+r,i=+i,o=!!o,i<0)throw new Error(`negative radius: ${i}`);let a=i*Math.cos(n),l=i*Math.sin(n),c=t+a,d=r+l,u=1^o,p=o?n-s:s-n;this._x1===null?this._append`M${c},${d}`:(Math.abs(this._x1-c)>Gi||Math.abs(this._y1-d)>Gi)&&this._append`L${c},${d}`,i&&(p<0&&(p=p%Kd+Kd),p>aB?this._append`A${i},${i},0,1,${u},${t-a},${r-l}A${i},${i},0,1,${u},${this._x1=c},${this._y1=d}`:p>Gi&&this._append`A${i},${i},0,${+(p>=Jd)},${u},${this._x1=t+i*Math.cos(s)},${this._y1=r+i*Math.sin(s)}`)}rect(t,r,i,n){this._append`M${this._x0=this._x1=+t},${this._y0=this._y1=+r}h${i=+i}v${+n}h${-i}Z`}toString(){return this._}}function In(e){return function(){return e}}const w7=Math.abs,k7=Math.atan2,C7=Math.cos,S7=Math.max,_7=Math.min,T7=Math.sin,$7=Math.sqrt,lm=1e-12,wp=Math.PI,cm=wp/2,A7=2*wp;function j7(e){return e>1?0:e<-1?wp:Math.acos(e)}function E7(e){return e>=1?cm:e<=-1?-cm:Math.asin(e)}function hB(e){let t=3;return e.digits=function(r){if(!arguments.length)return t;if(r==null)t=null;else{const i=Math.floor(r);if(!(i>=0))throw new RangeError(`invalid digits: ${r}`);t=i}return e},()=>new cB(t)}function dB(e){return typeof e=="object"&&"length"in e?e:Array.from(e)}function cy(e){this._context=e}cy.prototype={areaStart:function(){this._line=0},areaEnd:function(){this._line=NaN},lineStart:function(){this._point=0},lineEnd:function(){(this._line||this._line!==0&&this._point===1)&&this._context.closePath(),this._line=1-this._line},point:function(e,t){switch(e=+e,t=+t,this._point){case 0:this._point=1,this._line?this._context.lineTo(e,t):this._context.moveTo(e,t);break;case 1:this._point=2;default:this._context.lineTo(e,t);break}}};function Il(e){return new cy(e)}function uB(e){return e[0]}function pB(e){return e[1]}function fB(e,t){var r=In(!0),i=null,n=Il,s=null,o=hB(a);e=typeof e=="function"?e:e===void 0?uB:In(e),t=typeof t=="function"?t:t===void 0?pB:In(t);function a(l){var c,d=(l=dB(l)).length,u,p=!1,f;for(i==null&&(s=n(f=o())),c=0;c<=d;++c)!(c<d&&r(u=l[c],c,l))===p&&((p=!p)?s.lineStart():s.lineEnd()),p&&s.point(+e(u,c,l),+t(u,c,l));if(f)return s=null,f+""||null}return a.x=function(l){return arguments.length?(e=typeof l=="function"?l:In(+l),a):e},a.y=function(l){return arguments.length?(t=typeof l=="function"?l:In(+l),a):t},a.defined=function(l){return arguments.length?(r=typeof l=="function"?l:In(!!l),a):r},a.curve=function(l){return arguments.length?(n=l,i!=null&&(s=n(i)),a):n},a.context=function(l){return arguments.length?(l==null?i=s=null:s=n(i=l),a):i},a}class hy{constructor(t,r){this._context=t,this._x=r}areaStart(){this._line=0}areaEnd(){this._line=NaN}lineStart(){this._point=0}lineEnd(){(this._line||this._line!==0&&this._point===1)&&this._context.closePath(),this._line=1-this._line}point(t,r){switch(t=+t,r=+r,this._point){case 0:{this._point=1,this._line?this._context.lineTo(t,r):this._context.moveTo(t,r);break}case 1:this._point=2;default:{this._x?this._context.bezierCurveTo(this._x0=(this._x0+t)/2,this._y0,this._x0,r,t,r):this._context.bezierCurveTo(this._x0,this._y0=(this._y0+r)/2,t,this._y0,t,r);break}}this._x0=t,this._y0=r}}function dy(e){return new hy(e,!0)}function uy(e){return new hy(e,!1)}function ji(){}function Ol(e,t,r){e._context.bezierCurveTo((2*e._x0+e._x1)/3,(2*e._y0+e._y1)/3,(e._x0+2*e._x1)/3,(e._y0+2*e._y1)/3,(e._x0+4*e._x1+t)/6,(e._y0+4*e._y1+r)/6)}function _c(e){this._context=e}_c.prototype={areaStart:function(){this._line=0},areaEnd:function(){this._line=NaN},lineStart:function(){this._x0=this._x1=this._y0=this._y1=NaN,this._point=0},lineEnd:function(){switch(this._point){case 3:Ol(this,this._x1,this._y1);case 2:this._context.lineTo(this._x1,this._y1);break}(this._line||this._line!==0&&this._point===1)&&this._context.closePath(),this._line=1-this._line},point:function(e,t){switch(e=+e,t=+t,this._point){case 0:this._point=1,this._line?this._context.lineTo(e,t):this._context.moveTo(e,t);break;case 1:this._point=2;break;case 2:this._point=3,this._context.lineTo((5*this._x0+this._x1)/6,(5*this._y0+this._y1)/6);default:Ol(this,e,t);break}this._x0=this._x1,this._x1=e,this._y0=this._y1,this._y1=t}};function ll(e){return new _c(e)}function py(e){this._context=e}py.prototype={areaStart:ji,areaEnd:ji,lineStart:function(){this._x0=this._x1=this._x2=this._x3=this._x4=this._y0=this._y1=this._y2=this._y3=this._y4=NaN,this._point=0},lineEnd:function(){switch(this._point){case 1:{this._context.moveTo(this._x2,this._y2),this._context.closePath();break}case 2:{this._context.moveTo((this._x2+2*this._x3)/3,(this._y2+2*this._y3)/3),this._context.lineTo((this._x3+2*this._x2)/3,(this._y3+2*this._y2)/3),this._context.closePath();break}case 3:{this.point(this._x2,this._y2),this.point(this._x3,this._y3),this.point(this._x4,this._y4);break}}},point:function(e,t){switch(e=+e,t=+t,this._point){case 0:this._point=1,this._x2=e,this._y2=t;break;case 1:this._point=2,this._x3=e,this._y3=t;break;case 2:this._point=3,this._x4=e,this._y4=t,this._context.moveTo((this._x0+4*this._x1+e)/6,(this._y0+4*this._y1+t)/6);break;default:Ol(this,e,t);break}this._x0=this._x1,this._x1=e,this._y0=this._y1,this._y1=t}};function gB(e){return new py(e)}function fy(e){this._context=e}fy.prototype={areaStart:function(){this._line=0},areaEnd:function(){this._line=NaN},lineStart:function(){this._x0=this._x1=this._y0=this._y1=NaN,this._point=0},lineEnd:function(){(this._line||this._line!==0&&this._point===3)&&this._context.closePath(),this._line=1-this._line},point:function(e,t){switch(e=+e,t=+t,this._point){case 0:this._point=1;break;case 1:this._point=2;break;case 2:this._point=3;var r=(this._x0+4*this._x1+e)/6,i=(this._y0+4*this._y1+t)/6;this._line?this._context.lineTo(r,i):this._context.moveTo(r,i);break;case 3:this._point=4;default:Ol(this,e,t);break}this._x0=this._x1,this._x1=e,this._y0=this._y1,this._y1=t}};function mB(e){return new fy(e)}function gy(e,t){this._basis=new _c(e),this._beta=t}gy.prototype={lineStart:function(){this._x=[],this._y=[],this._basis.lineStart()},lineEnd:function(){var e=this._x,t=this._y,r=e.length-1;if(r>0)for(var i=e[0],n=t[0],s=e[r]-i,o=t[r]-n,a=-1,l;++a<=r;)l=a/r,this._basis.point(this._beta*e[a]+(1-this._beta)*(i+l*s),this._beta*t[a]+(1-this._beta)*(n+l*o));this._x=this._y=null,this._basis.lineEnd()},point:function(e,t){this._x.push(+e),this._y.push(+t)}};const xB=function e(t){function r(i){return t===1?new _c(i):new gy(i,t)}return r.beta=function(i){return e(+i)},r}(.85);function Rl(e,t,r){e._context.bezierCurveTo(e._x1+e._k*(e._x2-e._x0),e._y1+e._k*(e._y2-e._y0),e._x2+e._k*(e._x1-t),e._y2+e._k*(e._y1-r),e._x2,e._y2)}function kp(e,t){this._context=e,this._k=(1-t)/6}kp.prototype={areaStart:function(){this._line=0},areaEnd:function(){this._line=NaN},lineStart:function(){this._x0=this._x1=this._x2=this._y0=this._y1=this._y2=NaN,this._point=0},lineEnd:function(){switch(this._point){case 2:this._context.lineTo(this._x2,this._y2);break;case 3:Rl(this,this._x1,this._y1);break}(this._line||this._line!==0&&this._point===1)&&this._context.closePath(),this._line=1-this._line},point:function(e,t){switch(e=+e,t=+t,this._point){case 0:this._point=1,this._line?this._context.lineTo(e,t):this._context.moveTo(e,t);break;case 1:this._point=2,this._x1=e,this._y1=t;break;case 2:this._point=3;default:Rl(this,e,t);break}this._x0=this._x1,this._x1=this._x2,this._x2=e,this._y0=this._y1,this._y1=this._y2,this._y2=t}};const my=function e(t){function r(i){return new kp(i,t)}return r.tension=function(i){return e(+i)},r}(0);function Cp(e,t){this._context=e,this._k=(1-t)/6}Cp.prototype={areaStart:ji,areaEnd:ji,lineStart:function(){this._x0=this._x1=this._x2=this._x3=this._x4=this._x5=this._y0=this._y1=this._y2=this._y3=this._y4=this._y5=NaN,this._point=0},lineEnd:function(){switch(this._point){case 1:{this._context.moveTo(this._x3,this._y3),this._context.closePath();break}case 2:{this._context.lineTo(this._x3,this._y3),this._context.closePath();break}case 3:{this.point(this._x3,this._y3),this.point(this._x4,this._y4),this.point(this._x5,this._y5);break}}},point:function(e,t){switch(e=+e,t=+t,this._point){case 0:this._point=1,this._x3=e,this._y3=t;break;case 1:this._point=2,this._context.moveTo(this._x4=e,this._y4=t);break;case 2:this._point=3,this._x5=e,this._y5=t;break;default:Rl(this,e,t);break}this._x0=this._x1,this._x1=this._x2,this._x2=e,this._y0=this._y1,this._y1=this._y2,this._y2=t}};const bB=function e(t){function r(i){return new Cp(i,t)}return r.tension=function(i){return e(+i)},r}(0);function Sp(e,t){this._context=e,this._k=(1-t)/6}Sp.prototype={areaStart:function(){this._line=0},areaEnd:function(){this._line=NaN},lineStart:function(){this._x0=this._x1=this._x2=this._y0=this._y1=this._y2=NaN,this._point=0},lineEnd:function(){(this._line||this._line!==0&&this._point===3)&&this._context.closePath(),this._line=1-this._line},point:function(e,t){switch(e=+e,t=+t,this._point){case 0:this._point=1;break;case 1:this._point=2;break;case 2:this._point=3,this._line?this._context.lineTo(this._x2,this._y2):this._context.moveTo(this._x2,this._y2);break;case 3:this._point=4;default:Rl(this,e,t);break}this._x0=this._x1,this._x1=this._x2,this._x2=e,this._y0=this._y1,this._y1=this._y2,this._y2=t}};const yB=function e(t){function r(i){return new Sp(i,t)}return r.tension=function(i){return e(+i)},r}(0);function _p(e,t,r){var i=e._x1,n=e._y1,s=e._x2,o=e._y2;if(e._l01_a>lm){var a=2*e._l01_2a+3*e._l01_a*e._l12_a+e._l12_2a,l=3*e._l01_a*(e._l01_a+e._l12_a);i=(i*a-e._x0*e._l12_2a+e._x2*e._l01_2a)/l,n=(n*a-e._y0*e._l12_2a+e._y2*e._l01_2a)/l}if(e._l23_a>lm){var c=2*e._l23_2a+3*e._l23_a*e._l12_a+e._l12_2a,d=3*e._l23_a*(e._l23_a+e._l12_a);s=(s*c+e._x1*e._l23_2a-t*e._l12_2a)/d,o=(o*c+e._y1*e._l23_2a-r*e._l12_2a)/d}e._context.bezierCurveTo(i,n,s,o,e._x2,e._y2)}function xy(e,t){this._context=e,this._alpha=t}xy.prototype={areaStart:function(){this._line=0},areaEnd:function(){this._line=NaN},lineStart:function(){this._x0=this._x1=this._x2=this._y0=this._y1=this._y2=NaN,this._l01_a=this._l12_a=this._l23_a=this._l01_2a=this._l12_2a=this._l23_2a=this._point=0},lineEnd:function(){switch(this._point){case 2:this._context.lineTo(this._x2,this._y2);break;case 3:this.point(this._x2,this._y2);break}(this._line||this._line!==0&&this._point===1)&&this._context.closePath(),this._line=1-this._line},point:function(e,t){if(e=+e,t=+t,this._point){var r=this._x2-e,i=this._y2-t;this._l23_a=Math.sqrt(this._l23_2a=Math.pow(r*r+i*i,this._alpha))}switch(this._point){case 0:this._point=1,this._line?this._context.lineTo(e,t):this._context.moveTo(e,t);break;case 1:this._point=2;break;case 2:this._point=3;default:_p(this,e,t);break}this._l01_a=this._l12_a,this._l12_a=this._l23_a,this._l01_2a=this._l12_2a,this._l12_2a=this._l23_2a,this._x0=this._x1,this._x1=this._x2,this._x2=e,this._y0=this._y1,this._y1=this._y2,this._y2=t}};const by=function e(t){function r(i){return t?new xy(i,t):new kp(i,0)}return r.alpha=function(i){return e(+i)},r}(.5);function yy(e,t){this._context=e,this._alpha=t}yy.prototype={areaStart:ji,areaEnd:ji,lineStart:function(){this._x0=this._x1=this._x2=this._x3=this._x4=this._x5=this._y0=this._y1=this._y2=this._y3=this._y4=this._y5=NaN,this._l01_a=this._l12_a=this._l23_a=this._l01_2a=this._l12_2a=this._l23_2a=this._point=0},lineEnd:function(){switch(this._point){case 1:{this._context.moveTo(this._x3,this._y3),this._context.closePath();break}case 2:{this._context.lineTo(this._x3,this._y3),this._context.closePath();break}case 3:{this.point(this._x3,this._y3),this.point(this._x4,this._y4),this.point(this._x5,this._y5);break}}},point:function(e,t){if(e=+e,t=+t,this._point){var r=this._x2-e,i=this._y2-t;this._l23_a=Math.sqrt(this._l23_2a=Math.pow(r*r+i*i,this._alpha))}switch(this._point){case 0:this._point=1,this._x3=e,this._y3=t;break;case 1:this._point=2,this._context.moveTo(this._x4=e,this._y4=t);break;case 2:this._point=3,this._x5=e,this._y5=t;break;default:_p(this,e,t);break}this._l01_a=this._l12_a,this._l12_a=this._l23_a,this._l01_2a=this._l12_2a,this._l12_2a=this._l23_2a,this._x0=this._x1,this._x1=this._x2,this._x2=e,this._y0=this._y1,this._y1=this._y2,this._y2=t}};const vB=function e(t){function r(i){return t?new yy(i,t):new Cp(i,0)}return r.alpha=function(i){return e(+i)},r}(.5);function vy(e,t){this._context=e,this._alpha=t}vy.prototype={areaStart:function(){this._line=0},areaEnd:function(){this._line=NaN},lineStart:function(){this._x0=this._x1=this._x2=this._y0=this._y1=this._y2=NaN,this._l01_a=this._l12_a=this._l23_a=this._l01_2a=this._l12_2a=this._l23_2a=this._point=0},lineEnd:function(){(this._line||this._line!==0&&this._point===3)&&this._context.closePath(),this._line=1-this._line},point:function(e,t){if(e=+e,t=+t,this._point){var r=this._x2-e,i=this._y2-t;this._l23_a=Math.sqrt(this._l23_2a=Math.pow(r*r+i*i,this._alpha))}switch(this._point){case 0:this._point=1;break;case 1:this._point=2;break;case 2:this._point=3,this._line?this._context.lineTo(this._x2,this._y2):this._context.moveTo(this._x2,this._y2);break;case 3:this._point=4;default:_p(this,e,t);break}this._l01_a=this._l12_a,this._l12_a=this._l23_a,this._l01_2a=this._l12_2a,this._l12_2a=this._l23_2a,this._x0=this._x1,this._x1=this._x2,this._x2=e,this._y0=this._y1,this._y1=this._y2,this._y2=t}};const wB=function e(t){function r(i){return t?new vy(i,t):new Sp(i,0)}return r.alpha=function(i){return e(+i)},r}(.5);function wy(e){this._context=e}wy.prototype={areaStart:ji,areaEnd:ji,lineStart:function(){this._point=0},lineEnd:function(){this._point&&this._context.closePath()},point:function(e,t){e=+e,t=+t,this._point?this._context.lineTo(e,t):(this._point=1,this._context.moveTo(e,t))}};function kB(e){return new wy(e)}function hm(e){return e<0?-1:1}function dm(e,t,r){var i=e._x1-e._x0,n=t-e._x1,s=(e._y1-e._y0)/(i||n<0&&-0),o=(r-e._y1)/(n||i<0&&-0),a=(s*n+o*i)/(i+n);return(hm(s)+hm(o))*Math.min(Math.abs(s),Math.abs(o),.5*Math.abs(a))||0}function um(e,t){var r=e._x1-e._x0;return r?(3*(e._y1-e._y0)/r-t)/2:t}function jh(e,t,r){var i=e._x0,n=e._y0,s=e._x1,o=e._y1,a=(s-i)/3;e._context.bezierCurveTo(i+a,n+a*t,s-a,o-a*r,s,o)}function Dl(e){this._context=e}Dl.prototype={areaStart:function(){this._line=0},areaEnd:function(){this._line=NaN},lineStart:function(){this._x0=this._x1=this._y0=this._y1=this._t0=NaN,this._point=0},lineEnd:function(){switch(this._point){case 2:this._context.lineTo(this._x1,this._y1);break;case 3:jh(this,this._t0,um(this,this._t0));break}(this._line||this._line!==0&&this._point===1)&&this._context.closePath(),this._line=1-this._line},point:function(e,t){var r=NaN;if(e=+e,t=+t,!(e===this._x1&&t===this._y1)){switch(this._point){case 0:this._point=1,this._line?this._context.lineTo(e,t):this._context.moveTo(e,t);break;case 1:this._point=2;break;case 2:this._point=3,jh(this,um(this,r=dm(this,e,t)),r);break;default:jh(this,this._t0,r=dm(this,e,t));break}this._x0=this._x1,this._x1=e,this._y0=this._y1,this._y1=t,this._t0=r}}};function ky(e){this._context=new Cy(e)}(ky.prototype=Object.create(Dl.prototype)).point=function(e,t){Dl.prototype.point.call(this,t,e)};function Cy(e){this._context=e}Cy.prototype={moveTo:function(e,t){this._context.moveTo(t,e)},closePath:function(){this._context.closePath()},lineTo:function(e,t){this._context.lineTo(t,e)},bezierCurveTo:function(e,t,r,i,n,s){this._context.bezierCurveTo(t,e,i,r,s,n)}};function Sy(e){return new Dl(e)}function _y(e){return new ky(e)}function Ty(e){this._context=e}Ty.prototype={areaStart:function(){this._line=0},areaEnd:function(){this._line=NaN},lineStart:function(){this._x=[],this._y=[]},lineEnd:function(){var e=this._x,t=this._y,r=e.length;if(r)if(this._line?this._context.lineTo(e[0],t[0]):this._context.moveTo(e[0],t[0]),r===2)this._context.lineTo(e[1],t[1]);else for(var i=pm(e),n=pm(t),s=0,o=1;o<r;++s,++o)this._context.bezierCurveTo(i[0][s],n[0][s],i[1][s],n[1][s],e[o],t[o]);(this._line||this._line!==0&&r===1)&&this._context.closePath(),this._line=1-this._line,this._x=this._y=null},point:function(e,t){this._x.push(+e),this._y.push(+t)}};function pm(e){var t,r=e.length-1,i,n=new Array(r),s=new Array(r),o=new Array(r);for(n[0]=0,s[0]=2,o[0]=e[0]+2*e[1],t=1;t<r-1;++t)n[t]=1,s[t]=4,o[t]=4*e[t]+2*e[t+1];for(n[r-1]=2,s[r-1]=7,o[r-1]=8*e[r-1]+e[r],t=1;t<r;++t)i=n[t]/s[t-1],s[t]-=i,o[t]-=i*o[t-1];for(n[r-1]=o[r-1]/s[r-1],t=r-2;t>=0;--t)n[t]=(o[t]-n[t+1])/s[t];for(s[r-1]=(e[r]+n[r-1])/2,t=0;t<r-1;++t)s[t]=2*e[t+1]-n[t+1];return[n,s]}function $y(e){return new Ty(e)}function Tc(e,t){this._context=e,this._t=t}Tc.prototype={areaStart:function(){this._line=0},areaEnd:function(){this._line=NaN},lineStart:function(){this._x=this._y=NaN,this._point=0},lineEnd:function(){0<this._t&&this._t<1&&this._point===2&&this._context.lineTo(this._x,this._y),(this._line||this._line!==0&&this._point===1)&&this._context.closePath(),this._line>=0&&(this._t=1-this._t,this._line=1-this._line)},point:function(e,t){switch(e=+e,t=+t,this._point){case 0:this._point=1,this._line?this._context.lineTo(e,t):this._context.moveTo(e,t);break;case 1:this._point=2;default:{if(this._t<=0)this._context.lineTo(this._x,t),this._context.lineTo(e,t);else{var r=this._x*(1-this._t)+e*this._t;this._context.lineTo(r,this._y),this._context.lineTo(r,t)}break}}this._x=e,this._y=t}};function Ay(e){return new Tc(e,.5)}function jy(e){return new Tc(e,0)}function Ey(e){return new Tc(e,1)}function uo(e,t,r){this.k=e,this.x=t,this.y=r}uo.prototype={constructor:uo,scale:function(e){return e===1?this:new uo(this.k*e,this.x,this.y)},translate:function(e,t){return e===0&t===0?this:new uo(this.k,this.x+this.k*e,this.y+this.k*t)},apply:function(e){return[e[0]*this.k+this.x,e[1]*this.k+this.y]},applyX:function(e){return e*this.k+this.x},applyY:function(e){return e*this.k+this.y},invert:function(e){return[(e[0]-this.x)/this.k,(e[1]-this.y)/this.k]},invertX:function(e){return(e-this.x)/this.k},invertY:function(e){return(e-this.y)/this.k},rescaleX:function(e){return e.copy().domain(e.range().map(this.invertX,this).map(e.invert,e))},rescaleY:function(e){return e.copy().domain(e.range().map(this.invertY,this).map(e.invert,e))},toString:function(){return"translate("+this.x+","+this.y+") scale("+this.k+")"}};uo.prototype;var CB=m(e=>{const{securityLevel:t}=Nt();let r=Lt("body");if(t==="sandbox"){const s=Lt(`#i${e}`).node()?.contentDocument??document;r=Lt(s.body)}return r.select(`#${e}`)},"selectSvgElement");function Tp(e){return typeof e>"u"||e===null}m(Tp,"isNothing");function Ly(e){return typeof e=="object"&&e!==null}m(Ly,"isObject");function By(e){return Array.isArray(e)?e:Tp(e)?[]:[e]}m(By,"toArray");function My(e,t){var r,i,n,s;if(t)for(s=Object.keys(t),r=0,i=s.length;r<i;r+=1)n=s[r],e[n]=t[n];return e}m(My,"extend");function Iy(e,t){var r="",i;for(i=0;i<t;i+=1)r+=e;return r}m(Iy,"repeat");function Oy(e){return e===0&&Number.NEGATIVE_INFINITY===1/e}m(Oy,"isNegativeZero");var SB=Tp,_B=Ly,TB=By,$B=Iy,AB=Oy,jB=My,ue={isNothing:SB,isObject:_B,toArray:TB,repeat:$B,isNegativeZero:AB,extend:jB};function $p(e,t){var r="",i=e.reason||"(unknown reason)";return e.mark?(e.mark.name&&(r+='in "'+e.mark.name+'" '),r+="("+(e.mark.line+1)+":"+(e.mark.column+1)+")",!t&&e.mark.snippet&&(r+=`

`+e.mark.snippet),i+" "+r):i}m($p,"formatError");function vs(e,t){Error.call(this),this.name="YAMLException",this.reason=e,this.mark=t,this.message=$p(this,!1),Error.captureStackTrace?Error.captureStackTrace(this,this.constructor):this.stack=new Error().stack||""}m(vs,"YAMLException$1");vs.prototype=Object.create(Error.prototype);vs.prototype.constructor=vs;vs.prototype.toString=m(function(t){return this.name+": "+$p(this,t)},"toString");var Qe=vs;function cl(e,t,r,i,n){var s="",o="",a=Math.floor(n/2)-1;return i-t>a&&(s=" ... ",t=i-a+s.length),r-i>a&&(o=" ...",r=i+a-o.length),{str:s+e.slice(t,r).replace(/\t/g,"→")+o,pos:i-t+s.length}}m(cl,"getLine");function hl(e,t){return ue.repeat(" ",t-e.length)+e}m(hl,"padStart");function Ry(e,t){if(t=Object.create(t||null),!e.buffer)return null;t.maxLength||(t.maxLength=79),typeof t.indent!="number"&&(t.indent=1),typeof t.linesBefore!="number"&&(t.linesBefore=3),typeof t.linesAfter!="number"&&(t.linesAfter=2);for(var r=/\r?\n|\r|\0/g,i=[0],n=[],s,o=-1;s=r.exec(e.buffer);)n.push(s.index),i.push(s.index+s[0].length),e.position<=s.index&&o<0&&(o=i.length-2);o<0&&(o=i.length-1);var a="",l,c,d=Math.min(e.line+t.linesAfter,n.length).toString().length,u=t.maxLength-(t.indent+d+3);for(l=1;l<=t.linesBefore&&!(o-l<0);l++)c=cl(e.buffer,i[o-l],n[o-l],e.position-(i[o]-i[o-l]),u),a=ue.repeat(" ",t.indent)+hl((e.line-l+1).toString(),d)+" | "+c.str+`
`+a;for(c=cl(e.buffer,i[o],n[o],e.position,u),a+=ue.repeat(" ",t.indent)+hl((e.line+1).toString(),d)+" | "+c.str+`
`,a+=ue.repeat("-",t.indent+d+3+c.pos)+`^
`,l=1;l<=t.linesAfter&&!(o+l>=n.length);l++)c=cl(e.buffer,i[o+l],n[o+l],e.position-(i[o]-i[o+l]),u),a+=ue.repeat(" ",t.indent)+hl((e.line+l+1).toString(),d)+" | "+c.str+`
`;return a.replace(/\n$/,"")}m(Ry,"makeSnippet");var EB=Ry,LB=["kind","multi","resolve","construct","instanceOf","predicate","represent","representName","defaultStyle","styleAliases"],BB=["scalar","sequence","mapping"];function Dy(e){var t={};return e!==null&&Object.keys(e).forEach(function(r){e[r].forEach(function(i){t[String(i)]=r})}),t}m(Dy,"compileStyleAliases");function Fy(e,t){if(t=t||{},Object.keys(t).forEach(function(r){if(LB.indexOf(r)===-1)throw new Qe('Unknown option "'+r+'" is met in definition of "'+e+'" YAML type.')}),this.options=t,this.tag=e,this.kind=t.kind||null,this.resolve=t.resolve||function(){return!0},this.construct=t.construct||function(r){return r},this.instanceOf=t.instanceOf||null,this.predicate=t.predicate||null,this.represent=t.represent||null,this.representName=t.representName||null,this.defaultStyle=t.defaultStyle||null,this.multi=t.multi||!1,this.styleAliases=Dy(t.styleAliases||null),BB.indexOf(this.kind)===-1)throw new Qe('Unknown kind "'+this.kind+'" is specified for "'+e+'" YAML type.')}m(Fy,"Type$1");var $e=Fy;function tu(e,t){var r=[];return e[t].forEach(function(i){var n=r.length;r.forEach(function(s,o){s.tag===i.tag&&s.kind===i.kind&&s.multi===i.multi&&(n=o)}),r[n]=i}),r}m(tu,"compileList");function Py(){var e={scalar:{},sequence:{},mapping:{},fallback:{},multi:{scalar:[],sequence:[],mapping:[],fallback:[]}},t,r;function i(n){n.multi?(e.multi[n.kind].push(n),e.multi.fallback.push(n)):e[n.kind][n.tag]=e.fallback[n.tag]=n}for(m(i,"collectType"),t=0,r=arguments.length;t<r;t+=1)arguments[t].forEach(i);return e}m(Py,"compileMap");function Fl(e){return this.extend(e)}m(Fl,"Schema$1");Fl.prototype.extend=m(function(t){var r=[],i=[];if(t instanceof $e)i.push(t);else if(Array.isArray(t))i=i.concat(t);else if(t&&(Array.isArray(t.implicit)||Array.isArray(t.explicit)))t.implicit&&(r=r.concat(t.implicit)),t.explicit&&(i=i.concat(t.explicit));else throw new Qe("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");r.forEach(function(s){if(!(s instanceof $e))throw new Qe("Specified list of YAML types (or a single Type object) contains a non-Type object.");if(s.loadKind&&s.loadKind!=="scalar")throw new Qe("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");if(s.multi)throw new Qe("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.")}),i.forEach(function(s){if(!(s instanceof $e))throw new Qe("Specified list of YAML types (or a single Type object) contains a non-Type object.")});var n=Object.create(Fl.prototype);return n.implicit=(this.implicit||[]).concat(r),n.explicit=(this.explicit||[]).concat(i),n.compiledImplicit=tu(n,"implicit"),n.compiledExplicit=tu(n,"explicit"),n.compiledTypeMap=Py(n.compiledImplicit,n.compiledExplicit),n},"extend");var MB=Fl,IB=new $e("tag:yaml.org,2002:str",{kind:"scalar",construct:m(function(e){return e!==null?e:""},"construct")}),OB=new $e("tag:yaml.org,2002:seq",{kind:"sequence",construct:m(function(e){return e!==null?e:[]},"construct")}),RB=new $e("tag:yaml.org,2002:map",{kind:"mapping",construct:m(function(e){return e!==null?e:{}},"construct")}),DB=new MB({explicit:[IB,OB,RB]});function Ny(e){if(e===null)return!0;var t=e.length;return t===1&&e==="~"||t===4&&(e==="null"||e==="Null"||e==="NULL")}m(Ny,"resolveYamlNull");function zy(){return null}m(zy,"constructYamlNull");function Hy(e){return e===null}m(Hy,"isNull");var FB=new $e("tag:yaml.org,2002:null",{kind:"scalar",resolve:Ny,construct:zy,predicate:Hy,represent:{canonical:m(function(){return"~"},"canonical"),lowercase:m(function(){return"null"},"lowercase"),uppercase:m(function(){return"NULL"},"uppercase"),camelcase:m(function(){return"Null"},"camelcase"),empty:m(function(){return""},"empty")},defaultStyle:"lowercase"});function qy(e){if(e===null)return!1;var t=e.length;return t===4&&(e==="true"||e==="True"||e==="TRUE")||t===5&&(e==="false"||e==="False"||e==="FALSE")}m(qy,"resolveYamlBoolean");function Wy(e){return e==="true"||e==="True"||e==="TRUE"}m(Wy,"constructYamlBoolean");function Vy(e){return Object.prototype.toString.call(e)==="[object Boolean]"}m(Vy,"isBoolean");var PB=new $e("tag:yaml.org,2002:bool",{kind:"scalar",resolve:qy,construct:Wy,predicate:Vy,represent:{lowercase:m(function(e){return e?"true":"false"},"lowercase"),uppercase:m(function(e){return e?"TRUE":"FALSE"},"uppercase"),camelcase:m(function(e){return e?"True":"False"},"camelcase")},defaultStyle:"lowercase"});function Uy(e){return 48<=e&&e<=57||65<=e&&e<=70||97<=e&&e<=102}m(Uy,"isHexCode");function Gy(e){return 48<=e&&e<=55}m(Gy,"isOctCode");function Yy(e){return 48<=e&&e<=57}m(Yy,"isDecCode");function Xy(e){if(e===null)return!1;var t=e.length,r=0,i=!1,n;if(!t)return!1;if(n=e[r],(n==="-"||n==="+")&&(n=e[++r]),n==="0"){if(r+1===t)return!0;if(n=e[++r],n==="b"){for(r++;r<t;r++)if(n=e[r],n!=="_"){if(n!=="0"&&n!=="1")return!1;i=!0}return i&&n!=="_"}if(n==="x"){for(r++;r<t;r++)if(n=e[r],n!=="_"){if(!Uy(e.charCodeAt(r)))return!1;i=!0}return i&&n!=="_"}if(n==="o"){for(r++;r<t;r++)if(n=e[r],n!=="_"){if(!Gy(e.charCodeAt(r)))return!1;i=!0}return i&&n!=="_"}}if(n==="_")return!1;for(;r<t;r++)if(n=e[r],n!=="_"){if(!Yy(e.charCodeAt(r)))return!1;i=!0}return!(!i||n==="_")}m(Xy,"resolveYamlInteger");function Qy(e){var t=e,r=1,i;if(t.indexOf("_")!==-1&&(t=t.replace(/_/g,"")),i=t[0],(i==="-"||i==="+")&&(i==="-"&&(r=-1),t=t.slice(1),i=t[0]),t==="0")return 0;if(i==="0"){if(t[1]==="b")return r*parseInt(t.slice(2),2);if(t[1]==="x")return r*parseInt(t.slice(2),16);if(t[1]==="o")return r*parseInt(t.slice(2),8)}return r*parseInt(t,10)}m(Qy,"constructYamlInteger");function Zy(e){return Object.prototype.toString.call(e)==="[object Number]"&&e%1===0&&!ue.isNegativeZero(e)}m(Zy,"isInteger");var NB=new $e("tag:yaml.org,2002:int",{kind:"scalar",resolve:Xy,construct:Qy,predicate:Zy,represent:{binary:m(function(e){return e>=0?"0b"+e.toString(2):"-0b"+e.toString(2).slice(1)},"binary"),octal:m(function(e){return e>=0?"0o"+e.toString(8):"-0o"+e.toString(8).slice(1)},"octal"),decimal:m(function(e){return e.toString(10)},"decimal"),hexadecimal:m(function(e){return e>=0?"0x"+e.toString(16).toUpperCase():"-0x"+e.toString(16).toUpperCase().slice(1)},"hexadecimal")},defaultStyle:"decimal",styleAliases:{binary:[2,"bin"],octal:[8,"oct"],decimal:[10,"dec"],hexadecimal:[16,"hex"]}}),zB=new RegExp("^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");function Jy(e){return!(e===null||!zB.test(e)||e[e.length-1]==="_")}m(Jy,"resolveYamlFloat");function Ky(e){var t,r;return t=e.replace(/_/g,"").toLowerCase(),r=t[0]==="-"?-1:1,"+-".indexOf(t[0])>=0&&(t=t.slice(1)),t===".inf"?r===1?Number.POSITIVE_INFINITY:Number.NEGATIVE_INFINITY:t===".nan"?NaN:r*parseFloat(t,10)}m(Ky,"constructYamlFloat");var HB=/^[-+]?[0-9]+e/;function t1(e,t){var r;if(isNaN(e))switch(t){case"lowercase":return".nan";case"uppercase":return".NAN";case"camelcase":return".NaN"}else if(Number.POSITIVE_INFINITY===e)switch(t){case"lowercase":return".inf";case"uppercase":return".INF";case"camelcase":return".Inf"}else if(Number.NEGATIVE_INFINITY===e)switch(t){case"lowercase":return"-.inf";case"uppercase":return"-.INF";case"camelcase":return"-.Inf"}else if(ue.isNegativeZero(e))return"-0.0";return r=e.toString(10),HB.test(r)?r.replace("e",".e"):r}m(t1,"representYamlFloat");function e1(e){return Object.prototype.toString.call(e)==="[object Number]"&&(e%1!==0||ue.isNegativeZero(e))}m(e1,"isFloat");var qB=new $e("tag:yaml.org,2002:float",{kind:"scalar",resolve:Jy,construct:Ky,predicate:e1,represent:t1,defaultStyle:"lowercase"}),r1=DB.extend({implicit:[FB,PB,NB,qB]}),WB=r1,i1=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"),n1=new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");function s1(e){return e===null?!1:i1.exec(e)!==null||n1.exec(e)!==null}m(s1,"resolveYamlTimestamp");function o1(e){var t,r,i,n,s,o,a,l=0,c=null,d,u,p;if(t=i1.exec(e),t===null&&(t=n1.exec(e)),t===null)throw new Error("Date resolve error");if(r=+t[1],i=+t[2]-1,n=+t[3],!t[4])return new Date(Date.UTC(r,i,n));if(s=+t[4],o=+t[5],a=+t[6],t[7]){for(l=t[7].slice(0,3);l.length<3;)l+="0";l=+l}return t[9]&&(d=+t[10],u=+(t[11]||0),c=(d*60+u)*6e4,t[9]==="-"&&(c=-c)),p=new Date(Date.UTC(r,i,n,s,o,a,l)),c&&p.setTime(p.getTime()-c),p}m(o1,"constructYamlTimestamp");function a1(e){return e.toISOString()}m(a1,"representYamlTimestamp");var VB=new $e("tag:yaml.org,2002:timestamp",{kind:"scalar",resolve:s1,construct:o1,instanceOf:Date,represent:a1});function l1(e){return e==="<<"||e===null}m(l1,"resolveYamlMerge");var UB=new $e("tag:yaml.org,2002:merge",{kind:"scalar",resolve:l1}),Ap=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;function c1(e){if(e===null)return!1;var t,r,i=0,n=e.length,s=Ap;for(r=0;r<n;r++)if(t=s.indexOf(e.charAt(r)),!(t>64)){if(t<0)return!1;i+=6}return i%8===0}m(c1,"resolveYamlBinary");function h1(e){var t,r,i=e.replace(/[\r\n=]/g,""),n=i.length,s=Ap,o=0,a=[];for(t=0;t<n;t++)t%4===0&&t&&(a.push(o>>16&255),a.push(o>>8&255),a.push(o&255)),o=o<<6|s.indexOf(i.charAt(t));return r=n%4*6,r===0?(a.push(o>>16&255),a.push(o>>8&255),a.push(o&255)):r===18?(a.push(o>>10&255),a.push(o>>2&255)):r===12&&a.push(o>>4&255),new Uint8Array(a)}m(h1,"constructYamlBinary");function d1(e){var t="",r=0,i,n,s=e.length,o=Ap;for(i=0;i<s;i++)i%3===0&&i&&(t+=o[r>>18&63],t+=o[r>>12&63],t+=o[r>>6&63],t+=o[r&63]),r=(r<<8)+e[i];return n=s%3,n===0?(t+=o[r>>18&63],t+=o[r>>12&63],t+=o[r>>6&63],t+=o[r&63]):n===2?(t+=o[r>>10&63],t+=o[r>>4&63],t+=o[r<<2&63],t+=o[64]):n===1&&(t+=o[r>>2&63],t+=o[r<<4&63],t+=o[64],t+=o[64]),t}m(d1,"representYamlBinary");function u1(e){return Object.prototype.toString.call(e)==="[object Uint8Array]"}m(u1,"isBinary");var GB=new $e("tag:yaml.org,2002:binary",{kind:"scalar",resolve:c1,construct:h1,predicate:u1,represent:d1}),YB=Object.prototype.hasOwnProperty,XB=Object.prototype.toString;function p1(e){if(e===null)return!0;var t=[],r,i,n,s,o,a=e;for(r=0,i=a.length;r<i;r+=1){if(n=a[r],o=!1,XB.call(n)!=="[object Object]")return!1;for(s in n)if(YB.call(n,s))if(!o)o=!0;else return!1;if(!o)return!1;if(t.indexOf(s)===-1)t.push(s);else return!1}return!0}m(p1,"resolveYamlOmap");function f1(e){return e!==null?e:[]}m(f1,"constructYamlOmap");var QB=new $e("tag:yaml.org,2002:omap",{kind:"sequence",resolve:p1,construct:f1}),ZB=Object.prototype.toString;function g1(e){if(e===null)return!0;var t,r,i,n,s,o=e;for(s=new Array(o.length),t=0,r=o.length;t<r;t+=1){if(i=o[t],ZB.call(i)!=="[object Object]"||(n=Object.keys(i),n.length!==1))return!1;s[t]=[n[0],i[n[0]]]}return!0}m(g1,"resolveYamlPairs");function m1(e){if(e===null)return[];var t,r,i,n,s,o=e;for(s=new Array(o.length),t=0,r=o.length;t<r;t+=1)i=o[t],n=Object.keys(i),s[t]=[n[0],i[n[0]]];return s}m(m1,"constructYamlPairs");var JB=new $e("tag:yaml.org,2002:pairs",{kind:"sequence",resolve:g1,construct:m1}),KB=Object.prototype.hasOwnProperty;function x1(e){if(e===null)return!0;var t,r=e;for(t in r)if(KB.call(r,t)&&r[t]!==null)return!1;return!0}m(x1,"resolveYamlSet");function b1(e){return e!==null?e:{}}m(b1,"constructYamlSet");var tM=new $e("tag:yaml.org,2002:set",{kind:"mapping",resolve:x1,construct:b1}),y1=WB.extend({implicit:[VB,UB],explicit:[GB,QB,JB,tM]}),Ei=Object.prototype.hasOwnProperty,Pl=1,v1=2,w1=3,Nl=4,Eh=1,eM=2,fm=3,rM=/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/,iM=/[\x85\u2028\u2029]/,nM=/[,\[\]\{\}]/,k1=/^(?:!|!!|![a-z\-]+!)$/i,C1=/^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;function eu(e){return Object.prototype.toString.call(e)}m(eu,"_class");function Lr(e){return e===10||e===13}m(Lr,"is_EOL");function Ti(e){return e===9||e===32}m(Ti,"is_WHITE_SPACE");function Pe(e){return e===9||e===32||e===10||e===13}m(Pe,"is_WS_OR_EOL");function en(e){return e===44||e===91||e===93||e===123||e===125}m(en,"is_FLOW_INDICATOR");function S1(e){var t;return 48<=e&&e<=57?e-48:(t=e|32,97<=t&&t<=102?t-97+10:-1)}m(S1,"fromHexCode");function _1(e){return e===120?2:e===117?4:e===85?8:0}m(_1,"escapedHexLen");function T1(e){return 48<=e&&e<=57?e-48:-1}m(T1,"fromDecimalCode");function ru(e){return e===48?"\0":e===97?"\x07":e===98?"\b":e===116||e===9?"	":e===110?`
`:e===118?"\v":e===102?"\f":e===114?"\r":e===101?"\x1B":e===32?" ":e===34?'"':e===47?"/":e===92?"\\":e===78?"":e===95?" ":e===76?"\u2028":e===80?"\u2029":""}m(ru,"simpleEscapeSequence");function $1(e){return e<=65535?String.fromCharCode(e):String.fromCharCode((e-65536>>10)+55296,(e-65536&1023)+56320)}m($1,"charFromCodepoint");var A1=new Array(256),j1=new Array(256);for(Wi=0;Wi<256;Wi++)A1[Wi]=ru(Wi)?1:0,j1[Wi]=ru(Wi);var Wi;function E1(e,t){this.input=e,this.filename=t.filename||null,this.schema=t.schema||y1,this.onWarning=t.onWarning||null,this.legacy=t.legacy||!1,this.json=t.json||!1,this.listener=t.listener||null,this.implicitTypes=this.schema.compiledImplicit,this.typeMap=this.schema.compiledTypeMap,this.length=e.length,this.position=0,this.line=0,this.lineStart=0,this.lineIndent=0,this.firstTabInLine=-1,this.documents=[]}m(E1,"State$1");function jp(e,t){var r={name:e.filename,buffer:e.input.slice(0,-1),position:e.position,line:e.line,column:e.position-e.lineStart};return r.snippet=EB(r),new Qe(t,r)}m(jp,"generateError");function ht(e,t){throw jp(e,t)}m(ht,"throwError");function No(e,t){e.onWarning&&e.onWarning.call(null,jp(e,t))}m(No,"throwWarning");var gm={YAML:m(function(t,r,i){var n,s,o;t.version!==null&&ht(t,"duplication of %YAML directive"),i.length!==1&&ht(t,"YAML directive accepts exactly one argument"),n=/^([0-9]+)\.([0-9]+)$/.exec(i[0]),n===null&&ht(t,"ill-formed argument of the YAML directive"),s=parseInt(n[1],10),o=parseInt(n[2],10),s!==1&&ht(t,"unacceptable YAML version of the document"),t.version=i[0],t.checkLineBreaks=o<2,o!==1&&o!==2&&No(t,"unsupported YAML version of the document")},"handleYamlDirective"),TAG:m(function(t,r,i){var n,s;i.length!==2&&ht(t,"TAG directive accepts exactly two arguments"),n=i[0],s=i[1],k1.test(n)||ht(t,"ill-formed tag handle (first argument) of the TAG directive"),Ei.call(t.tagMap,n)&&ht(t,'there is a previously declared suffix for "'+n+'" tag handle'),C1.test(s)||ht(t,"ill-formed tag prefix (second argument) of the TAG directive");try{s=decodeURIComponent(s)}catch{ht(t,"tag prefix is malformed: "+s)}t.tagMap[n]=s},"handleTagDirective")};function ci(e,t,r,i){var n,s,o,a;if(t<r){if(a=e.input.slice(t,r),i)for(n=0,s=a.length;n<s;n+=1)o=a.charCodeAt(n),o===9||32<=o&&o<=1114111||ht(e,"expected valid JSON character");else rM.test(a)&&ht(e,"the stream contains non-printable characters");e.result+=a}}m(ci,"captureSegment");function iu(e,t,r,i){var n,s,o,a;for(ue.isObject(r)||ht(e,"cannot merge mappings; the provided source object is unacceptable"),n=Object.keys(r),o=0,a=n.length;o<a;o+=1)s=n[o],Ei.call(t,s)||(t[s]=r[s],i[s]=!0)}m(iu,"mergeMappings");function rn(e,t,r,i,n,s,o,a,l){var c,d;if(Array.isArray(n))for(n=Array.prototype.slice.call(n),c=0,d=n.length;c<d;c+=1)Array.isArray(n[c])&&ht(e,"nested arrays are not supported inside keys"),typeof n=="object"&&eu(n[c])==="[object Object]"&&(n[c]="[object Object]");if(typeof n=="object"&&eu(n)==="[object Object]"&&(n="[object Object]"),n=String(n),t===null&&(t={}),i==="tag:yaml.org,2002:merge")if(Array.isArray(s))for(c=0,d=s.length;c<d;c+=1)iu(e,t,s[c],r);else iu(e,t,s,r);else!e.json&&!Ei.call(r,n)&&Ei.call(t,n)&&(e.line=o||e.line,e.lineStart=a||e.lineStart,e.position=l||e.position,ht(e,"duplicated mapping key")),n==="__proto__"?Object.defineProperty(t,n,{configurable:!0,enumerable:!0,writable:!0,value:s}):t[n]=s,delete r[n];return t}m(rn,"storeMappingPair");function $c(e){var t;t=e.input.charCodeAt(e.position),t===10?e.position++:t===13?(e.position++,e.input.charCodeAt(e.position)===10&&e.position++):ht(e,"a line break is expected"),e.line+=1,e.lineStart=e.position,e.firstTabInLine=-1}m($c,"readLineBreak");function re(e,t,r){for(var i=0,n=e.input.charCodeAt(e.position);n!==0;){for(;Ti(n);)n===9&&e.firstTabInLine===-1&&(e.firstTabInLine=e.position),n=e.input.charCodeAt(++e.position);if(t&&n===35)do n=e.input.charCodeAt(++e.position);while(n!==10&&n!==13&&n!==0);if(Lr(n))for($c(e),n=e.input.charCodeAt(e.position),i++,e.lineIndent=0;n===32;)e.lineIndent++,n=e.input.charCodeAt(++e.position);else break}return r!==-1&&i!==0&&e.lineIndent<r&&No(e,"deficient indentation"),i}m(re,"skipSeparationSpace");function ca(e){var t=e.position,r;return r=e.input.charCodeAt(t),!!((r===45||r===46)&&r===e.input.charCodeAt(t+1)&&r===e.input.charCodeAt(t+2)&&(t+=3,r=e.input.charCodeAt(t),r===0||Pe(r)))}m(ca,"testDocumentSeparator");function Ac(e,t){t===1?e.result+=" ":t>1&&(e.result+=ue.repeat(`
`,t-1))}m(Ac,"writeFoldedLines");function L1(e,t,r){var i,n,s,o,a,l,c,d,u=e.kind,p=e.result,f;if(f=e.input.charCodeAt(e.position),Pe(f)||en(f)||f===35||f===38||f===42||f===33||f===124||f===62||f===39||f===34||f===37||f===64||f===96||(f===63||f===45)&&(n=e.input.charCodeAt(e.position+1),Pe(n)||r&&en(n)))return!1;for(e.kind="scalar",e.result="",s=o=e.position,a=!1;f!==0;){if(f===58){if(n=e.input.charCodeAt(e.position+1),Pe(n)||r&&en(n))break}else if(f===35){if(i=e.input.charCodeAt(e.position-1),Pe(i))break}else{if(e.position===e.lineStart&&ca(e)||r&&en(f))break;if(Lr(f))if(l=e.line,c=e.lineStart,d=e.lineIndent,re(e,!1,-1),e.lineIndent>=t){a=!0,f=e.input.charCodeAt(e.position);continue}else{e.position=o,e.line=l,e.lineStart=c,e.lineIndent=d;break}}a&&(ci(e,s,o,!1),Ac(e,e.line-l),s=o=e.position,a=!1),Ti(f)||(o=e.position+1),f=e.input.charCodeAt(++e.position)}return ci(e,s,o,!1),e.result?!0:(e.kind=u,e.result=p,!1)}m(L1,"readPlainScalar");function B1(e,t){var r,i,n;if(r=e.input.charCodeAt(e.position),r!==39)return!1;for(e.kind="scalar",e.result="",e.position++,i=n=e.position;(r=e.input.charCodeAt(e.position))!==0;)if(r===39)if(ci(e,i,e.position,!0),r=e.input.charCodeAt(++e.position),r===39)i=e.position,e.position++,n=e.position;else return!0;else Lr(r)?(ci(e,i,n,!0),Ac(e,re(e,!1,t)),i=n=e.position):e.position===e.lineStart&&ca(e)?ht(e,"unexpected end of the document within a single quoted scalar"):(e.position++,n=e.position);ht(e,"unexpected end of the stream within a single quoted scalar")}m(B1,"readSingleQuotedScalar");function M1(e,t){var r,i,n,s,o,a;if(a=e.input.charCodeAt(e.position),a!==34)return!1;for(e.kind="scalar",e.result="",e.position++,r=i=e.position;(a=e.input.charCodeAt(e.position))!==0;){if(a===34)return ci(e,r,e.position,!0),e.position++,!0;if(a===92){if(ci(e,r,e.position,!0),a=e.input.charCodeAt(++e.position),Lr(a))re(e,!1,t);else if(a<256&&A1[a])e.result+=j1[a],e.position++;else if((o=_1(a))>0){for(n=o,s=0;n>0;n--)a=e.input.charCodeAt(++e.position),(o=S1(a))>=0?s=(s<<4)+o:ht(e,"expected hexadecimal character");e.result+=$1(s),e.position++}else ht(e,"unknown escape sequence");r=i=e.position}else Lr(a)?(ci(e,r,i,!0),Ac(e,re(e,!1,t)),r=i=e.position):e.position===e.lineStart&&ca(e)?ht(e,"unexpected end of the document within a double quoted scalar"):(e.position++,i=e.position)}ht(e,"unexpected end of the stream within a double quoted scalar")}m(M1,"readDoubleQuotedScalar");function I1(e,t){var r=!0,i,n,s,o=e.tag,a,l=e.anchor,c,d,u,p,f,g=Object.create(null),x,v,y,b;if(b=e.input.charCodeAt(e.position),b===91)d=93,f=!1,a=[];else if(b===123)d=125,f=!0,a={};else return!1;for(e.anchor!==null&&(e.anchorMap[e.anchor]=a),b=e.input.charCodeAt(++e.position);b!==0;){if(re(e,!0,t),b=e.input.charCodeAt(e.position),b===d)return e.position++,e.tag=o,e.anchor=l,e.kind=f?"mapping":"sequence",e.result=a,!0;r?b===44&&ht(e,"expected the node content, but found ','"):ht(e,"missed comma between flow collection entries"),v=x=y=null,u=p=!1,b===63&&(c=e.input.charCodeAt(e.position+1),Pe(c)&&(u=p=!0,e.position++,re(e,!0,t))),i=e.line,n=e.lineStart,s=e.position,pn(e,t,Pl,!1,!0),v=e.tag,x=e.result,re(e,!0,t),b=e.input.charCodeAt(e.position),(p||e.line===i)&&b===58&&(u=!0,b=e.input.charCodeAt(++e.position),re(e,!0,t),pn(e,t,Pl,!1,!0),y=e.result),f?rn(e,a,g,v,x,y,i,n,s):u?a.push(rn(e,null,g,v,x,y,i,n,s)):a.push(x),re(e,!0,t),b=e.input.charCodeAt(e.position),b===44?(r=!0,b=e.input.charCodeAt(++e.position)):r=!1}ht(e,"unexpected end of the stream within a flow collection")}m(I1,"readFlowCollection");function O1(e,t){var r,i,n=Eh,s=!1,o=!1,a=t,l=0,c=!1,d,u;if(u=e.input.charCodeAt(e.position),u===124)i=!1;else if(u===62)i=!0;else return!1;for(e.kind="scalar",e.result="";u!==0;)if(u=e.input.charCodeAt(++e.position),u===43||u===45)Eh===n?n=u===43?fm:eM:ht(e,"repeat of a chomping mode identifier");else if((d=T1(u))>=0)d===0?ht(e,"bad explicit indentation width of a block scalar; it cannot be less than one"):o?ht(e,"repeat of an indentation width identifier"):(a=t+d-1,o=!0);else break;if(Ti(u)){do u=e.input.charCodeAt(++e.position);while(Ti(u));if(u===35)do u=e.input.charCodeAt(++e.position);while(!Lr(u)&&u!==0)}for(;u!==0;){for($c(e),e.lineIndent=0,u=e.input.charCodeAt(e.position);(!o||e.lineIndent<a)&&u===32;)e.lineIndent++,u=e.input.charCodeAt(++e.position);if(!o&&e.lineIndent>a&&(a=e.lineIndent),Lr(u)){l++;continue}if(e.lineIndent<a){n===fm?e.result+=ue.repeat(`
`,s?1+l:l):n===Eh&&s&&(e.result+=`
`);break}for(i?Ti(u)?(c=!0,e.result+=ue.repeat(`
`,s?1+l:l)):c?(c=!1,e.result+=ue.repeat(`
`,l+1)):l===0?s&&(e.result+=" "):e.result+=ue.repeat(`
`,l):e.result+=ue.repeat(`
`,s?1+l:l),s=!0,o=!0,l=0,r=e.position;!Lr(u)&&u!==0;)u=e.input.charCodeAt(++e.position);ci(e,r,e.position,!1)}return!0}m(O1,"readBlockScalar");function nu(e,t){var r,i=e.tag,n=e.anchor,s=[],o,a=!1,l;if(e.firstTabInLine!==-1)return!1;for(e.anchor!==null&&(e.anchorMap[e.anchor]=s),l=e.input.charCodeAt(e.position);l!==0&&(e.firstTabInLine!==-1&&(e.position=e.firstTabInLine,ht(e,"tab characters must not be used in indentation")),!(l!==45||(o=e.input.charCodeAt(e.position+1),!Pe(o))));){if(a=!0,e.position++,re(e,!0,-1)&&e.lineIndent<=t){s.push(null),l=e.input.charCodeAt(e.position);continue}if(r=e.line,pn(e,t,w1,!1,!0),s.push(e.result),re(e,!0,-1),l=e.input.charCodeAt(e.position),(e.line===r||e.lineIndent>t)&&l!==0)ht(e,"bad indentation of a sequence entry");else if(e.lineIndent<t)break}return a?(e.tag=i,e.anchor=n,e.kind="sequence",e.result=s,!0):!1}m(nu,"readBlockSequence");function R1(e,t,r){var i,n,s,o,a,l,c=e.tag,d=e.anchor,u={},p=Object.create(null),f=null,g=null,x=null,v=!1,y=!1,b;if(e.firstTabInLine!==-1)return!1;for(e.anchor!==null&&(e.anchorMap[e.anchor]=u),b=e.input.charCodeAt(e.position);b!==0;){if(!v&&e.firstTabInLine!==-1&&(e.position=e.firstTabInLine,ht(e,"tab characters must not be used in indentation")),i=e.input.charCodeAt(e.position+1),s=e.line,(b===63||b===58)&&Pe(i))b===63?(v&&(rn(e,u,p,f,g,null,o,a,l),f=g=x=null),y=!0,v=!0,n=!0):v?(v=!1,n=!0):ht(e,"incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"),e.position+=1,b=i;else{if(o=e.line,a=e.lineStart,l=e.position,!pn(e,r,v1,!1,!0))break;if(e.line===s){for(b=e.input.charCodeAt(e.position);Ti(b);)b=e.input.charCodeAt(++e.position);if(b===58)b=e.input.charCodeAt(++e.position),Pe(b)||ht(e,"a whitespace character is expected after the key-value separator within a block mapping"),v&&(rn(e,u,p,f,g,null,o,a,l),f=g=x=null),y=!0,v=!1,n=!1,f=e.tag,g=e.result;else if(y)ht(e,"can not read an implicit mapping pair; a colon is missed");else return e.tag=c,e.anchor=d,!0}else if(y)ht(e,"can not read a block mapping entry; a multiline key may not be an implicit key");else return e.tag=c,e.anchor=d,!0}if((e.line===s||e.lineIndent>t)&&(v&&(o=e.line,a=e.lineStart,l=e.position),pn(e,t,Nl,!0,n)&&(v?g=e.result:x=e.result),v||(rn(e,u,p,f,g,x,o,a,l),f=g=x=null),re(e,!0,-1),b=e.input.charCodeAt(e.position)),(e.line===s||e.lineIndent>t)&&b!==0)ht(e,"bad indentation of a mapping entry");else if(e.lineIndent<t)break}return v&&rn(e,u,p,f,g,null,o,a,l),y&&(e.tag=c,e.anchor=d,e.kind="mapping",e.result=u),y}m(R1,"readBlockMapping");function D1(e){var t,r=!1,i=!1,n,s,o;if(o=e.input.charCodeAt(e.position),o!==33)return!1;if(e.tag!==null&&ht(e,"duplication of a tag property"),o=e.input.charCodeAt(++e.position),o===60?(r=!0,o=e.input.charCodeAt(++e.position)):o===33?(i=!0,n="!!",o=e.input.charCodeAt(++e.position)):n="!",t=e.position,r){do o=e.input.charCodeAt(++e.position);while(o!==0&&o!==62);e.position<e.length?(s=e.input.slice(t,e.position),o=e.input.charCodeAt(++e.position)):ht(e,"unexpected end of the stream within a verbatim tag")}else{for(;o!==0&&!Pe(o);)o===33&&(i?ht(e,"tag suffix cannot contain exclamation marks"):(n=e.input.slice(t-1,e.position+1),k1.test(n)||ht(e,"named tag handle cannot contain such characters"),i=!0,t=e.position+1)),o=e.input.charCodeAt(++e.position);s=e.input.slice(t,e.position),nM.test(s)&&ht(e,"tag suffix cannot contain flow indicator characters")}s&&!C1.test(s)&&ht(e,"tag name cannot contain such characters: "+s);try{s=decodeURIComponent(s)}catch{ht(e,"tag name is malformed: "+s)}return r?e.tag=s:Ei.call(e.tagMap,n)?e.tag=e.tagMap[n]+s:n==="!"?e.tag="!"+s:n==="!!"?e.tag="tag:yaml.org,2002:"+s:ht(e,'undeclared tag handle "'+n+'"'),!0}m(D1,"readTagProperty");function F1(e){var t,r;if(r=e.input.charCodeAt(e.position),r!==38)return!1;for(e.anchor!==null&&ht(e,"duplication of an anchor property"),r=e.input.charCodeAt(++e.position),t=e.position;r!==0&&!Pe(r)&&!en(r);)r=e.input.charCodeAt(++e.position);return e.position===t&&ht(e,"name of an anchor node must contain at least one character"),e.anchor=e.input.slice(t,e.position),!0}m(F1,"readAnchorProperty");function P1(e){var t,r,i;if(i=e.input.charCodeAt(e.position),i!==42)return!1;for(i=e.input.charCodeAt(++e.position),t=e.position;i!==0&&!Pe(i)&&!en(i);)i=e.input.charCodeAt(++e.position);return e.position===t&&ht(e,"name of an alias node must contain at least one character"),r=e.input.slice(t,e.position),Ei.call(e.anchorMap,r)||ht(e,'unidentified alias "'+r+'"'),e.result=e.anchorMap[r],re(e,!0,-1),!0}m(P1,"readAlias");function pn(e,t,r,i,n){var s,o,a,l=1,c=!1,d=!1,u,p,f,g,x,v;if(e.listener!==null&&e.listener("open",e),e.tag=null,e.anchor=null,e.kind=null,e.result=null,s=o=a=Nl===r||w1===r,i&&re(e,!0,-1)&&(c=!0,e.lineIndent>t?l=1:e.lineIndent===t?l=0:e.lineIndent<t&&(l=-1)),l===1)for(;D1(e)||F1(e);)re(e,!0,-1)?(c=!0,a=s,e.lineIndent>t?l=1:e.lineIndent===t?l=0:e.lineIndent<t&&(l=-1)):a=!1;if(a&&(a=c||n),(l===1||Nl===r)&&(Pl===r||v1===r?x=t:x=t+1,v=e.position-e.lineStart,l===1?a&&(nu(e,v)||R1(e,v,x))||I1(e,x)?d=!0:(o&&O1(e,x)||B1(e,x)||M1(e,x)?d=!0:P1(e)?(d=!0,(e.tag!==null||e.anchor!==null)&&ht(e,"alias node should not have any properties")):L1(e,x,Pl===r)&&(d=!0,e.tag===null&&(e.tag="?")),e.anchor!==null&&(e.anchorMap[e.anchor]=e.result)):l===0&&(d=a&&nu(e,v))),e.tag===null)e.anchor!==null&&(e.anchorMap[e.anchor]=e.result);else if(e.tag==="?"){for(e.result!==null&&e.kind!=="scalar"&&ht(e,'unacceptable node kind for !<?> tag; it should be "scalar", not "'+e.kind+'"'),u=0,p=e.implicitTypes.length;u<p;u+=1)if(g=e.implicitTypes[u],g.resolve(e.result)){e.result=g.construct(e.result),e.tag=g.tag,e.anchor!==null&&(e.anchorMap[e.anchor]=e.result);break}}else if(e.tag!=="!"){if(Ei.call(e.typeMap[e.kind||"fallback"],e.tag))g=e.typeMap[e.kind||"fallback"][e.tag];else for(g=null,f=e.typeMap.multi[e.kind||"fallback"],u=0,p=f.length;u<p;u+=1)if(e.tag.slice(0,f[u].tag.length)===f[u].tag){g=f[u];break}g||ht(e,"unknown tag !<"+e.tag+">"),e.result!==null&&g.kind!==e.kind&&ht(e,"unacceptable node kind for !<"+e.tag+'> tag; it should be "'+g.kind+'", not "'+e.kind+'"'),g.resolve(e.result,e.tag)?(e.result=g.construct(e.result,e.tag),e.anchor!==null&&(e.anchorMap[e.anchor]=e.result)):ht(e,"cannot resolve a node with !<"+e.tag+"> explicit tag")}return e.listener!==null&&e.listener("close",e),e.tag!==null||e.anchor!==null||d}m(pn,"composeNode");function N1(e){var t=e.position,r,i,n,s=!1,o;for(e.version=null,e.checkLineBreaks=e.legacy,e.tagMap=Object.create(null),e.anchorMap=Object.create(null);(o=e.input.charCodeAt(e.position))!==0&&(re(e,!0,-1),o=e.input.charCodeAt(e.position),!(e.lineIndent>0||o!==37));){for(s=!0,o=e.input.charCodeAt(++e.position),r=e.position;o!==0&&!Pe(o);)o=e.input.charCodeAt(++e.position);for(i=e.input.slice(r,e.position),n=[],i.length<1&&ht(e,"directive name must not be less than one character in length");o!==0;){for(;Ti(o);)o=e.input.charCodeAt(++e.position);if(o===35){do o=e.input.charCodeAt(++e.position);while(o!==0&&!Lr(o));break}if(Lr(o))break;for(r=e.position;o!==0&&!Pe(o);)o=e.input.charCodeAt(++e.position);n.push(e.input.slice(r,e.position))}o!==0&&$c(e),Ei.call(gm,i)?gm[i](e,i,n):No(e,'unknown document directive "'+i+'"')}if(re(e,!0,-1),e.lineIndent===0&&e.input.charCodeAt(e.position)===45&&e.input.charCodeAt(e.position+1)===45&&e.input.charCodeAt(e.position+2)===45?(e.position+=3,re(e,!0,-1)):s&&ht(e,"directives end mark is expected"),pn(e,e.lineIndent-1,Nl,!1,!0),re(e,!0,-1),e.checkLineBreaks&&iM.test(e.input.slice(t,e.position))&&No(e,"non-ASCII line breaks are interpreted as content"),e.documents.push(e.result),e.position===e.lineStart&&ca(e)){e.input.charCodeAt(e.position)===46&&(e.position+=3,re(e,!0,-1));return}if(e.position<e.length-1)ht(e,"end of the stream or a document separator is expected");else return}m(N1,"readDocument");function Ep(e,t){e=String(e),t=t||{},e.length!==0&&(e.charCodeAt(e.length-1)!==10&&e.charCodeAt(e.length-1)!==13&&(e+=`
`),e.charCodeAt(0)===65279&&(e=e.slice(1)));var r=new E1(e,t),i=e.indexOf("\0");for(i!==-1&&(r.position=i,ht(r,"null byte is not allowed in input")),r.input+="\0";r.input.charCodeAt(r.position)===32;)r.lineIndent+=1,r.position+=1;for(;r.position<r.length-1;)N1(r);return r.documents}m(Ep,"loadDocuments");function z1(e,t,r){t!==null&&typeof t=="object"&&typeof r>"u"&&(r=t,t=null);var i=Ep(e,r);if(typeof t!="function")return i;for(var n=0,s=i.length;n<s;n+=1)t(i[n])}m(z1,"loadAll$1");function H1(e,t){var r=Ep(e,t);if(r.length!==0){if(r.length===1)return r[0];throw new Qe("expected a single document in the stream, but found more")}}m(H1,"load$1");var sM=z1,oM=H1,aM={loadAll:sM,load:oM},q1=Object.prototype.toString,W1=Object.prototype.hasOwnProperty,Lp=65279,lM=9,zo=10,cM=13,hM=32,dM=33,uM=34,su=35,pM=37,fM=38,gM=39,mM=42,V1=44,xM=45,zl=58,bM=61,yM=62,vM=63,wM=64,U1=91,G1=93,kM=96,Y1=123,CM=124,X1=125,Me={};Me[0]="\\0";Me[7]="\\a";Me[8]="\\b";Me[9]="\\t";Me[10]="\\n";Me[11]="\\v";Me[12]="\\f";Me[13]="\\r";Me[27]="\\e";Me[34]='\\"';Me[92]="\\\\";Me[133]="\\N";Me[160]="\\_";Me[8232]="\\L";Me[8233]="\\P";var SM=["y","Y","yes","Yes","YES","on","On","ON","n","N","no","No","NO","off","Off","OFF"],_M=/^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;function Q1(e,t){var r,i,n,s,o,a,l;if(t===null)return{};for(r={},i=Object.keys(t),n=0,s=i.length;n<s;n+=1)o=i[n],a=String(t[o]),o.slice(0,2)==="!!"&&(o="tag:yaml.org,2002:"+o.slice(2)),l=e.compiledTypeMap.fallback[o],l&&W1.call(l.styleAliases,a)&&(a=l.styleAliases[a]),r[o]=a;return r}m(Q1,"compileStyleMap");function Z1(e){var t,r,i;if(t=e.toString(16).toUpperCase(),e<=255)r="x",i=2;else if(e<=65535)r="u",i=4;else if(e<=4294967295)r="U",i=8;else throw new Qe("code point within a string may not be greater than 0xFFFFFFFF");return"\\"+r+ue.repeat("0",i-t.length)+t}m(Z1,"encodeHex");var TM=1,Ho=2;function J1(e){this.schema=e.schema||y1,this.indent=Math.max(1,e.indent||2),this.noArrayIndent=e.noArrayIndent||!1,this.skipInvalid=e.skipInvalid||!1,this.flowLevel=ue.isNothing(e.flowLevel)?-1:e.flowLevel,this.styleMap=Q1(this.schema,e.styles||null),this.sortKeys=e.sortKeys||!1,this.lineWidth=e.lineWidth||80,this.noRefs=e.noRefs||!1,this.noCompatMode=e.noCompatMode||!1,this.condenseFlow=e.condenseFlow||!1,this.quotingType=e.quotingType==='"'?Ho:TM,this.forceQuotes=e.forceQuotes||!1,this.replacer=typeof e.replacer=="function"?e.replacer:null,this.implicitTypes=this.schema.compiledImplicit,this.explicitTypes=this.schema.compiledExplicit,this.tag=null,this.result="",this.duplicates=[],this.usedDuplicates=null}m(J1,"State");function ou(e,t){for(var r=ue.repeat(" ",t),i=0,n=-1,s="",o,a=e.length;i<a;)n=e.indexOf(`
`,i),n===-1?(o=e.slice(i),i=a):(o=e.slice(i,n+1),i=n+1),o.length&&o!==`
`&&(s+=r),s+=o;return s}m(ou,"indentString");function Hl(e,t){return`
`+ue.repeat(" ",e.indent*t)}m(Hl,"generateNextLine");function K1(e,t){var r,i,n;for(r=0,i=e.implicitTypes.length;r<i;r+=1)if(n=e.implicitTypes[r],n.resolve(t))return!0;return!1}m(K1,"testImplicitResolving");function qo(e){return e===hM||e===lM}m(qo,"isWhitespace");function ws(e){return 32<=e&&e<=126||161<=e&&e<=55295&&e!==8232&&e!==8233||57344<=e&&e<=65533&&e!==Lp||65536<=e&&e<=1114111}m(ws,"isPrintable");function au(e){return ws(e)&&e!==Lp&&e!==cM&&e!==zo}m(au,"isNsCharOrWhitespace");function lu(e,t,r){var i=au(e),n=i&&!qo(e);return(r?i:i&&e!==V1&&e!==U1&&e!==G1&&e!==Y1&&e!==X1)&&e!==su&&!(t===zl&&!n)||au(t)&&!qo(t)&&e===su||t===zl&&n}m(lu,"isPlainSafe");function tv(e){return ws(e)&&e!==Lp&&!qo(e)&&e!==xM&&e!==vM&&e!==zl&&e!==V1&&e!==U1&&e!==G1&&e!==Y1&&e!==X1&&e!==su&&e!==fM&&e!==mM&&e!==dM&&e!==CM&&e!==bM&&e!==yM&&e!==gM&&e!==uM&&e!==pM&&e!==wM&&e!==kM}m(tv,"isPlainSafeFirst");function ev(e){return!qo(e)&&e!==zl}m(ev,"isPlainSafeLast");function Un(e,t){var r=e.charCodeAt(t),i;return r>=55296&&r<=56319&&t+1<e.length&&(i=e.charCodeAt(t+1),i>=56320&&i<=57343)?(r-55296)*1024+i-56320+65536:r}m(Un,"codePointAt");function Bp(e){var t=/^\n* /;return t.test(e)}m(Bp,"needIndentIndicator");var rv=1,cu=2,iv=3,nv=4,zn=5;function sv(e,t,r,i,n,s,o,a){var l,c=0,d=null,u=!1,p=!1,f=i!==-1,g=-1,x=tv(Un(e,0))&&ev(Un(e,e.length-1));if(t||o)for(l=0;l<e.length;c>=65536?l+=2:l++){if(c=Un(e,l),!ws(c))return zn;x=x&&lu(c,d,a),d=c}else{for(l=0;l<e.length;c>=65536?l+=2:l++){if(c=Un(e,l),c===zo)u=!0,f&&(p=p||l-g-1>i&&e[g+1]!==" ",g=l);else if(!ws(c))return zn;x=x&&lu(c,d,a),d=c}p=p||f&&l-g-1>i&&e[g+1]!==" "}return!u&&!p?x&&!o&&!n(e)?rv:s===Ho?zn:cu:r>9&&Bp(e)?zn:o?s===Ho?zn:cu:p?nv:iv}m(sv,"chooseScalarStyle");function ov(e,t,r,i,n){e.dump=function(){if(t.length===0)return e.quotingType===Ho?'""':"''";if(!e.noCompatMode&&(SM.indexOf(t)!==-1||_M.test(t)))return e.quotingType===Ho?'"'+t+'"':"'"+t+"'";var s=e.indent*Math.max(1,r),o=e.lineWidth===-1?-1:Math.max(Math.min(e.lineWidth,40),e.lineWidth-s),a=i||e.flowLevel>-1&&r>=e.flowLevel;function l(c){return K1(e,c)}switch(m(l,"testAmbiguity"),sv(t,a,e.indent,o,l,e.quotingType,e.forceQuotes&&!i,n)){case rv:return t;case cu:return"'"+t.replace(/'/g,"''")+"'";case iv:return"|"+hu(t,e.indent)+du(ou(t,s));case nv:return">"+hu(t,e.indent)+du(ou(av(t,o),s));case zn:return'"'+lv(t)+'"';default:throw new Qe("impossible error: invalid scalar style")}}()}m(ov,"writeScalar");function hu(e,t){var r=Bp(e)?String(t):"",i=e[e.length-1]===`
`,n=i&&(e[e.length-2]===`
`||e===`
`),s=n?"+":i?"":"-";return r+s+`
`}m(hu,"blockHeader");function du(e){return e[e.length-1]===`
`?e.slice(0,-1):e}m(du,"dropEndingNewline");function av(e,t){for(var r=/(\n+)([^\n]*)/g,i=function(){var c=e.indexOf(`
`);return c=c!==-1?c:e.length,r.lastIndex=c,uu(e.slice(0,c),t)}(),n=e[0]===`
`||e[0]===" ",s,o;o=r.exec(e);){var a=o[1],l=o[2];s=l[0]===" ",i+=a+(!n&&!s&&l!==""?`
`:"")+uu(l,t),n=s}return i}m(av,"foldString");function uu(e,t){if(e===""||e[0]===" ")return e;for(var r=/ [^ ]/g,i,n=0,s,o=0,a=0,l="";i=r.exec(e);)a=i.index,a-n>t&&(s=o>n?o:a,l+=`
`+e.slice(n,s),n=s+1),o=a;return l+=`
`,e.length-n>t&&o>n?l+=e.slice(n,o)+`
`+e.slice(o+1):l+=e.slice(n),l.slice(1)}m(uu,"foldLine");function lv(e){for(var t="",r=0,i,n=0;n<e.length;r>=65536?n+=2:n++)r=Un(e,n),i=Me[r],!i&&ws(r)?(t+=e[n],r>=65536&&(t+=e[n+1])):t+=i||Z1(r);return t}m(lv,"escapeString");function cv(e,t,r){var i="",n=e.tag,s,o,a;for(s=0,o=r.length;s<o;s+=1)a=r[s],e.replacer&&(a=e.replacer.call(r,String(s),a)),(Yr(e,t,a,!1,!1)||typeof a>"u"&&Yr(e,t,null,!1,!1))&&(i!==""&&(i+=","+(e.condenseFlow?"":" ")),i+=e.dump);e.tag=n,e.dump="["+i+"]"}m(cv,"writeFlowSequence");function pu(e,t,r,i){var n="",s=e.tag,o,a,l;for(o=0,a=r.length;o<a;o+=1)l=r[o],e.replacer&&(l=e.replacer.call(r,String(o),l)),(Yr(e,t+1,l,!0,!0,!1,!0)||typeof l>"u"&&Yr(e,t+1,null,!0,!0,!1,!0))&&((!i||n!=="")&&(n+=Hl(e,t)),e.dump&&zo===e.dump.charCodeAt(0)?n+="-":n+="- ",n+=e.dump);e.tag=s,e.dump=n||"[]"}m(pu,"writeBlockSequence");function hv(e,t,r){var i="",n=e.tag,s=Object.keys(r),o,a,l,c,d;for(o=0,a=s.length;o<a;o+=1)d="",i!==""&&(d+=", "),e.condenseFlow&&(d+='"'),l=s[o],c=r[l],e.replacer&&(c=e.replacer.call(r,l,c)),Yr(e,t,l,!1,!1)&&(e.dump.length>1024&&(d+="? "),d+=e.dump+(e.condenseFlow?'"':"")+":"+(e.condenseFlow?"":" "),Yr(e,t,c,!1,!1)&&(d+=e.dump,i+=d));e.tag=n,e.dump="{"+i+"}"}m(hv,"writeFlowMapping");function dv(e,t,r,i){var n="",s=e.tag,o=Object.keys(r),a,l,c,d,u,p;if(e.sortKeys===!0)o.sort();else if(typeof e.sortKeys=="function")o.sort(e.sortKeys);else if(e.sortKeys)throw new Qe("sortKeys must be a boolean or a function");for(a=0,l=o.length;a<l;a+=1)p="",(!i||n!=="")&&(p+=Hl(e,t)),c=o[a],d=r[c],e.replacer&&(d=e.replacer.call(r,c,d)),Yr(e,t+1,c,!0,!0,!0)&&(u=e.tag!==null&&e.tag!=="?"||e.dump&&e.dump.length>1024,u&&(e.dump&&zo===e.dump.charCodeAt(0)?p+="?":p+="? "),p+=e.dump,u&&(p+=Hl(e,t)),Yr(e,t+1,d,!0,u)&&(e.dump&&zo===e.dump.charCodeAt(0)?p+=":":p+=": ",p+=e.dump,n+=p));e.tag=s,e.dump=n||"{}"}m(dv,"writeBlockMapping");function fu(e,t,r){var i,n,s,o,a,l;for(n=r?e.explicitTypes:e.implicitTypes,s=0,o=n.length;s<o;s+=1)if(a=n[s],(a.instanceOf||a.predicate)&&(!a.instanceOf||typeof t=="object"&&t instanceof a.instanceOf)&&(!a.predicate||a.predicate(t))){if(r?a.multi&&a.representName?e.tag=a.representName(t):e.tag=a.tag:e.tag="?",a.represent){if(l=e.styleMap[a.tag]||a.defaultStyle,q1.call(a.represent)==="[object Function]")i=a.represent(t,l);else if(W1.call(a.represent,l))i=a.represent[l](t,l);else throw new Qe("!<"+a.tag+'> tag resolver accepts not "'+l+'" style');e.dump=i}return!0}return!1}m(fu,"detectType");function Yr(e,t,r,i,n,s,o){e.tag=null,e.dump=r,fu(e,r,!1)||fu(e,r,!0);var a=q1.call(e.dump),l=i,c;i&&(i=e.flowLevel<0||e.flowLevel>t);var d=a==="[object Object]"||a==="[object Array]",u,p;if(d&&(u=e.duplicates.indexOf(r),p=u!==-1),(e.tag!==null&&e.tag!=="?"||p||e.indent!==2&&t>0)&&(n=!1),p&&e.usedDuplicates[u])e.dump="*ref_"+u;else{if(d&&p&&!e.usedDuplicates[u]&&(e.usedDuplicates[u]=!0),a==="[object Object]")i&&Object.keys(e.dump).length!==0?(dv(e,t,e.dump,n),p&&(e.dump="&ref_"+u+e.dump)):(hv(e,t,e.dump),p&&(e.dump="&ref_"+u+" "+e.dump));else if(a==="[object Array]")i&&e.dump.length!==0?(e.noArrayIndent&&!o&&t>0?pu(e,t-1,e.dump,n):pu(e,t,e.dump,n),p&&(e.dump="&ref_"+u+e.dump)):(cv(e,t,e.dump),p&&(e.dump="&ref_"+u+" "+e.dump));else if(a==="[object String]")e.tag!=="?"&&ov(e,e.dump,t,s,l);else{if(a==="[object Undefined]")return!1;if(e.skipInvalid)return!1;throw new Qe("unacceptable kind of an object to dump "+a)}e.tag!==null&&e.tag!=="?"&&(c=encodeURI(e.tag[0]==="!"?e.tag.slice(1):e.tag).replace(/!/g,"%21"),e.tag[0]==="!"?c="!"+c:c.slice(0,18)==="tag:yaml.org,2002:"?c="!!"+c.slice(18):c="!<"+c+">",e.dump=c+" "+e.dump)}return!0}m(Yr,"writeNode");function uv(e,t){var r=[],i=[],n,s;for(ql(e,r,i),n=0,s=i.length;n<s;n+=1)t.duplicates.push(r[i[n]]);t.usedDuplicates=new Array(s)}m(uv,"getDuplicateReferences");function ql(e,t,r){var i,n,s;if(e!==null&&typeof e=="object")if(n=t.indexOf(e),n!==-1)r.indexOf(n)===-1&&r.push(n);else if(t.push(e),Array.isArray(e))for(n=0,s=e.length;n<s;n+=1)ql(e[n],t,r);else for(i=Object.keys(e),n=0,s=i.length;n<s;n+=1)ql(e[i[n]],t,r)}m(ql,"inspectNode");function $M(e,t){t=t||{};var r=new J1(t);r.noRefs||uv(e,r);var i=e;return r.replacer&&(i=r.replacer.call({"":i},"",i)),Yr(r,0,i,!0,!0)?r.dump+`
`:""}m($M,"dump$1");function AM(e,t){return function(){throw new Error("Function yaml."+e+" is removed in js-yaml 4. Use yaml."+t+" instead, which is now safe by default.")}}m(AM,"renamed");var jM=r1,EM=aM.load;/*! Bundled license information:

js-yaml/dist/js-yaml.mjs:
  (*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT *)
*/var Ce={aggregation:17.25,extension:17.25,composition:17.25,dependency:6,lollipop:13.5,arrow_point:4},mm={arrow_point:9,arrow_cross:12.5,arrow_circle:12.5};function po(e,t){if(e===void 0||t===void 0)return{angle:0,deltaX:0,deltaY:0};e=Yt(e),t=Yt(t);const[r,i]=[e.x,e.y],[n,s]=[t.x,t.y],o=n-r,a=s-i;return{angle:Math.atan(a/o),deltaX:o,deltaY:a}}m(po,"calculateDeltaAndAngle");var Yt=m(e=>Array.isArray(e)?{x:e[0],y:e[1]}:e,"pointTransformer"),LM=m(e=>({x:m(function(t,r,i){let n=0;const s=Yt(i[0]).x<Yt(i[i.length-1]).x?"left":"right";if(r===0&&Object.hasOwn(Ce,e.arrowTypeStart)){const{angle:f,deltaX:g}=po(i[0],i[1]);n=Ce[e.arrowTypeStart]*Math.cos(f)*(g>=0?1:-1)}else if(r===i.length-1&&Object.hasOwn(Ce,e.arrowTypeEnd)){const{angle:f,deltaX:g}=po(i[i.length-1],i[i.length-2]);n=Ce[e.arrowTypeEnd]*Math.cos(f)*(g>=0?1:-1)}const o=Math.abs(Yt(t).x-Yt(i[i.length-1]).x),a=Math.abs(Yt(t).y-Yt(i[i.length-1]).y),l=Math.abs(Yt(t).x-Yt(i[0]).x),c=Math.abs(Yt(t).y-Yt(i[0]).y),d=Ce[e.arrowTypeStart],u=Ce[e.arrowTypeEnd],p=1;if(o<u&&o>0&&a<u){let f=u+p-o;f*=s==="right"?-1:1,n-=f}if(l<d&&l>0&&c<d){let f=d+p-l;f*=s==="right"?-1:1,n+=f}return Yt(t).x+n},"x"),y:m(function(t,r,i){let n=0;const s=Yt(i[0]).y<Yt(i[i.length-1]).y?"down":"up";if(r===0&&Object.hasOwn(Ce,e.arrowTypeStart)){const{angle:f,deltaY:g}=po(i[0],i[1]);n=Ce[e.arrowTypeStart]*Math.abs(Math.sin(f))*(g>=0?1:-1)}else if(r===i.length-1&&Object.hasOwn(Ce,e.arrowTypeEnd)){const{angle:f,deltaY:g}=po(i[i.length-1],i[i.length-2]);n=Ce[e.arrowTypeEnd]*Math.abs(Math.sin(f))*(g>=0?1:-1)}const o=Math.abs(Yt(t).y-Yt(i[i.length-1]).y),a=Math.abs(Yt(t).x-Yt(i[i.length-1]).x),l=Math.abs(Yt(t).y-Yt(i[0]).y),c=Math.abs(Yt(t).x-Yt(i[0]).x),d=Ce[e.arrowTypeStart],u=Ce[e.arrowTypeEnd],p=1;if(o<u&&o>0&&a<u){let f=u+p-o;f*=s==="up"?-1:1,n-=f}if(l<d&&l>0&&c<d){let f=d+p-l;f*=s==="up"?-1:1,n+=f}return Yt(t).y+n},"y")}),"getLineFunctionsWithOffset"),Mp=m(({flowchart:e})=>{const t=e?.subGraphTitleMargin?.top??0,r=e?.subGraphTitleMargin?.bottom??0,i=t+r;return{subGraphTitleTopMargin:t,subGraphTitleBottomMargin:r,subGraphTitleTotalMargin:i}},"getSubGraphTitleMargins"),BM=m(e=>{const{handDrawnSeed:t}=Nt();return{fill:e,hachureAngle:120,hachureGap:4,fillWeight:2,roughness:.7,stroke:e,seed:t}},"solidStateFill"),Ms=m(e=>{const t=MM([...e.cssCompiledStyles||[],...e.cssStyles||[],...e.labelStyle||[]]);return{stylesMap:t,stylesArray:[...t]}},"compileStyles"),MM=m(e=>{const t=new Map;return e.forEach(r=>{const[i,n]=r.split(":");t.set(i.trim(),n?.trim())}),t},"styles2Map"),pv=m(e=>e==="color"||e==="font-size"||e==="font-family"||e==="font-weight"||e==="font-style"||e==="text-decoration"||e==="text-align"||e==="text-transform"||e==="line-height"||e==="letter-spacing"||e==="word-spacing"||e==="text-shadow"||e==="text-overflow"||e==="white-space"||e==="word-wrap"||e==="word-break"||e==="overflow-wrap"||e==="hyphens","isLabelStyle"),at=m(e=>{const{stylesArray:t}=Ms(e),r=[],i=[],n=[],s=[];return t.forEach(o=>{const a=o[0];pv(a)?r.push(o.join(":")+" !important"):(i.push(o.join(":")+" !important"),a.includes("stroke")&&n.push(o.join(":")+" !important"),a==="fill"&&s.push(o.join(":")+" !important"))}),{labelStyles:r.join(";"),nodeStyles:i.join(";"),stylesArray:t,borderStyles:n,backgroundStyles:s}},"styles2String"),ot=m((e,t)=>{const{themeVariables:r,handDrawnSeed:i}=Nt(),{nodeBorder:n,mainBkg:s}=r,{stylesMap:o}=Ms(e);return Object.assign({roughness:.7,fill:o.get("fill")||s,fillStyle:"hachure",fillWeight:4,hachureGap:5.2,stroke:o.get("stroke")||n,seed:i,strokeWidth:o.get("stroke-width")?.replace("px","")||1.3,fillLineDash:[0,0],strokeLineDash:IM(o.get("stroke-dasharray"))},t)},"userNodeOverrides"),IM=m(e=>{if(!e)return[0,0];const t=e.trim().split(/\s+/).map(Number);if(t.length===1){const n=isNaN(t[0])?0:t[0];return[n,n]}const r=isNaN(t[0])?0:t[0],i=isNaN(t[1])?0:t[1];return[r,i]},"getStrokeDashArray"),to={},he={},xm;function OM(){return xm||(xm=1,Object.defineProperty(he,"__esModule",{value:!0}),he.BLANK_URL=he.relativeFirstCharacters=he.whitespaceEscapeCharsRegex=he.urlSchemeRegex=he.ctrlCharactersRegex=he.htmlCtrlEntityRegex=he.htmlEntitiesRegex=he.invalidProtocolRegex=void 0,he.invalidProtocolRegex=/^([^\w]*)(javascript|data|vbscript)/im,he.htmlEntitiesRegex=/&#(\w+)(^\w|;)?/g,he.htmlCtrlEntityRegex=/&(newline|tab);/gi,he.ctrlCharactersRegex=/[\u0000-\u001F\u007F-\u009F\u2000-\u200D\uFEFF]/gim,he.urlSchemeRegex=/^.+(:|&colon;)/gim,he.whitespaceEscapeCharsRegex=/(\\|%5[cC])((%(6[eE]|72|74))|[nrt])/g,he.relativeFirstCharacters=[".","/"],he.BLANK_URL="about:blank"),he}var bm;function RM(){if(bm)return to;bm=1,Object.defineProperty(to,"__esModule",{value:!0}),to.sanitizeUrl=void 0;var e=OM();function t(o){return e.relativeFirstCharacters.indexOf(o[0])>-1}function r(o){var a=o.replace(e.ctrlCharactersRegex,"");return a.replace(e.htmlEntitiesRegex,function(l,c){return String.fromCharCode(c)})}function i(o){return URL.canParse(o)}function n(o){try{return decodeURIComponent(o)}catch{return o}}function s(o){if(!o)return e.BLANK_URL;var a,l=n(o.trim());do l=r(l).replace(e.htmlCtrlEntityRegex,"").replace(e.ctrlCharactersRegex,"").replace(e.whitespaceEscapeCharsRegex,"").trim(),l=n(l),a=l.match(e.ctrlCharactersRegex)||l.match(e.htmlEntitiesRegex)||l.match(e.htmlCtrlEntityRegex)||l.match(e.whitespaceEscapeCharsRegex);while(a&&a.length>0);var c=l;if(!c)return e.BLANK_URL;if(t(c))return c;var d=c.trimStart(),u=d.match(e.urlSchemeRegex);if(!u)return c;var p=u[0].toLowerCase().trim();if(e.invalidProtocolRegex.test(p))return e.BLANK_URL;var f=d.replace(/\\/g,"/");if(p==="mailto:"||p.includes("://"))return f;if(p==="http:"||p==="https:"){if(!i(f))return e.BLANK_URL;var g=new URL(f);return g.protocol=g.protocol.toLowerCase(),g.hostname=g.hostname.toLowerCase(),g.toString()}return f}return to.sanitizeUrl=s,to}var DM=RM(),fv=typeof global=="object"&&global&&global.Object===Object&&global,FM=typeof self=="object"&&self&&self.Object===Object&&self,Qr=fv||FM||Function("return this")(),Wl=Qr.Symbol,gv=Object.prototype,PM=gv.hasOwnProperty,NM=gv.toString,eo=Wl?Wl.toStringTag:void 0;function zM(e){var t=PM.call(e,eo),r=e[eo];try{e[eo]=void 0;var i=!0}catch{}var n=NM.call(e);return i&&(t?e[eo]=r:delete e[eo]),n}var HM=Object.prototype,qM=HM.toString;function WM(e){return qM.call(e)}var VM="[object Null]",UM="[object Undefined]",ym=Wl?Wl.toStringTag:void 0;function Is(e){return e==null?e===void 0?UM:VM:ym&&ym in Object(e)?zM(e):WM(e)}function kn(e){var t=typeof e;return e!=null&&(t=="object"||t=="function")}var GM="[object AsyncFunction]",YM="[object Function]",XM="[object GeneratorFunction]",QM="[object Proxy]";function Ip(e){if(!kn(e))return!1;var t=Is(e);return t==YM||t==XM||t==GM||t==QM}var Lh=Qr["__core-js_shared__"],vm=function(){var e=/[^.]+$/.exec(Lh&&Lh.keys&&Lh.keys.IE_PROTO||"");return e?"Symbol(src)_1."+e:""}();function ZM(e){return!!vm&&vm in e}var JM=Function.prototype,KM=JM.toString;function Cn(e){if(e!=null){try{return KM.call(e)}catch{}try{return e+""}catch{}}return""}var tI=/[\\^$.*+?()[\]{}|]/g,eI=/^\[object .+?Constructor\]$/,rI=Function.prototype,iI=Object.prototype,nI=rI.toString,sI=iI.hasOwnProperty,oI=RegExp("^"+nI.call(sI).replace(tI,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$");function aI(e){if(!kn(e)||ZM(e))return!1;var t=Ip(e)?oI:eI;return t.test(Cn(e))}function lI(e,t){return e?.[t]}function Sn(e,t){var r=lI(e,t);return aI(r)?r:void 0}var Wo=Sn(Object,"create");function cI(){this.__data__=Wo?Wo(null):{},this.size=0}function hI(e){var t=this.has(e)&&delete this.__data__[e];return this.size-=t?1:0,t}var dI="__lodash_hash_undefined__",uI=Object.prototype,pI=uI.hasOwnProperty;function fI(e){var t=this.__data__;if(Wo){var r=t[e];return r===dI?void 0:r}return pI.call(t,e)?t[e]:void 0}var gI=Object.prototype,mI=gI.hasOwnProperty;function xI(e){var t=this.__data__;return Wo?t[e]!==void 0:mI.call(t,e)}var bI="__lodash_hash_undefined__";function yI(e,t){var r=this.__data__;return this.size+=this.has(e)?0:1,r[e]=Wo&&t===void 0?bI:t,this}function fn(e){var t=-1,r=e==null?0:e.length;for(this.clear();++t<r;){var i=e[t];this.set(i[0],i[1])}}fn.prototype.clear=cI;fn.prototype.delete=hI;fn.prototype.get=fI;fn.prototype.has=xI;fn.prototype.set=yI;function vI(){this.__data__=[],this.size=0}function jc(e,t){return e===t||e!==e&&t!==t}function Ec(e,t){for(var r=e.length;r--;)if(jc(e[r][0],t))return r;return-1}var wI=Array.prototype,kI=wI.splice;function CI(e){var t=this.__data__,r=Ec(t,e);if(r<0)return!1;var i=t.length-1;return r==i?t.pop():kI.call(t,r,1),--this.size,!0}function SI(e){var t=this.__data__,r=Ec(t,e);return r<0?void 0:t[r][1]}function _I(e){return Ec(this.__data__,e)>-1}function TI(e,t){var r=this.__data__,i=Ec(r,e);return i<0?(++this.size,r.push([e,t])):r[i][1]=t,this}function xi(e){var t=-1,r=e==null?0:e.length;for(this.clear();++t<r;){var i=e[t];this.set(i[0],i[1])}}xi.prototype.clear=vI;xi.prototype.delete=CI;xi.prototype.get=SI;xi.prototype.has=_I;xi.prototype.set=TI;var Vo=Sn(Qr,"Map");function $I(){this.size=0,this.__data__={hash:new fn,map:new(Vo||xi),string:new fn}}function AI(e){var t=typeof e;return t=="string"||t=="number"||t=="symbol"||t=="boolean"?e!=="__proto__":e===null}function Lc(e,t){var r=e.__data__;return AI(t)?r[typeof t=="string"?"string":"hash"]:r.map}function jI(e){var t=Lc(this,e).delete(e);return this.size-=t?1:0,t}function EI(e){return Lc(this,e).get(e)}function LI(e){return Lc(this,e).has(e)}function BI(e,t){var r=Lc(this,e),i=r.size;return r.set(e,t),this.size+=r.size==i?0:1,this}function Ri(e){var t=-1,r=e==null?0:e.length;for(this.clear();++t<r;){var i=e[t];this.set(i[0],i[1])}}Ri.prototype.clear=$I;Ri.prototype.delete=jI;Ri.prototype.get=EI;Ri.prototype.has=LI;Ri.prototype.set=BI;var MI="Expected a function";function ha(e,t){if(typeof e!="function"||t!=null&&typeof t!="function")throw new TypeError(MI);var r=function(){var i=arguments,n=t?t.apply(this,i):i[0],s=r.cache;if(s.has(n))return s.get(n);var o=e.apply(this,i);return r.cache=s.set(n,o)||s,o};return r.cache=new(ha.Cache||Ri),r}ha.Cache=Ri;function II(){this.__data__=new xi,this.size=0}function OI(e){var t=this.__data__,r=t.delete(e);return this.size=t.size,r}function RI(e){return this.__data__.get(e)}function DI(e){return this.__data__.has(e)}var FI=200;function PI(e,t){var r=this.__data__;if(r instanceof xi){var i=r.__data__;if(!Vo||i.length<FI-1)return i.push([e,t]),this.size=++r.size,this;r=this.__data__=new Ri(i)}return r.set(e,t),this.size=r.size,this}function Os(e){var t=this.__data__=new xi(e);this.size=t.size}Os.prototype.clear=II;Os.prototype.delete=OI;Os.prototype.get=RI;Os.prototype.has=DI;Os.prototype.set=PI;var Vl=function(){try{var e=Sn(Object,"defineProperty");return e({},"",{}),e}catch{}}();function Op(e,t,r){t=="__proto__"&&Vl?Vl(e,t,{configurable:!0,enumerable:!0,value:r,writable:!0}):e[t]=r}function gu(e,t,r){(r!==void 0&&!jc(e[t],r)||r===void 0&&!(t in e))&&Op(e,t,r)}function NI(e){return function(t,r,i){for(var n=-1,s=Object(t),o=i(t),a=o.length;a--;){var l=o[++n];if(r(s[l],l,s)===!1)break}return t}}var zI=NI(),mv=typeof exports=="object"&&exports&&!exports.nodeType&&exports,wm=mv&&typeof module=="object"&&module&&!module.nodeType&&module,HI=wm&&wm.exports===mv,km=HI?Qr.Buffer:void 0,Cm=km?km.allocUnsafe:void 0;function qI(e,t){if(t)return e.slice();var r=e.length,i=Cm?Cm(r):new e.constructor(r);return e.copy(i),i}var Sm=Qr.Uint8Array;function WI(e){var t=new e.constructor(e.byteLength);return new Sm(t).set(new Sm(e)),t}function VI(e,t){var r=t?WI(e.buffer):e.buffer;return new e.constructor(r,e.byteOffset,e.length)}function UI(e,t){var r=-1,i=e.length;for(t||(t=Array(i));++r<i;)t[r]=e[r];return t}var _m=Object.create,GI=function(){function e(){}return function(t){if(!kn(t))return{};if(_m)return _m(t);e.prototype=t;var r=new e;return e.prototype=void 0,r}}();function xv(e,t){return function(r){return e(t(r))}}var bv=xv(Object.getPrototypeOf,Object),YI=Object.prototype;function Bc(e){var t=e&&e.constructor,r=typeof t=="function"&&t.prototype||YI;return e===r}function XI(e){return typeof e.constructor=="function"&&!Bc(e)?GI(bv(e)):{}}function da(e){return e!=null&&typeof e=="object"}var QI="[object Arguments]";function Tm(e){return da(e)&&Is(e)==QI}var yv=Object.prototype,ZI=yv.hasOwnProperty,JI=yv.propertyIsEnumerable,Ul=Tm(function(){return arguments}())?Tm:function(e){return da(e)&&ZI.call(e,"callee")&&!JI.call(e,"callee")},Gl=Array.isArray,KI=9007199254740991;function vv(e){return typeof e=="number"&&e>-1&&e%1==0&&e<=KI}function Mc(e){return e!=null&&vv(e.length)&&!Ip(e)}function t3(e){return da(e)&&Mc(e)}function e3(){return!1}var wv=typeof exports=="object"&&exports&&!exports.nodeType&&exports,$m=wv&&typeof module=="object"&&module&&!module.nodeType&&module,r3=$m&&$m.exports===wv,Am=r3?Qr.Buffer:void 0,i3=Am?Am.isBuffer:void 0,Rp=i3||e3,n3="[object Object]",s3=Function.prototype,o3=Object.prototype,kv=s3.toString,a3=o3.hasOwnProperty,l3=kv.call(Object);function c3(e){if(!da(e)||Is(e)!=n3)return!1;var t=bv(e);if(t===null)return!0;var r=a3.call(t,"constructor")&&t.constructor;return typeof r=="function"&&r instanceof r&&kv.call(r)==l3}var h3="[object Arguments]",d3="[object Array]",u3="[object Boolean]",p3="[object Date]",f3="[object Error]",g3="[object Function]",m3="[object Map]",x3="[object Number]",b3="[object Object]",y3="[object RegExp]",v3="[object Set]",w3="[object String]",k3="[object WeakMap]",C3="[object ArrayBuffer]",S3="[object DataView]",_3="[object Float32Array]",T3="[object Float64Array]",$3="[object Int8Array]",A3="[object Int16Array]",j3="[object Int32Array]",E3="[object Uint8Array]",L3="[object Uint8ClampedArray]",B3="[object Uint16Array]",M3="[object Uint32Array]",Ut={};Ut[_3]=Ut[T3]=Ut[$3]=Ut[A3]=Ut[j3]=Ut[E3]=Ut[L3]=Ut[B3]=Ut[M3]=!0;Ut[h3]=Ut[d3]=Ut[C3]=Ut[u3]=Ut[S3]=Ut[p3]=Ut[f3]=Ut[g3]=Ut[m3]=Ut[x3]=Ut[b3]=Ut[y3]=Ut[v3]=Ut[w3]=Ut[k3]=!1;function I3(e){return da(e)&&vv(e.length)&&!!Ut[Is(e)]}function O3(e){return function(t){return e(t)}}var Cv=typeof exports=="object"&&exports&&!exports.nodeType&&exports,$o=Cv&&typeof module=="object"&&module&&!module.nodeType&&module,R3=$o&&$o.exports===Cv,Bh=R3&&fv.process,jm=function(){try{var e=$o&&$o.require&&$o.require("util").types;return e||Bh&&Bh.binding&&Bh.binding("util")}catch{}}(),Em=jm&&jm.isTypedArray,Dp=Em?O3(Em):I3;function mu(e,t){if(!(t==="constructor"&&typeof e[t]=="function")&&t!="__proto__")return e[t]}var D3=Object.prototype,F3=D3.hasOwnProperty;function P3(e,t,r){var i=e[t];(!(F3.call(e,t)&&jc(i,r))||r===void 0&&!(t in e))&&Op(e,t,r)}function N3(e,t,r,i){var n=!r;r||(r={});for(var s=-1,o=t.length;++s<o;){var a=t[s],l=void 0;l===void 0&&(l=e[a]),n?Op(r,a,l):P3(r,a,l)}return r}function z3(e,t){for(var r=-1,i=Array(e);++r<e;)i[r]=t(r);return i}var H3=9007199254740991,q3=/^(?:0|[1-9]\d*)$/;function Sv(e,t){var r=typeof e;return t=t??H3,!!t&&(r=="number"||r!="symbol"&&q3.test(e))&&e>-1&&e%1==0&&e<t}var W3=Object.prototype,V3=W3.hasOwnProperty;function U3(e,t){var r=Gl(e),i=!r&&Ul(e),n=!r&&!i&&Rp(e),s=!r&&!i&&!n&&Dp(e),o=r||i||n||s,a=o?z3(e.length,String):[],l=a.length;for(var c in e)(t||V3.call(e,c))&&!(o&&(c=="length"||n&&(c=="offset"||c=="parent")||s&&(c=="buffer"||c=="byteLength"||c=="byteOffset")||Sv(c,l)))&&a.push(c);return a}function G3(e){var t=[];if(e!=null)for(var r in Object(e))t.push(r);return t}var Y3=Object.prototype,X3=Y3.hasOwnProperty;function Q3(e){if(!kn(e))return G3(e);var t=Bc(e),r=[];for(var i in e)i=="constructor"&&(t||!X3.call(e,i))||r.push(i);return r}function _v(e){return Mc(e)?U3(e,!0):Q3(e)}function Z3(e){return N3(e,_v(e))}function J3(e,t,r,i,n,s,o){var a=mu(e,r),l=mu(t,r),c=o.get(l);if(c){gu(e,r,c);return}var d=s?s(a,l,r+"",e,t,o):void 0,u=d===void 0;if(u){var p=Gl(l),f=!p&&Rp(l),g=!p&&!f&&Dp(l);d=l,p||f||g?Gl(a)?d=a:t3(a)?d=UI(a):f?(u=!1,d=qI(l,!0)):g?(u=!1,d=VI(l,!0)):d=[]:c3(l)||Ul(l)?(d=a,Ul(a)?d=Z3(a):(!kn(a)||Ip(a))&&(d=XI(l))):u=!1}u&&(o.set(l,d),n(d,l,i,s,o),o.delete(l)),gu(e,r,d)}function Tv(e,t,r,i,n){e!==t&&zI(t,function(s,o){if(n||(n=new Os),kn(s))J3(e,t,o,r,Tv,i,n);else{var a=i?i(mu(e,o),s,o+"",e,t,n):void 0;a===void 0&&(a=s),gu(e,o,a)}},_v)}function $v(e){return e}function K3(e,t,r){switch(r.length){case 0:return e.call(t);case 1:return e.call(t,r[0]);case 2:return e.call(t,r[0],r[1]);case 3:return e.call(t,r[0],r[1],r[2])}return e.apply(t,r)}var Lm=Math.max;function tO(e,t,r){return t=Lm(t===void 0?e.length-1:t,0),function(){for(var i=arguments,n=-1,s=Lm(i.length-t,0),o=Array(s);++n<s;)o[n]=i[t+n];n=-1;for(var a=Array(t+1);++n<t;)a[n]=i[n];return a[t]=r(o),K3(e,this,a)}}function eO(e){return function(){return e}}var rO=Vl?function(e,t){return Vl(e,"toString",{configurable:!0,enumerable:!1,value:eO(t),writable:!0})}:$v,iO=800,nO=16,sO=Date.now;function oO(e){var t=0,r=0;return function(){var i=sO(),n=nO-(i-r);if(r=i,n>0){if(++t>=iO)return arguments[0]}else t=0;return e.apply(void 0,arguments)}}var aO=oO(rO);function lO(e,t){return aO(tO(e,t,$v),e+"")}function cO(e,t,r){if(!kn(r))return!1;var i=typeof t;return(i=="number"?Mc(r)&&Sv(t,r.length):i=="string"&&t in r)?jc(r[t],e):!1}function hO(e){return lO(function(t,r){var i=-1,n=r.length,s=n>1?r[n-1]:void 0,o=n>2?r[2]:void 0;for(s=e.length>3&&typeof s=="function"?(n--,s):void 0,o&&cO(r[0],r[1],o)&&(s=n<3?void 0:s,n=1),t=Object(t);++i<n;){var a=r[i];a&&e(t,a,i,s)}return t})}var dO=hO(function(e,t,r){Tv(e,t,r)}),uO="​",pO={curveBasis:ll,curveBasisClosed:gB,curveBasisOpen:mB,curveBumpX:dy,curveBumpY:uy,curveBundle:xB,curveCardinalClosed:bB,curveCardinalOpen:yB,curveCardinal:my,curveCatmullRomClosed:vB,curveCatmullRomOpen:wB,curveCatmullRom:by,curveLinear:Il,curveLinearClosed:kB,curveMonotoneX:Sy,curveMonotoneY:_y,curveNatural:$y,curveStep:Ay,curveStepAfter:Ey,curveStepBefore:jy},fO=/\s*(?:(\w+)(?=:):|(\w+))\s*(?:(\w+)|((?:(?!}%{2}).|\r?\n)*))?\s*(?:}%{2})?/gi,gO=m(function(e,t){const r=Av(e,/(?:init\b)|(?:initialize\b)/);let i={};if(Array.isArray(r)){const o=r.map(a=>a.args);Cl(o),i=de(i,[...o])}else i=r.args;if(!i)return;let n=ap(e,t);const s="config";return i[s]!==void 0&&(n==="flowchart-v2"&&(n="flowchart"),i[n]=i[s],delete i[s]),i},"detectInit"),Av=m(function(e,t=null){try{const r=new RegExp(`[%]{2}(?![{]${fO.source})(?=[}][%]{2}).*
`,"ig");e=e.trim().replace(r,"").replace(/'/gm,'"'),q.debug(`Detecting diagram directive${t!==null?" type:"+t:""} based on the text:${e}`);let i;const n=[];for(;(i=_o.exec(e))!==null;)if(i.index===_o.lastIndex&&_o.lastIndex++,i&&!t||t&&i[1]?.match(t)||t&&i[2]?.match(t)){const s=i[1]?i[1]:i[2],o=i[3]?i[3].trim():i[4]?JSON.parse(i[4].trim()):null;n.push({type:s,args:o})}return n.length===0?{type:e,args:null}:n.length===1?n[0]:n}catch(r){return q.error(`ERROR: ${r.message} - Unable to parse directive type: '${t}' based on the text: '${e}'`),{type:void 0,args:null}}},"detectDirective"),mO=m(function(e){return e.replace(_o,"")},"removeDirectives"),xO=m(function(e,t){for(const[r,i]of t.entries())if(i.match(e))return r;return-1},"isSubstringInArray");function Fp(e,t){if(!e)return t;const r=`curve${e.charAt(0).toUpperCase()+e.slice(1)}`;return pO[r]??t}m(Fp,"interpolateToCurve");function jv(e,t){const r=e.trim();if(r)return t.securityLevel!=="loose"?DM.sanitizeUrl(r):r}m(jv,"formatUrl");var bO=m((e,...t)=>{const r=e.split("."),i=r.length-1,n=r[i];let s=window;for(let o=0;o<i;o++)if(s=s[r[o]],!s){q.error(`Function name: ${e} not found in window`);return}s[n](...t)},"runFunc");function Pp(e,t){return!e||!t?0:Math.sqrt(Math.pow(t.x-e.x,2)+Math.pow(t.y-e.y,2))}m(Pp,"distance");function Ev(e){let t,r=0;e.forEach(n=>{r+=Pp(n,t),t=n});const i=r/2;return Np(e,i)}m(Ev,"traverseEdge");function Lv(e){return e.length===1?e[0]:Ev(e)}m(Lv,"calcLabelPosition");var Bm=m((e,t=2)=>{const r=Math.pow(10,t);return Math.round(e*r)/r},"roundNumber"),Np=m((e,t)=>{let r,i=t;for(const n of e){if(r){const s=Pp(n,r);if(s===0)return r;if(s<i)i-=s;else{const o=i/s;if(o<=0)return r;if(o>=1)return{x:n.x,y:n.y};if(o>0&&o<1)return{x:Bm((1-o)*r.x+o*n.x,5),y:Bm((1-o)*r.y+o*n.y,5)}}}r=n}throw new Error("Could not find a suitable point for the given distance")},"calculatePoint"),yO=m((e,t,r)=>{q.info(`our points ${JSON.stringify(t)}`),t[0]!==r&&(t=t.reverse());const n=Np(t,25),s=e?10:5,o=Math.atan2(t[0].y-n.y,t[0].x-n.x),a={x:0,y:0};return a.x=Math.sin(o)*s+(t[0].x+n.x)/2,a.y=-Math.cos(o)*s+(t[0].y+n.y)/2,a},"calcCardinalityPosition");function Bv(e,t,r){const i=structuredClone(r);q.info("our points",i),t!=="start_left"&&t!=="start_right"&&i.reverse();const n=25+e,s=Np(i,n),o=10+e*.5,a=Math.atan2(i[0].y-s.y,i[0].x-s.x),l={x:0,y:0};return t==="start_left"?(l.x=Math.sin(a+Math.PI)*o+(i[0].x+s.x)/2,l.y=-Math.cos(a+Math.PI)*o+(i[0].y+s.y)/2):t==="end_right"?(l.x=Math.sin(a-Math.PI)*o+(i[0].x+s.x)/2-5,l.y=-Math.cos(a-Math.PI)*o+(i[0].y+s.y)/2-5):t==="end_left"?(l.x=Math.sin(a)*o+(i[0].x+s.x)/2-5,l.y=-Math.cos(a)*o+(i[0].y+s.y)/2-5):(l.x=Math.sin(a)*o+(i[0].x+s.x)/2,l.y=-Math.cos(a)*o+(i[0].y+s.y)/2),l}m(Bv,"calcTerminalLabelPosition");function Mv(e){let t="",r="";for(const i of e)i!==void 0&&(i.startsWith("color:")||i.startsWith("text-align:")?r=r+i+";":t=t+i+";");return{style:t,labelStyle:r}}m(Mv,"getStylesFromArray");var Mm=0,vO=m(()=>(Mm++,"id-"+Math.random().toString(36).substr(2,12)+"-"+Mm),"generateId");function Iv(e){let t="";const r="0123456789abcdef",i=r.length;for(let n=0;n<e;n++)t+=r.charAt(Math.floor(Math.random()*i));return t}m(Iv,"makeRandomHex");var wO=m(e=>Iv(e.length),"random"),kO=m(function(){return{x:0,y:0,fill:void 0,anchor:"start",style:"#666",width:100,height:100,textMargin:0,rx:0,ry:0,valign:void 0,text:""}},"getTextObj"),CO=m(function(e,t){const r=t.text.replace(Bs.lineBreakRegex," "),[,i]=Ic(t.fontSize),n=e.append("text");n.attr("x",t.x),n.attr("y",t.y),n.style("text-anchor",t.anchor),n.style("font-family",t.fontFamily),n.style("font-size",i),n.style("font-weight",t.fontWeight),n.attr("fill",t.fill),t.class!==void 0&&n.attr("class",t.class);const s=n.append("tspan");return s.attr("x",t.x+t.textMargin*2),s.attr("fill",t.fill),s.text(r),n},"drawSimpleText"),SO=ha((e,t,r)=>{if(!e||(r=Object.assign({fontSize:12,fontWeight:400,fontFamily:"Arial",joinWith:"<br/>"},r),Bs.lineBreakRegex.test(e)))return e;const i=e.split(" ").filter(Boolean),n=[];let s="";return i.forEach((o,a)=>{const l=di(`${o} `,r),c=di(s,r);if(l>t){const{hyphenatedStrings:p,remainingWord:f}=_O(o,t,"-",r);n.push(s,...p),s=f}else c+l>=t?(n.push(s),s=o):s=[s,o].filter(Boolean).join(" ");a+1===i.length&&n.push(s)}),n.filter(o=>o!=="").join(r.joinWith)},(e,t,r)=>`${e}${t}${r.fontSize}${r.fontWeight}${r.fontFamily}${r.joinWith}`),_O=ha((e,t,r="-",i)=>{i=Object.assign({fontSize:12,fontWeight:400,fontFamily:"Arial",margin:0},i);const n=[...e],s=[];let o="";return n.forEach((a,l)=>{const c=`${o}${a}`;if(di(c,i)>=t){const u=l+1,p=n.length===u,f=`${c}${r}`;s.push(p?c:f),o=""}else o=c}),{hyphenatedStrings:s,remainingWord:o}},(e,t,r="-",i)=>`${e}${t}${r}${i.fontSize}${i.fontWeight}${i.fontFamily}`);function Ov(e,t){return zp(e,t).height}m(Ov,"calculateTextHeight");function di(e,t){return zp(e,t).width}m(di,"calculateTextWidth");var zp=ha((e,t)=>{const{fontSize:r=12,fontFamily:i="Arial",fontWeight:n=400}=t;if(!e)return{width:0,height:0};const[,s]=Ic(r),o=["sans-serif",i],a=e.split(Bs.lineBreakRegex),l=[],c=Lt("body");if(!c.remove)return{width:0,height:0,lineHeight:0};const d=c.append("svg");for(const p of o){let f=0;const g={width:0,height:0,lineHeight:0};for(const x of a){const v=kO();v.text=x||uO;const y=CO(d,v).style("font-size",s).style("font-weight",n).style("font-family",p),b=(y._groups||y)[0][0].getBBox();if(b.width===0&&b.height===0)throw new Error("svg element not in render tree");g.width=Math.round(Math.max(g.width,b.width)),f=Math.round(b.height),g.height+=f,g.lineHeight=Math.round(Math.max(g.lineHeight,f))}l.push(g)}d.remove();const u=isNaN(l[1].height)||isNaN(l[1].width)||isNaN(l[1].lineHeight)||l[0].height>l[1].height&&l[0].width>l[1].width&&l[0].lineHeight>l[1].lineHeight?0:1;return l[u]},(e,t)=>`${e}${t.fontSize}${t.fontWeight}${t.fontFamily}`),as,TO=(as=class{constructor(t=!1,r){this.count=0,this.count=r?r.length:0,this.next=t?()=>this.count++:()=>Date.now()}},m(as,"InitIDGenerator"),as),Ia,$O=m(function(e){return Ia=Ia||document.createElement("div"),e=escape(e).replace(/%26/g,"&").replace(/%23/g,"#").replace(/%3B/g,";"),Ia.innerHTML=e,unescape(Ia.textContent)},"entityDecode");function Hp(e){return"str"in e}m(Hp,"isDetailedError");var AO=m((e,t,r,i)=>{if(!i)return;const n=e.node()?.getBBox();n&&e.append("text").text(i).attr("text-anchor","middle").attr("x",n.x+n.width/2).attr("y",-r).attr("class",t)},"insertTitle"),Ic=m(e=>{if(typeof e=="number")return[e,e+"px"];const t=parseInt(e??"",10);return Number.isNaN(t)?[void 0,void 0]:e===String(t)?[t,e+"px"]:[t,e]},"parseFontSize");function qp(e,t){return dO({},e,t)}m(qp,"cleanAndMerge");var jr={assignWithDepth:de,wrapLabel:SO,calculateTextHeight:Ov,calculateTextWidth:di,calculateTextDimensions:zp,cleanAndMerge:qp,detectInit:gO,detectDirective:Av,isSubstringInArray:xO,interpolateToCurve:Fp,calcLabelPosition:Lv,calcCardinalityPosition:yO,calcTerminalLabelPosition:Bv,formatUrl:jv,getStylesFromArray:Mv,generateId:vO,random:wO,runFunc:bO,entityDecode:$O,insertTitle:AO,isLabelCoordinateInPath:Rv,parseFontSize:Ic,InitIDGenerator:TO},jO=m(function(e){let t=e;return t=t.replace(/style.*:\S*#.*;/g,function(r){return r.substring(0,r.length-1)}),t=t.replace(/classDef.*:\S*#.*;/g,function(r){return r.substring(0,r.length-1)}),t=t.replace(/#\w+;/g,function(r){const i=r.substring(1,r.length-1);return/^\+?\d+$/.test(i)?"ﬂ°°"+i+"¶ß":"ﬂ°"+i+"¶ß"}),t},"encodeEntities"),_n=m(function(e){return e.replace(/ﬂ°°/g,"&#").replace(/ﬂ°/g,"&").replace(/¶ß/g,";")},"decodeEntities"),L7=m((e,t,{counter:r=0,prefix:i,suffix:n},s)=>s||`${i?`${i}_`:""}${e}_${t}_${r}${n?`_${n}`:""}`,"getEdgeId");function Ae(e){return e??null}m(Ae,"handleUndefinedAttr");function Rv(e,t){const r=Math.round(e.x),i=Math.round(e.y),n=t.replace(/(\d+\.\d+)/g,s=>Math.round(parseFloat(s)).toString());return n.includes(r.toString())||n.includes(i.toString())}m(Rv,"isLabelCoordinateInPath");const EO=Object.freeze({left:0,top:0,width:16,height:16}),Yl=Object.freeze({rotate:0,vFlip:!1,hFlip:!1}),Dv=Object.freeze({...EO,...Yl}),LO=Object.freeze({...Dv,body:"",hidden:!1}),BO=Object.freeze({width:null,height:null}),MO=Object.freeze({...BO,...Yl}),IO=(e,t,r,i="")=>{const n=e.split(":");if(e.slice(0,1)==="@"){if(n.length<2||n.length>3)return null;i=n.shift().slice(1)}if(n.length>3||!n.length)return null;if(n.length>1){const a=n.pop(),l=n.pop(),c={provider:n.length>0?n[0]:i,prefix:l,name:a};return Mh(c)?c:null}const s=n[0],o=s.split("-");if(o.length>1){const a={provider:i,prefix:o.shift(),name:o.join("-")};return Mh(a)?a:null}if(r&&i===""){const a={provider:i,prefix:"",name:s};return Mh(a,r)?a:null}return null},Mh=(e,t)=>e?!!((t&&e.prefix===""||e.prefix)&&e.name):!1;function OO(e,t){const r={};!e.hFlip!=!t.hFlip&&(r.hFlip=!0),!e.vFlip!=!t.vFlip&&(r.vFlip=!0);const i=((e.rotate||0)+(t.rotate||0))%4;return i&&(r.rotate=i),r}function Im(e,t){const r=OO(e,t);for(const i in LO)i in Yl?i in e&&!(i in r)&&(r[i]=Yl[i]):i in t?r[i]=t[i]:i in e&&(r[i]=e[i]);return r}function RO(e,t){const r=e.icons,i=e.aliases||Object.create(null),n=Object.create(null);function s(o){if(r[o])return n[o]=[];if(!(o in n)){n[o]=null;const a=i[o]&&i[o].parent,l=a&&s(a);l&&(n[o]=[a].concat(l))}return n[o]}return(t||Object.keys(r).concat(Object.keys(i))).forEach(s),n}function Om(e,t,r){const i=e.icons,n=e.aliases||Object.create(null);let s={};function o(a){s=Im(i[a]||n[a],s)}return o(t),r.forEach(o),Im(e,s)}function DO(e,t){if(e.icons[t])return Om(e,t,[]);const r=RO(e,[t])[t];return r?Om(e,t,r):null}const FO=/(-?[0-9.]*[0-9]+[0-9.]*)/g,PO=/^-?[0-9.]*[0-9]+[0-9.]*$/g;function Rm(e,t,r){if(t===1)return e;if(r=r||100,typeof e=="number")return Math.ceil(e*t*r)/r;if(typeof e!="string")return e;const i=e.split(FO);if(i===null||!i.length)return e;const n=[];let s=i.shift(),o=PO.test(s);for(;;){if(o){const a=parseFloat(s);isNaN(a)?n.push(s):n.push(Math.ceil(a*t*r)/r)}else n.push(s);if(s=i.shift(),s===void 0)return n.join("");o=!o}}function NO(e,t="defs"){let r="";const i=e.indexOf("<"+t);for(;i>=0;){const n=e.indexOf(">",i),s=e.indexOf("</"+t);if(n===-1||s===-1)break;const o=e.indexOf(">",s);if(o===-1)break;r+=e.slice(n+1,s).trim(),e=e.slice(0,i).trim()+e.slice(o+1)}return{defs:r,content:e}}function zO(e,t){return e?"<defs>"+e+"</defs>"+t:t}function HO(e,t,r){const i=NO(e);return zO(i.defs,t+i.content+r)}const qO=e=>e==="unset"||e==="undefined"||e==="none";function WO(e,t){const r={...Dv,...e},i={...MO,...t},n={left:r.left,top:r.top,width:r.width,height:r.height};let s=r.body;[r,i].forEach(x=>{const v=[],y=x.hFlip,b=x.vFlip;let w=x.rotate;y?b?w+=2:(v.push("translate("+(n.width+n.left).toString()+" "+(0-n.top).toString()+")"),v.push("scale(-1 1)"),n.top=n.left=0):b&&(v.push("translate("+(0-n.left).toString()+" "+(n.height+n.top).toString()+")"),v.push("scale(1 -1)"),n.top=n.left=0);let S;switch(w<0&&(w-=Math.floor(w/4)*4),w=w%4,w){case 1:S=n.height/2+n.top,v.unshift("rotate(90 "+S.toString()+" "+S.toString()+")");break;case 2:v.unshift("rotate(180 "+(n.width/2+n.left).toString()+" "+(n.height/2+n.top).toString()+")");break;case 3:S=n.width/2+n.left,v.unshift("rotate(-90 "+S.toString()+" "+S.toString()+")");break}w%2===1&&(n.left!==n.top&&(S=n.left,n.left=n.top,n.top=S),n.width!==n.height&&(S=n.width,n.width=n.height,n.height=S)),v.length&&(s=HO(s,'<g transform="'+v.join(" ")+'">',"</g>"))});const o=i.width,a=i.height,l=n.width,c=n.height;let d,u;o===null?(u=a===null?"1em":a==="auto"?c:a,d=Rm(u,l/c)):(d=o==="auto"?l:o,u=a===null?Rm(d,c/l):a==="auto"?c:a);const p={},f=(x,v)=>{qO(v)||(p[x]=v.toString())};f("width",d),f("height",u);const g=[n.left,n.top,l,c];return p.viewBox=g.join(" "),{attributes:p,viewBox:g,body:s}}const VO=/\sid="(\S+)"/g,Dm=new Map;function UO(e){e=e.replace(/[0-9]+$/,"")||"a";const t=Dm.get(e)||0;return Dm.set(e,t+1),t?`${e}${t}`:e}function GO(e){const t=[];let r;for(;r=VO.exec(e);)t.push(r[1]);if(!t.length)return e;const i="suffix"+(Math.random()*16777216|Date.now()).toString(16);return t.forEach(n=>{const s=UO(n),o=n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");e=e.replace(new RegExp('([#;"])('+o+')([")]|\\.[a-z])',"g"),"$1"+s+i+"$3")}),e=e.replace(new RegExp(i,"g"),""),e}function YO(e,t){let r=e.indexOf("xlink:")===-1?"":' xmlns:xlink="http://www.w3.org/1999/xlink"';for(const i in t)r+=" "+i+'="'+t[i]+'"';return'<svg xmlns="http://www.w3.org/2000/svg"'+r+">"+e+"</svg>"}function Wp(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var Tn=Wp();function Fv(e){Tn=e}var Ao={exec:()=>null};function Ot(e,t=""){let r=typeof e=="string"?e:e.source,i={replace:(n,s)=>{let o=typeof s=="string"?s:s.source;return o=o.replace(Ne.caret,"$1"),r=r.replace(n,o),i},getRegex:()=>new RegExp(r,t)};return i}var XO=(()=>{try{return!!new RegExp("(?<=1)(?<!1)")}catch{return!1}})(),Ne={codeRemoveIndent:/^(?: {1,4}| {0,3}\t)/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+) *)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,listReplaceTabs:/^\t+/,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\] /,listReplaceTask:/^\[[ xX]\] +/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,unescapeTest:/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:e=>new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`),hrRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`),fencesBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}(?:\`\`\`|~~~)`),headingBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}#`),htmlBeginRegex:e=>new RegExp(`^ {0,${Math.min(3,e-1)}}<(?:[a-z].*>|!--)`,"i")},QO=/^(?:[ \t]*(?:\n|$))+/,ZO=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,JO=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,ua=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,KO=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,Vp=/(?:[*+-]|\d{1,9}[.)])/,Pv=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,Nv=Ot(Pv).replace(/bull/g,Vp).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),tR=Ot(Pv).replace(/bull/g,Vp).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),Up=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,eR=/^[^\n]+/,Gp=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,rR=Ot(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",Gp).replace("title",/(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(),iR=Ot(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g,Vp).getRegex(),Oc="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",Yp=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,nR=Ot("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",Yp).replace("tag",Oc).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),zv=Ot(Up).replace("hr",ua).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Oc).getRegex(),sR=Ot(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph",zv).getRegex(),Xp={blockquote:sR,code:ZO,def:rR,fences:JO,heading:KO,hr:ua,html:nR,lheading:Nv,list:iR,newline:QO,paragraph:zv,table:Ao,text:eR},Fm=Ot("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",ua).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Oc).getRegex(),oR={...Xp,lheading:tR,table:Fm,paragraph:Ot(Up).replace("hr",ua).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",Fm).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list"," {0,3}(?:[*+-]|1[.)]) ").replace("html","</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag",Oc).getRegex()},aR={...Xp,html:Ot(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment",Yp).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:Ao,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:Ot(Up).replace("hr",ua).replace("heading",` *#{1,6} *[^
]`).replace("lheading",Nv).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},lR=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,cR=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,Hv=/^( {2,}|\\)\n(?!\s*$)/,hR=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,Rc=/[\p{P}\p{S}]/u,Qp=/[\s\p{P}\p{S}]/u,qv=/[^\s\p{P}\p{S}]/u,dR=Ot(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,Qp).getRegex(),Wv=/(?!~)[\p{P}\p{S}]/u,uR=/(?!~)[\s\p{P}\p{S}]/u,pR=/(?:[^\s\p{P}\p{S}]|~)/u,fR=Ot(/link|precode-code|html/,"g").replace("link",/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-",XO?"(?<!`)()":"(^^|[^`])").replace("code",/(?<b>`+)[^`]+\k<b>(?!`)/).replace("html",/<(?! )[^<>]*?>/).getRegex(),Vv=/^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,gR=Ot(Vv,"u").replace(/punct/g,Rc).getRegex(),mR=Ot(Vv,"u").replace(/punct/g,Wv).getRegex(),Uv="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",xR=Ot(Uv,"gu").replace(/notPunctSpace/g,qv).replace(/punctSpace/g,Qp).replace(/punct/g,Rc).getRegex(),bR=Ot(Uv,"gu").replace(/notPunctSpace/g,pR).replace(/punctSpace/g,uR).replace(/punct/g,Wv).getRegex(),yR=Ot("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,qv).replace(/punctSpace/g,Qp).replace(/punct/g,Rc).getRegex(),vR=Ot(/\\(punct)/,"gu").replace(/punct/g,Rc).getRegex(),wR=Ot(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),kR=Ot(Yp).replace("(?:-->|$)","-->").getRegex(),CR=Ot("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",kR).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),Xl=/(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/,SR=Ot(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label",Xl).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title",/"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(),Gv=Ot(/^!?\[(label)\]\[(ref)\]/).replace("label",Xl).replace("ref",Gp).getRegex(),Yv=Ot(/^!?\[(ref)\](?:\[\])?/).replace("ref",Gp).getRegex(),_R=Ot("reflink|nolink(?!\\()","g").replace("reflink",Gv).replace("nolink",Yv).getRegex(),Pm=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,Zp={_backpedal:Ao,anyPunctuation:vR,autolink:wR,blockSkip:fR,br:Hv,code:cR,del:Ao,emStrongLDelim:gR,emStrongRDelimAst:xR,emStrongRDelimUnd:yR,escape:lR,link:SR,nolink:Yv,punctuation:dR,reflink:Gv,reflinkSearch:_R,tag:CR,text:hR,url:Ao},TR={...Zp,link:Ot(/^!?\[(label)\]\((.*?)\)/).replace("label",Xl).getRegex(),reflink:Ot(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",Xl).getRegex()},xu={...Zp,emStrongRDelimAst:bR,emStrongLDelim:mR,url:Ot(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol",Pm).replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:Ot(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol",Pm).getRegex()},$R={...xu,br:Ot(Hv).replace("{2,}","*").getRegex(),text:Ot(xu.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},Oa={normal:Xp,gfm:oR,pedantic:aR},ro={normal:Zp,gfm:xu,breaks:$R,pedantic:TR},AR={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},Nm=e=>AR[e];function Hr(e,t){if(t){if(Ne.escapeTest.test(e))return e.replace(Ne.escapeReplace,Nm)}else if(Ne.escapeTestNoEncode.test(e))return e.replace(Ne.escapeReplaceNoEncode,Nm);return e}function zm(e){try{e=encodeURI(e).replace(Ne.percentDecode,"%")}catch{return null}return e}function Hm(e,t){let r=e.replace(Ne.findPipe,(s,o,a)=>{let l=!1,c=o;for(;--c>=0&&a[c]==="\\";)l=!l;return l?"|":" |"}),i=r.split(Ne.splitPipe),n=0;if(i[0].trim()||i.shift(),i.length>0&&!i.at(-1)?.trim()&&i.pop(),t)if(i.length>t)i.splice(t);else for(;i.length<t;)i.push("");for(;n<i.length;n++)i[n]=i[n].trim().replace(Ne.slashPipe,"|");return i}function io(e,t,r){let i=e.length;if(i===0)return"";let n=0;for(;n<i;){let s=e.charAt(i-n-1);if(s===t&&!r)n++;else if(s!==t&&r)n++;else break}return e.slice(0,i-n)}function jR(e,t){if(e.indexOf(t[1])===-1)return-1;let r=0;for(let i=0;i<e.length;i++)if(e[i]==="\\")i++;else if(e[i]===t[0])r++;else if(e[i]===t[1]&&(r--,r<0))return i;return r>0?-2:-1}function qm(e,t,r,i,n){let s=t.href,o=t.title||null,a=e[1].replace(n.other.outputLinkReplace,"$1");i.state.inLink=!0;let l={type:e[0].charAt(0)==="!"?"image":"link",raw:r,href:s,title:o,text:a,tokens:i.inlineTokens(a)};return i.state.inLink=!1,l}function ER(e,t,r){let i=e.match(r.other.indentCodeCompensation);if(i===null)return t;let n=i[1];return t.split(`
`).map(s=>{let o=s.match(r.other.beginningSpace);if(o===null)return s;let[a]=o;return a.length>=n.length?s.slice(n.length):s}).join(`
`)}var Ql=class{constructor(t){qt(this,"options");qt(this,"rules");qt(this,"lexer");this.options=t||Tn}space(t){let r=this.rules.block.newline.exec(t);if(r&&r[0].length>0)return{type:"space",raw:r[0]}}code(t){let r=this.rules.block.code.exec(t);if(r){let i=r[0].replace(this.rules.other.codeRemoveIndent,"");return{type:"code",raw:r[0],codeBlockStyle:"indented",text:this.options.pedantic?i:io(i,`
`)}}}fences(t){let r=this.rules.block.fences.exec(t);if(r){let i=r[0],n=ER(i,r[3]||"",this.rules);return{type:"code",raw:i,lang:r[2]?r[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):r[2],text:n}}}heading(t){let r=this.rules.block.heading.exec(t);if(r){let i=r[2].trim();if(this.rules.other.endingHash.test(i)){let n=io(i,"#");(this.options.pedantic||!n||this.rules.other.endingSpaceChar.test(n))&&(i=n.trim())}return{type:"heading",raw:r[0],depth:r[1].length,text:i,tokens:this.lexer.inline(i)}}}hr(t){let r=this.rules.block.hr.exec(t);if(r)return{type:"hr",raw:io(r[0],`
`)}}blockquote(t){let r=this.rules.block.blockquote.exec(t);if(r){let i=io(r[0],`
`).split(`
`),n="",s="",o=[];for(;i.length>0;){let a=!1,l=[],c;for(c=0;c<i.length;c++)if(this.rules.other.blockquoteStart.test(i[c]))l.push(i[c]),a=!0;else if(!a)l.push(i[c]);else break;i=i.slice(c);let d=l.join(`
`),u=d.replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");n=n?`${n}
${d}`:d,s=s?`${s}
${u}`:u;let p=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(u,o,!0),this.lexer.state.top=p,i.length===0)break;let f=o.at(-1);if(f?.type==="code")break;if(f?.type==="blockquote"){let g=f,x=g.raw+`
`+i.join(`
`),v=this.blockquote(x);o[o.length-1]=v,n=n.substring(0,n.length-g.raw.length)+v.raw,s=s.substring(0,s.length-g.text.length)+v.text;break}else if(f?.type==="list"){let g=f,x=g.raw+`
`+i.join(`
`),v=this.list(x);o[o.length-1]=v,n=n.substring(0,n.length-f.raw.length)+v.raw,s=s.substring(0,s.length-g.raw.length)+v.raw,i=x.substring(o.at(-1).raw.length).split(`
`);continue}}return{type:"blockquote",raw:n,tokens:o,text:s}}}list(t){let r=this.rules.block.list.exec(t);if(r){let i=r[1].trim(),n=i.length>1,s={type:"list",raw:"",ordered:n,start:n?+i.slice(0,-1):"",loose:!1,items:[]};i=n?`\\d{1,9}\\${i.slice(-1)}`:`\\${i}`,this.options.pedantic&&(i=n?i:"[*+-]");let o=this.rules.other.listItemRegex(i),a=!1;for(;t;){let c=!1,d="",u="";if(!(r=o.exec(t))||this.rules.block.hr.test(t))break;d=r[0],t=t.substring(d.length);let p=r[2].split(`
`,1)[0].replace(this.rules.other.listReplaceTabs,b=>" ".repeat(3*b.length)),f=t.split(`
`,1)[0],g=!p.trim(),x=0;if(this.options.pedantic?(x=2,u=p.trimStart()):g?x=r[1].length+1:(x=r[2].search(this.rules.other.nonSpaceChar),x=x>4?1:x,u=p.slice(x),x+=r[1].length),g&&this.rules.other.blankLine.test(f)&&(d+=f+`
`,t=t.substring(f.length+1),c=!0),!c){let b=this.rules.other.nextBulletRegex(x),w=this.rules.other.hrRegex(x),S=this.rules.other.fencesBeginRegex(x),_=this.rules.other.headingBeginRegex(x),A=this.rules.other.htmlBeginRegex(x);for(;t;){let C=t.split(`
`,1)[0],E;if(f=C,this.options.pedantic?(f=f.replace(this.rules.other.listReplaceNesting,"  "),E=f):E=f.replace(this.rules.other.tabCharGlobal,"    "),S.test(f)||_.test(f)||A.test(f)||b.test(f)||w.test(f))break;if(E.search(this.rules.other.nonSpaceChar)>=x||!f.trim())u+=`
`+E.slice(x);else{if(g||p.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||S.test(p)||_.test(p)||w.test(p))break;u+=`
`+f}!g&&!f.trim()&&(g=!0),d+=C+`
`,t=t.substring(C.length+1),p=E.slice(x)}}s.loose||(a?s.loose=!0:this.rules.other.doubleBlankLine.test(d)&&(a=!0));let v=null,y;this.options.gfm&&(v=this.rules.other.listIsTask.exec(u),v&&(y=v[0]!=="[ ] ",u=u.replace(this.rules.other.listReplaceTask,""))),s.items.push({type:"list_item",raw:d,task:!!v,checked:y,loose:!1,text:u,tokens:[]}),s.raw+=d}let l=s.items.at(-1);if(l)l.raw=l.raw.trimEnd(),l.text=l.text.trimEnd();else return;s.raw=s.raw.trimEnd();for(let c=0;c<s.items.length;c++)if(this.lexer.state.top=!1,s.items[c].tokens=this.lexer.blockTokens(s.items[c].text,[]),!s.loose){let d=s.items[c].tokens.filter(p=>p.type==="space"),u=d.length>0&&d.some(p=>this.rules.other.anyLine.test(p.raw));s.loose=u}if(s.loose)for(let c=0;c<s.items.length;c++)s.items[c].loose=!0;return s}}html(t){let r=this.rules.block.html.exec(t);if(r)return{type:"html",block:!0,raw:r[0],pre:r[1]==="pre"||r[1]==="script"||r[1]==="style",text:r[0]}}def(t){let r=this.rules.block.def.exec(t);if(r){let i=r[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal," "),n=r[2]?r[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",s=r[3]?r[3].substring(1,r[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):r[3];return{type:"def",tag:i,raw:r[0],href:n,title:s}}}table(t){let r=this.rules.block.table.exec(t);if(!r||!this.rules.other.tableDelimiter.test(r[2]))return;let i=Hm(r[1]),n=r[2].replace(this.rules.other.tableAlignChars,"").split("|"),s=r[3]?.trim()?r[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],o={type:"table",raw:r[0],header:[],align:[],rows:[]};if(i.length===n.length){for(let a of n)this.rules.other.tableAlignRight.test(a)?o.align.push("right"):this.rules.other.tableAlignCenter.test(a)?o.align.push("center"):this.rules.other.tableAlignLeft.test(a)?o.align.push("left"):o.align.push(null);for(let a=0;a<i.length;a++)o.header.push({text:i[a],tokens:this.lexer.inline(i[a]),header:!0,align:o.align[a]});for(let a of s)o.rows.push(Hm(a,o.header.length).map((l,c)=>({text:l,tokens:this.lexer.inline(l),header:!1,align:o.align[c]})));return o}}lheading(t){let r=this.rules.block.lheading.exec(t);if(r)return{type:"heading",raw:r[0],depth:r[2].charAt(0)==="="?1:2,text:r[1],tokens:this.lexer.inline(r[1])}}paragraph(t){let r=this.rules.block.paragraph.exec(t);if(r){let i=r[1].charAt(r[1].length-1)===`
`?r[1].slice(0,-1):r[1];return{type:"paragraph",raw:r[0],text:i,tokens:this.lexer.inline(i)}}}text(t){let r=this.rules.block.text.exec(t);if(r)return{type:"text",raw:r[0],text:r[0],tokens:this.lexer.inline(r[0])}}escape(t){let r=this.rules.inline.escape.exec(t);if(r)return{type:"escape",raw:r[0],text:r[1]}}tag(t){let r=this.rules.inline.tag.exec(t);if(r)return!this.lexer.state.inLink&&this.rules.other.startATag.test(r[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(r[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(r[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(r[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:r[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:r[0]}}link(t){let r=this.rules.inline.link.exec(t);if(r){let i=r[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(i)){if(!this.rules.other.endAngleBracket.test(i))return;let o=io(i.slice(0,-1),"\\");if((i.length-o.length)%2===0)return}else{let o=jR(r[2],"()");if(o===-2)return;if(o>-1){let a=(r[0].indexOf("!")===0?5:4)+r[1].length+o;r[2]=r[2].substring(0,o),r[0]=r[0].substring(0,a).trim(),r[3]=""}}let n=r[2],s="";if(this.options.pedantic){let o=this.rules.other.pedanticHrefTitle.exec(n);o&&(n=o[1],s=o[3])}else s=r[3]?r[3].slice(1,-1):"";return n=n.trim(),this.rules.other.startAngleBracket.test(n)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(i)?n=n.slice(1):n=n.slice(1,-1)),qm(r,{href:n&&n.replace(this.rules.inline.anyPunctuation,"$1"),title:s&&s.replace(this.rules.inline.anyPunctuation,"$1")},r[0],this.lexer,this.rules)}}reflink(t,r){let i;if((i=this.rules.inline.reflink.exec(t))||(i=this.rules.inline.nolink.exec(t))){let n=(i[2]||i[1]).replace(this.rules.other.multipleSpaceGlobal," "),s=r[n.toLowerCase()];if(!s){let o=i[0].charAt(0);return{type:"text",raw:o,text:o}}return qm(i,s,i[0],this.lexer,this.rules)}}emStrong(t,r,i=""){let n=this.rules.inline.emStrongLDelim.exec(t);if(!(!n||n[3]&&i.match(this.rules.other.unicodeAlphaNumeric))&&(!(n[1]||n[2])||!i||this.rules.inline.punctuation.exec(i))){let s=[...n[0]].length-1,o,a,l=s,c=0,d=n[0][0]==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd;for(d.lastIndex=0,r=r.slice(-1*t.length+s);(n=d.exec(r))!=null;){if(o=n[1]||n[2]||n[3]||n[4]||n[5]||n[6],!o)continue;if(a=[...o].length,n[3]||n[4]){l+=a;continue}else if((n[5]||n[6])&&s%3&&!((s+a)%3)){c+=a;continue}if(l-=a,l>0)continue;a=Math.min(a,a+l+c);let u=[...n[0]][0].length,p=t.slice(0,s+n.index+u+a);if(Math.min(s,a)%2){let g=p.slice(1,-1);return{type:"em",raw:p,text:g,tokens:this.lexer.inlineTokens(g)}}let f=p.slice(2,-2);return{type:"strong",raw:p,text:f,tokens:this.lexer.inlineTokens(f)}}}}codespan(t){let r=this.rules.inline.code.exec(t);if(r){let i=r[2].replace(this.rules.other.newLineCharGlobal," "),n=this.rules.other.nonSpaceChar.test(i),s=this.rules.other.startingSpaceChar.test(i)&&this.rules.other.endingSpaceChar.test(i);return n&&s&&(i=i.substring(1,i.length-1)),{type:"codespan",raw:r[0],text:i}}}br(t){let r=this.rules.inline.br.exec(t);if(r)return{type:"br",raw:r[0]}}del(t){let r=this.rules.inline.del.exec(t);if(r)return{type:"del",raw:r[0],text:r[2],tokens:this.lexer.inlineTokens(r[2])}}autolink(t){let r=this.rules.inline.autolink.exec(t);if(r){let i,n;return r[2]==="@"?(i=r[1],n="mailto:"+i):(i=r[1],n=i),{type:"link",raw:r[0],text:i,href:n,tokens:[{type:"text",raw:i,text:i}]}}}url(t){let r;if(r=this.rules.inline.url.exec(t)){let i,n;if(r[2]==="@")i=r[0],n="mailto:"+i;else{let s;do s=r[0],r[0]=this.rules.inline._backpedal.exec(r[0])?.[0]??"";while(s!==r[0]);i=r[0],r[1]==="www."?n="http://"+r[0]:n=r[0]}return{type:"link",raw:r[0],text:i,href:n,tokens:[{type:"text",raw:i,text:i}]}}}inlineText(t){let r=this.rules.inline.text.exec(t);if(r){let i=this.lexer.state.inRawBlock;return{type:"text",raw:r[0],text:r[0],escaped:i}}}},_r=class bu{constructor(t){qt(this,"tokens");qt(this,"options");qt(this,"state");qt(this,"tokenizer");qt(this,"inlineQueue");this.tokens=[],this.tokens.links=Object.create(null),this.options=t||Tn,this.options.tokenizer=this.options.tokenizer||new Ql,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,top:!0};let r={other:Ne,block:Oa.normal,inline:ro.normal};this.options.pedantic?(r.block=Oa.pedantic,r.inline=ro.pedantic):this.options.gfm&&(r.block=Oa.gfm,this.options.breaks?r.inline=ro.breaks:r.inline=ro.gfm),this.tokenizer.rules=r}static get rules(){return{block:Oa,inline:ro}}static lex(t,r){return new bu(r).lex(t)}static lexInline(t,r){return new bu(r).inlineTokens(t)}lex(t){t=t.replace(Ne.carriageReturn,`
`),this.blockTokens(t,this.tokens);for(let r=0;r<this.inlineQueue.length;r++){let i=this.inlineQueue[r];this.inlineTokens(i.src,i.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(t,r=[],i=!1){for(this.options.pedantic&&(t=t.replace(Ne.tabCharGlobal,"    ").replace(Ne.spaceLine,""));t;){let n;if(this.options.extensions?.block?.some(o=>(n=o.call({lexer:this},t,r))?(t=t.substring(n.raw.length),r.push(n),!0):!1))continue;if(n=this.tokenizer.space(t)){t=t.substring(n.raw.length);let o=r.at(-1);n.raw.length===1&&o!==void 0?o.raw+=`
`:r.push(n);continue}if(n=this.tokenizer.code(t)){t=t.substring(n.raw.length);let o=r.at(-1);o?.type==="paragraph"||o?.type==="text"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+n.raw,o.text+=`
`+n.text,this.inlineQueue.at(-1).src=o.text):r.push(n);continue}if(n=this.tokenizer.fences(t)){t=t.substring(n.raw.length),r.push(n);continue}if(n=this.tokenizer.heading(t)){t=t.substring(n.raw.length),r.push(n);continue}if(n=this.tokenizer.hr(t)){t=t.substring(n.raw.length),r.push(n);continue}if(n=this.tokenizer.blockquote(t)){t=t.substring(n.raw.length),r.push(n);continue}if(n=this.tokenizer.list(t)){t=t.substring(n.raw.length),r.push(n);continue}if(n=this.tokenizer.html(t)){t=t.substring(n.raw.length),r.push(n);continue}if(n=this.tokenizer.def(t)){t=t.substring(n.raw.length);let o=r.at(-1);o?.type==="paragraph"||o?.type==="text"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+n.raw,o.text+=`
`+n.raw,this.inlineQueue.at(-1).src=o.text):this.tokens.links[n.tag]||(this.tokens.links[n.tag]={href:n.href,title:n.title},r.push(n));continue}if(n=this.tokenizer.table(t)){t=t.substring(n.raw.length),r.push(n);continue}if(n=this.tokenizer.lheading(t)){t=t.substring(n.raw.length),r.push(n);continue}let s=t;if(this.options.extensions?.startBlock){let o=1/0,a=t.slice(1),l;this.options.extensions.startBlock.forEach(c=>{l=c.call({lexer:this},a),typeof l=="number"&&l>=0&&(o=Math.min(o,l))}),o<1/0&&o>=0&&(s=t.substring(0,o+1))}if(this.state.top&&(n=this.tokenizer.paragraph(s))){let o=r.at(-1);i&&o?.type==="paragraph"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+n.raw,o.text+=`
`+n.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=o.text):r.push(n),i=s.length!==t.length,t=t.substring(n.raw.length);continue}if(n=this.tokenizer.text(t)){t=t.substring(n.raw.length);let o=r.at(-1);o?.type==="text"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+n.raw,o.text+=`
`+n.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=o.text):r.push(n);continue}if(t){let o="Infinite loop on byte: "+t.charCodeAt(0);if(this.options.silent){console.error(o);break}else throw new Error(o)}}return this.state.top=!0,r}inline(t,r=[]){return this.inlineQueue.push({src:t,tokens:r}),r}inlineTokens(t,r=[]){let i=t,n=null;if(this.tokens.links){let l=Object.keys(this.tokens.links);if(l.length>0)for(;(n=this.tokenizer.rules.inline.reflinkSearch.exec(i))!=null;)l.includes(n[0].slice(n[0].lastIndexOf("[")+1,-1))&&(i=i.slice(0,n.index)+"["+"a".repeat(n[0].length-2)+"]"+i.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex))}for(;(n=this.tokenizer.rules.inline.anyPunctuation.exec(i))!=null;)i=i.slice(0,n.index)+"++"+i.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);let s;for(;(n=this.tokenizer.rules.inline.blockSkip.exec(i))!=null;)s=n[2]?n[2].length:0,i=i.slice(0,n.index+s)+"["+"a".repeat(n[0].length-s-2)+"]"+i.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);i=this.options.hooks?.emStrongMask?.call({lexer:this},i)??i;let o=!1,a="";for(;t;){o||(a=""),o=!1;let l;if(this.options.extensions?.inline?.some(d=>(l=d.call({lexer:this},t,r))?(t=t.substring(l.raw.length),r.push(l),!0):!1))continue;if(l=this.tokenizer.escape(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.tag(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.link(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.reflink(t,this.tokens.links)){t=t.substring(l.raw.length);let d=r.at(-1);l.type==="text"&&d?.type==="text"?(d.raw+=l.raw,d.text+=l.text):r.push(l);continue}if(l=this.tokenizer.emStrong(t,i,a)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.codespan(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.br(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.del(t)){t=t.substring(l.raw.length),r.push(l);continue}if(l=this.tokenizer.autolink(t)){t=t.substring(l.raw.length),r.push(l);continue}if(!this.state.inLink&&(l=this.tokenizer.url(t))){t=t.substring(l.raw.length),r.push(l);continue}let c=t;if(this.options.extensions?.startInline){let d=1/0,u=t.slice(1),p;this.options.extensions.startInline.forEach(f=>{p=f.call({lexer:this},u),typeof p=="number"&&p>=0&&(d=Math.min(d,p))}),d<1/0&&d>=0&&(c=t.substring(0,d+1))}if(l=this.tokenizer.inlineText(c)){t=t.substring(l.raw.length),l.raw.slice(-1)!=="_"&&(a=l.raw.slice(-1)),o=!0;let d=r.at(-1);d?.type==="text"?(d.raw+=l.raw,d.text+=l.text):r.push(l);continue}if(t){let d="Infinite loop on byte: "+t.charCodeAt(0);if(this.options.silent){console.error(d);break}else throw new Error(d)}}return r}},Zl=class{constructor(t){qt(this,"options");qt(this,"parser");this.options=t||Tn}space(t){return""}code({text:t,lang:r,escaped:i}){let n=(r||"").match(Ne.notSpaceStart)?.[0],s=t.replace(Ne.endingNewline,"")+`
`;return n?'<pre><code class="language-'+Hr(n)+'">'+(i?s:Hr(s,!0))+`</code></pre>
`:"<pre><code>"+(i?s:Hr(s,!0))+`</code></pre>
`}blockquote({tokens:t}){return`<blockquote>
${this.parser.parse(t)}</blockquote>
`}html({text:t}){return t}def(t){return""}heading({tokens:t,depth:r}){return`<h${r}>${this.parser.parseInline(t)}</h${r}>
`}hr(t){return`<hr>
`}list(t){let r=t.ordered,i=t.start,n="";for(let a=0;a<t.items.length;a++){let l=t.items[a];n+=this.listitem(l)}let s=r?"ol":"ul",o=r&&i!==1?' start="'+i+'"':"";return"<"+s+o+`>
`+n+"</"+s+`>
`}listitem(t){let r="";if(t.task){let i=this.checkbox({checked:!!t.checked});t.loose?t.tokens[0]?.type==="paragraph"?(t.tokens[0].text=i+" "+t.tokens[0].text,t.tokens[0].tokens&&t.tokens[0].tokens.length>0&&t.tokens[0].tokens[0].type==="text"&&(t.tokens[0].tokens[0].text=i+" "+Hr(t.tokens[0].tokens[0].text),t.tokens[0].tokens[0].escaped=!0)):t.tokens.unshift({type:"text",raw:i+" ",text:i+" ",escaped:!0}):r+=i+" "}return r+=this.parser.parse(t.tokens,!!t.loose),`<li>${r}</li>
`}checkbox({checked:t}){return"<input "+(t?'checked="" ':"")+'disabled="" type="checkbox">'}paragraph({tokens:t}){return`<p>${this.parser.parseInline(t)}</p>
`}table(t){let r="",i="";for(let s=0;s<t.header.length;s++)i+=this.tablecell(t.header[s]);r+=this.tablerow({text:i});let n="";for(let s=0;s<t.rows.length;s++){let o=t.rows[s];i="";for(let a=0;a<o.length;a++)i+=this.tablecell(o[a]);n+=this.tablerow({text:i})}return n&&(n=`<tbody>${n}</tbody>`),`<table>
<thead>
`+r+`</thead>
`+n+`</table>
`}tablerow({text:t}){return`<tr>
${t}</tr>
`}tablecell(t){let r=this.parser.parseInline(t.tokens),i=t.header?"th":"td";return(t.align?`<${i} align="${t.align}">`:`<${i}>`)+r+`</${i}>
`}strong({tokens:t}){return`<strong>${this.parser.parseInline(t)}</strong>`}em({tokens:t}){return`<em>${this.parser.parseInline(t)}</em>`}codespan({text:t}){return`<code>${Hr(t,!0)}</code>`}br(t){return"<br>"}del({tokens:t}){return`<del>${this.parser.parseInline(t)}</del>`}link({href:t,title:r,tokens:i}){let n=this.parser.parseInline(i),s=zm(t);if(s===null)return n;t=s;let o='<a href="'+t+'"';return r&&(o+=' title="'+Hr(r)+'"'),o+=">"+n+"</a>",o}image({href:t,title:r,text:i,tokens:n}){n&&(i=this.parser.parseInline(n,this.parser.textRenderer));let s=zm(t);if(s===null)return Hr(i);t=s;let o=`<img src="${t}" alt="${i}"`;return r&&(o+=` title="${Hr(r)}"`),o+=">",o}text(t){return"tokens"in t&&t.tokens?this.parser.parseInline(t.tokens):"escaped"in t&&t.escaped?t.text:Hr(t.text)}},Jp=class{strong({text:t}){return t}em({text:t}){return t}codespan({text:t}){return t}del({text:t}){return t}html({text:t}){return t}text({text:t}){return t}link({text:t}){return""+t}image({text:t}){return""+t}br(){return""}},Tr=class yu{constructor(t){qt(this,"options");qt(this,"renderer");qt(this,"textRenderer");this.options=t||Tn,this.options.renderer=this.options.renderer||new Zl,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new Jp}static parse(t,r){return new yu(r).parse(t)}static parseInline(t,r){return new yu(r).parseInline(t)}parse(t,r=!0){let i="";for(let n=0;n<t.length;n++){let s=t[n];if(this.options.extensions?.renderers?.[s.type]){let a=s,l=this.options.extensions.renderers[a.type].call({parser:this},a);if(l!==!1||!["space","hr","heading","code","table","blockquote","list","html","def","paragraph","text"].includes(a.type)){i+=l||"";continue}}let o=s;switch(o.type){case"space":{i+=this.renderer.space(o);continue}case"hr":{i+=this.renderer.hr(o);continue}case"heading":{i+=this.renderer.heading(o);continue}case"code":{i+=this.renderer.code(o);continue}case"table":{i+=this.renderer.table(o);continue}case"blockquote":{i+=this.renderer.blockquote(o);continue}case"list":{i+=this.renderer.list(o);continue}case"html":{i+=this.renderer.html(o);continue}case"def":{i+=this.renderer.def(o);continue}case"paragraph":{i+=this.renderer.paragraph(o);continue}case"text":{let a=o,l=this.renderer.text(a);for(;n+1<t.length&&t[n+1].type==="text";)a=t[++n],l+=`
`+this.renderer.text(a);r?i+=this.renderer.paragraph({type:"paragraph",raw:l,text:l,tokens:[{type:"text",raw:l,text:l,escaped:!0}]}):i+=l;continue}default:{let a='Token with "'+o.type+'" type was not found.';if(this.options.silent)return console.error(a),"";throw new Error(a)}}}return i}parseInline(t,r=this.renderer){let i="";for(let n=0;n<t.length;n++){let s=t[n];if(this.options.extensions?.renderers?.[s.type]){let a=this.options.extensions.renderers[s.type].call({parser:this},s);if(a!==!1||!["escape","html","link","image","strong","em","codespan","br","del","text"].includes(s.type)){i+=a||"";continue}}let o=s;switch(o.type){case"escape":{i+=r.text(o);break}case"html":{i+=r.html(o);break}case"link":{i+=r.link(o);break}case"image":{i+=r.image(o);break}case"strong":{i+=r.strong(o);break}case"em":{i+=r.em(o);break}case"codespan":{i+=r.codespan(o);break}case"br":{i+=r.br(o);break}case"del":{i+=r.del(o);break}case"text":{i+=r.text(o);break}default:{let a='Token with "'+o.type+'" type was not found.';if(this.options.silent)return console.error(a),"";throw new Error(a)}}}return i}},Ua,fo=(Ua=class{constructor(t){qt(this,"options");qt(this,"block");this.options=t||Tn}preprocess(t){return t}postprocess(t){return t}processAllTokens(t){return t}emStrongMask(t){return t}provideLexer(){return this.block?_r.lex:_r.lexInline}provideParser(){return this.block?Tr.parse:Tr.parseInline}},qt(Ua,"passThroughHooks",new Set(["preprocess","postprocess","processAllTokens","emStrongMask"])),qt(Ua,"passThroughHooksRespectAsync",new Set(["preprocess","postprocess","processAllTokens"])),Ua),LR=class{constructor(...t){qt(this,"defaults",Wp());qt(this,"options",this.setOptions);qt(this,"parse",this.parseMarkdown(!0));qt(this,"parseInline",this.parseMarkdown(!1));qt(this,"Parser",Tr);qt(this,"Renderer",Zl);qt(this,"TextRenderer",Jp);qt(this,"Lexer",_r);qt(this,"Tokenizer",Ql);qt(this,"Hooks",fo);this.use(...t)}walkTokens(t,r){let i=[];for(let n of t)switch(i=i.concat(r.call(this,n)),n.type){case"table":{let s=n;for(let o of s.header)i=i.concat(this.walkTokens(o.tokens,r));for(let o of s.rows)for(let a of o)i=i.concat(this.walkTokens(a.tokens,r));break}case"list":{let s=n;i=i.concat(this.walkTokens(s.items,r));break}default:{let s=n;this.defaults.extensions?.childTokens?.[s.type]?this.defaults.extensions.childTokens[s.type].forEach(o=>{let a=s[o].flat(1/0);i=i.concat(this.walkTokens(a,r))}):s.tokens&&(i=i.concat(this.walkTokens(s.tokens,r)))}}return i}use(...t){let r=this.defaults.extensions||{renderers:{},childTokens:{}};return t.forEach(i=>{let n={...i};if(n.async=this.defaults.async||n.async||!1,i.extensions&&(i.extensions.forEach(s=>{if(!s.name)throw new Error("extension name required");if("renderer"in s){let o=r.renderers[s.name];o?r.renderers[s.name]=function(...a){let l=s.renderer.apply(this,a);return l===!1&&(l=o.apply(this,a)),l}:r.renderers[s.name]=s.renderer}if("tokenizer"in s){if(!s.level||s.level!=="block"&&s.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let o=r[s.level];o?o.unshift(s.tokenizer):r[s.level]=[s.tokenizer],s.start&&(s.level==="block"?r.startBlock?r.startBlock.push(s.start):r.startBlock=[s.start]:s.level==="inline"&&(r.startInline?r.startInline.push(s.start):r.startInline=[s.start]))}"childTokens"in s&&s.childTokens&&(r.childTokens[s.name]=s.childTokens)}),n.extensions=r),i.renderer){let s=this.defaults.renderer||new Zl(this.defaults);for(let o in i.renderer){if(!(o in s))throw new Error(`renderer '${o}' does not exist`);if(["options","parser"].includes(o))continue;let a=o,l=i.renderer[a],c=s[a];s[a]=(...d)=>{let u=l.apply(s,d);return u===!1&&(u=c.apply(s,d)),u||""}}n.renderer=s}if(i.tokenizer){let s=this.defaults.tokenizer||new Ql(this.defaults);for(let o in i.tokenizer){if(!(o in s))throw new Error(`tokenizer '${o}' does not exist`);if(["options","rules","lexer"].includes(o))continue;let a=o,l=i.tokenizer[a],c=s[a];s[a]=(...d)=>{let u=l.apply(s,d);return u===!1&&(u=c.apply(s,d)),u}}n.tokenizer=s}if(i.hooks){let s=this.defaults.hooks||new fo;for(let o in i.hooks){if(!(o in s))throw new Error(`hook '${o}' does not exist`);if(["options","block"].includes(o))continue;let a=o,l=i.hooks[a],c=s[a];fo.passThroughHooks.has(o)?s[a]=d=>{if(this.defaults.async&&fo.passThroughHooksRespectAsync.has(o))return(async()=>{let p=await l.call(s,d);return c.call(s,p)})();let u=l.call(s,d);return c.call(s,u)}:s[a]=(...d)=>{if(this.defaults.async)return(async()=>{let p=await l.apply(s,d);return p===!1&&(p=await c.apply(s,d)),p})();let u=l.apply(s,d);return u===!1&&(u=c.apply(s,d)),u}}n.hooks=s}if(i.walkTokens){let s=this.defaults.walkTokens,o=i.walkTokens;n.walkTokens=function(a){let l=[];return l.push(o.call(this,a)),s&&(l=l.concat(s.call(this,a))),l}}this.defaults={...this.defaults,...n}}),this}setOptions(t){return this.defaults={...this.defaults,...t},this}lexer(t,r){return _r.lex(t,r??this.defaults)}parser(t,r){return Tr.parse(t,r??this.defaults)}parseMarkdown(t){return(r,i)=>{let n={...i},s={...this.defaults,...n},o=this.onError(!!s.silent,!!s.async);if(this.defaults.async===!0&&n.async===!1)return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof r>"u"||r===null)return o(new Error("marked(): input parameter is undefined or null"));if(typeof r!="string")return o(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(r)+", string expected"));if(s.hooks&&(s.hooks.options=s,s.hooks.block=t),s.async)return(async()=>{let a=s.hooks?await s.hooks.preprocess(r):r,l=await(s.hooks?await s.hooks.provideLexer():t?_r.lex:_r.lexInline)(a,s),c=s.hooks?await s.hooks.processAllTokens(l):l;s.walkTokens&&await Promise.all(this.walkTokens(c,s.walkTokens));let d=await(s.hooks?await s.hooks.provideParser():t?Tr.parse:Tr.parseInline)(c,s);return s.hooks?await s.hooks.postprocess(d):d})().catch(o);try{s.hooks&&(r=s.hooks.preprocess(r));let a=(s.hooks?s.hooks.provideLexer():t?_r.lex:_r.lexInline)(r,s);s.hooks&&(a=s.hooks.processAllTokens(a)),s.walkTokens&&this.walkTokens(a,s.walkTokens);let l=(s.hooks?s.hooks.provideParser():t?Tr.parse:Tr.parseInline)(a,s);return s.hooks&&(l=s.hooks.postprocess(l)),l}catch(a){return o(a)}}}onError(t,r){return i=>{if(i.message+=`
Please report this to https://github.com/markedjs/marked.`,t){let n="<p>An error occurred:</p><pre>"+Hr(i.message+"",!0)+"</pre>";return r?Promise.resolve(n):n}if(r)return Promise.reject(i);throw i}}},gn=new LR;function zt(e,t){return gn.parse(e,t)}zt.options=zt.setOptions=function(e){return gn.setOptions(e),zt.defaults=gn.defaults,Fv(zt.defaults),zt};zt.getDefaults=Wp;zt.defaults=Tn;zt.use=function(...e){return gn.use(...e),zt.defaults=gn.defaults,Fv(zt.defaults),zt};zt.walkTokens=function(e,t){return gn.walkTokens(e,t)};zt.parseInline=gn.parseInline;zt.Parser=Tr;zt.parser=Tr.parse;zt.Renderer=Zl;zt.TextRenderer=Jp;zt.Lexer=_r;zt.lexer=_r.lex;zt.Tokenizer=Ql;zt.Hooks=fo;zt.parse=zt;zt.options;zt.setOptions;zt.use;zt.walkTokens;zt.parseInline;Tr.parse;_r.lex;function Xv(e){for(var t=[],r=1;r<arguments.length;r++)t[r-1]=arguments[r];var i=Array.from(typeof e=="string"?[e]:e);i[i.length-1]=i[i.length-1].replace(/\r?\n([\t ]*)$/,"");var n=i.reduce(function(a,l){var c=l.match(/\n([\t ]+|(?!\s).)/g);return c?a.concat(c.map(function(d){var u,p;return(p=(u=d.match(/[\t ]/g))===null||u===void 0?void 0:u.length)!==null&&p!==void 0?p:0})):a},[]);if(n.length){var s=new RegExp(`
[	 ]{`+Math.min.apply(Math,n)+"}","g");i=i.map(function(a){return a.replace(s,`
`)})}i[0]=i[0].replace(/^\r?\n/,"");var o=i[0];return t.forEach(function(a,l){var c=o.match(/(?:^|\n)( *)$/),d=c?c[1]:"",u=a;typeof a=="string"&&a.includes(`
`)&&(u=String(a).split(`
`).map(function(p,f){return f===0?p:""+d+p}).join(`
`)),o+=u+i[l+1]}),o}var BR={body:'<g><rect width="80" height="80" style="fill: #087ebf; stroke-width: 0px;"/><text transform="translate(21.16 64.67)" style="fill: #fff; font-family: ArialMT, Arial; font-size: 67.75px;"><tspan x="0" y="0">?</tspan></text></g>',height:80,width:80},vu=new Map,Qv=new Map,MR=m(e=>{for(const t of e){if(!t.name)throw new Error('Invalid icon loader. Must have a "name" property with non-empty string value.');if(q.debug("Registering icon pack:",t.name),"loader"in t)Qv.set(t.name,t.loader);else if("icons"in t)vu.set(t.name,t.icons);else throw q.error("Invalid icon loader:",t),new Error('Invalid icon loader. Must have either "icons" or "loader" property.')}},"registerIconPacks"),Zv=m(async(e,t)=>{const r=IO(e,!0,t!==void 0);if(!r)throw new Error(`Invalid icon name: ${e}`);const i=r.prefix||t;if(!i)throw new Error(`Icon name must contain a prefix: ${e}`);let n=vu.get(i);if(!n){const o=Qv.get(i);if(!o)throw new Error(`Icon set not found: ${r.prefix}`);try{n={...await o(),prefix:i},vu.set(i,n)}catch(a){throw q.error(a),new Error(`Failed to load icon set: ${r.prefix}`)}}const s=DO(n,r.name);if(!s)throw new Error(`Icon not found: ${e}`);return s},"getRegisteredIconData"),IR=m(async e=>{try{return await Zv(e),!0}catch{return!1}},"isIconAvailable"),pa=m(async(e,t,r)=>{let i;try{i=await Zv(e,t?.fallbackPrefix)}catch(o){q.error(o),i=BR}const n=WO(i,t),s=YO(GO(n.body),{...n.attributes,...r});return vr(s,Te())},"getIconSVG");function Jv(e,{markdownAutoWrap:t}){const i=e.replace(/<br\/>/g,`
`).replace(/\n{2,}/g,`
`),n=Xv(i);return t===!1?n.replace(/ /g,"&nbsp;"):n}m(Jv,"preprocessMarkdown");function Kv(e,t={}){const r=Jv(e,t),i=zt.lexer(r),n=[[]];let s=0;function o(a,l="normal"){a.type==="text"?a.text.split(`
`).forEach((d,u)=>{u!==0&&(s++,n.push([])),d.split(" ").forEach(p=>{p=p.replace(/&#39;/g,"'"),p&&n[s].push({content:p,type:l})})}):a.type==="strong"||a.type==="em"?a.tokens.forEach(c=>{o(c,a.type)}):a.type==="html"&&n[s].push({content:a.text,type:"normal"})}return m(o,"processNode"),i.forEach(a=>{a.type==="paragraph"?a.tokens?.forEach(l=>{o(l)}):a.type==="html"?n[s].push({content:a.text,type:"normal"}):n[s].push({content:a.raw,type:"normal"})}),n}m(Kv,"markdownToLines");function t2(e,{markdownAutoWrap:t}={}){const r=zt.lexer(e);function i(n){return n.type==="text"?t===!1?n.text.replace(/\n */g,"<br/>").replace(/ /g,"&nbsp;"):n.text.replace(/\n */g,"<br/>"):n.type==="strong"?`<strong>${n.tokens?.map(i).join("")}</strong>`:n.type==="em"?`<em>${n.tokens?.map(i).join("")}</em>`:n.type==="paragraph"?`<p>${n.tokens?.map(i).join("")}</p>`:n.type==="space"?"":n.type==="html"?`${n.text}`:n.type==="escape"?n.text:(q.warn(`Unsupported markdown: ${n.type}`),n.raw)}return m(i,"output"),r.map(i).join("")}m(t2,"markdownToHTML");function e2(e){return Intl.Segmenter?[...new Intl.Segmenter().segment(e)].map(t=>t.segment):[...e]}m(e2,"splitTextToChars");function r2(e,t){const r=e2(t.content);return Kp(e,[],r,t.type)}m(r2,"splitWordToFitWidth");function Kp(e,t,r,i){if(r.length===0)return[{content:t.join(""),type:i},{content:"",type:i}];const[n,...s]=r,o=[...t,n];return e([{content:o.join(""),type:i}])?Kp(e,o,s,i):(t.length===0&&n&&(t.push(n),r.shift()),[{content:t.join(""),type:i},{content:r.join(""),type:i}])}m(Kp,"splitWordToFitWidthRecursion");function i2(e,t){if(e.some(({content:r})=>r.includes(`
`)))throw new Error("splitLineToFitWidth does not support newlines in the line");return Jl(e,t)}m(i2,"splitLineToFitWidth");function Jl(e,t,r=[],i=[]){if(e.length===0)return i.length>0&&r.push(i),r.length>0?r:[];let n="";e[0].content===" "&&(n=" ",e.shift());const s=e.shift()??{content:" ",type:"normal"},o=[...i];if(n!==""&&o.push({content:n,type:"normal"}),o.push(s),t(o))return Jl(e,t,r,o);if(i.length>0)r.push(i),e.unshift(s);else if(s.content){const[a,l]=r2(t,s);r.push([a]),l.content&&e.unshift(l)}return Jl(e,t,r)}m(Jl,"splitLineToFitWidthRecursion");function wu(e,t){t&&e.attr("style",t)}m(wu,"applyStyle");async function n2(e,t,r,i,n=!1,s=Te()){const o=e.append("foreignObject");o.attr("width",`${10*r}px`),o.attr("height",`${10*r}px`);const a=o.append("xhtml:div"),l=xs(t.label)?await lp(t.label.replace(Bs.lineBreakRegex,`
`),s):vr(t.label,s),c=t.isNode?"nodeLabel":"edgeLabel",d=a.append("span");d.html(l),wu(d,t.labelStyle),d.attr("class",`${c} ${i}`),wu(a,t.labelStyle),a.style("display","table-cell"),a.style("white-space","nowrap"),a.style("line-height","1.5"),a.style("max-width",r+"px"),a.style("text-align","center"),a.attr("xmlns","http://www.w3.org/1999/xhtml"),n&&a.attr("class","labelBkg");let u=a.node().getBoundingClientRect();return u.width===r&&(a.style("display","table"),a.style("white-space","break-spaces"),a.style("width",r+"px"),u=a.node().getBoundingClientRect()),o.node()}m(n2,"addHtmlSpan");function Dc(e,t,r){return e.append("tspan").attr("class","text-outer-tspan").attr("x",0).attr("y",t*r-.1+"em").attr("dy",r+"em")}m(Dc,"createTspan");function s2(e,t,r){const i=e.append("text"),n=Dc(i,1,t);Fc(n,r);const s=n.node().getComputedTextLength();return i.remove(),s}m(s2,"computeWidthOfText");function OR(e,t,r){const i=e.append("text"),n=Dc(i,1,t);Fc(n,[{content:r,type:"normal"}]);const s=n.node()?.getBoundingClientRect();return s&&i.remove(),s}m(OR,"computeDimensionOfText");function o2(e,t,r,i=!1){const s=t.append("g"),o=s.insert("rect").attr("class","background").attr("style","stroke: none"),a=s.append("text").attr("y","-10.1");let l=0;for(const c of r){const d=m(p=>s2(s,1.1,p)<=e,"checkWidth"),u=d(c)?[c]:i2(c,d);for(const p of u){const f=Dc(a,l,1.1);Fc(f,p),l++}}if(i){const c=a.node().getBBox(),d=2;return o.attr("x",c.x-d).attr("y",c.y-d).attr("width",c.width+2*d).attr("height",c.height+2*d),s.node()}else return a.node()}m(o2,"createFormattedText");function Fc(e,t){e.text(""),t.forEach((r,i)=>{const n=e.append("tspan").attr("font-style",r.type==="em"?"italic":"normal").attr("class","text-inner-tspan").attr("font-weight",r.type==="strong"?"bold":"normal");i===0?n.text(r.content):n.text(" "+r.content)})}m(Fc,"updateTextContentAndStyles");async function a2(e,t={}){const r=[];e.replace(/(fa[bklrs]?):fa-([\w-]+)/g,(n,s,o)=>(r.push((async()=>{const a=`${s}:${o}`;return await IR(a)?await pa(a,void 0,{class:"label-icon"}):`<i class='${vr(n,t).replace(":"," ")}'></i>`})()),n));const i=await Promise.all(r);return e.replace(/(fa[bklrs]?):fa-([\w-]+)/g,()=>i.shift()??"")}m(a2,"replaceIconSubstring");var Di=m(async(e,t="",{style:r="",isTitle:i=!1,classes:n="",useHtmlLabels:s=!0,isNode:o=!0,width:a=200,addSvgBackground:l=!1}={},c)=>{if(q.debug("XYZ createText",t,r,i,n,s,o,"addSvgBackground: ",l),s){const d=t2(t,c),u=await a2(_n(d),c),p=t.replace(/\\\\/g,"\\"),f={isNode:o,label:xs(t)?p:u,labelStyle:r.replace("fill:","color:")};return await n2(e,f,a,n,l,c)}else{const d=t.replace(/<br\s*\/?>/g,"<br/>"),u=Kv(d.replace("<br>","<br/>"),c),p=o2(a,e,u,t?l:!1);if(o){/stroke:/.exec(r)&&(r=r.replace("stroke:","lineColor:"));const f=r.replace(/stroke:[^;]+;?/g,"").replace(/stroke-width:[^;]+;?/g,"").replace(/fill:[^;]+;?/g,"").replace(/color:/g,"fill:");Lt(p).attr("style",f)}else{const f=r.replace(/stroke:[^;]+;?/g,"").replace(/stroke-width:[^;]+;?/g,"").replace(/fill:[^;]+;?/g,"").replace(/background:/g,"fill:");Lt(p).select("rect").attr("style",f.replace(/background:/g,"fill:"));const g=r.replace(/stroke:[^;]+;?/g,"").replace(/stroke-width:[^;]+;?/g,"").replace(/fill:[^;]+;?/g,"").replace(/color:/g,"fill:");Lt(p).select("text").attr("style",g)}return p}},"createText");function Ih(e,t,r){if(e&&e.length){const[i,n]=t,s=Math.PI/180*r,o=Math.cos(s),a=Math.sin(s);for(const l of e){const[c,d]=l;l[0]=(c-i)*o-(d-n)*a+i,l[1]=(c-i)*a+(d-n)*o+n}}}function RR(e,t){return e[0]===t[0]&&e[1]===t[1]}function DR(e,t,r,i=1){const n=r,s=Math.max(t,.1),o=e[0]&&e[0][0]&&typeof e[0][0]=="number"?[e]:e,a=[0,0];if(n)for(const c of o)Ih(c,a,n);const l=function(c,d,u){const p=[];for(const b of c){const w=[...b];RR(w[0],w[w.length-1])||w.push([w[0][0],w[0][1]]),w.length>2&&p.push(w)}const f=[];d=Math.max(d,.1);const g=[];for(const b of p)for(let w=0;w<b.length-1;w++){const S=b[w],_=b[w+1];if(S[1]!==_[1]){const A=Math.min(S[1],_[1]);g.push({ymin:A,ymax:Math.max(S[1],_[1]),x:A===S[1]?S[0]:_[0],islope:(_[0]-S[0])/(_[1]-S[1])})}}if(g.sort((b,w)=>b.ymin<w.ymin?-1:b.ymin>w.ymin?1:b.x<w.x?-1:b.x>w.x?1:b.ymax===w.ymax?0:(b.ymax-w.ymax)/Math.abs(b.ymax-w.ymax)),!g.length)return f;let x=[],v=g[0].ymin,y=0;for(;x.length||g.length;){if(g.length){let b=-1;for(let w=0;w<g.length&&!(g[w].ymin>v);w++)b=w;g.splice(0,b+1).forEach(w=>{x.push({s:v,edge:w})})}if(x=x.filter(b=>!(b.edge.ymax<=v)),x.sort((b,w)=>b.edge.x===w.edge.x?0:(b.edge.x-w.edge.x)/Math.abs(b.edge.x-w.edge.x)),(u!==1||y%d==0)&&x.length>1)for(let b=0;b<x.length;b+=2){const w=b+1;if(w>=x.length)break;const S=x[b].edge,_=x[w].edge;f.push([[Math.round(S.x),v],[Math.round(_.x),v]])}v+=u,x.forEach(b=>{b.edge.x=b.edge.x+u*b.edge.islope}),y++}return f}(o,s,i);if(n){for(const c of o)Ih(c,a,-n);(function(c,d,u){const p=[];c.forEach(f=>p.push(...f)),Ih(p,d,u)})(l,a,-n)}return l}function fa(e,t){var r;const i=t.hachureAngle+90;let n=t.hachureGap;n<0&&(n=4*t.strokeWidth),n=Math.round(Math.max(n,.1));let s=1;return t.roughness>=1&&(((r=t.randomizer)===null||r===void 0?void 0:r.next())||Math.random())>.7&&(s=n),DR(e,n,i,s||1)}class tf{constructor(t){this.helper=t}fillPolygons(t,r){return this._fillPolygons(t,r)}_fillPolygons(t,r){const i=fa(t,r);return{type:"fillSketch",ops:this.renderLines(i,r)}}renderLines(t,r){const i=[];for(const n of t)i.push(...this.helper.doubleLineOps(n[0][0],n[0][1],n[1][0],n[1][1],r));return i}}function Pc(e){const t=e[0],r=e[1];return Math.sqrt(Math.pow(t[0]-r[0],2)+Math.pow(t[1]-r[1],2))}class FR extends tf{fillPolygons(t,r){let i=r.hachureGap;i<0&&(i=4*r.strokeWidth),i=Math.max(i,.1);const n=fa(t,Object.assign({},r,{hachureGap:i})),s=Math.PI/180*r.hachureAngle,o=[],a=.5*i*Math.cos(s),l=.5*i*Math.sin(s);for(const[c,d]of n)Pc([c,d])&&o.push([[c[0]-a,c[1]+l],[...d]],[[c[0]+a,c[1]-l],[...d]]);return{type:"fillSketch",ops:this.renderLines(o,r)}}}class PR extends tf{fillPolygons(t,r){const i=this._fillPolygons(t,r),n=Object.assign({},r,{hachureAngle:r.hachureAngle+90}),s=this._fillPolygons(t,n);return i.ops=i.ops.concat(s.ops),i}}class NR{constructor(t){this.helper=t}fillPolygons(t,r){const i=fa(t,r=Object.assign({},r,{hachureAngle:0}));return this.dotsOnLines(i,r)}dotsOnLines(t,r){const i=[];let n=r.hachureGap;n<0&&(n=4*r.strokeWidth),n=Math.max(n,.1);let s=r.fillWeight;s<0&&(s=r.strokeWidth/2);const o=n/4;for(const a of t){const l=Pc(a),c=l/n,d=Math.ceil(c)-1,u=l-d*n,p=(a[0][0]+a[1][0])/2-n/4,f=Math.min(a[0][1],a[1][1]);for(let g=0;g<d;g++){const x=f+u+g*n,v=p-o+2*Math.random()*o,y=x-o+2*Math.random()*o,b=this.helper.ellipse(v,y,s,s,r);i.push(...b.ops)}}return{type:"fillSketch",ops:i}}}class zR{constructor(t){this.helper=t}fillPolygons(t,r){const i=fa(t,r);return{type:"fillSketch",ops:this.dashedLine(i,r)}}dashedLine(t,r){const i=r.dashOffset<0?r.hachureGap<0?4*r.strokeWidth:r.hachureGap:r.dashOffset,n=r.dashGap<0?r.hachureGap<0?4*r.strokeWidth:r.hachureGap:r.dashGap,s=[];return t.forEach(o=>{const a=Pc(o),l=Math.floor(a/(i+n)),c=(a+n-l*(i+n))/2;let d=o[0],u=o[1];d[0]>u[0]&&(d=o[1],u=o[0]);const p=Math.atan((u[1]-d[1])/(u[0]-d[0]));for(let f=0;f<l;f++){const g=f*(i+n),x=g+i,v=[d[0]+g*Math.cos(p)+c*Math.cos(p),d[1]+g*Math.sin(p)+c*Math.sin(p)],y=[d[0]+x*Math.cos(p)+c*Math.cos(p),d[1]+x*Math.sin(p)+c*Math.sin(p)];s.push(...this.helper.doubleLineOps(v[0],v[1],y[0],y[1],r))}}),s}}class HR{constructor(t){this.helper=t}fillPolygons(t,r){const i=r.hachureGap<0?4*r.strokeWidth:r.hachureGap,n=r.zigzagOffset<0?i:r.zigzagOffset,s=fa(t,r=Object.assign({},r,{hachureGap:i+n}));return{type:"fillSketch",ops:this.zigzagLines(s,n,r)}}zigzagLines(t,r,i){const n=[];return t.forEach(s=>{const o=Pc(s),a=Math.round(o/(2*r));let l=s[0],c=s[1];l[0]>c[0]&&(l=s[1],c=s[0]);const d=Math.atan((c[1]-l[1])/(c[0]-l[0]));for(let u=0;u<a;u++){const p=2*u*r,f=2*(u+1)*r,g=Math.sqrt(2*Math.pow(r,2)),x=[l[0]+p*Math.cos(d),l[1]+p*Math.sin(d)],v=[l[0]+f*Math.cos(d),l[1]+f*Math.sin(d)],y=[x[0]+g*Math.cos(d+Math.PI/4),x[1]+g*Math.sin(d+Math.PI/4)];n.push(...this.helper.doubleLineOps(x[0],x[1],y[0],y[1],i),...this.helper.doubleLineOps(y[0],y[1],v[0],v[1],i))}}),n}}const Ye={};class qR{constructor(t){this.seed=t}next(){return this.seed?(2**31-1&(this.seed=Math.imul(48271,this.seed)))/2**31:Math.random()}}const WR=0,Oh=1,Wm=2,Ra={A:7,a:7,C:6,c:6,H:1,h:1,L:2,l:2,M:2,m:2,Q:4,q:4,S:4,s:4,T:2,t:2,V:1,v:1,Z:0,z:0};function Rh(e,t){return e.type===t}function ef(e){const t=[],r=function(o){const a=new Array;for(;o!=="";)if(o.match(/^([ \t\r\n,]+)/))o=o.substr(RegExp.$1.length);else if(o.match(/^([aAcChHlLmMqQsStTvVzZ])/))a[a.length]={type:WR,text:RegExp.$1},o=o.substr(RegExp.$1.length);else{if(!o.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/))return[];a[a.length]={type:Oh,text:`${parseFloat(RegExp.$1)}`},o=o.substr(RegExp.$1.length)}return a[a.length]={type:Wm,text:""},a}(e);let i="BOD",n=0,s=r[n];for(;!Rh(s,Wm);){let o=0;const a=[];if(i==="BOD"){if(s.text!=="M"&&s.text!=="m")return ef("M0,0"+e);n++,o=Ra[s.text],i=s.text}else Rh(s,Oh)?o=Ra[i]:(n++,o=Ra[s.text],i=s.text);if(!(n+o<r.length))throw new Error("Path data ended short");for(let l=n;l<n+o;l++){const c=r[l];if(!Rh(c,Oh))throw new Error("Param not a number: "+i+","+c.text);a[a.length]=+c.text}if(typeof Ra[i]!="number")throw new Error("Bad segment: "+i);{const l={key:i,data:a};t.push(l),n+=o,s=r[n],i==="M"&&(i="L"),i==="m"&&(i="l")}}return t}function l2(e){let t=0,r=0,i=0,n=0;const s=[];for(const{key:o,data:a}of e)switch(o){case"M":s.push({key:"M",data:[...a]}),[t,r]=a,[i,n]=a;break;case"m":t+=a[0],r+=a[1],s.push({key:"M",data:[t,r]}),i=t,n=r;break;case"L":s.push({key:"L",data:[...a]}),[t,r]=a;break;case"l":t+=a[0],r+=a[1],s.push({key:"L",data:[t,r]});break;case"C":s.push({key:"C",data:[...a]}),t=a[4],r=a[5];break;case"c":{const l=a.map((c,d)=>d%2?c+r:c+t);s.push({key:"C",data:l}),t=l[4],r=l[5];break}case"Q":s.push({key:"Q",data:[...a]}),t=a[2],r=a[3];break;case"q":{const l=a.map((c,d)=>d%2?c+r:c+t);s.push({key:"Q",data:l}),t=l[2],r=l[3];break}case"A":s.push({key:"A",data:[...a]}),t=a[5],r=a[6];break;case"a":t+=a[5],r+=a[6],s.push({key:"A",data:[a[0],a[1],a[2],a[3],a[4],t,r]});break;case"H":s.push({key:"H",data:[...a]}),t=a[0];break;case"h":t+=a[0],s.push({key:"H",data:[t]});break;case"V":s.push({key:"V",data:[...a]}),r=a[0];break;case"v":r+=a[0],s.push({key:"V",data:[r]});break;case"S":s.push({key:"S",data:[...a]}),t=a[2],r=a[3];break;case"s":{const l=a.map((c,d)=>d%2?c+r:c+t);s.push({key:"S",data:l}),t=l[2],r=l[3];break}case"T":s.push({key:"T",data:[...a]}),t=a[0],r=a[1];break;case"t":t+=a[0],r+=a[1],s.push({key:"T",data:[t,r]});break;case"Z":case"z":s.push({key:"Z",data:[]}),t=i,r=n}return s}function c2(e){const t=[];let r="",i=0,n=0,s=0,o=0,a=0,l=0;for(const{key:c,data:d}of e){switch(c){case"M":t.push({key:"M",data:[...d]}),[i,n]=d,[s,o]=d;break;case"C":t.push({key:"C",data:[...d]}),i=d[4],n=d[5],a=d[2],l=d[3];break;case"L":t.push({key:"L",data:[...d]}),[i,n]=d;break;case"H":i=d[0],t.push({key:"L",data:[i,n]});break;case"V":n=d[0],t.push({key:"L",data:[i,n]});break;case"S":{let u=0,p=0;r==="C"||r==="S"?(u=i+(i-a),p=n+(n-l)):(u=i,p=n),t.push({key:"C",data:[u,p,...d]}),a=d[0],l=d[1],i=d[2],n=d[3];break}case"T":{const[u,p]=d;let f=0,g=0;r==="Q"||r==="T"?(f=i+(i-a),g=n+(n-l)):(f=i,g=n);const x=i+2*(f-i)/3,v=n+2*(g-n)/3,y=u+2*(f-u)/3,b=p+2*(g-p)/3;t.push({key:"C",data:[x,v,y,b,u,p]}),a=f,l=g,i=u,n=p;break}case"Q":{const[u,p,f,g]=d,x=i+2*(u-i)/3,v=n+2*(p-n)/3,y=f+2*(u-f)/3,b=g+2*(p-g)/3;t.push({key:"C",data:[x,v,y,b,f,g]}),a=u,l=p,i=f,n=g;break}case"A":{const u=Math.abs(d[0]),p=Math.abs(d[1]),f=d[2],g=d[3],x=d[4],v=d[5],y=d[6];u===0||p===0?(t.push({key:"C",data:[i,n,v,y,v,y]}),i=v,n=y):(i!==v||n!==y)&&(h2(i,n,v,y,u,p,f,g,x).forEach(function(b){t.push({key:"C",data:b})}),i=v,n=y);break}case"Z":t.push({key:"Z",data:[]}),i=s,n=o}r=c}return t}function no(e,t,r){return[e*Math.cos(r)-t*Math.sin(r),e*Math.sin(r)+t*Math.cos(r)]}function h2(e,t,r,i,n,s,o,a,l,c){const d=(u=o,Math.PI*u/180);var u;let p=[],f=0,g=0,x=0,v=0;if(c)[f,g,x,v]=c;else{[e,t]=no(e,t,-d),[r,i]=no(r,i,-d);const H=(e-r)/2,O=(t-i)/2;let R=H*H/(n*n)+O*O/(s*s);R>1&&(R=Math.sqrt(R),n*=R,s*=R);const T=n*n,L=s*s,$=T*L-T*O*O-L*H*H,N=T*O*O+L*H*H,G=(a===l?-1:1)*Math.sqrt(Math.abs($/N));x=G*n*O/s+(e+r)/2,v=G*-s*H/n+(t+i)/2,f=Math.asin(parseFloat(((t-v)/s).toFixed(9))),g=Math.asin(parseFloat(((i-v)/s).toFixed(9))),e<x&&(f=Math.PI-f),r<x&&(g=Math.PI-g),f<0&&(f=2*Math.PI+f),g<0&&(g=2*Math.PI+g),l&&f>g&&(f-=2*Math.PI),!l&&g>f&&(g-=2*Math.PI)}let y=g-f;if(Math.abs(y)>120*Math.PI/180){const H=g,O=r,R=i;g=l&&g>f?f+120*Math.PI/180*1:f+120*Math.PI/180*-1,p=h2(r=x+n*Math.cos(g),i=v+s*Math.sin(g),O,R,n,s,o,0,l,[g,H,x,v])}y=g-f;const b=Math.cos(f),w=Math.sin(f),S=Math.cos(g),_=Math.sin(g),A=Math.tan(y/4),C=4/3*n*A,E=4/3*s*A,P=[e,t],z=[e+C*w,t-E*b],D=[r+C*_,i-E*S],V=[r,i];if(z[0]=2*P[0]-z[0],z[1]=2*P[1]-z[1],c)return[z,D,V].concat(p);{p=[z,D,V].concat(p);const H=[];for(let O=0;O<p.length;O+=3){const R=no(p[O][0],p[O][1],d),T=no(p[O+1][0],p[O+1][1],d),L=no(p[O+2][0],p[O+2][1],d);H.push([R[0],R[1],T[0],T[1],L[0],L[1]])}return H}}const VR={randOffset:function(e,t){return wt(e,t)},randOffsetWithRange:function(e,t,r){return Kl(e,t,r)},ellipse:function(e,t,r,i,n){const s=u2(r,i,n);return ku(e,t,n,s).opset},doubleLineOps:function(e,t,r,i,n){return Li(e,t,r,i,n,!0)}};function d2(e,t,r,i,n){return{type:"path",ops:Li(e,t,r,i,n)}}function dl(e,t,r){const i=(e||[]).length;if(i>2){const n=[];for(let s=0;s<i-1;s++)n.push(...Li(e[s][0],e[s][1],e[s+1][0],e[s+1][1],r));return t&&n.push(...Li(e[i-1][0],e[i-1][1],e[0][0],e[0][1],r)),{type:"path",ops:n}}return i===2?d2(e[0][0],e[0][1],e[1][0],e[1][1],r):{type:"path",ops:[]}}function UR(e,t,r,i,n){return function(s,o){return dl(s,!0,o)}([[e,t],[e+r,t],[e+r,t+i],[e,t+i]],n)}function Vm(e,t){if(e.length){const r=typeof e[0][0]=="number"?[e]:e,i=Da(r[0],1*(1+.2*t.roughness),t),n=t.disableMultiStroke?[]:Da(r[0],1.5*(1+.22*t.roughness),Ym(t));for(let s=1;s<r.length;s++){const o=r[s];if(o.length){const a=Da(o,1*(1+.2*t.roughness),t),l=t.disableMultiStroke?[]:Da(o,1.5*(1+.22*t.roughness),Ym(t));for(const c of a)c.op!=="move"&&i.push(c);for(const c of l)c.op!=="move"&&n.push(c)}}return{type:"path",ops:i.concat(n)}}return{type:"path",ops:[]}}function u2(e,t,r){const i=Math.sqrt(2*Math.PI*Math.sqrt((Math.pow(e/2,2)+Math.pow(t/2,2))/2)),n=Math.ceil(Math.max(r.curveStepCount,r.curveStepCount/Math.sqrt(200)*i)),s=2*Math.PI/n;let o=Math.abs(e/2),a=Math.abs(t/2);const l=1-r.curveFitting;return o+=wt(o*l,r),a+=wt(a*l,r),{increment:s,rx:o,ry:a}}function ku(e,t,r,i){const[n,s]=Xm(i.increment,e,t,i.rx,i.ry,1,i.increment*Kl(.1,Kl(.4,1,r),r),r);let o=tc(n,null,r);if(!r.disableMultiStroke&&r.roughness!==0){const[a]=Xm(i.increment,e,t,i.rx,i.ry,1.5,0,r),l=tc(a,null,r);o=o.concat(l)}return{estimatedPoints:s,opset:{type:"path",ops:o}}}function Um(e,t,r,i,n,s,o,a,l){const c=e,d=t;let u=Math.abs(r/2),p=Math.abs(i/2);u+=wt(.01*u,l),p+=wt(.01*p,l);let f=n,g=s;for(;f<0;)f+=2*Math.PI,g+=2*Math.PI;g-f>2*Math.PI&&(f=0,g=2*Math.PI);const x=2*Math.PI/l.curveStepCount,v=Math.min(x/2,(g-f)/2),y=Qm(v,c,d,u,p,f,g,1,l);if(!l.disableMultiStroke){const b=Qm(v,c,d,u,p,f,g,1.5,l);y.push(...b)}return o&&(a?y.push(...Li(c,d,c+u*Math.cos(f),d+p*Math.sin(f),l),...Li(c,d,c+u*Math.cos(g),d+p*Math.sin(g),l)):y.push({op:"lineTo",data:[c,d]},{op:"lineTo",data:[c+u*Math.cos(f),d+p*Math.sin(f)]})),{type:"path",ops:y}}function Gm(e,t){const r=c2(l2(ef(e))),i=[];let n=[0,0],s=[0,0];for(const{key:o,data:a}of r)switch(o){case"M":s=[a[0],a[1]],n=[a[0],a[1]];break;case"L":i.push(...Li(s[0],s[1],a[0],a[1],t)),s=[a[0],a[1]];break;case"C":{const[l,c,d,u,p,f]=a;i.push(...GR(l,c,d,u,p,f,s,t)),s=[p,f];break}case"Z":i.push(...Li(s[0],s[1],n[0],n[1],t)),s=[n[0],n[1]]}return{type:"path",ops:i}}function Dh(e,t){const r=[];for(const i of e)if(i.length){const n=t.maxRandomnessOffset||0,s=i.length;if(s>2){r.push({op:"move",data:[i[0][0]+wt(n,t),i[0][1]+wt(n,t)]});for(let o=1;o<s;o++)r.push({op:"lineTo",data:[i[o][0]+wt(n,t),i[o][1]+wt(n,t)]})}}return{type:"fillPath",ops:r}}function On(e,t){return function(r,i){let n=r.fillStyle||"hachure";if(!Ye[n])switch(n){case"zigzag":Ye[n]||(Ye[n]=new FR(i));break;case"cross-hatch":Ye[n]||(Ye[n]=new PR(i));break;case"dots":Ye[n]||(Ye[n]=new NR(i));break;case"dashed":Ye[n]||(Ye[n]=new zR(i));break;case"zigzag-line":Ye[n]||(Ye[n]=new HR(i));break;default:n="hachure",Ye[n]||(Ye[n]=new tf(i))}return Ye[n]}(t,VR).fillPolygons(e,t)}function Ym(e){const t=Object.assign({},e);return t.randomizer=void 0,e.seed&&(t.seed=e.seed+1),t}function p2(e){return e.randomizer||(e.randomizer=new qR(e.seed||0)),e.randomizer.next()}function Kl(e,t,r,i=1){return r.roughness*i*(p2(r)*(t-e)+e)}function wt(e,t,r=1){return Kl(-e,e,t,r)}function Li(e,t,r,i,n,s=!1){const o=s?n.disableMultiStrokeFill:n.disableMultiStroke,a=Cu(e,t,r,i,n,!0,!1);if(o)return a;const l=Cu(e,t,r,i,n,!0,!0);return a.concat(l)}function Cu(e,t,r,i,n,s,o){const a=Math.pow(e-r,2)+Math.pow(t-i,2),l=Math.sqrt(a);let c=1;c=l<200?1:l>500?.4:-.0016668*l+1.233334;let d=n.maxRandomnessOffset||0;d*d*100>a&&(d=l/10);const u=d/2,p=.2+.2*p2(n);let f=n.bowing*n.maxRandomnessOffset*(i-t)/200,g=n.bowing*n.maxRandomnessOffset*(e-r)/200;f=wt(f,n,c),g=wt(g,n,c);const x=[],v=()=>wt(u,n,c),y=()=>wt(d,n,c),b=n.preserveVertices;return o?x.push({op:"move",data:[e+(b?0:v()),t+(b?0:v())]}):x.push({op:"move",data:[e+(b?0:wt(d,n,c)),t+(b?0:wt(d,n,c))]}),o?x.push({op:"bcurveTo",data:[f+e+(r-e)*p+v(),g+t+(i-t)*p+v(),f+e+2*(r-e)*p+v(),g+t+2*(i-t)*p+v(),r+(b?0:v()),i+(b?0:v())]}):x.push({op:"bcurveTo",data:[f+e+(r-e)*p+y(),g+t+(i-t)*p+y(),f+e+2*(r-e)*p+y(),g+t+2*(i-t)*p+y(),r+(b?0:y()),i+(b?0:y())]}),x}function Da(e,t,r){if(!e.length)return[];const i=[];i.push([e[0][0]+wt(t,r),e[0][1]+wt(t,r)]),i.push([e[0][0]+wt(t,r),e[0][1]+wt(t,r)]);for(let n=1;n<e.length;n++)i.push([e[n][0]+wt(t,r),e[n][1]+wt(t,r)]),n===e.length-1&&i.push([e[n][0]+wt(t,r),e[n][1]+wt(t,r)]);return tc(i,null,r)}function tc(e,t,r){const i=e.length,n=[];if(i>3){const s=[],o=1-r.curveTightness;n.push({op:"move",data:[e[1][0],e[1][1]]});for(let a=1;a+2<i;a++){const l=e[a];s[0]=[l[0],l[1]],s[1]=[l[0]+(o*e[a+1][0]-o*e[a-1][0])/6,l[1]+(o*e[a+1][1]-o*e[a-1][1])/6],s[2]=[e[a+1][0]+(o*e[a][0]-o*e[a+2][0])/6,e[a+1][1]+(o*e[a][1]-o*e[a+2][1])/6],s[3]=[e[a+1][0],e[a+1][1]],n.push({op:"bcurveTo",data:[s[1][0],s[1][1],s[2][0],s[2][1],s[3][0],s[3][1]]})}}else i===3?(n.push({op:"move",data:[e[1][0],e[1][1]]}),n.push({op:"bcurveTo",data:[e[1][0],e[1][1],e[2][0],e[2][1],e[2][0],e[2][1]]})):i===2&&n.push(...Cu(e[0][0],e[0][1],e[1][0],e[1][1],r,!0,!0));return n}function Xm(e,t,r,i,n,s,o,a){const l=[],c=[];if(a.roughness===0){e/=4,c.push([t+i*Math.cos(-e),r+n*Math.sin(-e)]);for(let d=0;d<=2*Math.PI;d+=e){const u=[t+i*Math.cos(d),r+n*Math.sin(d)];l.push(u),c.push(u)}c.push([t+i*Math.cos(0),r+n*Math.sin(0)]),c.push([t+i*Math.cos(e),r+n*Math.sin(e)])}else{const d=wt(.5,a)-Math.PI/2;c.push([wt(s,a)+t+.9*i*Math.cos(d-e),wt(s,a)+r+.9*n*Math.sin(d-e)]);const u=2*Math.PI+d-.01;for(let p=d;p<u;p+=e){const f=[wt(s,a)+t+i*Math.cos(p),wt(s,a)+r+n*Math.sin(p)];l.push(f),c.push(f)}c.push([wt(s,a)+t+i*Math.cos(d+2*Math.PI+.5*o),wt(s,a)+r+n*Math.sin(d+2*Math.PI+.5*o)]),c.push([wt(s,a)+t+.98*i*Math.cos(d+o),wt(s,a)+r+.98*n*Math.sin(d+o)]),c.push([wt(s,a)+t+.9*i*Math.cos(d+.5*o),wt(s,a)+r+.9*n*Math.sin(d+.5*o)])}return[c,l]}function Qm(e,t,r,i,n,s,o,a,l){const c=s+wt(.1,l),d=[];d.push([wt(a,l)+t+.9*i*Math.cos(c-e),wt(a,l)+r+.9*n*Math.sin(c-e)]);for(let u=c;u<=o;u+=e)d.push([wt(a,l)+t+i*Math.cos(u),wt(a,l)+r+n*Math.sin(u)]);return d.push([t+i*Math.cos(o),r+n*Math.sin(o)]),d.push([t+i*Math.cos(o),r+n*Math.sin(o)]),tc(d,null,l)}function GR(e,t,r,i,n,s,o,a){const l=[],c=[a.maxRandomnessOffset||1,(a.maxRandomnessOffset||1)+.3];let d=[0,0];const u=a.disableMultiStroke?1:2,p=a.preserveVertices;for(let f=0;f<u;f++)f===0?l.push({op:"move",data:[o[0],o[1]]}):l.push({op:"move",data:[o[0]+(p?0:wt(c[0],a)),o[1]+(p?0:wt(c[0],a))]}),d=p?[n,s]:[n+wt(c[f],a),s+wt(c[f],a)],l.push({op:"bcurveTo",data:[e+wt(c[f],a),t+wt(c[f],a),r+wt(c[f],a),i+wt(c[f],a),d[0],d[1]]});return l}function so(e){return[...e]}function Zm(e,t=0){const r=e.length;if(r<3)throw new Error("A curve must have at least three points.");const i=[];if(r===3)i.push(so(e[0]),so(e[1]),so(e[2]),so(e[2]));else{const n=[];n.push(e[0],e[0]);for(let a=1;a<e.length;a++)n.push(e[a]),a===e.length-1&&n.push(e[a]);const s=[],o=1-t;i.push(so(n[0]));for(let a=1;a+2<n.length;a++){const l=n[a];s[0]=[l[0],l[1]],s[1]=[l[0]+(o*n[a+1][0]-o*n[a-1][0])/6,l[1]+(o*n[a+1][1]-o*n[a-1][1])/6],s[2]=[n[a+1][0]+(o*n[a][0]-o*n[a+2][0])/6,n[a+1][1]+(o*n[a][1]-o*n[a+2][1])/6],s[3]=[n[a+1][0],n[a+1][1]],i.push(s[1],s[2],s[3])}}return i}function ul(e,t){return Math.pow(e[0]-t[0],2)+Math.pow(e[1]-t[1],2)}function YR(e,t,r){const i=ul(t,r);if(i===0)return ul(e,t);let n=((e[0]-t[0])*(r[0]-t[0])+(e[1]-t[1])*(r[1]-t[1]))/i;return n=Math.max(0,Math.min(1,n)),ul(e,Yi(t,r,n))}function Yi(e,t,r){return[e[0]+(t[0]-e[0])*r,e[1]+(t[1]-e[1])*r]}function Su(e,t,r,i){const n=i||[];if(function(a,l){const c=a[l+0],d=a[l+1],u=a[l+2],p=a[l+3];let f=3*d[0]-2*c[0]-p[0];f*=f;let g=3*d[1]-2*c[1]-p[1];g*=g;let x=3*u[0]-2*p[0]-c[0];x*=x;let v=3*u[1]-2*p[1]-c[1];return v*=v,f<x&&(f=x),g<v&&(g=v),f+g}(e,t)<r){const a=e[t+0];n.length?(s=n[n.length-1],o=a,Math.sqrt(ul(s,o))>1&&n.push(a)):n.push(a),n.push(e[t+3])}else{const l=e[t+0],c=e[t+1],d=e[t+2],u=e[t+3],p=Yi(l,c,.5),f=Yi(c,d,.5),g=Yi(d,u,.5),x=Yi(p,f,.5),v=Yi(f,g,.5),y=Yi(x,v,.5);Su([l,p,x,y],0,r,n),Su([y,v,g,u],0,r,n)}var s,o;return n}function XR(e,t){return ec(e,0,e.length,t)}function ec(e,t,r,i,n){const s=n||[],o=e[t],a=e[r-1];let l=0,c=1;for(let d=t+1;d<r-1;++d){const u=YR(e[d],o,a);u>l&&(l=u,c=d)}return Math.sqrt(l)>i?(ec(e,t,c+1,i,s),ec(e,c,r,i,s)):(s.length||s.push(o),s.push(a)),s}function Fh(e,t=.15,r){const i=[],n=(e.length-1)/3;for(let s=0;s<n;s++)Su(e,3*s,t,i);return r&&r>0?ec(i,0,i.length,r):i}const nr="none";class rc{constructor(t){this.defaultOptions={maxRandomnessOffset:2,roughness:1,bowing:1,stroke:"#000",strokeWidth:1,curveTightness:0,curveFitting:.95,curveStepCount:9,fillStyle:"hachure",fillWeight:-1,hachureAngle:-41,hachureGap:-1,dashOffset:-1,dashGap:-1,zigzagOffset:-1,seed:0,disableMultiStroke:!1,disableMultiStrokeFill:!1,preserveVertices:!1,fillShapeRoughnessGain:.8},this.config=t||{},this.config.options&&(this.defaultOptions=this._o(this.config.options))}static newSeed(){return Math.floor(Math.random()*2**31)}_o(t){return t?Object.assign({},this.defaultOptions,t):this.defaultOptions}_d(t,r,i){return{shape:t,sets:r||[],options:i||this.defaultOptions}}line(t,r,i,n,s){const o=this._o(s);return this._d("line",[d2(t,r,i,n,o)],o)}rectangle(t,r,i,n,s){const o=this._o(s),a=[],l=UR(t,r,i,n,o);if(o.fill){const c=[[t,r],[t+i,r],[t+i,r+n],[t,r+n]];o.fillStyle==="solid"?a.push(Dh([c],o)):a.push(On([c],o))}return o.stroke!==nr&&a.push(l),this._d("rectangle",a,o)}ellipse(t,r,i,n,s){const o=this._o(s),a=[],l=u2(i,n,o),c=ku(t,r,o,l);if(o.fill)if(o.fillStyle==="solid"){const d=ku(t,r,o,l).opset;d.type="fillPath",a.push(d)}else a.push(On([c.estimatedPoints],o));return o.stroke!==nr&&a.push(c.opset),this._d("ellipse",a,o)}circle(t,r,i,n){const s=this.ellipse(t,r,i,i,n);return s.shape="circle",s}linearPath(t,r){const i=this._o(r);return this._d("linearPath",[dl(t,!1,i)],i)}arc(t,r,i,n,s,o,a=!1,l){const c=this._o(l),d=[],u=Um(t,r,i,n,s,o,a,!0,c);if(a&&c.fill)if(c.fillStyle==="solid"){const p=Object.assign({},c);p.disableMultiStroke=!0;const f=Um(t,r,i,n,s,o,!0,!1,p);f.type="fillPath",d.push(f)}else d.push(function(p,f,g,x,v,y,b){const w=p,S=f;let _=Math.abs(g/2),A=Math.abs(x/2);_+=wt(.01*_,b),A+=wt(.01*A,b);let C=v,E=y;for(;C<0;)C+=2*Math.PI,E+=2*Math.PI;E-C>2*Math.PI&&(C=0,E=2*Math.PI);const P=(E-C)/b.curveStepCount,z=[];for(let D=C;D<=E;D+=P)z.push([w+_*Math.cos(D),S+A*Math.sin(D)]);return z.push([w+_*Math.cos(E),S+A*Math.sin(E)]),z.push([w,S]),On([z],b)}(t,r,i,n,s,o,c));return c.stroke!==nr&&d.push(u),this._d("arc",d,c)}curve(t,r){const i=this._o(r),n=[],s=Vm(t,i);if(i.fill&&i.fill!==nr)if(i.fillStyle==="solid"){const o=Vm(t,Object.assign(Object.assign({},i),{disableMultiStroke:!0,roughness:i.roughness?i.roughness+i.fillShapeRoughnessGain:0}));n.push({type:"fillPath",ops:this._mergedShape(o.ops)})}else{const o=[],a=t;if(a.length){const l=typeof a[0][0]=="number"?[a]:a;for(const c of l)c.length<3?o.push(...c):c.length===3?o.push(...Fh(Zm([c[0],c[0],c[1],c[2]]),10,(1+i.roughness)/2)):o.push(...Fh(Zm(c),10,(1+i.roughness)/2))}o.length&&n.push(On([o],i))}return i.stroke!==nr&&n.push(s),this._d("curve",n,i)}polygon(t,r){const i=this._o(r),n=[],s=dl(t,!0,i);return i.fill&&(i.fillStyle==="solid"?n.push(Dh([t],i)):n.push(On([t],i))),i.stroke!==nr&&n.push(s),this._d("polygon",n,i)}path(t,r){const i=this._o(r),n=[];if(!t)return this._d("path",n,i);t=(t||"").replace(/\n/g," ").replace(/(-\s)/g,"-").replace("/(ss)/g"," ");const s=i.fill&&i.fill!=="transparent"&&i.fill!==nr,o=i.stroke!==nr,a=!!(i.simplification&&i.simplification<1),l=function(d,u,p){const f=c2(l2(ef(d))),g=[];let x=[],v=[0,0],y=[];const b=()=>{y.length>=4&&x.push(...Fh(y,u)),y=[]},w=()=>{b(),x.length&&(g.push(x),x=[])};for(const{key:_,data:A}of f)switch(_){case"M":w(),v=[A[0],A[1]],x.push(v);break;case"L":b(),x.push([A[0],A[1]]);break;case"C":if(!y.length){const C=x.length?x[x.length-1]:v;y.push([C[0],C[1]])}y.push([A[0],A[1]]),y.push([A[2],A[3]]),y.push([A[4],A[5]]);break;case"Z":b(),x.push([v[0],v[1]])}if(w(),!p)return g;const S=[];for(const _ of g){const A=XR(_,p);A.length&&S.push(A)}return S}(t,1,a?4-4*(i.simplification||1):(1+i.roughness)/2),c=Gm(t,i);if(s)if(i.fillStyle==="solid")if(l.length===1){const d=Gm(t,Object.assign(Object.assign({},i),{disableMultiStroke:!0,roughness:i.roughness?i.roughness+i.fillShapeRoughnessGain:0}));n.push({type:"fillPath",ops:this._mergedShape(d.ops)})}else n.push(Dh(l,i));else n.push(On(l,i));return o&&(a?l.forEach(d=>{n.push(dl(d,!1,i))}):n.push(c)),this._d("path",n,i)}opsToPath(t,r){let i="";for(const n of t.ops){const s=typeof r=="number"&&r>=0?n.data.map(o=>+o.toFixed(r)):n.data;switch(n.op){case"move":i+=`M${s[0]} ${s[1]} `;break;case"bcurveTo":i+=`C${s[0]} ${s[1]}, ${s[2]} ${s[3]}, ${s[4]} ${s[5]} `;break;case"lineTo":i+=`L${s[0]} ${s[1]} `}}return i.trim()}toPaths(t){const r=t.sets||[],i=t.options||this.defaultOptions,n=[];for(const s of r){let o=null;switch(s.type){case"path":o={d:this.opsToPath(s),stroke:i.stroke,strokeWidth:i.strokeWidth,fill:nr};break;case"fillPath":o={d:this.opsToPath(s),stroke:nr,strokeWidth:0,fill:i.fill||nr};break;case"fillSketch":o=this.fillSketch(s,i)}o&&n.push(o)}return n}fillSketch(t,r){let i=r.fillWeight;return i<0&&(i=r.strokeWidth/2),{d:this.opsToPath(t),stroke:r.fill||nr,strokeWidth:i,fill:nr}}_mergedShape(t){return t.filter((r,i)=>i===0||r.op!=="move")}}class QR{constructor(t,r){this.canvas=t,this.ctx=this.canvas.getContext("2d"),this.gen=new rc(r)}draw(t){const r=t.sets||[],i=t.options||this.getDefaultOptions(),n=this.ctx,s=t.options.fixedDecimalPlaceDigits;for(const o of r)switch(o.type){case"path":n.save(),n.strokeStyle=i.stroke==="none"?"transparent":i.stroke,n.lineWidth=i.strokeWidth,i.strokeLineDash&&n.setLineDash(i.strokeLineDash),i.strokeLineDashOffset&&(n.lineDashOffset=i.strokeLineDashOffset),this._drawToContext(n,o,s),n.restore();break;case"fillPath":{n.save(),n.fillStyle=i.fill||"";const a=t.shape==="curve"||t.shape==="polygon"||t.shape==="path"?"evenodd":"nonzero";this._drawToContext(n,o,s,a),n.restore();break}case"fillSketch":this.fillSketch(n,o,i)}}fillSketch(t,r,i){let n=i.fillWeight;n<0&&(n=i.strokeWidth/2),t.save(),i.fillLineDash&&t.setLineDash(i.fillLineDash),i.fillLineDashOffset&&(t.lineDashOffset=i.fillLineDashOffset),t.strokeStyle=i.fill||"",t.lineWidth=n,this._drawToContext(t,r,i.fixedDecimalPlaceDigits),t.restore()}_drawToContext(t,r,i,n="nonzero"){t.beginPath();for(const s of r.ops){const o=typeof i=="number"&&i>=0?s.data.map(a=>+a.toFixed(i)):s.data;switch(s.op){case"move":t.moveTo(o[0],o[1]);break;case"bcurveTo":t.bezierCurveTo(o[0],o[1],o[2],o[3],o[4],o[5]);break;case"lineTo":t.lineTo(o[0],o[1])}}r.type==="fillPath"?t.fill(n):t.stroke()}get generator(){return this.gen}getDefaultOptions(){return this.gen.defaultOptions}line(t,r,i,n,s){const o=this.gen.line(t,r,i,n,s);return this.draw(o),o}rectangle(t,r,i,n,s){const o=this.gen.rectangle(t,r,i,n,s);return this.draw(o),o}ellipse(t,r,i,n,s){const o=this.gen.ellipse(t,r,i,n,s);return this.draw(o),o}circle(t,r,i,n){const s=this.gen.circle(t,r,i,n);return this.draw(s),s}linearPath(t,r){const i=this.gen.linearPath(t,r);return this.draw(i),i}polygon(t,r){const i=this.gen.polygon(t,r);return this.draw(i),i}arc(t,r,i,n,s,o,a=!1,l){const c=this.gen.arc(t,r,i,n,s,o,a,l);return this.draw(c),c}curve(t,r){const i=this.gen.curve(t,r);return this.draw(i),i}path(t,r){const i=this.gen.path(t,r);return this.draw(i),i}}const Fa="http://www.w3.org/2000/svg";class ZR{constructor(t,r){this.svg=t,this.gen=new rc(r)}draw(t){const r=t.sets||[],i=t.options||this.getDefaultOptions(),n=this.svg.ownerDocument||window.document,s=n.createElementNS(Fa,"g"),o=t.options.fixedDecimalPlaceDigits;for(const a of r){let l=null;switch(a.type){case"path":l=n.createElementNS(Fa,"path"),l.setAttribute("d",this.opsToPath(a,o)),l.setAttribute("stroke",i.stroke),l.setAttribute("stroke-width",i.strokeWidth+""),l.setAttribute("fill","none"),i.strokeLineDash&&l.setAttribute("stroke-dasharray",i.strokeLineDash.join(" ").trim()),i.strokeLineDashOffset&&l.setAttribute("stroke-dashoffset",`${i.strokeLineDashOffset}`);break;case"fillPath":l=n.createElementNS(Fa,"path"),l.setAttribute("d",this.opsToPath(a,o)),l.setAttribute("stroke","none"),l.setAttribute("stroke-width","0"),l.setAttribute("fill",i.fill||""),t.shape!=="curve"&&t.shape!=="polygon"||l.setAttribute("fill-rule","evenodd");break;case"fillSketch":l=this.fillSketch(n,a,i)}l&&s.appendChild(l)}return s}fillSketch(t,r,i){let n=i.fillWeight;n<0&&(n=i.strokeWidth/2);const s=t.createElementNS(Fa,"path");return s.setAttribute("d",this.opsToPath(r,i.fixedDecimalPlaceDigits)),s.setAttribute("stroke",i.fill||""),s.setAttribute("stroke-width",n+""),s.setAttribute("fill","none"),i.fillLineDash&&s.setAttribute("stroke-dasharray",i.fillLineDash.join(" ").trim()),i.fillLineDashOffset&&s.setAttribute("stroke-dashoffset",`${i.fillLineDashOffset}`),s}get generator(){return this.gen}getDefaultOptions(){return this.gen.defaultOptions}opsToPath(t,r){return this.gen.opsToPath(t,r)}line(t,r,i,n,s){const o=this.gen.line(t,r,i,n,s);return this.draw(o)}rectangle(t,r,i,n,s){const o=this.gen.rectangle(t,r,i,n,s);return this.draw(o)}ellipse(t,r,i,n,s){const o=this.gen.ellipse(t,r,i,n,s);return this.draw(o)}circle(t,r,i,n){const s=this.gen.circle(t,r,i,n);return this.draw(s)}linearPath(t,r){const i=this.gen.linearPath(t,r);return this.draw(i)}polygon(t,r){const i=this.gen.polygon(t,r);return this.draw(i)}arc(t,r,i,n,s,o,a=!1,l){const c=this.gen.arc(t,r,i,n,s,o,a,l);return this.draw(c)}curve(t,r){const i=this.gen.curve(t,r);return this.draw(i)}path(t,r){const i=this.gen.path(t,r);return this.draw(i)}}var st={canvas:(e,t)=>new QR(e,t),svg:(e,t)=>new ZR(e,t),generator:e=>new rc(e),newSeed:()=>rc.newSeed()},gt=m(async(e,t,r)=>{let i;const n=t.useHtmlLabels||pe(Nt()?.htmlLabels);r?i=r:i="node default";const s=e.insert("g").attr("class",i).attr("id",t.domId||t.id),o=s.insert("g").attr("class","label").attr("style",Ae(t.labelStyle));let a;t.label===void 0?a="":a=typeof t.label=="string"?t.label:t.label[0];const l=await Di(o,vr(_n(a),Nt()),{useHtmlLabels:n,width:t.width||Nt().flowchart?.wrappingWidth,cssClasses:"markdown-node-label",style:t.labelStyle,addSvgBackground:!!t.icon||!!t.img});let c=l.getBBox();const d=(t?.padding??0)/2;if(n){const u=l.children[0],p=Lt(l),f=u.getElementsByTagName("img");if(f){const g=a.replace(/<img[^>]*>/g,"").trim()==="";await Promise.all([...f].map(x=>new Promise(v=>{function y(){if(x.style.display="flex",x.style.flexDirection="column",g){const b=Nt().fontSize?Nt().fontSize:window.getComputedStyle(document.body).fontSize,w=5,[S=Tb.fontSize]=Ic(b),_=S*w+"px";x.style.minWidth=_,x.style.maxWidth=_}else x.style.width="100%";v(x)}m(y,"setupImage"),setTimeout(()=>{x.complete&&y()}),x.addEventListener("error",y),x.addEventListener("load",y)})))}c=u.getBoundingClientRect(),p.attr("width",c.width),p.attr("height",c.height)}return n?o.attr("transform","translate("+-c.width/2+", "+-c.height/2+")"):o.attr("transform","translate(0, "+-c.height/2+")"),t.centerLabel&&o.attr("transform","translate("+-c.width/2+", "+-c.height/2+")"),o.insert("rect",":first-child"),{shapeSvg:s,bbox:c,halfPadding:d,label:o}},"labelHelper"),Ph=m(async(e,t,r)=>{const i=r.useHtmlLabels||pe(Nt()?.flowchart?.htmlLabels),n=e.insert("g").attr("class","label").attr("style",r.labelStyle||""),s=await Di(n,vr(_n(t),Nt()),{useHtmlLabels:i,width:r.width||Nt()?.flowchart?.wrappingWidth,style:r.labelStyle,addSvgBackground:!!r.icon||!!r.img});let o=s.getBBox();const a=r.padding/2;if(pe(Nt()?.flowchart?.htmlLabels)){const l=s.children[0],c=Lt(s);o=l.getBoundingClientRect(),c.attr("width",o.width),c.attr("height",o.height)}return i?n.attr("transform","translate("+-o.width/2+", "+-o.height/2+")"):n.attr("transform","translate(0, "+-o.height/2+")"),r.centerLabel&&n.attr("transform","translate("+-o.width/2+", "+-o.height/2+")"),n.insert("rect",":first-child"),{shapeSvg:e,bbox:o,halfPadding:a,label:n}},"insertLabel"),lt=m((e,t)=>{const r=t.node().getBBox();e.width=r.width,e.height=r.height},"updateNodeBounds"),ft=m((e,t)=>(e.look==="handDrawn"?"rough-node":"node")+" "+e.cssClasses+" "+(t||""),"getNodeClasses");function jt(e){const t=e.map((r,i)=>`${i===0?"M":"L"}${r.x},${r.y}`);return t.push("Z"),t.join(" ")}m(jt,"createPathFromPoints");function Bi(e,t,r,i,n,s){const o=[],l=r-e,c=i-t,d=l/s,u=2*Math.PI/d,p=t+c/2;for(let f=0;f<=50;f++){const g=f/50,x=e+g*l,v=p+n*Math.sin(u*(x-e));o.push({x,y:v})}return o}m(Bi,"generateFullSineWavePoints");function Uo(e,t,r,i,n,s){const o=[],a=n*Math.PI/180,d=(s*Math.PI/180-a)/(i-1);for(let u=0;u<i;u++){const p=a+u*d,f=e+r*Math.cos(p),g=t+r*Math.sin(p);o.push({x:-f,y:-g})}return o}m(Uo,"generateCirclePoints");var JR=m((e,t)=>{var r=e.x,i=e.y,n=t.x-r,s=t.y-i,o=e.width/2,a=e.height/2,l,c;return Math.abs(s)*o>Math.abs(n)*a?(s<0&&(a=-a),l=s===0?0:a*n/s,c=a):(n<0&&(o=-o),l=o,c=n===0?0:o*s/n),{x:r+l,y:i+c}},"intersectRect"),Rs=JR;function f2(e,t){t&&e.attr("style",t)}m(f2,"applyStyle");async function g2(e){const t=Lt(document.createElementNS("http://www.w3.org/2000/svg","foreignObject")),r=t.append("xhtml:div"),i=Nt();let n=e.label;e.label&&xs(e.label)&&(n=await lp(e.label.replace(Bs.lineBreakRegex,`
`),i));const o='<span class="'+(e.isNode?"nodeLabel":"edgeLabel")+'" '+(e.labelStyle?'style="'+e.labelStyle+'"':"")+">"+n+"</span>";return r.html(vr(o,i)),f2(r,e.labelStyle),r.style("display","inline-block"),r.style("padding-right","1px"),r.style("white-space","nowrap"),r.attr("xmlns","http://www.w3.org/1999/xhtml"),t.node()}m(g2,"addHtmlLabel");var KR=m(async(e,t,r,i)=>{let n=e||"";if(typeof n=="object"&&(n=n[0]),pe(Nt().flowchart.htmlLabels)){n=n.replace(/\\n|\n/g,"<br />"),q.info("vertexText"+n);const s={isNode:i,label:_n(n).replace(/fa[blrs]?:fa-[\w-]+/g,a=>`<i class='${a.replace(":"," ")}'></i>`),labelStyle:t&&t.replace("fill:","color:")};return await g2(s)}else{const s=document.createElementNS("http://www.w3.org/2000/svg","text");s.setAttribute("style",t.replace("color:","fill:"));let o=[];typeof n=="string"?o=n.split(/\\n|\n|<br\s*\/?>/gi):Array.isArray(n)?o=n:o=[];for(const a of o){const l=document.createElementNS("http://www.w3.org/2000/svg","tspan");l.setAttributeNS("http://www.w3.org/XML/1998/namespace","xml:space","preserve"),l.setAttribute("dy","1em"),l.setAttribute("x","0"),r?l.setAttribute("class","title-row"):l.setAttribute("class","row"),l.textContent=a.trim(),s.appendChild(l)}return s}},"createLabel"),nn=KR,Fi=m((e,t,r,i,n)=>["M",e+n,t,"H",e+r-n,"A",n,n,0,0,1,e+r,t+n,"V",t+i-n,"A",n,n,0,0,1,e+r-n,t+i,"H",e+n,"A",n,n,0,0,1,e,t+i-n,"V",t+n,"A",n,n,0,0,1,e+n,t,"Z"].join(" "),"createRoundedRectPathD"),m2=m(async(e,t)=>{q.info("Creating subgraph rect for ",t.id,t);const r=Nt(),{themeVariables:i,handDrawnSeed:n}=r,{clusterBkg:s,clusterBorder:o}=i,{labelStyles:a,nodeStyles:l,borderStyles:c,backgroundStyles:d}=at(t),u=e.insert("g").attr("class","cluster "+t.cssClasses).attr("id",t.id).attr("data-look",t.look),p=pe(r.flowchart.htmlLabels),f=u.insert("g").attr("class","cluster-label "),g=await Di(f,t.label,{style:t.labelStyle,useHtmlLabels:p,isNode:!0});let x=g.getBBox();if(pe(r.flowchart.htmlLabels)){const C=g.children[0],E=Lt(g);x=C.getBoundingClientRect(),E.attr("width",x.width),E.attr("height",x.height)}const v=t.width<=x.width+t.padding?x.width+t.padding:t.width;t.width<=x.width+t.padding?t.diff=(v-t.width)/2-t.padding:t.diff=-t.padding;const y=t.height,b=t.x-v/2,w=t.y-y/2;q.trace("Data ",t,JSON.stringify(t));let S;if(t.look==="handDrawn"){const C=st.svg(u),E=ot(t,{roughness:.7,fill:s,stroke:o,fillWeight:3,seed:n}),P=C.path(Fi(b,w,v,y,0),E);S=u.insert(()=>(q.debug("Rough node insert CXC",P),P),":first-child"),S.select("path:nth-child(2)").attr("style",c.join(";")),S.select("path").attr("style",d.join(";").replace("fill","stroke"))}else S=u.insert("rect",":first-child"),S.attr("style",l).attr("rx",t.rx).attr("ry",t.ry).attr("x",b).attr("y",w).attr("width",v).attr("height",y);const{subGraphTitleTopMargin:_}=Mp(r);if(f.attr("transform",`translate(${t.x-x.width/2}, ${t.y-t.height/2+_})`),a){const C=f.select("span");C&&C.attr("style",a)}const A=S.node().getBBox();return t.offsetX=0,t.width=A.width,t.height=A.height,t.offsetY=x.height-t.padding/2,t.intersect=function(C){return Rs(t,C)},{cluster:u,labelBBox:x}},"rect"),tD=m((e,t)=>{const r=e.insert("g").attr("class","note-cluster").attr("id",t.id),i=r.insert("rect",":first-child"),n=0*t.padding,s=n/2;i.attr("rx",t.rx).attr("ry",t.ry).attr("x",t.x-t.width/2-s).attr("y",t.y-t.height/2-s).attr("width",t.width+n).attr("height",t.height+n).attr("fill","none");const o=i.node().getBBox();return t.width=o.width,t.height=o.height,t.intersect=function(a){return Rs(t,a)},{cluster:r,labelBBox:{width:0,height:0}}},"noteGroup"),eD=m(async(e,t)=>{const r=Nt(),{themeVariables:i,handDrawnSeed:n}=r,{altBackground:s,compositeBackground:o,compositeTitleBackground:a,nodeBorder:l}=i,c=e.insert("g").attr("class",t.cssClasses).attr("id",t.id).attr("data-id",t.id).attr("data-look",t.look),d=c.insert("g",":first-child"),u=c.insert("g").attr("class","cluster-label");let p=c.append("rect");const f=u.node().appendChild(await nn(t.label,t.labelStyle,void 0,!0));let g=f.getBBox();if(pe(r.flowchart.htmlLabels)){const P=f.children[0],z=Lt(f);g=P.getBoundingClientRect(),z.attr("width",g.width),z.attr("height",g.height)}const x=0*t.padding,v=x/2,y=(t.width<=g.width+t.padding?g.width+t.padding:t.width)+x;t.width<=g.width+t.padding?t.diff=(y-t.width)/2-t.padding:t.diff=-t.padding;const b=t.height+x,w=t.height+x-g.height-6,S=t.x-y/2,_=t.y-b/2;t.width=y;const A=t.y-t.height/2-v+g.height+2;let C;if(t.look==="handDrawn"){const P=t.cssClasses.includes("statediagram-cluster-alt"),z=st.svg(c),D=t.rx||t.ry?z.path(Fi(S,_,y,b,10),{roughness:.7,fill:a,fillStyle:"solid",stroke:l,seed:n}):z.rectangle(S,_,y,b,{seed:n});C=c.insert(()=>D,":first-child");const V=z.rectangle(S,A,y,w,{fill:P?s:o,fillStyle:P?"hachure":"solid",stroke:l,seed:n});C=c.insert(()=>D,":first-child"),p=c.insert(()=>V)}else C=d.insert("rect",":first-child"),C.attr("class","outer").attr("x",S).attr("y",_).attr("width",y).attr("height",b).attr("data-look",t.look),p.attr("class","inner").attr("x",S).attr("y",A).attr("width",y).attr("height",w);u.attr("transform",`translate(${t.x-g.width/2}, ${_+1-(pe(r.flowchart.htmlLabels)?0:3)})`);const E=C.node().getBBox();return t.height=E.height,t.offsetX=0,t.offsetY=g.height-t.padding/2,t.labelBBox=g,t.intersect=function(P){return Rs(t,P)},{cluster:c,labelBBox:g}},"roundedWithTitle"),rD=m(async(e,t)=>{q.info("Creating subgraph rect for ",t.id,t);const r=Nt(),{themeVariables:i,handDrawnSeed:n}=r,{clusterBkg:s,clusterBorder:o}=i,{labelStyles:a,nodeStyles:l,borderStyles:c,backgroundStyles:d}=at(t),u=e.insert("g").attr("class","cluster "+t.cssClasses).attr("id",t.id).attr("data-look",t.look),p=pe(r.flowchart.htmlLabels),f=u.insert("g").attr("class","cluster-label "),g=await Di(f,t.label,{style:t.labelStyle,useHtmlLabels:p,isNode:!0,width:t.width});let x=g.getBBox();if(pe(r.flowchart.htmlLabels)){const C=g.children[0],E=Lt(g);x=C.getBoundingClientRect(),E.attr("width",x.width),E.attr("height",x.height)}const v=t.width<=x.width+t.padding?x.width+t.padding:t.width;t.width<=x.width+t.padding?t.diff=(v-t.width)/2-t.padding:t.diff=-t.padding;const y=t.height,b=t.x-v/2,w=t.y-y/2;q.trace("Data ",t,JSON.stringify(t));let S;if(t.look==="handDrawn"){const C=st.svg(u),E=ot(t,{roughness:.7,fill:s,stroke:o,fillWeight:4,seed:n}),P=C.path(Fi(b,w,v,y,t.rx),E);S=u.insert(()=>(q.debug("Rough node insert CXC",P),P),":first-child"),S.select("path:nth-child(2)").attr("style",c.join(";")),S.select("path").attr("style",d.join(";").replace("fill","stroke"))}else S=u.insert("rect",":first-child"),S.attr("style",l).attr("rx",t.rx).attr("ry",t.ry).attr("x",b).attr("y",w).attr("width",v).attr("height",y);const{subGraphTitleTopMargin:_}=Mp(r);if(f.attr("transform",`translate(${t.x-x.width/2}, ${t.y-t.height/2+_})`),a){const C=f.select("span");C&&C.attr("style",a)}const A=S.node().getBBox();return t.offsetX=0,t.width=A.width,t.height=A.height,t.offsetY=x.height-t.padding/2,t.intersect=function(C){return Rs(t,C)},{cluster:u,labelBBox:x}},"kanbanSection"),iD=m((e,t)=>{const r=Nt(),{themeVariables:i,handDrawnSeed:n}=r,{nodeBorder:s}=i,o=e.insert("g").attr("class",t.cssClasses).attr("id",t.id).attr("data-look",t.look),a=o.insert("g",":first-child"),l=0*t.padding,c=t.width+l;t.diff=-t.padding;const d=t.height+l,u=t.x-c/2,p=t.y-d/2;t.width=c;let f;if(t.look==="handDrawn"){const v=st.svg(o).rectangle(u,p,c,d,{fill:"lightgrey",roughness:.5,strokeLineDash:[5],stroke:s,seed:n});f=o.insert(()=>v,":first-child")}else f=a.insert("rect",":first-child"),f.attr("class","divider").attr("x",u).attr("y",p).attr("width",c).attr("height",d).attr("data-look",t.look);const g=f.node().getBBox();return t.height=g.height,t.offsetX=0,t.offsetY=0,t.intersect=function(x){return Rs(t,x)},{cluster:o,labelBBox:{}}},"divider"),nD=m2,sD={rect:m2,squareRect:nD,roundedWithTitle:eD,noteGroup:tD,divider:iD,kanbanSection:rD},x2=new Map,oD=m(async(e,t)=>{const r=t.shape||"rect",i=await sD[r](e,t);return x2.set(t.id,i),i},"insertCluster"),D7=m(()=>{x2=new Map},"clear");function b2(e,t){return e.intersect(t)}m(b2,"intersectNode");var aD=b2;function y2(e,t,r,i){var n=e.x,s=e.y,o=n-i.x,a=s-i.y,l=Math.sqrt(t*t*a*a+r*r*o*o),c=Math.abs(t*r*o/l);i.x<n&&(c=-c);var d=Math.abs(t*r*a/l);return i.y<s&&(d=-d),{x:n+c,y:s+d}}m(y2,"intersectEllipse");var v2=y2;function w2(e,t,r){return v2(e,t,t,r)}m(w2,"intersectCircle");var lD=w2;function k2(e,t,r,i){{const n=t.y-e.y,s=e.x-t.x,o=t.x*e.y-e.x*t.y,a=n*r.x+s*r.y+o,l=n*i.x+s*i.y+o,c=1e-6;if(a!==0&&l!==0&&_u(a,l))return;const d=i.y-r.y,u=r.x-i.x,p=i.x*r.y-r.x*i.y,f=d*e.x+u*e.y+p,g=d*t.x+u*t.y+p;if(Math.abs(f)<c&&Math.abs(g)<c&&_u(f,g))return;const x=n*u-d*s;if(x===0)return;const v=Math.abs(x/2);let y=s*p-u*o;const b=y<0?(y-v)/x:(y+v)/x;y=d*o-n*p;const w=y<0?(y-v)/x:(y+v)/x;return{x:b,y:w}}}m(k2,"intersectLine");function _u(e,t){return e*t>0}m(_u,"sameSign");var cD=k2;function C2(e,t,r){let i=e.x,n=e.y,s=[],o=Number.POSITIVE_INFINITY,a=Number.POSITIVE_INFINITY;typeof t.forEach=="function"?t.forEach(function(d){o=Math.min(o,d.x),a=Math.min(a,d.y)}):(o=Math.min(o,t.x),a=Math.min(a,t.y));let l=i-e.width/2-o,c=n-e.height/2-a;for(let d=0;d<t.length;d++){let u=t[d],p=t[d<t.length-1?d+1:0],f=cD(e,r,{x:l+u.x,y:c+u.y},{x:l+p.x,y:c+p.y});f&&s.push(f)}return s.length?(s.length>1&&s.sort(function(d,u){let p=d.x-r.x,f=d.y-r.y,g=Math.sqrt(p*p+f*f),x=u.x-r.x,v=u.y-r.y,y=Math.sqrt(x*x+v*v);return g<y?-1:g===y?0:1}),s[0]):e}m(C2,"intersectPolygon");var hD=C2,tt={node:aD,circle:lD,ellipse:v2,polygon:hD,rect:Rs};function S2(e,t){const{labelStyles:r}=at(t);t.labelStyle=r;const i=ft(t);let n=i;i||(n="anchor");const s=e.insert("g").attr("class",n).attr("id",t.domId||t.id),o=1,{cssStyles:a}=t,l=st.svg(s),c=ot(t,{fill:"black",stroke:"none",fillStyle:"solid"});t.look!=="handDrawn"&&(c.roughness=0);const d=l.circle(0,0,o*2,c),u=s.insert(()=>d,":first-child");return u.attr("class","anchor").attr("style",Ae(a)),lt(t,u),t.intersect=function(p){return q.info("Circle intersect",t,o,p),tt.circle(t,o,p)},s}m(S2,"anchor");function Tu(e,t,r,i,n,s,o){const l=(e+r)/2,c=(t+i)/2,d=Math.atan2(i-t,r-e),u=(r-e)/2,p=(i-t)/2,f=u/n,g=p/s,x=Math.sqrt(f**2+g**2);if(x>1)throw new Error("The given radii are too small to create an arc between the points.");const v=Math.sqrt(1-x**2),y=l+v*s*Math.sin(d)*(o?-1:1),b=c-v*n*Math.cos(d)*(o?-1:1),w=Math.atan2((t-b)/s,(e-y)/n);let _=Math.atan2((i-b)/s,(r-y)/n)-w;o&&_<0&&(_+=2*Math.PI),!o&&_>0&&(_-=2*Math.PI);const A=[];for(let C=0;C<20;C++){const E=C/19,P=w+E*_,z=y+n*Math.cos(P),D=b+s*Math.sin(P);A.push({x:z,y:D})}return A}m(Tu,"generateArcPoints");async function _2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=s.width+t.padding+20,a=s.height+t.padding,l=a/2,c=l/(2.5+a/50),{cssStyles:d}=t,u=[{x:o/2,y:-a/2},{x:-o/2,y:-a/2},...Tu(-o/2,-a/2,-o/2,a/2,c,l,!1),{x:o/2,y:a/2},...Tu(o/2,a/2,o/2,-a/2,c,l,!0)],p=st.svg(n),f=ot(t,{});t.look!=="handDrawn"&&(f.roughness=0,f.fillStyle="solid");const g=jt(u),x=p.path(g,f),v=n.insert(()=>x,":first-child");return v.attr("class","basic label-container"),d&&t.look!=="handDrawn"&&v.selectAll("path").attr("style",d),i&&t.look!=="handDrawn"&&v.selectAll("path").attr("style",i),v.attr("transform",`translate(${c/2}, 0)`),lt(t,v),t.intersect=function(y){return tt.polygon(t,u,y)},n}m(_2,"bowTieRect");function Pi(e,t,r,i){return e.insert("polygon",":first-child").attr("points",i.map(function(n){return n.x+","+n.y}).join(" ")).attr("class","label-container").attr("transform","translate("+-t/2+","+r/2+")")}m(Pi,"insertPolygonShape");async function T2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=s.height+t.padding,a=12,l=s.width+t.padding+a,c=0,d=l,u=-o,p=0,f=[{x:c+a,y:u},{x:d,y:u},{x:d,y:p},{x:c,y:p},{x:c,y:u+a},{x:c+a,y:u}];let g;const{cssStyles:x}=t;if(t.look==="handDrawn"){const v=st.svg(n),y=ot(t,{}),b=jt(f),w=v.path(b,y);g=n.insert(()=>w,":first-child").attr("transform",`translate(${-l/2}, ${o/2})`),x&&g.attr("style",x)}else g=Pi(n,l,o,f);return i&&g.attr("style",i),lt(t,g),t.intersect=function(v){return tt.polygon(t,f,v)},n}m(T2,"card");function $2(e,t){const{nodeStyles:r}=at(t);t.label="";const i=e.insert("g").attr("class",ft(t)).attr("id",t.domId??t.id),{cssStyles:n}=t,s=Math.max(28,t.width??0),o=[{x:0,y:s/2},{x:s/2,y:0},{x:0,y:-s/2},{x:-s/2,y:0}],a=st.svg(i),l=ot(t,{});t.look!=="handDrawn"&&(l.roughness=0,l.fillStyle="solid");const c=jt(o),d=a.path(c,l),u=i.insert(()=>d,":first-child");return n&&t.look!=="handDrawn"&&u.selectAll("path").attr("style",n),r&&t.look!=="handDrawn"&&u.selectAll("path").attr("style",r),t.width=28,t.height=28,t.intersect=function(p){return tt.polygon(t,o,p)},i}m($2,"choice");async function rf(e,t,r){const{labelStyles:i,nodeStyles:n}=at(t);t.labelStyle=i;const{shapeSvg:s,bbox:o,halfPadding:a}=await gt(e,t,ft(t)),l=r?.padding??a,c=o.width/2+l;let d;const{cssStyles:u}=t;if(t.look==="handDrawn"){const p=st.svg(s),f=ot(t,{}),g=p.circle(0,0,c*2,f);d=s.insert(()=>g,":first-child"),d.attr("class","basic label-container").attr("style",Ae(u))}else d=s.insert("circle",":first-child").attr("class","basic label-container").attr("style",n).attr("r",c).attr("cx",0).attr("cy",0);return lt(t,d),t.calcIntersect=function(p,f){const g=p.width/2;return tt.circle(p,g,f)},t.intersect=function(p){return q.info("Circle intersect",t,c,p),tt.circle(t,c,p)},s}m(rf,"circle");function A2(e){const t=Math.cos(Math.PI/4),r=Math.sin(Math.PI/4),i=e*2,n={x:i/2*t,y:i/2*r},s={x:-(i/2)*t,y:i/2*r},o={x:-(i/2)*t,y:-(i/2)*r},a={x:i/2*t,y:-(i/2)*r};return`M ${s.x},${s.y} L ${a.x},${a.y}
                   M ${n.x},${n.y} L ${o.x},${o.y}`}m(A2,"createLine");function j2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r,t.label="";const n=e.insert("g").attr("class",ft(t)).attr("id",t.domId??t.id),s=Math.max(30,t?.width??0),{cssStyles:o}=t,a=st.svg(n),l=ot(t,{});t.look!=="handDrawn"&&(l.roughness=0,l.fillStyle="solid");const c=a.circle(0,0,s*2,l),d=A2(s),u=a.path(d,l),p=n.insert(()=>c,":first-child");return p.insert(()=>u),o&&t.look!=="handDrawn"&&p.selectAll("path").attr("style",o),i&&t.look!=="handDrawn"&&p.selectAll("path").attr("style",i),lt(t,p),t.intersect=function(f){return q.info("crossedCircle intersect",t,{radius:s,point:f}),tt.circle(t,s,f)},n}m(j2,"crossedCircle");function ii(e,t,r,i=100,n=0,s=180){const o=[],a=n*Math.PI/180,d=(s*Math.PI/180-a)/(i-1);for(let u=0;u<i;u++){const p=a+u*d,f=e+r*Math.cos(p),g=t+r*Math.sin(p);o.push({x:-f,y:-g})}return o}m(ii,"generateCirclePoints");async function E2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=s.width+(t.padding??0),l=s.height+(t.padding??0),c=Math.max(5,l*.1),{cssStyles:d}=t,u=[...ii(a/2,-l/2,c,30,-90,0),{x:-a/2-c,y:c},...ii(a/2+c*2,-c,c,20,-180,-270),...ii(a/2+c*2,c,c,20,-90,-180),{x:-a/2-c,y:-l/2},...ii(a/2,l/2,c,20,0,90)],p=[{x:a/2,y:-l/2-c},{x:-a/2,y:-l/2-c},...ii(a/2,-l/2,c,20,-90,0),{x:-a/2-c,y:-c},...ii(a/2+a*.1,-c,c,20,-180,-270),...ii(a/2+a*.1,c,c,20,-90,-180),{x:-a/2-c,y:l/2},...ii(a/2,l/2,c,20,0,90),{x:-a/2,y:l/2+c},{x:a/2,y:l/2+c}],f=st.svg(n),g=ot(t,{fill:"none"});t.look!=="handDrawn"&&(g.roughness=0,g.fillStyle="solid");const v=jt(u).replace("Z",""),y=f.path(v,g),b=jt(p),w=f.path(b,{...g}),S=n.insert("g",":first-child");return S.insert(()=>w,":first-child").attr("stroke-opacity",0),S.insert(()=>y,":first-child"),S.attr("class","text"),d&&t.look!=="handDrawn"&&S.selectAll("path").attr("style",d),i&&t.look!=="handDrawn"&&S.selectAll("path").attr("style",i),S.attr("transform",`translate(${c}, 0)`),o.attr("transform",`translate(${-a/2+c-(s.x-(s.left??0))},${-l/2+(t.padding??0)/2-(s.y-(s.top??0))})`),lt(t,S),t.intersect=function(_){return tt.polygon(t,p,_)},n}m(E2,"curlyBraceLeft");function ni(e,t,r,i=100,n=0,s=180){const o=[],a=n*Math.PI/180,d=(s*Math.PI/180-a)/(i-1);for(let u=0;u<i;u++){const p=a+u*d,f=e+r*Math.cos(p),g=t+r*Math.sin(p);o.push({x:f,y:g})}return o}m(ni,"generateCirclePoints");async function L2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=s.width+(t.padding??0),l=s.height+(t.padding??0),c=Math.max(5,l*.1),{cssStyles:d}=t,u=[...ni(a/2,-l/2,c,20,-90,0),{x:a/2+c,y:-c},...ni(a/2+c*2,-c,c,20,-180,-270),...ni(a/2+c*2,c,c,20,-90,-180),{x:a/2+c,y:l/2},...ni(a/2,l/2,c,20,0,90)],p=[{x:-a/2,y:-l/2-c},{x:a/2,y:-l/2-c},...ni(a/2,-l/2,c,20,-90,0),{x:a/2+c,y:-c},...ni(a/2+c*2,-c,c,20,-180,-270),...ni(a/2+c*2,c,c,20,-90,-180),{x:a/2+c,y:l/2},...ni(a/2,l/2,c,20,0,90),{x:a/2,y:l/2+c},{x:-a/2,y:l/2+c}],f=st.svg(n),g=ot(t,{fill:"none"});t.look!=="handDrawn"&&(g.roughness=0,g.fillStyle="solid");const v=jt(u).replace("Z",""),y=f.path(v,g),b=jt(p),w=f.path(b,{...g}),S=n.insert("g",":first-child");return S.insert(()=>w,":first-child").attr("stroke-opacity",0),S.insert(()=>y,":first-child"),S.attr("class","text"),d&&t.look!=="handDrawn"&&S.selectAll("path").attr("style",d),i&&t.look!=="handDrawn"&&S.selectAll("path").attr("style",i),S.attr("transform",`translate(${-c}, 0)`),o.attr("transform",`translate(${-a/2+(t.padding??0)/2-(s.x-(s.left??0))},${-l/2+(t.padding??0)/2-(s.y-(s.top??0))})`),lt(t,S),t.intersect=function(_){return tt.polygon(t,p,_)},n}m(L2,"curlyBraceRight");function ye(e,t,r,i=100,n=0,s=180){const o=[],a=n*Math.PI/180,d=(s*Math.PI/180-a)/(i-1);for(let u=0;u<i;u++){const p=a+u*d,f=e+r*Math.cos(p),g=t+r*Math.sin(p);o.push({x:-f,y:-g})}return o}m(ye,"generateCirclePoints");async function B2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=s.width+(t.padding??0),l=s.height+(t.padding??0),c=Math.max(5,l*.1),{cssStyles:d}=t,u=[...ye(a/2,-l/2,c,30,-90,0),{x:-a/2-c,y:c},...ye(a/2+c*2,-c,c,20,-180,-270),...ye(a/2+c*2,c,c,20,-90,-180),{x:-a/2-c,y:-l/2},...ye(a/2,l/2,c,20,0,90)],p=[...ye(-a/2+c+c/2,-l/2,c,20,-90,-180),{x:a/2-c/2,y:c},...ye(-a/2-c/2,-c,c,20,0,90),...ye(-a/2-c/2,c,c,20,-90,0),{x:a/2-c/2,y:-c},...ye(-a/2+c+c/2,l/2,c,30,-180,-270)],f=[{x:a/2,y:-l/2-c},{x:-a/2,y:-l/2-c},...ye(a/2,-l/2,c,20,-90,0),{x:-a/2-c,y:-c},...ye(a/2+c*2,-c,c,20,-180,-270),...ye(a/2+c*2,c,c,20,-90,-180),{x:-a/2-c,y:l/2},...ye(a/2,l/2,c,20,0,90),{x:-a/2,y:l/2+c},{x:a/2-c-c/2,y:l/2+c},...ye(-a/2+c+c/2,-l/2,c,20,-90,-180),{x:a/2-c/2,y:c},...ye(-a/2-c/2,-c,c,20,0,90),...ye(-a/2-c/2,c,c,20,-90,0),{x:a/2-c/2,y:-c},...ye(-a/2+c+c/2,l/2,c,30,-180,-270)],g=st.svg(n),x=ot(t,{fill:"none"});t.look!=="handDrawn"&&(x.roughness=0,x.fillStyle="solid");const y=jt(u).replace("Z",""),b=g.path(y,x),S=jt(p).replace("Z",""),_=g.path(S,x),A=jt(f),C=g.path(A,{...x}),E=n.insert("g",":first-child");return E.insert(()=>C,":first-child").attr("stroke-opacity",0),E.insert(()=>b,":first-child"),E.insert(()=>_,":first-child"),E.attr("class","text"),d&&t.look!=="handDrawn"&&E.selectAll("path").attr("style",d),i&&t.look!=="handDrawn"&&E.selectAll("path").attr("style",i),E.attr("transform",`translate(${c-c/4}, 0)`),o.attr("transform",`translate(${-a/2+(t.padding??0)/2-(s.x-(s.left??0))},${-l/2+(t.padding??0)/2-(s.y-(s.top??0))})`),lt(t,E),t.intersect=function(P){return tt.polygon(t,f,P)},n}m(B2,"curlyBraces");async function M2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=80,a=20,l=Math.max(o,(s.width+(t.padding??0)*2)*1.25,t?.width??0),c=Math.max(a,s.height+(t.padding??0)*2,t?.height??0),d=c/2,{cssStyles:u}=t,p=st.svg(n),f=ot(t,{});t.look!=="handDrawn"&&(f.roughness=0,f.fillStyle="solid");const g=l,x=c,v=g-d,y=x/4,b=[{x:v,y:0},{x:y,y:0},{x:0,y:x/2},{x:y,y:x},{x:v,y:x},...Uo(-v,-x/2,d,50,270,90)],w=jt(b),S=p.path(w,f),_=n.insert(()=>S,":first-child");return _.attr("class","basic label-container"),u&&t.look!=="handDrawn"&&_.selectChildren("path").attr("style",u),i&&t.look!=="handDrawn"&&_.selectChildren("path").attr("style",i),_.attr("transform",`translate(${-l/2}, ${-c/2})`),lt(t,_),t.intersect=function(A){return tt.polygon(t,b,A)},n}m(M2,"curvedTrapezoid");var dD=m((e,t,r,i,n,s)=>[`M${e},${t+s}`,`a${n},${s} 0,0,0 ${r},0`,`a${n},${s} 0,0,0 ${-r},0`,`l0,${i}`,`a${n},${s} 0,0,0 ${r},0`,`l0,${-i}`].join(" "),"createCylinderPathD"),uD=m((e,t,r,i,n,s)=>[`M${e},${t+s}`,`M${e+r},${t+s}`,`a${n},${s} 0,0,0 ${-r},0`,`l0,${i}`,`a${n},${s} 0,0,0 ${r},0`,`l0,${-i}`].join(" "),"createOuterCylinderPathD"),pD=m((e,t,r,i,n,s)=>[`M${e-r/2},${-i/2}`,`a${n},${s} 0,0,0 ${r},0`].join(" "),"createInnerCylinderPathD");async function I2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=Math.max(s.width+t.padding,t.width??0),l=a/2,c=l/(2.5+a/50),d=Math.max(s.height+c+t.padding,t.height??0);let u;const{cssStyles:p}=t;if(t.look==="handDrawn"){const f=st.svg(n),g=uD(0,0,a,d,l,c),x=pD(0,c,a,d,l,c),v=f.path(g,ot(t,{})),y=f.path(x,ot(t,{fill:"none"}));u=n.insert(()=>y,":first-child"),u=n.insert(()=>v,":first-child"),u.attr("class","basic label-container"),p&&u.attr("style",p)}else{const f=dD(0,0,a,d,l,c);u=n.insert("path",":first-child").attr("d",f).attr("class","basic label-container").attr("style",Ae(p)).attr("style",i)}return u.attr("label-offset-y",c),u.attr("transform",`translate(${-a/2}, ${-(d/2+c)})`),lt(t,u),o.attr("transform",`translate(${-(s.width/2)-(s.x-(s.left??0))}, ${-(s.height/2)+(t.padding??0)/1.5-(s.y-(s.top??0))})`),t.intersect=function(f){const g=tt.rect(t,f),x=g.x-(t.x??0);if(l!=0&&(Math.abs(x)<(t.width??0)/2||Math.abs(x)==(t.width??0)/2&&Math.abs(g.y-(t.y??0))>(t.height??0)/2-c)){let v=c*c*(1-x*x/(l*l));v>0&&(v=Math.sqrt(v)),v=c-v,f.y-(t.y??0)>0&&(v=-v),g.y+=v}return g},n}m(I2,"cylinder");async function O2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=s.width+t.padding,l=s.height+t.padding,c=l*.2,d=-a/2,u=-l/2-c/2,{cssStyles:p}=t,f=st.svg(n),g=ot(t,{});t.look!=="handDrawn"&&(g.roughness=0,g.fillStyle="solid");const x=[{x:d,y:u+c},{x:-d,y:u+c},{x:-d,y:-u},{x:d,y:-u},{x:d,y:u},{x:-d,y:u},{x:-d,y:u+c}],v=f.polygon(x.map(b=>[b.x,b.y]),g),y=n.insert(()=>v,":first-child");return y.attr("class","basic label-container"),p&&t.look!=="handDrawn"&&y.selectAll("path").attr("style",p),i&&t.look!=="handDrawn"&&y.selectAll("path").attr("style",i),o.attr("transform",`translate(${d+(t.padding??0)/2-(s.x-(s.left??0))}, ${u+c+(t.padding??0)/2-(s.y-(s.top??0))})`),lt(t,y),t.intersect=function(b){return tt.rect(t,b)},n}m(O2,"dividedRectangle");async function R2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,halfPadding:o}=await gt(e,t,ft(t)),l=s.width/2+o+5,c=s.width/2+o;let d;const{cssStyles:u}=t;if(t.look==="handDrawn"){const p=st.svg(n),f=ot(t,{roughness:.2,strokeWidth:2.5}),g=ot(t,{roughness:.2,strokeWidth:1.5}),x=p.circle(0,0,l*2,f),v=p.circle(0,0,c*2,g);d=n.insert("g",":first-child"),d.attr("class",Ae(t.cssClasses)).attr("style",Ae(u)),d.node()?.appendChild(x),d.node()?.appendChild(v)}else{d=n.insert("g",":first-child");const p=d.insert("circle",":first-child"),f=d.insert("circle");d.attr("class","basic label-container").attr("style",i),p.attr("class","outer-circle").attr("style",i).attr("r",l).attr("cx",0).attr("cy",0),f.attr("class","inner-circle").attr("style",i).attr("r",c).attr("cx",0).attr("cy",0)}return lt(t,d),t.intersect=function(p){return q.info("DoubleCircle intersect",t,l,p),tt.circle(t,l,p)},n}m(R2,"doublecircle");function D2(e,t,{config:{themeVariables:r}}){const{labelStyles:i,nodeStyles:n}=at(t);t.label="",t.labelStyle=i;const s=e.insert("g").attr("class",ft(t)).attr("id",t.domId??t.id),o=7,{cssStyles:a}=t,l=st.svg(s),{nodeBorder:c}=r,d=ot(t,{fillStyle:"solid"});t.look!=="handDrawn"&&(d.roughness=0);const u=l.circle(0,0,o*2,d),p=s.insert(()=>u,":first-child");return p.selectAll("path").attr("style",`fill: ${c} !important;`),a&&a.length>0&&t.look!=="handDrawn"&&p.selectAll("path").attr("style",a),n&&t.look!=="handDrawn"&&p.selectAll("path").attr("style",n),lt(t,p),t.intersect=function(f){return q.info("filledCircle intersect",t,{radius:o,point:f}),tt.circle(t,o,f)},s}m(D2,"filledCircle");async function F2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=s.width+(t.padding??0),l=a+s.height,c=a+s.height,d=[{x:0,y:-l},{x:c,y:-l},{x:c/2,y:0}],{cssStyles:u}=t,p=st.svg(n),f=ot(t,{});t.look!=="handDrawn"&&(f.roughness=0,f.fillStyle="solid");const g=jt(d),x=p.path(g,f),v=n.insert(()=>x,":first-child").attr("transform",`translate(${-l/2}, ${l/2})`);return u&&t.look!=="handDrawn"&&v.selectChildren("path").attr("style",u),i&&t.look!=="handDrawn"&&v.selectChildren("path").attr("style",i),t.width=a,t.height=l,lt(t,v),o.attr("transform",`translate(${-s.width/2-(s.x-(s.left??0))}, ${-l/2+(t.padding??0)/2+(s.y-(s.top??0))})`),t.intersect=function(y){return q.info("Triangle intersect",t,d,y),tt.polygon(t,d,y)},n}m(F2,"flippedTriangle");function P2(e,t,{dir:r,config:{state:i,themeVariables:n}}){const{nodeStyles:s}=at(t);t.label="";const o=e.insert("g").attr("class",ft(t)).attr("id",t.domId??t.id),{cssStyles:a}=t;let l=Math.max(70,t?.width??0),c=Math.max(10,t?.height??0);r==="LR"&&(l=Math.max(10,t?.width??0),c=Math.max(70,t?.height??0));const d=-1*l/2,u=-1*c/2,p=st.svg(o),f=ot(t,{stroke:n.lineColor,fill:n.lineColor});t.look!=="handDrawn"&&(f.roughness=0,f.fillStyle="solid");const g=p.rectangle(d,u,l,c,f),x=o.insert(()=>g,":first-child");a&&t.look!=="handDrawn"&&x.selectAll("path").attr("style",a),s&&t.look!=="handDrawn"&&x.selectAll("path").attr("style",s),lt(t,x);const v=i?.padding??0;return t.width&&t.height&&(t.width+=v/2||0,t.height+=v/2||0),t.intersect=function(y){return tt.rect(t,y)},o}m(P2,"forkJoin");async function N2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const n=80,s=50,{shapeSvg:o,bbox:a}=await gt(e,t,ft(t)),l=Math.max(n,a.width+(t.padding??0)*2,t?.width??0),c=Math.max(s,a.height+(t.padding??0)*2,t?.height??0),d=c/2,{cssStyles:u}=t,p=st.svg(o),f=ot(t,{});t.look!=="handDrawn"&&(f.roughness=0,f.fillStyle="solid");const g=[{x:-l/2,y:-c/2},{x:l/2-d,y:-c/2},...Uo(-l/2+d,0,d,50,90,270),{x:l/2-d,y:c/2},{x:-l/2,y:c/2}],x=jt(g),v=p.path(x,f),y=o.insert(()=>v,":first-child");return y.attr("class","basic label-container"),u&&t.look!=="handDrawn"&&y.selectChildren("path").attr("style",u),i&&t.look!=="handDrawn"&&y.selectChildren("path").attr("style",i),lt(t,y),t.intersect=function(b){return q.info("Pill intersect",t,{radius:d,point:b}),tt.polygon(t,g,b)},o}m(N2,"halfRoundedRectangle");async function z2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=s.height+(t.padding??0),a=s.width+(t.padding??0)*2.5,{cssStyles:l}=t,c=st.svg(n),d=ot(t,{});t.look!=="handDrawn"&&(d.roughness=0,d.fillStyle="solid");let u=a/2;const p=u/6;u=u+p;const f=o/2,g=f/2,x=u-g,v=[{x:-x,y:-f},{x:0,y:-f},{x,y:-f},{x:u,y:0},{x,y:f},{x:0,y:f},{x:-x,y:f},{x:-u,y:0}],y=jt(v),b=c.path(y,d),w=n.insert(()=>b,":first-child");return w.attr("class","basic label-container"),l&&t.look!=="handDrawn"&&w.selectChildren("path").attr("style",l),i&&t.look!=="handDrawn"&&w.selectChildren("path").attr("style",i),t.width=a,t.height=o,lt(t,w),t.intersect=function(S){return tt.polygon(t,v,S)},n}m(z2,"hexagon");async function H2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.label="",t.labelStyle=r;const{shapeSvg:n}=await gt(e,t,ft(t)),s=Math.max(30,t?.width??0),o=Math.max(30,t?.height??0),{cssStyles:a}=t,l=st.svg(n),c=ot(t,{});t.look!=="handDrawn"&&(c.roughness=0,c.fillStyle="solid");const d=[{x:0,y:0},{x:s,y:0},{x:0,y:o},{x:s,y:o}],u=jt(d),p=l.path(u,c),f=n.insert(()=>p,":first-child");return f.attr("class","basic label-container"),a&&t.look!=="handDrawn"&&f.selectChildren("path").attr("style",a),i&&t.look!=="handDrawn"&&f.selectChildren("path").attr("style",i),f.attr("transform",`translate(${-s/2}, ${-o/2})`),lt(t,f),t.intersect=function(g){return q.info("Pill intersect",t,{points:d}),tt.polygon(t,d,g)},n}m(H2,"hourglass");async function q2(e,t,{config:{themeVariables:r,flowchart:i}}){const{labelStyles:n}=at(t);t.labelStyle=n;const s=t.assetHeight??48,o=t.assetWidth??48,a=Math.max(s,o),l=i?.wrappingWidth;t.width=Math.max(a,l??0);const{shapeSvg:c,bbox:d,label:u}=await gt(e,t,"icon-shape default"),p=t.pos==="t",f=a,g=a,{nodeBorder:x}=r,{stylesMap:v}=Ms(t),y=-g/2,b=-f/2,w=t.label?8:0,S=st.svg(c),_=ot(t,{stroke:"none",fill:"none"});t.look!=="handDrawn"&&(_.roughness=0,_.fillStyle="solid");const A=S.rectangle(y,b,g,f,_),C=Math.max(g,d.width),E=f+d.height+w,P=S.rectangle(-C/2,-E/2,C,E,{..._,fill:"transparent",stroke:"none"}),z=c.insert(()=>A,":first-child"),D=c.insert(()=>P);if(t.icon){const V=c.append("g");V.html(`<g>${await pa(t.icon,{height:a,width:a,fallbackPrefix:""})}</g>`);const H=V.node().getBBox(),O=H.width,R=H.height,T=H.x,L=H.y;V.attr("transform",`translate(${-O/2-T},${p?d.height/2+w/2-R/2-L:-d.height/2-w/2-R/2-L})`),V.attr("style",`color: ${v.get("stroke")??x};`)}return u.attr("transform",`translate(${-d.width/2-(d.x-(d.left??0))},${p?-E/2:E/2-d.height})`),z.attr("transform",`translate(0,${p?d.height/2+w/2:-d.height/2-w/2})`),lt(t,D),t.intersect=function(V){if(q.info("iconSquare intersect",t,V),!t.label)return tt.rect(t,V);const H=t.x??0,O=t.y??0,R=t.height??0;let T=[];return p?T=[{x:H-d.width/2,y:O-R/2},{x:H+d.width/2,y:O-R/2},{x:H+d.width/2,y:O-R/2+d.height+w},{x:H+g/2,y:O-R/2+d.height+w},{x:H+g/2,y:O+R/2},{x:H-g/2,y:O+R/2},{x:H-g/2,y:O-R/2+d.height+w},{x:H-d.width/2,y:O-R/2+d.height+w}]:T=[{x:H-g/2,y:O-R/2},{x:H+g/2,y:O-R/2},{x:H+g/2,y:O-R/2+f},{x:H+d.width/2,y:O-R/2+f},{x:H+d.width/2/2,y:O+R/2},{x:H-d.width/2,y:O+R/2},{x:H-d.width/2,y:O-R/2+f},{x:H-g/2,y:O-R/2+f}],tt.polygon(t,T,V)},c}m(q2,"icon");async function W2(e,t,{config:{themeVariables:r,flowchart:i}}){const{labelStyles:n}=at(t);t.labelStyle=n;const s=t.assetHeight??48,o=t.assetWidth??48,a=Math.max(s,o),l=i?.wrappingWidth;t.width=Math.max(a,l??0);const{shapeSvg:c,bbox:d,label:u}=await gt(e,t,"icon-shape default"),p=20,f=t.label?8:0,g=t.pos==="t",{nodeBorder:x,mainBkg:v}=r,{stylesMap:y}=Ms(t),b=st.svg(c),w=ot(t,{});t.look!=="handDrawn"&&(w.roughness=0,w.fillStyle="solid");const S=y.get("fill");w.stroke=S??v;const _=c.append("g");t.icon&&_.html(`<g>${await pa(t.icon,{height:a,width:a,fallbackPrefix:""})}</g>`);const A=_.node().getBBox(),C=A.width,E=A.height,P=A.x,z=A.y,D=Math.max(C,E)*Math.SQRT2+p*2,V=b.circle(0,0,D,w),H=Math.max(D,d.width),O=D+d.height+f,R=b.rectangle(-H/2,-O/2,H,O,{...w,fill:"transparent",stroke:"none"}),T=c.insert(()=>V,":first-child"),L=c.insert(()=>R);return _.attr("transform",`translate(${-C/2-P},${g?d.height/2+f/2-E/2-z:-d.height/2-f/2-E/2-z})`),_.attr("style",`color: ${y.get("stroke")??x};`),u.attr("transform",`translate(${-d.width/2-(d.x-(d.left??0))},${g?-O/2:O/2-d.height})`),T.attr("transform",`translate(0,${g?d.height/2+f/2:-d.height/2-f/2})`),lt(t,L),t.intersect=function($){return q.info("iconSquare intersect",t,$),tt.rect(t,$)},c}m(W2,"iconCircle");async function V2(e,t,{config:{themeVariables:r,flowchart:i}}){const{labelStyles:n}=at(t);t.labelStyle=n;const s=t.assetHeight??48,o=t.assetWidth??48,a=Math.max(s,o),l=i?.wrappingWidth;t.width=Math.max(a,l??0);const{shapeSvg:c,bbox:d,halfPadding:u,label:p}=await gt(e,t,"icon-shape default"),f=t.pos==="t",g=a+u*2,x=a+u*2,{nodeBorder:v,mainBkg:y}=r,{stylesMap:b}=Ms(t),w=-x/2,S=-g/2,_=t.label?8:0,A=st.svg(c),C=ot(t,{});t.look!=="handDrawn"&&(C.roughness=0,C.fillStyle="solid");const E=b.get("fill");C.stroke=E??y;const P=A.path(Fi(w,S,x,g,5),C),z=Math.max(x,d.width),D=g+d.height+_,V=A.rectangle(-z/2,-D/2,z,D,{...C,fill:"transparent",stroke:"none"}),H=c.insert(()=>P,":first-child").attr("class","icon-shape2"),O=c.insert(()=>V);if(t.icon){const R=c.append("g");R.html(`<g>${await pa(t.icon,{height:a,width:a,fallbackPrefix:""})}</g>`);const T=R.node().getBBox(),L=T.width,$=T.height,N=T.x,G=T.y;R.attr("transform",`translate(${-L/2-N},${f?d.height/2+_/2-$/2-G:-d.height/2-_/2-$/2-G})`),R.attr("style",`color: ${b.get("stroke")??v};`)}return p.attr("transform",`translate(${-d.width/2-(d.x-(d.left??0))},${f?-D/2:D/2-d.height})`),H.attr("transform",`translate(0,${f?d.height/2+_/2:-d.height/2-_/2})`),lt(t,O),t.intersect=function(R){if(q.info("iconSquare intersect",t,R),!t.label)return tt.rect(t,R);const T=t.x??0,L=t.y??0,$=t.height??0;let N=[];return f?N=[{x:T-d.width/2,y:L-$/2},{x:T+d.width/2,y:L-$/2},{x:T+d.width/2,y:L-$/2+d.height+_},{x:T+x/2,y:L-$/2+d.height+_},{x:T+x/2,y:L+$/2},{x:T-x/2,y:L+$/2},{x:T-x/2,y:L-$/2+d.height+_},{x:T-d.width/2,y:L-$/2+d.height+_}]:N=[{x:T-x/2,y:L-$/2},{x:T+x/2,y:L-$/2},{x:T+x/2,y:L-$/2+g},{x:T+d.width/2,y:L-$/2+g},{x:T+d.width/2/2,y:L+$/2},{x:T-d.width/2,y:L+$/2},{x:T-d.width/2,y:L-$/2+g},{x:T-x/2,y:L-$/2+g}],tt.polygon(t,N,R)},c}m(V2,"iconRounded");async function U2(e,t,{config:{themeVariables:r,flowchart:i}}){const{labelStyles:n}=at(t);t.labelStyle=n;const s=t.assetHeight??48,o=t.assetWidth??48,a=Math.max(s,o),l=i?.wrappingWidth;t.width=Math.max(a,l??0);const{shapeSvg:c,bbox:d,halfPadding:u,label:p}=await gt(e,t,"icon-shape default"),f=t.pos==="t",g=a+u*2,x=a+u*2,{nodeBorder:v,mainBkg:y}=r,{stylesMap:b}=Ms(t),w=-x/2,S=-g/2,_=t.label?8:0,A=st.svg(c),C=ot(t,{});t.look!=="handDrawn"&&(C.roughness=0,C.fillStyle="solid");const E=b.get("fill");C.stroke=E??y;const P=A.path(Fi(w,S,x,g,.1),C),z=Math.max(x,d.width),D=g+d.height+_,V=A.rectangle(-z/2,-D/2,z,D,{...C,fill:"transparent",stroke:"none"}),H=c.insert(()=>P,":first-child"),O=c.insert(()=>V);if(t.icon){const R=c.append("g");R.html(`<g>${await pa(t.icon,{height:a,width:a,fallbackPrefix:""})}</g>`);const T=R.node().getBBox(),L=T.width,$=T.height,N=T.x,G=T.y;R.attr("transform",`translate(${-L/2-N},${f?d.height/2+_/2-$/2-G:-d.height/2-_/2-$/2-G})`),R.attr("style",`color: ${b.get("stroke")??v};`)}return p.attr("transform",`translate(${-d.width/2-(d.x-(d.left??0))},${f?-D/2:D/2-d.height})`),H.attr("transform",`translate(0,${f?d.height/2+_/2:-d.height/2-_/2})`),lt(t,O),t.intersect=function(R){if(q.info("iconSquare intersect",t,R),!t.label)return tt.rect(t,R);const T=t.x??0,L=t.y??0,$=t.height??0;let N=[];return f?N=[{x:T-d.width/2,y:L-$/2},{x:T+d.width/2,y:L-$/2},{x:T+d.width/2,y:L-$/2+d.height+_},{x:T+x/2,y:L-$/2+d.height+_},{x:T+x/2,y:L+$/2},{x:T-x/2,y:L+$/2},{x:T-x/2,y:L-$/2+d.height+_},{x:T-d.width/2,y:L-$/2+d.height+_}]:N=[{x:T-x/2,y:L-$/2},{x:T+x/2,y:L-$/2},{x:T+x/2,y:L-$/2+g},{x:T+d.width/2,y:L-$/2+g},{x:T+d.width/2/2,y:L+$/2},{x:T-d.width/2,y:L+$/2},{x:T-d.width/2,y:L-$/2+g},{x:T-x/2,y:L-$/2+g}],tt.polygon(t,N,R)},c}m(U2,"iconSquare");async function G2(e,t,{config:{flowchart:r}}){const i=new Image;i.src=t?.img??"",await i.decode();const n=Number(i.naturalWidth.toString().replace("px","")),s=Number(i.naturalHeight.toString().replace("px",""));t.imageAspectRatio=n/s;const{labelStyles:o}=at(t);t.labelStyle=o;const a=r?.wrappingWidth;t.defaultWidth=r?.wrappingWidth;const l=Math.max(t.label?a??0:0,t?.assetWidth??n),c=t.constraint==="on"&&t?.assetHeight?t.assetHeight*t.imageAspectRatio:l,d=t.constraint==="on"?c/t.imageAspectRatio:t?.assetHeight??s;t.width=Math.max(c,a??0);const{shapeSvg:u,bbox:p,label:f}=await gt(e,t,"image-shape default"),g=t.pos==="t",x=-c/2,v=-d/2,y=t.label?8:0,b=st.svg(u),w=ot(t,{});t.look!=="handDrawn"&&(w.roughness=0,w.fillStyle="solid");const S=b.rectangle(x,v,c,d,w),_=Math.max(c,p.width),A=d+p.height+y,C=b.rectangle(-_/2,-A/2,_,A,{...w,fill:"none",stroke:"none"}),E=u.insert(()=>S,":first-child"),P=u.insert(()=>C);if(t.img){const z=u.append("image");z.attr("href",t.img),z.attr("width",c),z.attr("height",d),z.attr("preserveAspectRatio","none"),z.attr("transform",`translate(${-c/2},${g?A/2-d:-A/2})`)}return f.attr("transform",`translate(${-p.width/2-(p.x-(p.left??0))},${g?-d/2-p.height/2-y/2:d/2-p.height/2+y/2})`),E.attr("transform",`translate(0,${g?p.height/2+y/2:-p.height/2-y/2})`),lt(t,P),t.intersect=function(z){if(q.info("iconSquare intersect",t,z),!t.label)return tt.rect(t,z);const D=t.x??0,V=t.y??0,H=t.height??0;let O=[];return g?O=[{x:D-p.width/2,y:V-H/2},{x:D+p.width/2,y:V-H/2},{x:D+p.width/2,y:V-H/2+p.height+y},{x:D+c/2,y:V-H/2+p.height+y},{x:D+c/2,y:V+H/2},{x:D-c/2,y:V+H/2},{x:D-c/2,y:V-H/2+p.height+y},{x:D-p.width/2,y:V-H/2+p.height+y}]:O=[{x:D-c/2,y:V-H/2},{x:D+c/2,y:V-H/2},{x:D+c/2,y:V-H/2+d},{x:D+p.width/2,y:V-H/2+d},{x:D+p.width/2/2,y:V+H/2},{x:D-p.width/2,y:V+H/2},{x:D-p.width/2,y:V-H/2+d},{x:D-c/2,y:V-H/2+d}],tt.polygon(t,O,z)},u}m(G2,"imageSquare");async function Y2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=Math.max(s.width+(t.padding??0)*2,t?.width??0),a=Math.max(s.height+(t.padding??0)*2,t?.height??0),l=[{x:0,y:0},{x:o,y:0},{x:o+3*a/6,y:-a},{x:-3*a/6,y:-a}];let c;const{cssStyles:d}=t;if(t.look==="handDrawn"){const u=st.svg(n),p=ot(t,{}),f=jt(l),g=u.path(f,p);c=n.insert(()=>g,":first-child").attr("transform",`translate(${-o/2}, ${a/2})`),d&&c.attr("style",d)}else c=Pi(n,o,a,l);return i&&c.attr("style",i),t.width=o,t.height=a,lt(t,c),t.intersect=function(u){return tt.polygon(t,l,u)},n}m(Y2,"inv_trapezoid");async function Nc(e,t,r){const{labelStyles:i,nodeStyles:n}=at(t);t.labelStyle=i;const{shapeSvg:s,bbox:o}=await gt(e,t,ft(t)),a=Math.max(o.width+r.labelPaddingX*2,t?.width||0),l=Math.max(o.height+r.labelPaddingY*2,t?.height||0),c=-a/2,d=-l/2;let u,{rx:p,ry:f}=t;const{cssStyles:g}=t;if(r?.rx&&r.ry&&(p=r.rx,f=r.ry),t.look==="handDrawn"){const x=st.svg(s),v=ot(t,{}),y=p||f?x.path(Fi(c,d,a,l,p||0),v):x.rectangle(c,d,a,l,v);u=s.insert(()=>y,":first-child"),u.attr("class","basic label-container").attr("style",Ae(g))}else u=s.insert("rect",":first-child"),u.attr("class","basic label-container").attr("style",n).attr("rx",Ae(p)).attr("ry",Ae(f)).attr("x",c).attr("y",d).attr("width",a).attr("height",l);return lt(t,u),t.calcIntersect=function(x,v){return tt.rect(x,v)},t.intersect=function(x){return tt.rect(t,x)},s}m(Nc,"drawRect");async function X2(e,t){const{shapeSvg:r,bbox:i,label:n}=await gt(e,t,"label"),s=r.insert("rect",":first-child");return s.attr("width",.1).attr("height",.1),r.attr("class","label edgeLabel"),n.attr("transform",`translate(${-(i.width/2)-(i.x-(i.left??0))}, ${-(i.height/2)-(i.y-(i.top??0))})`),lt(t,s),t.intersect=function(l){return tt.rect(t,l)},r}m(X2,"labelRect");async function Q2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=Math.max(s.width+(t.padding??0),t?.width??0),a=Math.max(s.height+(t.padding??0),t?.height??0),l=[{x:0,y:0},{x:o+3*a/6,y:0},{x:o,y:-a},{x:-(3*a)/6,y:-a}];let c;const{cssStyles:d}=t;if(t.look==="handDrawn"){const u=st.svg(n),p=ot(t,{}),f=jt(l),g=u.path(f,p);c=n.insert(()=>g,":first-child").attr("transform",`translate(${-o/2}, ${a/2})`),d&&c.attr("style",d)}else c=Pi(n,o,a,l);return i&&c.attr("style",i),t.width=o,t.height=a,lt(t,c),t.intersect=function(u){return tt.polygon(t,l,u)},n}m(Q2,"lean_left");async function Z2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=Math.max(s.width+(t.padding??0),t?.width??0),a=Math.max(s.height+(t.padding??0),t?.height??0),l=[{x:-3*a/6,y:0},{x:o,y:0},{x:o+3*a/6,y:-a},{x:0,y:-a}];let c;const{cssStyles:d}=t;if(t.look==="handDrawn"){const u=st.svg(n),p=ot(t,{}),f=jt(l),g=u.path(f,p);c=n.insert(()=>g,":first-child").attr("transform",`translate(${-o/2}, ${a/2})`),d&&c.attr("style",d)}else c=Pi(n,o,a,l);return i&&c.attr("style",i),t.width=o,t.height=a,lt(t,c),t.intersect=function(u){return tt.polygon(t,l,u)},n}m(Z2,"lean_right");function J2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.label="",t.labelStyle=r;const n=e.insert("g").attr("class",ft(t)).attr("id",t.domId??t.id),{cssStyles:s}=t,o=Math.max(35,t?.width??0),a=Math.max(35,t?.height??0),l=7,c=[{x:o,y:0},{x:0,y:a+l/2},{x:o-2*l,y:a+l/2},{x:0,y:2*a},{x:o,y:a-l/2},{x:2*l,y:a-l/2}],d=st.svg(n),u=ot(t,{});t.look!=="handDrawn"&&(u.roughness=0,u.fillStyle="solid");const p=jt(c),f=d.path(p,u),g=n.insert(()=>f,":first-child");return s&&t.look!=="handDrawn"&&g.selectAll("path").attr("style",s),i&&t.look!=="handDrawn"&&g.selectAll("path").attr("style",i),g.attr("transform",`translate(-${o/2},${-a})`),lt(t,g),t.intersect=function(x){return q.info("lightningBolt intersect",t,x),tt.polygon(t,c,x)},n}m(J2,"lightningBolt");var fD=m((e,t,r,i,n,s,o)=>[`M${e},${t+s}`,`a${n},${s} 0,0,0 ${r},0`,`a${n},${s} 0,0,0 ${-r},0`,`l0,${i}`,`a${n},${s} 0,0,0 ${r},0`,`l0,${-i}`,`M${e},${t+s+o}`,`a${n},${s} 0,0,0 ${r},0`].join(" "),"createCylinderPathD"),gD=m((e,t,r,i,n,s,o)=>[`M${e},${t+s}`,`M${e+r},${t+s}`,`a${n},${s} 0,0,0 ${-r},0`,`l0,${i}`,`a${n},${s} 0,0,0 ${r},0`,`l0,${-i}`,`M${e},${t+s+o}`,`a${n},${s} 0,0,0 ${r},0`].join(" "),"createOuterCylinderPathD"),mD=m((e,t,r,i,n,s)=>[`M${e-r/2},${-i/2}`,`a${n},${s} 0,0,0 ${r},0`].join(" "),"createInnerCylinderPathD");async function K2(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=Math.max(s.width+(t.padding??0),t.width??0),l=a/2,c=l/(2.5+a/50),d=Math.max(s.height+c+(t.padding??0),t.height??0),u=d*.1;let p;const{cssStyles:f}=t;if(t.look==="handDrawn"){const g=st.svg(n),x=gD(0,0,a,d,l,c,u),v=mD(0,c,a,d,l,c),y=ot(t,{}),b=g.path(x,y),w=g.path(v,y);n.insert(()=>w,":first-child").attr("class","line"),p=n.insert(()=>b,":first-child"),p.attr("class","basic label-container"),f&&p.attr("style",f)}else{const g=fD(0,0,a,d,l,c,u);p=n.insert("path",":first-child").attr("d",g).attr("class","basic label-container").attr("style",Ae(f)).attr("style",i)}return p.attr("label-offset-y",c),p.attr("transform",`translate(${-a/2}, ${-(d/2+c)})`),lt(t,p),o.attr("transform",`translate(${-(s.width/2)-(s.x-(s.left??0))}, ${-(s.height/2)+c-(s.y-(s.top??0))})`),t.intersect=function(g){const x=tt.rect(t,g),v=x.x-(t.x??0);if(l!=0&&(Math.abs(v)<(t.width??0)/2||Math.abs(v)==(t.width??0)/2&&Math.abs(x.y-(t.y??0))>(t.height??0)/2-c)){let y=c*c*(1-v*v/(l*l));y>0&&(y=Math.sqrt(y)),y=c-y,g.y-(t.y??0)>0&&(y=-y),x.y+=y}return x},n}m(K2,"linedCylinder");async function tw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=Math.max(s.width+(t.padding??0)*2,t?.width??0),l=Math.max(s.height+(t.padding??0)*2,t?.height??0),c=l/4,d=l+c,{cssStyles:u}=t,p=st.svg(n),f=ot(t,{});t.look!=="handDrawn"&&(f.roughness=0,f.fillStyle="solid");const g=[{x:-a/2-a/2*.1,y:-d/2},{x:-a/2-a/2*.1,y:d/2},...Bi(-a/2-a/2*.1,d/2,a/2+a/2*.1,d/2,c,.8),{x:a/2+a/2*.1,y:-d/2},{x:-a/2-a/2*.1,y:-d/2},{x:-a/2,y:-d/2},{x:-a/2,y:d/2*1.1},{x:-a/2,y:-d/2}],x=p.polygon(g.map(y=>[y.x,y.y]),f),v=n.insert(()=>x,":first-child");return v.attr("class","basic label-container"),u&&t.look!=="handDrawn"&&v.selectAll("path").attr("style",u),i&&t.look!=="handDrawn"&&v.selectAll("path").attr("style",i),v.attr("transform",`translate(0,${-c/2})`),o.attr("transform",`translate(${-a/2+(t.padding??0)+a/2*.1/2-(s.x-(s.left??0))},${-l/2+(t.padding??0)-c/2-(s.y-(s.top??0))})`),lt(t,v),t.intersect=function(y){return tt.polygon(t,g,y)},n}m(tw,"linedWaveEdgedRect");async function ew(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=Math.max(s.width+(t.padding??0)*2,t?.width??0),l=Math.max(s.height+(t.padding??0)*2,t?.height??0),c=5,d=-a/2,u=-l/2,{cssStyles:p}=t,f=st.svg(n),g=ot(t,{}),x=[{x:d-c,y:u+c},{x:d-c,y:u+l+c},{x:d+a-c,y:u+l+c},{x:d+a-c,y:u+l},{x:d+a,y:u+l},{x:d+a,y:u+l-c},{x:d+a+c,y:u+l-c},{x:d+a+c,y:u-c},{x:d+c,y:u-c},{x:d+c,y:u},{x:d,y:u},{x:d,y:u+c}],v=[{x:d,y:u+c},{x:d+a-c,y:u+c},{x:d+a-c,y:u+l},{x:d+a,y:u+l},{x:d+a,y:u},{x:d,y:u}];t.look!=="handDrawn"&&(g.roughness=0,g.fillStyle="solid");const y=jt(x),b=f.path(y,g),w=jt(v),S=f.path(w,{...g,fill:"none"}),_=n.insert(()=>S,":first-child");return _.insert(()=>b,":first-child"),_.attr("class","basic label-container"),p&&t.look!=="handDrawn"&&_.selectAll("path").attr("style",p),i&&t.look!=="handDrawn"&&_.selectAll("path").attr("style",i),o.attr("transform",`translate(${-(s.width/2)-c-(s.x-(s.left??0))}, ${-(s.height/2)+c-(s.y-(s.top??0))})`),lt(t,_),t.intersect=function(A){return tt.polygon(t,x,A)},n}m(ew,"multiRect");async function rw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=Math.max(s.width+(t.padding??0)*2,t?.width??0),l=Math.max(s.height+(t.padding??0)*2,t?.height??0),c=l/4,d=l+c,u=-a/2,p=-d/2,f=5,{cssStyles:g}=t,x=Bi(u-f,p+d+f,u+a-f,p+d+f,c,.8),v=x?.[x.length-1],y=[{x:u-f,y:p+f},{x:u-f,y:p+d+f},...x,{x:u+a-f,y:v.y-f},{x:u+a,y:v.y-f},{x:u+a,y:v.y-2*f},{x:u+a+f,y:v.y-2*f},{x:u+a+f,y:p-f},{x:u+f,y:p-f},{x:u+f,y:p},{x:u,y:p},{x:u,y:p+f}],b=[{x:u,y:p+f},{x:u+a-f,y:p+f},{x:u+a-f,y:v.y-f},{x:u+a,y:v.y-f},{x:u+a,y:p},{x:u,y:p}],w=st.svg(n),S=ot(t,{});t.look!=="handDrawn"&&(S.roughness=0,S.fillStyle="solid");const _=jt(y),A=w.path(_,S),C=jt(b),E=w.path(C,S),P=n.insert(()=>A,":first-child");return P.insert(()=>E),P.attr("class","basic label-container"),g&&t.look!=="handDrawn"&&P.selectAll("path").attr("style",g),i&&t.look!=="handDrawn"&&P.selectAll("path").attr("style",i),P.attr("transform",`translate(0,${-c/2})`),o.attr("transform",`translate(${-(s.width/2)-f-(s.x-(s.left??0))}, ${-(s.height/2)+f-c/2-(s.y-(s.top??0))})`),lt(t,P),t.intersect=function(z){return tt.polygon(t,y,z)},n}m(rw,"multiWaveEdgedRectangle");async function iw(e,t,{config:{themeVariables:r}}){const{labelStyles:i,nodeStyles:n}=at(t);t.labelStyle=i,t.useHtmlLabels||Te().flowchart?.htmlLabels!==!1||(t.centerLabel=!0);const{shapeSvg:o,bbox:a,label:l}=await gt(e,t,ft(t)),c=Math.max(a.width+(t.padding??0)*2,t?.width??0),d=Math.max(a.height+(t.padding??0)*2,t?.height??0),u=-c/2,p=-d/2,{cssStyles:f}=t,g=st.svg(o),x=ot(t,{fill:r.noteBkgColor,stroke:r.noteBorderColor});t.look!=="handDrawn"&&(x.roughness=0,x.fillStyle="solid");const v=g.rectangle(u,p,c,d,x),y=o.insert(()=>v,":first-child");return y.attr("class","basic label-container"),f&&t.look!=="handDrawn"&&y.selectAll("path").attr("style",f),n&&t.look!=="handDrawn"&&y.selectAll("path").attr("style",n),l.attr("transform",`translate(${-a.width/2-(a.x-(a.left??0))}, ${-(a.height/2)-(a.y-(a.top??0))})`),lt(t,y),t.intersect=function(b){return tt.rect(t,b)},o}m(iw,"note");var xD=m((e,t,r)=>[`M${e+r/2},${t}`,`L${e+r},${t-r/2}`,`L${e+r/2},${t-r}`,`L${e},${t-r/2}`,"Z"].join(" "),"createDecisionBoxPathD");async function nw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=s.width+t.padding,a=s.height+t.padding,l=o+a,c=.5,d=[{x:l/2,y:0},{x:l,y:-l/2},{x:l/2,y:-l},{x:0,y:-l/2}];let u;const{cssStyles:p}=t;if(t.look==="handDrawn"){const f=st.svg(n),g=ot(t,{}),x=xD(0,0,l),v=f.path(x,g);u=n.insert(()=>v,":first-child").attr("transform",`translate(${-l/2+c}, ${l/2})`),p&&u.attr("style",p)}else u=Pi(n,l,l,d),u.attr("transform",`translate(${-l/2+c}, ${l/2})`);return i&&u.attr("style",i),lt(t,u),t.calcIntersect=function(f,g){const x=f.width,v=[{x:x/2,y:0},{x,y:-x/2},{x:x/2,y:-x},{x:0,y:-x/2}],y=tt.polygon(f,v,g);return{x:y.x-.5,y:y.y-.5}},t.intersect=function(f){return this.calcIntersect(t,f)},n}m(nw,"question");async function sw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=Math.max(s.width+(t.padding??0),t?.width??0),l=Math.max(s.height+(t.padding??0),t?.height??0),c=-a/2,d=-l/2,u=d/2,p=[{x:c+u,y:d},{x:c,y:0},{x:c+u,y:-d},{x:-c,y:-d},{x:-c,y:d}],{cssStyles:f}=t,g=st.svg(n),x=ot(t,{});t.look!=="handDrawn"&&(x.roughness=0,x.fillStyle="solid");const v=jt(p),y=g.path(v,x),b=n.insert(()=>y,":first-child");return b.attr("class","basic label-container"),f&&t.look!=="handDrawn"&&b.selectAll("path").attr("style",f),i&&t.look!=="handDrawn"&&b.selectAll("path").attr("style",i),b.attr("transform",`translate(${-u/2},0)`),o.attr("transform",`translate(${-u/2-s.width/2-(s.x-(s.left??0))}, ${-(s.height/2)-(s.y-(s.top??0))})`),lt(t,b),t.intersect=function(w){return tt.polygon(t,p,w)},n}m(sw,"rect_left_inv_arrow");async function ow(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;let n;t.cssClasses?n="node "+t.cssClasses:n="node default";const s=e.insert("g").attr("class",n).attr("id",t.domId||t.id),o=s.insert("g"),a=s.insert("g").attr("class","label").attr("style",i),l=t.description,c=t.label,d=a.node().appendChild(await nn(c,t.labelStyle,!0,!0));let u={width:0,height:0};if(pe(Nt()?.flowchart?.htmlLabels)){const E=d.children[0],P=Lt(d);u=E.getBoundingClientRect(),P.attr("width",u.width),P.attr("height",u.height)}q.info("Text 2",l);const p=l||[],f=d.getBBox(),g=a.node().appendChild(await nn(p.join?p.join("<br/>"):p,t.labelStyle,!0,!0)),x=g.children[0],v=Lt(g);u=x.getBoundingClientRect(),v.attr("width",u.width),v.attr("height",u.height);const y=(t.padding||0)/2;Lt(g).attr("transform","translate( "+(u.width>f.width?0:(f.width-u.width)/2)+", "+(f.height+y+5)+")"),Lt(d).attr("transform","translate( "+(u.width<f.width?0:-(f.width-u.width)/2)+", 0)"),u=a.node().getBBox(),a.attr("transform","translate("+-u.width/2+", "+(-u.height/2-y+3)+")");const b=u.width+(t.padding||0),w=u.height+(t.padding||0),S=-u.width/2-y,_=-u.height/2-y;let A,C;if(t.look==="handDrawn"){const E=st.svg(s),P=ot(t,{}),z=E.path(Fi(S,_,b,w,t.rx||0),P),D=E.line(-u.width/2-y,-u.height/2-y+f.height+y,u.width/2+y,-u.height/2-y+f.height+y,P);C=s.insert(()=>(q.debug("Rough node insert CXC",z),D),":first-child"),A=s.insert(()=>(q.debug("Rough node insert CXC",z),z),":first-child")}else A=o.insert("rect",":first-child"),C=o.insert("line"),A.attr("class","outer title-state").attr("style",i).attr("x",-u.width/2-y).attr("y",-u.height/2-y).attr("width",u.width+(t.padding||0)).attr("height",u.height+(t.padding||0)),C.attr("class","divider").attr("x1",-u.width/2-y).attr("x2",u.width/2+y).attr("y1",-u.height/2-y+f.height+y).attr("y2",-u.height/2-y+f.height+y);return lt(t,A),t.intersect=function(E){return tt.rect(t,E)},s}m(ow,"rectWithTitle");function go(e,t,r,i,n,s,o){const l=(e+r)/2,c=(t+i)/2,d=Math.atan2(i-t,r-e),u=(r-e)/2,p=(i-t)/2,f=u/n,g=p/s,x=Math.sqrt(f**2+g**2);if(x>1)throw new Error("The given radii are too small to create an arc between the points.");const v=Math.sqrt(1-x**2),y=l+v*s*Math.sin(d)*(o?-1:1),b=c-v*n*Math.cos(d)*(o?-1:1),w=Math.atan2((t-b)/s,(e-y)/n);let _=Math.atan2((i-b)/s,(r-y)/n)-w;o&&_<0&&(_+=2*Math.PI),!o&&_>0&&(_-=2*Math.PI);const A=[];for(let C=0;C<20;C++){const E=C/19,P=w+E*_,z=y+n*Math.cos(P),D=b+s*Math.sin(P);A.push({x:z,y:D})}return A}m(go,"generateArcPoints");async function aw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=t?.padding??0,a=t?.padding??0,l=(t?.width?t?.width:s.width)+o*2,c=(t?.height?t?.height:s.height)+a*2,d=t.radius||5,u=t.taper||5,{cssStyles:p}=t,f=st.svg(n),g=ot(t,{});t.stroke&&(g.stroke=t.stroke),t.look!=="handDrawn"&&(g.roughness=0,g.fillStyle="solid");const x=[{x:-l/2+u,y:-c/2},{x:l/2-u,y:-c/2},...go(l/2-u,-c/2,l/2,-c/2+u,d,d,!0),{x:l/2,y:-c/2+u},{x:l/2,y:c/2-u},...go(l/2,c/2-u,l/2-u,c/2,d,d,!0),{x:l/2-u,y:c/2},{x:-l/2+u,y:c/2},...go(-l/2+u,c/2,-l/2,c/2-u,d,d,!0),{x:-l/2,y:c/2-u},{x:-l/2,y:-c/2+u},...go(-l/2,-c/2+u,-l/2+u,-c/2,d,d,!0)],v=jt(x),y=f.path(v,g),b=n.insert(()=>y,":first-child");return b.attr("class","basic label-container outer-path"),p&&t.look!=="handDrawn"&&b.selectChildren("path").attr("style",p),i&&t.look!=="handDrawn"&&b.selectChildren("path").attr("style",i),lt(t,b),t.intersect=function(w){return tt.polygon(t,x,w)},n}m(aw,"roundedRect");async function lw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=t?.padding??0,l=Math.max(s.width+(t.padding??0)*2,t?.width??0),c=Math.max(s.height+(t.padding??0)*2,t?.height??0),d=-s.width/2-a,u=-s.height/2-a,{cssStyles:p}=t,f=st.svg(n),g=ot(t,{});t.look!=="handDrawn"&&(g.roughness=0,g.fillStyle="solid");const x=[{x:d,y:u},{x:d+l+8,y:u},{x:d+l+8,y:u+c},{x:d-8,y:u+c},{x:d-8,y:u},{x:d,y:u},{x:d,y:u+c}],v=f.polygon(x.map(b=>[b.x,b.y]),g),y=n.insert(()=>v,":first-child");return y.attr("class","basic label-container").attr("style",Ae(p)),i&&t.look!=="handDrawn"&&y.selectAll("path").attr("style",i),p&&t.look!=="handDrawn"&&y.selectAll("path").attr("style",i),o.attr("transform",`translate(${-l/2+4+(t.padding??0)-(s.x-(s.left??0))},${-c/2+(t.padding??0)-(s.y-(s.top??0))})`),lt(t,y),t.intersect=function(b){return tt.rect(t,b)},n}m(lw,"shadedProcess");async function cw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=Math.max(s.width+(t.padding??0)*2,t?.width??0),l=Math.max(s.height+(t.padding??0)*2,t?.height??0),c=-a/2,d=-l/2,{cssStyles:u}=t,p=st.svg(n),f=ot(t,{});t.look!=="handDrawn"&&(f.roughness=0,f.fillStyle="solid");const g=[{x:c,y:d},{x:c,y:d+l},{x:c+a,y:d+l},{x:c+a,y:d-l/2}],x=jt(g),v=p.path(x,f),y=n.insert(()=>v,":first-child");return y.attr("class","basic label-container"),u&&t.look!=="handDrawn"&&y.selectChildren("path").attr("style",u),i&&t.look!=="handDrawn"&&y.selectChildren("path").attr("style",i),y.attr("transform",`translate(0, ${l/4})`),o.attr("transform",`translate(${-a/2+(t.padding??0)-(s.x-(s.left??0))}, ${-l/4+(t.padding??0)-(s.y-(s.top??0))})`),lt(t,y),t.intersect=function(b){return tt.polygon(t,g,b)},n}m(cw,"slopedRect");async function hw(e,t){const r={rx:0,ry:0,classes:"",labelPaddingX:t.labelPaddingX??(t?.padding||0)*2,labelPaddingY:(t?.padding||0)*1};return Nc(e,t,r)}m(hw,"squareRect");async function dw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=s.height+t.padding,a=s.width+o/4+t.padding,l=o/2,{cssStyles:c}=t,d=st.svg(n),u=ot(t,{});t.look!=="handDrawn"&&(u.roughness=0,u.fillStyle="solid");const p=[{x:-a/2+l,y:-o/2},{x:a/2-l,y:-o/2},...Uo(-a/2+l,0,l,50,90,270),{x:a/2-l,y:o/2},...Uo(a/2-l,0,l,50,270,450)],f=jt(p),g=d.path(f,u),x=n.insert(()=>g,":first-child");return x.attr("class","basic label-container outer-path"),c&&t.look!=="handDrawn"&&x.selectChildren("path").attr("style",c),i&&t.look!=="handDrawn"&&x.selectChildren("path").attr("style",i),lt(t,x),t.intersect=function(v){return tt.polygon(t,p,v)},n}m(dw,"stadium");async function uw(e,t){return Nc(e,t,{rx:5,ry:5,classes:"flowchart-node"})}m(uw,"state");function pw(e,t,{config:{themeVariables:r}}){const{labelStyles:i,nodeStyles:n}=at(t);t.labelStyle=i;const{cssStyles:s}=t,{lineColor:o,stateBorder:a,nodeBorder:l}=r,c=e.insert("g").attr("class","node default").attr("id",t.domId||t.id),d=st.svg(c),u=ot(t,{});t.look!=="handDrawn"&&(u.roughness=0,u.fillStyle="solid");const p=d.circle(0,0,14,{...u,stroke:o,strokeWidth:2}),f=a??l,g=d.circle(0,0,5,{...u,fill:f,stroke:f,strokeWidth:2,fillStyle:"solid"}),x=c.insert(()=>p,":first-child");return x.insert(()=>g),s&&x.selectAll("path").attr("style",s),n&&x.selectAll("path").attr("style",n),lt(t,x),t.intersect=function(v){return tt.circle(t,7,v)},c}m(pw,"stateEnd");function fw(e,t,{config:{themeVariables:r}}){const{lineColor:i}=r,n=e.insert("g").attr("class","node default").attr("id",t.domId||t.id);let s;if(t.look==="handDrawn"){const a=st.svg(n).circle(0,0,14,BM(i));s=n.insert(()=>a),s.attr("class","state-start").attr("r",7).attr("width",14).attr("height",14)}else s=n.insert("circle",":first-child"),s.attr("class","state-start").attr("r",7).attr("width",14).attr("height",14);return lt(t,s),t.intersect=function(o){return tt.circle(t,7,o)},n}m(fw,"stateStart");async function gw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=(t?.padding||0)/2,a=s.width+t.padding,l=s.height+t.padding,c=-s.width/2-o,d=-s.height/2-o,u=[{x:0,y:0},{x:a,y:0},{x:a,y:-l},{x:0,y:-l},{x:0,y:0},{x:-8,y:0},{x:a+8,y:0},{x:a+8,y:-l},{x:-8,y:-l},{x:-8,y:0}];if(t.look==="handDrawn"){const p=st.svg(n),f=ot(t,{}),g=p.rectangle(c-8,d,a+16,l,f),x=p.line(c,d,c,d+l,f),v=p.line(c+a,d,c+a,d+l,f);n.insert(()=>x,":first-child"),n.insert(()=>v,":first-child");const y=n.insert(()=>g,":first-child"),{cssStyles:b}=t;y.attr("class","basic label-container").attr("style",Ae(b)),lt(t,y)}else{const p=Pi(n,a,l,u);i&&p.attr("style",i),lt(t,p)}return t.intersect=function(p){return tt.polygon(t,u,p)},n}m(gw,"subroutine");async function mw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=Math.max(s.width+(t.padding??0)*2,t?.width??0),a=Math.max(s.height+(t.padding??0)*2,t?.height??0),l=-o/2,c=-a/2,d=.2*a,u=.2*a,{cssStyles:p}=t,f=st.svg(n),g=ot(t,{}),x=[{x:l-d/2,y:c},{x:l+o+d/2,y:c},{x:l+o+d/2,y:c+a},{x:l-d/2,y:c+a}],v=[{x:l+o-d/2,y:c+a},{x:l+o+d/2,y:c+a},{x:l+o+d/2,y:c+a-u}];t.look!=="handDrawn"&&(g.roughness=0,g.fillStyle="solid");const y=jt(x),b=f.path(y,g),w=jt(v),S=f.path(w,{...g,fillStyle:"solid"}),_=n.insert(()=>S,":first-child");return _.insert(()=>b,":first-child"),_.attr("class","basic label-container"),p&&t.look!=="handDrawn"&&_.selectAll("path").attr("style",p),i&&t.look!=="handDrawn"&&_.selectAll("path").attr("style",i),lt(t,_),t.intersect=function(A){return tt.polygon(t,x,A)},n}m(mw,"taggedRect");async function xw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=Math.max(s.width+(t.padding??0)*2,t?.width??0),l=Math.max(s.height+(t.padding??0)*2,t?.height??0),c=l/4,d=.2*a,u=.2*l,p=l+c,{cssStyles:f}=t,g=st.svg(n),x=ot(t,{});t.look!=="handDrawn"&&(x.roughness=0,x.fillStyle="solid");const v=[{x:-a/2-a/2*.1,y:p/2},...Bi(-a/2-a/2*.1,p/2,a/2+a/2*.1,p/2,c,.8),{x:a/2+a/2*.1,y:-p/2},{x:-a/2-a/2*.1,y:-p/2}],y=-a/2+a/2*.1,b=-p/2-u*.4,w=[{x:y+a-d,y:(b+l)*1.4},{x:y+a,y:b+l-u},{x:y+a,y:(b+l)*.9},...Bi(y+a,(b+l)*1.3,y+a-d,(b+l)*1.5,-l*.03,.5)],S=jt(v),_=g.path(S,x),A=jt(w),C=g.path(A,{...x,fillStyle:"solid"}),E=n.insert(()=>C,":first-child");return E.insert(()=>_,":first-child"),E.attr("class","basic label-container"),f&&t.look!=="handDrawn"&&E.selectAll("path").attr("style",f),i&&t.look!=="handDrawn"&&E.selectAll("path").attr("style",i),E.attr("transform",`translate(0,${-c/2})`),o.attr("transform",`translate(${-a/2+(t.padding??0)-(s.x-(s.left??0))},${-l/2+(t.padding??0)-c/2-(s.y-(s.top??0))})`),lt(t,E),t.intersect=function(P){return tt.polygon(t,v,P)},n}m(xw,"taggedWaveEdgedRectangle");async function bw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=Math.max(s.width+t.padding,t?.width||0),a=Math.max(s.height+t.padding,t?.height||0),l=-o/2,c=-a/2,d=n.insert("rect",":first-child");return d.attr("class","text").attr("style",i).attr("rx",0).attr("ry",0).attr("x",l).attr("y",c).attr("width",o).attr("height",a),lt(t,d),t.intersect=function(u){return tt.rect(t,u)},n}m(bw,"text");var bD=m((e,t,r,i,n,s)=>`M${e},${t}
    a${n},${s} 0,0,1 0,${-i}
    l${r},0
    a${n},${s} 0,0,1 0,${i}
    M${r},${-i}
    a${n},${s} 0,0,0 0,${i}
    l${-r},0`,"createCylinderPathD"),yD=m((e,t,r,i,n,s)=>[`M${e},${t}`,`M${e+r},${t}`,`a${n},${s} 0,0,0 0,${-i}`,`l${-r},0`,`a${n},${s} 0,0,0 0,${i}`,`l${r},0`].join(" "),"createOuterCylinderPathD"),vD=m((e,t,r,i,n,s)=>[`M${e+r/2},${-i/2}`,`a${n},${s} 0,0,0 0,${i}`].join(" "),"createInnerCylinderPathD");async function yw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o,halfPadding:a}=await gt(e,t,ft(t)),l=t.look==="neo"?a*2:a,c=s.height+l,d=c/2,u=d/(2.5+c/50),p=s.width+u+l,{cssStyles:f}=t;let g;if(t.look==="handDrawn"){const x=st.svg(n),v=yD(0,0,p,c,u,d),y=vD(0,0,p,c,u,d),b=x.path(v,ot(t,{})),w=x.path(y,ot(t,{fill:"none"}));g=n.insert(()=>w,":first-child"),g=n.insert(()=>b,":first-child"),g.attr("class","basic label-container"),f&&g.attr("style",f)}else{const x=bD(0,0,p,c,u,d);g=n.insert("path",":first-child").attr("d",x).attr("class","basic label-container").attr("style",Ae(f)).attr("style",i),g.attr("class","basic label-container"),f&&g.selectAll("path").attr("style",f),i&&g.selectAll("path").attr("style",i)}return g.attr("label-offset-x",u),g.attr("transform",`translate(${-p/2}, ${c/2} )`),o.attr("transform",`translate(${-(s.width/2)-u-(s.x-(s.left??0))}, ${-(s.height/2)-(s.y-(s.top??0))})`),lt(t,g),t.intersect=function(x){const v=tt.rect(t,x),y=v.y-(t.y??0);if(d!=0&&(Math.abs(y)<(t.height??0)/2||Math.abs(y)==(t.height??0)/2&&Math.abs(v.x-(t.x??0))>(t.width??0)/2-u)){let b=u*u*(1-y*y/(d*d));b!=0&&(b=Math.sqrt(Math.abs(b))),b=u-b,x.x-(t.x??0)>0&&(b=-b),v.x+=b}return v},n}m(yw,"tiltedCylinder");async function vw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=s.width+t.padding,a=s.height+t.padding,l=[{x:-3*a/6,y:0},{x:o+3*a/6,y:0},{x:o,y:-a},{x:0,y:-a}];let c;const{cssStyles:d}=t;if(t.look==="handDrawn"){const u=st.svg(n),p=ot(t,{}),f=jt(l),g=u.path(f,p);c=n.insert(()=>g,":first-child").attr("transform",`translate(${-o/2}, ${a/2})`),d&&c.attr("style",d)}else c=Pi(n,o,a,l);return i&&c.attr("style",i),t.width=o,t.height=a,lt(t,c),t.intersect=function(u){return tt.polygon(t,l,u)},n}m(vw,"trapezoid");async function ww(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=60,a=20,l=Math.max(o,s.width+(t.padding??0)*2,t?.width??0),c=Math.max(a,s.height+(t.padding??0)*2,t?.height??0),{cssStyles:d}=t,u=st.svg(n),p=ot(t,{});t.look!=="handDrawn"&&(p.roughness=0,p.fillStyle="solid");const f=[{x:-l/2*.8,y:-c/2},{x:l/2*.8,y:-c/2},{x:l/2,y:-c/2*.6},{x:l/2,y:c/2},{x:-l/2,y:c/2},{x:-l/2,y:-c/2*.6}],g=jt(f),x=u.path(g,p),v=n.insert(()=>x,":first-child");return v.attr("class","basic label-container"),d&&t.look!=="handDrawn"&&v.selectChildren("path").attr("style",d),i&&t.look!=="handDrawn"&&v.selectChildren("path").attr("style",i),lt(t,v),t.intersect=function(y){return tt.polygon(t,f,y)},n}m(ww,"trapezoidalPentagon");async function kw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=pe(Nt().flowchart?.htmlLabels),l=s.width+(t.padding??0),c=l+s.height,d=l+s.height,u=[{x:0,y:0},{x:d,y:0},{x:d/2,y:-c}],{cssStyles:p}=t,f=st.svg(n),g=ot(t,{});t.look!=="handDrawn"&&(g.roughness=0,g.fillStyle="solid");const x=jt(u),v=f.path(x,g),y=n.insert(()=>v,":first-child").attr("transform",`translate(${-c/2}, ${c/2})`);return p&&t.look!=="handDrawn"&&y.selectChildren("path").attr("style",p),i&&t.look!=="handDrawn"&&y.selectChildren("path").attr("style",i),t.width=l,t.height=c,lt(t,y),o.attr("transform",`translate(${-s.width/2-(s.x-(s.left??0))}, ${c/2-(s.height+(t.padding??0)/(a?2:1)-(s.y-(s.top??0)))})`),t.intersect=function(b){return q.info("Triangle intersect",t,u,b),tt.polygon(t,u,b)},n}m(kw,"triangle");async function Cw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=Math.max(s.width+(t.padding??0)*2,t?.width??0),l=Math.max(s.height+(t.padding??0)*2,t?.height??0),c=l/8,d=l+c,{cssStyles:u}=t,f=70-a,g=f>0?f/2:0,x=st.svg(n),v=ot(t,{});t.look!=="handDrawn"&&(v.roughness=0,v.fillStyle="solid");const y=[{x:-a/2-g,y:d/2},...Bi(-a/2-g,d/2,a/2+g,d/2,c,.8),{x:a/2+g,y:-d/2},{x:-a/2-g,y:-d/2}],b=jt(y),w=x.path(b,v),S=n.insert(()=>w,":first-child");return S.attr("class","basic label-container"),u&&t.look!=="handDrawn"&&S.selectAll("path").attr("style",u),i&&t.look!=="handDrawn"&&S.selectAll("path").attr("style",i),S.attr("transform",`translate(0,${-c/2})`),o.attr("transform",`translate(${-a/2+(t.padding??0)-(s.x-(s.left??0))},${-l/2+(t.padding??0)-c-(s.y-(s.top??0))})`),lt(t,S),t.intersect=function(_){return tt.polygon(t,y,_)},n}m(Cw,"waveEdgedRectangle");async function Sw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s}=await gt(e,t,ft(t)),o=100,a=50,l=Math.max(s.width+(t.padding??0)*2,t?.width??0),c=Math.max(s.height+(t.padding??0)*2,t?.height??0),d=l/c;let u=l,p=c;u>p*d?p=u/d:u=p*d,u=Math.max(u,o),p=Math.max(p,a);const f=Math.min(p*.2,p/4),g=p+f*2,{cssStyles:x}=t,v=st.svg(n),y=ot(t,{});t.look!=="handDrawn"&&(y.roughness=0,y.fillStyle="solid");const b=[{x:-u/2,y:g/2},...Bi(-u/2,g/2,u/2,g/2,f,1),{x:u/2,y:-g/2},...Bi(u/2,-g/2,-u/2,-g/2,f,-1)],w=jt(b),S=v.path(w,y),_=n.insert(()=>S,":first-child");return _.attr("class","basic label-container"),x&&t.look!=="handDrawn"&&_.selectAll("path").attr("style",x),i&&t.look!=="handDrawn"&&_.selectAll("path").attr("style",i),lt(t,_),t.intersect=function(A){return tt.polygon(t,b,A)},n}m(Sw,"waveRectangle");async function _w(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,label:o}=await gt(e,t,ft(t)),a=Math.max(s.width+(t.padding??0)*2,t?.width??0),l=Math.max(s.height+(t.padding??0)*2,t?.height??0),c=5,d=-a/2,u=-l/2,{cssStyles:p}=t,f=st.svg(n),g=ot(t,{}),x=[{x:d-c,y:u-c},{x:d-c,y:u+l},{x:d+a,y:u+l},{x:d+a,y:u-c}],v=`M${d-c},${u-c} L${d+a},${u-c} L${d+a},${u+l} L${d-c},${u+l} L${d-c},${u-c}
                M${d-c},${u} L${d+a},${u}
                M${d},${u-c} L${d},${u+l}`;t.look!=="handDrawn"&&(g.roughness=0,g.fillStyle="solid");const y=f.path(v,g),b=n.insert(()=>y,":first-child");return b.attr("transform",`translate(${c/2}, ${c/2})`),b.attr("class","basic label-container"),p&&t.look!=="handDrawn"&&b.selectAll("path").attr("style",p),i&&t.look!=="handDrawn"&&b.selectAll("path").attr("style",i),o.attr("transform",`translate(${-(s.width/2)+c/2-(s.x-(s.left??0))}, ${-(s.height/2)+c/2-(s.y-(s.top??0))})`),lt(t,b),t.intersect=function(w){return tt.polygon(t,x,w)},n}m(_w,"windowPane");async function nf(e,t){const r=t;if(r.alias&&(t.label=r.alias),t.look==="handDrawn"){const{themeVariables:Y}=Te(),{background:F}=Y,J={...t,id:t.id+"-background",look:"default",cssStyles:["stroke: none",`fill: ${F}`]};await nf(e,J)}const i=Te();t.useHtmlLabels=i.htmlLabels;let n=i.er?.diagramPadding??10,s=i.er?.entityPadding??6;const{cssStyles:o}=t,{labelStyles:a,nodeStyles:l}=at(t);if(r.attributes.length===0&&t.label){const Y={rx:0,ry:0,labelPaddingX:n,labelPaddingY:n*1.5,classes:""};di(t.label,i)+Y.labelPaddingX*2<i.er.minEntityWidth&&(t.width=i.er.minEntityWidth);const F=await Nc(e,t,Y);if(!pe(i.htmlLabels)){const J=F.select("text"),W=J.node()?.getBBox();J.attr("transform",`translate(${-W.width/2}, 0)`)}return F}i.htmlLabels||(n*=1.25,s*=1.25);let c=ft(t);c||(c="node default");const d=e.insert("g").attr("class",c).attr("id",t.domId||t.id),u=await Hn(d,t.label??"",i,0,0,["name"],a);u.height+=s;let p=0;const f=[],g=[];let x=0,v=0,y=0,b=0,w=!0,S=!0;for(const Y of r.attributes){const F=await Hn(d,Y.type,i,0,p,["attribute-type"],a);x=Math.max(x,F.width+n);const J=await Hn(d,Y.name,i,0,p,["attribute-name"],a);v=Math.max(v,J.width+n);const W=await Hn(d,Y.keys.join(),i,0,p,["attribute-keys"],a);y=Math.max(y,W.width+n);const it=await Hn(d,Y.comment,i,0,p,["attribute-comment"],a);b=Math.max(b,it.width+n);const pt=Math.max(F.height,J.height,W.height,it.height)+s;g.push({yOffset:p,rowHeight:pt}),p+=pt}let _=4;y<=n&&(w=!1,y=0,_--),b<=n&&(S=!1,b=0,_--);const A=d.node().getBBox();if(u.width+n*2-(x+v+y+b)>0){const Y=u.width+n*2-(x+v+y+b);x+=Y/_,v+=Y/_,y>0&&(y+=Y/_),b>0&&(b+=Y/_)}const C=x+v+y+b,E=st.svg(d),P=ot(t,{});t.look!=="handDrawn"&&(P.roughness=0,P.fillStyle="solid");let z=0;g.length>0&&(z=g.reduce((Y,F)=>Y+(F?.rowHeight??0),0));const D=Math.max(A.width+n*2,t?.width||0,C),V=Math.max((z??0)+u.height,t?.height||0),H=-D/2,O=-V/2;d.selectAll("g:not(:first-child)").each((Y,F,J)=>{const W=Lt(J[F]),it=W.attr("transform");let pt=0,Dt=0;if(it){const Wt=RegExp(/translate\(([^,]+),([^)]+)\)/).exec(it);Wt&&(pt=parseFloat(Wt[1]),Dt=parseFloat(Wt[2]),W.attr("class").includes("attribute-name")?pt+=x:W.attr("class").includes("attribute-keys")?pt+=x+v:W.attr("class").includes("attribute-comment")&&(pt+=x+v+y))}W.attr("transform",`translate(${H+n/2+pt}, ${Dt+O+u.height+s/2})`)}),d.select(".name").attr("transform","translate("+-u.width/2+", "+(O+s/2)+")");const R=E.rectangle(H,O,D,V,P),T=d.insert(()=>R,":first-child").attr("style",o.join("")),{themeVariables:L}=Te(),{rowEven:$,rowOdd:N,nodeBorder:G}=L;f.push(0);for(const[Y,F]of g.entries()){const W=(Y+1)%2===0&&F.yOffset!==0,it=E.rectangle(H,u.height+O+F?.yOffset,D,F?.rowHeight,{...P,fill:W?$:N,stroke:G});d.insert(()=>it,"g.label").attr("style",o.join("")).attr("class",`row-rect-${W?"even":"odd"}`)}let Q=E.line(H,u.height+O,D+H,u.height+O,P);d.insert(()=>Q).attr("class","divider"),Q=E.line(x+H,u.height+O,x+H,V+O,P),d.insert(()=>Q).attr("class","divider"),w&&(Q=E.line(x+v+H,u.height+O,x+v+H,V+O,P),d.insert(()=>Q).attr("class","divider")),S&&(Q=E.line(x+v+y+H,u.height+O,x+v+y+H,V+O,P),d.insert(()=>Q).attr("class","divider"));for(const Y of f)Q=E.line(H,u.height+O+Y,D+H,u.height+O+Y,P),d.insert(()=>Q).attr("class","divider");if(lt(t,T),l&&t.look!=="handDrawn"){const F=l.split(";")?.filter(J=>J.includes("stroke"))?.map(J=>`${J}`).join("; ");d.selectAll("path").attr("style",F??""),d.selectAll(".row-rect-even path").attr("style",l)}return t.intersect=function(Y){return tt.rect(t,Y)},d}m(nf,"erBox");async function Hn(e,t,r,i=0,n=0,s=[],o=""){const a=e.insert("g").attr("class",`label ${s.join(" ")}`).attr("transform",`translate(${i}, ${n})`).attr("style",o);t!==qg(t)&&(t=qg(t),t=t.replaceAll("<","&lt;").replaceAll(">","&gt;"));const l=a.node().appendChild(await Di(a,t,{width:di(t,r)+100,style:o,useHtmlLabels:r.htmlLabels},r));if(t.includes("&lt;")||t.includes("&gt;")){let d=l.children[0];for(d.textContent=d.textContent.replaceAll("&lt;","<").replaceAll("&gt;",">");d.childNodes[0];)d=d.childNodes[0],d.textContent=d.textContent.replaceAll("&lt;","<").replaceAll("&gt;",">")}let c=l.getBBox();if(pe(r.htmlLabels)){const d=l.children[0];d.style.textAlign="start";const u=Lt(l);c=d.getBoundingClientRect(),u.attr("width",c.width),u.attr("height",c.height)}return c}m(Hn,"addText");async function Tw(e,t,r,i,n=r.class.padding??12){const s=i?0:3,o=e.insert("g").attr("class",ft(t)).attr("id",t.domId||t.id);let a=null,l=null,c=null,d=null,u=0,p=0,f=0;if(a=o.insert("g").attr("class","annotation-group text"),t.annotations.length>0){const b=t.annotations[0];await mo(a,{text:`«${b}»`},0),u=a.node().getBBox().height}l=o.insert("g").attr("class","label-group text"),await mo(l,t,0,["font-weight: bolder"]);const g=l.node().getBBox();p=g.height,c=o.insert("g").attr("class","members-group text");let x=0;for(const b of t.members){const w=await mo(c,b,x,[b.parseClassifier()]);x+=w+s}f=c.node().getBBox().height,f<=0&&(f=n/2),d=o.insert("g").attr("class","methods-group text");let v=0;for(const b of t.methods){const w=await mo(d,b,v,[b.parseClassifier()]);v+=w+s}let y=o.node().getBBox();if(a!==null){const b=a.node().getBBox();a.attr("transform",`translate(${-b.width/2})`)}return l.attr("transform",`translate(${-g.width/2}, ${u})`),y=o.node().getBBox(),c.attr("transform",`translate(0, ${u+p+n*2})`),y=o.node().getBBox(),d.attr("transform",`translate(0, ${u+p+(f?f+n*4:n*2)})`),y=o.node().getBBox(),{shapeSvg:o,bbox:y}}m(Tw,"textHelper");async function mo(e,t,r,i=[]){const n=e.insert("g").attr("class","label").attr("style",i.join("; ")),s=Te();let o="useHtmlLabels"in t?t.useHtmlLabels:pe(s.htmlLabels)??!0,a="";"text"in t?a=t.text:a=t.label,!o&&a.startsWith("\\")&&(a=a.substring(1)),xs(a)&&(o=!0);const l=await Di(n,pp(_n(a)),{width:di(a,s)+50,classes:"markdown-node-label",useHtmlLabels:o},s);let c,d=1;if(o){const u=l.children[0],p=Lt(l);d=u.innerHTML.split("<br>").length,u.innerHTML.includes("</math>")&&(d+=u.innerHTML.split("<mrow>").length-1);const f=u.getElementsByTagName("img");if(f){const g=a.replace(/<img[^>]*>/g,"").trim()==="";await Promise.all([...f].map(x=>new Promise(v=>{function y(){if(x.style.display="flex",x.style.flexDirection="column",g){const b=s.fontSize?.toString()??window.getComputedStyle(document.body).fontSize,S=parseInt(b,10)*5+"px";x.style.minWidth=S,x.style.maxWidth=S}else x.style.width="100%";v(x)}m(y,"setupImage"),setTimeout(()=>{x.complete&&y()}),x.addEventListener("error",y),x.addEventListener("load",y)})))}c=u.getBoundingClientRect(),p.attr("width",c.width),p.attr("height",c.height)}else{i.includes("font-weight: bolder")&&Lt(l).selectAll("tspan").attr("font-weight",""),d=l.children.length;const u=l.children[0];(l.textContent===""||l.textContent.includes("&gt"))&&(u.textContent=a[0]+a.substring(1).replaceAll("&gt;",">").replaceAll("&lt;","<").trim(),a[1]===" "&&(u.textContent=u.textContent[0]+" "+u.textContent.substring(1))),u.textContent==="undefined"&&(u.textContent=""),c=l.getBBox()}return n.attr("transform","translate(0,"+(-c.height/(2*d)+r)+")"),c.height}m(mo,"addText");async function $w(e,t){const r=Nt(),i=r.class.padding??12,n=i,s=t.useHtmlLabels??pe(r.htmlLabels)??!0,o=t;o.annotations=o.annotations??[],o.members=o.members??[],o.methods=o.methods??[];const{shapeSvg:a,bbox:l}=await Tw(e,t,r,s,n),{labelStyles:c,nodeStyles:d}=at(t);t.labelStyle=c,t.cssStyles=o.styles||"";const u=o.styles?.join(";")||d||"";t.cssStyles||(t.cssStyles=u.replaceAll("!important","").split(";"));const p=o.members.length===0&&o.methods.length===0&&!r.class?.hideEmptyMembersBox,f=st.svg(a),g=ot(t,{});t.look!=="handDrawn"&&(g.roughness=0,g.fillStyle="solid");const x=l.width;let v=l.height;o.members.length===0&&o.methods.length===0?v+=n:o.members.length>0&&o.methods.length===0&&(v+=n*2);const y=-x/2,b=-v/2,w=f.rectangle(y-i,b-i-(p?i:o.members.length===0&&o.methods.length===0?-i/2:0),x+2*i,v+2*i+(p?i*2:o.members.length===0&&o.methods.length===0?-i:0),g),S=a.insert(()=>w,":first-child");S.attr("class","basic label-container");const _=S.node().getBBox();a.selectAll(".text").each((P,z,D)=>{const V=Lt(D[z]),H=V.attr("transform");let O=0;if(H){const $=RegExp(/translate\(([^,]+),([^)]+)\)/).exec(H);$&&(O=parseFloat($[2]))}let R=O+b+i-(p?i:o.members.length===0&&o.methods.length===0?-i/2:0);s||(R-=4);let T=y;(V.attr("class").includes("label-group")||V.attr("class").includes("annotation-group"))&&(T=-V.node()?.getBBox().width/2||0,a.selectAll("text").each(function(L,$,N){window.getComputedStyle(N[$]).textAnchor==="middle"&&(T=0)})),V.attr("transform",`translate(${T}, ${R})`)});const A=a.select(".annotation-group").node().getBBox().height-(p?i/2:0)||0,C=a.select(".label-group").node().getBBox().height-(p?i/2:0)||0,E=a.select(".members-group").node().getBBox().height-(p?i/2:0)||0;if(o.members.length>0||o.methods.length>0||p){const P=f.line(_.x,A+C+b+i,_.x+_.width,A+C+b+i,g);a.insert(()=>P).attr("class","divider").attr("style",u)}if(p||o.members.length>0||o.methods.length>0){const P=f.line(_.x,A+C+E+b+n*2+i,_.x+_.width,A+C+E+b+i+n*2,g);a.insert(()=>P).attr("class","divider").attr("style",u)}if(o.look!=="handDrawn"&&a.selectAll("path").attr("style",u),S.select(":nth-child(2)").attr("style",u),a.selectAll(".divider").select("path").attr("style",u),t.labelStyle?a.selectAll("span").attr("style",t.labelStyle):a.selectAll("span").attr("style",u),!s){const P=RegExp(/color\s*:\s*([^;]*)/),z=P.exec(u);if(z){const D=z[0].replace("color","fill");a.selectAll("tspan").attr("style",D)}else if(c){const D=P.exec(c);if(D){const V=D[0].replace("color","fill");a.selectAll("tspan").attr("style",V)}}}return lt(t,S),t.intersect=function(P){return tt.rect(t,P)},a}m($w,"classBox");async function Aw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const n=t,s=t,o=20,a=20,l="verifyMethod"in t,c=ft(t),d=e.insert("g").attr("class",c).attr("id",t.domId??t.id);let u;l?u=await qr(d,`&lt;&lt;${n.type}&gt;&gt;`,0,t.labelStyle):u=await qr(d,"&lt;&lt;Element&gt;&gt;",0,t.labelStyle);let p=u;const f=await qr(d,n.name,p,t.labelStyle+"; font-weight: bold;");if(p+=f+a,l){const A=await qr(d,`${n.requirementId?`ID: ${n.requirementId}`:""}`,p,t.labelStyle);p+=A;const C=await qr(d,`${n.text?`Text: ${n.text}`:""}`,p,t.labelStyle);p+=C;const E=await qr(d,`${n.risk?`Risk: ${n.risk}`:""}`,p,t.labelStyle);p+=E,await qr(d,`${n.verifyMethod?`Verification: ${n.verifyMethod}`:""}`,p,t.labelStyle)}else{const A=await qr(d,`${s.type?`Type: ${s.type}`:""}`,p,t.labelStyle);p+=A,await qr(d,`${s.docRef?`Doc Ref: ${s.docRef}`:""}`,p,t.labelStyle)}const g=(d.node()?.getBBox().width??200)+o,x=(d.node()?.getBBox().height??200)+o,v=-g/2,y=-x/2,b=st.svg(d),w=ot(t,{});t.look!=="handDrawn"&&(w.roughness=0,w.fillStyle="solid");const S=b.rectangle(v,y,g,x,w),_=d.insert(()=>S,":first-child");if(_.attr("class","basic label-container").attr("style",i),d.selectAll(".label").each((A,C,E)=>{const P=Lt(E[C]),z=P.attr("transform");let D=0,V=0;if(z){const T=RegExp(/translate\(([^,]+),([^)]+)\)/).exec(z);T&&(D=parseFloat(T[1]),V=parseFloat(T[2]))}const H=V-x/2;let O=v+o/2;(C===0||C===1)&&(O=D),P.attr("transform",`translate(${O}, ${H+o})`)}),p>u+f+a){const A=b.line(v,y+u+f+a,v+g,y+u+f+a,w);d.insert(()=>A).attr("style",i)}return lt(t,_),t.intersect=function(A){return tt.rect(t,A)},d}m(Aw,"requirementBox");async function qr(e,t,r,i=""){if(t==="")return 0;const n=e.insert("g").attr("class","label").attr("style",i),s=Nt(),o=s.htmlLabels??!0,a=await Di(n,pp(_n(t)),{width:di(t,s)+50,classes:"markdown-node-label",useHtmlLabels:o,style:i},s);let l;if(o){const c=a.children[0],d=Lt(a);l=c.getBoundingClientRect(),d.attr("width",l.width),d.attr("height",l.height)}else{const c=a.children[0];for(const d of c.children)d.textContent=d.textContent.replaceAll("&gt;",">").replaceAll("&lt;","<"),i&&d.setAttribute("style",i);l=a.getBBox(),l.height+=6}return n.attr("transform",`translate(${-l.width/2},${-l.height/2+r})`),l.height}m(qr,"addText");var wD=m(e=>{switch(e){case"Very High":return"red";case"High":return"orange";case"Medium":return null;case"Low":return"blue";case"Very Low":return"lightblue"}},"colorFromPriority");async function jw(e,t,{config:r}){const{labelStyles:i,nodeStyles:n}=at(t);t.labelStyle=i||"";const s=10,o=t.width;t.width=(t.width??200)-10;const{shapeSvg:a,bbox:l,label:c}=await gt(e,t,ft(t)),d=t.padding||10;let u="",p;"ticket"in t&&t.ticket&&r?.kanban?.ticketBaseUrl&&(u=r?.kanban?.ticketBaseUrl.replace("#TICKET#",t.ticket),p=a.insert("svg:a",":first-child").attr("class","kanban-ticket-link").attr("xlink:href",u).attr("target","_blank"));const f={useHtmlLabels:t.useHtmlLabels,labelStyle:t.labelStyle||"",width:t.width,img:t.img,padding:t.padding||8,centerLabel:!1};let g,x;p?{label:g,bbox:x}=await Ph(p,"ticket"in t&&t.ticket||"",f):{label:g,bbox:x}=await Ph(a,"ticket"in t&&t.ticket||"",f);const{label:v,bbox:y}=await Ph(a,"assigned"in t&&t.assigned||"",f);t.width=o;const b=10,w=t?.width||0,S=Math.max(x.height,y.height)/2,_=Math.max(l.height+b*2,t?.height||0)+S,A=-w/2,C=-_/2;c.attr("transform","translate("+(d-w/2)+", "+(-S-l.height/2)+")"),g.attr("transform","translate("+(d-w/2)+", "+(-S+l.height/2)+")"),v.attr("transform","translate("+(d+w/2-y.width-2*s)+", "+(-S+l.height/2)+")");let E;const{rx:P,ry:z}=t,{cssStyles:D}=t;if(t.look==="handDrawn"){const V=st.svg(a),H=ot(t,{}),O=P||z?V.path(Fi(A,C,w,_,P||0),H):V.rectangle(A,C,w,_,H);E=a.insert(()=>O,":first-child"),E.attr("class","basic label-container").attr("style",D||null)}else{E=a.insert("rect",":first-child"),E.attr("class","basic label-container __APA__").attr("style",n).attr("rx",P??5).attr("ry",z??5).attr("x",A).attr("y",C).attr("width",w).attr("height",_);const V="priority"in t&&t.priority;if(V){const H=a.append("line"),O=A+2,R=C+Math.floor((P??0)/2),T=C+_-Math.floor((P??0)/2);H.attr("x1",O).attr("y1",R).attr("x2",O).attr("y2",T).attr("stroke-width","4").attr("stroke",wD(V))}}return lt(t,E),t.height=_,t.intersect=function(V){return tt.rect(t,V)},a}m(jw,"kanbanItem");async function Ew(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,halfPadding:o,label:a}=await gt(e,t,ft(t)),l=s.width+10*o,c=s.height+8*o,d=.15*l,{cssStyles:u}=t,p=s.width+20,f=s.height+20,g=Math.max(l,p),x=Math.max(c,f);a.attr("transform",`translate(${-s.width/2}, ${-s.height/2})`);let v;const y=`M0 0 
    a${d},${d} 1 0,0 ${g*.25},${-1*x*.1}
    a${d},${d} 1 0,0 ${g*.25},0
    a${d},${d} 1 0,0 ${g*.25},0
    a${d},${d} 1 0,0 ${g*.25},${x*.1}

    a${d},${d} 1 0,0 ${g*.15},${x*.33}
    a${d*.8},${d*.8} 1 0,0 0,${x*.34}
    a${d},${d} 1 0,0 ${-1*g*.15},${x*.33}

    a${d},${d} 1 0,0 ${-1*g*.25},${x*.15}
    a${d},${d} 1 0,0 ${-1*g*.25},0
    a${d},${d} 1 0,0 ${-1*g*.25},0
    a${d},${d} 1 0,0 ${-1*g*.25},${-1*x*.15}

    a${d},${d} 1 0,0 ${-1*g*.1},${-1*x*.33}
    a${d*.8},${d*.8} 1 0,0 0,${-1*x*.34}
    a${d},${d} 1 0,0 ${g*.1},${-1*x*.33}
  H0 V0 Z`;if(t.look==="handDrawn"){const b=st.svg(n),w=ot(t,{}),S=b.path(y,w);v=n.insert(()=>S,":first-child"),v.attr("class","basic label-container").attr("style",Ae(u))}else v=n.insert("path",":first-child").attr("class","basic label-container").attr("style",i).attr("d",y);return v.attr("transform",`translate(${-g/2}, ${-x/2})`),lt(t,v),t.calcIntersect=function(b,w){return tt.rect(b,w)},t.intersect=function(b){return q.info("Bang intersect",t,b),tt.rect(t,b)},n}m(Ew,"bang");async function Lw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,halfPadding:o,label:a}=await gt(e,t,ft(t)),l=s.width+2*o,c=s.height+2*o,d=.15*l,u=.25*l,p=.35*l,f=.2*l,{cssStyles:g}=t;let x;const v=`M0 0 
    a${d},${d} 0 0,1 ${l*.25},${-1*l*.1}
    a${p},${p} 1 0,1 ${l*.4},${-1*l*.1}
    a${u},${u} 1 0,1 ${l*.35},${l*.2}

    a${d},${d} 1 0,1 ${l*.15},${c*.35}
    a${f},${f} 1 0,1 ${-1*l*.15},${c*.65}

    a${u},${d} 1 0,1 ${-1*l*.25},${l*.15}
    a${p},${p} 1 0,1 ${-1*l*.5},0
    a${d},${d} 1 0,1 ${-1*l*.25},${-1*l*.15}

    a${d},${d} 1 0,1 ${-1*l*.1},${-1*c*.35}
    a${f},${f} 1 0,1 ${l*.1},${-1*c*.65}
  H0 V0 Z`;if(t.look==="handDrawn"){const y=st.svg(n),b=ot(t,{}),w=y.path(v,b);x=n.insert(()=>w,":first-child"),x.attr("class","basic label-container").attr("style",Ae(g))}else x=n.insert("path",":first-child").attr("class","basic label-container").attr("style",i).attr("d",v);return a.attr("transform",`translate(${-s.width/2}, ${-s.height/2})`),x.attr("transform",`translate(${-l/2}, ${-c/2})`),lt(t,x),t.calcIntersect=function(y,b){return tt.rect(y,b)},t.intersect=function(y){return q.info("Cloud intersect",t,y),tt.rect(t,y)},n}m(Lw,"cloud");async function Bw(e,t){const{labelStyles:r,nodeStyles:i}=at(t);t.labelStyle=r;const{shapeSvg:n,bbox:s,halfPadding:o,label:a}=await gt(e,t,ft(t)),l=s.width+8*o,c=s.height+2*o,d=5,u=`
    M${-l/2} ${c/2-d}
    v${-c+2*d}
    q0,-${d} ${d},-${d}
    h${l-2*d}
    q${d},0 ${d},${d}
    v${c-2*d}
    q0,${d} -${d},${d}
    h${-l+2*d}
    q-${d},0 -${d},-${d}
    Z
  `,p=n.append("path").attr("id","node-"+t.id).attr("class","node-bkg node-"+t.type).attr("style",i).attr("d",u);return n.append("line").attr("class","node-line-").attr("x1",-l/2).attr("y1",c/2).attr("x2",l/2).attr("y2",c/2),a.attr("transform",`translate(${-s.width/2}, ${-s.height/2})`),n.append(()=>a.node()),lt(t,p),t.calcIntersect=function(f,g){return tt.rect(f,g)},t.intersect=function(f){return tt.rect(t,f)},n}m(Bw,"defaultMindmapNode");async function Mw(e,t){const r={padding:t.padding??0};return rf(e,t,r)}m(Mw,"mindmapCircle");var kD=[{semanticName:"Process",name:"Rectangle",shortName:"rect",description:"Standard process shape",aliases:["proc","process","rectangle"],internalAliases:["squareRect"],handler:hw},{semanticName:"Event",name:"Rounded Rectangle",shortName:"rounded",description:"Represents an event",aliases:["event"],internalAliases:["roundedRect"],handler:aw},{semanticName:"Terminal Point",name:"Stadium",shortName:"stadium",description:"Terminal point",aliases:["terminal","pill"],handler:dw},{semanticName:"Subprocess",name:"Framed Rectangle",shortName:"fr-rect",description:"Subprocess",aliases:["subprocess","subproc","framed-rectangle","subroutine"],handler:gw},{semanticName:"Database",name:"Cylinder",shortName:"cyl",description:"Database storage",aliases:["db","database","cylinder"],handler:I2},{semanticName:"Start",name:"Circle",shortName:"circle",description:"Starting point",aliases:["circ"],handler:rf},{semanticName:"Bang",name:"Bang",shortName:"bang",description:"Bang",aliases:["bang"],handler:Ew},{semanticName:"Cloud",name:"Cloud",shortName:"cloud",description:"cloud",aliases:["cloud"],handler:Lw},{semanticName:"Decision",name:"Diamond",shortName:"diam",description:"Decision-making step",aliases:["decision","diamond","question"],handler:nw},{semanticName:"Prepare Conditional",name:"Hexagon",shortName:"hex",description:"Preparation or condition step",aliases:["hexagon","prepare"],handler:z2},{semanticName:"Data Input/Output",name:"Lean Right",shortName:"lean-r",description:"Represents input or output",aliases:["lean-right","in-out"],internalAliases:["lean_right"],handler:Z2},{semanticName:"Data Input/Output",name:"Lean Left",shortName:"lean-l",description:"Represents output or input",aliases:["lean-left","out-in"],internalAliases:["lean_left"],handler:Q2},{semanticName:"Priority Action",name:"Trapezoid Base Bottom",shortName:"trap-b",description:"Priority action",aliases:["priority","trapezoid-bottom","trapezoid"],handler:vw},{semanticName:"Manual Operation",name:"Trapezoid Base Top",shortName:"trap-t",description:"Represents a manual task",aliases:["manual","trapezoid-top","inv-trapezoid"],internalAliases:["inv_trapezoid"],handler:Y2},{semanticName:"Stop",name:"Double Circle",shortName:"dbl-circ",description:"Represents a stop point",aliases:["double-circle"],internalAliases:["doublecircle"],handler:R2},{semanticName:"Text Block",name:"Text Block",shortName:"text",description:"Text block",handler:bw},{semanticName:"Card",name:"Notched Rectangle",shortName:"notch-rect",description:"Represents a card",aliases:["card","notched-rectangle"],handler:T2},{semanticName:"Lined/Shaded Process",name:"Lined Rectangle",shortName:"lin-rect",description:"Lined process shape",aliases:["lined-rectangle","lined-process","lin-proc","shaded-process"],handler:lw},{semanticName:"Start",name:"Small Circle",shortName:"sm-circ",description:"Small starting point",aliases:["start","small-circle"],internalAliases:["stateStart"],handler:fw},{semanticName:"Stop",name:"Framed Circle",shortName:"fr-circ",description:"Stop point",aliases:["stop","framed-circle"],internalAliases:["stateEnd"],handler:pw},{semanticName:"Fork/Join",name:"Filled Rectangle",shortName:"fork",description:"Fork or join in process flow",aliases:["join"],internalAliases:["forkJoin"],handler:P2},{semanticName:"Collate",name:"Hourglass",shortName:"hourglass",description:"Represents a collate operation",aliases:["hourglass","collate"],handler:H2},{semanticName:"Comment",name:"Curly Brace",shortName:"brace",description:"Adds a comment",aliases:["comment","brace-l"],handler:E2},{semanticName:"Comment Right",name:"Curly Brace",shortName:"brace-r",description:"Adds a comment",handler:L2},{semanticName:"Comment with braces on both sides",name:"Curly Braces",shortName:"braces",description:"Adds a comment",handler:B2},{semanticName:"Com Link",name:"Lightning Bolt",shortName:"bolt",description:"Communication link",aliases:["com-link","lightning-bolt"],handler:J2},{semanticName:"Document",name:"Document",shortName:"doc",description:"Represents a document",aliases:["doc","document"],handler:Cw},{semanticName:"Delay",name:"Half-Rounded Rectangle",shortName:"delay",description:"Represents a delay",aliases:["half-rounded-rectangle"],handler:N2},{semanticName:"Direct Access Storage",name:"Horizontal Cylinder",shortName:"h-cyl",description:"Direct access storage",aliases:["das","horizontal-cylinder"],handler:yw},{semanticName:"Disk Storage",name:"Lined Cylinder",shortName:"lin-cyl",description:"Disk storage",aliases:["disk","lined-cylinder"],handler:K2},{semanticName:"Display",name:"Curved Trapezoid",shortName:"curv-trap",description:"Represents a display",aliases:["curved-trapezoid","display"],handler:M2},{semanticName:"Divided Process",name:"Divided Rectangle",shortName:"div-rect",description:"Divided process shape",aliases:["div-proc","divided-rectangle","divided-process"],handler:O2},{semanticName:"Extract",name:"Triangle",shortName:"tri",description:"Extraction process",aliases:["extract","triangle"],handler:kw},{semanticName:"Internal Storage",name:"Window Pane",shortName:"win-pane",description:"Internal storage",aliases:["internal-storage","window-pane"],handler:_w},{semanticName:"Junction",name:"Filled Circle",shortName:"f-circ",description:"Junction point",aliases:["junction","filled-circle"],handler:D2},{semanticName:"Loop Limit",name:"Trapezoidal Pentagon",shortName:"notch-pent",description:"Loop limit step",aliases:["loop-limit","notched-pentagon"],handler:ww},{semanticName:"Manual File",name:"Flipped Triangle",shortName:"flip-tri",description:"Manual file operation",aliases:["manual-file","flipped-triangle"],handler:F2},{semanticName:"Manual Input",name:"Sloped Rectangle",shortName:"sl-rect",description:"Manual input step",aliases:["manual-input","sloped-rectangle"],handler:cw},{semanticName:"Multi-Document",name:"Stacked Document",shortName:"docs",description:"Multiple documents",aliases:["documents","st-doc","stacked-document"],handler:rw},{semanticName:"Multi-Process",name:"Stacked Rectangle",shortName:"st-rect",description:"Multiple processes",aliases:["procs","processes","stacked-rectangle"],handler:ew},{semanticName:"Stored Data",name:"Bow Tie Rectangle",shortName:"bow-rect",description:"Stored data",aliases:["stored-data","bow-tie-rectangle"],handler:_2},{semanticName:"Summary",name:"Crossed Circle",shortName:"cross-circ",description:"Summary",aliases:["summary","crossed-circle"],handler:j2},{semanticName:"Tagged Document",name:"Tagged Document",shortName:"tag-doc",description:"Tagged document",aliases:["tag-doc","tagged-document"],handler:xw},{semanticName:"Tagged Process",name:"Tagged Rectangle",shortName:"tag-rect",description:"Tagged process",aliases:["tagged-rectangle","tag-proc","tagged-process"],handler:mw},{semanticName:"Paper Tape",name:"Flag",shortName:"flag",description:"Paper tape",aliases:["paper-tape"],handler:Sw},{semanticName:"Odd",name:"Odd",shortName:"odd",description:"Odd shape",internalAliases:["rect_left_inv_arrow"],handler:sw},{semanticName:"Lined Document",name:"Lined Document",shortName:"lin-doc",description:"Lined document",aliases:["lined-document"],handler:tw}],CD=m(()=>{const t=[...Object.entries({state:uw,choice:$2,note:iw,rectWithTitle:ow,labelRect:X2,iconSquare:U2,iconCircle:W2,icon:q2,iconRounded:V2,imageSquare:G2,anchor:S2,kanbanItem:jw,mindmapCircle:Mw,defaultMindmapNode:Bw,classBox:$w,erBox:nf,requirementBox:Aw}),...kD.flatMap(r=>[r.shortName,..."aliases"in r?r.aliases:[],..."internalAliases"in r?r.internalAliases:[]].map(n=>[n,r.handler]))];return Object.fromEntries(t)},"generateShapeMap"),Iw=CD();function SD(e){return e in Iw}m(SD,"isValidShape");var zc=new Map;async function Ow(e,t,r){let i,n;t.shape==="rect"&&(t.rx&&t.ry?t.shape="roundedRect":t.shape="squareRect");const s=t.shape?Iw[t.shape]:void 0;if(!s)throw new Error(`No such shape: ${t.shape}. Please check your syntax.`);if(t.link){let o;r.config.securityLevel==="sandbox"?o="_top":t.linkTarget&&(o=t.linkTarget||"_blank"),i=e.insert("svg:a").attr("xlink:href",t.link).attr("target",o??null),n=await s(i,t,r)}else n=await s(e,t,r),i=n;return t.tooltip&&n.attr("title",t.tooltip),zc.set(t.id,i),t.haveCallback&&i.attr("class",i.attr("class")+" clickable"),i}m(Ow,"insertNode");var F7=m((e,t)=>{zc.set(t.id,e)},"setNodeElem"),P7=m(()=>{zc.clear()},"clear"),N7=m(e=>{const t=zc.get(e.id);q.trace("Transforming node",e.diff,e,"translate("+(e.x-e.width/2-5)+", "+e.width/2+")");const r=8,i=e.diff||0;return e.clusterNode?t.attr("transform","translate("+(e.x+i-e.width/2)+", "+(e.y-e.height/2-r)+")"):t.attr("transform","translate("+e.x+", "+e.y+")"),i},"positionNode"),_D=m((e,t,r,i,n,s)=>{t.arrowTypeStart&&Jm(e,"start",t.arrowTypeStart,r,i,n,s),t.arrowTypeEnd&&Jm(e,"end",t.arrowTypeEnd,r,i,n,s)},"addEdgeMarkers"),TD={arrow_cross:{type:"cross",fill:!1},arrow_point:{type:"point",fill:!0},arrow_barb:{type:"barb",fill:!0},arrow_circle:{type:"circle",fill:!1},aggregation:{type:"aggregation",fill:!1},extension:{type:"extension",fill:!1},composition:{type:"composition",fill:!0},dependency:{type:"dependency",fill:!0},lollipop:{type:"lollipop",fill:!1},only_one:{type:"onlyOne",fill:!1},zero_or_one:{type:"zeroOrOne",fill:!1},one_or_more:{type:"oneOrMore",fill:!1},zero_or_more:{type:"zeroOrMore",fill:!1},requirement_arrow:{type:"requirement_arrow",fill:!1},requirement_contains:{type:"requirement_contains",fill:!1}},Jm=m((e,t,r,i,n,s,o)=>{const a=TD[r];if(!a){q.warn(`Unknown arrow type: ${r}`);return}const l=a.type,d=`${n}_${s}-${l}${t==="start"?"Start":"End"}`;if(o&&o.trim()!==""){const u=o.replace(/[^\dA-Za-z]/g,"_"),p=`${d}_${u}`;if(!document.getElementById(p)){const f=document.getElementById(d);if(f){const g=f.cloneNode(!0);g.id=p,g.querySelectorAll("path, circle, line").forEach(v=>{v.setAttribute("stroke",o),a.fill&&v.setAttribute("fill",o)}),f.parentNode?.appendChild(g)}}e.attr(`marker-${t}`,`url(${i}#${p})`)}else e.attr(`marker-${t}`,`url(${i}#${d})`)},"addEdgeMarker"),ic=new Map,ve=new Map,z7=m(()=>{ic.clear(),ve.clear()},"clear"),Pa=m(e=>e?e.reduce((r,i)=>r+";"+i,""):"","getLabelStyles"),$D=m(async(e,t)=>{let r=pe(Nt().flowchart.htmlLabels);const{labelStyles:i}=at(t);t.labelStyle=i;const n=await Di(e,t.label,{style:t.labelStyle,useHtmlLabels:r,addSvgBackground:!0,isNode:!1});q.info("abc82",t,t.labelType);const s=e.insert("g").attr("class","edgeLabel"),o=s.insert("g").attr("class","label").attr("data-id",t.id);o.node().appendChild(n);let a=n.getBBox();if(r){const c=n.children[0],d=Lt(n);a=c.getBoundingClientRect(),d.attr("width",a.width),d.attr("height",a.height)}o.attr("transform","translate("+-a.width/2+", "+-a.height/2+")"),ic.set(t.id,s),t.width=a.width,t.height=a.height;let l;if(t.startLabelLeft){const c=await nn(t.startLabelLeft,Pa(t.labelStyle)),d=e.insert("g").attr("class","edgeTerminals"),u=d.insert("g").attr("class","inner");l=u.node().appendChild(c);const p=c.getBBox();u.attr("transform","translate("+-p.width/2+", "+-p.height/2+")"),ve.get(t.id)||ve.set(t.id,{}),ve.get(t.id).startLeft=d,xo(l,t.startLabelLeft)}if(t.startLabelRight){const c=await nn(t.startLabelRight,Pa(t.labelStyle)),d=e.insert("g").attr("class","edgeTerminals"),u=d.insert("g").attr("class","inner");l=d.node().appendChild(c),u.node().appendChild(c);const p=c.getBBox();u.attr("transform","translate("+-p.width/2+", "+-p.height/2+")"),ve.get(t.id)||ve.set(t.id,{}),ve.get(t.id).startRight=d,xo(l,t.startLabelRight)}if(t.endLabelLeft){const c=await nn(t.endLabelLeft,Pa(t.labelStyle)),d=e.insert("g").attr("class","edgeTerminals"),u=d.insert("g").attr("class","inner");l=u.node().appendChild(c);const p=c.getBBox();u.attr("transform","translate("+-p.width/2+", "+-p.height/2+")"),d.node().appendChild(c),ve.get(t.id)||ve.set(t.id,{}),ve.get(t.id).endLeft=d,xo(l,t.endLabelLeft)}if(t.endLabelRight){const c=await nn(t.endLabelRight,Pa(t.labelStyle)),d=e.insert("g").attr("class","edgeTerminals"),u=d.insert("g").attr("class","inner");l=u.node().appendChild(c);const p=c.getBBox();u.attr("transform","translate("+-p.width/2+", "+-p.height/2+")"),d.node().appendChild(c),ve.get(t.id)||ve.set(t.id,{}),ve.get(t.id).endRight=d,xo(l,t.endLabelRight)}return n},"insertEdgeLabel");function xo(e,t){Nt().flowchart.htmlLabels&&e&&(e.style.width=t.length*9+"px",e.style.height="12px")}m(xo,"setTerminalWidth");var AD=m((e,t)=>{q.debug("Moving label abc88 ",e.id,e.label,ic.get(e.id),t);let r=t.updatedPath?t.updatedPath:t.originalPath;const i=Nt(),{subGraphTitleTotalMargin:n}=Mp(i);if(e.label){const s=ic.get(e.id);let o=e.x,a=e.y;if(r){const l=jr.calcLabelPosition(r);q.debug("Moving label "+e.label+" from (",o,",",a,") to (",l.x,",",l.y,") abc88"),t.updatedPath&&(o=l.x,a=l.y)}s.attr("transform",`translate(${o}, ${a+n/2})`)}if(e.startLabelLeft){const s=ve.get(e.id).startLeft;let o=e.x,a=e.y;if(r){const l=jr.calcTerminalLabelPosition(e.arrowTypeStart?10:0,"start_left",r);o=l.x,a=l.y}s.attr("transform",`translate(${o}, ${a})`)}if(e.startLabelRight){const s=ve.get(e.id).startRight;let o=e.x,a=e.y;if(r){const l=jr.calcTerminalLabelPosition(e.arrowTypeStart?10:0,"start_right",r);o=l.x,a=l.y}s.attr("transform",`translate(${o}, ${a})`)}if(e.endLabelLeft){const s=ve.get(e.id).endLeft;let o=e.x,a=e.y;if(r){const l=jr.calcTerminalLabelPosition(e.arrowTypeEnd?10:0,"end_left",r);o=l.x,a=l.y}s.attr("transform",`translate(${o}, ${a})`)}if(e.endLabelRight){const s=ve.get(e.id).endRight;let o=e.x,a=e.y;if(r){const l=jr.calcTerminalLabelPosition(e.arrowTypeEnd?10:0,"end_right",r);o=l.x,a=l.y}s.attr("transform",`translate(${o}, ${a})`)}},"positionEdgeLabel"),jD=m((e,t)=>{const r=e.x,i=e.y,n=Math.abs(t.x-r),s=Math.abs(t.y-i),o=e.width/2,a=e.height/2;return n>=o||s>=a},"outsideNode"),ED=m((e,t,r)=>{q.debug(`intersection calc abc89:
  outsidePoint: ${JSON.stringify(t)}
  insidePoint : ${JSON.stringify(r)}
  node        : x:${e.x} y:${e.y} w:${e.width} h:${e.height}`);const i=e.x,n=e.y,s=Math.abs(i-r.x),o=e.width/2;let a=r.x<t.x?o-s:o+s;const l=e.height/2,c=Math.abs(t.y-r.y),d=Math.abs(t.x-r.x);if(Math.abs(n-t.y)*o>Math.abs(i-t.x)*l){let u=r.y<t.y?t.y-l-n:n-l-t.y;a=d*u/c;const p={x:r.x<t.x?r.x+a:r.x-d+a,y:r.y<t.y?r.y+c-u:r.y-c+u};return a===0&&(p.x=t.x,p.y=t.y),d===0&&(p.x=t.x),c===0&&(p.y=t.y),q.debug(`abc89 top/bottom calc, Q ${c}, q ${u}, R ${d}, r ${a}`,p),p}else{r.x<t.x?a=t.x-o-i:a=i-o-t.x;let u=c*a/d,p=r.x<t.x?r.x+d-a:r.x-d+a,f=r.y<t.y?r.y+u:r.y-u;return q.debug(`sides calc abc89, Q ${c}, q ${u}, R ${d}, r ${a}`,{_x:p,_y:f}),a===0&&(p=t.x,f=t.y),d===0&&(p=t.x),c===0&&(f=t.y),{x:p,y:f}}},"intersection"),Km=m((e,t)=>{q.warn("abc88 cutPathAtIntersect",e,t);let r=[],i=e[0],n=!1;return e.forEach(s=>{if(q.info("abc88 checking point",s,t),!jD(t,s)&&!n){const o=ED(t,i,s);q.debug("abc88 inside",s,i,o),q.debug("abc88 intersection",o,t);let a=!1;r.forEach(l=>{a=a||l.x===o.x&&l.y===o.y}),r.some(l=>l.x===o.x&&l.y===o.y)?q.warn("abc88 no intersect",o,r):r.push(o),n=!0}else q.warn("abc88 outside",s,i),i=s,n||r.push(s)}),q.debug("returning points",r),r},"cutPathAtIntersect");function Rw(e){const t=[],r=[];for(let i=1;i<e.length-1;i++){const n=e[i-1],s=e[i],o=e[i+1];(n.x===s.x&&s.y===o.y&&Math.abs(s.x-o.x)>5&&Math.abs(s.y-n.y)>5||n.y===s.y&&s.x===o.x&&Math.abs(s.x-n.x)>5&&Math.abs(s.y-o.y)>5)&&(t.push(s),r.push(i))}return{cornerPoints:t,cornerPointPositions:r}}m(Rw,"extractCornerPoints");var t0=m(function(e,t,r){const i=t.x-e.x,n=t.y-e.y,s=Math.sqrt(i*i+n*n),o=r/s;return{x:t.x-o*i,y:t.y-o*n}},"findAdjacentPoint"),LD=m(function(e){const{cornerPointPositions:t}=Rw(e),r=[];for(let i=0;i<e.length;i++)if(t.includes(i)){const n=e[i-1],s=e[i+1],o=e[i],a=t0(n,o,5),l=t0(s,o,5),c=l.x-a.x,d=l.y-a.y;r.push(a);const u=Math.sqrt(2)*2;let p={x:o.x,y:o.y};if(Math.abs(s.x-n.x)>10&&Math.abs(s.y-n.y)>=10){q.debug("Corner point fixing",Math.abs(s.x-n.x),Math.abs(s.y-n.y));const f=5;o.x===a.x?p={x:c<0?a.x-f+u:a.x+f-u,y:d<0?a.y-u:a.y+u}:p={x:c<0?a.x-u:a.x+u,y:d<0?a.y-f+u:a.y+f-u}}else q.debug("Corner point skipping fixing",Math.abs(s.x-n.x),Math.abs(s.y-n.y));r.push(p,l)}else r.push(e[i]);return r},"fixCorners"),BD=m((e,t,r)=>{const i=e-t-r,n=2,s=2,o=n+s,a=Math.floor(i/o),l=Array(a).fill(`${n} ${s}`).join(" ");return`0 ${t} ${l} ${r}`},"generateDashArray"),MD=m(function(e,t,r,i,n,s,o,a=!1){const{handDrawnSeed:l}=Nt();let c=t.points,d=!1;const u=n;var p=s;const f=[];for(const O in t.cssCompiledStyles)pv(O)||f.push(t.cssCompiledStyles[O]);q.debug("UIO intersect check",t.points,p.x,u.x),p.intersect&&u.intersect&&!a&&(c=c.slice(1,t.points.length-1),c.unshift(u.intersect(c[0])),q.debug("Last point UIO",t.start,"-->",t.end,c[c.length-1],p,p.intersect(c[c.length-1])),c.push(p.intersect(c[c.length-1])));const g=btoa(JSON.stringify(c));t.toCluster&&(q.info("to cluster abc88",r.get(t.toCluster)),c=Km(t.points,r.get(t.toCluster).node),d=!0),t.fromCluster&&(q.debug("from cluster abc88",r.get(t.fromCluster),JSON.stringify(c,null,2)),c=Km(c.reverse(),r.get(t.fromCluster).node).reverse(),d=!0);let x=c.filter(O=>!Number.isNaN(O.y));x=LD(x);let v=ll;switch(v=Il,t.curve){case"linear":v=Il;break;case"basis":v=ll;break;case"cardinal":v=my;break;case"bumpX":v=dy;break;case"bumpY":v=uy;break;case"catmullRom":v=by;break;case"monotoneX":v=Sy;break;case"monotoneY":v=_y;break;case"natural":v=$y;break;case"step":v=Ay;break;case"stepAfter":v=Ey;break;case"stepBefore":v=jy;break;default:v=ll}const{x:y,y:b}=LM(t),w=fB().x(y).y(b).curve(v);let S;switch(t.thickness){case"normal":S="edge-thickness-normal";break;case"thick":S="edge-thickness-thick";break;case"invisible":S="edge-thickness-invisible";break;default:S="edge-thickness-normal"}switch(t.pattern){case"solid":S+=" edge-pattern-solid";break;case"dotted":S+=" edge-pattern-dotted";break;case"dashed":S+=" edge-pattern-dashed";break;default:S+=" edge-pattern-solid"}let _,A=t.curve==="rounded"?Dw(Fw(x,t),5):w(x);const C=Array.isArray(t.style)?t.style:[t.style];let E=C.find(O=>O?.startsWith("stroke:")),P=!1;if(t.look==="handDrawn"){const O=st.svg(e);Object.assign([],x);const R=O.path(A,{roughness:.3,seed:l});S+=" transition",_=Lt(R).select("path").attr("id",t.id).attr("class"," "+S+(t.classes?" "+t.classes:"")).attr("style",C?C.reduce((L,$)=>L+";"+$,""):"");let T=_.attr("d");_.attr("d",T),e.node().appendChild(_.node())}else{const O=f.join(";"),R=C?C.reduce((Y,F)=>Y+F+";",""):"";let T="";t.animate&&(T=" edge-animation-fast"),t.animation&&(T=" edge-animation-"+t.animation);const L=(O?O+";"+R+";":R)+";"+(C?C.reduce((Y,F)=>Y+";"+F,""):"");_=e.append("path").attr("d",A).attr("id",t.id).attr("class"," "+S+(t.classes?" "+t.classes:"")+(T??"")).attr("style",L),E=L.match(/stroke:([^;]+)/)?.[1],P=t.animate===!0||!!t.animation||O.includes("animation");const $=_.node(),N=typeof $.getTotalLength=="function"?$.getTotalLength():0,G=mm[t.arrowTypeStart]||0,Q=mm[t.arrowTypeEnd]||0;if(t.look==="neo"&&!P){const F=`stroke-dasharray: ${t.pattern==="dotted"||t.pattern==="dashed"?BD(N,G,Q):`0 ${G} ${N-G-Q} ${Q}`}; stroke-dashoffset: 0;`;_.attr("style",F+_.attr("style"))}}_.attr("data-edge",!0),_.attr("data-et","edge"),_.attr("data-id",t.id),_.attr("data-points",g),t.showPoints&&x.forEach(O=>{e.append("circle").style("stroke","red").style("fill","red").attr("r",1).attr("cx",O.x).attr("cy",O.y)});let z="";(Nt().flowchart.arrowMarkerAbsolute||Nt().state.arrowMarkerAbsolute)&&(z=window.location.protocol+"//"+window.location.host+window.location.pathname+window.location.search,z=z.replace(/\(/g,"\\(").replace(/\)/g,"\\)")),q.info("arrowTypeStart",t.arrowTypeStart),q.info("arrowTypeEnd",t.arrowTypeEnd),_D(_,t,z,o,i,E);const D=Math.floor(c.length/2),V=c[D];jr.isLabelCoordinateInPath(V,_.attr("d"))||(d=!0);let H={};return d&&(H.updatedPath=c),H.originalPath=t.points,H},"insertEdge");function Dw(e,t){if(e.length<2)return"";let r="";const i=e.length,n=1e-5;for(let s=0;s<i;s++){const o=e[s],a=e[s-1],l=e[s+1];if(s===0)r+=`M${o.x},${o.y}`;else if(s===i-1)r+=`L${o.x},${o.y}`;else{const c=o.x-a.x,d=o.y-a.y,u=l.x-o.x,p=l.y-o.y,f=Math.hypot(c,d),g=Math.hypot(u,p);if(f<n||g<n){r+=`L${o.x},${o.y}`;continue}const x=c/f,v=d/f,y=u/g,b=p/g,w=x*y+v*b,S=Math.max(-1,Math.min(1,w)),_=Math.acos(S);if(_<n||Math.abs(Math.PI-_)<n){r+=`L${o.x},${o.y}`;continue}const A=Math.min(t/Math.sin(_/2),f/2,g/2),C=o.x-x*A,E=o.y-v*A,P=o.x+y*A,z=o.y+b*A;r+=`L${C},${E}`,r+=`Q${o.x},${o.y} ${P},${z}`}}return r}m(Dw,"generateRoundedPath");function $u(e,t){if(!e||!t)return{angle:0,deltaX:0,deltaY:0};const r=t.x-e.x,i=t.y-e.y;return{angle:Math.atan2(i,r),deltaX:r,deltaY:i}}m($u,"calculateDeltaAndAngle");function Fw(e,t){const r=e.map(n=>({...n}));if(e.length>=2&&Ce[t.arrowTypeStart]){const n=Ce[t.arrowTypeStart],s=e[0],o=e[1],{angle:a}=$u(s,o),l=n*Math.cos(a),c=n*Math.sin(a);r[0].x=s.x+l,r[0].y=s.y+c}const i=e.length;if(i>=2&&Ce[t.arrowTypeEnd]){const n=Ce[t.arrowTypeEnd],s=e[i-1],o=e[i-2],{angle:a}=$u(o,s),l=n*Math.cos(a),c=n*Math.sin(a);r[i-1].x=s.x-l,r[i-1].y=s.y-c}return r}m(Fw,"applyMarkerOffsetsToPoints");var ID=m((e,t,r,i)=>{t.forEach(n=>{QD[n](e,r,i)})},"insertMarkers"),OD=m((e,t,r)=>{q.trace("Making markers for ",r),e.append("defs").append("marker").attr("id",r+"_"+t+"-extensionStart").attr("class","marker extension "+t).attr("refX",18).attr("refY",7).attr("markerWidth",190).attr("markerHeight",240).attr("orient","auto").append("path").attr("d","M 1,7 L18,13 V 1 Z"),e.append("defs").append("marker").attr("id",r+"_"+t+"-extensionEnd").attr("class","marker extension "+t).attr("refX",1).attr("refY",7).attr("markerWidth",20).attr("markerHeight",28).attr("orient","auto").append("path").attr("d","M 1,1 V 13 L18,7 Z")},"extension"),RD=m((e,t,r)=>{e.append("defs").append("marker").attr("id",r+"_"+t+"-compositionStart").attr("class","marker composition "+t).attr("refX",18).attr("refY",7).attr("markerWidth",190).attr("markerHeight",240).attr("orient","auto").append("path").attr("d","M 18,7 L9,13 L1,7 L9,1 Z"),e.append("defs").append("marker").attr("id",r+"_"+t+"-compositionEnd").attr("class","marker composition "+t).attr("refX",1).attr("refY",7).attr("markerWidth",20).attr("markerHeight",28).attr("orient","auto").append("path").attr("d","M 18,7 L9,13 L1,7 L9,1 Z")},"composition"),DD=m((e,t,r)=>{e.append("defs").append("marker").attr("id",r+"_"+t+"-aggregationStart").attr("class","marker aggregation "+t).attr("refX",18).attr("refY",7).attr("markerWidth",190).attr("markerHeight",240).attr("orient","auto").append("path").attr("d","M 18,7 L9,13 L1,7 L9,1 Z"),e.append("defs").append("marker").attr("id",r+"_"+t+"-aggregationEnd").attr("class","marker aggregation "+t).attr("refX",1).attr("refY",7).attr("markerWidth",20).attr("markerHeight",28).attr("orient","auto").append("path").attr("d","M 18,7 L9,13 L1,7 L9,1 Z")},"aggregation"),FD=m((e,t,r)=>{e.append("defs").append("marker").attr("id",r+"_"+t+"-dependencyStart").attr("class","marker dependency "+t).attr("refX",6).attr("refY",7).attr("markerWidth",190).attr("markerHeight",240).attr("orient","auto").append("path").attr("d","M 5,7 L9,13 L1,7 L9,1 Z"),e.append("defs").append("marker").attr("id",r+"_"+t+"-dependencyEnd").attr("class","marker dependency "+t).attr("refX",13).attr("refY",7).attr("markerWidth",20).attr("markerHeight",28).attr("orient","auto").append("path").attr("d","M 18,7 L9,13 L14,7 L9,1 Z")},"dependency"),PD=m((e,t,r)=>{e.append("defs").append("marker").attr("id",r+"_"+t+"-lollipopStart").attr("class","marker lollipop "+t).attr("refX",13).attr("refY",7).attr("markerWidth",190).attr("markerHeight",240).attr("orient","auto").append("circle").attr("stroke","black").attr("fill","transparent").attr("cx",7).attr("cy",7).attr("r",6),e.append("defs").append("marker").attr("id",r+"_"+t+"-lollipopEnd").attr("class","marker lollipop "+t).attr("refX",1).attr("refY",7).attr("markerWidth",190).attr("markerHeight",240).attr("orient","auto").append("circle").attr("stroke","black").attr("fill","transparent").attr("cx",7).attr("cy",7).attr("r",6)},"lollipop"),ND=m((e,t,r)=>{e.append("marker").attr("id",r+"_"+t+"-pointEnd").attr("class","marker "+t).attr("viewBox","0 0 10 10").attr("refX",5).attr("refY",5).attr("markerUnits","userSpaceOnUse").attr("markerWidth",8).attr("markerHeight",8).attr("orient","auto").append("path").attr("d","M 0 0 L 10 5 L 0 10 z").attr("class","arrowMarkerPath").style("stroke-width",1).style("stroke-dasharray","1,0"),e.append("marker").attr("id",r+"_"+t+"-pointStart").attr("class","marker "+t).attr("viewBox","0 0 10 10").attr("refX",4.5).attr("refY",5).attr("markerUnits","userSpaceOnUse").attr("markerWidth",8).attr("markerHeight",8).attr("orient","auto").append("path").attr("d","M 0 5 L 10 10 L 10 0 z").attr("class","arrowMarkerPath").style("stroke-width",1).style("stroke-dasharray","1,0")},"point"),zD=m((e,t,r)=>{e.append("marker").attr("id",r+"_"+t+"-circleEnd").attr("class","marker "+t).attr("viewBox","0 0 10 10").attr("refX",11).attr("refY",5).attr("markerUnits","userSpaceOnUse").attr("markerWidth",11).attr("markerHeight",11).attr("orient","auto").append("circle").attr("cx","5").attr("cy","5").attr("r","5").attr("class","arrowMarkerPath").style("stroke-width",1).style("stroke-dasharray","1,0"),e.append("marker").attr("id",r+"_"+t+"-circleStart").attr("class","marker "+t).attr("viewBox","0 0 10 10").attr("refX",-1).attr("refY",5).attr("markerUnits","userSpaceOnUse").attr("markerWidth",11).attr("markerHeight",11).attr("orient","auto").append("circle").attr("cx","5").attr("cy","5").attr("r","5").attr("class","arrowMarkerPath").style("stroke-width",1).style("stroke-dasharray","1,0")},"circle"),HD=m((e,t,r)=>{e.append("marker").attr("id",r+"_"+t+"-crossEnd").attr("class","marker cross "+t).attr("viewBox","0 0 11 11").attr("refX",12).attr("refY",5.2).attr("markerUnits","userSpaceOnUse").attr("markerWidth",11).attr("markerHeight",11).attr("orient","auto").append("path").attr("d","M 1,1 l 9,9 M 10,1 l -9,9").attr("class","arrowMarkerPath").style("stroke-width",2).style("stroke-dasharray","1,0"),e.append("marker").attr("id",r+"_"+t+"-crossStart").attr("class","marker cross "+t).attr("viewBox","0 0 11 11").attr("refX",-1).attr("refY",5.2).attr("markerUnits","userSpaceOnUse").attr("markerWidth",11).attr("markerHeight",11).attr("orient","auto").append("path").attr("d","M 1,1 l 9,9 M 10,1 l -9,9").attr("class","arrowMarkerPath").style("stroke-width",2).style("stroke-dasharray","1,0")},"cross"),qD=m((e,t,r)=>{e.append("defs").append("marker").attr("id",r+"_"+t+"-barbEnd").attr("refX",19).attr("refY",7).attr("markerWidth",20).attr("markerHeight",14).attr("markerUnits","userSpaceOnUse").attr("orient","auto").append("path").attr("d","M 19,7 L9,13 L14,7 L9,1 Z")},"barb"),WD=m((e,t,r)=>{e.append("defs").append("marker").attr("id",r+"_"+t+"-onlyOneStart").attr("class","marker onlyOne "+t).attr("refX",0).attr("refY",9).attr("markerWidth",18).attr("markerHeight",18).attr("orient","auto").append("path").attr("d","M9,0 L9,18 M15,0 L15,18"),e.append("defs").append("marker").attr("id",r+"_"+t+"-onlyOneEnd").attr("class","marker onlyOne "+t).attr("refX",18).attr("refY",9).attr("markerWidth",18).attr("markerHeight",18).attr("orient","auto").append("path").attr("d","M3,0 L3,18 M9,0 L9,18")},"only_one"),VD=m((e,t,r)=>{const i=e.append("defs").append("marker").attr("id",r+"_"+t+"-zeroOrOneStart").attr("class","marker zeroOrOne "+t).attr("refX",0).attr("refY",9).attr("markerWidth",30).attr("markerHeight",18).attr("orient","auto");i.append("circle").attr("fill","white").attr("cx",21).attr("cy",9).attr("r",6),i.append("path").attr("d","M9,0 L9,18");const n=e.append("defs").append("marker").attr("id",r+"_"+t+"-zeroOrOneEnd").attr("class","marker zeroOrOne "+t).attr("refX",30).attr("refY",9).attr("markerWidth",30).attr("markerHeight",18).attr("orient","auto");n.append("circle").attr("fill","white").attr("cx",9).attr("cy",9).attr("r",6),n.append("path").attr("d","M21,0 L21,18")},"zero_or_one"),UD=m((e,t,r)=>{e.append("defs").append("marker").attr("id",r+"_"+t+"-oneOrMoreStart").attr("class","marker oneOrMore "+t).attr("refX",18).attr("refY",18).attr("markerWidth",45).attr("markerHeight",36).attr("orient","auto").append("path").attr("d","M0,18 Q 18,0 36,18 Q 18,36 0,18 M42,9 L42,27"),e.append("defs").append("marker").attr("id",r+"_"+t+"-oneOrMoreEnd").attr("class","marker oneOrMore "+t).attr("refX",27).attr("refY",18).attr("markerWidth",45).attr("markerHeight",36).attr("orient","auto").append("path").attr("d","M3,9 L3,27 M9,18 Q27,0 45,18 Q27,36 9,18")},"one_or_more"),GD=m((e,t,r)=>{const i=e.append("defs").append("marker").attr("id",r+"_"+t+"-zeroOrMoreStart").attr("class","marker zeroOrMore "+t).attr("refX",18).attr("refY",18).attr("markerWidth",57).attr("markerHeight",36).attr("orient","auto");i.append("circle").attr("fill","white").attr("cx",48).attr("cy",18).attr("r",6),i.append("path").attr("d","M0,18 Q18,0 36,18 Q18,36 0,18");const n=e.append("defs").append("marker").attr("id",r+"_"+t+"-zeroOrMoreEnd").attr("class","marker zeroOrMore "+t).attr("refX",39).attr("refY",18).attr("markerWidth",57).attr("markerHeight",36).attr("orient","auto");n.append("circle").attr("fill","white").attr("cx",9).attr("cy",18).attr("r",6),n.append("path").attr("d","M21,18 Q39,0 57,18 Q39,36 21,18")},"zero_or_more"),YD=m((e,t,r)=>{e.append("defs").append("marker").attr("id",r+"_"+t+"-requirement_arrowEnd").attr("refX",20).attr("refY",10).attr("markerWidth",20).attr("markerHeight",20).attr("orient","auto").append("path").attr("d",`M0,0
      L20,10
      M20,10
      L0,20`)},"requirement_arrow"),XD=m((e,t,r)=>{const i=e.append("defs").append("marker").attr("id",r+"_"+t+"-requirement_containsStart").attr("refX",0).attr("refY",10).attr("markerWidth",20).attr("markerHeight",20).attr("orient","auto").append("g");i.append("circle").attr("cx",10).attr("cy",10).attr("r",9).attr("fill","none"),i.append("line").attr("x1",1).attr("x2",19).attr("y1",10).attr("y2",10),i.append("line").attr("y1",1).attr("y2",19).attr("x1",10).attr("x2",10)},"requirement_contains"),QD={extension:OD,composition:RD,aggregation:DD,dependency:FD,lollipop:PD,point:ND,circle:zD,cross:HD,barb:qD,only_one:WD,zero_or_one:VD,one_or_more:UD,zero_or_more:GD,requirement_arrow:YD,requirement_contains:XD},ZD=ID,JD={common:Bs,getConfig:Te,insertCluster:oD,insertEdge:MD,insertEdgeLabel:$D,insertMarkers:ZD,insertNode:Ow,interpolateToCurve:Fp,labelHelper:gt,log:q,positionEdgeLabel:AD},Go={},Pw=m(e=>{for(const t of e)Go[t.name]=t},"registerLayoutLoaders"),KD=m(()=>{Pw([{name:"dagre",loader:m(async()=>await Ht(()=>import("./dagre-6UL2VRFP.js"),__vite__mapDeps([0,1,2,3,4,5,6])),"loader")},{name:"cose-bilkent",loader:m(async()=>await Ht(()=>import("./cose-bilkent-S5V4N54A.js"),__vite__mapDeps([7,8,6])),"loader")}])},"registerDefaultLayoutLoaders");KD();var H7=m(async(e,t)=>{if(!(e.layoutAlgorithm in Go))throw new Error(`Unknown layout algorithm: ${e.layoutAlgorithm}`);const r=Go[e.layoutAlgorithm];return(await r.loader()).render(e,t,JD,{algorithm:r.algorithm})},"render"),q7=m((e="",{fallback:t="dagre"}={})=>{if(e in Go)return e;if(t in Go)return q.warn(`Layout algorithm ${e} is not registered. Using ${t} as fallback.`),t;throw new Error(`Both layout algorithms ${e} and ${t} are not registered.`)},"getRegisteredLayoutAlgorithm"),Nw="comm",zw="rule",Hw="decl",tF="@import",eF="@namespace",rF="@keyframes",iF="@layer",qw=Math.abs,sf=String.fromCharCode;function Ww(e){return e.trim()}function pl(e,t,r){return e.replace(t,r)}function nF(e,t,r){return e.indexOf(t,r)}function Kn(e,t){return e.charCodeAt(t)|0}function ks(e,t,r){return e.slice(t,r)}function Wr(e){return e.length}function sF(e){return e.length}function Na(e,t){return t.push(e),e}var Hc=1,Cs=1,Vw=0,wr=0,ae=0,Ds="";function of(e,t,r,i,n,s,o,a){return{value:e,root:t,parent:r,type:i,props:n,children:s,line:Hc,column:Cs,length:o,return:"",siblings:a}}function oF(){return ae}function aF(){return ae=wr>0?Kn(Ds,--wr):0,Cs--,ae===10&&(Cs=1,Hc--),ae}function Br(){return ae=wr<Vw?Kn(Ds,wr++):0,Cs++,ae===10&&(Cs=1,Hc++),ae}function Ci(){return Kn(Ds,wr)}function fl(){return wr}function qc(e,t){return ks(Ds,e,t)}function Yo(e){switch(e){case 0:case 9:case 10:case 13:case 32:return 5;case 33:case 43:case 44:case 47:case 62:case 64:case 126:case 59:case 123:case 125:return 4;case 58:return 3;case 34:case 39:case 40:case 91:return 2;case 41:case 93:return 1}return 0}function lF(e){return Hc=Cs=1,Vw=Wr(Ds=e),wr=0,[]}function cF(e){return Ds="",e}function Nh(e){return Ww(qc(wr-1,Au(e===91?e+2:e===40?e+1:e)))}function hF(e){for(;(ae=Ci())&&ae<33;)Br();return Yo(e)>2||Yo(ae)>3?"":" "}function dF(e,t){for(;--t&&Br()&&!(ae<48||ae>102||ae>57&&ae<65||ae>70&&ae<97););return qc(e,fl()+(t<6&&Ci()==32&&Br()==32))}function Au(e){for(;Br();)switch(ae){case e:return wr;case 34:case 39:e!==34&&e!==39&&Au(ae);break;case 40:e===41&&Au(e);break;case 92:Br();break}return wr}function uF(e,t){for(;Br()&&e+ae!==57;)if(e+ae===84&&Ci()===47)break;return"/*"+qc(t,wr-1)+"*"+sf(e===47?e:Br())}function pF(e){for(;!Yo(Ci());)Br();return qc(e,wr)}function fF(e){return cF(gl("",null,null,null,[""],e=lF(e),0,[0],e))}function gl(e,t,r,i,n,s,o,a,l){for(var c=0,d=0,u=o,p=0,f=0,g=0,x=1,v=1,y=1,b=0,w="",S=n,_=s,A=i,C=w;v;)switch(g=b,b=Br()){case 40:if(g!=108&&Kn(C,u-1)==58){nF(C+=pl(Nh(b),"&","&\f"),"&\f",qw(c?a[c-1]:0))!=-1&&(y=-1);break}case 34:case 39:case 91:C+=Nh(b);break;case 9:case 10:case 13:case 32:C+=hF(g);break;case 92:C+=dF(fl()-1,7);continue;case 47:switch(Ci()){case 42:case 47:Na(gF(uF(Br(),fl()),t,r,l),l),(Yo(g||1)==5||Yo(Ci()||1)==5)&&Wr(C)&&ks(C,-1,void 0)!==" "&&(C+=" ");break;default:C+="/"}break;case 123*x:a[c++]=Wr(C)*y;case 125*x:case 59:case 0:switch(b){case 0:case 125:v=0;case 59+d:y==-1&&(C=pl(C,/\f/g,"")),f>0&&(Wr(C)-u||x===0&&g===47)&&Na(f>32?r0(C+";",i,r,u-1,l):r0(pl(C," ","")+";",i,r,u-2,l),l);break;case 59:C+=";";default:if(Na(A=e0(C,t,r,c,d,n,a,w,S=[],_=[],u,s),s),b===123)if(d===0)gl(C,t,A,A,S,s,u,a,_);else{switch(p){case 99:if(Kn(C,3)===110)break;case 108:if(Kn(C,2)===97)break;default:d=0;case 100:case 109:case 115:}d?gl(e,A,A,i&&Na(e0(e,A,A,0,0,n,a,w,n,S=[],u,_),_),n,_,u,a,i?S:_):gl(C,A,A,A,[""],_,0,a,_)}}c=d=f=0,x=y=1,w=C="",u=o;break;case 58:u=1+Wr(C),f=g;default:if(x<1){if(b==123)--x;else if(b==125&&x++==0&&aF()==125)continue}switch(C+=sf(b),b*x){case 38:y=d>0?1:(C+="\f",-1);break;case 44:a[c++]=(Wr(C)-1)*y,y=1;break;case 64:Ci()===45&&(C+=Nh(Br())),p=Ci(),d=u=Wr(w=C+=pF(fl())),b++;break;case 45:g===45&&Wr(C)==2&&(x=0)}}return s}function e0(e,t,r,i,n,s,o,a,l,c,d,u){for(var p=n-1,f=n===0?s:[""],g=sF(f),x=0,v=0,y=0;x<i;++x)for(var b=0,w=ks(e,p+1,p=qw(v=o[x])),S=e;b<g;++b)(S=Ww(v>0?f[b]+" "+w:pl(w,/&\f/g,f[b])))&&(l[y++]=S);return of(e,t,r,n===0?zw:a,l,c,d,u)}function gF(e,t,r,i){return of(e,t,r,Nw,sf(oF()),ks(e,2,-2),0,i)}function r0(e,t,r,i,n){return of(e,t,r,Hw,ks(e,0,i),ks(e,i+1,-1),i,n)}function ju(e,t){for(var r="",i=0;i<e.length;i++)r+=t(e[i],i,e,t)||"";return r}function mF(e,t,r,i){switch(e.type){case iF:if(e.children.length)break;case tF:case eF:case Hw:return e.return=e.return||e.value;case Nw:return"";case rF:return e.return=e.value+"{"+ju(e.children,i)+"}";case zw:if(!Wr(e.value=e.props.join(",")))return""}return Wr(r=ju(e.children,i))?e.return=e.value+"{"+r+"}":""}var xF=xv(Object.keys,Object),bF=Object.prototype,yF=bF.hasOwnProperty;function vF(e){if(!Bc(e))return xF(e);var t=[];for(var r in Object(e))yF.call(e,r)&&r!="constructor"&&t.push(r);return t}var Eu=Sn(Qr,"DataView"),Lu=Sn(Qr,"Promise"),Bu=Sn(Qr,"Set"),Mu=Sn(Qr,"WeakMap"),i0="[object Map]",wF="[object Object]",n0="[object Promise]",s0="[object Set]",o0="[object WeakMap]",a0="[object DataView]",kF=Cn(Eu),CF=Cn(Vo),SF=Cn(Lu),_F=Cn(Bu),TF=Cn(Mu),Xi=Is;(Eu&&Xi(new Eu(new ArrayBuffer(1)))!=a0||Vo&&Xi(new Vo)!=i0||Lu&&Xi(Lu.resolve())!=n0||Bu&&Xi(new Bu)!=s0||Mu&&Xi(new Mu)!=o0)&&(Xi=function(e){var t=Is(e),r=t==wF?e.constructor:void 0,i=r?Cn(r):"";if(i)switch(i){case kF:return a0;case CF:return i0;case SF:return n0;case _F:return s0;case TF:return o0}return t});var $F="[object Map]",AF="[object Set]",jF=Object.prototype,EF=jF.hasOwnProperty;function l0(e){if(e==null)return!0;if(Mc(e)&&(Gl(e)||typeof e=="string"||typeof e.splice=="function"||Rp(e)||Dp(e)||Ul(e)))return!e.length;var t=Xi(e);if(t==$F||t==AF)return!e.size;if(Bc(e))return!vF(e).length;for(var r in e)if(EF.call(e,r))return!1;return!0}var Uw="c4",LF=m(e=>/^\s*C4Context|C4Container|C4Component|C4Dynamic|C4Deployment/.test(e),"detector"),BF=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./c4Diagram-YG6GDRKO.js");return{diagram:t}},__vite__mapDeps([9,10,6]));return{id:Uw,diagram:e}},"loader"),MF={id:Uw,detector:LF,loader:BF},IF=MF,Gw="flowchart",OF=m((e,t)=>t?.flowchart?.defaultRenderer==="dagre-wrapper"||t?.flowchart?.defaultRenderer==="elk"?!1:/^\s*graph/.test(e),"detector"),RF=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./flowDiagram-NV44I4VS.js");return{diagram:t}},__vite__mapDeps([11,12,13,14,15,6]));return{id:Gw,diagram:e}},"loader"),DF={id:Gw,detector:OF,loader:RF},FF=DF,Yw="flowchart-v2",PF=m((e,t)=>t?.flowchart?.defaultRenderer==="dagre-d3"?!1:(t?.flowchart?.defaultRenderer==="elk"&&(t.layout="elk"),/^\s*graph/.test(e)&&t?.flowchart?.defaultRenderer==="dagre-wrapper"?!0:/^\s*flowchart/.test(e)),"detector"),NF=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./flowDiagram-NV44I4VS.js");return{diagram:t}},__vite__mapDeps([11,12,13,14,15,6]));return{id:Yw,diagram:e}},"loader"),zF={id:Yw,detector:PF,loader:NF},HF=zF,Xw="er",qF=m(e=>/^\s*erDiagram/.test(e),"detector"),WF=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./erDiagram-Q2GNP2WA.js");return{diagram:t}},__vite__mapDeps([16,13,14,15,6]));return{id:Xw,diagram:e}},"loader"),VF={id:Xw,detector:qF,loader:WF},UF=VF,Qw="gitGraph",GF=m(e=>/^\s*gitGraph/.test(e),"detector"),YF=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./gitGraphDiagram-NY62KEGX.js");return{diagram:t}},__vite__mapDeps([17,18,19,20,2,4,5,6]));return{id:Qw,diagram:e}},"loader"),XF={id:Qw,detector:GF,loader:YF},QF=XF,Zw="gantt",ZF=m(e=>/^\s*gantt/.test(e),"detector"),JF=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./ganttDiagram-JELNMOA3.js");return{diagram:t}},__vite__mapDeps([21,6,22,23,24]));return{id:Zw,diagram:e}},"loader"),KF={id:Zw,detector:ZF,loader:JF},t6=KF,Jw="info",e6=m(e=>/^\s*info/.test(e),"detector"),r6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./infoDiagram-WHAUD3N6.js");return{diagram:t}},__vite__mapDeps([25,20,2,4,5,6]));return{id:Jw,diagram:e}},"loader"),i6={id:Jw,detector:e6,loader:r6},Kw="pie",n6=m(e=>/^\s*pie/.test(e),"detector"),s6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./pieDiagram-ADFJNKIX.js");return{diagram:t}},__vite__mapDeps([26,18,20,2,4,5,27,28,23,6]));return{id:Kw,diagram:e}},"loader"),o6={id:Kw,detector:n6,loader:s6},tk="quadrantChart",a6=m(e=>/^\s*quadrantChart/.test(e),"detector"),l6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./quadrantDiagram-AYHSOK5B.js");return{diagram:t}},__vite__mapDeps([29,22,23,24,6]));return{id:tk,diagram:e}},"loader"),c6={id:tk,detector:a6,loader:l6},h6=c6,ek="xychart",d6=m(e=>/^\s*xychart(-beta)?/.test(e),"detector"),u6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./xychartDiagram-PRI3JC2R.js");return{diagram:t}},__vite__mapDeps([30,23,28,22,24,6]));return{id:ek,diagram:e}},"loader"),p6={id:ek,detector:d6,loader:u6},f6=p6,rk="requirement",g6=m(e=>/^\s*requirement(Diagram)?/.test(e),"detector"),m6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./requirementDiagram-UZGBJVZJ.js");return{diagram:t}},__vite__mapDeps([31,13,14,6]));return{id:rk,diagram:e}},"loader"),x6={id:rk,detector:g6,loader:m6},b6=x6,ik="sequence",y6=m(e=>/^\s*sequenceDiagram/.test(e),"detector"),v6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./sequenceDiagram-WL72ISMW.js");return{diagram:t}},__vite__mapDeps([32,10,19,6]));return{id:ik,diagram:e}},"loader"),w6={id:ik,detector:y6,loader:v6},k6=w6,nk="class",C6=m((e,t)=>t?.class?.defaultRenderer==="dagre-wrapper"?!1:/^\s*classDiagram/.test(e),"detector"),S6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./classDiagram-2ON5EDUG.js");return{diagram:t}},__vite__mapDeps([33,34,12,13,14,6]));return{id:nk,diagram:e}},"loader"),_6={id:nk,detector:C6,loader:S6},T6=_6,sk="classDiagram",$6=m((e,t)=>/^\s*classDiagram/.test(e)&&t?.class?.defaultRenderer==="dagre-wrapper"?!0:/^\s*classDiagram-v2/.test(e),"detector"),A6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./classDiagram-v2-WZHVMYZB.js");return{diagram:t}},__vite__mapDeps([35,34,12,13,14,6]));return{id:sk,diagram:e}},"loader"),j6={id:sk,detector:$6,loader:A6},E6=j6,ok="state",L6=m((e,t)=>t?.state?.defaultRenderer==="dagre-wrapper"?!1:/^\s*stateDiagram/.test(e),"detector"),B6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./stateDiagram-FKZM4ZOC.js");return{diagram:t}},__vite__mapDeps([36,37,13,14,1,2,3,4,6]));return{id:ok,diagram:e}},"loader"),M6={id:ok,detector:L6,loader:B6},I6=M6,ak="stateDiagram",O6=m((e,t)=>!!(/^\s*stateDiagram-v2/.test(e)||/^\s*stateDiagram/.test(e)&&t?.state?.defaultRenderer==="dagre-wrapper"),"detector"),R6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./stateDiagram-v2-4FDKWEC3.js");return{diagram:t}},__vite__mapDeps([38,37,13,14,6]));return{id:ak,diagram:e}},"loader"),D6={id:ak,detector:O6,loader:R6},F6=D6,lk="journey",P6=m(e=>/^\s*journey/.test(e),"detector"),N6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./journeyDiagram-XKPGCS4Q.js");return{diagram:t}},__vite__mapDeps([39,10,12,27,6]));return{id:lk,diagram:e}},"loader"),z6={id:lk,detector:P6,loader:N6},H6=z6,q6=m((e,t,r)=>{q.debug(`rendering svg for syntax error
`);const i=CB(t),n=i.append("g");i.attr("viewBox","0 0 2412 512"),Ib(i,100,512,!0),n.append("path").attr("class","error-icon").attr("d","m411.313,123.313c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32-9.375,9.375-20.688-20.688c-12.484-12.5-32.766-12.5-45.25,0l-16,16c-1.261,1.261-2.304,2.648-3.31,4.051-21.739-8.561-45.324-13.426-70.065-13.426-105.867,0-192,86.133-192,192s86.133,192 192,192 192-86.133 192-192c0-24.741-4.864-48.327-13.426-70.065 1.402-1.007 2.79-2.049 4.051-3.31l16-16c12.5-12.492 12.5-32.758 0-45.25l-20.688-20.688 9.375-9.375 32.001-31.999zm-219.313,100.687c-52.938,0-96,43.063-96,96 0,8.836-7.164,16-16,16s-16-7.164-16-16c0-70.578 57.422-128 128-128 8.836,0 16,7.164 16,16s-7.164,16-16,16z"),n.append("path").attr("class","error-icon").attr("d","m459.02,148.98c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l16,16c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16.001-16z"),n.append("path").attr("class","error-icon").attr("d","m340.395,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16-16c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l15.999,16z"),n.append("path").attr("class","error-icon").attr("d","m400,64c8.844,0 16-7.164 16-16v-32c0-8.836-7.156-16-16-16-8.844,0-16,7.164-16,16v32c0,8.836 7.156,16 16,16z"),n.append("path").attr("class","error-icon").attr("d","m496,96.586h-32c-8.844,0-16,7.164-16,16 0,8.836 7.156,16 16,16h32c8.844,0 16-7.164 16-16 0-8.836-7.156-16-16-16z"),n.append("path").attr("class","error-icon").attr("d","m436.98,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688l32-32c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32c-6.251,6.25-6.251,16.375-0.001,22.625z"),n.append("text").attr("class","error-text").attr("x",1440).attr("y",250).attr("font-size","150px").style("text-anchor","middle").text("Syntax error in text"),n.append("text").attr("class","error-text").attr("x",1250).attr("y",400).attr("font-size","100px").style("text-anchor","middle").text(`mermaid version ${r}`)},"draw"),ck={draw:q6},W6=ck,V6={db:{},renderer:ck,parser:{parse:m(()=>{},"parse")}},U6=V6,hk="flowchart-elk",G6=m((e,t={})=>/^\s*flowchart-elk/.test(e)||/^\s*(flowchart|graph)/.test(e)&&t?.flowchart?.defaultRenderer==="elk"?(t.layout="elk",!0):!1,"detector"),Y6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./flowDiagram-NV44I4VS.js");return{diagram:t}},__vite__mapDeps([11,12,13,14,15,6]));return{id:hk,diagram:e}},"loader"),X6={id:hk,detector:G6,loader:Y6},Q6=X6,dk="timeline",Z6=m(e=>/^\s*timeline/.test(e),"detector"),J6=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./timeline-definition-IT6M3QCI.js");return{diagram:t}},__vite__mapDeps([40,27,6]));return{id:dk,diagram:e}},"loader"),K6={id:dk,detector:Z6,loader:J6},t4=K6,uk="mindmap",e4=m(e=>/^\s*mindmap/.test(e),"detector"),r4=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./mindmap-definition-VGOIOE7T.js");return{diagram:t}},__vite__mapDeps([41,13,14,6]));return{id:uk,diagram:e}},"loader"),i4={id:uk,detector:e4,loader:r4},n4=i4,pk="kanban",s4=m(e=>/^\s*kanban/.test(e),"detector"),o4=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./kanban-definition-3W4ZIXB7.js");return{diagram:t}},__vite__mapDeps([42,12,6]));return{id:pk,diagram:e}},"loader"),a4={id:pk,detector:s4,loader:o4},l4=a4,fk="sankey",c4=m(e=>/^\s*sankey(-beta)?/.test(e),"detector"),h4=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./sankeyDiagram-TZEHDZUN.js");return{diagram:t}},__vite__mapDeps([43,28,23,6]));return{id:fk,diagram:e}},"loader"),d4={id:fk,detector:c4,loader:h4},u4=d4,gk="packet",p4=m(e=>/^\s*packet(-beta)?/.test(e),"detector"),f4=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./diagram-S2PKOQOG.js");return{diagram:t}},__vite__mapDeps([44,18,20,2,4,5,6]));return{id:gk,diagram:e}},"loader"),g4={id:gk,detector:p4,loader:f4},mk="radar",m4=m(e=>/^\s*radar-beta/.test(e),"detector"),x4=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./diagram-QEK2KX5R.js");return{diagram:t}},__vite__mapDeps([45,18,20,2,4,5,6]));return{id:mk,diagram:e}},"loader"),b4={id:mk,detector:m4,loader:x4},xk="block",y4=m(e=>/^\s*block(-beta)?/.test(e),"detector"),v4=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./blockDiagram-VD42YOAC.js");return{diagram:t}},__vite__mapDeps([46,12,5,2,1,15,6]));return{id:xk,diagram:e}},"loader"),w4={id:xk,detector:y4,loader:v4},k4=w4,bk="architecture",C4=m(e=>/^\s*architecture/.test(e),"detector"),S4=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./architectureDiagram-VXUJARFQ.js");return{diagram:t}},__vite__mapDeps([47,18,20,2,4,5,8,6]));return{id:bk,diagram:e}},"loader"),_4={id:bk,detector:C4,loader:S4},T4=_4,yk="treemap",$4=m(e=>/^\s*treemap/.test(e),"detector"),A4=m(async()=>{const{diagram:e}=await Ht(async()=>{const{diagram:t}=await import("./diagram-PSM6KHXK.js");return{diagram:t}},__vite__mapDeps([48,14,18,20,2,4,5,24,28,23,6]));return{id:yk,diagram:e}},"loader"),j4={id:yk,detector:$4,loader:A4},c0=!1,Wc=m(()=>{c0||(c0=!0,$l("error",U6,e=>e.toLowerCase().trim()==="error"),$l("---",{db:{clear:m(()=>{},"clear")},styles:{},renderer:{draw:m(()=>{},"draw")},parser:{parse:m(()=>{throw new Error("Diagrams beginning with --- are not valid. If you were trying to use a YAML front-matter, please ensure that you've correctly opened and closed the YAML front-matter with un-indented `---` blocks")},"parse")},init:m(()=>null,"init")},e=>e.toLowerCase().trimStart().startsWith("---")),Nd(Q6,n4,T4),Nd(IF,l4,E6,T6,UF,t6,i6,o6,b6,k6,HF,FF,t4,QF,F6,I6,H6,h6,u4,g4,f6,k4,b4,j4))},"addDiagrams"),E4=m(async()=>{q.debug("Loading registered diagrams");const t=(await Promise.allSettled(Object.entries(hn).map(async([r,{detector:i,loader:n}])=>{if(n)try{Wd(r)}catch{try{const{diagram:s,id:o}=await n();$l(o,s,i)}catch(s){throw q.error(`Failed to load external diagram with key ${r}. Removing from detectors.`),delete hn[r],s}}}))).filter(r=>r.status==="rejected");if(t.length>0){q.error(`Failed to load ${t.length} external diagrams`);for(const r of t)q.error(r);throw new Error(`Failed to load ${t.length} external diagrams`)}},"loadRegisteredDiagrams"),L4="graphics-document document";function vk(e,t){e.attr("role",L4),t!==""&&e.attr("aria-roledescription",t)}m(vk,"setA11yDiagramInfo");function wk(e,t,r,i){if(e.insert!==void 0){if(r){const n=`chart-desc-${i}`;e.attr("aria-describedby",n),e.insert("desc",":first-child").attr("id",n).text(r)}if(t){const n=`chart-title-${i}`;e.attr("aria-labelledby",n),e.insert("title",":first-child").attr("id",n).text(t)}}}m(wk,"addSVGa11yTitleDescription");var cn,Iu=(cn=class{constructor(t,r,i,n,s){this.type=t,this.text=r,this.db=i,this.parser=n,this.renderer=s}static async fromText(t,r={}){const i=Te(),n=ap(t,i);t=jO(t)+`
`;try{Wd(n)}catch{const c=K$(n);if(!c)throw new kb(`Diagram ${n} not found.`);const{id:d,diagram:u}=await c();$l(d,u)}const{db:s,parser:o,renderer:a,init:l}=Wd(n);return o.parser&&(o.parser.yy=s),s.clear?.(),l?.(i),r.title&&s.setDiagramTitle?.(r.title),await o.parse(t),new cn(n,t,s,o,a)}async render(t,r){await this.renderer.draw(this.text,t,r,this)}getParser(){return this.parser}getType(){return this.type}},m(cn,"Diagram"),cn),h0=[],B4=m(()=>{h0.forEach(e=>{e()}),h0=[]},"attachFunctions"),M4=m(e=>e.replace(/^\s*%%(?!{)[^\n]+\n?/gm,"").trimStart(),"cleanupComments");function kk(e){const t=e.match(wb);if(!t)return{text:e,metadata:{}};let r=EM(t[1],{schema:jM})??{};r=typeof r=="object"&&!Array.isArray(r)?r:{};const i={};return r.displayMode&&(i.displayMode=r.displayMode.toString()),r.title&&(i.title=r.title.toString()),r.config&&(i.config=r.config),{text:e.slice(t[0].length),metadata:i}}m(kk,"extractFrontMatter");var I4=m(e=>e.replace(/\r\n?/g,`
`).replace(/<(\w+)([^>]*)>/g,(t,r,i)=>"<"+r+i.replace(/="([^"]*)"/g,"='$1'")+">"),"cleanupText"),O4=m(e=>{const{text:t,metadata:r}=kk(e),{displayMode:i,title:n,config:s={}}=r;return i&&(s.gantt||(s.gantt={}),s.gantt.displayMode=i),{title:n,config:s,text:t}},"processFrontmatter"),R4=m(e=>{const t=jr.detectInit(e)??{},r=jr.detectDirective(e,"wrap");return Array.isArray(r)?t.wrap=r.some(({type:i})=>i==="wrap"):r?.type==="wrap"&&(t.wrap=!0),{text:mO(e),directive:t}},"processDirectives");function af(e){const t=I4(e),r=O4(t),i=R4(r.text),n=qp(r.config,i.directive);return e=M4(i.text),{code:e,title:r.title,config:n}}m(af,"preprocessDiagram");function Ck(e){const t=new TextEncoder().encode(e),r=Array.from(t,i=>String.fromCodePoint(i)).join("");return btoa(r)}m(Ck,"toBase64");var D4=5e4,F4="graph TB;a[Maximum text size in diagram exceeded];style a fill:#faa",P4="sandbox",N4="loose",z4="http://www.w3.org/2000/svg",H4="http://www.w3.org/1999/xlink",q4="http://www.w3.org/1999/xhtml",W4="100%",V4="100%",U4="border:0;margin:0;",G4="margin:0",Y4="allow-top-navigation-by-user-activation allow-popups",X4='The "iframe" tag is not supported by your browser.',Q4=["foreignobject"],Z4=["dominant-baseline"];function lf(e){const t=af(e);return _l(),gA(t.config??{}),t}m(lf,"processAndSetConfigs");async function Sk(e,t){Wc();try{const{code:r,config:i}=lf(e);return{diagramType:(await Tk(r)).type,config:i}}catch(r){if(t?.suppressErrors)return!1;throw r}}m(Sk,"parse");var d0=m((e,t,r=[])=>`
.${e} ${t} { ${r.join(" !important; ")} !important; }`,"cssImportantStyles"),J4=m((e,t=new Map)=>{let r="";if(e.themeCSS!==void 0&&(r+=`
${e.themeCSS}`),e.fontFamily!==void 0&&(r+=`
:root { --mermaid-font-family: ${e.fontFamily}}`),e.altFontFamily!==void 0&&(r+=`
:root { --mermaid-alt-font-family: ${e.altFontFamily}}`),t instanceof Map){const o=e.htmlLabels??e.flowchart?.htmlLabels?["> *","span"]:["rect","polygon","ellipse","circle","path"];t.forEach(a=>{l0(a.styles)||o.forEach(l=>{r+=d0(a.id,l,a.styles)}),l0(a.textStyles)||(r+=d0(a.id,"tspan",(a?.textStyles||[]).map(l=>l.replace("color","fill"))))})}return r},"createCssStyles"),K4=m((e,t,r,i)=>{const n=J4(e,r),s=OA(t,n,e.themeVariables);return ju(fF(`${i}{${s}}`),mF)},"createUserStyles"),tP=m((e="",t,r)=>{let i=e;return!r&&!t&&(i=i.replace(/marker-end="url\([\d+./:=?A-Za-z-]*?#/g,'marker-end="url(#')),i=_n(i),i=i.replace(/<br>/g,"<br/>"),i},"cleanUpSvgCode"),eP=m((e="",t)=>{const r=t?.viewBox?.baseVal?.height?t.viewBox.baseVal.height+"px":V4,i=Ck(`<body style="${G4}">${e}</body>`);return`<iframe style="width:${W4};height:${r};${U4}" src="data:text/html;charset=UTF-8;base64,${i}" sandbox="${Y4}">
  ${X4}
</iframe>`},"putIntoIFrame"),u0=m((e,t,r,i,n)=>{const s=e.append("div");s.attr("id",r),i&&s.attr("style",i);const o=s.append("svg").attr("id",t).attr("width","100%").attr("xmlns",z4);return n&&o.attr("xmlns:xlink",n),o.append("g"),e},"appendDivSvgG");function Ou(e,t){return e.append("iframe").attr("id",t).attr("style","width: 100%; height: 100%;").attr("sandbox","")}m(Ou,"sandboxedIframe");var rP=m((e,t,r,i)=>{e.getElementById(t)?.remove(),e.getElementById(r)?.remove(),e.getElementById(i)?.remove()},"removeExistingElements"),iP=m(async function(e,t,r){Wc();const i=lf(t);t=i.code;const n=Te();q.debug(n),t.length>(n?.maxTextSize??D4)&&(t=F4);const s="#"+e,o="i"+e,a="#"+o,l="d"+e,c="#"+l,d=m(()=>{const H=Lt(p?a:c).node();H&&"remove"in H&&H.remove()},"removeTempElements");let u=Lt("body");const p=n.securityLevel===P4,f=n.securityLevel===N4,g=n.fontFamily;if(r!==void 0){if(r&&(r.innerHTML=""),p){const V=Ou(Lt(r),o);u=Lt(V.nodes()[0].contentDocument.body),u.node().style.margin=0}else u=Lt(r);u0(u,e,l,`font-family: ${g}`,H4)}else{if(rP(document,e,l,o),p){const V=Ou(Lt("body"),o);u=Lt(V.nodes()[0].contentDocument.body),u.node().style.margin=0}else u=Lt("body");u0(u,e,l)}let x,v;try{x=await Iu.fromText(t,{title:i.title})}catch(V){if(n.suppressErrorRendering)throw d(),V;x=await Iu.fromText("error"),v=V}const y=u.select(c).node(),b=x.type,w=y.firstChild,S=w.firstChild,_=x.renderer.getClasses?.(t,x),A=K4(n,b,_,s),C=document.createElement("style");C.innerHTML=A,w.insertBefore(C,S);try{await x.renderer.draw(t,e,Pg.version,x)}catch(V){throw n.suppressErrorRendering?d():W6.draw(t,e,Pg.version),V}const E=u.select(`${c} svg`),P=x.db.getAccTitle?.(),z=x.db.getAccDescription?.();$k(b,E,P,z),u.select(`[id="${e}"]`).selectAll("foreignobject > *").attr("xmlns",q4);let D=u.select(c).node().innerHTML;if(q.debug("config.arrowMarkerAbsolute",n.arrowMarkerAbsolute),D=tP(D,p,pe(n.arrowMarkerAbsolute)),p){const V=u.select(c+" svg").node();D=eP(D,V)}else f||(D=ar.sanitize(D,{ADD_TAGS:Q4,ADD_ATTR:Z4,HTML_INTEGRATION_POINTS:{foreignobject:!0}}));if(B4(),v)throw v;return d(),{diagramType:b,svg:D,bindFunctions:x.db.bindFunctions}},"render");function _k(e={}){const t=de({},e);t?.fontFamily&&!t.themeVariables?.fontFamily&&(t.themeVariables||(t.themeVariables={}),t.themeVariables.fontFamily=t.fontFamily),pA(t),t?.theme&&t.theme in li?t.themeVariables=li[t.theme].getThemeVariables(t.themeVariables):t&&(t.themeVariables=li.default.getThemeVariables(t.themeVariables));const r=typeof t=="object"?uA(t):$b();op(r.logLevel),Wc()}m(_k,"initialize");var Tk=m((e,t={})=>{const{code:r}=af(e);return Iu.fromText(r,t)},"getDiagramFromText");function $k(e,t,r,i){vk(t,e),wk(t,r,i,t.attr("id"))}m($k,"addA11yInfo");var mn=Object.freeze({render:iP,parse:Sk,getDiagramFromText:Tk,initialize:_k,getConfig:Te,setConfig:Ab,getSiteConfig:$b,updateSiteConfig:fA,reset:m(()=>{_l()},"reset"),globalReset:m(()=>{_l(ms)},"globalReset"),defaultConfig:ms});op(Te().logLevel);_l(Te());var nP=m((e,t,r)=>{q.warn(e),Hp(e)?(r&&r(e.str,e.hash),t.push({...e,message:e.str,error:e})):(r&&r(e),e instanceof Error&&t.push({str:e.message,message:e.message,hash:e.name,error:e}))},"handleError"),Ak=m(async function(e={querySelector:".mermaid"}){try{await sP(e)}catch(t){if(Hp(t)&&q.error(t.str),ui.parseError&&ui.parseError(t),!e.suppressErrors)throw q.error("Use the suppressErrors option to suppress these errors"),t}},"run"),sP=m(async function({postRenderCallback:e,querySelector:t,nodes:r}={querySelector:".mermaid"}){const i=mn.getConfig();q.debug(`${e?"":"No "}Callback function found`);let n;if(r)n=r;else if(t)n=document.querySelectorAll(t);else throw new Error("Nodes and querySelector are both undefined");q.debug(`Found ${n.length} diagrams`),i?.startOnLoad!==void 0&&(q.debug("Start On Load: "+i?.startOnLoad),mn.updateSiteConfig({startOnLoad:i?.startOnLoad}));const s=new jr.InitIDGenerator(i.deterministicIds,i.deterministicIDSeed);let o;const a=[];for(const l of Array.from(n)){if(q.info("Rendering diagram: "+l.id),l.getAttribute("data-processed"))continue;l.setAttribute("data-processed","true");const c=`mermaid-${s.next()}`;o=l.innerHTML,o=Xv(jr.entityDecode(o)).trim().replace(/<br\s*\/?>/gi,"<br/>");const d=jr.detectInit(o);d&&q.debug("Detected early reinit: ",d);try{const{svg:u,bindFunctions:p}=await Bk(c,o,l);l.innerHTML=u,e&&await e(c),p&&p(l)}catch(u){nP(u,a,ui.parseError)}}if(a.length>0)throw a[0]},"runThrowsErrors"),jk=m(function(e){mn.initialize(e)},"initialize"),oP=m(async function(e,t,r){q.warn("mermaid.init is deprecated. Please use run instead."),e&&jk(e);const i={postRenderCallback:r,querySelector:".mermaid"};typeof t=="string"?i.querySelector=t:t&&(t instanceof HTMLElement?i.nodes=[t]:i.nodes=t),await Ak(i)},"init"),aP=m(async(e,{lazyLoad:t=!0}={})=>{Wc(),Nd(...e),t===!1&&await E4()},"registerExternalDiagrams"),Ek=m(function(){if(ui.startOnLoad){const{startOnLoad:e}=mn.getConfig();e&&ui.run().catch(t=>q.error("Mermaid failed to initialize",t))}},"contentLoaded");typeof document<"u"&&window.addEventListener("load",Ek,!1);var lP=m(function(e){ui.parseError=e},"setParseErrorHandler"),nc=[],zh=!1,Lk=m(async()=>{if(!zh){for(zh=!0;nc.length>0;){const e=nc.shift();if(e)try{await e()}catch(t){q.error("Error executing queue",t)}}zh=!1}},"executeQueue"),cP=m(async(e,t)=>new Promise((r,i)=>{const n=m(()=>new Promise((s,o)=>{mn.parse(e,t).then(a=>{s(a),r(a)},a=>{q.error("Error parsing",a),ui.parseError?.(a),o(a),i(a)})}),"performCall");nc.push(n),Lk().catch(i)}),"parse"),Bk=m((e,t,r)=>new Promise((i,n)=>{const s=m(()=>new Promise((o,a)=>{mn.render(e,t,r).then(l=>{o(l),i(l)},l=>{q.error("Error parsing",l),ui.parseError?.(l),a(l),n(l)})}),"performCall");nc.push(s),Lk().catch(n)}),"render"),hP=m(()=>Object.keys(hn).map(e=>({id:e})),"getRegisteredDiagramsMetadata"),ui={startOnLoad:!0,mermaidAPI:mn,parse:cP,render:Bk,init:oP,run:Ak,registerExternalDiagrams:aP,registerLayoutLoaders:Pw,initialize:jk,parseError:void 0,contentLoaded:Ek,setParseErrorHandler:lP,detectType:ap,registerIconPacks:MR,getRegisteredDiagramsMetadata:hP},Mk=ui;/*! Check if previously processed *//*!
 * Wait for document loaded before starting the execution
 */Mk.initialize({startOnLoad:!1,theme:"dark",securityLevel:"strict",themeVariables:{primaryColor:"#7c3aed",primaryTextColor:"#e2e8f0",primaryBorderColor:"#8b5cf6",lineColor:"#a78bfa",secondaryColor:"#1e1b4b",tertiaryColor:"#312e81",background:"#1a1a2e",mainBkg:"#1e1b4b",nodeBorder:"#8b5cf6",clusterBkg:"#1e1b4b",clusterBorder:"#7c3aed",titleColor:"#e2e8f0",edgeLabelBackground:"#312e81",actorBorder:"#8b5cf6",actorBkg:"#1e1b4b",actorTextColor:"#e2e8f0",actorLineColor:"#a78bfa",signalColor:"#e2e8f0",signalTextColor:"#e2e8f0",labelBoxBkgColor:"#1e1b4b",labelBoxBorderColor:"#7c3aed",labelTextColor:"#e2e8f0",loopTextColor:"#e2e8f0",noteBorderColor:"#7c3aed",noteBkgColor:"#312e81",noteTextColor:"#e2e8f0",activationBorderColor:"#8b5cf6",activationBkgColor:"#1e1b4b",sequenceNumberColor:"#e2e8f0"},flowchart:{htmlLabels:!1,curve:"basis"},sequence:{diagramMarginX:50,diagramMarginY:10,actorMargin:50,width:150,height:65,boxMargin:10,boxTextMargin:5,noteMargin:10,messageMargin:35,mirrorActors:!0,useMaxWidth:!0}});const dP=Cr`
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
`,uP=k.div`
  margin: 16px 0;
  padding: 20px;
  background: linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(49, 46, 129, 0.6) 100%);
  border-radius: 12px;
  border: 1px solid rgba(139, 92, 246, 0.3);
  overflow-x: auto;
  
  &:hover {
    border-color: rgba(139, 92, 246, 0.5);
    box-shadow: 0 0 20px rgba(124, 58, 237, 0.2);
  }

  /* Style the SVG generated by mermaid */
  svg {
    max-width: 100%;
    height: auto;
  }

  .error {
    color: #f87171;
    padding: 16px;
    background: rgba(248, 113, 113, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(248, 113, 113, 0.3);
  }
`,pP=k.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
`,fP=k.span`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #a78bfa;
`,gP=k.span`
  font-size: 16px;
`,mP=k.button`
  padding: 6px 12px;
  background: ${e=>e.$copied?"linear-gradient(135deg, #10b981 0%, #059669 100%)":"rgba(139, 92, 246, 0.2)"};
  color: ${e=>e.$copied?"#fff":"#a78bfa"};
  border: 1px solid ${e=>e.$copied?"rgba(16, 185, 129, 0.5)":"rgba(139, 92, 246, 0.3)"};
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: ${e=>e.$copied?"linear-gradient(135deg, #10b981 0%, #059669 100%)":"rgba(139, 92, 246, 0.3)"};
  }
`,xP=k.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #a78bfa;
  font-size: 14px;
  animation: ${dP} 1.5s ease-in-out infinite;
`,bP=k.div`
  padding: 16px;
  background: rgba(248, 113, 113, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(248, 113, 113, 0.3);
  color: #f87171;
  font-size: 13px;
`,yP=k.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
`,vP=k.pre`
  margin: 8px 0;
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
  color: #fca5a5;
  white-space: pre-wrap;
  word-break: break-word;
`,p0=k.button`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 6px;
  color: #a78bfa;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(139, 92, 246, 0.25);
    border-color: rgba(139, 92, 246, 0.5);
  }
`,wP=k.div`
  margin-top: 12px;
  background: rgba(13, 16, 34, 0.92);
  border-radius: 10px;
  border: 1px solid rgba(139, 92, 246, 0.25);
  overflow: hidden;
  box-shadow: inset 0 1px 0 rgba(124, 58, 237, 0.12);

  .keyword {
    color: #c792ea;
  }
  .arrow {
    color: #89ddff;
  }
  .node {
    color: #82aaff;
  }
  .text {
    color: #c3e88d;
  }
  .comment {
    color: #6ee7b7;
  }
`,kP=k.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(76, 29, 149, 0.55) 0%, rgba(30, 64, 175, 0.35) 100%);
  border-bottom: 1px solid rgba(139, 92, 246, 0.25);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #c4b5fd;
`,CP=k.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(55, 48, 163, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: #e0e7ff;
`,SP=k.div`
  max-height: 360px;
  overflow: auto;
  padding: 14px 0;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  color: #e2e8f0;

  .code-lines {
    display: grid;
    row-gap: 4px;
    padding: 0 16px 8px 16px;
  }

  .code-line {
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 12px;
    align-items: start;
  }

  .code-line-number {
    position: relative;
    display: inline-flex;
    justify-content: flex-end;
    color: rgba(129, 140, 248, 0.9);
    font-variant-numeric: tabular-nums;
    padding-right: 12px;
    border-right: 1px solid rgba(99, 102, 241, 0.2);
  }

  .code-line-text {
    white-space: pre;
    line-height: 1.5;
  }
`,_P=e=>{const t=p=>p.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),r=/(flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v\d+)?|erDiagram|gantt|pie|journey|gitGraph|mindmap|timeline|sankey|block|architecture)/g,i=/(direction|TD|TB|BT|RL|LR|participant|actor|Note|loop|alt|else|end|opt|par|critical|break|state)/g,n=p=>p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),s=["--&gt;","==&gt;","&lt;--","-o-&gt;","-x-&gt;","-.-&gt;","--o","--x","--|","|--","|&gt;","&lt;|","===","---","=="],o=new RegExp(`(${s.map(n).join("|")})`,"g"),a=/\[\*\]/g,l=p=>{const f=t(p);if(/^\s*%%/.test(p))return`<span class="comment">${f}</span>`;let g=f;return g=g.replace(r,'<span class="keyword">$1</span>'),g=g.replace(i,'<span class="keyword">$1</span>'),g=g.replace(o,'<span class="arrow">$1</span>'),g=g.replace(a,'<span class="arrow">$&</span>'),g=g.replace(/\b([A-Za-z][\w]*)\s*(?=\[|\{|\()/g,'<span class="node">$1</span>'),g=g.replace(/(\[[^\]]+\])/g,'<span class="text">$1</span>'),g},d=e.replace(/\r\n/g,`
`).replace(/\r/g,`
`).split(`
`);return{html:`<div class="code-lines">${d.map((p,f)=>{const g=l(p),x=g.length?g:"&nbsp;";return`<div class="code-line"><span class="code-line-number">${(f+1).toString().padStart(3," ").replace(/ /g,"&nbsp;")}</span><span class="code-line-text">${x}</span></div>`}).join("")}</div>`,lineCount:d.length}},TP=({chart:e})=>{const t=M.useRef(null),[r,i]=M.useState(""),[n,s]=M.useState(""),[o,a]=M.useState(!0),[l,c]=M.useState(!1),[d,u]=M.useState(!1),p=M.useMemo(()=>_P(e),[e]),f=`${p.lineCount} ${p.lineCount===1?"line":"lines"}`,g=()=>h.jsxs(wP,{children:[h.jsxs(kP,{children:[h.jsx("span",{children:"Mermaid Source"}),h.jsx(CP,{children:f})]}),h.jsx(SP,{children:h.jsx("div",{dangerouslySetInnerHTML:{__html:p.html}})})]}),x=b=>{let w=b;return w=w.replace(/&amp;/g,"&"),w=w.replace(/&lt;/g,"<"),w=w.replace(/&gt;/g,">"),w=w.replace(/&quot;/g,'"'),w=w.replace(/&#39;/g,"'"),w=w.replace(/\r\n/g,`
`),w=w.replace(/\r/g,`
`),w.trim()},v=b=>{const w=[];if(b.includes("&")){const T=b.replace(/(\w)\s*&\s*(\w)/g,"$1 and $2");T!==b&&w.push(T)}const S=b.replace(/[""'']/g,'"').replace(/–/g,"-").replace(/—/g,"-").replace(/…/g,"...");S!==b&&w.push(S);const C=b.split(`
`).map(T=>{const L=(T.match(/\[/g)||[]).length,$=(T.match(/\]/g)||[]).length,N=(T.match(/\(/g)||[]).length,G=(T.match(/\)/g)||[]).length,Q=(T.match(/\{/g)||[]).length,Y=(T.match(/\}/g)||[]).length;let F=T;return L>$&&(F+="]".repeat(L-$)),N>G&&(F+=")".repeat(N-G)),Q>Y&&(F+="}".repeat(Q-Y)),F}).join(`
`);if(C!==b&&w.push(C),b.includes("sequenceDiagram")){let T=b.replace(/^(\s*(?:participant|actor)\s+\w+)\s*$/gm,"$1");T=T.replace(/Note\s+over\s+/gi,"Note over "),T=T.replace(/Note\s+left\s+of\s+/gi,"Note left of "),T=T.replace(/Note\s+right\s+of\s+/gi,"Note right of "),T=T.replace(/end\s*\d+/gi,"end"),T!==b&&w.push(T)}if(b.includes("flowchart")||b.includes("graph")){let T=b.replace(/--\|([^|]+)\|>/g,"-->|$1|").replace(/-+>/g,"-->").replace(/=+>/g,"==>").replace(/<-+/g,"<--").replace(/-o>/g,"-o->").replace(/^(\s*[A-Za-z0-9_]+)\s*-\s+(\w+)/gm,"$1 --> $2").replace(/^(\s*[A-Za-z0-9_]+)\s*-\s+\|([^|]+)\|\s*(\w+)/gm,"$1 -->|$2| $3").replace(/^(graph|flowchart)\s*:\s*/gm,"$1 ");T!==b&&w.push(T)}if(b.includes("classDiagram")){let T=b.replace(/:\s*\+/g,": +").replace(/:\s*-/g,": -").replace(/:\s*#/g,": #");T!==b&&w.push(T)}const E=b.replace(/<[^>]+>/g,"");E!==b&&w.push(E);const P=b.replace(/([A-Za-z0-9_]+)(\[[^\]]+\])\1/g,"$1$2");P!==b&&w.push(P);const z=b.replace(/(\[[^\]]+\])[A-Za-z0-9_]+(\s*-->|\s*$)/g,"$1$2");z!==b&&w.push(z);let D=b.replace(/(\w)\s*&\s*(\w)/g,"$1 and $2").replace(/[""'']/g,'"').replace(/–/g,"-").replace(/—/g,"-").replace(/<[^>]+>/g,"");D=D.split(`
`).map(T=>{const L=(T.match(/\[/g)||[]).length,$=(T.match(/\]/g)||[]).length;return L>$?T+"]".repeat(L-$):T}).join(`
`),D!==b&&w.push(D);const H=b.replace(/;\s*/g,`
`);H!==b&&w.push(H);const O=b.split(`
`).map(T=>T.replace(/^\s*\d+[\.)]\s*/,"")).join(`
`);O!==b&&w.push(O);const R=b.replace(/\bend\s*\d+\b/gi,"end");return R!==b&&w.push(R),[...new Set(w)].filter(T=>T!==b)};M.useEffect(()=>{(async()=>{if(!e||!t.current)return;a(!0),s(""),i("");const w=x(e),S=async A=>{try{const C=`mermaid-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,{svg:E}=await Mk.render(C,A);return{success:!0,svg:E}}catch(C){return{success:!1,error:C instanceof Error?C.message:String(C)}}};let _=await S(w);if(!_.success){console.log("Mermaid: Initial render failed, attempting auto-fix...");const A=v(w);for(const C of A)if(console.log("Mermaid: Trying auto-fix variant..."),_=await S(C),_.success){console.log("Mermaid: Auto-fix successful!");break}}_.success&&_.svg?i(_.svg):(console.error("Mermaid rendering error (all fixes failed):",_.error),s(_.error||"Failed to render diagram")),a(!1)})()},[e]);const y=async()=>{try{await navigator.clipboard.writeText(e),c(!0),setTimeout(()=>c(!1),2e3)}catch(b){console.error("Failed to copy:",b)}};return h.jsxs(uP,{ref:t,children:[h.jsxs(pP,{children:[h.jsxs(fP,{children:[h.jsx(gP,{children:"📊"}),"Mermaid Diagram"]}),h.jsx(mP,{onClick:y,$copied:l,children:l?"Copied!":"Copy Code"})]}),o&&h.jsx(xP,{children:"Rendering diagram..."}),n&&h.jsxs(bP,{children:[h.jsxs(yP,{children:[h.jsx("span",{children:"⚠️"}),h.jsx("span",{children:"Diagram Syntax Error"})]}),h.jsx("p",{style:{marginBottom:"8px",color:"#fca5a5"},children:"The LLM generated invalid Mermaid syntax. The diagram could not be rendered."}),h.jsx(vP,{children:n}),h.jsxs(p0,{onClick:()=>u(!d),children:[h.jsx("span",{children:d?"▼":"▶"}),h.jsxs("span",{children:[d?"Hide":"Show"," Raw Diagram Code"]})]}),d&&g()]}),r&&!n&&h.jsxs(h.Fragment,{children:[h.jsx("div",{dangerouslySetInnerHTML:{__html:r}}),h.jsxs(p0,{onClick:()=>u(!d),style:{marginTop:"16px"},children:[h.jsx("span",{children:d?"▼":"▶"}),h.jsxs("span",{children:[d?"Hide":"Show"," Source Code"]})]}),d&&g()]})]})},$P=k.div`
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }
`,AP=k.button`
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`,jP=k.div`
  display: flex;
  align-items: center;
  gap: 8px;
`,EP=k.span`
  font-size: 14px;
  opacity: 0.7;
`,LP=k.span`
  font-weight: 500;
  font-size: 13px;
  color: var(--vscode-foreground);
  opacity: 0.8;
`,BP=k.div`
  display: flex;
  align-items: center;
  gap: 8px;
`,MP=k.span`
  font-size: 10px;
  color: var(--vscode-foreground);
  opacity: 0.5;
  transition: transform 0.2s ease;
  transform: ${e=>e.$isExpanded?"rotate(180deg)":"rotate(0deg)"};
`,IP=k.div`
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.1);
`,OP=k.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`,RP=k.div`
  font-size: 11px;
  color: var(--vscode-foreground);
  opacity: 0.6;
  font-weight: 500;
`,DP=k.button`
  padding: 4px 8px;
  background: transparent;
  color: var(--vscode-foreground);
  opacity: 0.6;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }
`,FP=k.div`
  padding: 14px;
  color: var(--vscode-foreground);
  opacity: 0.8;
  font-size: 12px;
  line-height: 1.6;
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Courier New', monospace;
  white-space: pre-wrap;
  
  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
  }
`,Ik=({content:e})=>{const[t,r]=M.useState(!1),[i,n]=M.useState(""),s=g=>{let x=g;g.includes("&lt;think&gt;")&&(x=g.replace(/&lt;think&gt;/g,"<think>").replace(/&lt;\/think&gt;/g,"</think>"));const v=/<think>([\s\S]*?)<\/think>/gi,y=[...x.matchAll(v)];let b="",w=x;return y.length>0&&(b=y.map(S=>S[1]).join(`

`),w=x.replace(v,"").trim()),{thinkingContent:b.trim(),regularContent:w.trim(),hasThinking:b.length>0}},o=M.useMemo(()=>g=>{const x=[],v=g.includes("mermaid-container")&&g.includes("data-mermaid"),y=g.includes("language-mermaid")||g.includes("```mermaid");if(!v&&!y)return[h.jsx("div",{className:"doc-content",dangerouslySetInnerHTML:{__html:ar.sanitize(g)}},"content")];const b=[/<div[^>]*class="mermaid-container"[^>]*data-mermaid="([^"]+)"[^>]*>(?:<\/div>)?/gi,/<div[^>]*data-mermaid="([^"]+)"[^>]*class="mermaid-container"[^>]*>(?:<\/div>)?/gi],w=[/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi,/```mermaid\n?([\s\S]*?)```/gi];let S=0;const _=[];let A;for(const E of b)for(E.lastIndex=0;(A=E.exec(g))!==null;)try{const P=atob(A[1]);_.push({fullMatch:A[0],code:P,startIndex:A.index,endIndex:A.index+A[0].length,isBase64:!0})}catch(P){console.error("Failed to decode mermaid base64:",P)}if(_.length===0)for(const E of w)for(E.lastIndex=0;(A=E.exec(g))!==null;){let P=A[1];P=P.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g," ").replace(/<br\s*\/?>/gi,`
`).replace(/<[^>]+>/g,"").trim(),_.push({fullMatch:A[0],code:P,startIndex:A.index,endIndex:A.index+A[0].length,isBase64:!1})}if(_.length===0)return[h.jsx("div",{className:"doc-content",dangerouslySetInnerHTML:{__html:ar.sanitize(g)}},"content")];_.sort((E,P)=>E.startIndex-P.startIndex);const C=[];for(const E of _)C.some(z=>E.startIndex<z.endIndex&&E.endIndex>z.startIndex)||C.push(E);if(C.length===0)return[h.jsx("div",{className:"doc-content",dangerouslySetInnerHTML:{__html:ar.sanitize(g)}},"content")];for(const E of C){if(E.startIndex>S){const P=g.substring(S,E.startIndex);P.trim()&&x.push(h.jsx("div",{className:"doc-content",dangerouslySetInnerHTML:{__html:ar.sanitize(P)}},`content-${S}`))}x.push(h.jsx(TP,{chart:E.code},`mermaid-${E.startIndex}`)),S=E.endIndex}if(S<g.length){const E=g.substring(S);E.trim()&&x.push(h.jsx("div",{className:"doc-content",dangerouslySetInnerHTML:{__html:ar.sanitize(E)}},`content-${S}`))}return x},[]),{thinkingContent:a,regularContent:l,hasThinking:c}=s(e),d=ar.sanitize(a),u=()=>{r(!t)},p=async()=>{try{await navigator.clipboard.writeText(a),n("Copied!"),setTimeout(()=>n(""),2e3)}catch(g){console.error("Failed to copy thinking content:",g),n("Failed"),setTimeout(()=>n(""),2e3)}},f=M.useMemo(()=>o(l),[l,o]);return c?h.jsxs(h.Fragment,{children:[h.jsxs($P,{children:[h.jsxs(AP,{onClick:u,"aria-expanded":t,"aria-controls":"thinking-content",children:[h.jsxs(jP,{children:[h.jsx(EP,{children:"🧠"}),h.jsx(LP,{children:"Thought Process"})]}),h.jsx(BP,{children:h.jsx(MP,{$isExpanded:t,children:"▼"})})]}),t&&h.jsxs(IP,{id:"thinking-content",children:[h.jsxs(OP,{children:[h.jsx(RP,{children:"Reasoning trace"}),h.jsx(DP,{onClick:p,title:"Copy thinking content",$copied:i==="Copied!",children:h.jsx("span",{children:i||"Copy"})})]}),h.jsx(FP,{dangerouslySetInnerHTML:{__html:d}})]})]}),l&&f]}):h.jsx(h.Fragment,{children:f})},PP=Cr`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`,NP=Cr`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`,zP=k.div`
  background: var(--vscode-editor-inactiveSelectionBackground, rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 12px 14px;
  margin: 12px 0;
`,HP=k.div`
  display: flex;
  align-items: center;
  gap: 10px;
`,qP=k.div`
  width: 14px;
  height: 14px;
  border: 2px solid var(--vscode-scrollbarSlider-background, rgba(255, 255, 255, 0.1));
  border-top-color: var(--vscode-progressBar-background, #3b82f6);
  border-radius: 50%;
  animation: ${NP} 0.8s linear infinite;
`,WP=k.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
`,VP=k.div`
  flex: 1;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
`,UP=k.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.8);
  }

  svg {
    width: 12px;
    height: 12px;
    transform: ${e=>e.$expanded?"rotate(180deg)":"rotate(0)"};
    transition: transform 0.15s ease;
  }
`,GP=k.div`
  max-height: ${e=>e.$expanded?"300px":"0"};
  overflow: hidden;
  transition: max-height 0.2s ease;
  margin-top: ${e=>e.$expanded?"10px":"0"};
`,YP=k.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
`,XP=k.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  font-size: 11px;
`,QP=k.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${e=>e.$active?"#3b82f6":"#22c55e"};
  animation: ${e=>e.$active?PP:"none"} 1s ease-in-out infinite;
`,ZP=k.span`
  color: rgba(255, 255, 255, 0.7);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,JP=k.span`
  color: rgba(255, 255, 255, 0.4);
  font-size: 10px;
`,KP=k.div`
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
`,t8=k.div`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-foreground);
  opacity: 0.7;
  margin-bottom: 8px;
`,e8=k.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`,r8=k.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.85);
`,i8=k.div`
  margin-top: 8px;
  background: var(--vscode-terminal-background, #1e1e1e);
  border-radius: 6px;
  padding: 8px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  color: var(--vscode-terminal-foreground, #e0e0e0);
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid var(--vscode-widget-border, rgba(255, 255, 255, 0.1));

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--vscode-scrollbarSlider-background, rgba(255, 255, 255, 0.2));
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: var(--vscode-scrollbarSlider-hoverBackground, rgba(255, 255, 255, 0.3));
  }
`,n8=k.span`
  color: var(--vscode-textLink-foreground);
  font-weight: 600;
`,za={web_search:{displayName:"Web Search"},read_file:{displayName:"Read File"},analyze_files_for_question:{displayName:"Analyze Code"},think:{displayName:"Reasoning"},write_file:{displayName:"Write File"},edit_file:{displayName:"Edit File"},search_codebase:{displayName:"Search Codebase"},planning:{displayName:"Planning"},summarizing:{displayName:"Summarizing"},decision:{displayName:"Decision"},reading:{displayName:"Reading"},searching:{displayName:"Searching"},reviewing:{displayName:"Reviewing"},analyzing:{displayName:"Analyzing"},executing:{displayName:"Executing"},working:{displayName:"Working"},git_diff:{displayName:"Git Diff"},git_log:{displayName:"Git Log"},git_branch:{displayName:"Git Branch"},run_command:{displayName:"Terminal"},command:{displayName:"Terminal"},default:{displayName:"Tool"}},s8=({activities:e,isActive:t})=>{const[r,i]=M.useState(!1);if(e.length===0)return null;const n=e[e.length-1],s=za[n?.toolName||n?.type]||za.default,o=e.filter(p=>p.type==="decision"),a=o[o.length-1],c=a?(p=>{const f=p.replace(/^(Using:|Decided to use:)\s*/i,"");return f?f.split(", ").map(g=>{const x=g.match(/^(.+?)\s*\(x(\d+)\)$/);return x?{name:x[1].trim(),count:parseInt(x[2],10)}:{name:g.trim()}}):[]})(a.description):[],d=e.filter(p=>p.status==="completed").length,u=p=>{const f=Math.floor((Date.now()-p)/1e3);return f<5?"now":f<60?`${f}s`:`${Math.floor(f/60)}m`};return h.jsxs(zP,{children:[h.jsxs(HP,{children:[t?h.jsx(qP,{}):h.jsx(WP,{children:h.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"3",width:"10",height:"10",children:h.jsx("polyline",{points:"20,6 9,17 4,12"})})}),h.jsx(VP,{children:!t&&d===e.length?`Completed ${d} ${d===1?"action":"actions"}`:n?`${s.displayName}: ${n.description}`:"Working..."}),e.length>1&&h.jsxs(UP,{$expanded:r,onClick:()=>i(!r),children:[e.length," ",e.length===1?"step":"steps",h.jsx("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:h.jsx("polyline",{points:"6,9 12,15 18,9"})})]})]}),c.length>0&&h.jsxs(KP,{children:[h.jsx(t8,{children:"Tools in use"}),h.jsx(e8,{children:c.map((p,f)=>h.jsxs(r8,{children:[p.name,p.count&&p.count>1&&h.jsxs(n8,{children:["x",p.count]})]},f))})]}),h.jsx(GP,{$expanded:r,children:h.jsx(YP,{children:e.map(p=>{const f=za[p.toolName||p.type]||za.default;if(p.type==="thinking"||p.toolName==="think"){const x=p.description.includes("<think>")||p.description.includes("&lt;think&gt;")?p.description:`<think>${p.description}</think>`;return h.jsx("div",{style:{marginBottom:"8px"},children:h.jsx(Ik,{content:x})},p.id)}return h.jsx(XP,{$status:p.status,children:h.jsxs("div",{style:{width:"100%"},children:[h.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[h.jsx(QP,{$active:p.status==="active"}),h.jsxs(ZP,{children:[f.displayName,": ",p.description]}),h.jsx(JP,{children:u(p.timestamp)})]}),p.terminalOutput&&h.jsx(i8,{children:p.terminalOutput})]})},p.id)})})})]})},o8=({onClick:e,isActive:t=!1,className:r="",disabled:i=!1})=>{const n=s=>{if(i){s.preventDefault(),s.stopPropagation();return}e&&e()};return h.jsx("svg",{className:`attachment-icon ${t?"active":""} ${r} ${i?"disabled":""}`,onClick:n,width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",style:{cursor:i?"not-allowed":"pointer",pointerEvents:i?"none":"auto"},children:h.jsx("path",{d:"M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"})})},a8=({onSendMessage:e,disabled:t=!1})=>{const[r,i]=M.useState(""),n=M.useRef(e);Mr.useEffect(()=>{n.current=e},[e]);const s=M.useCallback(l=>{t||i(l.target.value)},[t]),o=M.useCallback(l=>{t||l.key==="Enter"&&!l.shiftKey&&(l.preventDefault(),a())},[r,t]),a=M.useCallback(()=>{t||r.trim()&&(n.current(r),i(""))},[r,t]);return h.jsx("div",{style:{display:"grid",gap:"8px"},children:h.jsx(Q_,{value:r,onInput:s,placeholder:t?"Agent is working...":"Ask CodeBuddy...",onKeyDown:o,disabled:t,style:{width:"100%",opacity:t?.6:1,cursor:t?"not-allowed":"text"}})})},cf=({onClick:e,isActive:t,className:r="",isBlinking:i=!1})=>h.jsxs(h.Fragment,{children:[h.jsx("style",{children:`
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
          }
          .ai-icon {
            cursor: pointer;
            transition: transform 0.2s ease;
            float:left;
            margin-top: 15px;
          }
          .ai-icon:hover {
            transform: scale(1.1);
          }
          .ai-icon.active {
            color: var(--vscode-terminal-ansiGreen);
          }
          .ai-icon.blinking {
            animation: blink 1.5s ease-in-out infinite;
          }
        `}),h.jsxs("svg",{width:"32",height:"32",viewBox:"0 0 32 32",fill:"none",xmlns:"http://www.w3.org/2000/svg",className:`ai-icon ${t?"active":""} ${i?"blinking":""} ${r}`,"aria-hidden":"true",onClick:e,children:[h.jsx("path",{d:"M6.27334 2.89343L5.27501 5.88842C5.1749 6.18877 4.93922 6.42445 4.63887 6.52456L1.64388 7.52289C1.18537 7.67573 1.18537 8.32427 1.64388 8.47711L4.63887 9.47544C4.93922 9.57555 5.1749 9.81123 5.27501 10.1116L6.27334 13.1066C6.42618 13.5651 7.07472 13.5651 7.22756 13.1066L8.22589 10.1116C8.326 9.81123 8.56168 9.57555 8.86203 9.47544L11.857 8.47711C12.3155 8.32427 12.3155 7.67573 11.857 7.52289L8.86203 6.52456C8.56168 6.42445 8.326 6.18877 8.22589 5.88842L7.22756 2.89343C7.07472 2.43492 6.42618 2.43492 6.27334 2.89343Z",fill:"currentColor"}),h.jsx("path",{d:"M12.5469 1.17194L12.3158 1.8651C12.2157 2.16545 11.98 2.40113 11.6797 2.50125L10.9865 2.7323C10.7573 2.80872 10.7573 3.13299 10.9865 3.20941L11.6797 3.44046C11.98 3.54058 12.2157 3.77626 12.3158 4.0766L12.5469 4.76977C12.6233 4.99902 12.9476 4.99902 13.024 4.76977L13.255 4.0766C13.3552 3.77626 13.5908 3.54058 13.8912 3.44046L14.5843 3.20941C14.8136 3.13299 14.8136 2.80872 14.5843 2.7323L13.8912 2.50125C13.5908 2.40113 13.3552 2.16545 13.255 1.8651L13.024 1.17194C12.9476 0.942687 12.6233 0.942687 12.5469 1.17194Z",fill:"currentColor"}),h.jsx("path",{d:"M12.5469 11.2302L12.3158 11.9234C12.2157 12.2237 11.98 12.4594 11.6797 12.5595L10.9865 12.7906C10.7573 12.867 10.7573 13.1913 10.9865 13.2677L11.6797 13.4988C11.98 13.5989 12.2157 13.8346 12.3158 14.1349L12.5469 14.8281C12.6233 15.0573 12.9476 15.0573 13.024 14.8281L13.255 14.1349C13.3552 13.8346 13.5908 13.5989 13.8912 13.4988L14.5843 13.2677C14.8136 13.1913 14.8136 12.867 14.5843 12.7906L13.8912 12.5595C13.5908 12.4594 13.3552 12.2237 13.255 11.9234L13.024 11.2302C12.9476 11.001 12.6233 11.001 12.5469 11.2302Z",fill:"currentColor"})]})]}),l8=Cr`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`,hf=Cr`
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
`,c8=Cr`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
`,h8=k.div`
  background: linear-gradient(135deg, rgba(20, 20, 30, 0.3) 0%, rgba(30, 30, 45, 0.3) 100%);
  border: 1px solid rgba(100, 200, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 150, 255, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(100, 200, 255, 0.5), transparent);
    animation: ${c8} 3s linear infinite;
  }
`,d8=k.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`,Vc=k.div`
  height: 10px;
  background: rgba(100, 200, 255, 0.1);
  border-radius: 5px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(100, 200, 255, 0.3) 50%,
      transparent 100%
    );
    animation: ${l8} 2s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(100, 200, 255, 0.05) 50%,
      transparent 100%
    );
    animation: ${hf} 2s ease-in-out infinite;
  }
`,u8=k(Vc)`
  width: 35%;
`,f0=k(Vc)`
  width: 65%;
`,p8=k(Vc)`
  width: 85%;
`,f8=k.div`
  animation: ${hf} 2s ease-in-out infinite;
`,g8=k.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: rgba(100, 200, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #00d9ff;
    box-shadow: 0 0 10px rgba(0, 217, 255, 0.8);
    animation: ${hf} 1s ease-in-out infinite;
  }
`,Ok=()=>h.jsxs(h8,{children:[h.jsxs(d8,{children:[h.jsx(f8,{children:h.jsx(cf,{isBlinking:!0})}),h.jsx(g8,{children:"Processing"})]}),h.jsxs("div",{children:[h.jsx(p8,{}),h.jsx(f0,{}),h.jsx(Vc,{}),h.jsx(u8,{}),h.jsx(f0,{})]})]}),m8=({commandAction:e="Processing your request",commandDescription:t="CodeBuddy is analyzing your code..."})=>h.jsxs("div",{className:"command-feedback-container",children:[h.jsxs("div",{className:"command-feedback-header",children:[h.jsx(cf,{isBlinking:!0}),h.jsxs("div",{className:"command-info",children:[h.jsx("div",{className:"command-action",children:e}),h.jsx("div",{className:"command-description",children:t})]})]}),h.jsx(Ok,{}),h.jsx("div",{className:"command-status",children:h.jsxs("div",{className:"status-indicator",children:[h.jsx("div",{className:"pulsing-dot"}),h.jsx("span",{children:"Generating response..."})]})})]});function Rk(e,t=""){const r=[];for(const i of e){const n=t?`${t}/${i.name}`:i.name;i.children&&i.children.length>0?r.push(...Rk(i.children,n)):r.push({name:i.name,path:n,isDirectory:!1})}return r}function g0(e,t){const r=e.toLowerCase(),i=t.toLowerCase();if(r.length===0)return{matches:!0,score:0};if(i.includes(r))return{matches:!0,score:100-i.indexOf(r)};let n=0,s=0,o=0,a=-1;for(let c=0;c<i.length&&n<r.length;c++)i[c]===r[n]&&(n++,a===c-1?(o++,s+=o*2):o=1,(c===0||"/.-_".includes(t[c-1]))&&(s+=10),a=c,s+=1);const l=n===r.length;return{matches:l,score:l?s:0}}function x8(e,t,r=20){return!t||t.length===0?e.slice(0,r):e.map(n=>{const s=g0(t,n.name),o=g0(t,n.path),a=s.score*2+o.score,l=s.matches||o.matches;return{file:n,score:a,matches:l}}).filter(n=>n.matches).sort((n,s)=>s.score-n.score).slice(0,r).map(n=>n.file)}function b8(e){const t=e.lastIndexOf("/");return t>0?e.substring(0,t):""}const y8=k.div`
  position: relative;
  width: 100%;
`,v8=k.input`
  width: 96%;
  padding: 0.5rem;
  border: 2px solid var(--vscode-editor-background);
  border-radius: 4px;
  background: #16161e;
  color: inherit;
  font-size: 13px;
  
  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder, #007acc);
  }
`,w8=k.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background-color: rgb(22, 22, 30);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 100;
  margin-top: 4px;
`,k8=k.ul`
  list-style: none;
  padding: 4px;
  margin: 0;
`,C8=k.li`
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  cursor: pointer;
  border-radius: 4px;
  background: ${e=>e.$isSelected?"rgba(255, 255, 255, 0.1)":"transparent"};
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`,m0=k.span`
  font-size: 13px;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  gap: 6px;
`,S8=k.span`
  font-size: 14px;
`,_8=k.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 20px;
`,T8=k.div`
  padding: 12px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
`,$8=k.li`
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border-radius: 4px;
  background: ${e=>e.$isSelected?"rgba(255, 255, 255, 0.1)":"transparent"};
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 4px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`,A8=k.span`
  font-size: 11px;
  color: #4fc3f7;
  background: rgba(79, 195, 247, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
`,j8=({onInputChange:e,initialValue:t="",folders:r,activeEditor:i})=>{const[n,s]=M.useState(t),[o,a]=M.useState(!1),[l,c]=M.useState(""),[d,u]=M.useState(0),p=M.useRef(null),f=M.useRef(null),g=M.useMemo(()=>{if(!r?.message)return[];try{const C=JSON.parse(r.message);return Rk(C)}catch(C){return console.error("Error parsing folders:",C),[]}},[r]),x=M.useMemo(()=>x8(g,l,15),[g,l]),v=i&&i.length>0,y=v?x.length+1:x.length,b=M.useCallback(C=>{s(C),e(C)},[e]);M.useEffect(()=>{s(t)},[t]);const w=M.useCallback(C=>{const E=C.target.value;b(E);const P=E.lastIndexOf("@");if(P!==-1&&(P===0||E[P-1]===" ")){const z=E.substring(P+1).split(" ")[0];c(z),a(!0),u(0)}else a(!1),c("")},[b]),S=M.useCallback(C=>{if(o)switch(C.key){case"ArrowDown":C.preventDefault(),u(E=>Math.min(E+1,y-1));break;case"ArrowUp":C.preventDefault(),u(E=>Math.max(E-1,0));break;case"Enter":if(C.preventDefault(),v&&d===0)_(i);else{const E=v?d-1:d;x[E]&&_(x[E].path)}break;case"Escape":a(!1),c("");break}},[o,d,y,v,i,x]),_=M.useCallback(C=>{const E=n.lastIndexOf("@");if(E!==-1){const z=n.substring(E+1).indexOf(" "),D=z!==-1?E+1+z:n.length,V=n.substring(0,E)+`@${C} `+n.substring(D).trimStart();b(V),setTimeout(()=>{if(p.current){const H=E+C.length+2;p.current.setSelectionRange(H,H),p.current.focus()}},0)}a(!1),c("")},[n,b]);M.useEffect(()=>{const C=E=>{const P=E.target;o&&!P.closest("[data-file-mention]")&&!f.current?.contains(P)&&(a(!1),c(""))};return document.addEventListener("mousedown",C),()=>document.removeEventListener("mousedown",C)},[o]),M.useEffect(()=>{o&&f.current&&f.current.querySelector(`[data-index="${d}"]`)?.scrollIntoView({block:"nearest"})},[d,o]);const A=C=>{const E=C.split(".").pop()?.toLowerCase();return{ts:"📘",tsx:"⚛️",js:"📒",jsx:"⚛️",json:"📋",md:"📝",css:"🎨",scss:"🎨",html:"🌐",py:"🐍",rs:"🦀",go:"🐹",java:"☕",yml:"⚙️",yaml:"⚙️",sql:"🗃️",sh:"🖥️",bash:"🖥️",zsh:"🖥️"}[E||""]||"📄"};return h.jsxs(y8,{"data-file-mention":"true",children:[h.jsx(v8,{ref:p,type:"text",placeholder:"Type @ to mention files...",value:n,onChange:w,onKeyDown:S,disabled:t.length>1}),o&&h.jsx(w8,{ref:f,children:h.jsxs(k8,{children:[v&&h.jsxs($8,{$isSelected:d===0,"data-index":0,onClick:()=>_(i),children:[h.jsx("span",{children:"📌"}),h.jsx(m0,{children:i.split("/").pop()}),h.jsx(A8,{children:"Current File"})]}),x.length>0?x.map((C,E)=>{const P=v?E+1:E,z=b8(C.path);return h.jsxs(C8,{$isSelected:d===P,"data-index":P,onClick:()=>_(C.path),children:[h.jsxs(m0,{children:[h.jsx(S8,{children:A(C.name)}),C.name]}),z&&h.jsx(_8,{children:z})]},C.path)}):h.jsx(T8,{children:g.length===0?"Loading workspace files...":`No files matching "${l}"`})]})})]})},E8=k.div`
  width: 100%;
  padding: 20px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
`,L8=k.div`
  margin-bottom: 32px;
`,B8=k.h2`
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 8px 0;
  text-align: left;
`,M8=k.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  text-align: left;
  line-height: 1.5;
`,I8=k.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`,Hh=k.button`
  background: ${e=>e.$active?"rgba(255, 255, 255, 0.08)":"transparent"};
  border: none;
  border-bottom: 2px solid ${e=>e.$active?"rgba(255, 255, 255, 0.6)":"transparent"};
  padding: 12px 20px;
  font-size: 13px;
  font-weight: 500;
  color: ${e=>e.$active?"rgba(255, 255, 255, 0.95)":"rgba(255, 255, 255, 0.5)"};
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: -1px;

  &:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.04);
  }
`,qh=k.div`
  margin-bottom: 32px;
`,Wh=k.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`,Vh=k.h3`
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: left;
`,Ha=k.button`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    transform: scale(0.98);
  }
`,x0=k.div`
  display: grid;
  gap: 12px;
`,Ru=k.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
  }
`,Uh=k.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
`,Gh=k.div`
  flex: 1;
  display: flex;
  align-items: start;
  gap: 12px;
`,Yh=k.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
`,Xh=k.div`
  flex: 1;
  text-align: left;
`,Qh=k.h4`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 4px 0;
`,Zh=k.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.4;
`,b0=k.span`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${e=>{switch(e.$status){case"active":return"rgba(34, 197, 94, 0.15)";case"error":return"rgba(239, 68, 68, 0.15)";default:return"rgba(255, 255, 255, 0.1)"}}};
  color: ${e=>{switch(e.$status){case"active":return"rgba(34, 197, 94, 0.9)";case"error":return"rgba(239, 68, 68, 0.9)";default:return"rgba(255, 255, 255, 0.6)"}}};
  border: 1px solid ${e=>{switch(e.$status){case"active":return"rgba(34, 197, 94, 0.3)";case"error":return"rgba(239, 68, 68, 0.3)";default:return"rgba(255, 255, 255, 0.15)"}}};
`,y0=k.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`,Rn=k.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
  }
`,v0=k.div`
  text-align: center;
  padding: 48px 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`,w0=k.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
`,k0=k.h3`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px 0;
`,C0=k.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 20px 0;
  line-height: 1.5;
`,O8=k.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
`,R8=k(Ru)`
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }
`,S0=k.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`,_0=k.span`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
`,D8=k.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.25);
  }
`,F8=({onAddMCPServer:e,onAddAgent:t})=>{const[r,i]=M.useState("servers"),n=[{id:"1",name:"Filesystem MCP",description:"Access and manipulate files in your workspace",status:"active",type:"filesystem",icon:"📁"},{id:"2",name:"PostgreSQL MCP",description:"Query and manage PostgreSQL databases",status:"inactive",type:"database",icon:"🗄️"}],s=[{id:"1",name:"Code Reviewer",description:"Specialized agent for code reviews and best practices",model:"GPT-4",status:"active",avatar:"👨‍💻",capabilities:["Code Review","Best Practices","Security"]}],o=[{id:"m1",name:"GitHub MCP Server",description:"Integrate with GitHub repos, issues, and PRs",icon:"🐙",tags:["Git","API","Popular"],downloads:"12.5k"},{id:"m2",name:"Slack MCP Server",description:"Send messages and notifications to Slack channels",icon:"💬",tags:["Communication","API"],downloads:"8.2k"},{id:"m3",name:"Docker Agent",description:"Manage Docker containers and images",icon:"🐳",tags:["DevOps","Containers"],downloads:"6.1k"},{id:"m4",name:"Testing Agent",description:"Automated test generation and debugging",icon:"🧪",tags:["Testing","QA"],downloads:"4.8k"}];return h.jsxs(E8,{children:[h.jsxs(L8,{children:[h.jsx(B8,{children:"Extensions & Integrations"}),h.jsx(M8,{children:"Extend CodeBuddy with MCP servers, custom agents, and third-party integrations"})]}),h.jsxs(I8,{children:[h.jsx(Hh,{$active:r==="servers",onClick:()=>i("servers"),children:"MCP Servers"}),h.jsx(Hh,{$active:r==="agents",onClick:()=>i("agents"),children:"Custom Agents"}),h.jsx(Hh,{$active:r==="marketplace",onClick:()=>i("marketplace"),children:"Marketplace"})]}),r==="servers"&&h.jsxs(qh,{children:[h.jsxs(Wh,{children:[h.jsx(Vh,{children:"Installed MCP Servers"}),h.jsxs(Ha,{onClick:()=>e?.({id:Date.now().toString(),name:"New Server",description:"",status:"inactive",type:"custom"}),children:[h.jsx("span",{children:"+"}),h.jsx("span",{children:"Add Server"})]})]}),n.length>0?h.jsx(x0,{children:n.map(a=>h.jsxs(Ru,{children:[h.jsxs(Uh,{children:[h.jsxs(Gh,{children:[h.jsx(Yh,{children:a.icon}),h.jsxs(Xh,{children:[h.jsx(Qh,{children:a.name}),h.jsx(Zh,{children:a.description})]})]}),h.jsx(b0,{$status:a.status,children:a.status})]}),h.jsxs(y0,{children:[h.jsx(Rn,{children:"Configure"}),h.jsx(Rn,{children:"Logs"}),h.jsx(Rn,{children:"Remove"})]})]},a.id))}):h.jsxs(v0,{children:[h.jsx(w0,{children:"🔌"}),h.jsx(k0,{children:"No MCP Servers Installed"}),h.jsx(C0,{children:"MCP (Model Context Protocol) servers extend CodeBuddy's capabilities by connecting to external tools and services."}),h.jsxs(Ha,{onClick:()=>e?.({id:Date.now().toString(),name:"New Server",description:"",status:"inactive",type:"custom"}),children:[h.jsx("span",{children:"+"}),h.jsx("span",{children:"Add Your First Server"})]})]})]}),r==="agents"&&h.jsxs(qh,{children:[h.jsxs(Wh,{children:[h.jsx(Vh,{children:"Custom Agents"}),h.jsxs(Ha,{onClick:()=>t?.({id:Date.now().toString(),name:"New Agent",description:"",model:"GPT-4",status:"inactive"}),children:[h.jsx("span",{children:"+"}),h.jsx("span",{children:"Create Agent"})]})]}),s.length>0?h.jsx(x0,{children:s.map(a=>h.jsxs(Ru,{children:[h.jsxs(Uh,{children:[h.jsxs(Gh,{children:[h.jsx(Yh,{children:a.avatar}),h.jsxs(Xh,{children:[h.jsx(Qh,{children:a.name}),h.jsx(Zh,{children:a.description}),h.jsx(S0,{children:a.capabilities?.map((l,c)=>h.jsx(_0,{children:l},c))})]})]}),h.jsx(b0,{$status:a.status,children:a.status})]}),h.jsxs(y0,{children:[h.jsx(Rn,{children:"Edit"}),h.jsx(Rn,{children:"Test"}),h.jsx(Rn,{children:"Delete"})]})]},a.id))}):h.jsxs(v0,{children:[h.jsx(w0,{children:"🤖"}),h.jsx(k0,{children:"No Custom Agents"}),h.jsx(C0,{children:"Create specialized AI agents with custom instructions, tools, and capabilities tailored to your workflow."}),h.jsxs(Ha,{onClick:()=>t?.({id:Date.now().toString(),name:"New Agent",description:"",model:"GPT-4",status:"inactive"}),children:[h.jsx("span",{children:"+"}),h.jsx("span",{children:"Create Your First Agent"})]})]})]}),r==="marketplace"&&h.jsxs(qh,{children:[h.jsx(Wh,{children:h.jsx(Vh,{children:"Discover Extensions"})}),h.jsx(O8,{children:o.map(a=>h.jsxs(R8,{children:[h.jsx(Uh,{children:h.jsxs(Gh,{children:[h.jsx(Yh,{children:a.icon}),h.jsxs(Xh,{children:[h.jsx(Qh,{children:a.name}),h.jsx(Zh,{children:a.description}),h.jsx(S0,{children:a.tags.map((l,c)=>h.jsx(_0,{children:l},c))})]})]})}),h.jsxs("div",{style:{fontSize:"11px",color:"rgba(255, 255, 255, 0.4)",marginTop:"8px",textAlign:"left"},children:["⬇️ ",a.downloads," downloads"]}),h.jsx(D8,{children:"Install"})]},a.id))})]})]})},P8=k.div`
  width: 100%;
  padding: 20px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
`,N8=k.div`
  margin-bottom: 32px;
`,z8=k.h2`
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 8px 0;
  text-align: left;
`,H8=k.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  text-align: left;
  line-height: 1.5;
`,q8=k.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`,W8=k.button`
  background: ${e=>e.$active?"rgba(255, 255, 255, 0.1)":"rgba(255, 255, 255, 0.04)"};
  border: 1px solid ${e=>e.$active?"rgba(255, 255, 255, 0.2)":"rgba(255, 255, 255, 0.08)"};
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 500;
  color: ${e=>e.$active?"rgba(255, 255, 255, 0.95)":"rgba(255, 255, 255, 0.6)"};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.15);
  }
`,V8=k.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`,U8=k.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.03), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
  }

  &:hover::before {
    left: 100%;
  }
`,G8=k.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
`,Y8=k.div`
  font-size: 32px;
  margin-bottom: 12px;
`,X8=k.span`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${e=>{switch(e.$status){case"beta":return"rgba(59, 130, 246, 0.15)";case"experimental":return"rgba(168, 85, 247, 0.15)";default:return"rgba(255, 255, 255, 0.1)"}}};
  color: ${e=>{switch(e.$status){case"beta":return"rgba(96, 165, 250, 0.9)";case"experimental":return"rgba(192, 132, 252, 0.9)";default:return"rgba(255, 255, 255, 0.6)"}}};
  border: 1px solid ${e=>{switch(e.$status){case"beta":return"rgba(59, 130, 246, 0.3)";case"experimental":return"rgba(168, 85, 247, 0.3)";default:return"rgba(255, 255, 255, 0.15)"}}};
`,Q8=k.h3`
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 8px 0;
  text-align: left;
`,Z8=k.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.6;
  text-align: left;
`,J8=k.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
  margin-top: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
`,K8=k.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px;
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
  }

  &:active {
    transform: scale(0.98);
  }
`,tN=()=>{const[e,t]=M.useState("all"),r=[{title:"Voice Coding",description:"Code with your voice using natural language. Hands-free programming with real-time transcription",icon:"🎤",status:"experimental",category:"Accessibility"},{title:"Team Collaboration",description:"Share AI conversations, custom agents, and context with your team. Real-time collaborative debugging",icon:"👥",status:"coming-soon",category:"Collaboration"},{title:"Documentation Generator",description:"Auto-generate comprehensive documentation from your code with examples and usage guides",icon:"📚",status:"coming-soon",category:"Documentation"},{title:"Test Generator",description:"Intelligent test generation with edge cases, mocks, and fixtures based on your code structure",icon:"🧪",status:"beta",category:"Testing"},{title:"Performance Profiler",description:"AI-driven performance analysis with bottleneck detection and optimization recommendations",icon:"⚡",status:"coming-soon",category:"Performance"},{title:"Security Scanner",description:"Real-time vulnerability detection with CVE database integration and fix suggestions",icon:"🔒",status:"coming-soon",category:"Security"},{title:"API Integration Hub",description:"Connect to external APIs with auto-generated clients and documentation",icon:"🔌",status:"coming-soon",category:"Integration"},{title:"Custom Prompts",description:"Create and share prompt templates for common coding tasks and workflows",icon:"✏️",status:"coming-soon",category:"Productivity"}],i=["all",...Array.from(new Set(r.map(s=>s.category)))],n=e==="all"?r:r.filter(s=>s.category===e);return h.jsxs(P8,{children:[h.jsxs(N8,{children:[h.jsx(z8,{children:"Future Roadmap"}),h.jsx(H8,{children:"Upcoming features and experiments. Vote for what you'd like to see next!"})]}),h.jsx(q8,{children:i.map(s=>h.jsx(W8,{$active:e===s,onClick:()=>t(s),children:s==="all"?"All Features":s},s))}),h.jsx(V8,{children:n.map((s,o)=>h.jsxs(U8,{children:[h.jsxs(G8,{children:[h.jsx(Y8,{children:s.icon}),h.jsx(X8,{$status:s.status,children:s.status.replace("-"," ")})]}),h.jsx(Q8,{children:s.title}),h.jsx(Z8,{children:s.description}),h.jsx(J8,{children:s.category}),h.jsxs(K8,{children:[h.jsx("span",{children:"👍"}),h.jsx("span",{children:"Vote for this feature"})]})]},o))})]})},eN=({onClick:e,className:t="",title:r="Copy as Markdown"})=>{const[i,n]=M.useState(!1),[s,o]=M.useState(!1),a=async()=>{n(!0),o(!1);try{await e(),o(!0),setTimeout(()=>o(!1),2e3)}catch(c){console.error("Copy operation failed:",c)}finally{n(!1)}},l=()=>s?"Copied!":i?"...":"MD";return h.jsxs("button",{onClick:a,className:`download-button ${t} ${i?"processing":""} ${s?"success":""}`,title:r,"aria-label":r,disabled:i,children:[s?h.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:h.jsx("polyline",{points:"20,6 9,17 4,12"})}):h.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("rect",{x:"9",y:"9",width:"13",height:"13",rx:"2",ry:"2"}),h.jsx("path",{d:"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"})]}),h.jsx("span",{className:"download-text",children:l()})]})},rN=e=>{try{const i=new DOMParser().parseFromString(e,"text/html").getElementsByTagName("p");return Array.from(i).map(s=>JSON.parse(s.textContent??""))}catch(t){throw console.error("Error parsing urls",t),t}},iN=({metadatas:e})=>{const[t,r]=M.useState(null),[i,n]=M.useState({}),s=o=>{try{const a=new URL(o).hostname;return a.startsWith("www.")?a.substring(4):a}catch{return o}};return M.useEffect(()=>{(async()=>{const a={};e.forEach(({favicon:l,title:c,url:d})=>{a[d]={favicon:l,title:c}}),n(a)})()},[e]),h.jsx("div",{className:"url-grid-container",children:e.map((o,a)=>h.jsx("a",{href:o.url.startsWith("http")?o.url:`https://${o.url}`,target:"_blank",rel:"noopener noreferrer",className:"url-card",onMouseEnter:()=>r(a),onMouseLeave:()=>r(null),style:{transform:t===a?"translateY(-5px)":"none",boxShadow:t===a?"0 10px 20px rgba(0, 0, 0, 0.5)":"0 4px 6px rgba(0, 0, 0, 0.05)"},children:h.jsxs("div",{className:"url-card-content",children:[h.jsx("div",{className:"url-icon",children:i[o.url]&&h.jsx("img",{src:i[o.url].favicon,alt:"Site icon",className:"favicon"})}),h.jsxs("div",{className:"url-details",children:[h.jsx("h3",{className:"domain-name",children:s(o.url)}),h.jsx("p",{className:"full-url",children:o.title})]}),h.jsx("div",{className:"visit-icon",children:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"}),h.jsx("polyline",{points:"15 3 21 3 21 9"}),h.jsx("line",{x1:"10",y1:"14",x2:"21",y2:"3"})]})})]})},o.url))})},T0=({content:e,isStreaming:t=!1})=>{const r=ar.sanitize(e);let i=[];r.includes("favicon")&&(i=rN(r));const n=async()=>{try{let s=e;s=s.replace(/<think>([\s\S]*?)<\/think>/gi,"").replace(/&lt;think&gt;([\s\S]*?)&lt;\/think&gt;/gi,"");let o=s;if(s.includes("<")&&s.includes(">")){const a=document.createElement("div");a.innerHTML=s,o=a.textContent||a.innerText||"",o=o.replace(/\n\s*\n\s*\n/g,`

`).replace(/(^\s+)|(\s+$)/g,"").trim()}else o=s.trim();await navigator.clipboard.writeText(o),console.log("Markdown content copied to clipboard successfully")}catch(s){console.error("Failed to copy markdown to clipboard:",s);try{let o=e;o=o.replace(/<think>([\s\S]*?)<\/think>/gi,"").replace(/&lt;think&gt;([\s\S]*?)&lt;\/think&gt;/gi,"");let a=o;if(o.includes("<")&&o.includes(">")){const c=document.createElement("div");c.innerHTML=o,a=c.textContent||c.innerText||"",a=a.replace(/\n\s*\n\s*\n/g,`

`).replace(/(^\s+)|(\s+$)/g,"").trim()}else a=o.trim();const l=document.createElement("textarea");l.value=a,l.style.position="fixed",l.style.opacity="0",document.body.appendChild(l),l.select();try{document.execCommand("copy")}catch(c){console.error("execCommand failed:",c)}document.body.removeChild(l),console.log("Markdown content copied to clipboard using fallback method")}catch(o){console.error("Both clipboard methods failed:",o)}}};return t&&!e?h.jsx("div",{className:"doc-content",children:h.jsxs("span",{style:{display:"flex",alignItems:"center"},children:[h.jsx("small",{children:"Generating response..."})," ",h.jsx(cf,{isBlinking:!0})]})}):h.jsxs("div",{className:"bot-message",children:[i.length>0?h.jsx("div",{className:"doc-content",children:h.jsx(iN,{metadatas:i})}):h.jsxs("div",{style:{position:"relative"},children:[h.jsx(Ik,{content:e}),t&&h.jsx("span",{className:"streaming-cursor",style:{display:"inline-block",width:"8px",height:"16px",backgroundColor:"currentColor",marginLeft:"2px",animation:"blink 1s infinite"}})]}),h.jsxs("div",{className:"bot-message-actions",children:[t&&h.jsx("span",{className:"streaming-status",children:"Generating..."}),h.jsx("div",{className:"action-buttons",children:h.jsx(eN,{onClick:n})})]})]})},nN=Cr`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`,$0=k.div`
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.2));
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  animation: ${nN} 0.3s ease-out;
`,A0=k.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`,j0=k.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6px;
  height: 6px;
  background: var(--vscode-button-background);
  border-radius: 50%;
`,E0=k.span`
  color: var(--vscode-foreground);
  font-size: 13px;
  font-weight: 500;
  opacity: 0.9;
`,L0=k.div`
  background: var(--vscode-textBlockQuote-background, rgba(128, 128, 128, 0.1));
  border-left: 3px solid var(--vscode-button-background);
  padding: 12px 14px;
  border-radius: 0 6px 6px 0;
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vscode-foreground);
`,sN=k.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`,oN=k.span`
  font-size: 12px;
  font-weight: 500;
  color: var(--vscode-descriptionForeground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`,aN=k.span`
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  background: var(--vscode-badge-background);
  padding: 2px 8px;
  border-radius: 10px;
`,lN=k.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`,cN=k.a`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.08));
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.15s ease;
  cursor: pointer;

  &:hover {
    background: var(--vscode-list-activeSelectionBackground, rgba(128, 128, 128, 0.15));
    transform: translateX(2px);
  }
`,hN=k.span`
  font-size: 13px;
  font-weight: 500;
  color: var(--vscode-textLink-foreground);
  display: flex;
  align-items: center;
  gap: 6px;
`,dN=k.span`
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,uN=k.span`
  font-size: 12px;
  color: var(--vscode-foreground);
  opacity: 0.8;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`,pN=k.span`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${e=>e.$relevance>=70?"var(--vscode-testing-iconPassed, #4caf50)":e.$relevance>=40?"var(--vscode-editorWarning-foreground, #ff9800)":"var(--vscode-descriptionForeground)"};
  color: white;
  margin-left: auto;
`,fN=k.button`
  background: none;
  border: none;
  color: var(--vscode-textLink-foreground);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s ease;

  &:hover {
    background: var(--vscode-list-hoverBackground);
  }
`,gN=Cr`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`,Jh=k.div`
  height: 16px;
  background: linear-gradient(
    90deg,
    var(--vscode-editor-background) 0px,
    var(--vscode-list-hoverBackground) 40px,
    var(--vscode-editor-background) 80px
  );
  background-size: 200px 100%;
  animation: ${gN} 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;

  &:last-child {
    width: 60%;
  }
`,mN=()=>h.jsxs("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[h.jsx("path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"}),h.jsx("polyline",{points:"15 3 21 3 21 9"}),h.jsx("line",{x1:"10",y1:"14",x2:"21",y2:"3"})]}),xN=({query:e,answer:t,sources:r,isLoading:i=!1})=>{const[n,s]=M.useState(!1),o=n?r:r.slice(0,3),a=c=>{c&&window.open(c,"_blank","noopener,noreferrer")},l=(c,d=50)=>{try{const u=new URL(c),p=u.hostname+u.pathname;return p.length>d?p.slice(0,d)+"...":p}catch{return c.slice(0,d)}};return i?h.jsxs($0,{children:[h.jsxs(A0,{children:[h.jsx(j0,{}),h.jsx(E0,{children:"Searching..."})]}),h.jsx(Jh,{}),h.jsx(Jh,{}),h.jsx(Jh,{})]}):h.jsxs($0,{children:[h.jsxs(A0,{children:[h.jsx(j0,{}),h.jsx(E0,{children:e})]}),t&&h.jsx(L0,{children:t}),r.length>0&&h.jsxs(h.Fragment,{children:[h.jsxs(sN,{children:[h.jsx(oN,{children:"Sources"}),h.jsxs(aN,{children:[r.length," found"]})]}),h.jsx(lN,{children:o.map((c,d)=>h.jsxs(cN,{onClick:()=>a(c.url),as:c.url?"a":"div",href:c.url,target:"_blank",rel:"noopener noreferrer",children:[h.jsxs(hN,{children:[c.title||"Untitled Source",c.url&&h.jsx(mN,{}),c.relevance!==void 0&&h.jsxs(pN,{$relevance:c.relevance,children:[c.relevance,"%"]})]}),c.url&&h.jsx(dN,{children:l(c.url)}),c.snippet&&h.jsx(uN,{children:c.snippet})]},d))}),r.length>3&&h.jsx(fN,{onClick:()=>s(!n),children:n?"Show less":`Show ${r.length-3} more`})]}),r.length===0&&!t&&h.jsx(L0,{children:"No relevant results found for this query."})]})},bN=Cr`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`,B0=k.div`
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.2));
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  animation: ${bN} 0.3s ease-out;
`,M0=k.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`,I0=k.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6px;
  height: 6px;
  background: var(--vscode-symbolIcon-functionForeground, #b180d7);
  border-radius: 50%;
`,O0=k.span`
  color: var(--vscode-foreground);
  font-size: 13px;
  font-weight: 500;
`,yN=k.div`
  background: var(--vscode-textBlockQuote-background, rgba(128, 128, 128, 0.1));
  border-left: 3px solid var(--vscode-symbolIcon-functionForeground, #b180d7);
  padding: 12px 14px;
  border-radius: 0 6px 6px 0;
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vscode-foreground);
`,R0=k.div`
  font-size: 12px;
  font-weight: 500;
  color: var(--vscode-descriptionForeground);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
`,vN=k.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
`,wN=k.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--vscode-list-hoverBackground, rgba(128, 128, 128, 0.08));
  border-radius: 6px;
  font-size: 12px;
`,kN=k.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--vscode-symbolIcon-fileForeground, #7c7c7c);
`,CN=k.span`
  color: var(--vscode-foreground);
  font-family: var(--vscode-editor-font-family, monospace);
  flex: 1;
`,SN=k.span`
  color: var(--vscode-descriptionForeground);
  font-size: 11px;
`,_N=k.ul`
  margin: 0;
  padding-left: 20px;
  list-style-type: none;
`,TN=k.li`
  position: relative;
  padding: 4px 0;
  font-size: 12px;
  color: var(--vscode-foreground);
  line-height: 1.4;

  &::before {
    content: "•";
    position: absolute;
    left: -16px;
    color: var(--vscode-symbolIcon-functionForeground, #b180d7);
    font-weight: bold;
  }
`,$N=k.button`
  background: none;
  border: none;
  color: var(--vscode-textLink-foreground);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.15s ease;

  &:hover {
    background: var(--vscode-list-hoverBackground);
  }
`,AN=Cr`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`,Kh=k.div`
  height: 16px;
  background: linear-gradient(
    90deg,
    var(--vscode-editor-background) 0px,
    var(--vscode-list-hoverBackground) 40px,
    var(--vscode-editor-background) 80px
  );
  background-size: 200px 100%;
  animation: ${AN} 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 8px;

  &:last-child {
    width: 60%;
  }
`,jN=({title:e,summary:t,files:r,keyPoints:i,isLoading:n=!1})=>{const[s,o]=M.useState(!1),a=s?r:r.slice(0,3),l=c=>c.split("/").pop()||c;return n?h.jsxs(B0,{children:[h.jsxs(M0,{children:[h.jsx(I0,{}),h.jsx(O0,{children:"Analyzing..."})]}),h.jsx(Kh,{}),h.jsx(Kh,{}),h.jsx(Kh,{})]}):h.jsxs(B0,{children:[h.jsxs(M0,{children:[h.jsx(I0,{}),h.jsx(O0,{children:e})]}),t&&h.jsx(yN,{children:t}),r.length>0&&h.jsxs(h.Fragment,{children:[h.jsx(R0,{children:"Files Analyzed"}),h.jsx(vN,{children:a.map((c,d)=>h.jsxs(wN,{children:[h.jsx(kN,{}),h.jsx(CN,{children:l(c.path)}),c.lineCount&&h.jsxs(SN,{children:[c.lineCount," lines"]})]},d))}),r.length>3&&h.jsx($N,{onClick:()=>o(!s),children:s?"Show less":`Show ${r.length-3} more files`})]}),i&&i.length>0&&h.jsxs(h.Fragment,{children:[h.jsx(R0,{children:"Key Findings"}),h.jsx(_N,{children:i.slice(0,5).map((c,d)=>h.jsx(TN,{children:c},d))})]})]})},EN=Cr`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`,LN=k.div`
  background: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  padding: 14px;
  margin: 8px 0;
  animation: ${EN} 0.2s ease-out;
`,BN=k.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`,MN=k.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  flex-shrink: 0;
`,IN=k.span`
  color: var(--vscode-errorForeground, #f87171);
  font-size: 13px;
  font-weight: 500;
`,ON=k.p`
  margin: 0 0 12px 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--vscode-foreground);
`,RN=k.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  padding: 10px 12px;
  margin-top: 10px;
`,DN=k.div`
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vscode-descriptionForeground);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
`,FN=k.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--vscode-foreground);
  opacity: 0.9;
`,PN=k.ul`
  margin: 8px 0 0 0;
  padding-left: 20px;
  font-size: 12px;
  color: var(--vscode-foreground);
  opacity: 0.85;

  li {
    margin-bottom: 4px;
  }
`,NN=k.span`
  font-size: 10px;
  padding: 2px 8px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 10px;
  color: var(--vscode-errorForeground, #f87171);
  margin-left: auto;
`,zN=({message:e,suggestion:t,reason:r})=>{const n=e.includes("maximum iterations")||e.includes("multiple times")?["Try a more specific question","Break down complex requests into smaller parts","For GitHub data, visit the repository directly","Use simpler keywords in your query"]:e.includes("timeout")||e.includes("timed out")?["Check your internet connection","Try again in a few moments","The service might be temporarily unavailable"]:e.includes("API")||e.includes("rate limit")?["Wait a few minutes before trying again","Check your API key configuration"]:["Try rephrasing your question","Check if the information is publicly available"];return h.jsxs(LN,{children:[h.jsxs(BN,{children:[h.jsx(MN,{}),h.jsx(IN,{children:"Request could not be completed"}),r&&h.jsx(NN,{children:r.replace(/_/g," ")})]}),h.jsx(ON,{children:e}),h.jsxs(RN,{children:[h.jsx(DN,{children:"Suggestions"}),t?h.jsx(FN,{children:t}):h.jsx(PN,{children:n.map((s,o)=>h.jsx("li",{children:s},o))})]})]})};function HN(e){if(!e)return"";let t=e;return t=t.replace(/\{"command"\s*:\s*"[^"]*"\s*,\s*"message"\s*:\s*"[^"]*"[^}]*\}/g,""),t=t.replace(/\{"name"\s*:\s*"[^"]+"\s*,\s*"args"\s*:\s*\{[^}]*\}[^}]*\}/g,""),t=t.replace(/\{"type"\s*:\s*"tool_use"[^}]*\}/g,""),t=t.replace(/\{[^}]*"id"\s*:\s*"toolu_[^}]+\}/g,""),t=t.replace(/\{"(command|name|type)"\s*:\s*"[^"]*"[\s\S]*$/g,""),t=t.replace(/\n{3,}/g,`

`),t.trim()}function qN(e){try{const a=JSON.parse(e);if(a.type==="synthesized_search"||a.type==="code_analysis")return a}catch{}const t=e.match(/```json\s*([\s\S]*?)```/);if(t)try{const a=JSON.parse(t[1]);if(a.type==="synthesized_search"||a.type==="code_analysis")return a}catch{}const r=/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,i=[];let n;for(;(n=r.exec(e))!==null;)i.push({title:n[1],url:n[2]});if(i.length>=2){const a=e.match(/Search Results for: ["'](.+?)["']/i)||e.match(/searching.*for[:\s]+["']?([^"'\n]+)/i),c=e.match(/^([\s\S]*?)(?:\*\*Sources?\*\*|##\s*Sources?|\n-\s*\[)/i)?.[1]?.trim().replace(/\*\*/g,"");if(a||c)return{type:"synthesized_search",query:a?.[1]||"Search",answer:c||void 0,sources:i.slice(0,5)}}if([/(?:analyzed?|reading|examining)\s+(\d+)\s+files?/i,/Code Analysis:/i,/Files? Analyzed:/i].some(a=>a.test(e))){const l=(e.match(/[`']([^`']+\.[a-z]+)[`']/gi)||[]).map(c=>({path:c.replace(/[`']/g,"")}));if(l.length>0){const c=e.match(/^([^\n]+)/);return{type:"code_analysis",title:`Code Analysis: ${l.length} file${l.length>1?"s":""}`,summary:c?.[1]||"Analysis complete",files:l,keyPoints:WN(e)}}}return null}function WN(e){const t=[],r=e.match(/[-•*]\s+([^\n]+)/g);r&&t.push(...r.map(n=>n.replace(/^[-•*]\s+/,"").trim()));const i=e.match(/\d+\.\s+([^\n]+)/g);return i&&t.push(...i.map(n=>n.replace(/^\d+\.\s+/,"").trim())),[...new Set(t)].slice(0,5)}function VN(e){return[/exceeded maximum iterations/i,/error occurred/i,/couldn't find/i,/could not be completed/i,/multiple times but couldn't/i,/Please rephrase/i,/try a simpler query/i].some(r=>r.test(e))}const UN=({content:e,language:t,isStreaming:r=!1})=>{const i=M.useMemo(()=>HN(e),[e]),n=M.useMemo(()=>r?null:qN(i),[i,r]),s=M.useMemo(()=>r?!1:VN(i),[i,r]);if(!i&&!r)return null;if(r)return h.jsx(T0,{content:i,language:t,isStreaming:!0});if(s)return h.jsx(zN,{message:i});if(n)switch(n.type){case"synthesized_search":return h.jsx(xN,{query:n.query,answer:n.answer,sources:n.sources});case"code_analysis":return h.jsx(jN,{title:n.title,summary:n.summary,files:n.files,keyPoints:n.keyPoints})}return h.jsx(T0,{content:i,language:t,isStreaming:!1})},GN=({message:e,alias:t})=>h.jsx("div",{style:{display:"flex",justifyContent:"flex-end",width:"100%"},children:h.jsxs("div",{className:"message-container user-message",style:{flexDirection:"row-reverse"},children:[h.jsx("div",{className:"avatar-container",children:h.jsx("div",{className:"avatar",children:t||"U"})}),h.jsx("div",{className:"message-content",style:{textAlign:"left"},children:e})]})}),YN=k.div`
  width: 100%;
  max-width: 100%;
  padding: 20px;
`,td=k.div`
  margin-bottom: 40px;

  &:last-child {
    margin-bottom: 0;
  }
`,ed=k.h3`
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: left;
`,dr=k.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  gap: 24px;

  &:first-of-type {
    padding-top: 0;
  }

  &:last-child {
    border-bottom: none;
  }
`,ur=k.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
`,pr=k.label`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  display: block;
  text-align: left;
`,fr=k.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.5;
  text-align: left;
`,gr=k.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`,Dn=k.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  cursor: pointer;
`,Fn=k.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background: rgba(255, 255, 255, 0.15);
  }

  &:checked + span:before {
    transform: translateX(18px);
    background: rgba(255, 255, 255, 0.9);
  }

  &:disabled + span {
    opacity: 0.4;
    cursor: not-allowed;
  }
`,Pn=k.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  transition: 0.2s;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 2px;
    background: rgba(255, 255, 255, 0.6);
    transition: 0.2s;
    border-radius: 50%;
  }
`,XN=k.input`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  min-width: 200px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`,rd=k.select`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  min-width: 200px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: #1a1a1a;
    color: rgba(255, 255, 255, 0.9);
    padding: 8px;
  }
`,id=k.button`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,QN=({username:e,selectedTheme:t,selectedModel:r,selectedCodeBuddyMode:i,enableStreaming:n,darkMode:s,themeOptions:o,modelOptions:a,codeBuddyMode:l,onUsernameChange:c,onThemeChange:d,onModelChange:u,onCodeBuddyModeChange:p,onStreamingChange:f,onDarkModeChange:g,onClearHistory:x,onIndexWorkspace:v,onSavePreferences:y})=>h.jsxs(YN,{children:[h.jsxs(td,{children:[h.jsx(ed,{children:"General"}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"Workspace Knowledge"}),h.jsx(fr,{children:"Manually re-index the workspace for semantic search"})]}),h.jsx(gr,{children:h.jsx(id,{onClick:v,disabled:!v,children:"Index Workspace"})})]}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"Nickname"}),h.jsx(fr,{children:"Your display name in chat"})]}),h.jsxs(gr,{children:[h.jsx(XN,{type:"text",value:e,onChange:b=>c(b.target.value),placeholder:"Enter nickname",maxLength:10,disabled:!0}),y&&h.jsx(id,{onClick:y,disabled:!0,children:"Save"})]})]}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"Code Theme"}),h.jsx(fr,{children:"Syntax highlighting theme for code blocks"})]}),h.jsx(gr,{children:h.jsx(rd,{value:t,onChange:b=>d(b.target.value),children:o.map(b=>h.jsx("option",{value:b.value,children:b.label},b.value))})})]}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"AI Model"}),h.jsx(fr,{children:"Choose your preferred AI model"})]}),h.jsx(gr,{children:h.jsx(rd,{value:r,onChange:b=>u(b.target.value),children:a.map(b=>h.jsx("option",{value:b.value,children:b.label},b.value))})})]}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"CodeBuddy Mode"}),h.jsx(fr,{children:"Agent mode or Ask mode"})]}),h.jsx(gr,{children:h.jsx(rd,{value:i,onChange:b=>p(b.target.value),children:l.map(b=>h.jsx("option",{value:b.value,children:b.label},b.value))})})]})]}),h.jsxs(td,{children:[h.jsx(ed,{children:"Features"}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"Enable Streaming"}),h.jsx(fr,{children:"Stream responses in real-time"})]}),h.jsx(gr,{children:h.jsxs(Dn,{children:[h.jsx(Fn,{type:"checkbox",checked:n,onChange:b=>f(b.target.checked)}),h.jsx(Pn,{})]})})]}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"Index Codebase"}),h.jsx(fr,{children:"Index your workspace for better context"})]}),h.jsx(gr,{children:h.jsxs(Dn,{children:[h.jsx(Fn,{type:"checkbox",checked:s,onChange:b=>g(b.target.checked),disabled:!0}),h.jsx(Pn,{})]})})]}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"Auto Suggestions"}),h.jsx(fr,{children:"Show inline code suggestions automatically"})]}),h.jsx(gr,{children:h.jsxs(Dn,{children:[h.jsx(Fn,{type:"checkbox",checked:!1,disabled:!0}),h.jsx(Pn,{})]})})]}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"Web Search"}),h.jsx(fr,{children:"Allow AI to search the web for information"})]}),h.jsx(gr,{children:h.jsxs(Dn,{children:[h.jsx(Fn,{type:"checkbox",checked:!1,disabled:!0}),h.jsx(Pn,{})]})})]})]}),h.jsxs(td,{children:[h.jsx(ed,{children:"Privacy & Data"}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"Save Chat History"}),h.jsx(fr,{children:"Store conversations locally"})]}),h.jsx(gr,{children:h.jsxs(Dn,{children:[h.jsx(Fn,{type:"checkbox",checked:!0,disabled:!0}),h.jsx(Pn,{})]})})]}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"Anonymous Telemetry"}),h.jsx(fr,{children:"Help improve CodeBuddy by sharing usage data"})]}),h.jsx(gr,{children:h.jsxs(Dn,{children:[h.jsx(Fn,{type:"checkbox",checked:!1,disabled:!0}),h.jsx(Pn,{})]})})]}),h.jsxs(dr,{children:[h.jsxs(ur,{children:[h.jsx(pr,{children:"Clear Chat History"}),h.jsx(fr,{children:"Permanently delete all saved conversations"})]}),h.jsx(gr,{children:h.jsx(id,{onClick:x,children:"Clear History"})})]})]})]}),Dk=[{id:"account",label:"Account",icon:"user",description:"Manage your account settings"},{id:"general",label:"General",icon:"settings",description:"General application settings"},{id:"agents",label:"Agents",icon:"bot",description:"Configure AI agent behavior"},{id:"mcp",label:"MCP",icon:"server",description:"Model Context Protocol servers"},{id:"conversation",label:"Conversation",icon:"message",description:"Chat and conversation settings"},{id:"models",label:"Models",icon:"cpu",description:"AI model configuration"},{id:"context",label:"Context",icon:"folder",description:"Workspace context settings"},{id:"rules",label:"Rules & Subagents",icon:"book",description:"Custom rules and subagent configuration"},{id:"privacy",label:"Privacy",icon:"shield",description:"Privacy and data settings"},{id:"beta",label:"Beta",icon:"flask",description:"Experimental features"},{id:"about",label:"About CodeBuddy",icon:"info",description:"About this extension"}],Re=({name:e,size:t=16})=>{const r={user:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}),h.jsx("circle",{cx:"12",cy:"7",r:"4"})]}),settings:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("circle",{cx:"12",cy:"12",r:"3"}),h.jsx("path",{d:"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"})]}),bot:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("rect",{x:"3",y:"11",width:"18",height:"10",rx:"2"}),h.jsx("circle",{cx:"12",cy:"5",r:"2"}),h.jsx("path",{d:"M12 7v4"}),h.jsx("line",{x1:"8",y1:"16",x2:"8",y2:"16"}),h.jsx("line",{x1:"16",y1:"16",x2:"16",y2:"16"})]}),server:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("rect",{x:"2",y:"2",width:"20",height:"8",rx:"2",ry:"2"}),h.jsx("rect",{x:"2",y:"14",width:"20",height:"8",rx:"2",ry:"2"}),h.jsx("line",{x1:"6",y1:"6",x2:"6.01",y2:"6"}),h.jsx("line",{x1:"6",y1:"18",x2:"6.01",y2:"18"})]}),message:h.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:h.jsx("path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"})}),cpu:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("rect",{x:"4",y:"4",width:"16",height:"16",rx:"2",ry:"2"}),h.jsx("rect",{x:"9",y:"9",width:"6",height:"6"}),h.jsx("line",{x1:"9",y1:"1",x2:"9",y2:"4"}),h.jsx("line",{x1:"15",y1:"1",x2:"15",y2:"4"}),h.jsx("line",{x1:"9",y1:"20",x2:"9",y2:"23"}),h.jsx("line",{x1:"15",y1:"20",x2:"15",y2:"23"}),h.jsx("line",{x1:"20",y1:"9",x2:"23",y2:"9"}),h.jsx("line",{x1:"20",y1:"14",x2:"23",y2:"14"}),h.jsx("line",{x1:"1",y1:"9",x2:"4",y2:"9"}),h.jsx("line",{x1:"1",y1:"14",x2:"4",y2:"14"})]}),folder:h.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:h.jsx("path",{d:"M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"})}),book:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("path",{d:"M4 19.5A2.5 2.5 0 0 1 6.5 17H20"}),h.jsx("path",{d:"M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"})]}),shield:h.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:h.jsx("path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"})}),flask:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("path",{d:"M9 3h6"}),h.jsx("path",{d:"M10 3v6.5L4.5 18a2 2 0 0 0 1.72 3h11.56a2 2 0 0 0 1.72-3L14 9.5V3"}),h.jsx("path",{d:"M8 14h8"})]}),info:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("circle",{cx:"12",cy:"12",r:"10"}),h.jsx("line",{x1:"12",y1:"16",x2:"12",y2:"12"}),h.jsx("line",{x1:"12",y1:"8",x2:"12.01",y2:"8"})]}),gear:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("circle",{cx:"12",cy:"12",r:"3"}),h.jsx("path",{d:"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"})]}),chevronRight:h.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:h.jsx("polyline",{points:"9 18 15 12 9 6"})}),externalLink:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"}),h.jsx("polyline",{points:"15 3 21 3 21 9"}),h.jsx("line",{x1:"10",y1:"14",x2:"21",y2:"3"})]}),plus:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("line",{x1:"12",y1:"5",x2:"12",y2:"19"}),h.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"})]}),trash:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("polyline",{points:"3 6 5 6 21 6"}),h.jsx("path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"})]})};return h.jsx(h.Fragment,{children:r[e]||r.settings})},ZN=({size:e=20,className:t})=>h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:t,children:[h.jsx("circle",{cx:"12",cy:"12",r:"3"}),h.jsx("path",{d:"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"})]}),JN=k.div`
  width: 220px;
  min-width: 220px;
  background: #16161e;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
`,KN=k.div`
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`,t9=k.div`
  display: flex;
  align-items: center;
  gap: 12px;
`,e9=k.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${e=>e.$hasImage?"transparent":"linear-gradient(135deg, #667eea 0%, #764ba2 100%)"};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`,r9=k.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`,i9=k.span`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`,n9=k.span`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
`,s9=k.div`
  padding: 12px 16px;
`,o9=k.div`
  position: relative;
  display: flex;
  align-items: center;
`,a9=k.div`
  position: absolute;
  left: 10px;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 14px;
    height: 14px;
  }
`,l9=k.input`
  width: 100%;
  padding: 8px 10px 8px 32px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  outline: none;
  transition: all 0.15s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.06);
  }
`,c9=k.span`
  position: absolute;
  right: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
`,h9=k.nav`
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
`,d9=k.button`
  width: calc(100% - 16px);
  margin: 2px 8px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${e=>e.$active?"rgba(255, 255, 255, 0.08)":"transparent"};
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  ${e=>e.$active&&`
    background: rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }
  `}
`,u9=k.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${e=>e.$active?"rgba(255, 255, 255, 0.9)":"rgba(255, 255, 255, 0.5)"};
  transition: color 0.15s ease;

  svg {
    width: 16px;
    height: 16px;
  }
`,p9=k.span`
  font-size: 13px;
  font-weight: ${e=>e.$active?500:400};
  color: ${e=>e.$active?"rgba(255, 255, 255, 0.95)":"rgba(255, 255, 255, 0.7)"};
  transition: all 0.15s ease;
`,f9=k.span`
  margin-left: auto;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #7c3aed;
`,g9=({username:e,avatarUrl:t,accountType:r,activeCategory:i,onCategoryChange:n,searchQuery:s,onSearchChange:o})=>{const a=l=>l.charAt(0).toUpperCase();return h.jsxs(JN,{children:[h.jsx(KN,{children:h.jsxs(t9,{children:[h.jsx(e9,{$hasImage:!!t,children:t?h.jsx("img",{src:t,alt:e}):a(e)}),h.jsxs(r9,{children:[h.jsx(i9,{children:e}),h.jsx(n9,{children:r})]})]})}),h.jsx(s9,{children:h.jsxs(o9,{children:[h.jsx(a9,{children:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("circle",{cx:"11",cy:"11",r:"8"}),h.jsx("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]})}),h.jsx(l9,{type:"text",placeholder:"Search settings...",value:s,onChange:l=>o(l.target.value)}),h.jsx(c9,{children:"⌘F"})]})}),h.jsx(h9,{children:Dk.map(l=>h.jsxs(d9,{$active:i===l.id,onClick:()=>n(l.id),"aria-selected":i===l.id,children:[h.jsx(u9,{$active:i===l.id,children:h.jsx(Re,{name:l.icon})}),h.jsx(p9,{$active:i===l.id,children:l.label}),i===l.id&&h.jsx(f9,{})]},l.id))})]})},Mt=k.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`,It=k.h3`
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;k.p`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 16px 0;
  line-height: 1.5;
`;const mt=k.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  gap: 24px;

  &:first-of-type {
    padding-top: 0;
  }

  &:last-child {
    border-bottom: none;
  }
`,xt=k.div`
  flex: 1;
  min-width: 0;
`,bt=k.label`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  display: block;
  margin-bottom: 4px;
`,yt=k.p`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  line-height: 1.5;
`,vt=k.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`,m9=k.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
  cursor: pointer;
`,x9=k.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background: #7c3aed;
  }

  &:checked + span:before {
    transform: translateX(18px);
    background: white;
  }

  &:disabled + span {
    opacity: 0.4;
    cursor: not-allowed;
  }
`,b9=k.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.1);
  transition: 0.2s;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 2px;
    background: rgba(255, 255, 255, 0.6);
    transition: 0.2s;
    border-radius: 50%;
  }
`,ne=({checked:e,onChange:t,disabled:r})=>h.jsxs(m9,{children:[h.jsx(x9,{type:"checkbox",checked:e,onChange:i=>t(i.target.checked),disabled:r}),h.jsx(b9,{})]}),Si=k.select`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  min-width: 180px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: #1a1a1a;
    color: rgba(255, 255, 255, 0.9);
    padding: 8px;
  }
`,Fk=k.input`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  min-width: 180px;
  transition: all 0.15s ease;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`,Et=k.button`
  background: ${e=>{switch(e.$variant){case"primary":return"#7c3aed";case"danger":return"rgba(239, 68, 68, 0.15)";default:return"rgba(255, 255, 255, 0.06)"}}};
  border: 1px solid ${e=>{switch(e.$variant){case"primary":return"#7c3aed";case"danger":return"rgba(239, 68, 68, 0.3)";default:return"rgba(255, 255, 255, 0.12)"}}};
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 500;
  color: ${e=>{switch(e.$variant){case"primary":return"white";case"danger":return"#ef4444";default:return"rgba(255, 255, 255, 0.9)"}}};
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${e=>{switch(e.$variant){case"primary":return"#8b5cf6";case"danger":return"rgba(239, 68, 68, 0.25)";default:return"rgba(255, 255, 255, 0.1)"}}};
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`,xn=k.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`,Xo=k.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`,Qo=k.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
`,Zo=k.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
`;k.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 24px 0;
`;const Se=k.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  background: ${e=>{switch(e.$variant){case"success":return"rgba(34, 197, 94, 0.15)";case"warning":return"rgba(234, 179, 8, 0.15)";case"error":return"rgba(239, 68, 68, 0.15)";default:return"rgba(255, 255, 255, 0.1)"}}};
  color: ${e=>{switch(e.$variant){case"success":return"#22c55e";case"warning":return"#eab308";case"error":return"#ef4444";default:return"rgba(255, 255, 255, 0.7)"}}};
`;k.button`
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;const Pk=k.div`
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
`,Nk=k.div`
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.3);

  svg {
    width: 48px;
    height: 48px;
  }
`,zk=k.h4`
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
`,Hk=k.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
`,y9=k.button`
  background: transparent;
  border: none;
  padding: 0;
  font-size: 13px;
  color: #7c3aed;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`,v9=k.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 24px;
`,w9=k.div`
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: white;
`,k9=k.div`
  flex: 1;
`,C9=k.h3`
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
`,S9=k.p`
  margin: 0 0 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
`,_9=k.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(124, 58, 237, 0.15);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #a78bfa;
`,T9=({searchQuery:e})=>h.jsxs(h.Fragment,{children:[h.jsxs(v9,{children:[h.jsx(w9,{children:"CB"}),h.jsxs(k9,{children:[h.jsx(C9,{children:"CodeBuddy User"}),h.jsx(S9,{children:"user@codebuddy.dev"}),h.jsxs(_9,{children:[h.jsx("svg",{width:"12",height:"12",viewBox:"0 0 24 24",fill:"currentColor",children:h.jsx("path",{d:"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"})}),"Free Plan"]})]}),h.jsx(Et,{$variant:"secondary",disabled:!0,children:"Edit Profile"})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Subscription"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Current Plan"}),h.jsx(yt,{children:"You're currently on the Free plan. Upgrade to Pro for unlimited features."})]}),h.jsxs(vt,{children:[h.jsx(Se,{children:"Free"}),h.jsx(Et,{$variant:"primary",disabled:!0,children:"Upgrade to Pro"})]})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Usage This Month"}),h.jsx(yt,{children:"API calls and token usage for the current billing period"})]}),h.jsx(vt,{children:h.jsx("span",{style:{color:"rgba(255,255,255,0.7)",fontSize:"13px"},children:"0 / Unlimited"})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Account Actions"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Sign Out"}),h.jsx(yt,{children:"Sign out of your CodeBuddy account on this device"})]}),h.jsx(vt,{children:h.jsx(Et,{disabled:!0,children:"Sign Out"})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Delete Account"}),h.jsx(yt,{children:"Permanently delete your account and all associated data"})]}),h.jsx(vt,{children:h.jsx(Et,{$variant:"danger",disabled:!0,children:"Delete Account"})})]})]})]}),df=[{value:"en",label:"English"},{value:"es",label:"Spanish"},{value:"fr",label:"French"},{value:"de",label:"German"},{value:"zh",label:"Chinese"},{value:"ja",label:"Japanese"}],uf=[{value:"default",label:"Default"},{value:"vim",label:"Vim"},{value:"emacs",label:"Emacs"},{value:"sublime",label:"Sublime Text"}],pf=[{id:"code-analyzer",name:"Code Analyzer",description:"Deep code analysis, security scanning, and architecture review",enabled:!0,toolPatterns:["analyze","lint","security","complexity","quality","ast","parse","check","scan","review"]},{id:"doc-writer",name:"Documentation Writer",description:"Generate comprehensive documentation and API references",enabled:!0,toolPatterns:["search","read","generate","doc","api","reference","web"]},{id:"debugger",name:"Debugger",description:"Find and fix bugs with access to all available tools",enabled:!0,toolPatterns:["*"]},{id:"file-organizer",name:"File Organizer",description:"Restructure and organize project files and directories",enabled:!0,toolPatterns:["file","directory","list","read","write","move","rename","delete","structure","organize"]}],$9={values:{theme:"tokyo night",language:"en",keymap:"default",nickname:"",codeBuddyMode:"Agent",enableStreaming:!0,selectedModel:"Gemini",username:"",accountType:"Free",customRules:[],customSystemPrompt:"",subagents:pf},options:{themeOptions:[],modelOptions:[],codeBuddyModeOptions:[],keymapOptions:uf,languageOptions:df},handlers:{onThemeChange:()=>{},onLanguageChange:()=>{},onKeymapChange:()=>{},onNicknameChange:()=>{},onCodeBuddyModeChange:()=>{},onStreamingChange:()=>{},onModelChange:()=>{},onUsernameChange:()=>{},postMessage:()=>{},onAddRule:()=>{},onUpdateRule:()=>{},onDeleteRule:()=>{},onToggleRule:()=>{},onUpdateSystemPrompt:()=>{},onToggleSubagent:()=>{}}},qk=M.createContext($9),A9=({children:e,values:t,options:r,handlers:i})=>{const n={values:t,options:{...r,keymapOptions:r.keymapOptions||uf,languageOptions:r.languageOptions||df},handlers:i};return h.jsx(qk.Provider,{value:n,children:e})},Uc=()=>{const e=M.useContext(qk);if(!e)throw new Error("useSettings must be used within a SettingsProvider");return e},j9=({searchQuery:e})=>{const{values:t,options:r,handlers:i}=Uc(),n=()=>{i.postMessage({command:"open-codebuddy-settings"})};return h.jsxs(h.Fragment,{children:[h.jsxs(Mt,{children:[h.jsx(It,{children:"Basics"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Theme"}),h.jsx(yt,{children:"Select a color theme for syntax highlighting"})]}),h.jsx(vt,{children:h.jsx(Si,{value:t.theme,onChange:s=>i.onThemeChange(s.target.value),children:r.themeOptions.map(s=>h.jsx("option",{value:s.value,children:s.label},s.value))})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Language"}),h.jsx(yt,{children:"Select the language for button labels and other in-app text"})]}),h.jsx(vt,{children:h.jsx(Si,{value:t.language,onChange:s=>i.onLanguageChange(s.target.value),disabled:!0,title:"Coming soon",children:r.languageOptions.map(s=>h.jsx("option",{value:s.value,children:s.label},s.value))})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"CodeBuddy Mode"}),h.jsx(yt,{children:"Switch between Agent mode (autonomous) and Ask mode (conversational)"})]}),h.jsx(vt,{children:h.jsx(Si,{value:t.codeBuddyMode,onChange:s=>i.onCodeBuddyModeChange(s.target.value),children:r.codeBuddyModeOptions.map(s=>h.jsx("option",{value:s.value,children:s.label},s.value))})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Preferences"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Nickname"}),h.jsx(yt,{children:"Your display name shown in chat conversations"})]}),h.jsx(vt,{children:h.jsx(Fk,{type:"text",placeholder:"Enter nickname",value:t.nickname||t.username,onChange:s=>i.onNicknameChange(s.target.value),maxLength:20})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Enable Streaming"}),h.jsx(yt,{children:"Stream AI responses in real-time as they are generated"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:t.enableStreaming,onChange:s=>i.onStreamingChange(s)})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"CodeBuddy Settings"}),h.jsx(yt,{children:"Configure API keys, models, and other CodeBuddy extension settings"})]}),h.jsx(vt,{children:h.jsx(Et,{onClick:n,children:"Go to Settings"})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Shortcut Settings"}),h.jsx(yt,{children:"Customize shortcut keys for various operations in the IDE"})]}),h.jsx(vt,{children:h.jsx(Si,{value:t.keymap,onChange:s=>i.onKeymapChange(s.target.value),disabled:!0,title:"Coming soon",children:r.keymapOptions.map(s=>h.jsx("option",{value:s.value,children:s.label},s.value))})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Import Configuration"}),h.jsx(yt,{children:"Import all extensions, settings, and keybindings configurations from VSCode or Cursor"})]}),h.jsx(vt,{children:h.jsx(Et,{disabled:!0,title:"Coming soon",children:"Import"})})]})]})]})},E9=[{value:"Agent",label:"Agent Mode"},{value:"Ask",label:"Ask Mode"}],L9=({searchQuery:e})=>{const[t,r]=M.useState("Agent"),[i,n]=M.useState(!1),[s,o]=M.useState(!1),[a,l]=M.useState(!0),[c,d]=M.useState(!0),u=p=>{r(p),(window.acquireVsCodeApi?.()||{postMessage:()=>{}}).postMessage({command:"codebuddy-model-change-event",message:p})};return h.jsxs(h.Fragment,{children:[h.jsxs(Mt,{children:[h.jsx(It,{children:"Agent Mode"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"CodeBuddy Mode"}),h.jsx(yt,{children:"Agent mode provides autonomous task execution. Ask mode is for Q&A interactions."})]}),h.jsx(vt,{children:h.jsx(Si,{value:t,onChange:p=>u(p.target.value),children:E9.map(p=>h.jsx("option",{value:p.value,children:p.label},p.value))})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Current Agent Status"}),h.jsx(yt,{children:"The agent is ready to assist with your coding tasks"})]}),h.jsx(vt,{children:h.jsx(Se,{$variant:"success",children:"Active"})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Permissions"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Auto-approve Actions"}),h.jsx(yt,{children:"Automatically approve agent actions without asking for confirmation"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:i,onChange:n})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Allow File Edits"}),h.jsx(yt,{children:"Allow the agent to create, modify, and delete files in your workspace"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:a,onChange:l})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Allow Terminal Access"}),h.jsx(yt,{children:"Allow the agent to execute terminal commands"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:c,onChange:d})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Advanced"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Verbose Logging"}),h.jsx(yt,{children:"Show detailed agent activity logs for debugging"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:s,onChange:o})})]})]})]})},B9=k.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
`,M9=k.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`,I9=k.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: ${e=>{switch(e.$status){case"connected":return"rgba(34, 197, 94, 0.15)";case"connecting":return"rgba(234, 179, 8, 0.15)";case"error":return"rgba(239, 68, 68, 0.15)";default:return"rgba(255, 255, 255, 0.08)"}}};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${e=>{switch(e.$status){case"connected":return"#22c55e";case"connecting":return"#eab308";case"error":return"#ef4444";default:return"rgba(255, 255, 255, 0.5)"}}};
`,O9=k.div`
  flex: 1;
  min-width: 0;
`,R9=k.h4`
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 8px;
`,D9=k.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`,F9=k.div`
  display: flex;
  align-items: center;
  gap: 12px;
`,P9=k.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`,N9=k.div`
  color: rgba(255, 255, 255, 0.5);
  transition: transform 0.2s ease;
  transform: rotate(${e=>e.$isExpanded?"180deg":"0deg"});
`,z9=k.div`
  max-height: ${e=>e.$isExpanded?"1000px":"0"};
  overflow: hidden;
  transition: max-height 0.3s ease;
  border-top: ${e=>e.$isExpanded?"1px solid rgba(255, 255, 255, 0.06)":"none"};
`,H9=k.div`
  padding: 8px 16px 16px;
`,D0=k.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`,F0=k.div`
  flex: 1;
  min-width: 0;
`,q9=k.div`
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  font-family: 'Monaco', 'Menlo', monospace;
`,P0=k.div`
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,W9=k.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.5);
`,V9=k(Et)`
  display: flex;
  align-items: center;
  gap: 6px;
`,U9=k.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${e=>{switch(e.$status){case"connected":return"#22c55e";case"connecting":return"#eab308";case"error":return"#ef4444";default:return"rgba(255, 255, 255, 0.3)"}}};
`,G9=({searchQuery:e})=>{const{handlers:t}=Uc(),[r,i]=M.useState([]),[n,s]=M.useState(new Set),[o,a]=M.useState(!0),[l,c]=M.useState(!1),d=M.useCallback(()=>{t.postMessage({command:"mcp-get-servers"})},[t]);M.useEffect(()=>{const y=b=>{const w=b.data;w.command==="mcp-servers-data"&&(i(w.data?.servers||[]),a(!1),c(!1)),w.command==="mcp-tool-updated"&&i(S=>S.map(_=>_.id===w.data?.serverName?{..._,tools:_.tools.map(A=>A.name===w.data?.toolName?{...A,enabled:w.data?.enabled}:A)}:_)),w.command==="mcp-server-updated"&&i(S=>S.map(_=>_.id===w.data?.serverName?{..._,enabled:w.data?.enabled}:_))};return window.addEventListener("message",y),d(),()=>window.removeEventListener("message",y)},[d]);const u=()=>{c(!0),t.postMessage({command:"mcp-refresh-tools"})},p=y=>{s(b=>{const w=new Set(b);return w.has(y)?w.delete(y):w.add(y),w})},f=(y,b)=>{t.postMessage({command:"mcp-toggle-server",message:{serverName:y,enabled:b}}),i(w=>w.map(S=>S.id===y?{...S,enabled:b}:S))},g=(y,b,w)=>{t.postMessage({command:"mcp-toggle-tool",message:{serverName:y,toolName:b,enabled:w}}),i(S=>S.map(_=>_.id===y?{..._,tools:_.tools.map(A=>A.name===b?{...A,enabled:w}:A)}:_))},x=r.reduce((y,b)=>y+b.toolCount,0),v=r.reduce((y,b)=>y+b.tools.filter(w=>w.enabled).length,0);return h.jsxs(h.Fragment,{children:[h.jsxs(Mt,{children:[h.jsx(It,{children:"MCP Servers"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Model Context Protocol"}),h.jsxs(yt,{children:["MCP servers extend CodeBuddy with external tools.",x>0&&` ${v}/${x} tools enabled.`]})]}),h.jsx(vt,{children:h.jsx(V9,{onClick:u,disabled:l,children:l?h.jsxs(h.Fragment,{children:[h.jsx("span",{style:{display:"inline-block",animation:"spin 1s linear infinite"},children:"⟳"}),"Refreshing..."]}):h.jsxs(h.Fragment,{children:[h.jsx("span",{children:"⟳"}),"Refresh Tools"]})})})]})]}),h.jsxs(Mt,{children:[h.jsxs(It,{children:["Connected Servers",r.length>0&&h.jsxs(Se,{$variant:"default",style:{marginLeft:"8px"},children:[r.filter(y=>y.status==="connected").length,"/",r.length]})]}),o?h.jsx(W9,{children:h.jsx("span",{children:"Loading MCP servers..."})}):r.length===0?h.jsxs(Pk,{children:[h.jsx(Nk,{children:h.jsx(Re,{name:"server",size:48})}),h.jsx(zk,{children:"No MCP Servers Configured"}),h.jsxs(Hk,{children:["Configure MCP servers in your VS Code settings to extend CodeBuddy with external tools.",h.jsx("br",{}),h.jsx("br",{}),h.jsx("code",{style:{fontSize:"11px",color:"rgba(255,255,255,0.6)"},children:"Settings → CodeBuddy → MCP Servers"})]})]}):r.map(y=>{const b=n.has(y.id),w=y.tools.filter(S=>S.enabled).length;return h.jsxs(B9,{children:[h.jsxs(M9,{$isExpanded:b,onClick:()=>p(y.id),children:[h.jsx(I9,{$status:y.status,children:h.jsx(Re,{name:"server",size:20})}),h.jsxs(O9,{children:[h.jsxs(R9,{children:[y.name,h.jsx(U9,{$status:y.status})]}),h.jsx(D9,{children:y.description||`MCP Server: ${y.id}`})]}),h.jsxs(F9,{children:[h.jsxs(P9,{children:[w,"/",y.toolCount," tools"]}),h.jsx(Se,{$variant:y.status==="connected"?"success":y.status==="connecting"?"warning":y.status==="error"?"error":"default",children:y.status}),h.jsx(ne,{checked:y.enabled,onChange:S=>{f(y.id,S)}}),h.jsx(N9,{$isExpanded:b,children:h.jsx("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",children:h.jsx("polyline",{points:"6 9 12 15 18 9"})})})]})]}),h.jsx(z9,{$isExpanded:b,children:h.jsx(H9,{children:y.tools.length===0?h.jsx(D0,{children:h.jsx(F0,{children:h.jsx(P0,{children:"No tools available from this server"})})}):y.tools.map(S=>h.jsxs(D0,{children:[h.jsxs(F0,{children:[h.jsx(q9,{children:S.name}),S.description&&h.jsx(P0,{children:S.description})]}),h.jsx(ne,{checked:S.enabled,onChange:_=>g(y.id,S.name,_),disabled:!y.enabled})]},`${y.id}-${S.name}`))})})]},y.id)})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Configuration"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"MCP Server Settings"}),h.jsx(yt,{children:"Add or modify MCP server configurations in VS Code settings"})]}),h.jsx(vt,{children:h.jsx(Et,{onClick:()=>t.postMessage({command:"open-mcp-settings"}),children:"Open Settings"})})]})]})]})},Y9=[{value:"small",label:"Small"},{value:"medium",label:"Medium"},{value:"large",label:"Large"}],X9=({searchQuery:e})=>{const[t,r]=M.useState(!0),[i,n]=M.useState(!0),[s,o]=M.useState(!1),[a,l]=M.useState("medium"),[c,d]=M.useState(!1);return h.jsxs(h.Fragment,{children:[h.jsxs(Mt,{children:[h.jsx(It,{children:"Chat Behavior"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Enable Streaming"}),h.jsx(yt,{children:"Stream responses in real-time as they are generated"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:t,onChange:r})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Save Chat History"}),h.jsx(yt,{children:"Automatically save conversations for future reference"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:i,onChange:n})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Show Timestamps"}),h.jsx(yt,{children:"Display timestamp for each message in the conversation"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:s,onChange:o})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Display"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Font Size"}),h.jsx(yt,{children:"Adjust the font size for chat messages"})]}),h.jsx(vt,{children:h.jsx(Si,{value:a,onChange:u=>l(u.target.value),disabled:!0,children:Y9.map(u=>h.jsx("option",{value:u.value,children:u.label},u.value))})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Compact Mode"}),h.jsx(yt,{children:"Reduce spacing between messages for a denser view"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:c,onChange:d,disabled:!0})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"History Management"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Clear Chat History"}),h.jsx(yt,{children:"Permanently delete all saved conversations"})]}),h.jsx(vt,{children:h.jsx(Et,{$variant:"danger",onClick:()=>{(window.acquireVsCodeApi?.()||{postMessage:()=>{}}).postMessage({command:"clear-history",message:""})},children:"Clear History"})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Export Conversations"}),h.jsx(yt,{children:"Download your chat history as a JSON file"})]}),h.jsx(vt,{children:h.jsx(Et,{disabled:!0,children:"Export"})})]})]})]})},nd=k(xn)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`,sd=k.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`,od=k.div`
  flex: 1;
`,ad=k.h4`
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 8px;
`,ld=k.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
`,Q9=k.div`
  display: flex;
  gap: 16px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`,cd=k.div`
  text-align: left;
`,hd=k.span`
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 2px;
`,dd=k.span`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
`,Z9=({searchQuery:e})=>{const{values:t,options:r,handlers:i}=Uc(),{selectedModel:n}=t,{modelOptions:s}=r,{onModelChange:o}=i,[a,l]=M.useState(!1),[c,d]=M.useState([]),[u,p]=M.useState([]),[f,g]=M.useState([]),[x,v]=M.useState({}),[y,b]=M.useState(!1),[w,S]=M.useState(null),[_,A]=M.useState(!1),[C,E]=M.useState(null),[P,z]=M.useState(!1),[D,V]=M.useState(null),[H,O]=M.useState(null);M.useEffect(()=>{i.postMessage({command:"docker-check-status"}),i.postMessage({command:"docker-check-ollama-status"}),i.postMessage({command:"docker-get-models"}),i.postMessage({command:"docker-get-local-model"});const F=setInterval(()=>{i.postMessage({command:"docker-check-status"}),i.postMessage({command:"docker-check-ollama-status"}),i.postMessage({command:"docker-get-models"}),i.postMessage({command:"docker-get-local-model"})},3e4);return()=>clearInterval(F)},[]),M.useEffect(()=>{const F=J=>{const W=J.data;switch(W.type){case"docker-status":l(W.available);break;case"docker-ollama-status":z(W.running);break;case"docker-runner-enabled":b(!1),l(W.success),W.success?(S(null),i.postMessage({command:"docker-get-models"})):W.error&&S(W.error);break;case"docker-compose-started":A(!1),z(W.success),W.success?E(null):W.error&&E(W.error);break;case"docker-models-list":W.models&&d(W.models.map(it=>it.name));break;case"docker-model-pulled":p(it=>it.filter(pt=>pt!==W.model)),W.success?(d(it=>[...it,W.model]),v(it=>{const pt={...it};return delete pt[W.model],pt})):v(it=>({...it,[W.model]:W.error||"Failed to pull model"}));break;case"docker-model-deleted":W.success?(d(it=>it.filter(pt=>!pt.includes(W.model)&&!W.model.includes(pt))),v(it=>{const pt={...it};return delete pt[W.model],pt})):W.error&&v(it=>({...it,[W.model]:W.error})),g(it=>it.filter(pt=>pt!==W.model));break;case"docker-local-model":V(W.model);break;case"docker-model-selected":O(null),W.success?(V(W.model),o("Local")):v(it=>({...it,[W.model]:W.error}));break}};return window.addEventListener("message",F),()=>window.removeEventListener("message",F)},[]);const R=()=>{b(!0),S(null),i.postMessage({command:"docker-enable-runner"})},T=()=>{A(!0),E(null),i.postMessage({command:"docker-start-compose"})},L=F=>{u.includes(F)||(p(J=>[...J,F]),i.postMessage({command:"docker-pull-ollama-model",message:F}))},$=F=>{u.includes(F)||(p(J=>[...J,F]),i.postMessage({command:"docker-pull-model",message:F}))},N=F=>{O(F),i.postMessage({command:"docker-use-model",message:F})},G=F=>{f.includes(F)||(g(J=>[...J,F]),i.postMessage({command:"docker-delete-model",message:F}))},Q=F=>{const J=F.replace(/^ai\//,"");return c.some(W=>{const it=W.replace(/^ai\//,"");return it===J||it.includes(J)||J.includes(it)})},Y=F=>{if(!D)return!1;const J=F.replace(/^ai\//,""),W=D.replace(/^ai\//,"");return J===W||J.includes(W)||W.includes(J)};return h.jsxs(h.Fragment,{children:[h.jsxs(Mt,{children:[h.jsx(It,{children:"AI Model Selection"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Primary Model"}),h.jsx(yt,{children:"Choose the AI model for code generation and chat responses"})]}),h.jsx(vt,{children:h.jsx(Si,{value:n,onChange:F=>o(F.target.value),children:s.map(F=>h.jsx("option",{value:F.value,children:F.label},F.value))})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Active Model"}),h.jsxs(nd,{children:[h.jsx(sd,{children:h.jsxs(od,{children:[h.jsxs(ad,{children:[s.find(F=>F.value===n)?.label||n,h.jsx(Se,{$variant:"success",children:"Active"})]}),h.jsx(ld,{children:"Currently configured as your primary AI model for all CodeBuddy interactions"})]})}),h.jsxs(Q9,{children:[h.jsxs(cd,{children:[h.jsx(hd,{children:"Context Window"}),h.jsx(dd,{children:"128K tokens"})]}),h.jsxs(cd,{children:[h.jsx(hd,{children:"Response Speed"}),h.jsx(dd,{children:"Fast"})]}),h.jsxs(cd,{children:[h.jsx(hd,{children:"Capabilities"}),h.jsx(dd,{children:"Code, Chat, Analysis"})]})]})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Local Models (Docker)"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Docker Model Runner"}),h.jsx(yt,{children:`Enable Docker Desktop's native Model Runner (Beta). For standard Ollama containers, select "Local" in the Primary Model dropdown above.`})]}),h.jsx(vt,{children:h.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"8px"},children:[h.jsx(Et,{onClick:R,disabled:a||y,style:{minWidth:"120px"},children:y?"Enabling...":a?"Enabled":"Enable"}),w&&h.jsxs("span",{style:{color:"#ef5350",fontSize:"12px",maxWidth:"200px",textAlign:"right"},children:["Error: ",w,". Ensure Docker Desktop 4.37+ is installed."]})]})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Local Ollama (Docker Compose)"}),h.jsx(yt,{children:"Start a standard Ollama container using Docker Compose. Uses port 11434."})]}),h.jsx(vt,{children:h.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"8px"},children:[h.jsx(Et,{onClick:T,disabled:P||_,style:{minWidth:"120px"},children:_?"Starting...":P?"Running":"Start Server"}),C&&h.jsxs("span",{style:{color:"#ef5350",fontSize:"12px",maxWidth:"200px",textAlign:"right"},children:["Error: ",C]})]})})]}),P&&!a&&h.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"12px",marginTop:"16px"},children:jg.map(F=>{const J=Q(F.value),W=u.includes(F.value),it=Y(F.value),pt=H===F.value;return h.jsxs(nd,{children:[h.jsxs(sd,{children:[h.jsxs(od,{children:[h.jsxs(ad,{children:[F.label,J&&h.jsx(Se,{$variant:"success",children:"Available"}),it&&h.jsx(Se,{$variant:"default",children:"Active"})]}),h.jsx(ld,{children:F.description})]}),h.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[h.jsx(Et,{onClick:()=>L(F.value),disabled:J||W,children:W?"Pulling...":J?"Pulled":"Pull"}),J&&!it&&h.jsx(Et,{onClick:()=>N(F.value),disabled:pt,style:{backgroundColor:"rgba(76, 175, 80, 0.1)",color:"#4caf50",border:"1px solid rgba(76, 175, 80, 0.5)"},children:pt?"Setting...":"Use"})]})]}),x[F.value]&&h.jsxs("div",{style:{color:"#ef5350",fontSize:"12px",marginTop:"8px",paddingLeft:"2px"},children:["Error: ",x[F.value]]})]},F.value)})}),a&&h.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"12px",marginTop:"16px"},children:jg.map(F=>{const J=Q(F.value),W=u.includes(F.value),it=f.includes(F.value),pt=Y(F.value),Dt=H===F.value;return h.jsxs(nd,{children:[h.jsxs(sd,{children:[h.jsxs(od,{children:[h.jsxs(ad,{children:[F.label,J&&h.jsx(Se,{$variant:"success",children:"Available"}),pt&&h.jsx(Se,{$variant:"default",children:"Active"})]}),h.jsx(ld,{children:F.description})]}),h.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px"},children:[h.jsx(Et,{onClick:()=>$(F.value),disabled:J||W||it,children:W?"Pulling...":J?"Pulled":"Pull"}),J&&!pt&&h.jsx(Et,{onClick:()=>N(F.value),disabled:Dt||it,style:{backgroundColor:"rgba(76, 175, 80, 0.1)",color:"#4caf50",border:"1px solid rgba(76, 175, 80, 0.5)"},children:Dt?"Setting...":"Use"}),J&&h.jsx(Et,{onClick:()=>G(F.value),disabled:it||pt,style:{backgroundColor:"rgba(211, 47, 47, 0.1)",color:"#ef5350",border:"1px solid rgba(239, 83, 80, 0.5)"},children:it?"Deleting...":"Delete"})]})]}),x[F.value]&&h.jsxs("div",{style:{color:"#ef5350",fontSize:"12px",marginTop:"8px",paddingLeft:"2px"},children:["Error: ",x[F.value]]})]},F.value)})})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"API Configuration"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"API Key"}),h.jsx(yt,{children:"Configure your API key for the selected model in VS Code settings"})]}),h.jsx(vt,{children:h.jsx(Et,{disabled:!0,children:"Configure in Settings"})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Custom Endpoint"}),h.jsx(yt,{children:"Use a custom API endpoint for self-hosted models"})]}),h.jsx(vt,{children:h.jsx(Et,{disabled:!0,children:"Configure"})})]})]})]})},J9=[{value:"4k",label:"4K tokens"},{value:"8k",label:"8K tokens"},{value:"16k",label:"16K tokens"},{value:"32k",label:"32K tokens"},{value:"128k",label:"128K tokens"}],K9=({searchQuery:e})=>{const[t,r]=M.useState(!1),[i,n]=M.useState("16k"),[s,o]=M.useState(!1),[a,l]=M.useState("1");return h.jsxs(h.Fragment,{children:[h.jsxs(Mt,{children:[h.jsx(It,{children:"Workspace Indexing"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Index Codebase"}),h.jsx(yt,{children:"Enable vector database indexing for semantic code search and better context understanding"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:t,onChange:r})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Indexing Status"}),h.jsx(yt,{children:"Current status of your workspace indexing"})]}),h.jsx(vt,{children:h.jsx(Se,{$variant:t?"success":"warning",children:t?"Indexed":"Not Indexed"})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Re-index Workspace"}),h.jsx(yt,{children:"Manually trigger a full re-index of your workspace"})]}),h.jsx(vt,{children:h.jsx(Et,{disabled:!t,children:"Re-index"})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Context Configuration"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Context Window Size"}),h.jsx(yt,{children:"Maximum amount of context sent with each request"})]}),h.jsx(vt,{children:h.jsx(Si,{value:i,onChange:c=>n(c.target.value),children:J9.map(c=>h.jsx("option",{value:c.value,children:c.label},c.value))})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Include Hidden Files"}),h.jsx(yt,{children:"Include files starting with . in context gathering"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:s,onChange:o})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Max File Size (MB)"}),h.jsx(yt,{children:"Skip files larger than this size when gathering context"})]}),h.jsx(vt,{children:h.jsx(Fk,{type:"number",value:a,onChange:c=>l(c.target.value),min:"0.1",max:"10",step:"0.1",style:{width:"80px"}})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"File Patterns"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Excluded Patterns"}),h.jsx(yt,{children:"Configure file patterns to exclude from context gathering (uses .gitignore patterns)"})]}),h.jsx(vt,{children:h.jsx(Et,{disabled:!0,children:"Configure"})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Priority Files"}),h.jsx(yt,{children:"Specify files that should always be included in context"})]}),h.jsx(vt,{children:h.jsx(Et,{disabled:!0,children:"Configure"})})]})]})]})},Du=k.div`
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`,N0=k.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`,z0=k.div`
  flex: 1;
`,H0=k.h4`
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
`,q0=k.p`
  margin: 0;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
`,tz=k.div`
  display: flex;
  align-items: center;
  gap: 8px;
`,W0=k.pre`
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border);
  border-radius: 4px;
  padding: 12px;
  margin: 12px 0 0 0;
  font-size: 12px;
  font-family: var(--vscode-editor-font-family);
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--vscode-input-foreground);
  max-height: 150px;
  overflow-y: auto;
`,ez=k(Du)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
`,rz=k.div`
  flex: 1;
`,iz=k.h4`
  margin: 0 0 2px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vscode-foreground);
`,nz=k.p`
  margin: 0;
  font-size: 12px;
  color: var(--vscode-descriptionForeground);
`,sz=k.span`
  display: inline-block;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  margin-top: 6px;
`,ud=k.textarea`
  width: 100%;
  min-height: 150px;
  padding: 12px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 6px;
  font-family: var(--vscode-editor-font-family);
  font-size: 13px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }
  
  &::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
`,qa=k.input`
  width: 100%;
  padding: 8px 12px;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 6px;
  font-size: 13px;
  
  &:focus {
    outline: none;
    border-color: var(--vscode-focusBorder);
  }
  
  &::placeholder {
    color: var(--vscode-input-placeholderForeground);
  }
`,Vi=k.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`,Ui=k.label`
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vscode-foreground);
`,pd=k.div`
  display: ${e=>e.$isOpen?"flex":"none"};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  z-index: 1000;
`,fd=k.div`
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
`,gd=k.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`,md=k.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`,xd=k.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`,oz=k.div`
  margin-top: 16px;
`,oo=k.button`
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--vscode-descriptionForeground);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: var(--vscode-toolbar-hoverBackground);
    color: var(--vscode-foreground);
  }
`,az=({searchQuery:e})=>{const{values:t,handlers:r}=Uc(),[i,n]=M.useState(!1),[s,o]=M.useState(!1),[a,l]=M.useState(null),[c,d]=M.useState(!1),[u,p]=M.useState(""),[f,g]=M.useState({name:"",description:"",content:"",enabled:!0});M.useEffect(()=>{r.postMessage({command:"rules-get-all"}),r.postMessage({command:"subagents-get-all"})},[]);const x=()=>{f.name&&f.content&&(r.onAddRule(f),r.postMessage({command:"rules-add",message:f}),g({name:"",description:"",content:"",enabled:!0}),n(!1))},v=()=>{a&&a.name&&a.content&&(r.onUpdateRule(a.id,a),r.postMessage({command:"rules-update",message:{id:a.id,updates:a}}),l(null),o(!1))},y=C=>{r.onDeleteRule(C),r.postMessage({command:"rules-delete",message:{id:C}})},b=(C,E)=>{r.onToggleRule(C,E),r.postMessage({command:"rules-toggle",message:{id:C,enabled:E}})},w=(C,E)=>{r.onToggleSubagent(C,E),r.postMessage({command:"subagents-toggle",message:{id:C,enabled:E}})},S=()=>{r.onUpdateSystemPrompt(u),r.postMessage({command:"system-prompt-update",message:{prompt:u}}),d(!1)},_=()=>{p(t.customSystemPrompt||""),d(!0)},A=C=>{l({...C}),o(!0)};return h.jsxs(h.Fragment,{children:[h.jsxs(Mt,{children:[h.jsx(It,{children:"Custom Rules"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Project Rules"}),h.jsx(yt,{children:"Define custom rules for code generation and suggestions tailored to your project. Rules are appended to the agent's system prompt."})]}),h.jsx(vt,{children:h.jsx(Et,{$variant:"primary",onClick:()=>n(!0),children:h.jsxs("span",{style:{display:"flex",alignItems:"center",gap:"6px"},children:[h.jsx(Re,{name:"plus",size:14}),"Add Rule"]})})})]}),t.customRules.length===0?h.jsxs(Pk,{children:[h.jsx(Nk,{children:h.jsx(Re,{name:"book",size:48})}),h.jsx(zk,{children:"No Custom Rules"}),h.jsx(Hk,{children:"Create custom rules to guide how CodeBuddy generates code for your project. Rules can specify coding conventions, patterns, and best practices."})]}):h.jsx(oz,{children:t.customRules.map(C=>h.jsxs(Du,{children:[h.jsxs(N0,{children:[h.jsxs(z0,{children:[h.jsx(H0,{children:C.name}),C.description&&h.jsx(q0,{children:C.description})]}),h.jsxs(tz,{children:[h.jsx(ne,{checked:C.enabled,onChange:E=>b(C.id,E)}),h.jsx(oo,{onClick:()=>A(C),title:"Edit rule",children:h.jsx(Re,{name:"edit",size:14})}),h.jsx(oo,{onClick:()=>y(C.id),title:"Delete rule",children:h.jsx(Re,{name:"trash",size:14})})]})]}),h.jsx(W0,{children:C.content})]},C.id))})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Subagents"}),h.jsxs(xn,{children:[h.jsx(Xo,{children:h.jsx(Qo,{children:"Specialized Subagents"})}),h.jsx(Zo,{children:"Subagents are specialized AI agents that can be delegated complex subtasks. Each subagent has access to specific tools relevant to their role."})]}),h.jsx("div",{style:{marginTop:"16px"},children:t.subagents.map(C=>h.jsxs(ez,{children:[h.jsxs(rz,{children:[h.jsx(iz,{children:C.name}),h.jsx(nz,{children:C.description}),h.jsx(sz,{children:C.toolPatterns.includes("*")?"All tools":`${C.toolPatterns.length} tool patterns`})]}),h.jsx(ne,{checked:C.enabled,onChange:E=>w(C.id,E)})]},C.id))})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"System Prompt"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Custom System Prompt"}),h.jsx(yt,{children:"Add additional instructions to the base system prompt. This is appended after the default prompt and before any custom rules."})]}),h.jsx(vt,{children:h.jsxs(Et,{onClick:_,children:[t.customSystemPrompt?"Edit":"Add"," Prompt"]})})]}),t.customSystemPrompt&&h.jsxs(Du,{style:{marginTop:"12px"},children:[h.jsx(N0,{children:h.jsxs(z0,{children:[h.jsx(H0,{children:"Custom Instructions"}),h.jsxs(q0,{children:[t.customSystemPrompt.length," characters"]})]})}),h.jsx(W0,{children:t.customSystemPrompt})]})]}),h.jsx(pd,{$isOpen:i,children:h.jsxs(fd,{children:[h.jsxs(gd,{children:[h.jsx(md,{children:"Add Custom Rule"}),h.jsx(oo,{onClick:()=>n(!1),children:h.jsx(Re,{name:"close",size:18})})]}),h.jsxs(Vi,{children:[h.jsx(Ui,{children:"Rule Name *"}),h.jsx(qa,{placeholder:"e.g., TypeScript Strict Mode",value:f.name,onChange:C=>g({...f,name:C.target.value})})]}),h.jsxs(Vi,{children:[h.jsx(Ui,{children:"Description"}),h.jsx(qa,{placeholder:"Brief description of what this rule does",value:f.description,onChange:C=>g({...f,description:C.target.value})})]}),h.jsxs(Vi,{children:[h.jsx(Ui,{children:"Rule Content *"}),h.jsx(ud,{placeholder:`Enter the rule instructions...

Example:
- Always use TypeScript strict mode
- Prefer functional components over class components
- Use async/await instead of .then() chains`,value:f.content,onChange:C=>g({...f,content:C.target.value})})]}),h.jsxs(xd,{children:[h.jsx(Et,{onClick:()=>n(!1),children:"Cancel"}),h.jsx(Et,{$variant:"primary",onClick:x,disabled:!f.name||!f.content,children:"Add Rule"})]})]})}),h.jsx(pd,{$isOpen:s,children:h.jsxs(fd,{children:[h.jsxs(gd,{children:[h.jsx(md,{children:"Edit Rule"}),h.jsx(oo,{onClick:()=>o(!1),children:h.jsx(Re,{name:"close",size:18})})]}),a&&h.jsxs(h.Fragment,{children:[h.jsxs(Vi,{children:[h.jsx(Ui,{children:"Rule Name *"}),h.jsx(qa,{value:a.name,onChange:C=>l({...a,name:C.target.value})})]}),h.jsxs(Vi,{children:[h.jsx(Ui,{children:"Description"}),h.jsx(qa,{value:a.description,onChange:C=>l({...a,description:C.target.value})})]}),h.jsxs(Vi,{children:[h.jsx(Ui,{children:"Rule Content *"}),h.jsx(ud,{value:a.content,onChange:C=>l({...a,content:C.target.value})})]})]}),h.jsxs(xd,{children:[h.jsx(Et,{onClick:()=>o(!1),children:"Cancel"}),h.jsx(Et,{$variant:"primary",onClick:v,disabled:!a?.name||!a?.content,children:"Save Changes"})]})]})}),h.jsx(pd,{$isOpen:c,children:h.jsxs(fd,{children:[h.jsxs(gd,{children:[h.jsx(md,{children:"Custom System Prompt"}),h.jsx(oo,{onClick:()=>d(!1),children:h.jsx(Re,{name:"close",size:18})})]}),h.jsxs(Vi,{children:[h.jsx(Ui,{children:"Additional Instructions"}),h.jsx(ud,{placeholder:`Add custom instructions that will be appended to the system prompt...

Example:
- You are a senior developer at a fintech company
- Always consider security implications
- Follow our internal coding guidelines`,value:u,onChange:C=>p(C.target.value),style:{minHeight:"200px"}})]}),h.jsxs(xd,{children:[h.jsx(Et,{onClick:()=>d(!1),children:"Cancel"}),h.jsx(Et,{$variant:"primary",onClick:S,children:"Save"})]})]})})]})},lz=({searchQuery:e})=>{const[t,r]=M.useState(!1),[i,n]=M.useState(!0),[s,o]=M.useState(!1);return h.jsxs(h.Fragment,{children:[h.jsxs(Mt,{children:[h.jsx(It,{children:"Data Collection"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Anonymous Telemetry"}),h.jsx(yt,{children:"Help improve CodeBuddy by sharing anonymous usage data"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:t,onChange:r,disabled:!0})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Error Reporting"}),h.jsx(yt,{children:"Automatically send crash reports to help us fix bugs"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:i,onChange:n,disabled:!0})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Usage Statistics"}),h.jsx(yt,{children:"Share feature usage patterns to help prioritize development"})]}),h.jsx(vt,{children:h.jsx(ne,{checked:s,onChange:o,disabled:!0})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Local Data"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Clear Chat History"}),h.jsx(yt,{children:"Permanently delete all saved conversations from local storage"})]}),h.jsx(vt,{children:h.jsx(Et,{$variant:"danger",onClick:()=>{(window.acquireVsCodeApi?.()||{postMessage:()=>{}}).postMessage({command:"clear-history",message:""})},children:"Clear History"})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Clear Cache"}),h.jsx(yt,{children:"Clear cached data including indexed files and embeddings"})]}),h.jsx(vt,{children:h.jsx(Et,{$variant:"danger",disabled:!0,children:"Clear Cache"})})]}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Clear All Data"}),h.jsx(yt,{children:"Remove all CodeBuddy data including settings, history, and cache"})]}),h.jsx(vt,{children:h.jsx(Et,{$variant:"danger",disabled:!0,children:"Clear All"})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Privacy Policy"}),h.jsxs(xn,{children:[h.jsx(Xo,{children:h.jsx(Qo,{children:"How We Handle Your Data"})}),h.jsx(Zo,{children:"CodeBuddy processes your code locally and only sends queries to AI providers when you interact with the chat. We don't store your code on any external servers. Your API keys are stored securely in VS Code's secret storage."}),h.jsx("div",{style:{marginTop:"12px"},children:h.jsx(Et,{disabled:!0,children:"View Privacy Policy"})})]})]})]})},cz=k.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba(234, 179, 8, 0.1);
  border: 1px solid rgba(234, 179, 8, 0.2);
  border-radius: 8px;
  margin-bottom: 24px;
`,hz=k.div`
  color: #eab308;
  flex-shrink: 0;
`,dz=k.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
`,bd=k(xn)`
  display: flex;
  align-items: flex-start;
  gap: 16px;
`,yd=k.div`
  flex: 1;
`,vd=k.h4`
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  gap: 8px;
`,wd=k.p`
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
`,uz=({searchQuery:e})=>{const[t,r]=M.useState(!1),[i,n]=M.useState(!1),[s,o]=M.useState(!1);return h.jsxs(h.Fragment,{children:[h.jsxs(cz,{children:[h.jsx(hz,{children:h.jsxs("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("path",{d:"M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"}),h.jsx("line",{x1:"12",y1:"9",x2:"12",y2:"13"}),h.jsx("line",{x1:"12",y1:"17",x2:"12.01",y2:"17"})]})}),h.jsxs(dz,{children:[h.jsx("strong",{children:"Beta Features Warning:"})," These features are experimental and may be unstable. They might change or be removed in future updates. Use at your own risk."]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Experimental Features"}),h.jsxs(bd,{children:[h.jsxs(yd,{children:[h.jsxs(vd,{children:["Experimental UI Components",h.jsx(Se,{$variant:"warning",children:"Beta"})]}),h.jsx(wd,{children:"Enable new UI components and interactions that are still being tested. May contain visual glitches or unexpected behavior."})]}),h.jsx(ne,{checked:t,onChange:r,disabled:!0})]}),h.jsxs(bd,{children:[h.jsxs(yd,{children:[h.jsxs(vd,{children:["Advanced Agent Capabilities",h.jsx(Se,{$variant:"warning",children:"Beta"})]}),h.jsx(wd,{children:"Enable advanced agent features like multi-step task planning, autonomous file management, and complex refactoring."})]}),h.jsx(ne,{checked:i,onChange:n,disabled:!0})]}),h.jsxs(bd,{children:[h.jsxs(yd,{children:[h.jsxs(vd,{children:["Multi-Model Orchestration",h.jsx(Se,{$variant:"warning",children:"Beta"})]}),h.jsx(wd,{children:"Use multiple AI models simultaneously for different tasks. Route queries to the best model based on the task type."})]}),h.jsx(ne,{checked:s,onChange:o,disabled:!0})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Beta Program"}),h.jsxs(xn,{children:[h.jsx(Xo,{children:h.jsx(Qo,{children:"Join the Beta Program"})}),h.jsx(Zo,{children:"Get early access to new features and help shape the future of CodeBuddy. Beta testers receive new features first and have direct access to the development team."}),h.jsx("div",{style:{marginTop:"12px"},children:h.jsx(Se,{$variant:"success",children:"You're in the Beta!"})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Feedback"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Report Beta Issues"}),h.jsx(yt,{children:"Found a bug or have feedback about beta features? Let us know!"})]}),h.jsx(vt,{children:h.jsx("a",{href:"https://github.com/codebuddy/codebuddy/issues",target:"_blank",rel:"noopener noreferrer",style:{textDecoration:"none"},children:h.jsx(Se,{children:"Report Issue"})})})]})]})]})},pz=k.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 24px;
`,fz=k.div`
  width: 72px;
  height: 72px;
  border-radius: 16px;
  background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  color: white;
`,gz=k.div`
  flex: 1;
`,mz=k.h2`
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.95);
`,xz=k.p`
  margin: 0 0 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
`,bz=k.p`
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.5;
`,yz=k.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`,Wa=k.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.12);
  }

  svg {
    color: rgba(255, 255, 255, 0.5);
  }
`,vz=({searchQuery:e})=>h.jsxs(h.Fragment,{children:[h.jsxs(pz,{children:[h.jsx(fz,{children:"CB"}),h.jsxs(gz,{children:[h.jsx(mz,{children:"CodeBuddy"}),h.jsxs(xz,{children:["Version 1.0.0 ",h.jsx(Se,{children:"Latest"})]}),h.jsx(bz,{children:"Your AI-powered coding companion. Write better code, faster."})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Resources"}),h.jsxs(yz,{children:[h.jsxs(Wa,{href:"https://github.com/codebuddy/codebuddy",target:"_blank",rel:"noopener noreferrer",children:[h.jsx("span",{children:"GitHub Repository"}),h.jsx(Re,{name:"externalLink",size:16})]}),h.jsxs(Wa,{href:"https://codebuddy.dev/docs",target:"_blank",rel:"noopener noreferrer",children:[h.jsx("span",{children:"Documentation"}),h.jsx(Re,{name:"externalLink",size:16})]}),h.jsxs(Wa,{href:"https://codebuddy.dev/changelog",target:"_blank",rel:"noopener noreferrer",children:[h.jsx("span",{children:"Changelog"}),h.jsx(Re,{name:"externalLink",size:16})]}),h.jsxs(Wa,{href:"https://github.com/codebuddy/codebuddy/issues",target:"_blank",rel:"noopener noreferrer",children:[h.jsx("span",{children:"Report an Issue"}),h.jsx(Re,{name:"externalLink",size:16})]})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Updates"}),h.jsxs(mt,{children:[h.jsxs(xt,{children:[h.jsx(bt,{children:"Check for Updates"}),h.jsx(yt,{children:"You're running the latest version of CodeBuddy"})]}),h.jsx(vt,{children:h.jsx(Et,{disabled:!0,children:"Check Now"})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"License"}),h.jsxs(xn,{children:[h.jsx(Xo,{children:h.jsx(Qo,{children:"MIT License"})}),h.jsx(Zo,{children:"CodeBuddy is open source software licensed under the MIT License. You're free to use, modify, and distribute this software according to the license terms."}),h.jsx("div",{style:{marginTop:"12px"},children:h.jsxs(y9,{disabled:!0,children:["View Full License",h.jsx(Re,{name:"externalLink",size:14})]})})]})]}),h.jsxs(Mt,{children:[h.jsx(It,{children:"Credits"}),h.jsxs(xn,{children:[h.jsx(Xo,{children:h.jsx(Qo,{children:"Built with ❤️"})}),h.jsxs(Zo,{children:["CodeBuddy is built using React, TypeScript, VS Code Extension API, and powered by leading AI models including Google Gemini, Anthropic Claude, and Groq.",h.jsx("br",{}),h.jsx("br",{}),"Special thanks to all contributors and the open source community."]})]})]})]}),wz=k.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #1a1a24;
`,kz=k.div`
  padding: 24px 32px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`,Cz=k.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
`,Sz=k.p`
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
`,_z=k.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
`,Tz={account:T9,general:j9,agents:L9,mcp:G9,conversation:X9,models:Z9,context:K9,rules:az,privacy:lz,beta:uz,about:vz},$z=({activeCategory:e,searchQuery:t})=>{const r=Dk.find(n=>n.id===e),i=Tz[e];return h.jsxs(wz,{children:[h.jsxs(kz,{children:[h.jsx(Cz,{children:r?.label||"Settings"}),r?.description&&h.jsx(Sz,{children:r.description})]}),h.jsx(_z,{children:h.jsx(i,{searchQuery:t})})]})},Az=k.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${e=>e.$isOpen?1:0};
  visibility: ${e=>e.$isOpen?"visible":"hidden"};
  transition: opacity 0.2s ease, visibility 0.2s ease;
  z-index: 999;
`,jz=k.div`
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  max-width: 900px;
  background: #1a1a24;
  transform: translateX(${e=>e.$isOpen?"0":"-100%"});
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
`,Ez=k.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #16161e;
`,Lz=k.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`,Bz=k.button`
  background: transparent;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`,Mz=k.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`,Iz=({isOpen:e,onClose:t,username:r="User",avatarUrl:i,accountType:n="Free",settingsValues:s,settingsOptions:o,settingsHandlers:a})=>{const[l,c]=Mr.useState("general"),[d,u]=Mr.useState(""),p={theme:"tokyo night",language:"en",keymap:"default",nickname:r,codeBuddyMode:"Agent",enableStreaming:!0,selectedModel:"Gemini",username:r,accountType:n,customRules:[],customSystemPrompt:"",subagents:pf},f={themeOptions:[],modelOptions:[],codeBuddyModeOptions:[],keymapOptions:[],languageOptions:[]},g={onThemeChange:()=>{},onLanguageChange:()=>{},onKeymapChange:()=>{},onNicknameChange:()=>{},onCodeBuddyModeChange:()=>{},onStreamingChange:()=>{},onModelChange:()=>{},onUsernameChange:()=>{},postMessage:()=>{},onAddRule:()=>{},onUpdateRule:()=>{},onDeleteRule:()=>{},onToggleRule:()=>{},onUpdateSystemPrompt:()=>{},onToggleSubagent:()=>{}},x=s||p,v=o||f,y=a||g;M.useEffect(()=>{const S=_=>{_.key==="Escape"&&e&&t()};return document.addEventListener("keydown",S),()=>document.removeEventListener("keydown",S)},[e,t]),M.useEffect(()=>(e?document.body.style.overflow="hidden":document.body.style.overflow="",()=>{document.body.style.overflow=""}),[e]);const b=M.useCallback(S=>{c(S)},[]),w=M.useCallback(S=>{u(S)},[]);return h.jsxs(h.Fragment,{children:[h.jsx(Az,{$isOpen:e,onClick:t}),h.jsx(jz,{$isOpen:e,role:"dialog","aria-modal":"true","aria-label":"Settings",children:h.jsxs(A9,{values:x,options:v,handlers:y,children:[h.jsxs(Ez,{children:[h.jsx(Lz,{children:"Settings"}),h.jsx(Bz,{onClick:t,"aria-label":"Close settings",children:h.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[h.jsx("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),h.jsx("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})})]}),h.jsxs(Mz,{children:[h.jsx(g9,{username:r,avatarUrl:i,accountType:n,activeCategory:l,onCategoryChange:b,searchQuery:d,onSearchChange:w}),h.jsx($z,{activeCategory:l,searchQuery:d})]})]})})]})},Gc=Cr`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`,Oz=k.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
  animation: ${Gc} 0.6s ease-out;
`,Rz=k.h1`
  font-size: 28px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 8px 0;
  animation: ${Gc} 0.6s ease-out 0.1s both;
  letter-spacing: -0.5px;
`,Dz=k.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0 0 48px 0;
  animation: ${Gc} 0.6s ease-out 0.2s both;
  text-align: center;
  max-width: 380px;
  line-height: 1.6;
`,Fz=k.div`
  max-width: 480px;
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 24px;
  animation: ${Gc} 0.6s ease-out 0.4s both;
`,Pz=k.div`
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
`,Nz=k.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`,Va=k.div`
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  transition: all 0.2s ease;
  text-align: left;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
    transform: translateX(4px);
  }
    
`,zz=({username:e})=>{const[t,r]=M.useState(""),i=e?`Welcome back, ${e}`:"Welcome to CodeBuddy";return M.useEffect(()=>{let n=0;const s=setInterval(()=>{n<=i.length?(r(i.slice(0,n)),n++):clearInterval(s)},40);return()=>clearInterval(s)},[i]),h.jsxs(Oz,{children:[h.jsx(Rz,{children:t}),h.jsx(Dz,{children:"Your AI coding assistant ready to help you build better software"}),h.jsxs(Fz,{children:[h.jsx(Pz,{children:"Quick Tips"}),h.jsxs(Nz,{children:[h.jsx(Va,{children:"Check out the FAQ and SETTINGS section to configure your AI assistant"}),h.jsx(Va,{children:"Select code in editor to ask questions about it"}),h.jsx(Va,{children:"Use context selector to include multiple files"}),h.jsx(Va,{children:"Switch modes for different assistance types"})]})]})]})},Hz=k.button`
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 100;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.95);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
`,qz=window.hljs,sr=typeof window<"u"&&"acquireVsCodeApi"in window?window.acquireVsCodeApi():{postMessage:e=>{console.log("Message to VS Code:",e)}},Wz=()=>{const[e,t]=M.useState("tokyo night"),[r,i]=M.useState("Gemini"),[n,s]=M.useState("Agent"),[o,a]=M.useState(""),[l,c]=M.useState(""),[d,u]=M.useState(!1),[p,f]=M.useState("tab-1"),[g,x]=M.useState(""),[v,y]=M.useState(""),[b,w]=M.useState(""),[S,_]=M.useState(""),[A,C]=M.useState(!1),[E,P]=M.useState(!0),[z,D]=M.useState(!1),[V,H]=M.useState([]),[O,R]=M.useState(""),[T,L]=M.useState(pf),{messages:$,activities:N,isStreaming:G,isLoading:Q,sendMessage:Y,clearMessages:F,setMessages:J,pendingApproval:W}=ZT(sr,{enableStreaming:E,onLegacyMessage:K=>{console.log("Legacy message received:",K)}}),it=M.useMemo(()=>a$(e),[e]),pt=M.useCallback(K=>{const St=K.data,Ie=St.command||St.type;if(Ie==="onStreamEnd"||Ie==="onStreamError"){u(!1),a(""),c("");return}if(!(St.command?.includes("stream")||St.type?.includes("stream")))switch(Ie){case"codebuddy-commands":console.log("Command feedback received:",St.message),u(!0),typeof St.message=="object"&&St.message.action&&St.message.description?(a(St.message.action),c(St.message.description)):(a(St.message||"Processing request"),c("CodeBuddy is analyzing your code and generating a response..."));break;case"bootstrap":y(St);break;case"chat-history":try{const Ni=JSON.parse(St.message).map(ir=>({id:`history-${Date.now()}-${Math.random()}`,type:ir.type,content:ir.content,language:ir.language,alias:ir.alias,timestamp:Date.now()}));J(ir=>[...Ni,...ir])}catch(Ft){console.error("Error parsing chat history:",Ft)}break;case"error":console.error("Extension error",St.payload),u(!1),a(""),c("");break;case"bot-response":u(!1),a(""),c("");break;case"onActiveworkspaceUpdate":w(St.message??"");break;case"onConfigurationChange":{const Ft=JSON.parse(St.message);Ft.enableStreaming!==void 0&&P(Ft.enableStreaming);break}case"onGetUserPreferences":{const Ft=JSON.parse(St.message);Ft.username&&_(Ft.username),Ft.theme&&t(Ft.theme),Ft.enableStreaming!==void 0&&P(Ft.enableStreaming);break}case"theme-settings":St.theme&&t(St.theme);break;case"rules-data":St.data&&(St.data.rules&&H(St.data.rules),St.data.systemPrompt!==void 0&&R(St.data.systemPrompt),St.data.subagents&&L(St.data.subagents));break;case"rule-added":St.data?.rule&&H(Ft=>[...Ft,St.data.rule]);break}},[J]);M.useEffect(()=>{l$(it)},[it]),M.useEffect(()=>(window.addEventListener("message",pt),()=>{window.removeEventListener("message",pt)}),[pt]),M.useEffect(()=>{sr.postMessage({command:"webview-ready"})},[]),M.useEffect(()=>{h$(qz,$)},[$]),M.useEffect(()=>{!G&&!Q&&(u(!1),a(""),c(""))},[G,Q]);const Dt=M.useCallback(()=>{F()},[F]),Zt=M.useCallback(()=>{sr.postMessage({command:"index-workspace"})},[]),Wt=M.useCallback(()=>{sr.postMessage({command:"update-user-info",message:JSON.stringify({username:S})})},[S]),ge=M.useCallback(K=>{x(K)},[]),le=M.useCallback(K=>{C(K),document.body.classList.toggle("dark-mode",K)},[]),rr=M.useCallback(K=>{K.trim()&&Y(K,{mode:n||"Agent",context:g.split("@"),alias:"O"})},[Y,n,g]),$n=M.useCallback(()=>{sr.postMessage({command:"upload-file",message:""})},[]),Zr=M.useCallback(()=>{sr.postMessage({command:"user-consent",message:"granted"})},[]),Fs=M.useMemo(()=>Array.from(new Set(g.split("@").join(", ").split(", "))).filter(St=>St.length>1),[g]),Ps=M.useMemo(()=>$.map(K=>K.type==="bot"?h.jsx(UN,{content:K.content,language:K.language,isStreaming:K.isStreaming},K.id):h.jsx(GN,{message:K.content,alias:K.alias},K.id)),[$]),bi=M.useMemo(()=>({theme:e,language:"en",keymap:"default",nickname:S,codeBuddyMode:n,enableStreaming:E,selectedModel:r,username:S,accountType:"Free",customRules:V,customSystemPrompt:O,subagents:T}),[e,S,n,E,r,V,O,T]),An=M.useMemo(()=>({themeOptions:Ag,modelOptions:Tg,codeBuddyModeOptions:$g,keymapOptions:uf,languageOptions:df}),[]),jn=M.useMemo(()=>({onThemeChange:K=>{t(K),sr.postMessage({command:"theme-change-event",message:K})},onLanguageChange:K=>{},onKeymapChange:K=>{},onNicknameChange:K=>{_(K)},onCodeBuddyModeChange:K=>{s(K),sr.postMessage({command:"codebuddy-model-change-event",message:K})},onStreamingChange:K=>{P(K)},onModelChange:K=>{i(K),sr.postMessage({command:"update-model-event",message:K})},onUsernameChange:K=>{_(K)},postMessage:K=>{sr.postMessage(K)},onAddRule:K=>{const St={...K,id:`rule-${Date.now()}`,createdAt:Date.now()};H(Ie=>[...Ie,St])},onUpdateRule:(K,St)=>{H(Ie=>Ie.map(Ft=>Ft.id===K?{...Ft,...St}:Ft))},onDeleteRule:K=>{H(St=>St.filter(Ie=>Ie.id!==K))},onToggleRule:(K,St)=>{H(Ie=>Ie.map(Ft=>Ft.id===K?{...Ft,enabled:St}:Ft))},onUpdateSystemPrompt:K=>{R(K)},onToggleSubagent:(K,St)=>{L(Ie=>Ie.map(Ft=>Ft.id===K?{...Ft,enabled:St}:Ft))}}),[]);return h.jsxs("div",{style:{overflow:"hidden",width:"100%"},children:[h.jsx(Hz,{onClick:()=>D(!0),"aria-label":"Open settings",title:"Settings",children:h.jsx(ZN,{size:18})}),h.jsx(Iz,{isOpen:z,onClose:()=>D(!1),username:S||"CodeBuddy User",accountType:"Free",settingsValues:bi,settingsOptions:An,settingsHandlers:jn}),h.jsxs(X_,{className:"vscodePanels",activeid:p,children:[h.jsx(Gs,{id:"tab-1",onClick:()=>f("tab-1"),children:"CHAT"}),h.jsx(Gs,{id:"tab-2",onClick:()=>f("tab-2"),children:"SETTINGS"}),h.jsx(Gs,{id:"tab-3",onClick:()=>f("tab-3"),children:"EXTENSIONS"}),h.jsx(Gs,{id:"tab-4",onClick:()=>f("tab-4"),children:"FAQ"}),h.jsx(Gs,{id:"tab-5",onClick:()=>f("tab-5"),children:"FUTURE"}),h.jsx(qi,{id:"view-1",style:{height:"calc(100vh - 55px)",position:"relative"},children:h.jsx("div",{className:"chat-content",style:{maxWidth:"1100px",margin:"0 auto"},children:h.jsx("div",{className:"dropdown-container",children:h.jsx("div",{children:$.length===0&&!Q&&!d?h.jsx(zz,{username:S,onGetStarted:()=>{console.log("User is ready to start!")}}):h.jsxs(h.Fragment,{children:[Ps,(G||Q)&&N.length>0&&h.jsx(s8,{activities:N,isActive:G||Q}),d&&h.jsx(m8,{commandAction:o,commandDescription:l}),Q&&!d&&!G&&N.length===0&&h.jsx(Ok,{})]})})})})}),h.jsx(qi,{id:"view-2",children:h.jsx(QN,{username:S,selectedTheme:e,selectedModel:r,selectedCodeBuddyMode:n,enableStreaming:E,darkMode:A,themeOptions:Ag,modelOptions:Tg,codeBuddyMode:$g,onUsernameChange:_,onThemeChange:K=>{t(K),sr.postMessage({command:"theme-change-event",message:K})},onModelChange:K=>{i(K),sr.postMessage({command:"update-model-event",message:K})},onCodeBuddyModeChange:K=>{s(K),sr.postMessage({command:"codebuddy-model-change-event",message:K})},onStreamingChange:P,onDarkModeChange:le,onClearHistory:Dt,onIndexWorkspace:Zt,onSavePreferences:Wt})}),h.jsx(qi,{id:"view-3",children:h.jsx(F8,{onAddMCPServer:K=>console.log("Add server:",K),onAddAgent:K=>console.log("Add agent:",K)})}),h.jsx(qi,{id:"view-4",children:h.jsx("div",{children:h.jsx(qi,{id:"view-4",children:h.jsx("div",{children:h.jsx(qi,{id:"view-4",children:h.jsx("div",{children:h.jsx(m$,{items:QT})})})})})})}),h.jsx(qi,{id:"view-5",children:h.jsx(tN,{})})]}),h.jsxs("div",{className:"business",style:{position:"absolute",left:0,right:0,padding:"10px",backgroundColor:"#16161e"},children:[h.jsxs("div",{className:"textarea-container",children:[h.jsx("div",{className:"horizontal-stack",children:h.jsx("span",{children:g.length>1?h.jsxs(h.Fragment,{children:[h.jsx("small",{children:"Context: "}),h.jsx("small",{children:Fs.map(K=>h.jsx("span",{className:"attachment-icon",children:K},K))})]}):h.jsx(h.Fragment,{})})}),h.jsx("div",{className:"horizontal-stack",children:h.jsxs("span",{className:"currenFile",children:[h.jsx("small",{children:"Active workspace: "}),h.jsx("small",{className:"attachment-icon",children:b})]})}),h.jsx(j8,{activeEditor:b,onInputChange:ge,folders:v}),W&&h.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",border:"1px solid #2a2a36",borderRadius:"10px",background:"#1e1e2a",marginBottom:"8px"},children:[h.jsx("div",{style:{color:"#d0d0dc",fontSize:"13px",marginRight:"12px"},children:`Approve ${W.toolName||"tool"} to proceed — ${W.description||`Preparing to run ${W.toolName||"tool"}`}`}),h.jsx(Y_,{appearance:"primary",onClick:Zr,children:"Approve action"})]}),h.jsx(a8,{onSendMessage:rr,disabled:G||Q})]}),h.jsx("div",{className:"horizontal-stack",children:h.jsx(o8,{onClick:$n,disabled:!0})})]})]})};function Vz(){return h.jsx(Wz,{})}function Uz({error:e,onDismiss:t}){return e?h.jsxs("div",{className:"inline-error-banner",children:[h.jsxs("span",{children:["⚠️ ",e.message]}),h.jsx("button",{onClick:t,children:"Dismiss"})]}):null}class Gz extends Mr.Component{constructor(r){super(r);qt(this,"handleDismissError",()=>{this.setState({error:null,errorInfo:null})});this.state={error:null,errorInfo:null}}static getDerivedStateFromError(r){return{error:r}}componentDidCatch(r,i){console.error("Error caught by boundary:",r),console.error("Error Info:",i),this.setState({error:r,errorInfo:i})}render(){const{error:r}=this.state,{children:i}=this.props;return h.jsxs(h.Fragment,{children:[i,h.jsx(Uz,{error:r,onDismiss:this.handleDismissError})]})}}const Yz=M.createContext({}),Xz=({children:e})=>{const t=typeof window<"u"&&"acquireVsCodeApi"in window?window.acquireVsCodeApi:{postMessage:r=>{console.log("Message to VS Code:",r)}};return h.jsx(Yz.Provider,{value:t,children:e})};iC.createRoot(document.getElementById("root")).render(h.jsx(M.StrictMode,{children:h.jsx(Xz,{children:h.jsx(Gz,{children:h.jsx(Vz,{})})})}));export{ut as $,So as A,W$ as B,Tb as C,qp as D,Te as E,wO as F,WA as G,CB as H,Pg as I,jM as J,sA as K,xs as L,x7 as M,SA as N,lp as O,Ic as P,qg as Q,fB as R,ll as S,vO as T,oa as U,Ob as V,BA as W,sa as X,nt as Y,uO as Z,m as _,de as a,mp as a$,hB as a0,cm as a1,lm as a2,A7 as a3,C7 as a4,T7 as a5,_7 as a6,w7 as a7,wp as a8,$7 as a9,lO as aA,t3 as aB,eO as aC,Ip as aD,l0 as aE,OR as aF,dB as aG,m7 as aH,BR as aI,MR as aJ,pa as aK,xp as aL,ki as aM,Fo as aN,rm as aO,WE as aP,kn as aQ,cO as aR,_v as aS,jc as aT,Mc as aU,Gl as aV,$v as aW,Sv as aX,P3 as aY,pv as aZ,at as a_,k7 as aa,In as ab,E7 as ac,j7 as ad,S7 as ae,oD as af,Ow as ag,N7 as ah,Mv as ai,pe as aj,Di as ak,Mp as al,LM as am,a2 as an,_n as ao,kt as ap,Gr as aq,ZD as ar,P7 as as,z7 as at,D7 as au,lt as av,F7 as aw,MD as ax,AD as ay,$D as az,NA as b,Xb as b0,Je as b1,la as b2,DE as b3,Jb as b4,v7 as b5,q$ as b6,aO as b7,tO as b8,zI as b9,hO as bA,Bc as bB,Ht as bC,Op as ba,O3 as bb,dO as bc,da as bd,Is as be,Wl as bf,U3 as bg,vF as bh,ha as bi,Ul as bj,N3 as bk,bv as bl,WI as bm,VI as bn,Xi as bo,jm as bp,UI as bq,Rp as br,qI as bs,XI as bt,Os as bu,Ri as bv,Sm as bw,Dp as bx,vv as by,Bu as bz,PA as c,Nt as d,Bs as e,Ov as f,FA as g,di as h,vr as i,Lt as j,Ib as k,q as l,DM as m,zA as n,HA as o,EM as p,SD as q,L7 as r,DA as s,RA as t,jr as u,y7 as v,SO as w,b7 as x,q7 as y,H7 as z};

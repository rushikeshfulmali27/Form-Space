import test from 'node:test';
import assert from 'node:assert/strict';
import {Viewer} from '../public/studio/viewer.js';
import {CATALOG,fresh,normalize} from '../public/studio/design.js';

// Check the production projection matrix directly; this does not simulate WebGL.
function assertFramed(viewer,width,height){
 const {matrix:m}=viewer.camera(width,height),d=viewer.design;
 for(const x of [-d.width/200,d.width/200])for(const y of [0,d.height/100])for(const z of [-d.depth/200,d.depth/200]){
  const sx=m[0]*x+m[4]*y+m[8]*z+m[12],sy=m[1]*x+m[5]*y+m[9]*z+m[13];
  assert.ok(Math.abs(sx)<=.80001,`${d.id} horizontal ${sx}`);
  assert.ok(Math.abs(sy)<=.58001,`${d.id} vertical ${sy}`);
 }
}
test('all 72 objects stay framed across camera presets and narrow viewports',()=>{
 const viewer=Object.create(Viewer.prototype);viewer.zoom=1;
 for(const design of CATALOG)for(const [yaw,pitch] of [[.72,.34],[0,.06],[0,1.56],[2.3,1.1]]){
  Object.assign(viewer,{design,yaw,pitch});
  for(const [w,h] of [[1000,510],[650,450],[290,420]])assertFramed(viewer,w,h);
 }
});
test('resizing the current object recomputes its frame and retains camera controls',()=>{
 const viewer=Object.create(Viewer.prototype);Object.assign(viewer,{yaw:.72,pitch:.34,zoom:1,view:'perspective',render(){}});
 viewer.update(fresh());const original=viewer.camera(320,420).size;
 viewer.update(normalize({...viewer.design,width:240,height:240,depth:240}));
 assert.ok(viewer.camera(320,420).size>original*2);assertFramed(viewer,320,420);
 viewer.setView('top');assert.equal(viewer.view,'top');assertFramed(viewer,320,420);
 viewer.zoom=2;viewer.fit();assert.equal(viewer.zoom,1);assert.equal(viewer.view,'perspective');assertFramed(viewer,320,420);
});
test('WebGL context loss falls back to an interactive, accessible software canvas',()=>{
 const previous={document:globalThis.document,ResizeObserver:globalThis.ResizeObserver,requestAnimationFrame:globalThis.requestAnimationFrame};
 const canvases=[];
 const canvas=()=>{const result={id:'scene',attributes:{role:'img','aria-label':'Interactive 3D model'},handlers:{},style:{},getAttribute(k){return this.attributes[k]??null;},setAttribute(k,v){this.attributes[k]=v;},replaceWith(c){this.replacement=c;},getContext(type){return type==='webgl'?{}:{clearRect(){}};},addEventListener(type,fn){this.handlers[type]=fn;}};canvases.push(result);return result;};
 globalThis.document={createElement:canvas};globalThis.ResizeObserver=class{observe(c){this.observed=c;}disconnect(){this.observed=null;}};globalThis.requestAnimationFrame=()=>{};
 const init=Viewer.prototype.init;Viewer.prototype.init=()=>{};
 try{
  const original=canvas(),viewer=new Viewer(original);viewer.drag={x:10,y:10};let prevented=false;
  original.handlers.webglcontextlost({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.equal(viewer.mode,'Software 3D');assert.notEqual(viewer.canvas,original);assert.equal(viewer.observer.observed,viewer.canvas);assert.equal(viewer.drag,null);
  assert.equal(viewer.canvas.getAttribute('aria-label'),'Interactive 3D model');assert.equal(viewer.canvas.getAttribute('role'),'img');assert.equal(viewer.canvas.tabIndex,0);
  assert.ok(viewer.canvas.handlers.pointermove);assert.ok(viewer.canvas.handlers.wheel);assert.ok(viewer.canvas.handlers.keydown);
 }finally{Viewer.prototype.init=init;for(const [k,v] of Object.entries(previous)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG,PALETTE,fresh,normalize,parsePrompt,History,serialize,deserialize} from '../public/studio/design.js';
import {buildModel,bounds} from '../public/studio/geometry.js';
test('main workflow: choose, prompt, generate geometry, undo, redo, export, reopen',()=>{
 const start=fresh('cafe-table');const history=new History(start);
 const edit=parsePrompt('Make it walnut with black legs, 90 cm wide and 80 cm tall',start);
 assert.equal(edit.design.width,90);assert.equal(edit.design.height,80);assert.equal(edit.design.depth,80);
 assert.equal(edit.design.color,PALETTE.walnut);assert.equal(edit.design.accent,PALETTE.black);assert.equal(edit.design.material,'walnut');assert.equal(edit.warnings.length,0);
 history.push(edit.design);assert.deepEqual(history.undo(),start);assert.deepEqual(history.redo(),edit.design);
 const mesh=buildModel(edit.design);const b=bounds(mesh);assert.ok(Math.abs(b.size[0]-.9)<.001);assert.ok(Math.abs(b.size[1]-.8)<.001);
 assert.deepEqual(deserialize(serialize(history.current)),edit.design);
});
test('relative dimension edits affect only their requested axes',()=>{
 const d=fresh();assert.equal(parsePrompt('20% taller',d).design.height,89);
 assert.equal(parsePrompt('Make it narrower by 20%',d).design.width,64);
 assert.equal(parsePrompt('increase height by 10 cm',d).design.height,84);
 assert.equal(parsePrompt('reduce width by 10 cm',d).design.width,70);
 assert.equal(parsePrompt('make it 10% smaller',d).design.height,67);
 assert.equal(parsePrompt('make it wider',d).design.width,92);
});
test('directional percentage reductions shrink only the named dimension',()=>{
 const d=fresh();
 for(const [prompt,axis,expected] of [
  ['reduce height by 20%','height',59],
  ['decrease the width by 10 percent','width',72],
  ['lower height 5 cm','height',69],
  ['shorten the height by 0.1 m','height',64],
  ['increase depth by 10%','depth',88],
  ['raise the height by 5 cm','height',79]
 ]){const r=parsePrompt(prompt,d);assert.equal(r.design[axis],expected,prompt);for(const other of ['width','depth','height'].filter(a=>a!==axis))assert.equal(r.design[other],d[other],prompt);assert.equal(r.warnings.length,0,prompt);}
 const combined=parsePrompt('reduce height by 20% and increase width by 10% with a white frame',d);
 assert.equal(combined.design.height,59);assert.equal(combined.design.width,88);assert.equal(combined.design.accent,PALETTE.white);
});
test('explicit units, dimensional triples and clamp warnings',()=>{
 const d=fresh();assert.equal(parsePrompt('width 1.2 m',d).design.width,120);
 assert.equal(parsePrompt('30 inches wide',d).design.width,76);
 assert.equal(parsePrompt('600 mm deep',d).design.depth,60);
 const triple=parsePrompt('120 x 60 x 90 cm',d).design;assert.equal(triple.width,120);assert.equal(triple.depth,60);assert.equal(triple.height,90);
 const invalid=parsePrompt('900 cm tall',d);assert.equal(invalid.design.height,240);assert.match(invalid.warnings.join(' '),/limited/);
});
test('shape, shelf count and catalog switching',()=>{
 assert.equal(parsePrompt('Make the top square',fresh()).design.shape,'square');
 const shelf=parsePrompt('Switch to the bookshelf and use 5 shelves',fresh());assert.equal(shelf.design.id,'bookshelf');assert.equal(shelf.design.shelves,5);
 assert.equal(parsePrompt('Make the floor lamp navy and 180 cm tall',fresh()).design.id,'floor-lamp');
 const unsupported=parsePrompt('make the lounge chair round',fresh());assert.ok(unsupported.warnings.length);
});
test('colors target primary and frame separately; arbitrary hex is supported',()=>{
 const a=parsePrompt('Make the main surface blue and the frame white',fresh());assert.equal(a.design.color,PALETTE.blue);assert.equal(a.design.accent,PALETTE.white);
 const b=parsePrompt('Use #d49c63 with black legs',fresh());assert.equal(b.design.color,'#d49c63');assert.equal(b.design.accent,PALETTE.black);
});
test('unsupported or empty prompts do not fabricate changes',()=>{
 const d=fresh();for(const p of ['', 'turn it into a spaceship','add a glass drawer']){const r=parsePrompt(p,d);assert.equal(r.changes.length,0);assert.ok(r.warnings.length);}
});
test('all catalog models produce finite triangles and dimension-consistent bounds',()=>{
 for(const d of CATALOG)for(const low of [false,true]){
  const mesh=buildModel(d,low);assert.ok(mesh.length>300,d.id);assert.equal(mesh.length%30,0,d.id);assert.ok(mesh.every(Number.isFinite),d.id);
  const b=bounds(mesh);assert.ok(Math.abs(b.size[0]-d.width/100)<.015,`${d.id} width ${b.size[0]}`);assert.ok(Math.abs(b.size[1]-d.height/100)<.015,`${d.id} height ${b.size[1]}`);assert.ok(Math.abs(b.size[2]-d.depth/100)<.015,`${d.id} depth ${b.size[2]}`);
  assert.ok(b.min[1]>-.015,d.id+' above floor');
  for(let i=0;i<mesh.length;i+=10){assert.ok(Math.abs(Math.hypot(mesh[i+3],mesh[i+4],mesh[i+5])-1)<.001,d.id+' unit normals');}
 }
});
test('range extremes stay finite and shelf edits rebuild visible geometry',()=>{
 for(const item of CATALOG)for(const axis of ['width','depth','height'])for(const n of [20,240]){const d=normalize({...item,[axis]:n});assert.ok(buildModel(d).every(Number.isFinite),item.id);}
 const a=buildModel({...fresh('bookshelf'),shelves:2});const b=buildModel({...fresh('bookshelf'),shelves:6});assert.ok(b.length>a.length);
 const round=buildModel(fresh());const square=buildModel({...fresh(),shape:'square'});assert.notEqual(round.length,square.length);
});
test('history branches correctly; invalid design files cannot enter state',()=>{
 const h=new History(fresh());h.push({...h.current,width:95});h.push({...h.current,height:100});h.undo();h.push({...h.current,color:'#abcdef'});assert.equal(h.canRedo,false);assert.equal(h.current.height,74);
 assert.throws(()=>deserialize('{"format":"other"}'));assert.throws(()=>deserialize('{"format":"form-studio","version":1,"design":{"id":"bad"}}'));
 const clean=normalize({id:'cafe-table',color:'<script>',height:Infinity,width:-1});assert.equal(clean.color,PALETTE.oak);assert.equal(clean.width,20);assert.equal(clean.height,74);
});

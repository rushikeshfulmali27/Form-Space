// Event-driven application test with a minimal DOM adapter; this is not browser QA.
import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG,TAXONOMY} from '../public/studio/design.js';
import {setupDOM} from './dom-adapter.mjs';
const setup=()=>setupDOM(new URL('../public/studio/index.html',import.meta.url));
test('UI events: select category and object, multi-part prompt, sliders, undo/redo, export/import',async()=>{
 const saved=setup();await import('../public/studio/app.js');const q=s=>document.querySelector(s);const all=s=>document.querySelectorAll(s);const state=()=>JSON.parse([...saved.values()][0]).design;
 assert.equal(all('.object-card').length,CATALOG.length);assert.equal(q('#object-name').textContent,'Orbit café table');
 const cafe=all('[data-category]').find(e=>e.dataset.category==='Cafe');await cafe.click();assert.equal(all('.object-card').length,13);
 q('#subcategory').value='cafe-tables';await q('#subcategory').fire('change');assert.equal(all('.object-card').length,5);
 q('#prompt').value='Make it walnut with black legs, 90 cm wide and 80 cm tall';await q('#prompt-form').requestSubmit();assert.equal(state().width,90);assert.equal(state().height,80);assert.equal(q('#dimension-label').textContent,'90 × 80 × 80 cm');assert.equal(q('#primary-color').value,'#79553c');assert.equal(q('#undo').disabled,false);
 const range=q('#width-range');range.value='105';await range.fire('input');await range.fire('change');assert.equal(state().width,105);await q('#undo').click();assert.equal(state().width,90);await q('#redo').click();assert.equal(state().width,105);
 q('#prompt').value='reduce height by 20%';await q('#prompt-form').requestSubmit();assert.equal(state().height,64);assert.equal(q('#height-number').value,64);await q('#undo').click();assert.equal(state().height,80);await q('#redo').click();assert.equal(state().height,64);
 const top=all('[data-view]').find(e=>e.dataset.view==='top');await top.click();assert.equal(top.getAttribute('aria-pressed'),'true');await q('#scene').fire('keydown',{key:'ArrowLeft'});assert.ok(all('[data-view]').every(e=>e.getAttribute('aria-pressed')==='false'));await q('#fit').click();assert.equal(all('[data-view]').find(e=>e.dataset.view==='perspective').getAttribute('aria-pressed'),'true');
 q('#prompt').value='Switch to the bookshelf with 5 shelves and a white frame';await q('#prompt-form').requestSubmit();assert.equal(state().id,'bookshelf');assert.equal(state().shelves,5);assert.equal(state().accent,'#f0eee7');assert.equal(q('#shelf-section').hidden,false);assert.equal(all('.object-card').length,4);assert.equal(q('#subcategory').value,'office-storage');
 q('#height-number').value='999';await q('#height-number').fire('change');assert.equal(state().height,240);
 let exported;const original=URL.createObjectURL;URL.createObjectURL=blob=>{exported=blob;return 'blob:test';};await q('#export').click();const exportText=await exported.text();assert.equal(JSON.parse(exportText).design.id,'bookshelf');URL.createObjectURL=original;
 await q('#reset').click();assert.equal(state().height,180);assert.equal(state().shelves,4);
 q('#import-file').files=[{size:exportText.length,text:async()=>exportText}];await q('#import-file').fire('change');assert.equal(state().height,240);assert.equal(state().shelves,5);
 q('#prompt').value='add a transparent glass drawer';await q('#prompt-form').requestSubmit();assert.equal(state().id,'bookshelf');assert.ok(q('#prompt-feedback').children[1].children.some(e=>e.className==='warning'));
 const old=state();q('#import-file').files=[{size:10,text:async()=>'{"format":"invalid"}'}];await q('#import-file').fire('change');assert.deepEqual(state(),old);
 // Search, empty state and category changes must reset invalid subcategory filters.
 const home=all('[data-category]').find(e=>e.dataset.category==='Home');await home.click();assert.equal(all('.object-card').length,27);assert.equal(q('#subcategory').value,'All');
 q('#subcategory').value='home-bedroom';await q('#subcategory').fire('change');assert.equal(all('.object-card').length,4);
 q('#library-search').value='wardrobe';await q('#library-search').fire('input');assert.equal(all('.object-card').length,1);await all('.object-card')[0].click();assert.equal(state().id,'wardrobe');assert.equal(q('#shape-section').hidden,true);
 q('#library-search').value='this does not exist';await q('#library-search').fire('input');assert.equal(all('.object-card').length,0);assert.equal(q('#library-empty').hidden,false);await q('#clear-library-filters').click();assert.equal(all('.object-card').length,CATALOG.length);assert.equal(q('#library-empty').hidden,true);
 // Every advertised category and subcategory must lead to selectable 3D objects.
 for(const category of TAXONOMY){await all('[data-category]').find(e=>e.dataset.category===category.id).click();for(const sub of category.subcategories){q('#subcategory').value=sub.id;await q('#subcategory').fire('change');const cards=all('.object-card');assert.ok(cards.length>0,sub.label);await cards[0].click();assert.equal(state().subcategory,sub.id);q('#prompt').value='make it blue and 10% taller';await q('#prompt-form').requestSubmit();assert.equal(state().color,'#597a93');}}
 await q('#prompt-help').click();assert.equal(q('#help-dialog').open,true);await q('#help-done').click();assert.equal(q('#help-dialog').open,false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {setupDOM} from './dom-adapter.mjs';
test('without a provider the page explicitly offers local demo and disables live AI',async()=>{
 setupDOM(new URL('../public/studio/prompt-design.html',import.meta.url));globalThis.fetch=async()=>Response.json({available:false});const page=await import('../public/studio/prompt-page.js');await page.ready;const q=s=>document.querySelector(s);assert.equal(q('#generation-mode').value,'demo');assert.equal(q('#ai-mode-option').disabled,true);assert.match(q('#engine-status').textContent,/does not call an AI/);q('#creation-prompt').value='Create a terracotta floor lamp, 160 cm tall, with a black base';await q('#generate-form').requestSubmit();assert.equal(q('#generated-controls').disabled,false);assert.match(q('#result-engine').textContent,/LOCAL DEMO/);
});

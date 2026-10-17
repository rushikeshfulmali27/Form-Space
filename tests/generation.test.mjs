import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG,fresh,serialize,deserialize} from '../public/studio/design.js';
import {buildModel} from '../public/studio/geometry.js';
import {generateDemo,validateRecipe,validatePrompt} from '../public/studio/generation.js';
import {handleGeneration,statusResponse} from '../server/generate.js';
const recipe=(id='work-desk')=>{const d=fresh(id);return {status:'ready',objectId:id,width:d.width,depth:d.depth,height:d.height,color:d.color,accent:d.accent,material:d.material,shape:d.shape||null,shelves:d.shelves||null,title:d.name,summary:'An editable catalog design.',unsupported:[]};};
const request=(body,options={})=>new Request('https://example.test/api/design',{method:'POST',headers:{'Content-Type':'application/json',origin:'https://example.test',...options.headers},body:typeof body==='string'?body:JSON.stringify(body),...options});
const payload={prompt:'A walnut desk, 120 cm wide',intent:'create',current:null};
const providerResult=r=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(r)}]}]});
test('all 72 named objects generate editable, portable local-demo designs',()=>{
 for(const o of CATALOG){const result=generateDemo(`Create ${o.name} and make it blue`);assert.equal(result.design.id,o.id,o.name);assert.equal(result.design.color,'#597a93');assert.equal(result.engine,'demo');assert.ok(buildModel(result.design).every(Number.isFinite));assert.deepEqual(deserialize(serialize(result.design)),result.design);}
});
test('creation and refinement preserve explicit dimensions and the latest manual edits',()=>{
 const a=generateDemo('A compact walnut study desk, 120 cm wide, 60 cm deep and 75 cm tall, with a black frame');assert.equal(a.design.id,'work-desk');assert.equal(a.design.width,120);assert.equal(a.design.depth,60);assert.equal(a.design.height,75);
 const b=generateDemo('Make it 20% taller',{intent:'refine',current:{...a.design,width:135}});assert.equal(b.design.height,90);assert.equal(b.design.width,135);
 assert.throws(()=>generateDemo('make a spaceship'),/Name an object/);assert.throws(()=>validatePrompt('x'.repeat(1201)));assert.throws(()=>generateDemo('add a glass drawer',{intent:'refine',current:a.design}));
});
test('untrusted recipes reject unknown objects, invalid geometry properties, colors and code fields',()=>{
 for(const patch of [{objectId:'spaceship'},{height:999},{width:NaN},{color:'<script>'},{material:'__proto__'},{shape:null},{shelves:4},{execute:'alert(1)'},{title:''},{unsupported:['x'.repeat(401)]}])assert.throws(()=>validateRecipe({...recipe(),...patch}),JSON.stringify(patch));
 assert.throws(()=>validateRecipe({...recipe('floor-lamp'),shape:'round'}));assert.throws(()=>validateRecipe({...recipe(),status:'unsupported',summary:'That object is outside the library.'}),/outside the library/);
});
test('API validates request bodies and origins before calling a provider',async()=>{
 let calls=0;const provider=async()=>{calls++;throw Error();};
 for(const [req,expected] of [[request('bad json'),400],[request({...payload,prompt:''}),400],[request({...payload,intent:'delete'}),400],[request({...payload,intent:'refine',current:null}),400],[request({...payload,prompt:'x'.repeat(17000)}),400],[request(payload,{headers:{'Content-Type':'text/plain'}}),415],[request(payload,{headers:{'Content-Type':'application/json',origin:'https://other.test'}}),403]]){const response=await handleGeneration(req,{OPENAI_API_KEY:'test-placeholder'},provider);assert.equal(response.status,expected);}
 assert.equal(calls,0);
});
test('missing credentials are reported honestly and never trigger provider requests',async()=>{
 assert.equal((await statusResponse({}).json()).available,false);assert.equal((await statusResponse({OPENAI_API_KEY:'test-placeholder'}).json()).available,true);
 let called=false;const response=await handleGeneration(request(payload),{},async()=>{called=true;});assert.equal(response.status,503);assert.equal((await response.json()).code,'AI_NOT_CONFIGURED');assert.equal(called,false);
});
test('live adapter uses a strict recipe schema, keeps secrets server-side and validates the output',async()=>{
 let sent;const response=await handleGeneration(request({...payload,intent:'refine',current:{...fresh('work-desk'),width:135}}),{OPENAI_API_KEY:'test-placeholder',OPENAI_MODEL:'configured-model'},async(url,options)=>{assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.headers.Authorization,'Bearer test-placeholder');sent=JSON.parse(options.body);return providerResult({...recipe(),width:135});});
 assert.equal(response.status,200);const result=await response.json();assert.equal(result.engine,'ai');assert.equal(result.design.width,135);assert.equal(sent.model,'configured-model');assert.equal(sent.store,false);assert.equal(sent.text.format.strict,true);assert.equal(JSON.parse(sent.input).current.width,135);assert.equal(JSON.stringify(result).includes('test-placeholder'),false);
 const invalid=await handleGeneration(request(payload),{OPENAI_API_KEY:'test-placeholder'},async()=>providerResult({...recipe(),width:999}));assert.equal(invalid.status,422);
});
test('provider refusals, truncated replies and failures do not fabricate successful designs',async()=>{
 for(const [provider,expected] of [[async()=>new Response('secret upstream details',{status:500}),502],[async()=>new Response('',{status:429}),429],[async()=>Response.json({status:'incomplete'}),502],[async()=>Response.json({status:'completed',output:[{content:[{type:'refusal',refusal:'No'}]}]}),422],[async()=>{throw Error('sensitive error');},502]]){const response=await handleGeneration(request(payload),{OPENAI_API_KEY:'test-placeholder'},provider);assert.equal(response.status,expected);assert.ok((await response.json()).error);}
});

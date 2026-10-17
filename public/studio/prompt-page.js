import {editor} from './app.js';
import {generateDemo,validatePrompt,validateRecipe} from './generation.js';
import {serialize} from './design.js';
const $=s=>document.querySelector(s);
let hasDesign=editor.hasSavedDesign,sequence=0,active=null,disabledBefore=null;
const NOTES='form-studio.prompt-notes.v1';
function message(text,error=false){const node=$('#generation-feedback');node.hidden=false;node.textContent=text;node.classList.toggle('error',error);}
function engineNote(){const ai=$('#generation-mode').value==='ai';$('#engine-status').textContent=ai?'Live AI interprets your brief and creates an editable catalog design.':'Local demo uses template matching and supported property edits. It does not call an AI model.';$('#refinement-engine-note').textContent=ai?'Live AI · editable catalog design':'Local demo · supported object properties';}
function readyDesign(){hasDesign=true;$('#generation-empty').hidden=true;$('#generated-controls').disabled=false;$('#generated-preview-labels').hidden=false;$('#refinement-panel').hidden=false;$('#export').disabled=false;}
function showResult(result){readyDesign();$('#design-result').hidden=false;$('#result-engine').textContent=result.engine==='ai'?'LIVE AI DESIGN':'LOCAL DEMO DESIGN';$('#concept-title').textContent=result.title;$('#concept-summary').textContent=result.summary;const details=$('#unsupported-details');details.replaceChildren();details.hidden=!result.unsupported.length;for(const text of result.unsupported){const item=document.createElement('li');item.textContent=text;details.append(item);}try{localStorage.setItem(NOTES,JSON.stringify({title:result.title,summary:result.summary,unsupported:result.unsupported,engine:result.engine}));}catch{}}
function setBusy(busy){
 const ids=['#generate-design','#creation-prompt','#prompt','#apply-prompt','#generation-mode','#export','#import','#undo','#redo','#reset','#open-in-studio'];
 if(busy){disabledBefore=new Map(ids.map(id=>[id,$(id).disabled]));for(const id of ids)$(id).disabled=true;}
 else if(disabledBefore){for(const [id,disabled]of disabledBefore)$(id).disabled=disabled;disabledBefore=null;}
 $('#generate-form').setAttribute('aria-busy',String(busy));$('#refinement-panel').setAttribute('aria-busy',String(busy));$('#generated-controls').disabled=busy||!hasDesign;$('#cancel-generation').hidden=!busy;
 $('#generate-design').children[1].textContent=busy?'Creating…':'Create design';
}
function checkedResult(value){if(!value||!['ai','demo'].includes(value.engine))throw Error('The design service returned an invalid result.');const d=value.design;const recipe={status:'ready',objectId:d?.id,width:d?.width,depth:d?.depth,height:d?.height,color:d?.color,accent:d?.accent,material:d?.material,shape:d?.shape||null,shelves:d?.shelves||null,title:value.title,summary:value.summary,unsupported:value.unsupported};return {...validateRecipe(recipe),engine:value.engine};}
async function run(prompt,intent){
 if(active)return;let text;try{text=validatePrompt(prompt);}catch(error){message(error.message,true);return;}
 if(intent==='refine'&&!hasDesign){message('Create a design before refining it.',true);return;}
 const controller=new AbortController(),id=++sequence;active={controller,id};const before=editor.exportText();setBusy(true);message(intent==='refine'?'Applying your new direction…':'Turning your brief into an editable design…');let timeout;
 try{
  let result;const current=intent==='refine'?editor.getDesign():null;
  if($('#generation-mode').value==='demo')result=generateDemo(text,{current,intent});
  else{timeout=setTimeout(()=>controller.abort(),30000);const response=await fetch('/api/design',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({prompt:text,intent,current})});let payload;try{payload=await response.json();}catch{throw Error('The design service could not be read. Your previous design is unchanged.');}if(!response.ok)throw Error(payload.error||'Design generation failed. Please try again.');result=checkedResult(payload);}
  if(active?.id!==id)return;if(editor.exportText()!==before)throw Error('The design changed while this request was running. Generate again to use your latest edits.');
  setBusy(false);editor.apply(result.design,intent==='refine'?'Your new direction, applied.':'Your design is ready.',result.unsupported,!hasDesign);showResult(result);message(result.engine==='ai'?'Your AI design is ready. Refine it with a prompt or the editing controls.':'Your demo design is ready. Refine it with a prompt or the editing controls.');
  if(intent==='refine')$('#prompt').value='';
 }catch(error){if(active?.id===id)message(controller.signal.aborted?'Generation timed out. Try again; your previous design is unchanged.':error.message||'Generation failed. Your previous design is unchanged.',true);}
 finally{clearTimeout(timeout);if(active?.id===id){active=null;setBusy(false);}}
}
$('#generate-form').addEventListener('submit',e=>{e.preventDefault();return run($('#creation-prompt').value,'create');});
$('#prompt-form').addEventListener('submit',e=>{e.preventDefault();return run($('#prompt').value,'refine');});
$('#creation-prompt').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();$('#generate-form').requestSubmit();}});
$('#cancel-generation').addEventListener('click',()=>{if(!active)return;const request=active;active=null;++sequence;request.controller.abort();setBusy(false);message('Generation canceled. Your previous design is unchanged.');});
document.querySelectorAll('[data-brief]').forEach(button=>button.addEventListener('click',()=>{if(active)return;$('#creation-prompt').value=button.dataset.brief;$('#creation-prompt').focus();}));
$('#generation-mode').addEventListener('change',engineNote);
$('#open-in-studio').addEventListener('click',()=>{try{localStorage.setItem('form-studio.workspace.v1',serialize(editor.getDesign()));globalThis.location.assign('/');}catch{message('Browser storage is unavailable. Export this design, then import it in Object Studio.',true);}});
document.addEventListener('form:design-imported',()=>{const d=editor.getDesign();showResult({title:d.name,summary:'Your imported design is ready to refine.',unsupported:[],engine:'demo'});});
if(hasDesign){const d=editor.getDesign();let notes={title:d.name,summary:'Your saved design is ready to refine.',unsupported:[],engine:'demo'};try{const saved=JSON.parse(localStorage.getItem(NOTES)||'null');if(saved&&typeof saved.title==='string'&&saved.title.length<=100&&typeof saved.summary==='string'&&saved.summary.length<=600&&Array.isArray(saved.unsupported)&&saved.unsupported.length<=12&&saved.unsupported.every(v=>typeof v==='string'&&v.length<=400)&&['ai','demo'].includes(saved.engine))notes=saved;}catch{}showResult(notes);}else $('#export').disabled=true;
export const ready=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);try{const response=await fetch('/api/design/status',{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error();const status=await response.json();if(status.available===true){$('#ai-mode-option').disabled=false;$('#ai-mode-option').textContent='Live AI';$('#generation-mode').value='ai';}engineNote();}catch{$('#engine-status').textContent='Live AI is unavailable. Local demo is ready for supported object descriptions.';}finally{clearTimeout(timer);}})();

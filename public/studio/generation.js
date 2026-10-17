import {CATALOG,MATERIALS,LIMITS,fresh,normalize,parsePrompt} from './design.js';

export const RECIPE_KEYS=['status','objectId','width','depth','height','color','accent','material','shape','shelves','title','summary','unsupported'];
export const RECIPE_SCHEMA={type:'object',additionalProperties:false,required:RECIPE_KEYS,properties:{
 status:{type:'string',enum:['ready','unsupported']},objectId:{type:'string',enum:CATALOG.map(o=>o.id)},
 width:{type:'number',minimum:20,maximum:240},depth:{type:'number',minimum:4,maximum:240},height:{type:'number',minimum:20,maximum:240},
 color:{type:'string'},accent:{type:'string'},material:{type:'string',enum:Object.keys(MATERIALS)},
 shape:{type:['string','null'],enum:['round','square',null]},shelves:{type:['integer','null'],minimum:2,maximum:6},
 title:{type:'string'},summary:{type:'string'},unsupported:{type:'array',items:{type:'string'}}
}};
export function validatePrompt(prompt){if(typeof prompt!=='string'||!prompt.trim())throw Error('Describe an object or the change you want.');if(prompt.length>1200)throw Error('Keep your description under 1,200 characters.');return prompt.trim();}
export function validateRecipe(recipe){
 if(!recipe||typeof recipe!=='object'||Array.isArray(recipe)||Object.keys(recipe).some(k=>!RECIPE_KEYS.includes(k))||RECIPE_KEYS.some(k=>!Object.hasOwn(recipe,k)))throw Error('The generator returned an invalid design specification.');
 if(!['ready','unsupported'].includes(recipe.status))throw Error('The generator returned an invalid status.');
 for(const [key,max] of [['title',100],['summary',600]])if(typeof recipe[key]!=='string'||!recipe[key].trim()||recipe[key].length>max)throw Error('The generator returned invalid design notes.');
 if(!Array.isArray(recipe.unsupported)||recipe.unsupported.length>12||recipe.unsupported.some(v=>typeof v!=='string'||v.length>400))throw Error('The generator returned invalid unsupported-detail notes.');
 if(recipe.status==='unsupported')throw Error(recipe.summary);
 const base=CATALOG.find(o=>o.id===recipe.objectId);if(!base)throw Error('The generator selected an unavailable object.');
 for(const axis of ['width','depth','height'])if(typeof recipe[axis]!=='number'||!Number.isFinite(recipe[axis])||recipe[axis]<LIMITS[axis][0]||recipe[axis]>LIMITS[axis][1])throw Error('The generated dimensions are outside the editable range.');
 for(const key of ['color','accent'])if(typeof recipe[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(recipe[key]))throw Error('The generator returned an invalid color.');
 if(!Object.hasOwn(MATERIALS,recipe.material))throw Error('The generator returned an unavailable material.');
 if(base.shape?!['round','square'].includes(recipe.shape):recipe.shape!==null)throw Error('The generated shape is unavailable for this object.');
 if(base.shelves?(!Number.isInteger(recipe.shelves)||recipe.shelves<2||recipe.shelves>6):recipe.shelves!==null)throw Error('The generated shelving is unavailable for this object.');
 return {design:normalize({...base,...recipe,id:base.id}),title:recipe.title.trim(),summary:recipe.summary.trim(),unsupported:[...recipe.unsupported]};
}
const fold=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const generic={
 'study table':'work-desk','study desk':'work-desk','office desk':'work-desk','writing desk':'work-desk','desk':'work-desk','nightstand':'bedside-table','bookcase':'bookshelf','shelving':'bookshelf','shelf':'bookshelf','table':'cafe-table','chair':'lounge-chair','lamp':'floor-lamp','stool':'bar-stool','rack':'display-rack','counter':'service-counter','bed':'bed-frame','cabinet':'filing-cabinet','sofa':'sofa','plant pot':'planter'
};
export function matchTemplate(prompt){
 const text=fold(prompt);const choices=CATALOG.flatMap(o=>[o.id.replaceAll('-',' '),o.name,...(o.aliases||[])].map(alias=>({alias:fold(alias),id:o.id}))).concat(Object.entries(generic).map(([alias,id])=>({alias,id}))).sort((a,b)=>b.alias.length-a.alias.length);
 return choices.find(({alias})=>{const i=text.indexOf(alias);return i>=0&&(i===0||!/[a-z]/.test(text[i-1]))&&!/[a-z]/.test(text[i+alias.length]||'');})?.id||null;
}
export function generateDemo(prompt,{current=null,intent='create'}={}){
 const text=validatePrompt(prompt);const objectId=matchTemplate(text);
 if(intent==='create'&&!objectId)throw Error('Name an object from the library, such as a study desk, floor lamp, or display rack.');
 if(intent==='refine'&&!current)throw Error('Create a design before refining it.');
 const base=intent==='refine'?normalize(current):fresh(objectId);const parsed=parsePrompt(text,objectId&&objectId!==base.id?fresh(objectId):base);let design=parsed.design;
 if(intent==='create'&&/\b(compact|small)\b/i.test(text)){const changes=new Set(parsed.changes.map(c=>c.key));design=normalize({...design,...(!changes.has('width')?{width:design.width*.8}:{}),...(!changes.has('depth')?{depth:design.depth*.8}:{})});}
 if(intent==='refine'&&!parsed.changes.length&&parsed.warnings.length)throw Error(parsed.warnings.join(' '));
 const recipe={status:'ready',objectId:design.id,width:design.width,depth:design.depth,height:design.height,color:design.color,accent:design.accent,material:design.material,shape:design.shape||null,shelves:design.shelves||null,title:design.name,summary:`${design.width} × ${design.depth} × ${design.height} cm · ${MATERIALS[design.material].label}. Ready to adjust in the editor.`,unsupported:parsed.warnings};
 return {...validateRecipe(recipe),engine:'demo'};
}
export function validCurrent(input){
 if(input===null||input===undefined)return null;
 if(!input||typeof input!=='object'||!CATALOG.some(o=>o.id===input.id))throw Error('The current design is invalid.');
 return normalize(input);
}

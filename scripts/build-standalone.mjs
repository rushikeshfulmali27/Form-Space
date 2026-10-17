// Bundle the dependency-free studio into an HTML file that opens without a server.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(process.argv[2]||path.join(root,'FORM_Studio_Prototype.html'));
const modules=['catalog','design','geometry','viewer','app'];
const parts=['const FormModules={};'];
for(const name of modules){
 let code=fs.readFileSync(path.join(root,'public/studio',name+'.js'),'utf8');
 const exports=[...code.matchAll(/export\s+(?:const|function|class)\s+(\w+)/g)].map(m=>m[1]);
 for(const m of code.matchAll(/^export\s+\{([^}]+)\};?\s*$/gm))exports.push(...m[1].split(',').map(s=>s.trim()));
 code=code.replace(/^import\s+\{([^}]+)\}\s+from\s+['"]\.\/(\w+)\.js['"];?\s*$/gm,(_,bindings,module)=>`const {${bindings}}=FormModules.${module};`);
 code=code.replace(/^export\s+\{[^}]+\};?\s*$/gm,'').replace(/\bexport\s+(?=const|function|class)/g,'');
 parts.push(`FormModules.${name}=(()=>{\n${code}\nreturn {${[...new Set(exports)].join(',')}};\n})();`);
}
const script=parts.join('\n');new vm.Script(script,{filename:'FORM_Studio_Prototype.html'});
const css=fs.readFileSync(path.join(root,'public/studio/style.css'),'utf8');
let html=fs.readFileSync(path.join(root,'public/studio/index.html'),'utf8').replace('<link rel="stylesheet" href="/studio/style.css">',()=>'<style>\n'+css+'\n</style>');
html=html.replace('<script type="module" src="/studio/app.js"></script>',()=>'<script>\n'+script.replace(/<\/script/gi,'<\\/script')+'\n</script>').replace('class="brand" href="/"','class="brand" href="#"');
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,html);console.log(output);

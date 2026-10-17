// Print filenames/counts only; never print suspected secret values or lines.
import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const walk = dir => readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]);
const files = process.argv.includes('--build') ? walk(path.join(root,'dist')) : execFileSync('git',['ls-files','-z'],{cwd:root}).toString().split('\0').filter(Boolean).map(p=>path.join(root,p));
const known=[];
for(const name of ['.env.local','.env','.dev.vars']) {
  try { for(const line of readFileSync(path.join(root,name),'utf8').split(/\r?\n/)) {
    const match=line.match(/^\s*(?:OPENAI_API_KEY|[\w]*TOKEN|[\w]*SECRET)\s*=\s*["']?([^\s"']+)/);
    if(match && match[1].length>12) known.push(match[1]);
  }} catch(error) { if(error.code!=='ENOENT') throw error; }
}
const signatures=[/sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /gh[pousr]_[A-Za-z0-9]{30,}/];
const rejected=[];
for(const file of files) {
  const name=path.relative(root,file).replaceAll('\\','/');
  if(/(^|\/)\.env(?:\.|$)/.test(name) && !name.endsWith('.env.example')) { rejected.push(name); continue; }
  const content=readFileSync(file,'utf8');
  if(known.some(s=>content.includes(s)) || signatures.some(re=>re.test(content))) rejected.push(name);
}
if(rejected.length) { console.error('Secret check failed in files:',rejected.join(', ')); process.exit(1); }
console.log(`Secret check passed: ${files.length} ${process.argv.includes('--build')?'build':'tracked'} files.`);

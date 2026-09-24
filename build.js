import {mkdir,copyFile,cp,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const html=await readFile('index.html','utf8');
for(const m of html.matchAll(/(?:src|href|poster|data-image)="(assets\/[^"#]+)"/g))if(!existsSync(m[1]))throw Error('Missing asset: '+m[1]);
if(/href="https:\/\/matkiai.com/.test(html))throw Error('Archived link remains');
await mkdir('dist',{recursive:true});
for(const name of ['index.html','style.css','app.js','analytics.js'])await copyFile(name,'dist/'+name);
await cp('assets','dist/assets',{recursive:true});
console.log('Static portfolio built and asset references verified.');

const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=require('path').resolve(__dirname,'..')+'/',html=fs.readFileSync(root+'index.html','utf8');
let inline=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!m[1].includes('src=')){new vm.Script(m[2]);inline++;}
const scripts=['diamante-v19.js','interface-v18.js','sw.js','sw-v73.js','vendor/chess-0.10.3.min.js','vendor/peerjs-1.5.2.min.js'];for(const f of scripts)new vm.Script(fs.readFileSync(root+f,'utf8'));
const ids=[...html.matchAll(/\bid="([^"\s]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);
const styles=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(x=>x[1]);styles.push(fs.readFileSync(root+'interface-v18.css','utf8'));
for(const style of styles){const css=style.replace(/\/\*[\s\S]*?\*\//g,'');let depth=0;for(const c of css){if(c==='{')depth++;if(c==='}')depth--;assert(depth>=0);}assert.equal(depth,0);}
const refs=[...html.matchAll(/(?:src|href)="\.\/([^"?#]+)/g)].map(x=>x[1]);for(const f of refs)assert(fs.existsSync(root+f),f);
const result={inlineScripts:inline,externalScripts:scripts.length,uniqueIds:ids.length,cssBlocks:styles.length,cssBraces:'balanced',localResources:refs,ok:true};console.log(result);

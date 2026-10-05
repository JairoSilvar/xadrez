/* Local preview/test runner; no packages required. Never exposes a public server. */
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname.startsWith('/api/')){res.writeHead(501,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify({ok:false,error:'LOCAL_PREVIEW_NO_API'}));return;}
 const testing=['/__tests','/__advanced'].includes(url.pathname);
 const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'||testing?'/index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{
   let data=fs.readFileSync(file);
   if(testing)data=data.toString().replace('</body>',`<script src="/tests/${url.pathname==='/__tests'?'baseline':'advanced'}.js"></script></body>`);
   const type=file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'text/html';
   res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'}).end(data);
 }catch(e){res.writeHead(404).end('Arquivo não encontrado');}
}).listen(8877,'127.0.0.1',()=>console.log('Xadrez v19 — http://127.0.0.1:8877/ (Ctrl+C encerra)'));

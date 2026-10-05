/* Xadrez v19 — Diamante. Atomic offline core and scoped cache. */
const XP_SW_BUILD='xp-sw-19.0.0-20261005';
const XP_PREFIX='xadrez-'+encodeURIComponent(self.registration.scope)+'-';
const XP_CACHE=XP_PREFIX+XP_SW_BUILD;
const CORE=['./','./index.html','./manifest.json','./interface-v18.css','./interface-v18.js','./diamante-v19.js','./icons/icon-192.png','./icons/icon-512.png','./vendor/chess-0.10.3.min.js','./vendor/peerjs-1.5.2.min.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(XP_CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('message',e=>{
 if(e.data?.type==='XP_GET_SW_BUILD' && e.source)e.source.postMessage({type:'XP_SW_BUILD',buildId:XP_SW_BUILD});
 if(e.data?.type==='XP_ACTIVATE_UPDATE')self.skipWaiting();
});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith(XP_PREFIX)||k.startsWith('xadrez-pro-xp-sw-'))&&k!==XP_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;
 if(!CORE.some(p=>new URL(p,self.registration.scope).pathname===url.pathname) && req.mode!=='navigate')return;
 e.respondWith(fetch(req,{cache:'no-store'}).then(async res=>{
   if(res.ok){const cache=await caches.open(XP_CACHE);await cache.put(req.mode==='navigate'?new URL('./index.html',self.registration.scope).href:req,res.clone());}
   return res;
 }).catch(async()=>{
   const cache=await caches.open(XP_CACHE);
   return await cache.match(req.mode==='navigate'?new URL('./index.html',self.registration.scope).href:req) || new Response('Conteúdo indisponível offline',{status:503});
 }));
});

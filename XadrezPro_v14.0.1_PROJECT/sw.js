/* Xadrez Pro Service Worker v14.0.1 */
const XP_SW_BUILD = 'xp-sw-14.0.1-20260921';
const XP_CACHE = 'xadrez-pro-' + XP_SW_BUILD;
const CORE = ['./', './index.html', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(XP_CACHE).then(cache => cache.addAll(CORE).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('xadrez-pro-') && k !== XP_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'XP_GET_SW_BUILD' && event.source) {
    event.source.postMessage({type:'XP_SW_BUILD', buildId:XP_SW_BUILD});
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return; // API nunca é cacheada pelo SW.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req, {cache:'no-store'}).then(res => {
      const copy = res.clone(); caches.open(XP_CACHE).then(c => c.put('./index.html', copy)).catch(()=>{}); return res;
    }).catch(() => caches.match('./index.html').then(r => r || caches.match('./'))));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(fetch(req).then(res => { const copy=res.clone(); caches.open(XP_CACHE).then(c=>c.put(req,copy)).catch(()=>{}); return res; }).catch(()=>caches.match(req)));
  }
});

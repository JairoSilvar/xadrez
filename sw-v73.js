/* Xadrez Pro Service Worker v7.3 — offline shell + assets */
const CACHE = 'xadrezpro-v73';
const PRECACHE = [
  './',
  './XadrezPro_v7.3.html',
  'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js',
  'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
  'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
  'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
  'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = req.url;
  if (
    url.includes('stream') ||
    url.includes('radio') ||
    url.includes('m3u8') ||
    url.includes('aac') ||
    url.includes('mp3') ||
    url.includes('icecast') ||
    url.includes('shoutcast') ||
    url.includes('somafm') ||
    url.includes('laut.fm') ||
    url.includes('streamtheworld') ||
    url.includes('radioparadise') ||
    url.includes('radiofrance')
  ) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
});

// QiQa Service Worker — cho phép cài app & xem được khi mất mạng
const CACHE = 'qiqa-v1';
const SHELL = ['/', '/index.html', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Chiến lược: ưu tiên mạng (để dữ liệu luôn mới), mất mạng thì lấy bản đã lưu
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // bỏ qua POST (gọi API)
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;             // bỏ qua Google Apps Script, ảnh ngoài…

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
  );
});

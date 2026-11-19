const CACHE = "silkroad-journal-offline-v1";
const base = self.registration.scope;
const home = new URL("index.html", base).href;
const places = new URL("places.html", base).href;

// 兩頁都下載成功，才完成離線包的安裝。
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const pages = [home, places].map(url =>
      new Request(url, { cache: "reload" })
    );
    await cache.addAll(pages);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// 只處理本 App 的兩個頁面，不攔截外部閱讀連結。
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" ||
      event.request.mode !== "navigate") return;

  const url = new URL(event.request.url);
  url.search = "";
  url.hash = "";

  // 從主畫面圖示打開，有時使用目錄網址而非 index.html。
  const page = url.href === base ? home : url.href;
  if (page !== home && page !== places) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        try { await cache.put(page, response.clone()); } catch {}
        return response;
      }
      return (await cache.match(page)) || response;
    } catch {
      return (await cache.match(page)) || Response.error();
    }
  })());
});

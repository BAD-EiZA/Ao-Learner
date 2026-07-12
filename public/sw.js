/* Cache shell + audio; support offline learn prefetch */
const CACHE = "ao-learner-v2";
const PRECACHE = ["/", "/manifest.webmanifest", "/model.vrm", "/audio/placeholder.mp3"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const cacheable =
    url.pathname.startsWith("/anims/") ||
    url.pathname.startsWith("/audio/") ||
    url.pathname.endsWith(".vrm") ||
    url.pathname.endsWith(".vrma") ||
    url.pathname.endsWith(".webmanifest") ||
    url.pathname.startsWith("/path") ||
    url.pathname.startsWith("/practice") ||
    url.pathname.startsWith("/match") ||
    url.hostname.includes("ufs.sh") ||
    url.hostname.includes("utfs.io");

  if (
    !cacheable &&
    url.origin === self.location.origin &&
    (url.pathname === "/" || url.pathname === "/dashboard")
  ) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  if (cacheable) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      })
    );
  }
});

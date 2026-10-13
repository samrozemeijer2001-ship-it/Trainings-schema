/* Service worker: laat de app offline openen na het eerste bezoek.
   Eigen bestanden: eerst netwerk (zodat updates direct zichtbaar zijn), anders uit cache.
   Lettertypes van Google: uit cache, anders netwerk.
   Verhoog VERSION als je bestanden wijzigt. */
const VERSION = "v7";
const CACHE = "casrc-training-" + VERSION;
const FONT_CACHE = "casrc-training-fonts";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=7",
  "./i18n.js?v=7",
  "./data.js?v=7",
  "./store.js?v=7",
  "./stats.js?v=7",
  "./app.js?v=7",
  "./manifest.webmanifest?v=7",
  "./icons/logo.svg?v=7",
  "./icons/icon-192.png?v=7",
  "./icons/icon-512.png?v=7",
  "./icons/icon-512-maskable.png?v=7",
  "./icons/apple-touch-icon.png?v=7"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((k) => k.startsWith("casrc-training-") && k !== CACHE && k !== FONT_CACHE)
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Google Fonts
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(FONT_CACHE).then((c) =>
        c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))
      )
    );
    return;
  }

  // Alleen eigen bestanden
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./index.html")))
  );
});

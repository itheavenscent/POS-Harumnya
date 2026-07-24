/**
 * Service Worker — Harumnya POS
 *
 * Strategi konservatif untuk aplikasi server-driven (Laravel + Inertia):
 *  - Cache-first HANYA untuk asset build ber-hash (/build/assets/*) & ikon PWA.
 *    File ini immutable (nama ber-hash) → aman di-cache permanen.
 *  - Network-only untuk navigasi & request lain (auth/data selalu fresh,
 *    tidak ada risiko halaman basi).
 *
 * Naikkan CACHE_VERSION saat ingin membersihkan cache lama.
 */
const CACHE_VERSION = "harumnya-v1";
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
            );
            await self.clients.claim();
        })()
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Hanya tangani GET same-origin
    if (request.method !== "GET") return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    const isHashedAsset = url.pathname.startsWith("/build/assets/");
    const isIcon = /\/(pwa-\d+|pwa-maskable-\d+|apple-touch-icon)\.png$/.test(url.pathname);

    if (isHashedAsset || isIcon) {
        // Cache-first (asset immutable)
        event.respondWith(
            (async () => {
                const cache = await caches.open(ASSET_CACHE);
                const cached = await cache.match(request);
                if (cached) return cached;
                try {
                    const res = await fetch(request);
                    if (res && res.status === 200) cache.put(request, res.clone());
                    return res;
                } catch (e) {
                    return cached || Response.error();
                }
            })()
        );
    }
    // Selain itu: biarkan default (network). Tidak intercept navigasi/API.
});

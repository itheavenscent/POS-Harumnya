/**
 * Service Worker — Harumnya POS
 *
 * Strategi konservatif untuk aplikasi server-driven (Laravel + Inertia):
 *  - Cache-first HANYA untuk asset build ber-hash (/build/assets/*) & ikon PWA.
 *    File ini immutable (nama ber-hash) → aman di-cache permanen.
 *  - Network-only untuk navigasi & request lain (auth/data selalu fresh,
 *    tidak ada risiko halaman basi).
 *
 * Versi diambil dari query ?v=<hash> saat register (berubah tiap deploy),
 * sehingga cache lama otomatis dibersihkan pada activate.
 */
const VERSION = new URL(self.location.href).searchParams.get("v") || "v1";
const CACHE_VERSION = `harumnya-${VERSION}`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;

self.addEventListener("install", (event) => {
    // Jangan skipWaiting otomatis: tunggu konfirmasi user (banner "Muat ulang")
    // agar tidak reload paksa saat kasir sedang transaksi.
});

// Aktivasi SW baru saat user menekan "Muat ulang" di banner.
self.addEventListener("message", (event) => {
    if (event.data === "SKIP_WAITING") self.skipWaiting();
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

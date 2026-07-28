import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeSwitcherProvider } from './Context/ThemeSwitcherContext';
import { BluetoothProvider } from './Context/BluetoothContext';

const appName = import.meta.env.VITE_APP_NAME || 'Harumnya';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ThemeSwitcherProvider>
                <BluetoothProvider>
                    <App {...props} />
                </BluetoothProvider>
            </ThemeSwitcherProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// ── PWA: service worker + auto-update saat deploy baru ─────────────────────
if ('serviceWorker' in navigator) {
    const version = document.querySelector('meta[name="app-version"]')?.content || 'dev';
    // Ada controller = app sudah dikontrol SW lama → update nanti butuh reload.
    const hadController = !!navigator.serviceWorker.controller;

    const showUpdateBanner = (onReload) => {
        if (document.getElementById('pwa-update-banner')) return;
        const bar = document.createElement('div');
        bar.id = 'pwa-update-banner';
        bar.style.cssText =
            'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:99999;' +
            'display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:12px;' +
            'background:#0f172a;color:#fff;font:600 13px/1.2 system-ui,sans-serif;' +
            'box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:92vw';
        const text = document.createElement('span');
        text.textContent = 'Versi baru tersedia';
        const btn = document.createElement('button');
        btn.textContent = 'Muat ulang';
        btn.style.cssText =
            'background:#22c55e;color:#04210f;border:0;border-radius:8px;' +
            'padding:6px 12px;font:700 13px system-ui,sans-serif;cursor:pointer';
        btn.onclick = () => { btn.disabled = true; btn.textContent = 'Memuat…'; onReload(); };
        bar.append(text, btn);
        document.body.appendChild(bar);
    };

    window.addEventListener('load', () => {
        // URL berubah tiap deploy (?v=hash) → browser mendeteksi SW baru.
        navigator.serviceWorker.register(`/sw.js?v=${version}`, { scope: '/' })
            .then((reg) => {
                const check = () => reg.update().catch(() => {});
                setInterval(check, 30 * 60 * 1000);
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') check();
                });

                const trackWaiting = (worker) => {
                    if (!worker) return;
                    worker.addEventListener('statechange', () => {
                        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateBanner(() => worker.postMessage('SKIP_WAITING'));
                        }
                    });
                };

                if (reg.waiting && navigator.serviceWorker.controller) {
                    showUpdateBanner(() => reg.waiting.postMessage('SKIP_WAITING'));
                }
                reg.addEventListener('updatefound', () => trackWaiting(reg.installing));
            })
            .catch(() => {});
    });

    // Poll versi: sesi PWA kasir jarang di-reload (navigasi Inertia via XHR,
    // blade/meta tak dibaca ulang). Deteksi deploy baru → banner → reload.
    let baseManifest = null;
    const pollVersion = async () => {
        try {
            const res = await fetch('/build/manifest.json', { cache: 'no-store' });
            if (!res.ok) return;
            const txt = await res.text();
            let h = 0;
            for (let i = 0; i < txt.length; i++) h = (Math.imul(h, 31) + txt.charCodeAt(i)) | 0;
            const cur = String(h);
            if (baseManifest === null) { baseManifest = cur; return; }
            if (cur !== baseManifest) showUpdateBanner(() => window.location.reload());
        } catch (_) { /* offline: abaikan */ }
    };
    setInterval(pollVersion, 5 * 60 * 1000);

    // Reload sekali saat SW baru mengambil alih (skip pada instalasi pertama).
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing || !hadController) return;
        refreshing = true;
        window.location.reload();
    });
}

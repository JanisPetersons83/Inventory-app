// ======================================================
// 📦 SERVICE WORKER
// ======================================================

const CACHE_NAME = "inventory-app-v2-1-20";
const BASE = "/Inventory-app";
const urlsToCache = [

    `${BASE}/`,
    `${BASE}/index.html`,
    `${BASE}/manifest.json`,
    `${BASE}/style.css`,
    `${BASE}/app.js`,
    `${BASE}/ai-test.js`,
    `${BASE}/libs/exceljs.min.js`,
    `${BASE}/libs/FileSaver.min.js`,

    `${BASE}/Icons/favicon-16-v2.PNG`,
    `${BASE}/Icons/favicon-32-v2.PNG`,
    `${BASE}/Icons/worklog-192-v2.PNG`,
    `${BASE}/Icons/worklog-512-v2.PNG`,
  
    `${BASE}/dardu_map1.jpeg`,
    `${BASE}/dardu_map2.jpeg`,
    `${BASE}/cecilu_map.jpeg`
];
// ======================================================
// INSTALL
// ======================================================
self.addEventListener(
    "install",
    event => {
        self.skipWaiting();
        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(async cache => {
                    // Katru failu kešo atsevišķi.
                    // Ja viens fails neielādējas,
                    // viss Service Worker neuzsprāgst.
                    for (const url of urlsToCache) {
                        try {
                            await cache.add(url);
                        }
                        catch (error) {
                            console.error(
                                "❌ Neizdevās cache:",
                                url,
                                error
                            );
                        }
                    }
                })
        );
    }
);
// ======================================================
// ACTIVATE
// ======================================================
self.addEventListener(
    "activate",
    event => {
        event.waitUntil(
            Promise.all([
                // Dzēš vecās cache versijas
                caches
                    .keys()
                    .then(keys => {
                        return Promise.all(
                            keys.map(key => {
                                if (
                                    key !== CACHE_NAME
                                ) {
                                    return caches.delete(
                                        key
                                    );
                                }
                            })
                        );
                    }),

                // Uzreiz pārņem atvērtās lapas
                self.clients.claim()
            ])
        );
    }
);
// ======================================================
// FETCH
// ======================================================
self.addEventListener(
    "fetch",
    event => {
        const request =
            event.request;
        // ==================================================
        // HTML / APP NAVIGĀCIJA
        //
        // ĻOTI SVARĪGI OFFLINE RELOAD
        // ==================================================
        if (
            request.mode === "navigate"
        ) {
            event.respondWith(
                fetch(request)
                    .catch(async () => {
                        const cache =
                            await caches.open(
                                CACHE_NAME
                            );
                        return (
                            await cache.match(
                                `${BASE}/index.html`
                            )
                        ) || (
                            await cache.match(
                                `${BASE}/`
                            )
                        );
                    })
            );
            return;
        }
        // ==================================================
        // CSS / JS / ATTĒLI / CITI FAILI
        // ==================================================
        event.respondWith(
            caches
                .match(request)
                .then(cached => {
                    if (cached) {
                        return cached;
                    }
                    return fetch(request);
                })
        );
    }
);

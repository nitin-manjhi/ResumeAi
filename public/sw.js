const CACHE_NAME = 'resume-ai-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/pwa-icon.png',
    '/favicon.ico'
];

// Install Event
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Use map to avoid failing the whole install if one file is missing
            return Promise.allSettled(
                ASSETS.map((url) => cache.add(url))
            );
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    // Navigation requests: respond with index.html if offline
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/index.html'))
        );
        return;
    }

    // Generic assets: cache-first fallback to network
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

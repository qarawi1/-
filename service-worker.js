const CACHE_NAME = 'app-cache-v1';
const OFFLINE_URLS = [
    '/',
    '/offline.html',
    '/css/styles.css',
    '/js/scripts.js',
    '/js/appo.js',
    '/images/logo.png'
];

// تثبيت Service Worker وتخزين الملفات في الكاش
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(OFFLINE_URLS);
        })
    );
});

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(OFFLINE_URLS);
        })
    );
});

// اعتراض الطلبات وإرجاع البيانات من الكاش إذا لم يكن هناك اتصال
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        }).catch(() => caches.match('/offline.html'))
    );
});

// تحديث الكاش عندما يتغير المحتوى
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            );
        })
    );
});

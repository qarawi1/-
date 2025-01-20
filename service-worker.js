const CACHE_NAME = 'app-cache-v2';
const OFFLINE_URL = '/offline.html'; // الصفحة التي تريد عرضها عند عدم وجود اتصال

const OFFLINE_URLS = [
    '/index.html',
    '/appo.html',	
    '/offline.html',
    '/css/styles.css',
    '/js/scripts.js',
    '/js/appo.js',
    '/images/logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // إضافة الملفات إلى الكاش
            return cache.addAll(OFFLINE_URLS).catch((error) => {
                console.error('Failed to cache some resources:', error);
            });
        })
    );
});

self.addEventListener('fetch', (event) => {
    // تجاهل الطلبات غير المدعومة (مثل POST)
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            // إذا كان الطلب موجودًا في الكاش، قم بإرجاعه
            if (response) {
                return response;
            }

            // إذا لم يكن الطلب موجودًا في الكاش، حاول جلبها من الشبكة
            return fetch(event.request).then((networkResponse) => {
                // إذا نجح الجلب من الشبكة، قم بتخزينها في الكاش
                if (networkResponse.ok) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // إذا فشل الجلب من الشبكة، قم بإرجاع الصفحة المخزنة في الكاش
                return caches.match(OFFLINE_URL);
            });
        })
    );
});

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
const CACHE_NAME = 'control-flota-pro-v5.3.1';
const ASSETS = [
    './',
    './index.html',
    './css/styles.css?v=531',
    './js/app.js?v=531',
    './manifest.json',
    './Logo_Intralogistica.jpg',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Outfit:wght@900&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore-compat.js'
];

// Instalación: Guardar todo en la caja fuerte (Caché)
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('SW: Cacheando recursos críticos...');
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Activación: Limpiar versiones viejas de la App
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key !== CACHE_NAME) {
                    console.log('SW: Eliminando caché antiguo:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

// Estrategia: Network First (Red primero), si falla, buscar en Caché
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});

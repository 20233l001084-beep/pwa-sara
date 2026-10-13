const CACHE_STATIC_NAME = 'dia-muertos-static-v1';
const CACHE_DYNAMIC_NAME = 'dia-muertos-dynamic-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/android-chrome-192x192.png',
  './icons/android-chrome-512x512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.ico',
  './icons/favicon-16x16.png',
  './icons/favicon-32x32.png'
];

// 1. Instalación y precaché de recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activación y limpieza de caché antigua
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME)
            .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Estrategia Cache First (Funcionamiento offline)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});

// 4. Evento SYNC (Background Sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ofrendas') {
    event.waitUntil(sincronizarOfrendasCache());
  }
});

async function sincronizarOfrendasCache() {
  console.log('[SW] Conexión activa: Procesando sincronización...');

  if (Notification.permission === 'granted') {
    self.registration.showNotification('¡Sincronización Exitosa! 💀', {
      body: 'Tus publicaciones se han sincronizado correctamente con el altar.',
      icon: 'icons/android-chrome-192x192.png'
    });
  }
}
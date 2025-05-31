
const CACHE_NAME = 'clarityledger-cache-v1.1'; // Increment version if you change cached files
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/index.tsx', // This should be the path to your main JS bundle if you have one
  // Tailwind CSS from CDN
  'https://cdn.tailwindcss.com',
  // Google Fonts CSS (the specific URL loaded by the browser after redirect)
  // It's better to self-host fonts or use a more robust caching strategy for CDN font CSS.
  // For simplicity, we'll try to cache the main request.
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap',
  // Font Awesome CSS from CDN
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  // JS dependencies from importmap (actual URLs used by browser)
  'https://esm.sh/react@^19.1.0',
  'https://esm.sh/react-dom@^19.1.0',
  'https://esm.sh/recharts@^2.15.3',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js',
  // Locale files
  '/locales/en.json',
  '/locales/zh-TW.json',
  // Icons (referenced in manifest)
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png'
  // Add other critical assets like logo if it's a separate file
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching assets');
        // Add assets one by one to handle potential individual failures better.
        const promises = ASSETS_TO_CACHE.map(assetUrl => {
          return cache.add(assetUrl).catch(err => {
            console.warn(`Failed to cache ${assetUrl}:`, err);
          });
        });
        return Promise.all(promises);
      })
      .catch(err => {
        console.error('Failed to open cache during install:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // For navigation requests (HTML), try network first, then cache.
  // This ensures users get the latest HTML if online, but can still load offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If successful, cache the new response for this URL (e.g. index.html)
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try to serve from cache
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || caches.match('/'); // Fallback to root if specific page not found
          });
        })
    );
    return;
  }

  // For other requests (CSS, JS, images, fonts), use cache-first strategy.
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // If not in cache, fetch from network
        return fetch(request).then((networkResponse) => {
          // Optionally, cache new assets dynamically if they are from your origin
          // or known CDNs that are part of the app shell.
          // Be careful with caching everything, especially third-party opaque responses.
          if (networkResponse && networkResponse.ok) {
             // Check if the request URL is one of the assets we intend to cache or from a known CDN.
             const url = new URL(request.url);
             const shouldCache = ASSETS_TO_CACHE.includes(url.pathname) ||
                                 ASSETS_TO_CACHE.includes(request.url) || // For full CDN URLs
                                 url.hostname === 'cdn.tailwindcss.com' ||
                                 url.hostname === 'fonts.googleapis.com' ||
                                 url.hostname === 'fonts.gstatic.com' || // Google Fonts also uses gstatic
                                 url.hostname === 'cdnjs.cloudflare.com' ||
                                 url.hostname === 'esm.sh' ||
                                 url.hostname === 'cdn.jsdelivr.net';

            if (shouldCache) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                .then((cache) => {
                    cache.put(request, responseToCache);
                });
            }
          }
          return networkResponse;
        }).catch(error => {
            console.warn(`Fetch failed for ${request.url}; returning offline page or error`, error);
            // You could return a custom offline page/image here if appropriate
            // For now, just let the browser handle the error for non-essential failed fetches.
            // For essential assets not found in cache & network, this will result in a browser error.
        });
      })
  );
});

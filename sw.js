'use strict';
const BASE = new URL('./', self.registration.scope);
const INDEX_URL = new URL('index.html', BASE).href;
const CACHE_PREFIX = 'kyowa-tight-frame:' + encodeURIComponent(BASE.href) + ':';
const CACHE_NAME = CACHE_PREFIX + '20261011-212621';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(INDEX_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error('index.html could not be fetched');
    const cache = await caches.open(CACHE_NAME);
    await cache.put(INDEX_URL, response);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  const url = new URL(request.url);
  if (url.origin !== BASE.origin || (url.pathname !== BASE.pathname && url.pathname !== new URL(INDEX_URL).pathname)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request, { cache: 'no-store' });
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(INDEX_URL, response.clone());
        return response;
      }
      const cached = await caches.match(INDEX_URL, { cacheName: CACHE_NAME });
      return cached || response;
    } catch (error) {
      const cached = await caches.match(INDEX_URL, { cacheName: CACHE_NAME });
      if (cached) return cached;
      throw error;
    }
  })());
});

var cacheName = 'weatherPWA-step-6-1';
var dataCacheName = 'weatherData-v1';
var filesToCache = [
    '/pwa/',
    '/pwa/index.html',
    '/pwa/scripts/app.js',
    '/pwa/styles/inline.css',
    '/pwa/images/clear.png',
    '/pwa/images/cloudy-scattered-showers.png',
    '/pwa/images/cloudy.png',
    '/pwa/images/fog.png',
    '/pwa/images/ic_add_white_24px.svg',
    '/pwa/images/ic_refresh_white_24px.svg',
    '/pwa/images/partly-cloudy.png',
    '/pwa/images/rain.png',
    '/pwa/images/scattered-showers.png',
    '/pwa/images/sleet.png',
    '/pwa/images/snow.png',
    '/pwa/images/thunderstorm.png',
    '/pwa/images/wind.png'
];

self.addEventListener('install', function(e) {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener('activate', function(e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName && key !== dataCacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  console.log('[ServiceWorker] Fetch', e.request.url);
  var dataUrl = 'https://query.yahooapis.com/v1/public/yql';
  if (e.request.url.indexOf(dataUrl) > -1) {
    /*
     * When the request URL contains dataUrl, the app is asking for fresh
     * weather data. In this case, the service worker always goes to the
     * network and then caches the response. This is called the "Cache then
     * network" strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-then-network
     */
    e.respondWith(
      caches.open(dataCacheName).then(function(cache) {
        return fetch(e.request).then(function(response){
          cache.put(e.request.url, response.clone());
          return response;
        });
      })
    );
  } else {
    /*
     * The app is asking for app shell files. In this scenario the app uses the
     * "Cache, falling back to the network" offline strategy:
     * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
     */
    e.respondWith(
      caches.match(e.request).then(function(response) {
        return response || fetch(e.request);
      })
    );
  }
});

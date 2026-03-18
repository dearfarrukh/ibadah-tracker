const CACHE_VERSION = "ibadah-cache-v2";
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.png",
  "./wallpaper.jpg",

  "./Images/dark-tasbih-bg.jpg",
  "./Images/tasbih-wall-2.jpg",
  "./Images/tasbih-wall-3.jpg",
  "./Images/tasbih-wall-4.jpg",

  "./waqiya-1.png",
  "./waqiya-2.png",
  "./waqiya-3.png",
  "./waqiya-4.png",

  "./mulk-1.png",
  "./mulk-2.png",
  "./mulk-3.png",

  "./rehman-1.png",
  "./rehman-2.png",
  "./rehman-3.png",

  "./ikhlas.jpg"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.addAll(APP_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.map(function(key){
          if(key !== CACHE_VERSION){
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse){
      if(cachedResponse){
        return cachedResponse;
      }

      return fetch(event.request).then(function(networkResponse){
        return networkResponse;
      });
    }).catch(function(){
      return caches.match("./index.html");
    })
  );
});

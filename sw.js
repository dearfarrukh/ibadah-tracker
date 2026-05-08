// =========================
// IBADAH OFFLINE SERVICE WORKER
// =========================

const IBADAH_STATIC_CACHE = "ibadah-static-v3";
const IBADAH_RUNTIME_CACHE = "ibadah-runtime-v1";

// =========================
// APP SHELL FILES TO CACHE
// =========================
const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.png",
  "./wallpaper.jpg",
  "./Images/Icons/QuranTracker.png",
  "./Images/Icons/home.png",
  "./Images/Icons/refresh.png",
  "./Images/Icons/backup.png",
  "./Images/Icons/settings.png",
  "./Images/dark-tasbih-bg.jpg",
  "./Images/royal-tasbih-bg.png"
];

// =========================
// INSTALL
// =========================
self.addEventListener("install", function(event){

  event.waitUntil(
    caches.open(IBADAH_STATIC_CACHE).then(function(cache){
      return cache.addAll(APP_SHELL_FILES);
    })
  );

  self.skipWaiting();

});

// =========================
// ACTIVATE
// =========================
self.addEventListener("activate", function(event){

  event.waitUntil(
    caches.keys().then(function(keys){

      return Promise.all(
        keys.map(function(key){

          if(
            key !== IBADAH_STATIC_CACHE &&
            key !== IBADAH_RUNTIME_CACHE
          ){
            return caches.delete(key);
          }

        })
      );

    }).then(function(){
      return self.clients.claim();
    })
  );

});

// =========================
// FETCH
// =========================
self.addEventListener("fetch", function(event){

  const request = event.request;

  // only handle GET
  if(request.method !== "GET") return;

  const url = new URL(request.url);

  // only cache same-origin files
  if(url.origin !== self.location.origin) return;

  // =========================
  // 1) HTML PAGES
  // =========================
  if(
    request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname.endsWith("/")
  ){

    // =========================
    // FOLDER PAGES MUST LOAD THEIR OWN INDEX.HTML
    // full protected folder list
    // =========================
    if(
      url.pathname.includes("/duapage/") ||
      url.pathname.includes("/dailyazkar/") ||
      url.pathname.includes("/tasbih/") ||
      url.pathname.includes("/qazatracker/") ||
      url.pathname.includes("/arabic-quran/") ||
      url.pathname.includes("/QuranPages/") ||
      url.pathname.includes("/books/") ||
      url.pathname.includes("/books/AsanNamaz/") ||
      url.pathname.includes("/books/noorani-qaida/")
    ){

      event.respondWith(
        fetch(request).catch(function(){
          return caches.match(request);
        })
      );

      return;

    }

    // =========================
    // MAIN APP PAGE CAN USE CACHED APP SHELL
    // =========================
    event.respondWith(
      caches.match("./index.html").then(function(cachedPage){
        return cachedPage || fetch(request);
      })
    );

    return;

  }

  // =========================
  // 2) STATIC FILES / IMAGES / PDF / JSON / JS / CSS
  // =========================
  event.respondWith(
    caches.match(request).then(function(cachedResponse){

      if(cachedResponse){
        return cachedResponse;
      }

      return fetch(request).then(function(networkResponse){

        return caches.open(IBADAH_RUNTIME_CACHE).then(function(cache){

          cache.put(request, networkResponse.clone());
          return networkResponse;

        });

      }).catch(function(){

        return caches.match("./index.html");

      });

    })
  );

});

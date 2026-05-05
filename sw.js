// =========================
// IBADAH OFFLINE SERVICE WORKER
// =========================

const IBADAH_STATIC_CACHE = "ibadah-static-v2";
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
  "./Images/royal-tasbih-bg.png",

  // Folder pages
  "./duapage/",
  "./duapage/index.html",
  "./dailyazkar/",
  "./dailyazkar/index.html",
  "./qazatracker/",
  "./qazatracker/index.html",
  "./tasbih/",
  "./tasbih/index.html"
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
// CHECK IF URL IS FOLDER PAGE
// =========================
function isIbadahFolderPage(pathname){

  return (
    pathname.endsWith("/duapage/") ||
    pathname.endsWith("/dailyazkar/") ||
    pathname.endsWith("/qazatracker/") ||
    pathname.endsWith("/tasbih/") ||
    pathname.endsWith("/duapage/index.html") ||
    pathname.endsWith("/dailyazkar/index.html") ||
    pathname.endsWith("/qazatracker/index.html") ||
    pathname.endsWith("/tasbih/index.html")
  );

}

// =========================
// GET FOLDER PAGE CACHE KEY
// =========================
function getIbadahFolderCacheKey(pathname){

  if(pathname.endsWith("/duapage/") || pathname.endsWith("/duapage/index.html")){
    return "./duapage/index.html";
  }

  if(pathname.endsWith("/dailyazkar/") || pathname.endsWith("/dailyazkar/index.html")){
    return "./dailyazkar/index.html";
  }

  if(pathname.endsWith("/qazatracker/") || pathname.endsWith("/qazatracker/index.html")){
    return "./qazatracker/index.html";
  }

  if(pathname.endsWith("/tasbih/") || pathname.endsWith("/tasbih/index.html")){
    return "./tasbih/index.html";
  }

  return "./index.html";

}

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
  // 1) FOLDER PAGES MUST LOAD THEIR OWN INDEX.HTML
  // =========================
  if(
    request.mode === "navigate" &&
    isIbadahFolderPage(url.pathname)
  ){

    let folderCacheKey = getIbadahFolderCacheKey(url.pathname);

    event.respondWith(
      fetch(request).then(function(networkResponse){
        return caches.open(IBADAH_STATIC_CACHE).then(function(cache){
          cache.put(folderCacheKey, networkResponse.clone());
          return networkResponse;
        });
      }).catch(function(){
        return caches.match(folderCacheKey).then(function(cachedPage){
          return cachedPage || caches.match("./index.html");
        });
      })
    );

    return;

  }

  // =========================
  // 2) MAIN APP PAGE
  // =========================
  if(
    request.mode === "navigate" ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/" ||
    url.pathname.endsWith("/")
  ){

    event.respondWith(
      fetch(request).then(function(networkResponse){
        return caches.open(IBADAH_STATIC_CACHE).then(function(cache){
          cache.put("./index.html", networkResponse.clone());
          return networkResponse;
        });
      }).catch(function(){
        return caches.match("./index.html");
      })
    );

    return;

  }

  // =========================
  // 3) STATIC FILES / IMAGES / PDF / JSON / JS / CSS
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

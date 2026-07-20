const CACHE='edmarket-coupon-core-v101';
const SHELL=[
 './',
 './index.html',
 './styles.css?v=optimizacion-1',
 './app.js',
 './firebase-app.js',
 './manifest.webmanifest',
 './assets/logo.png',
 './assets/icon-192.png',
 './assets/icon-512.png',
 './assets/s25-ultra-silverblue.png'
];

self.addEventListener('install',event=>{
 self.skipWaiting();
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
});

self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([
   caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
   self.clients.claim()
 ]));
});

self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;

 if(event.request.mode==='navigate'){
   event.respondWith(
     fetch(event.request,{cache:'no-store'})
       .then(response=>{
         const copy=response.clone();
         caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
         return response;
       })
       .catch(()=>caches.match('./index.html'))
   );
   return;
 }

 const url=new URL(event.request.url);
 if(/\.(?:js|css)$/.test(url.pathname)){
   event.respondWith(
     fetch(event.request,{cache:'no-store'})
       .then(response=>{
         const copy=response.clone();
         caches.open(CACHE).then(cache=>cache.put(event.request,copy));
         return response;
       })
       .catch(()=>caches.match(event.request))
   );
   return;
 }

 if(event.request.destination==='image'||event.request.destination==='font'){
   event.respondWith(
     caches.match(event.request).then(cached=>{
       const network=fetch(event.request).then(response=>{
         if(response.ok){
           const copy=response.clone();
           caches.open(CACHE).then(cache=>cache.put(event.request,copy));
         }
         return response;
       }).catch(()=>cached);
       return cached||network;
     })
   );
   return;
 }

 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});

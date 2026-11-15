// Jokko – cache hors ligne. Incrémenter V à chaque mise en ligne.
const V = 'jokko-v10';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(['./','maquettes.html','gabarits.html','labo.html','ia.html','tarifs.html','connexion.html','modeles.html','a-propos.html','contact.html','confidentialite.html','app.css','mockup.js','dieline.js'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== V).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
// Réponse immédiate depuis le cache, mise à jour en arrière-plan.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(c => c.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })));
});

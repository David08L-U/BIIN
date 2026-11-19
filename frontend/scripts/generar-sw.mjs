import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve, relative } from 'node:path'
const dist = resolve('dist')
async function listar(dir) {
  const archivos = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = resolve(dir, e.name)
    if (e.isDirectory()) archivos.push(...(await listar(p)))
    else if (e.name !== 'sw.js' && !e.name.endsWith('.map')) archivos.push(p)
  }
  return archivos
}
const archivos = await listar(dist),
  urls = archivos.map((p) => '/' + relative(dist, p).replaceAll('\\', '/'))
const hash = createHash('sha256')
for (const p of archivos.sort()) hash.update(await readFile(p))
const version = 'biin-shell-' + hash.digest('hex').slice(0, 12)
await writeFile(
  resolve(dist, 'sw.js'),
  `
const CACHE=${JSON.stringify(version)};
const FILES=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('biin-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(c=>c.match('/index.html'))));return;
 }
 if(FILES.includes(url.pathname))event.respondWith(caches.open(CACHE).then(async c=>(await c.match(url.pathname))||fetch(event.request)));
});
`,
)
console.log(
  `PWA: ${urls.length} recursos de interfaz listos para consulta offline.`,
)

import { readFile, access } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'
import assert from 'node:assert/strict'
const sw = await readFile('dist/sw.js', 'utf8'),
  handlers = {}
const cached = []
runInNewContext(sw, {
  URL,
  fetch: async () => {
    throw new Error('Sin conexión')
  },
  caches: {
    open: async () => ({
      addAll: async (files) => cached.push(...files),
      match: async (url) =>
        url === '/index.html' ? { shell: true } : undefined,
    }),
    keys: async () => [],
  },
  self: {
    location: { origin: 'https://biin.test' },
    addEventListener: (name, fn) => {
      handlers[name] = fn
    },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  },
})
await new Promise((resolve, reject) =>
  handlers.install({ waitUntil: (p) => p.then(resolve, reject) }),
)
assert(cached.includes('/index.html'))
assert(cached.includes('/manifest.webmanifest'))
assert(cached.some((u) => u.includes('LoginPage') && u.endsWith('.js')))
for (const url of cached) await access(`dist${url}`)
let response
handlers.fetch({
  request: {
    url: 'https://biin.test/mi-viaje',
    method: 'GET',
    mode: 'navigate',
  },
  respondWith: (p) => {
    response = p
  },
})
assert.equal(
  (await response).shell,
  true,
  'La navegación offline debe devolver la interfaz guardada',
)
for (const request of [
  { url: 'https://biin.test/api/auth/yo', method: 'GET', mode: 'cors' },
  { url: 'https://biin.test/api/auth/login', method: 'POST', mode: 'cors' },
  {
    url: 'https://tile.openstreetmap.org/4/1/2.png',
    method: 'GET',
    mode: 'cors',
  },
]) {
  let intercepted = false
  handlers.fetch({
    request,
    respondWith: () => {
      intercepted = true
    },
  })
  assert.equal(intercepted, false, `No interceptar ${request.url}`)
}
console.log(
  `PWA verificada: ${cached.length} recursos presentes, navegación offline, API y mapas excluidos.`,
)

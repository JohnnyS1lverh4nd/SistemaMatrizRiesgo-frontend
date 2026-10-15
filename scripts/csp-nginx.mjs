// Genera la cabecera Content-Security-Policy para Nginx a partir de la SPA
// generada (.output/public). Se ejecuta en el Dockerfile después de
// "nuxt generate".
//
// Nuxt incluye scripts en línea (importmap, modo claro/oscuro y la
// configuración window.__NUXT__, que cambia en cada build): en lugar de
// permitir cualquier script en línea ('unsafe-inline'), se permite solo el
// hash SHA-256 de cada uno de ellos.
//
//   node scripts/csp-nginx.mjs .output/public > 00-csp.conf

import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const raiz = process.argv[2] ?? '.output/public'

function paginas(directorio) {
  return readdirSync(directorio).flatMap((nombre) => {
    const ruta = join(directorio, nombre)
    if (statSync(ruta).isDirectory()) {
      return nombre === '_nuxt' ? [] : paginas(ruta)
    }
    return nombre.endsWith('.html') ? [ruta] : []
  })
}

// Scripts en línea ejecutables: sin src y sin un type de datos (JSON).
const scriptEnLinea = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g
const tiposDeDatos = /type="application\/(?:ld\+)?json"/

const hashes = new Set()
for (const pagina of paginas(raiz)) {
  for (const [, atributos, contenido] of readFileSync(pagina, 'utf8').matchAll(scriptEnLinea)) {
    if (!tiposDeDatos.test(atributos) && contenido.length > 0) {
      hashes.add(`'sha256-${createHash('sha256').update(contenido, 'utf8').digest('base64')}'`)
    }
  }
}

if (hashes.size === 0) {
  console.error('No se encontraron scripts en línea: ¿se ejecutó "nuxt generate"?')
  process.exit(1)
}

const politica = [
  `default-src 'self'`,
  `script-src 'self' ${[...hashes].sort().join(' ')}`,
  // Nuxt UI inyecta las variables de color en un <style> al arrancar.
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob:`,
  `font-src 'self' data:`,
  `connect-src 'self'`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
].join('; ')

// Variable $csp para default.conf (repo de la API). El map siempre devuelve
// el valor por defecto: es la forma de definir una constante en el bloque http.
process.stdout.write(
  `# Generado por scripts/csp-nginx.mjs en la construcción de la imagen.\n`
  + `map $request_method $csp {\n    default "${politica}";\n}\n`,
)
console.error(`CSP: ${hashes.size} hash(es) de scripts en línea.`)

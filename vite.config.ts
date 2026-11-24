import { defineConfig } from 'vite';

// Se publica en GitHub Pages bajo https://<usuario>.github.io/sazon/,
// así que todos los assets deben resolverse con ese prefijo.
export default defineConfig({
  base: '/sazon/',
});

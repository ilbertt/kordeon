import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  // `cloudflare` runs the app in the Workers runtime (so `cloudflare:workers` bindings
  // like D1 resolve in dev and build); prerender still emits the pages as static assets,
  // so page views are served from the edge and only server functions hit compute.
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({ prerender: { enabled: true } }),
    viteReact(),
  ],
});

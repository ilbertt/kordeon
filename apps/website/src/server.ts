// Custom Cloudflare entry: serves the Markdown mirror at /index.md (bundled via ?raw so it
// resolves during the prerender build too) and delegates everything else to the TanStack
// Start handler, which serves prerendered pages and runs server functions. `/` isn't
// intercepted, so the platform serves the prerendered homepage straight from static assets —
// no per-view compute. Bindings are typed by `wrangler types` (bun run cf-typegen).
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import indexMarkdown from '../public/index.md?raw';

const startFetch = createStartHandler(defaultStreamHandler);
const MARKDOWN_MIRROR = '/index.md';

export default {
  fetch(request) {
    if (new URL(request.url).pathname === MARKDOWN_MIRROR) {
      return new Response(indexMarkdown, {
        headers: { 'content-type': 'text/markdown; charset=utf-8' },
      });
    }
    return startFetch(request);
  },
} satisfies ExportedHandler<Env>;

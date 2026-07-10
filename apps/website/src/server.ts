// Custom Cloudflare entry. The homepage is prerendered to static HTML and mirrored as Markdown
// for AI agents, exposed both at /index.md and by content-negotiating the homepage itself.
// `run_worker_first: ["/"]` routes the homepage through here so we can inspect `Accept`; every
// other path (the /index.md mirror, hashed assets) is served straight from static assets, and
// server functions fall through to the Start handler. Bindings: `wrangler types` (bun run cf:typegen).

import { env } from 'cloudflare:workers';
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import indexMarkdown from '../public/index.md?raw';

const startFetch = createStartHandler(defaultStreamHandler);

function markdownMirror(): Response {
  return new Response(indexMarkdown, {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  });
}

function acceptsMarkdown(request: Request): boolean {
  return (request.headers.get('accept') ?? '').includes('text/markdown');
}

export default {
  async fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === '/index.md') {
      return markdownMirror();
    }
    if (pathname === '/') {
      if (acceptsMarkdown(request)) {
        return markdownMirror();
      }
      // Hand back the prerendered homepage from static assets — no per-view render. During the
      // prerender build those assets don't exist yet, so ASSETS 404s and we render on the fly.
      const prerendered = await env.ASSETS.fetch(request);
      return prerendered.ok ? prerendered : startFetch(request);
    }
    return startFetch(request);
  },
} satisfies ExportedHandler<Env>;

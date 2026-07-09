// Custom Cloudflare entry. It keeps the Markdown-mirror content negotiation (agents that
// send `Accept: text/markdown` — Claude Code, Cursor, … — get the Markdown at the canonical
// URL) and otherwise delegates to the TanStack Start handler, which serves the prerendered
// pages and runs server functions (see src/lib/subscribe.ts). Bindings are typed by
// `wrangler types` (bun run cf-typegen -> worker-configuration.d.ts).
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server';
import indexMarkdown from '../public/index.md?raw';

const startFetch = createStartHandler(defaultStreamHandler);

const MARKDOWN_MIRROR = '/index.md';
const MARKDOWN_LINK = `<${MARKDOWN_MIRROR}>; rel="alternate"; type="text/markdown"`;
const NOT_FOUND = 404;

function wantsMarkdown(request: Request) {
  return (request.headers.get('accept') ?? '').includes('text/markdown');
}

// The mirror is bundled (not fetched from ASSETS) so it resolves during the prerender
// build too, when the client assets don't exist yet.
function markdownResponse() {
  return new Response(indexMarkdown, {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      link: MARKDOWN_LINK,
      vary: 'Accept',
    },
  });
}

export default {
  // biome-ignore lint/complexity/useMaxParams: Cloudflare's fetch handler signature is (request, env, ctx)
  async fetch(request, env, _ctx) {
    const base = new URL(request.url);

    if (base.pathname === MARKDOWN_MIRROR || (base.pathname === '/' && wantsMarkdown(request))) {
      return markdownResponse();
    }

    if (base.pathname === '/') {
      // Serve the prerendered homepage straight from the edge — no compute per view. During
      // the prerender build the asset doesn't exist yet, so fall back to SSR to generate it.
      // Advertise the mirror and vary the cache on Accept either way.
      let response = await env.ASSETS.fetch(request);
      if (response.status === NOT_FOUND) {
        response = await startFetch(request);
      }
      response = new Response(response.body, response);
      response.headers.set('Vary', 'Accept');
      response.headers.set('Link', MARKDOWN_LINK);
      return response;
    }

    // Everything else (server functions, dynamic routes) → TanStack Start.
    return startFetch(request);
  },
} satisfies ExportedHandler<Env>;

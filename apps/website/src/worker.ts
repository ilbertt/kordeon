// Content negotiation for AI agents. The landing page has a plain-Markdown mirror at
// /index.md (see apps/website/public/index.md). Agents that send `Accept: text/markdown`
// — Claude Code, Cursor, OpenCode, … — get that Markdown at the canonical URL; browsers
// get the app. This Worker runs only for `/` and `/index.md` (`run_worker_first` in
// wrangler.jsonc); every other asset is served straight from the edge, untouched.
//
// Typed against @cloudflare/workers-types via tsconfig.worker.json, so `Request`,
// `Response`, `Fetcher` and `ExportedHandler` are the Workers runtime globals.

interface Env {
  ASSETS: Fetcher;
}

const MARKDOWN_MIRROR = '/index.md';
const MARKDOWN_LINK = `<${MARKDOWN_MIRROR}>; rel="alternate"; type="text/markdown"`;

function wantsMarkdown(request: Request) {
  return (request.headers.get('accept') ?? '').includes('text/markdown');
}

async function markdownResponse({ env, base }: { env: Env; base: URL }) {
  const asset = await env.ASSETS.fetch(new URL(MARKDOWN_MIRROR, base));
  return new Response(asset.body, {
    status: asset.status,
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      link: MARKDOWN_LINK,
      vary: 'Accept',
    },
  });
}

export default {
  // biome-ignore lint/complexity/useMaxParams: Cloudflare's fetch handler signature is (request, env, ctx)
  async fetch(request, env) {
    const base = new URL(request.url);

    if (base.pathname === MARKDOWN_MIRROR || (base.pathname === '/' && wantsMarkdown(request))) {
      return markdownResponse({ env, base });
    }

    // Non-Markdown client on `/`: serve the app, but advertise the mirror and vary the
    // cache on Accept so browsers and agents don't share a cached variant.
    if (base.pathname === '/') {
      const app = await env.ASSETS.fetch(request);
      const res = new Response(app.body, app);
      res.headers.set('Vary', 'Accept');
      res.headers.set('Link', MARKDOWN_LINK);
      return res;
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

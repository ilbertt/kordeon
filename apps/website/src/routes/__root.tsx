import appCss from '@repo/ui/globals.css?url';
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import { themeScript } from '#lib/theme-script';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'kordeon — Where humans collaborate and agents execute' },
      {
        name: 'description',
        content:
          'Chat and refine the plan together, hand it off to an AI agent, and watch the preview come to life. Where humans collaborate and agents execute.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  notFoundComponent: () => (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-2 p-6">
      <h1 className="font-semibold text-2xl">404</h1>
      <p className="text-muted-foreground">The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inline theme init must run before paint to avoid a flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

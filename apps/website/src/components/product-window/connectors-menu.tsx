// Owner: chat panel — see product-window ownership. The composer's `+` opens
// this; it pitches kordeon's connectors so the agent can pull context from the
// tools a team already uses. Connecting is local-only, just for feel (nothing is
// wired up), matching the rest of the demo. `open` + `connected` live here so the
// popover is a drop-in for the message bar's old static `+` icon.
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { Check, Plus, Sparkles } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

type Connector = {
  id: string;
  name: string;
  detail: string;
  icon: ReactNode;
};

// The classic three, brand-marked so they read at a glance. More arrive over
// time — the point of the popover is "connect as many as you want".
const CONNECTORS: Connector[] = [
  { id: 'gmail', name: 'Gmail', detail: 'Threads, contacts & files', icon: <GmailIcon /> },
  { id: 'slack', name: 'Slack', detail: 'Messages & channels', icon: <SlackIcon /> },
  { id: 'github', name: 'GitHub', detail: 'Repos, issues & PRs', icon: <GitHubIcon /> },
];

const COMING_SOON = ['Notion', 'Linear', 'Google Drive', 'Figma', 'Jira'];

export function ConnectorsButton() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  // Dismiss on outside click or Escape — the popover has no backdrop so the rest
  // of the composer stays live behind it.
  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = (id: string) => setConnected((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Connect a tool"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          open && 'bg-muted text-foreground',
        )}
      >
        <Plus className="size-4" />
      </button>
      {open ? (
        <ConnectorsMenu connected={connected} onToggle={toggle} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  );
}

function ConnectorsMenu({
  connected,
  onToggle,
  onClose,
}: {
  connected: Record<string, boolean>;
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Connect your tools"
      className="absolute bottom-full left-0 z-30 mb-2 w-80 max-w-[calc(100vw-3rem)] rounded-lg border border-border bg-card p-3 shadow-lg"
    >
      <div className="font-medium text-sm">Connect your tools</div>
      <p className="mt-0.5 mb-3 text-pretty text-muted-foreground text-xs leading-relaxed">
        Give Korde context from the apps your team already uses. Connect as many as you like.
      </p>
      <div className="space-y-1">
        {CONNECTORS.map((connector) => {
          const isConnected = Boolean(connected[connector.id]);
          return (
            <button
              key={connector.id}
              type="button"
              onClick={() => onToggle(connector.id)}
              className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                {connector.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-sm">{connector.name}</span>
                <span className="block truncate text-muted-foreground text-xs">
                  {connector.detail}
                </span>
              </span>
              {isConnected ? (
                <span className="flex shrink-0 items-center gap-1 font-medium text-primary text-xs">
                  <Check className="size-3.5" />
                  Connected
                </span>
              ) : (
                <span className="shrink-0 rounded-md border border-border px-2 py-1 font-medium text-xs">
                  Connect
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 border-border border-t pt-3">
        <div className="flex items-center gap-1.5 font-medium text-[0.65rem] text-muted-foreground uppercase tracking-wide">
          <Sparkles className="size-3" />
          Many more coming
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {COMING_SOON.map((name) => (
            <span
              key={name}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[0.7rem] text-muted-foreground"
            >
              {name}
            </span>
          ))}
          <span className="px-0.5 py-0.5 text-[0.7rem] text-muted-foreground">& many more</span>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

// Brand marks — lucide dropped its brand icons, so the classic connectors are
// inlined. Gmail and Slack keep their brand colors; the GitHub octocat rides
// `currentColor` so it reads in both themes.
function GmailIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <title>Gmail</title>
      <path fill="#4285F4" d="M45 12.298V37a3 3 0 0 1-3 3h-7V23.7l10-7.5z" />
      <path fill="#34A853" d="M3 12.298V37a3 3 0 0 0 3 3h7V23.7l-10-7.5z" />
      <path fill="#EA4335" d="M35 11.2 24 19.45 13 11.2v12.5l11 8.25 11-8.25z" />
      <path fill="#FBBC04" d="M3 12.298V16.2l10 7.5V11.2L9.876 8.859A4.298 4.298 0 0 0 3 12.298z" />
      <path
        fill="#C5221F"
        d="M45 12.298V16.2l-10 7.5V11.2l3.124-2.341A4.298 4.298 0 0 1 45 12.298z"
      />
    </svg>
  );
}

function SlackIcon() {
  return (
    <svg viewBox="0 0 122.8 122.8" className="size-4" aria-hidden="true">
      <title>Slack</title>
      <path
        fill="#E01E5A"
        d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z"
      />
      <path
        fill="#36C5F0"
        d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z"
      />
      <path
        fill="#2EB67D"
        d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z"
      />
      <path
        fill="#ECB22E"
        d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 98 96" className="size-5 text-foreground" aria-hidden="true">
      <title>GitHub</title>
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      />
    </svg>
  );
}

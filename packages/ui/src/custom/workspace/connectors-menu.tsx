'use client';

// The composer's `+` opens this; it pitches kordeon's connectors so the agent
// can pull context from the tools a team already uses. The live connectors
// toggle Connect ⇄ Connected (local-only, just for feel like the rest of the
// demo); the rest render as the same row, greyed and disabled, to say "many
// more coming". Connected state lives here so it survives closing the popover.
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@repo/ui/components/popover';
import { cn } from '@repo/ui/lib/utils';
import { Check, Plus } from 'lucide-react';
import { type ReactNode, useState } from 'react';

type Connector = {
  id: string;
  name: string;
  detail: string;
  icon: ReactNode;
};

const LIVE: Connector[] = [
  { id: 'gmail', name: 'Gmail', detail: 'Threads, contacts & files', icon: <GmailIcon /> },
  { id: 'slack', name: 'Slack', detail: 'Messages & channels', icon: <SlackIcon /> },
  { id: 'github', name: 'GitHub', detail: 'Repos, issues & PRs', icon: <GitHubIcon /> },
];

const COMING_SOON: Pick<Connector, 'id' | 'name' | 'icon'>[] = [
  { id: 'notion', name: 'Notion', icon: <NotionIcon /> },
  { id: 'linear', name: 'Linear', icon: <LinearIcon /> },
  { id: 'drive', name: 'Google Drive', icon: <GoogleDriveIcon /> },
];

export function ConnectorsButton() {
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setConnected((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Connect a tool"
        className={cn(
          'flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          'data-[popup-open]:bg-muted data-[popup-open]:text-foreground',
        )}
      >
        <Plus className="size-4" />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        aria-label="Connect your tools"
        className="w-80 max-w-[calc(100vw-3rem)] gap-0"
      >
        <PopoverHeader className="gap-0.5 px-1">
          <PopoverTitle>Connect your tools</PopoverTitle>
          <PopoverDescription>Give Korde context from your team's tools.</PopoverDescription>
        </PopoverHeader>
        <div className="mt-2 space-y-0.5">
          {LIVE.map((connector) => (
            <LiveRow
              key={connector.id}
              connector={connector}
              connected={Boolean(connected[connector.id])}
              onToggle={() => toggle(connector.id)}
            />
          ))}
        </div>
        <div className="mt-2 border-border border-t pt-2">
          <div className="px-1 pb-1 font-medium text-[0.7rem] text-muted-foreground">
            Coming soon
          </div>
          <div className="space-y-0.5">
            {COMING_SOON.map((connector) => (
              <SoonRow key={connector.id} name={connector.name} icon={connector.icon} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function LiveRow({
  connector,
  connected,
  onToggle,
}: {
  connector: Connector;
  connected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-muted"
    >
      <IconTile>{connector.icon}</IconTile>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-sm leading-tight">{connector.name}</span>
        <span className="block truncate text-muted-foreground text-xs">{connector.detail}</span>
      </span>
      {connected ? (
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
}

function SoonRow({ name, icon }: { name: string; icon: ReactNode }) {
  return (
    <div className="flex w-full items-center gap-2.5 rounded-md p-1.5 opacity-60">
      <IconTile muted>{icon}</IconTile>
      <span className="min-w-0 flex-1 font-medium text-muted-foreground text-sm">{name}</span>
      <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[0.7rem] text-muted-foreground">
        Soon
      </span>
    </div>
  );
}

function IconTile({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background',
        muted && 'text-muted-foreground',
      )}
    >
      {children}
    </span>
  );
}

// Brand marks — lucide dropped its brand icons, so the connectors are inlined.
// Gmail and Slack keep their brand colors; the monochrome marks (GitHub and the
// coming-soon set) ride `currentColor` so they read in both themes and grey out
// cleanly when disabled. Coming-soon paths are the canonical Simple Icons marks.
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
    <svg
      viewBox="0 0 98 96"
      className="size-5 text-foreground"
      fill="currentColor"
      aria-hidden="true"
    >
      <title>GitHub</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      />
    </svg>
  );
}

function NotionIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <title>Notion</title>
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
    </svg>
  );
}

function LinearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <title>Linear</title>
      <path d="M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z" />
    </svg>
  );
}

function GoogleDriveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <title>Google Drive</title>
      <path d="M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167h-7.249z" />
    </svg>
  );
}

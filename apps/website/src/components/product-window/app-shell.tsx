import { Button, buttonVariants } from '@repo/ui/components/button';
import { ThemeToggle } from '@repo/ui/custom/theme-toggle';
import { WorkspaceProvider } from '@repo/ui/custom/workspace/context';
import { PreviewPane } from '@repo/ui/custom/workspace/preview-pane';
import { Sidebar } from '@repo/ui/custom/workspace/sidebar';
import { Thread } from '@repo/ui/custom/workspace/thread';
import { WorkspaceLayout } from '@repo/ui/custom/workspace/workspace-layout';
import { ArrowRight, Sparkles, Workflow } from 'lucide-react';
import { CollabPrompt } from '#components/collab-prompt';
import { type ChannelSlug, channels, MENTION_SUGGESTIONS, PEOPLE } from './data';
import { PreviewContent } from './preview-content';

// The collaborate composer is a landing-only device, so the reusable Thread
// takes it as a render prop rather than importing it.
const renderComposerPrompt = ({
  editable,
  onText,
  label,
}: {
  editable: boolean;
  onText: (text: string) => void;
  label?: string;
}) => <CollabPrompt onText={onText} editable={editable} label={label} />;

export function AppShell({ activeSlug }: { activeSlug: ChannelSlug }) {
  return (
    <WorkspaceProvider people={PEOPLE} currentUserId="you" mentionSuggestions={MENTION_SUGGESTIONS}>
      <WorkspaceLayout
        topBar={<TopBar />}
        sidebar={<Sidebar channels={channels} activeSlug={activeSlug} />}
      >
        {channels.map((channel) => (
          <Thread
            key={channel.slug}
            channel={channel}
            active={channel.slug === activeSlug}
            renderComposerPrompt={renderComposerPrompt}
          />
        ))}
        {channels.map((channel) => (
          <PreviewPane key={channel.slug} active={channel.slug === activeSlug}>
            <PreviewContent channel={channel} />
          </PreviewPane>
        ))}
      </WorkspaceLayout>
    </WorkspaceProvider>
  );
}

const REPO_URL = 'https://github.com/ilbertt/kordeon';

// lucide-react no longer ships brand marks, so the GitHub logo is inlined.
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.93.43.37.81 1.1.81 2.22 0 1.61-.01 2.9-.01 3.29 0 .32.21.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  );
}

function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-border border-b px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Workflow className="size-4" />
        </span>
        <span className="font-semibold tracking-tight">kordeon</span>
      </div>
      <div className="flex items-center gap-3">
        {/* A nod to the readers we can't see: agents get a plain-Markdown edition of this
            page (served by content negotiation too — see src/worker.ts). */}
        <a
          href="/index.md"
          target="_blank"
          rel="noreferrer"
          title="Read this page as Markdown — written for your AI agent"
          className="hidden items-center gap-1.5 rounded-full border border-border py-1 pr-2.5 pl-2 font-medium text-muted-foreground text-xs transition-colors hover:bg-muted hover:text-foreground lg:inline-flex"
        >
          <Sparkles className="size-3.5 text-primary" />
          For your AI agent
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="kordeon on GitHub"
          className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
        >
          <GithubIcon />
        </a>
        <ThemeToggle />
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
          Sign in
        </Button>
        <Button size="sm">
          Get started — free
          <ArrowRight />
        </Button>
      </div>
    </header>
  );
}

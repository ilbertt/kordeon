import type { Channel, Message } from '@repo/domain/workspace';
import { buttonVariants } from '@repo/ui/components/button';
import { GithubIcon } from '@repo/ui/custom/github-icon';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { ThemeToggle } from '@repo/ui/custom/theme-toggle';
import { WorkspaceProvider } from '@repo/ui/custom/workspace/context';
import { PreviewPane } from '@repo/ui/custom/workspace/preview-pane';
import { Sidebar } from '@repo/ui/custom/workspace/sidebar';
import { Thread, type VisitorReply } from '@repo/ui/custom/workspace/thread';
import { WorkspaceLayout } from '@repo/ui/custom/workspace/workspace-layout';
import { ArrowRight, Home, type LucideIcon, Sparkles } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { CollabPrompt } from '#components/collab-prompt';
import { subscribe } from '#lib/subscribe';
import { setVisitorEmail, useVisitorEmail } from '#lib/visitor-email';
import {
  addDynamicChannel,
  ChannelSlug,
  channelBySlug,
  channels,
  createChannel,
  getDynamicChannels,
  getDynamicChannelsServerSnapshot,
  MENTION_SUGGESTIONS,
  OPEN_SOURCE_STAR_MESSAGE_ID,
  PEOPLE,
  REPO_URL,
  subscribeDynamicChannels,
} from './data';
import { GithubStar } from './github-star';
import { PreviewContent } from './preview-content';

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const KORDE_REPLY_DELAY_MS = 700;

// Every message bar invites the waitlist the same way — the placeholder drops
// (reverting to the plain `Message #slug…`) once the visitor has joined.
const WAITLIST_PLACEHOLDER = 'Send your email to join the waitlist, or just send a message';

// Korde's ad-libs when a visitor sends something that isn't an email.
const NO_EMAIL_REPLIES = [
  'Ha — love the energy. But I run on email addresses, not vibes. Drop yours and you’re on the early-access list. 📮',
  'That’s the spirit! Now hit me with an email and I’ll ping you the second pricing’s ready. ✨',
  'Noted for the record. The record being: I still need your email to get you in. 😄',
  'Straight talk — no email, no early access. Paste one in and I’ve got you. 🙌',
] as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const kordeReply = (text: string): Message => ({
  id: crypto.randomUUID(),
  kind: 'msg',
  from: 'korde',
  text,
});

// Every channel captures the waitlist through the chat: a visitor who sends an
// email is subscribed (D1, via the subscribe server function) and remembered
// (localStorage, so the sidebar identity and the composer prompt pick it up).
// `rib` is set only on the dedicated waitlist channel, where a message without
// an email gets needled instead of landing in silence.
async function handleVisitorReply({
  text,
  rib,
}: {
  text: string;
  rib: boolean;
}): Promise<VisitorReply> {
  const email = text.match(EMAIL_PATTERN)?.[0];
  if (!email) {
    if (!rib) {
      return { replies: [] };
    }
    await sleep(KORDE_REPLY_DELAY_MS);
    const index = Math.floor(Math.random() * NO_EMAIL_REPLIES.length);
    return { replies: [kordeReply(NO_EMAIL_REPLIES[index] ?? NO_EMAIL_REPLIES[0])] };
  }
  await sleep(KORDE_REPLY_DELAY_MS);
  try {
    await subscribe({ data: email });
    setVisitorEmail(email);
    return {
      replies: [
        kordeReply(
          `You’re in — I’ve got ${email} on the early-access list. I’ll reach out the moment pricing lands. 🎉`,
        ),
      ],
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'that didn’t go through.';
    return { replies: [kordeReply(`Hmm — ${reason} Mind trying once more?`)] };
  }
}

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

// The rail and thread header show what each channel is *for* — cold visitors
// can't read the git-status metaphor, so the purpose icon leads instead.
const renderChannelIcon = (channel: Channel) => {
  const Icon = channelBySlug(channel.slug)?.icon ?? Home;
  return <Icon className="size-4 shrink-0" />;
};

// The agent's open-source reply carries a live GitHub star (real count, links
// out to the repo) — every other message renders plain.
const renderMessageExtra = (message: Message) =>
  message.id === OPEN_SOURCE_STAR_MESSAGE_ID ? <GithubStar /> : null;

export function AppShell({ activeSlug }: { activeSlug: string }) {
  // The visitor's waitlist email, if they've sent one. Drives the composer
  // placeholder (ask until joined) and the sidebar identity (name + email).
  const visitorEmail = useVisitorEmail();
  const askPlaceholder = visitorEmail ? undefined : WAITLIST_PLACEHOLDER;

  // Visitor-created channels are appended to the seeded list; they live only in
  // this session (see the dynamic registry in ./data).
  const dynamicChannels = useSyncExternalStore(
    subscribeDynamicChannels,
    getDynamicChannels,
    getDynamicChannelsServerSnapshot,
  );
  const allChannels = dynamicChannels.length ? [...channels, ...dynamicChannels] : channels;

  const handleCreateChannel = ({ name, icon }: { name: string; icon: LucideIcon }) => {
    const channel = createChannel({ name, icon });
    addDynamicChannel(channel);
    // Route to it like any channel — the hash change flips it active.
    window.location.hash = channel.slug;
  };

  return (
    <WorkspaceProvider people={PEOPLE} currentUserId="you" mentionSuggestions={MENTION_SUGGESTIONS}>
      <WorkspaceLayout
        topBar={<TopBar />}
        sidebar={
          <Sidebar
            channels={allChannels}
            activeSlug={activeSlug}
            renderIcon={renderChannelIcon}
            onCreateChannel={handleCreateChannel}
            email={visitorEmail ?? undefined}
          />
        }
      >
        {allChannels.map((channel) => {
          // Only the dedicated waitlist channel ribs a message that isn't an
          // email; everywhere else such a message just lands in silence.
          const rib = channel.slug === ChannelSlug.Pricing;
          return (
            <Thread
              key={channel.slug}
              channel={channel}
              active={channel.slug === activeSlug}
              animate
              renderComposerPrompt={renderComposerPrompt}
              renderIcon={renderChannelIcon}
              renderMessageExtra={renderMessageExtra}
              onVisitorReply={(value) => handleVisitorReply({ text: value.text, rib })}
              responderId="korde"
              placeholder={askPlaceholder}
            />
          );
        })}
        {allChannels.map((channel) => (
          <PreviewPane key={channel.slug} active={channel.slug === activeSlug}>
            <PreviewContent channel={channel} />
          </PreviewPane>
        ))}
      </WorkspaceLayout>
    </WorkspaceProvider>
  );
}

function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-border border-b px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-md bg-foreground">
          <KordeonMark className="size-4" />
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
          Tell your AI agent
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
        <a href={`#${ChannelSlug.Pricing}`} className={buttonVariants({ size: 'sm' })}>
          Get started — free
          <ArrowRight />
        </a>
      </div>
    </header>
  );
}

import type { Channel } from '@repo/domain/workspace';
import { WorkspaceProvider } from '@repo/ui/custom/workspace/context';
import { PreviewPane } from '@repo/ui/custom/workspace/preview-pane';
import { Sidebar } from '@repo/ui/custom/workspace/sidebar';
import { Thread } from '@repo/ui/custom/workspace/thread';
import { WorkspaceLayout } from '@repo/ui/custom/workspace/workspace-layout';
import type { ReactNode } from 'react';
import { CHANNELS, channelBySlug, type SceneChannel } from '#data/channels';
import { MENTION_SUGGESTIONS, PEOPLE } from '#data/people';
import { DashboardPreview, PreviewPlaceholder } from '#product-window/preview-content';
import { TopBar } from '#product-window/top-bar';

// The rail + thread header show what each channel is *for* (purpose icon), the
// same override the landing uses so cold viewers aren't shown the git glyph.
function renderChannelIcon(channel: Channel): ReactNode {
  const Icon = channelBySlug(channel.slug)?.icon;
  return Icon ? <Icon className="size-4 shrink-0" /> : null;
}

// Only the active channel is sliced to the current reveal; the rest are hidden,
// so their message count doesn't matter.
function sliceChannel({
  channel,
  active,
  visibleCount,
  typingId,
  compose,
}: {
  channel: SceneChannel;
  active: boolean;
  visibleCount?: number;
  typingId?: string;
  compose?: SceneChannel['compose'];
}): SceneChannel {
  if (!active) {
    return channel;
  }
  return {
    ...channel,
    compose: compose ?? channel.compose,
    typing: typingId,
    messages:
      visibleCount === undefined ? channel.messages : channel.messages.slice(0, visibleCount),
  };
}

function renderPreview({ channel, reveal }: { channel: SceneChannel; reveal: number }): ReactNode {
  if (channel.slug === 'activation-dashboard' || channel.slug === 'live-preview') {
    return <DashboardPreview reveal={reveal} />;
  }
  return <PreviewPlaceholder />;
}

export type ProductWindowProps = {
  activeSlug: string;
  visibleCount?: number;
  typingId?: string;
  compose?: SceneChannel['compose'];
  previewReveal?: number;
};

export function ProductWindow({
  activeSlug,
  visibleCount,
  typingId,
  compose,
  previewReveal = 1,
}: ProductWindowProps) {
  return (
    <WorkspaceProvider people={PEOPLE} currentUserId="you" mentionSuggestions={MENTION_SUGGESTIONS}>
      <WorkspaceLayout
        topBar={<TopBar />}
        sidebar={
          <Sidebar channels={CHANNELS} activeSlug={activeSlug} renderIcon={renderChannelIcon} />
        }
      >
        {CHANNELS.map((channel) => {
          const active = channel.slug === activeSlug;
          return (
            <Thread
              key={channel.slug}
              channel={sliceChannel({ channel, active, visibleCount, typingId, compose })}
              active={active}
              animate={false}
              renderIcon={renderChannelIcon}
            />
          );
        })}
        {CHANNELS.map((channel) => (
          <PreviewPane key={channel.slug} active={channel.slug === activeSlug}>
            {renderPreview({ channel, reveal: previewReveal })}
          </PreviewPane>
        ))}
      </WorkspaceLayout>
    </WorkspaceProvider>
  );
}

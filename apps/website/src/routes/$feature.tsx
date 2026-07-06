import { createFileRoute, notFound, redirect } from '@tanstack/react-router';
import { channelBySlug, DEFAULT_ID, Landing, metaFor } from '#components/landing';

export const Route = createFileRoute('/$feature')({
  beforeLoad: ({ params }) => {
    const channel = channelBySlug(params.feature);
    if (!channel) {
      throw notFound();
    }
    // The default feature is the homepage — keep a single canonical URL.
    if (channel.id === DEFAULT_ID) {
      throw redirect({ to: '/' });
    }
  },
  head: ({ params }) => {
    const channel = channelBySlug(params.feature);
    return channel ? metaFor(channel) : {};
  },
  component: Landing,
});

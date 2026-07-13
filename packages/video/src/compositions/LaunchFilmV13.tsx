import { filmV12DefaultProps } from '#compositions/LaunchFilmV12';

// Cut 13 — identical animation to cut 12 (reuses the LaunchFilmV12 component), only
// two copy tweaks: the chat caption no longer echoes "thread" (it now makes the
// point that the agent is in the conversation from the start), and the problem-scene
// PR title is generic ("the next feature") so it doesn't name — or draw attention
// to — the activation dashboard the product actually builds later.
export const filmV13DefaultProps: typeof filmV12DefaultProps = {
  ...filmV12DefaultProps,
  chatSubtitle: 'Agents are present from the first message.',
  pastTitle: 'The next feature',
};

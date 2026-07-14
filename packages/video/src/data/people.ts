import type { Person } from '@repo/domain/workspace';
import type { MentionSuggestion } from '@repo/ui/custom/mention/types';
import adaAvatar from '#assets/avatars/ada.svg';
import kordeAvatar from '#assets/avatars/korde.svg';
import mayaAvatar from '#assets/avatars/maya.svg';
import theoAvatar from '#assets/avatars/theo.svg';
import youAvatar from '#assets/avatars/you.svg';

// The cast for the launch film — a small product team plus the agent. Same shape
// and chart-token colors the landing uses (agent in teal `primary`), so presence
// reads identically to the real product. Single source of truth: everything
// references people by id.
export const PEOPLE = {
  maya: {
    id: 'maya',
    name: 'Maya',
    initials: 'MR',
    color: 'var(--chart-3)',
    kind: 'human',
    avatarUrl: mayaAvatar,
  },
  theo: {
    id: 'theo',
    name: 'Theo',
    initials: 'TK',
    color: 'var(--chart-4)',
    kind: 'human',
    avatarUrl: theoAvatar,
  },
  ada: {
    id: 'ada',
    name: 'Ada',
    initials: 'AL',
    color: 'var(--chart-5)',
    kind: 'human',
    avatarUrl: adaAvatar,
  },
  you: {
    id: 'you',
    name: 'You',
    initials: 'YO',
    color: 'var(--chart-2)',
    kind: 'human',
    avatarUrl: youAvatar,
  },
  korde: {
    id: 'korde',
    name: 'Korde',
    initials: 'KO',
    color: 'var(--primary)',
    kind: 'agent',
    avatarUrl: kordeAvatar,
  },
} satisfies Record<string, Person>;

export const MENTION_SUGGESTIONS: MentionSuggestion[] = Object.values(PEOPLE).map((person) => ({
  id: person.id,
  kind: 'person',
  label: person.name,
  token: `@${person.name}`,
  color: person.color,
  avatar: person.avatarUrl,
}));

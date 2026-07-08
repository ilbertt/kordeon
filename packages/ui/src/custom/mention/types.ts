import type { MentionKind } from '@repo/domain/workspace';

export type MentionSuggestion = {
  id: string;
  kind: MentionKind;
  // Shown in the menu and inside the pill (without the trigger character).
  label: string;
  // What the pill serialises to in the field's plain text (e.g. `@Maya`).
  token: string;
  detail?: string;
  // Person/agent dot colour and avatar — person kind only.
  color?: string;
  avatar?: string;
};

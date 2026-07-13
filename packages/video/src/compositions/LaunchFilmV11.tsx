import { filmV10DefaultProps } from '#compositions/LaunchFilmV10';

// Cut 11 — identical animation to cut 10 (reuses the LaunchFilmV10 component), only
// the pivot copy changes: the old lines were long and "with the agent listening the
// whole time" read as surveillance. Plan-together-first, agents as collaborators.
export const filmV11DefaultProps: typeof filmV10DefaultProps = {
  ...filmV10DefaultProps,
  pivotLine1: 'What if you could plan together first?',
  pivotLine2: 'Involving agents.',
};

import { ReactionPill } from '@repo/ui/custom/workspace/reaction-pill';
import { useState } from 'react';
import { useGithubStarCount } from '#hooks/use-github-star-count';
import { REPO_URL } from './data';

// A plain-looking ⭐ reaction under Korde's open-source message — same chip as
// every other reaction, so it reads as "react with a star". The count is the
// repo's real stargazer total; clicking it opens the repo in a new tab (so the
// visitor can actually star it) and toggles the reaction, exactly like the
// others. The open-tab is the deliberate side effect hiding behind the reaction.
export function GithubStar() {
  const stars = useGithubStarCount(REPO_URL);
  const [reacted, setReacted] = useState(false);
  const count = stars === null ? null : stars + (reacted ? 1 : 0);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <ReactionPill
        emoji="⭐"
        count={count}
        reacted={reacted}
        label={reacted ? 'Starred kordeon on GitHub' : 'Star kordeon on GitHub'}
        onClick={() => {
          window.open(REPO_URL, '_blank', 'noopener,noreferrer');
          setReacted((previous) => !previous);
        }}
      />
    </div>
  );
}

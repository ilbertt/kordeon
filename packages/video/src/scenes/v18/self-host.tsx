import { HERO_SLUG } from '#data/channels';
import { collabPlanPrompt } from '#scenes/film/collab-plan';
import { SLAB, SlabBeat } from '#scenes/v6/slab-beat';

// A closing statement beat: the product sits pulled back (the exact pose the finale
// opens on, so pullback → this → finale all blend the same slab) while one last
// caption makes the ownership point — right before the window folds into the logo.
export function SelfHostable({
  subtitle,
  phase,
  durationInFrames,
}: {
  subtitle: string;
  phase: number;
  durationInFrames: number;
}) {
  return (
    <SlabBeat
      pose={SLAB.pullback}
      phase={phase}
      product={{
        activeSlug: HERO_SLUG,
        visibleCount: 7,
        compose: 'built',
        previewState: 'dashboard',
        previewReveal: 1,
        renderComposerPrompt: collabPlanPrompt(false),
      }}
      caption={subtitle}
      captionStart={24}
      durationInFrames={durationInFrames}
    />
  );
}

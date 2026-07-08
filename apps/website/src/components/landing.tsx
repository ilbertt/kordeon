import { AppShell } from '#components/product-window/app-shell';
import { hasSectionHash, useActiveSlug } from '#components/product-window/use-active-slug';
import { ScrollStage } from '#components/scroll-stage';

export function Landing() {
  const activeSlug = useActiveSlug();

  return (
    <ScrollStage openFullOnLoad={hasSectionHash}>
      <AppShell activeSlug={activeSlug} />
    </ScrollStage>
  );
}

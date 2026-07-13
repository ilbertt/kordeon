import { useEffect } from 'react';
import { LogoMorphStage } from '#components/logo-morph-stage';
import { AppShell } from '#components/product-window/app-shell';
import {
  clearActiveChannel,
  hasSectionHash,
  useActiveSlug,
} from '#components/product-window/use-active-slug';

export function Landing() {
  const activeSlug = useActiveSlug();

  // Scrolling back up to the headline returns to the intro, so the deep-linked
  // feature is dropped — the reset product returns to the default welcome
  // instead of keeping whatever channel was last open.
  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY <= 0) {
        clearActiveChannel();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <LogoMorphStage openFullOnLoad={hasSectionHash}>
      <AppShell activeSlug={activeSlug} />
    </LogoMorphStage>
  );
}

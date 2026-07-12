import { buttonVariants } from '@repo/ui/components/button';
import { GithubIcon } from '@repo/ui/custom/github-icon';
import { KordeonMark } from '@repo/ui/custom/kordeon-mark';
import { ArrowRight, Sparkles } from 'lucide-react';

// The product chrome, faithful to the real app shell — brand lockup on the left,
// the same actions on the right. Static here: nothing is interactive in a render.
export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-border border-b px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-md bg-foreground">
          <KordeonMark className="size-4" />
        </span>
        <span className="font-semibold tracking-tight">kordeon</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border py-1 pr-2.5 pl-2 font-medium text-muted-foreground text-xs">
          <Sparkles className="size-3.5 text-primary" />
          Tell your AI agent
        </span>
        <span className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}>
          <GithubIcon />
        </span>
        <span className={buttonVariants({ size: 'sm' })}>
          Get started — free
          <ArrowRight />
        </span>
      </div>
    </header>
  );
}

import type { ReactNode } from 'react';
import { WorkspacePanelsProvider } from './workspace-ui';

export function WorkspaceLayout({
  topBar,
  sidebar,
  children,
}: {
  topBar: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <WorkspacePanelsProvider>
      <div className="flex h-full flex-col bg-background text-foreground">
        {topBar}
        {/* The panel row anchors the mobile drawers: below their breakpoints the
            sidebar and preview slide over this box instead of taking flow space. */}
        <div className="relative flex min-h-0 flex-1">
          {sidebar}
          {children}
        </div>
      </div>
    </WorkspacePanelsProvider>
  );
}

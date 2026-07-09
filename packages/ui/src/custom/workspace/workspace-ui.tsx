import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

// Which side panel is surfaced as an overlay on narrow viewports. The wide
// layout keeps both panels in flow, so this is purely the mobile/tablet story:
// the explorer and preview collapse behind toggles and open one at a time.
export type WorkspacePanel = 'sidebar' | 'preview';

type WorkspacePanelsValue = {
  openPanel: WorkspacePanel | null;
  open: (panel: WorkspacePanel) => void;
  close: () => void;
};

const WorkspacePanelsContext = createContext<WorkspacePanelsValue | null>(null);

export function WorkspacePanelsProvider({ children }: { children: ReactNode }) {
  const [openPanel, setOpenPanel] = useState<WorkspacePanel | null>(null);

  useEffect(() => {
    if (!openPanel) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenPanel(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openPanel]);

  const value = useMemo<WorkspacePanelsValue>(
    () => ({
      openPanel,
      open: (panel) => setOpenPanel(panel),
      close: () => setOpenPanel(null),
    }),
    [openPanel],
  );

  return (
    <WorkspacePanelsContext.Provider value={value}>{children}</WorkspacePanelsContext.Provider>
  );
}

export function useWorkspacePanels(): WorkspacePanelsValue {
  const value = useContext(WorkspacePanelsContext);
  if (!value) {
    throw new Error('useWorkspacePanels must be used within a WorkspacePanelsProvider');
  }
  return value;
}

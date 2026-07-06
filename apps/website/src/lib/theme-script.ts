/**
 * Inline script meant to run in <head> before first paint, so the right theme is
 * applied with no flash. The server can't know the client's preference, and a
 * React effect runs only after paint — so this small synchronous script bridges
 * the gap (the same approach next-themes uses internally). A persisted choice
 * wins; otherwise we follow the system setting.
 */
export const themeScript = `(() => {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    if (stored === 'dark' || (!stored && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch {}
})();`;

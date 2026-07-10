import { useEffect, useState } from 'react';

// A repo's live stargazer count from the public GitHub API (CORS-open, so it runs
// straight from the browser — no token, no server hop). Returns null until it
// resolves, and stays null if the request fails (offline / rate-limited), so the
// caller can render without a count rather than blocking on it.
export function useGithubStarCount(repoUrl: string) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    const api = repoUrl.replace('github.com/', 'api.github.com/repos/');
    fetch(api, { headers: { Accept: 'application/vnd.github+json' } })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const stars = (data as { stargazers_count?: number } | null)?.stargazers_count;
        if (cancelled || typeof stars !== 'number') {
          return;
        }
        setCount(stars);
      })
      .catch(() => {
        // Swallow — a missing count just renders the pill without a number.
      });
    return () => {
      cancelled = true;
    };
  }, [repoUrl]);
  return count;
}

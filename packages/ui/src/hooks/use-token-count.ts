import { useEffect, useMemo, useState } from 'react';

// Real token counting for the demo prompt. The BPE table is large, so we
// code-split it out of the initial bundle and lazy-load it in an effect,
// falling back to a rough char estimate until it arrives. The product will
// count against the model's own tokenizer server-side; this keeps the number
// on the landing page honest rather than invented.
type Encoder = (text: string) => number[];

const CHARS_PER_TOKEN = 4;

export function useTokenCount(text: string): number {
  const [encode, setEncode] = useState<Encoder | null>(null);

  useEffect(() => {
    let alive = true;
    import('gpt-tokenizer/encoding/o200k_base')
      .then((mod) => {
        if (alive) {
          setEncode(() => mod.encode);
        }
      })
      // Keep the char-based estimate if the chunk fails to load.
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return useMemo(
    () => (encode ? encode(text).length : Math.ceil(text.length / CHARS_PER_TOKEN)),
    [encode, text],
  );
}

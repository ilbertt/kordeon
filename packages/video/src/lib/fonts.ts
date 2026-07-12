import { loadFont } from '@remotion/google-fonts/Inter';
import type { CSSProperties } from 'react';

// A pinned webfont renders identically on every machine (the render skill's
// recommendation over system fonts) and matches the product's clean sans look.
export const { fontFamily } = loadFont();

// Apply at each composition root: sets both the inherited `fontFamily` and the
// theme's `--font-sans` var, so the whole frame — chrome and the product window,
// which reads the var — shares one typeface.
export const fontStyle = { fontFamily, '--font-sans': fontFamily } as CSSProperties;

// Remotion CLI config — applies only to the CLI/Studio, not the Node render APIs.
// https://remotion.dev/docs/config
import { Config } from '@remotion/cli/config';
import { enableTailwind } from '@remotion/tailwind-v4';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);

// Route the bundler's CSS through Tailwind v4 so imported `@repo/ui/globals.css`
// (and every product class it scans across `apps/**` + `packages/**`) resolves.
Config.overrideWebpackConfig(enableTailwind);

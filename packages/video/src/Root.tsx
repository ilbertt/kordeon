// The product's real theme + component classes come straight from @repo/ui —
// the same stylesheet the landing page uses, scanned across apps/** + packages/**.
import '@repo/ui/globals.css';
import { Composition } from 'remotion';
import {
  FILM_DURATION,
  LaunchFilm,
  launchFilmDefaultProps,
  launchFilmSchema,
} from '#compositions/LaunchFilm';

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export function RemotionRoot() {
  return (
    <Composition
      id="LaunchFilm"
      component={LaunchFilm}
      durationInFrames={FILM_DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      schema={launchFilmSchema}
      defaultProps={launchFilmDefaultProps}
    />
  );
}

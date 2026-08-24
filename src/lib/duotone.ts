/**
 * Duotone media for the Open Graph card
 *
 * The dashboard's `Square` panel paints the `--grid-bg` gradient and blends a
 * grayscale photo over it (`Media`: `filter: grayscale(1)` +
 * `mix-blend-mode: overlay`), which is what gives every page its red duotone.
 *
 * satori supports neither CSS filters nor blend modes, so the card can't do
 * that at render time: the pixels have to arrive already blended. This module
 * reproduces the same two steps with sharp, which the project already depends
 * on for image optimization, and hands back a data URI the card's `<img>` can
 * carry.
 *
 * The result is used by both the PNG renderer and the `/og` preview page, so
 * what the preview shows is the same image the card rasterizes rather than a
 * CSS approximation of it.
 */
import sharp from 'sharp';
import { join } from 'node:path';
import { ogCard } from '@components/OgImage.astro';

const assetsDir = join(process.cwd(), 'src/assets');

/**
 * The portrait every card carries, the one the home page's own `Square` shows.
 * All six cards share it: what distinguishes a card is the content on the
 * right, and some pages put something unrasterizable in `Square` anyway
 * (the `<mode-book>` embed, a streaming sizzle reel).
 */
const CARD_MEDIA = 'stageworthy.png';

/** The two stops of `--grid-bg` in global.css. Keep them in step. */
const GRADIENT_FROM = '#501111';
const GRADIENT_TO = '#951111';

/**
 * The backdrop the photo is blended onto: `linear-gradient(135deg, …)`, which
 * runs top-left to bottom-right. On the site this layer is
 * `background-attachment: fixed` and therefore viewport-sized; here it is drawn
 * at the panel's own size, which the photo covers anyway.
 */
function gradient(width: number, height: number): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      `<stop offset="0" stop-color="${GRADIENT_FROM}"/>` +
      `<stop offset="1" stop-color="${GRADIENT_TO}"/>` +
      '</linearGradient></defs>' +
      '<rect width="100%" height="100%" fill="url(#g)"/></svg>',
  );
}

/** Every card shares one image, so this is computed once per process. */
let pending: Promise<string> | undefined;

/**
 * The card's `Square`: the portrait, grayscaled and overlay-blended onto the
 * panel gradient at exactly the square's size, as a base64 PNG data URI.
 *
 * `fit: 'cover'` is the `object-fit: cover` the panel's media carries, and
 * `toColourspace('srgb')` puts the three bands back after `greyscale()` reduces
 * the image to one, which the blend needs to line up with the gradient.
 */
export function cardMedia(): Promise<string> {
  if (!pending) {
    pending = (async () => {
      const { square, height } = ogCard;

      const photo = await sharp(join(assetsDir, CARD_MEDIA))
        .resize(square, height, { fit: 'cover', position: 'centre' })
        .greyscale()
        .toColourspace('srgb')
        .png()
        .toBuffer();

      const blended = await sharp(gradient(square, height))
        .composite([{ input: photo, blend: 'overlay' }])
        .png()
        .toBuffer();

      return `data:image/png;base64,${blended.toString('base64')}`;
    })();
  }

  return pending;
}

import {cn} from 'cn';
import {getSwatchColors, swatchBackground} from '~/lib/colors';

// Diagonal hatch for labels with no known color.
const UNKNOWN_BACKGROUND =
  'repeating-linear-gradient(135deg, var(--color-mist) 0 3px, var(--color-line) 3px 5px)';

/**
 * A round color dot for a Color option value. Decorative: the control that
 * wraps it carries the accessible name.
 * @param {{
 *   name: string;
 *   shopifyColor?: string | null;
 *   className?: string;
 * }}
 */
export function ColorSwatch({name, shopifyColor, className}) {
  const background =
    swatchBackground(getSwatchColors(name, shopifyColor)) ?? UNKNOWN_BACKGROUND;

  return (
    <span
      aria-hidden="true"
      className={cn(
        // The inset ring keeps white and pale swatches visible on white cards.
        'block size-full rounded-full ring-1 ring-black/15 ring-inset',
        className,
      )}
      style={{background}}
    />
  );
}

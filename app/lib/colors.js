/**
 * Swatch colors for the store's Color option values, keyed by upper-cased
 * label so "WHITE" and "White" share one entry. `MULTI` labels list the main
 * color first, then accents.
 *
 * Values are visual estimates from one representative variant image per label
 * (see color-hex-image-reference CSV), not manufacturer specs.
 * @type {Readonly<Record<string, readonly string[]>>}
 */
const COLOR_HEX = Object.freeze({
  'ACADEMY MULTI': ['#44377D', '#242344'],
  'AQUATIC MULTI': ['#45C5C1', '#FFFFFF', '#278F72'],
  BAY: ['#86CFC3'],
  'BAY MULTI': ['#86CFC3', '#00364A'],
  'BERMUDA PINK MULTI': ['#D789B5', '#232A42'],
  BLACK: ['#191919'],
  'BLACK MULTI': ['#191919', '#E9DBDF', '#E95287'],
  BLOSSOMS: ['#EBAED5'],
  'BLOSSOMS MULTI': ['#EBAED5', '#26334D'],
  'BLUE EYES': ['#BDCBEE'],
  'BLUE LAGOON MULTI': ['#0645B4', '#FFFFFF', '#172944'],
  'BLUEBELLE MULTI': ['#405FA6', '#A6D5C1', '#D9BDDC'],
  'CANDY APPLE MULTI': ['#C80034', '#FFFFFF', '#25252B'],
  CLARET: ['#E00036'],
  'CLARET MULTI': ['#EC003B', '#171717'],
  COMPLEMINT: ['#37CE8F'],
  'COMPLEMINT MULTI': ['#58D397', '#3F5594'],
  CORNFLOWER: ['#B4C2D7'],
  'CORNFLOWER MULTI': ['#B4C2D7', '#647BA4', '#EF719E'],
  'CRYSTAL MULTI': ['#9ADCC7', '#1C3448'],
  // EPNY LADIES: no reference image, so no color; renders the fallback swatch.
  'FRUIT PUNCH': ['#F32F7B'],
  'FRUIT PUNCH MULTI': ['#F32F7B', '#29314F'],
  INKY: ['#18294F'],
  'INKY MULTI': ['#302B55', '#68BEC6'],
  NAVY: ['#25252D'],
  'NAVY MULTI': ['#29292F', '#FFFFFF', '#B32150'],
  'OPEN AIR MULTI': ['#739DCC', '#FFFFFF', '#253553'],
  'ORANGINA MULTI': ['#E7C2C8', '#687DA1', '#F18C9B'],
  PALM: ['#9BE65A'],
  REFLECTIONS: ['#62615C'],
  'REFLECTIONS MULTI': ['#8B8B83', '#35435A'],
  'REGATTA MULTI': ['#486DB8', '#253456', '#FFFFFF'],
  ROSA: ['#F637A1'],
  'ROSA MULTI': ['#F637A1', '#252236'],
  'ROSAY MULTI': ['#EDACC0', '#575358'],
  ROSEBUD: ['#F396CD'],
  'RUBY PEACH': ['#F35C85'],
  'RUBY PEACH MULTI': ['#F0BCC6', '#3D2A2D', '#F35C85'],
  'SEA MIST': ['#DFE1A5'],
  'SEA MIST MULTI': ['#E4E4C0', '#FFFFFF', '#242B47'],
  'SLATE MULTI': ['#747479', '#171717', '#FFFFFF'],
  'SPLASH MULTI': ['#66C7D4', '#FFFFFF', '#252B4C'],
  'STEEL BLUE': ['#51538C'],
  TANGELO: ['#FA7783'],
  'TANGELO MULTI': ['#FA7783', '#B3C4D6', '#FFFFFF'],
  'VERI VIOLET': ['#CA75D8'],
  'WHIRLPOOL MULTI': ['#86C4D9', '#375B8F', '#D7E5D4'],
  WHITE: ['#FFFFFF'],
  'WHITE MULTI': ['#EEECEF', '#28272D', '#CF2257'],
});

const COLOR_OPTION_NAMES = new Set(['color', 'colour']);

/**
 * Whether a product option holds colors (e.g. "Color", "Colour").
 * @param {string} optionName
 */
export function isColorOption(optionName) {
  return COLOR_OPTION_NAMES.has(optionName.trim().toLowerCase());
}

/**
 * The swatch colors for a Color option value: main color first, then accents.
 * Falls back to the merchant-configured Shopify swatch color, then to an empty
 * list (the swatch renders a neutral placeholder).
 * @param {string} label
 * @param {string | null} [shopifySwatchColor]
 * @return {readonly string[]}
 */
export function getSwatchColors(label, shopifySwatchColor) {
  const mapped = COLOR_HEX[label.trim().toUpperCase()];
  if (mapped) return mapped;
  return shopifySwatchColor ? [shopifySwatchColor] : [];
}

/**
 * A CSS background for a list of swatch colors. Solid colors fill the dot;
 * multi colors give the main color half the dot and split the rest between
 * the accents.
 * @param {readonly string[]} colors
 * @return {string | undefined}
 */
export function swatchBackground(colors) {
  const [main, ...accents] = colors;
  if (!main) return undefined;
  if (accents.length === 0) return main;

  const slice = 50 / accents.length;
  const stops = accents.map((accent, index) => {
    const start = 50 + slice * index;
    return `${accent} ${start}% ${start + slice}%`;
  });
  return `conic-gradient(from 45deg, ${main} 0 50%, ${stops.join(', ')})`;
}

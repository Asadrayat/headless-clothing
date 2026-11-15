import {useMemo, useState} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import {ColorSwatch} from '~/components/ColorSwatch';
import {Link} from '~/components/Link';
import {Card, CardContent} from '~/components/ui/card';
import {Skeleton} from '~/components/ui/skeleton';
import {isColorOption} from '~/lib/colors';
import {useVariantUrl} from '~/lib/variants';

const IMAGE_SIZES =
  '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 75vw';

/** Swatches shown before collapsing the rest into a "+N" count. */
const MAX_SWATCHES = 5;

/**
 * Product card for the homepage: image, hover image (the product's second
 * image), title, color swatches and price.
 *
 * Hovering or focusing a swatch previews that color's variant image; clicking
 * it keeps the color and links the card to that variant.
 *
 * The title link is stretched over the whole card so the swatch buttons can
 * sit inside the card without being nested in the link.
 * @param {{product: HomeProductFragment; loading?: 'eager' | 'lazy'}}
 */
export function ProductCard({product, loading = 'lazy'}) {
  const colorOption = product.options.find(
    (option) => isColorOption(option.name) && option.optionValues.length > 1,
  );
  const [selectedColor, setSelectedColor] = useState(
    /** @type {string | null} */ (null),
  );
  const [previewColor, setPreviewColor] = useState(
    /** @type {string | null} */ (null),
  );

  const selectedOptions = useMemo(
    () =>
      colorOption && selectedColor
        ? [{name: colorOption.name, value: selectedColor}]
        : undefined,
    [colorOption, selectedColor],
  );
  const url = useVariantUrl(product.handle, selectedOptions);

  const shownColor = previewColor ?? selectedColor;
  const colorImage = shownColor
    ? colorOption?.optionValues.find((value) => value.name === shownColor)
        ?.firstSelectableVariant?.image
    : null;
  const [productImage, hoverImage] = product.images.nodes;
  const image = colorImage ?? productImage;

  return (
    <Card className="group relative h-full gap-0 overflow-hidden py-0 shadow-none transition-shadow duration-200 hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-indigo">
      <div className="relative aspect-square overflow-hidden bg-mist">
        {image ? (
          <Image
            alt={image.altText || product.title}
            aspectRatio="1/1"
            className="size-full object-cover"
            data={image}
            key={image.id}
            loading={loading}
            sizes={IMAGE_SIZES}
          />
        ) : null}
        {/* The alternate view belongs to the default color, so hide it while a color is shown. */}
        {hoverImage && !colorImage ? (
          <Image
            // Decorative alternate view; the primary image carries the alt.
            alt=""
            aspectRatio="1/1"
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-has-[a:focus-visible]:opacity-100 motion-reduce:transition-none"
            data={hoverImage}
            loading="lazy"
            sizes={IMAGE_SIZES}
          />
        ) : null}
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 px-4 py-4">
        <h3 className="m-0 line-clamp-2 text-sm leading-snug font-medium">
          <Link
            className="text-ink group-hover:underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            prefetch="intent"
            to={url}
          >
            {product.title}
          </Link>
        </h3>
        {colorOption ? (
          <ColorSwatches
            onPreview={setPreviewColor}
            onSelect={setSelectedColor}
            option={colorOption}
            selected={selectedColor}
          />
        ) : null}
        <Money
          className="mt-auto text-sm text-muted tabular-nums"
          data={product.priceRange.minVariantPrice}
        />
      </CardContent>
    </Card>
  );
}

/**
 * @param {{
 *   option: HomeProductFragment['options'][number];
 *   selected: string | null;
 *   onSelect: (value: string | null) => void;
 *   onPreview: (value: string | null) => void;
 * }}
 */
function ColorSwatches({option, selected, onSelect, onPreview}) {
  const values = option.optionValues;
  const hidden = values.length - MAX_SWATCHES;

  return (
    <div
      aria-label={`${option.name} options`}
      className="flex flex-wrap items-center gap-1"
      onMouseLeave={() => onPreview(null)}
      role="group"
    >
      {values.slice(0, MAX_SWATCHES).map((value) => {
        const isSelected = value.name === selected;
        return (
          <button
            aria-label={value.name}
            aria-pressed={isSelected}
            // Above the stretched title link, so clicks pick a color instead of navigating.
            className="relative z-10 size-6 cursor-pointer rounded-full p-0.5 ring-1 ring-transparent transition-shadow hover:ring-line aria-pressed:ring-ink motion-reduce:transition-none"
            key={value.id}
            onBlur={() => onPreview(null)}
            onClick={() => onSelect(isSelected ? null : value.name)}
            onFocus={() => onPreview(value.name)}
            onMouseEnter={() => onPreview(value.name)}
            title={value.name}
            type="button"
          >
            <ColorSwatch name={value.name} shopifyColor={value.swatch?.color} />
          </button>
        );
      })}
      {hidden > 0 ? (
        <span className="pl-1 text-xs text-muted tabular-nums">
          +{hidden}
          <span className="sr-only"> more colors</span>
        </span>
      ) : null}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-col gap-2 px-4 py-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-5 w-1/3 rounded-full" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').HomeProductFragment} HomeProductFragment */

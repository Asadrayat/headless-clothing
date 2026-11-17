import {useState} from 'react';
import {useNavigate} from 'react-router';
import {Link} from '~/components/Link';
import {ColorSwatch} from '~/components/ColorSwatch';
import {getSwatchColors, isColorOption} from '~/lib/colors';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';

/**
 * @param {{
 *   productOptions: MappedProductOptions[];
 *   selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 * }}
 */
export function ProductForm({productOptions, selectedVariant}) {
  const {open} = useAside();
  return (
    <div className="product-form">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        return <ProductOptionPills key={option.name} option={option} />;
      })}
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          open('cart');
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                  selectedVariant,
                },
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
      </AddToCartButton>
    </div>
  );
}

/**
 * Renders every value of an option as a pill, with the selected value filled.
 * Color options render as round swatches instead; the legend names the
 * selected color, or the one being hovered.
 * @param {{option: MappedProductOptions}}
 */
function ProductOptionPills({option}) {
  const navigate = useNavigate();
  const [previewName, setPreviewName] = useState(
    /** @type {string | null} */ (null),
  );
  const selectedValue = option.optionValues.find((value) => value.selected);
  const isColor = isColorOption(option.name);
  const headingValue = (isColor && previewName) || selectedValue?.name;
  const pillClassName = isColor
    ? 'product-option-pill product-option-pill--swatch'
    : 'product-option-pill';

  return (
    <fieldset className="product-options">
      <legend className="product-option-heading">
        <span className="product-option-heading-name">{option.name}</span>
        {headingValue && (
          <span className="product-option-heading-value">{headingValue}</span>
        )}
      </legend>

      <div
        className="product-option-pills"
        onMouseLeave={isColor ? () => setPreviewName(null) : undefined}
      >
        {option.optionValues.map((value) => {
          const {
            name,
            handle,
            variantUriQuery,
            selected,
            available,
            exists,
            isDifferentProduct,
          } = value;

          const shared = {
            className: pillClassName,
            'data-unavailable': !available,
            ...(isColor && {
              'aria-label': available ? name : `${name} (sold out)`,
              title: name,
              onMouseEnter: () => setPreviewName(name),
              onFocus: () => setPreviewName(name),
              onBlur: () => setPreviewName(null),
            }),
          };

          const content = isColor ? (
            <ColorOptionSwatch value={value} />
          ) : (
            <>
              <ProductOptionSwatch value={value} />
              <span>{name}</span>
            </>
          );

          if (isDifferentProduct) {
            // SEO
            // When the variant is a combined listing child product
            // that leads to a different url, we need to render it
            // as an anchor tag
            return (
              <Link
                {...shared}
                key={option.name + name}
                prefetch="intent"
                preventScrollReset
                replace
                to={`/products/${handle}?${variantUriQuery}`}
                aria-current={selected ? 'true' : undefined}
              >
                {content}
              </Link>
            );
          }

          // SEO
          // When the variant is an update to the search param,
          // render it as a button with javascript navigating to
          // the variant so that SEO bots do not index these as
          // duplicated links
          return (
            <button
              {...shared}
              type="button"
              key={option.name + name}
              aria-pressed={selected}
              disabled={!exists}
              onClick={() => {
                if (selected) return;
                void navigate(`?${variantUriQuery}`, {
                  replace: true,
                  preventScrollReset: true,
                });
              }}
            >
              {content}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * The round swatch for a Color option value: the store's COLOR_HEX map first,
 * then the merchant-configured Shopify swatch color or image, then the photo of
 * the variant the value maps to, and finally ColorSwatch's hatch placeholder.
 * @param {{value: MappedProductOptions['optionValues'][number]}}
 */
function ColorOptionSwatch({value}) {
  const {name, swatch, firstSelectableVariant} = value;
  const hasColor = getSwatchColors(name, swatch?.color).length > 0;
  const image =
    swatch?.image?.previewImage?.url ?? firstSelectableVariant?.image?.url;

  if (hasColor || !image) {
    return <ColorSwatch name={name} shopifyColor={swatch?.color} />;
  }

  return (
    <span className="product-option-swatch" aria-hidden="true">
      <img src={thumbnailUrl(image)} alt="" loading="lazy" />
    </span>
  );
}

/**
 * A small dot inside a text pill, shown only when the merchant configured a
 * Shopify swatch for the value.
 * @param {{value: MappedProductOptions['optionValues'][number]}}
 */
function ProductOptionSwatch({value}) {
  const {swatch} = value;
  const image = swatch?.image?.previewImage?.url;
  if (!image && !swatch?.color) return null;

  return (
    <span
      className="product-option-swatch"
      style={{backgroundColor: swatch?.color || undefined}}
      aria-hidden="true"
    >
      {!!image && <img src={thumbnailUrl(image)} alt="" loading="lazy" />}
    </span>
  );
}

/**
 * Ask the Shopify CDN for a small square crop rather than the full-size image.
 * @param {string} url
 */
function thumbnailUrl(url) {
  try {
    const thumbnail = new URL(url);
    thumbnail.searchParams.set('width', '96');
    thumbnail.searchParams.set('height', '96');
    thumbnail.searchParams.set('crop', 'center');
    return thumbnail.toString();
  } catch {
    return url;
  }
}

/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */

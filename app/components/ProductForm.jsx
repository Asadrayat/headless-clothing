import {useEffect, useId, useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import {Link} from '~/components/Link';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';

/**
 * @param {{
 *   productOptions: MappedProductOptions[];
 *   selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 *   fallbackImage?: ProductFragment['featuredImage'];
 * }}
 */
export function ProductForm({productOptions, selectedVariant, fallbackImage}) {
  const {open} = useAside();
  return (
    <div className="product-form">
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        return (
          <ProductOptionSelect
            key={option.name}
            option={option}
            fallbackImage={fallbackImage}
          />
        );
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
 * A collapsible option selector: the closed state shows the option name above
 * the selected value, and expanding it reveals the remaining values.
 * @param {{
 *   option: MappedProductOptions;
 *   fallbackImage?: ProductFragment['featuredImage'];
 * }}
 */
function ProductOptionSelect({option, fallbackImage}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const selectRef = useRef(null);
  const toggleRef = useRef(null);

  // Escape closes the open panel and hands focus back to its toggle, so focus
  // isn't stranded on a value button that's about to be hidden.
  useEffect(() => {
    if (!expanded) return;
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      if (!selectRef.current?.contains(document.activeElement)) return;
      setExpanded(false);
      toggleRef.current?.focus();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expanded]);

  const selectedValue =
    option.optionValues.find((value) => value.selected) ??
    option.optionValues[0];

  return (
    <div className="product-options" key={option.name}>
      <div className="product-option-select" ref={selectRef}>
        <button
          ref={toggleRef}
          type="button"
          className="product-option-toggle"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((value) => !value)}
        >
          <ProductOptionSwatch
            image={optionValueImage(selectedValue, fallbackImage)}
            color={selectedValue?.swatch?.color}
            name={selectedValue?.name}
          />
          <span className="product-option-label">
            <span className="product-option-label-name">{option.name}</span>
            <span className="product-option-label-value">
              {selectedValue?.name}
            </span>
          </span>
          <Chevron />
        </button>

        <div className="product-option-values" id={panelId} hidden={!expanded}>
          {option.optionValues.map((value) => {
            const {
              name,
              handle,
              variantUriQuery,
              selected,
              available,
              exists,
              isDifferentProduct,
              swatch,
            } = value;

            // The selected value already heads the list in the toggle above
            if (selected) return null;

            const swatchElement = (
              <>
                <ProductOptionSwatch
                  image={optionValueImage(value, fallbackImage)}
                  color={swatch?.color}
                  name={name}
                />
                <span className="product-option-label-value">{name}</span>
              </>
            );

            if (isDifferentProduct) {
              // SEO
              // When the variant is a combined listing child product
              // that leads to a different url, we need to render it
              // as an anchor tag
              return (
                <Link
                  className="product-option-value"
                  key={option.name + name}
                  prefetch="intent"
                  preventScrollReset
                  replace
                  to={`/products/${handle}?${variantUriQuery}`}
                  data-unavailable={!available}
                  onClick={() => setExpanded(false)}
                >
                  {swatchElement}
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
                type="button"
                className="product-option-value"
                key={option.name + name}
                data-unavailable={!available}
                disabled={!exists}
                onClick={() => {
                  setExpanded(false);
                  void navigate(`?${variantUriQuery}`, {
                    replace: true,
                    preventScrollReset: true,
                  });
                }}
              >
                {swatchElement}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Prefer the merchant-configured swatch media, then the image of the variant
 * this value maps to, and finally the product's featured image so a value is
 * never rendered without artwork.
 * @param {MappedProductOptions['optionValues'][number] | undefined} value
 * @param {ProductFragment['featuredImage']} [fallbackImage]
 */
function optionValueImage(value, fallbackImage) {
  return (
    value?.swatch?.image?.previewImage?.url ??
    value?.firstSelectableVariant?.image?.url ??
    fallbackImage?.url ??
    null
  );
}

/**
 * @param {{
 *   image?: string | null;
 *   color?: Maybe<string> | undefined;
 *   name?: string;
 * }}
 */
function ProductOptionSwatch({image, color, name}) {
  return (
    <span
      className="product-option-swatch"
      style={{backgroundColor: color || undefined}}
    >
      {!!image && <img src={image} alt="" loading="lazy" aria-hidden="true" />}
      {!image && !color && (
        <span className="product-option-swatch-initial">
          {name?.trim().charAt(0)}
        </span>
      )}
    </span>
  );
}

function Chevron() {
  return (
    <svg
      className="product-option-chevron"
      viewBox="0 0 20 20"
      width="16"
      height="16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 8 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Maybe} Maybe */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').ProductOptionValueSwatch} ProductOptionValueSwatch */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */

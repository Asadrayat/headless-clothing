import {useEffect, useId, useMemo, useRef, useState} from 'react';
import {useFetcher} from 'react-router';
import {Plus, ShoppingBag, X} from 'lucide-react';
import {cn} from 'cn';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {useLocalizedPath} from '~/lib/i18n';

const ICON_BUTTON =
  'relative z-4 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-35 data-pending:animate-pulse motion-reduce:animate-none';

/**
 * Add-to-cart control for a product card.
 *
 * - Nothing left to choose once the color is set (single variant, or color
 *   only): a button that adds it straight to the cart.
 * - One more option to choose (usually Size): a button that opens a picker
 *   over the bottom of the card. The variants are fetched on intent
 *   (hover/focus), once per product, and shared by every card showing it.
 * - More than that: nothing; the card links to the product page.
 *
 * Lines carry the variant's title, image and options so the cart drawer shows
 * them before the server responds (optimistic cart).
 *
 * Render it inside a `relative` card; the picker is positioned against it.
 * @param {{
 *   product: ProductCardFragment;
 *   colorOption?: ProductOption;
 *   color: string | null;
 * }}
 */
export function QuickAdd({product, colorOption, color}) {
  const pickOptions = product.options.filter(
    (option) => option !== colorOption && option.optionValues.length > 1,
  );
  const colorValue = color
    ? colorOption?.optionValues.find((value) => value.name === color)
    : undefined;

  if (pickOptions.length === 0) {
    // Every other option has one value, so the color alone names the variant.
    const variant = colorValue
      ? colorValue.firstSelectableVariant
      : product.selectedOrFirstAvailableVariant;
    const selectedOptions = colorValue
      ? product.options.map((option) => ({
          name: option.name,
          value:
            option === colorOption
              ? colorValue.name
              : option.optionValues[0].name,
        }))
      : product.selectedOrFirstAvailableVariant?.selectedOptions;

    return (
      <DirectAdd
        line={
          variant && selectedOptions
            ? cartLine(product, variant.id, selectedOptions, colorValue)
            : null
        }
        title={product.title}
        available={Boolean(variant?.availableForSale)}
      />
    );
  }

  if (pickOptions.length === 1) {
    const shownColor =
      colorValue?.name ??
      (colorOption
        ? product.selectedOrFirstAvailableVariant?.selectedOptions.find(
            (selected) => selected.name === colorOption.name,
          )?.value
        : undefined);
    return (
      <OptionPicker
        color={shownColor ?? null}
        colorOption={colorOption}
        option={pickOptions[0]}
        product={product}
      />
    );
  }

  return null;
}

/**
 * @param {{
 *   title: string;
 *   available: boolean;
 *   line: CartLineInput | null;
 * }}
 */
function DirectAdd({title, available, line}) {
  const {open} = useAside();

  return (
    <AddToCartButton
      aria-label={available ? `Add ${title} to cart` : `${title} is sold out`}
      className={ICON_BUTTON}
      // Undefined keeps the button's own pending-state disabling.
      disabled={available && line ? undefined : true}
      lines={line ? [line] : []}
      onClick={() => open('cart')}
      title={available ? 'Add to cart' : 'Sold out'}
    >
      <ShoppingBag aria-hidden="true" className="size-4" />
    </AddToCartButton>
  );
}

/**
 * @param {{
 *   product: ProductCardFragment;
 *   option: ProductOption;
 *   colorOption?: ProductOption;
 *   color: string | null;
 * }}
 */
function OptionPicker({product, option, colorOption, color}) {
  const {open: openAside} = useAside();
  const localize = useLocalizedPath();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  // Keyed so cards showing the same product share one request and its result.
  /** @type {import('react-router').FetcherWithComponents<VariantsData>} */
  const fetcher = useFetcher({key: `product-variants:${product.handle}`});
  const loading = !fetcher.data;
  const load = () => {
    if (fetcher.state === 'idle' && !fetcher.data) {
      fetcher.load(localize(`/api/products/${product.handle}/variants`));
    }
  };

  // Value of `option` (e.g. "M") → variant, for the shown color.
  const variantsByValue = useMemo(() => {
    const map = new Map();
    for (const variant of fetcher.data?.variants ?? []) {
      let value;
      let matchesColor = !colorOption;
      for (const selected of variant.selectedOptions) {
        if (selected.name === option.name) value = selected.value;
        else if (selected.name === colorOption?.name) {
          matchesColor = selected.value === color;
        }
      }
      if (matchesColor && value !== undefined) map.set(value, variant);
    }
    return map;
  }, [fetcher.data, option.name, colorOption, color]);

  const colorValue = color
    ? colorOption?.optionValues.find((value) => value.name === color)
    : undefined;

  // While open: close on Escape or a press outside. (Not on blur alone:
  // Safari doesn't focus buttons on click, so blur would close the picker
  // before a size press lands.)
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (!panelRef.current?.contains(/** @type {Node} */ (event.target))) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Focus the first available value; until variants load, the close button.
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const active = document.activeElement;
    if (panel.contains(active) && active?.getAttribute('type') === 'submit') {
      return;
    }
    /** @type {HTMLElement | null} */ (
      panel.querySelector('button[type=submit]:enabled') ??
        panel.querySelector('button')
    )?.focus();
  }, [open, loading]);

  const optionLabel = option.name.toLowerCase();

  return (
    <>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={
          product.availableForSale
            ? `Choose ${optionLabel} to add ${product.title} to cart`
            : `${product.title} is sold out`
        }
        className={ICON_BUTTON}
        disabled={!product.availableForSale}
        onClick={() => {
          load();
          setOpen(true);
        }}
        onFocus={load}
        onPointerEnter={load}
        ref={triggerRef}
        title={product.availableForSale ? 'Add to cart' : 'Sold out'}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
      </button>

      {open ? (
        <div
          aria-label={`Choose ${optionLabel}`}
          className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 border-t border-line bg-paper p-4 animate-in fade-in-0 slide-in-from-bottom-2 motion-reduce:animate-none"
          id={panelId}
          onBlur={(event) => {
            // Keyboard: close when focus tabs out of the picker.
            const next = event.relatedTarget;
            if (next && !event.currentTarget.contains(next)) setOpen(false);
          }}
          // Close and show the cart once a value's form has submitted (the
          // event bubbles up from it). Doing this on click would unmount the
          // form before it submits.
          onSubmit={() => {
            setOpen(false);
            openAside('cart');
          }}
          ref={panelRef}
          role="group"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="m-0 truncate text-xs font-medium text-ink">
              Select {optionLabel}
              {color ? <span className="text-muted"> · {color}</span> : null}
            </p>
            <button
              aria-label="Close"
              className="-m-1 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-mist hover:text-ink"
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              type="button"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
          <div aria-busy={loading} className="flex flex-wrap gap-1.5">
            {option.optionValues.map((value) => {
              const variant = variantsByValue.get(value.name);
              const available = Boolean(variant?.availableForSale);
              const status = loading ? 'loading' : 'unavailable';
              return (
                <AddToCartButton
                  aria-label={
                    available
                      ? `Add ${option.name} ${value.name} to cart`
                      : `${option.name} ${value.name} ${status}`
                  }
                  className={cn(
                    'min-w-10 cursor-pointer rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:hover:border-line data-pending:animate-pulse',
                    loading
                      ? 'animate-pulse'
                      : 'disabled:text-muted disabled:line-through',
                  )}
                  disabled={available ? undefined : true}
                  key={value.id}
                  lines={
                    variant
                      ? [
                          cartLine(
                            product,
                            variant.id,
                            variant.selectedOptions,
                            colorValue,
                          ),
                        ]
                      : []
                  }
                >
                  {value.name}
                </AddToCartButton>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * A cart line plus what the optimistic cart needs to show it right away.
 * @param {ProductCardFragment} product
 * @param {string} variantId
 * @param {Array<{name: string; value: string}>} selectedOptions
 * @param {ProductOption['optionValues'][number]} [colorValue]
 * @return {CartLineInput}
 */
function cartLine(product, variantId, selectedOptions, colorValue) {
  return {
    merchandiseId: variantId,
    quantity: 1,
    selectedVariant: {
      id: variantId,
      title: selectedOptions.map((selected) => selected.value).join(' / '),
      image:
        colorValue?.firstSelectableVariant?.image ??
        product.images.nodes[0] ??
        null,
      selectedOptions,
      product: {handle: product.handle, title: product.title},
    },
  };
}

/** @typedef {import('storefrontapi.generated').ProductCardFragment} ProductCardFragment */
/** @typedef {ProductCardFragment['options'][number]} ProductOption */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} CartLineInput */
/**
 * @typedef {{
 *   variants: Array<{
 *     id: string;
 *     availableForSale: boolean;
 *     selectedOptions: Array<{name: string; value: string}>;
 *   }>;
 * }} VariantsData
 */

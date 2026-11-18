import {CartForm} from '@shopify/hydrogen';
import {useLocalizedPath} from '~/lib/i18n';

/**
 * Submits `lines` to the cart. Extra props (className, aria-label…) go on the
 * button, which carries `data-pending` while the request is in flight.
 * @param {{
 *   analytics?: unknown;
 *   children: React.ReactNode;
 *   disabled?: boolean;
 *   lines: Array<OptimisticCartLineInput>;
 *   onClick?: () => void;
 * } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'>}
 */
export function AddToCartButton({
  analytics,
  children,
  disabled,
  lines,
  onClick,
  ...buttonProps
}) {
  const localize = useLocalizedPath();
  return (
    <CartForm
      route={localize('/cart')}
      inputs={{lines}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher) => {
        const pending = fetcher.state !== 'idle';
        return (
          <>
            <input
              name="analytics"
              type="hidden"
              value={JSON.stringify(analytics)}
            />
            <button
              {...buttonProps}
              data-pending={pending || undefined}
              type="submit"
              className="inline-flex cursor-pointer shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 bg-primary text-primary-foreground hover:bg-primary/90 has-[>svg]:px-4 h-12 rounded-full px-7 text-base hover:no-underline w-full"
              onClick={onClick}
              disabled={disabled ?? pending}
            >
              {children}
            </button>
          </>
        );
      }}
    </CartForm>
  );
}

/** @typedef {import('react-router').FetcherWithComponents} FetcherWithComponents */
/** @typedef {import('@shopify/hydrogen').OptimisticCartLineInput} OptimisticCartLineInput */

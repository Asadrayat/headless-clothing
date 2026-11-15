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

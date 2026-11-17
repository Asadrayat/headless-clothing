import {Suspense, useEffect, useMemo, useState} from 'react';
import {Await, useAsyncValue} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {Search, ShoppingBag, UserRound} from 'lucide-react';
import {cn} from 'cn';
import {useAside} from '~/components/Aside';
import {NavLink} from '~/components/Link';
import {DesktopNav} from '~/components/header/DesktopNav';
import {MobileNav} from '~/components/header/MobileNav';
import {useLocalizedPath} from '~/lib/i18n';
import {buildNav} from '~/lib/menu';

const ICON_BUTTON =
  'relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full text-ink/80 transition-colors duration-200 hover:bg-ink/6 hover:text-ink hover:no-underline';

/**
 * Sticky, floating glass header: menu (desktop dropdowns / mobile sheet), logo
 * and search, account and cart buttons.
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart, publicStoreDomain}) {
  const {shop, menu} = header;
  const primaryDomainUrl = shop.primaryDomain.url;
  const items = useMemo(
    () => buildNav(menu, {publicStoreDomain, primaryDomainUrl}),
    [menu, publicStoreDomain, primaryDomainUrl],
  );
  const scrolled = useScrolled();

  return (
    <header
      // The fade above the bar hides page content scrolling through the gap.
      className="sticky top-0 z-40 px-3 pt-3 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-8 before:bg-linear-to-b before:from-paper before:from-40% before:to-transparent md:px-6 lg:px-16"
    >
      <div
        className={cn(
          'relative isolate mx-auto grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl px-2 sm:px-4',
          // The glass is a pseudo-element, not the bar itself: an element with
          // backdrop-filter stops the dropdown inside it from blurring the page.
          'before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:border before:border-ink/7 before:bg-white/65 before:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_-16px_rgba(16,27,59,0.2)] before:backdrop-blur-xl before:backdrop-saturate-150 before:transition-[background-color,box-shadow] before:duration-300',
          scrolled &&
            'before:bg-white/78 before:shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_16px_40px_-16px_rgba(16,27,59,0.3)]',
        )}
      >
        <MobileNav
          isLoggedIn={isLoggedIn}
          items={items}
          shopName={shop.name}
          triggerClassName={cn(ICON_BUTTON, 'justify-self-start')}
        />
        <Logo shop={shop} />
        <DesktopNav items={items} />
        <div className="flex items-center justify-end gap-0.5">
          <SearchButton />
          <NavLink
            aria-label="Account"
            className={cn(ICON_BUTTON, 'hidden sm:inline-flex')}
            prefetch="intent"
            title="Account"
            to="/account"
          >
            <UserRound aria-hidden="true" className="size-5" />
          </NavLink>
          <CartToggle cart={cart} />
        </div>
      </div>
    </header>
  );
}

/** @param {{shop: HeaderQuery['shop']}} */
function Logo({shop}) {
  const logo = shop.brand?.logo?.image?.url;
  return (
    <NavLink
      className="justify-self-center truncate px-2 text-lg font-semibold tracking-tight text-ink hover:no-underline lg:justify-self-start lg:text-xl"
      end
      prefetch="intent"
      to="/"
    >
      {logo ? (
        <img alt={shop.name} className="h-7 w-auto" src={logo} />
      ) : (
        shop.name
      )}
    </NavLink>
  );
}

function SearchButton() {
  const {open} = useAside();
  return (
    <button
      aria-label="Search"
      className={ICON_BUTTON}
      onClick={() => open('search')}
      title="Search"
      type="button"
    >
      <Search aria-hidden="true" className="size-5" />
    </button>
  );
}

/** @param {{count: number}} */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  const localize = useLocalizedPath();

  return (
    <a
      aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}
      className={ICON_BUTTON}
      href={localize('/cart')}
      onClick={(event) => {
        event.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
      title="Cart"
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-0.5 right-0.5 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-ink px-1 text-[10px] leading-none font-semibold text-paper tabular-nums ring-2 ring-white animate-in zoom-in-50"
          key={count}
        >
          {count}
        </span>
      ) : null}
    </a>
  );
}

/** @param {Pick<HeaderProps, 'cart'>} */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

/**
 * Whether the page has scrolled past `threshold`. Re-renders only when that
 * flips, not on every scroll event.
 */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener('scroll', update, {passive: true});
    return () => window.removeEventListener('scroll', update);
  }, [threshold]);
  return scrolled;
}

/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */

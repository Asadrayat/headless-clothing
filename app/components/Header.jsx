import {Suspense} from 'react';
import {Await, useAsyncValue} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {NavLink} from '~/components/Link';
import {useAside} from '~/components/Aside';
import {useLocalizedPath} from '~/lib/i18n';

/**
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart, publicStoreDomain}) {
  const {shop, menu} = header;
  return (
    <header className="sticky top-0 z-1 flex h-16 items-center gap-4 border-b border-line bg-paper px-4 md:gap-10">
      <HeaderMenuMobileToggle />
      <NavLink
        className="min-w-0 truncate text-lg font-semibold tracking-tight hover:no-underline md:text-xl"
        end
        prefetch="intent"
        to="/"
      >
        {shop.name}
      </NavLink>
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
    </header>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}) {
  const {close} = useAside();
  const className =
    viewport === 'desktop'
      ? 'hidden items-center gap-6 text-sm md:flex'
      : 'flex flex-col gap-4 text-lg';

  return (
    <nav className={className} aria-label="Main">
      {viewport === 'mobile' && (
        <NavLink
          className={menuLinkClassName}
          end
          onClick={close}
          prefetch="intent"
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className={menuLinkClassName}
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart'>}
 */
function HeaderCtas({isLoggedIn, cart}) {
  return (
    <nav
      className="ml-auto flex items-center gap-4 text-sm md:gap-6"
      aria-label="Account and cart"
    >
      <NavLink
        className={({isActive, isPending}) =>
          `${menuLinkClassName({isActive, isPending})} flex items-center`
        }
        prefetch="intent"
        to="/account"
      >
        <UserIcon />
        <span className="sr-only md:not-sr-only">
          <Suspense fallback="Sign in">
            <Await resolve={isLoggedIn} errorElement="Sign in">
              {(isLoggedIn) => (isLoggedIn ? 'Account' : 'Sign in')}
            </Await>
          </Suspense>
        </span>
      </NavLink>
      <SearchToggle />
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const {open} = useAside();
  return (
    <button
      aria-label="Open menu"
      className="-ml-1 flex size-9 items-center justify-center md:hidden"
      onClick={() => open('mobile')}
      type="button"
    >
      <MenuIcon />
    </button>
  );
}

function SearchToggle() {
  const {open} = useAside();
  return (
    <button
      className="flex items-center hover:underline"
      onClick={() => open('search')}
      type="button"
    >
      <SearchIcon />
      <span className="sr-only md:not-sr-only">Search</span>
    </button>
  );
}

/**
 * @param {{count: number}}
 */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  const localize = useLocalizedPath();

  return (
    <a
      className="group flex items-center gap-1.5 hover:no-underline"
      href={localize('/cart')}
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
    >
      <BagIcon />
      <span className="sr-only group-hover:underline md:not-sr-only">Cart</span>
      <span
        aria-label={`(items: ${count})`}
        className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo px-1.5 text-xs font-medium text-paper tabular-nums"
      >
        {count}
      </span>
    </a>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
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
 * The active page gets an indigo underline rather than bold text, so the
 * menu doesn't shift width as you navigate.
 * @param {{isActive: boolean; isPending: boolean}}
 */
function menuLinkClassName({isActive, isPending}) {
  return [
    'decoration-2 underline-offset-[6px]',
    isActive ? 'underline decoration-indigo' : 'hover:decoration-line',
    isPending ? 'opacity-60' : '',
  ].join(' ');
}

/** Icons are shown on small screens, where the text labels collapse. */
function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="22"
      viewBox="0 0 22 22"
      width="22"
    >
      <path
        d="M3 6h16M3 11h16M3 16h16"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="md:hidden"
      fill="none"
      height="20"
      viewBox="0 0 20 20"
      width="20"
    >
      <circle
        cx="8.5"
        cy="8.5"
        r="5.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      className="md:hidden"
      fill="none"
      height="20"
      viewBox="0 0 20 20"
      width="20"
    >
      <circle
        cx="10"
        cy="6.5"
        r="3.75"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 18c.8-3.4 3.6-5.5 7-5.5s6.2 2.1 7 5.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      aria-hidden="true"
      className="md:hidden"
      fill="none"
      height="20"
      viewBox="0 0 20 20"
      width="20"
    >
      <path
        d="M4 6.5h12l-1 11H5l-1-11Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 8V5.5a3 3 0 0 1 6 0V8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */

import {Suspense} from 'react';
import {Await} from 'react-router';
import {NavLink} from '~/components/Link';

/**
 * @param {FooterProps}
 */
export function Footer({footer: footerPromise, header, publicStoreDomain}) {
  const shopName = header?.shop?.name;

  return (
    <footer className="mt-auto  px-4 lg:px-20 bg-ink text-paper">
      <div className="flex flex-col gap-6  py-10 md:flex-row md:items-start md:justify-between">
        {shopName && (
          <p className="text-lg font-semibold tracking-tight">{shopName}</p>
        )}
        {/* The footer menu is deferred, so the shell renders without it first */}
        <Suspense>
          <Await resolve={footerPromise}>
            {(footer) =>
              footer?.menu && header.shop.primaryDomain?.url ? (
                <FooterMenu
                  menu={footer.menu}
                  primaryDomainUrl={header.shop.primaryDomain.url}
                  publicStoreDomain={publicStoreDomain}
                />
              ) : null
            }
          </Await>
        </Suspense>
      </div>
      {shopName && (
        <p className="border-t border-paper/15 px-0 py-4 text-xs text-paper/70">
          © {new Date().getFullYear()} {shopName}
        </p>
      )}
    </footer>
  );
}

/**
 * @param {{
 *   menu: FooterQuery['menu'];
 *   primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
 *   publicStoreDomain: string;
 * }}
 */
function FooterMenu({menu, primaryDomainUrl, publicStoreDomain}) {
  return (
    <nav
      aria-label="Footer"
      className="flex flex-wrap gap-x-6 gap-y-3 text-sm md:max-w-xl md:justify-end"
    >
      {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
        if (!item.url) return null;
        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        const isExternal = !url.startsWith('/');
        return isExternal ? (
          <a
            className={footerLinkClassName({isActive: false})}
            href={url}
            key={item.id}
            rel="noopener noreferrer"
            target="_blank"
          >
            {item.title}
          </a>
        ) : (
          <NavLink
            className={footerLinkClassName}
            end
            key={item.id}
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
 * @param {{isActive: boolean; isPending?: boolean}}
 */
function footerLinkClassName({isActive, isPending}) {
  return [
    'decoration-1 underline-offset-4',
    isActive ? 'text-paper underline' : 'text-paper/75 hover:text-paper',
    isPending ? 'opacity-60' : '',
  ].join(' ');
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
      items: [],
    },
  ],
};

/**
 * @typedef {Object} FooterProps
 * @property {Promise<FooterQuery|null>} footer
 * @property {HeaderQuery} header
 * @property {string} publicStoreDomain
 */

/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */

/**
 * Shapes a Shopify menu for the header: internal URLs become paths, items
 * without a URL are dropped, and child collections keep their image for the
 * desktop dropdown preview.
 * @param {HeaderQuery['menu']} menu
 * @param {{publicStoreDomain: string; primaryDomainUrl: string}} domains
 * @return {NavItem[]}
 */
export function buildNav(menu, {publicStoreDomain, primaryDomainUrl}) {
  const toPath = (url) =>
    url.includes('myshopify.com') ||
    url.includes(publicStoreDomain) ||
    url.includes(primaryDomainUrl)
      ? new URL(url).pathname
      : url;

  /** @return {NavItem | null} */
  const toItem = (item) => {
    if (!item.url) return null;
    const image = item.resource?.image;
    return {
      id: item.id,
      title: item.title,
      to: toPath(item.url),
      image: image ?? null,
      items: (item.items ?? []).map(toItem).filter(Boolean),
    };
  };

  return (menu ?? FALLBACK_MENU).items.map(toItem).filter(Boolean);
}

/** Used when the store has no `main-menu` (e.g. mock.shop). */
const FALLBACK_MENU = {
  items: [
    {id: 'home', title: 'Home', url: '/'},
    {
      id: 'shop',
      title: 'Shop',
      url: '/collections/all',
      items: [
        {id: 'shop-all', title: 'Shop All', url: '/collections/all'},
        {id: 'polos', title: 'Polos', url: '/collections/polos'},
        {id: 'skorts', title: 'Skorts', url: '/collections/skorts'},
        {id: 'jackets', title: 'Jackets', url: '/collections/jackets'},
      ],
    },
    {id: 'collections', title: 'Collections', url: '/collections'},
    {id: 'contact', title: 'Contact', url: '/pages/contact'},
  ],
};

/**
 * @typedef {{
 *   id: string;
 *   title: string;
 *   to: string;
 *   image: {url: string; altText?: string | null; width?: number | null; height?: number | null} | null;
 *   items: NavItem[];
 * }} NavItem
 */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */

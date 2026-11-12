/**
 * Builds a page title as "<page> | <shop name>", reading the shop name the
 * root loader fetched from the Storefront API, so renaming the shop in
 * Shopify admin renames every title. Pass no page title for the home page.
 * @param {MetaArgs['matches']} matches
 * @param {string} [title]
 */
export function pageTitle(matches, title) {
  const root = matches?.find((match) => match?.id === 'root');
  const shopName = root?.loaderData?.header?.shop?.name;

  if (!title) return shopName ?? '';
  return shopName ? `${title} | ${shopName}` : title;
}

/** @typedef {import('react-router').MetaArgs} MetaArgs */

import {useCallback} from 'react';
import {useLocation} from 'react-router';

/**
 * Every locale this storefront serves. Each entry must match a market enabled
 * in Shopify admin (Settings → Markets), otherwise the Storefront API falls
 * back to the primary market.
 *
 * The first entry is the default locale and is served from the site root.
 * Every other locale is served under its own path prefix, for example:
 *   {language: 'EN', country: 'CA', pathPrefix: '/en-ca'}
 *   → /en-ca/products/linen-shirt
 *
 * Any prefix not listed here 404s (see `app/routes/($locale).jsx`).
 * @type {Locale[]}
 */
export const SUPPORTED_LOCALES = [
  {language: 'EN', country: 'BD', pathPrefix: ''},
];

export const DEFAULT_LOCALE = SUPPORTED_LOCALES[0];

/**
 * Resolves the locale for a pathname against the allow-list. Unknown prefixes
 * resolve to the default locale, which lets the `($locale)` route reject them.
 * @param {string} pathname
 * @returns {Locale}
 */
export function getLocaleFromPathname(pathname) {
  const firstPathPart = pathname.split('/')[1]?.toLowerCase();
  if (!firstPathPart) return DEFAULT_LOCALE;

  return (
    SUPPORTED_LOCALES.find(
      (locale) =>
        locale.pathPrefix &&
        locale.pathPrefix.slice(1).toLowerCase() === firstPathPart,
    ) ?? DEFAULT_LOCALE
  );
}

/**
 * @param {Request} request
 * @returns {Locale}
 */
export function getLocaleFromRequest(request) {
  return getLocaleFromPathname(new URL(request.url).pathname);
}

/**
 * Prefixes an absolute in-app path with the locale's path prefix. Relative
 * paths, external URLs and already-prefixed paths are returned unchanged.
 * @param {string} path
 * @param {string} pathPrefix
 */
export function localizePath(path, pathPrefix) {
  if (!pathPrefix || !path.startsWith('/') || path.startsWith('//')) {
    return path;
  }

  // `/en-ca`, `/en-ca/…`, `/en-ca?…` are already localized; `/en-card` is not.
  const rest = path.slice(pathPrefix.length);
  const isPrefixed =
    path.toLowerCase().startsWith(pathPrefix.toLowerCase()) &&
    (rest === '' || /^[/?#]/.test(rest));
  if (isPrefixed) return path;

  return path === '/' ? pathPrefix : pathPrefix + path;
}

/**
 * The locale of the page currently being viewed. Derived from the URL rather
 * than loader data so it stays correct on client-side navigations, where the
 * root loader does not revalidate.
 * @returns {Locale}
 */
export function useLocale() {
  const {pathname} = useLocation();
  return getLocaleFromPathname(pathname);
}

/**
 * Returns a function that prefixes absolute in-app paths with the current
 * locale. Use it for anything that isn't a `Link`/`NavLink` from
 * `~/components/Link`: form actions, `navigate()`, fetchers, plain `href`s.
 */
export function useLocalizedPath() {
  const {pathPrefix} = useLocale();
  return useCallback((path) => localizePath(path, pathPrefix), [pathPrefix]);
}

/**
 * @typedef {Object} Locale
 * @property {I18nBase['language']} language
 * @property {I18nBase['country']} country
 * @property {string} pathPrefix Empty for the default locale, otherwise `/xx-yy`.
 */

/** @typedef {import('@shopify/hydrogen').I18nBase} I18nBase */

import {forwardRef} from 'react';
// eslint-disable-next-line no-restricted-imports -- this module is the localized wrapper
import {Link as RouterLink, NavLink as RouterNavLink} from 'react-router';
import {useLocalizedPath} from '~/lib/i18n';

/**
 * Drop-in replacement for React Router's `Link` that keeps the visitor in
 * their locale: absolute paths like `/collections` become `/en-ca/collections`
 * when browsing a prefixed market. Import links from here, not react-router.
 */
export const Link = forwardRef(function Link({to, ...props}, ref) {
  const localize = useLocalizedPath();
  return <RouterLink {...props} ref={ref} to={localizeTo(to, localize)} />;
});

/**
 * Drop-in replacement for React Router's `NavLink`. See `Link`.
 */
export const NavLink = forwardRef(function NavLink({to, ...props}, ref) {
  const localize = useLocalizedPath();
  return <RouterNavLink {...props} ref={ref} to={localizeTo(to, localize)} />;
});

/**
 * @param {To} to
 * @param {(path: string) => string} localize
 * @returns {To}
 */
function localizeTo(to, localize) {
  if (typeof to === 'string') return localize(to);
  if (to?.pathname) return {...to, pathname: localize(to.pathname)};
  return to;
}

/** @typedef {import('react-router').To} To */

import {getSitemap} from '@shopify/hydrogen';
import {SUPPORTED_LOCALES} from '~/lib/i18n';

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({request, params, context: {storefront}}) {
  const response = await getSitemap({
    storefront,
    request,
    params,
    // Alternate-language links for every prefixed (non-default) locale
    locales: SUPPORTED_LOCALES.filter((locale) => locale.pathPrefix).map(
      ({language, country}) => `${language}-${country}`,
    ),
    getLink: ({type, baseUrl, handle, locale}) => {
      if (!locale) return `${baseUrl}/${type}/${handle}`;
      return `${baseUrl}/${locale.toLowerCase()}/${type}/${handle}`;
    },
  });

  response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);

  return response;
}

/** @typedef {import('./+types/sitemap.$type.$page[.xml]').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */

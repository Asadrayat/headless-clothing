/**
 * Rejects any locale prefix that isn't in `SUPPORTED_LOCALES`. Unknown
 * prefixes resolve to the default locale (which has no prefix), so a URL that
 * still carries a prefix here was not a supported locale.
 * @param {LoaderFunctionArgs}
 */
export async function loader({params, context}) {
  const {pathPrefix} = context.storefront.i18n;

  if (
    params.locale &&
    `/${params.locale}`.toLowerCase() !== pathPrefix.toLowerCase()
  ) {
    throw new Response(null, {status: 404});
  }

  return null;
}

/** @typedef {import('react-router').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */

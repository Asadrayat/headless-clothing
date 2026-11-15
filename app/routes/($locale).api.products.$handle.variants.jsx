/**
 * Resource route: a product's variants (id, availability, options) for quick
 * add on product cards. Loaded on demand, so card queries stay small.
 * @param {Route.LoaderArgs}
 */
export async function loader({context, params}) {
  const {storefront} = context;
  const {product} = await storefront.query(PRODUCT_VARIANTS_QUERY, {
    variables: {handle: params.handle},
    cache: storefront.CacheShort(),
  });

  if (!product) {
    throw new Response('Product not found', {status: 404});
  }

  return {variants: product.variants.nodes};
}

const PRODUCT_VARIANTS_QUERY = `#graphql
  query ProductCardVariants(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      variants(first: 250) {
        nodes {
          id
          availableForSale
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
`;

/** @typedef {import('./+types/($locale).api.products.$handle.variants').Route} Route */

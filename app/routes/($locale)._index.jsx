import {useLoaderData} from 'react-router';
import {MockShopNotice} from '~/components/MockShopNotice';
import {BrandStrip} from '~/components/home/BrandStrip';
import {CollectionTiles} from '~/components/home/CollectionTiles';
import {Hero} from '~/components/home/Hero';
import {NewArrivals} from '~/components/home/NewArrivals';
import {localizePath} from '~/lib/i18n';
import {pageTitle} from '~/lib/meta';

const SEO_TITLE = 'Women’s Golf & Tennis Apparel';
const SEO_DESCRIPTION =
  'EP NY women’s golf and tennis apparel: polos, skorts, vests and jackets in tech-stretch fabrics and playful prints.';

/**
 * Collections to feature first, in this order, when they exist and have
 * something in stock. Any gaps are filled from the store's other collections.
 */
const FEATURED_COLLECTION_HANDLES = ['polos', 'skorts', 'jackets', 'sunshirts'];
const COLLECTION_TILE_COUNT = 4;
const NEW_ARRIVAL_COUNT = 8;

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data, matches}) => {
  const title = pageTitle(matches, SEO_TITLE);
  const tags = [
    {title},
    {name: 'description', content: SEO_DESCRIPTION},
    {property: 'og:type', content: 'website'},
    {property: 'og:title', content: title},
    {property: 'og:description', content: SEO_DESCRIPTION},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];

  if (data?.canonicalUrl) {
    tags.push(
      {tagName: 'link', rel: 'canonical', href: data.canonicalUrl},
      {property: 'og:url', content: data.canonicalUrl},
    );
  }
  if (data?.ogImage) {
    tags.push(
      {property: 'og:image', content: data.ogImage.url},
      {property: 'og:image:width', content: String(data.ogImage.width)},
      {property: 'og:image:height', content: String(data.ogImage.height)},
      {property: 'og:image:alt', content: data.ogImage.alt},
    );
  }
  return tags;
};

/**
 * @param {Route.LoaderArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {Route.LoaderArgs}
 */
async function loadCriticalData({context, request}) {
  const {storefront} = context;

  const [{collections}] = await Promise.all([
    storefront.query(HOME_COLLECTIONS_QUERY, {
      cache: storefront.CacheLong(),
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  const featuredCollections = pickCollections(collections.nodes);
  const ogSource = featuredCollections[0]?.image;

  return {
    isShopLinked: Boolean(context.env.PUBLIC_STORE_DOMAIN),
    canonicalUrl:
      new URL(request.url).origin +
      localizePath('/', storefront.i18n.pathPrefix),
    featuredCollections,
    ogImage: ogSource
      ? {
          url: socialImageUrl(ogSource.url),
          width: 1200,
          height: 630,
          alt: ogSource.altText || featuredCollections[0].title,
        }
      : null,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {Route.LoaderArgs}
 */
function loadDeferredData({context}) {
  const newArrivals = context.storefront
    .query(HOME_NEW_ARRIVALS_QUERY)
    .then(({products}) => pickNewArrivals(products.nodes))
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {newArrivals};
}

/**
 * Collections that have an image and at least one product in stock, with the
 * featured handles first.
 * @param {HomeCollectionFragment[]} collections
 */
function pickCollections(collections) {
  const rank = (handle) => {
    const index = FEATURED_COLLECTION_HANDLES.indexOf(handle);
    return index === -1 ? FEATURED_COLLECTION_HANDLES.length : index;
  };

  return collections
    .filter(
      (collection) => collection.image && collection.products.nodes.length > 0,
    )
    .sort((a, b) => rank(a.handle) - rank(b.handle))
    .slice(0, COLLECTION_TILE_COUNT);
}

/**
 * The newest in-stock products. Those with a second image come first so the
 * cards have a hover image; newest-first order is kept within each group.
 * @param {HomeProductFragment[]} products
 */
function pickNewArrivals(products) {
  const inStock = products.filter(
    (product) => product.availableForSale && product.images.nodes.length > 0,
  );
  const hasHoverImage = (product) => product.images.nodes.length > 1;

  return [
    ...inStock.filter(hasHoverImage),
    ...inStock.filter((product) => !hasHoverImage(product)),
  ].slice(0, NEW_ARRIVAL_COUNT);
}

/**
 * A 1200×630 center crop from the Shopify CDN, for link previews.
 * @param {string} url
 */
function socialImageUrl(url) {
  const image = new URL(url);
  image.searchParams.set('width', '1200');
  image.searchParams.set('height', '630');
  image.searchParams.set('crop', 'center');
  return image.toString();
}

export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();
  return (
    <div className="mx-auto w-full max-w-7xl pt-4">
      {data.isShopLinked ? null : <MockShopNotice />}
      <Hero />
      <NewArrivals products={data.newArrivals} />
      <CollectionTiles collections={data.featuredCollections} />
      <BrandStrip />
    </div>
  );
}

const HOME_COLLECTIONS_QUERY = `#graphql
  fragment HomeCollection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
    products(first: 1, filters: [{available: true}]) {
      nodes {
        id
      }
    }
  }
  query HomeCollections($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 20) {
      nodes {
        ...HomeCollection
      }
    }
  }
`;

const HOME_NEW_ARRIVALS_QUERY = `#graphql
  fragment HomeProduct on Product {
    id
    title
    handle
    availableForSale
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    images(first: 2) {
      nodes {
        id
        url
        altText
        width
        height
      }
    }
  }
  query HomeNewArrivals($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(
      first: 24
      sortKey: CREATED_AT
      reverse: true
      query: "available_for_sale:true"
    ) {
      nodes {
        ...HomeProduct
      }
    }
  }
`;

/** @typedef {import('./+types/_index').Route} Route */
/** @typedef {import('storefrontapi.generated').HomeCollectionFragment} HomeCollectionFragment */
/** @typedef {import('storefrontapi.generated').HomeProductFragment} HomeProductFragment */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */

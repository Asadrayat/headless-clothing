import {Link} from '~/components/Link';
import {Image, Money} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';

/**
 * @param {{
 *   product:
 *     | CollectionItemFragment
 *     | ProductItemFragment
 *     | RecommendedProductFragment;
 *   loading?: 'eager' | 'lazy';
 * }}
 */
export function ProductItem({product, loading}) {
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  // The second product image, used to swap in on hover.
  const secondaryImage = product.images?.nodes?.[1];
  const variant = product.selectedOrFirstAvailableVariant;
  const hasVariantTitle = variant?.title && variant.title !== 'Default Title';

  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      <div className="product-item-media">
        {image && (
          <Image
            className="product-item-image product-item-image--primary"
            alt={image.altText || product.title}
            aspectRatio="1/1"
            data={image}
            loading={loading}
            sizes="(min-width: 45em) 400px, 100vw"
          />
        )}
        {secondaryImage && (
          <Image
            className="product-item-image product-item-image--secondary"
            alt={secondaryImage.altText || product.title}
            aspectRatio="1/1"
            data={secondaryImage}
            loading="lazy"
            sizes="(min-width: 45em) 400px, 100vw"
          />
        )}
      </div>
      <h4>{product.title}</h4>
      {hasVariantTitle && (
        <p className="product-item-variant">{variant.title}</p>
      )}
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
    </Link>
  );
}

/** @typedef {import('storefrontapi.generated').ProductItemFragment} ProductItemFragment */
/** @typedef {import('storefrontapi.generated').CollectionItemFragment} CollectionItemFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductFragment} RecommendedProductFragment */

import {Image} from '@shopify/hydrogen';

/**
 * Renders a single product image. Used on its own and as a tile inside the
 * product gallery, which is why the sizing hints are all overridable.
 * @param {{
 *   image?: ProductVariantFragment['image'];
 *   alt?: string;
 *   aspectRatio?: string;
 *   className?: string;
 *   loading?: 'eager' | 'lazy';
 *   sizes?: string;
 * }}
 */
export function ProductImage({
  image,
  alt,
  aspectRatio,
  className = 'product-image',
  loading,
  sizes = '(min-width: 45em) 50vw, 100vw',
}) {
  if (!image) {
    return <div className={className} />;
  }
  return (
    <Image
      alt={alt || image.altText || 'Product Image'}
      aspectRatio={aspectRatio}
      className={className}
      data={image}
      key={image.id}
      loading={loading}
      sizes={sizes}
    />
  );
}

/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */

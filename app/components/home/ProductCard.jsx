import {Image, Money} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {Card, CardContent} from '~/components/ui/card';
import {Skeleton} from '~/components/ui/skeleton';
import {useVariantUrl} from '~/lib/variants';

const IMAGE_SIZES =
  '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 75vw';

/**
 * Product card for the homepage: image, hover image (the product's second
 * image), title and price.
 * @param {{product: HomeProductFragment; loading?: 'eager' | 'lazy'}}
 */
export function ProductCard({product, loading = 'lazy'}) {
  const url = useVariantUrl(product.handle);
  const [image, hoverImage] = product.images.nodes;

  return (
    <Link
      className="group block h-full rounded-xl hover:no-underline"
      prefetch="intent"
      to={url}
    >
      <Card className="h-full gap-0 overflow-hidden py-0 shadow-none transition-shadow duration-200 group-hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-mist">
          {image ? (
            <Image
              alt={image.altText || product.title}
              aspectRatio="1/1"
              className="size-full object-cover"
              data={image}
              loading={loading}
              sizes={IMAGE_SIZES}
            />
          ) : null}
          {hoverImage ? (
            <Image
              // Decorative alternate view; the primary image carries the alt.
              alt=""
              aspectRatio="1/1"
              className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
              data={hoverImage}
              loading="lazy"
              sizes={IMAGE_SIZES}
            />
          ) : null}
        </div>
        <CardContent className="flex flex-1 flex-col gap-1 px-4 py-4">
          <h3 className="m-0 line-clamp-2 text-sm leading-snug font-medium text-ink group-hover:underline">
            {product.title}
          </h3>
          <Money
            className="mt-auto pt-1 text-sm text-muted tabular-nums"
            data={product.priceRange.minVariantPrice}
          />
        </CardContent>
      </Card>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Skeleton className="aspect-square rounded-none" />
      <div className="flex flex-col gap-2 px-4 py-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').HomeProductFragment} HomeProductFragment */

import {Image} from '@shopify/hydrogen';
import {ArrowUpRight} from 'lucide-react';
import {Link} from '~/components/Link';

/**
 * @param {{collections: HomeCollectionFragment[]}}
 */
export function CollectionTiles({collections}) {
  return (
    <section aria-labelledby="collections-heading" className="py-12 md:py-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2
          className="m-0 text-2xl leading-tight font-bold tracking-tight md:text-3xl"
          id="collections-heading"
        >
          Shop by collection
        </h2>
        <Link
          className="shrink-0 text-sm font-medium underline decoration-line decoration-2 underline-offset-[6px] hover:decoration-indigo"
          prefetch="intent"
          to="/collections"
        >
          All collections
        </Link>
      </div>

      {collections.length ? (
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {collections.map((collection) => (
            <Link
              className="group relative block overflow-hidden rounded-xl bg-mist hover:no-underline"
              key={collection.id}
              prefetch="intent"
              to={`/collections/${collection.handle}`}
            >
              <Image
                alt={
                  collection.image.altText || `${collection.title} collection`
                }
                aspectRatio="4/5"
                className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                data={collection.image}
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, 50vw"
              />
              <span className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-lg bg-paper px-3 py-2.5 text-sm font-semibold text-ink shadow-sm md:inset-x-3 md:bottom-3 md:px-4 md:text-base">
                <span className="truncate">{collection.title}</span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
                />
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed px-6 py-12 text-center">
          <p className="font-medium">No collections to show yet.</p>
        </div>
      )}
    </section>
  );
}

/** @typedef {import('storefrontapi.generated').HomeCollectionFragment} HomeCollectionFragment */

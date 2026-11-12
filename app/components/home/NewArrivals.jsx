import {Suspense} from 'react';
import {Await} from 'react-router';
import {Link} from '~/components/Link';
import {Button} from '~/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '~/components/ui/carousel';
import {ProductCard, ProductCardSkeleton} from './ProductCard';

const SLIDE = 'basis-[72%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4';

/**
 * @param {{products: Promise<HomeProductFragment[] | null>}}
 */
export function NewArrivals({products}) {
  return (
    <section aria-labelledby="new-arrivals-heading" className="py-12 md:py-16">
      <Carousel aria-label="New arrivals" opts={{align: 'start'}}>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2
              className="m-0 text-2xl leading-tight font-bold tracking-tight md:text-3xl"
              id="new-arrivals-heading"
            >
              New arrivals
            </h2>
            <p className="mt-1 text-sm text-muted">
              The latest pieces, in stock now.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CarouselPrevious className="static size-10 translate-y-0" />
            <CarouselNext className="static size-10 translate-y-0" />
          </div>
        </div>

        <Suspense fallback={<NewArrivalsSkeleton />}>
          <Await errorElement={<NewArrivalsEmpty />} resolve={products}>
            {(resolved) =>
              resolved?.length ? (
                <CarouselContent>
                  {resolved.map((product) => (
                    <CarouselItem className={SLIDE} key={product.id}>
                      <ProductCard product={product} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              ) : (
                <NewArrivalsEmpty />
              )
            }
          </Await>
        </Suspense>
      </Carousel>

      <div className="mt-8 flex justify-center">
        <Button asChild className="hover:no-underline" variant="outline">
          <Link prefetch="intent" to="/collections/all">
            View all products
          </Link>
        </Button>
      </div>
    </section>
  );
}

function NewArrivalsSkeleton() {
  return (
    <div aria-busy="true" className="flex gap-4 overflow-hidden">
      <span className="sr-only">Loading new arrivals</span>
      {Array.from({length: 4}, (_, index) => (
        <div
          className={`min-w-0 shrink-0 grow-0 ${SLIDE}`}
          key={index}
        >
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

function NewArrivalsEmpty() {
  return (
    <div className="rounded-xl border border-dashed px-6 py-12 text-center">
      <p className="font-medium">Nothing new in stock right now.</p>
      <p className="mt-1 text-sm text-muted">
        Browse the full range while we restock.
      </p>
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').HomeProductFragment} HomeProductFragment */

import {Suspense, useId} from 'react';
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
import {
  ProductCard,
  ProductCardSkeleton,
} from '~/components/product-card/ProductCard';

const SLIDE = 'basis-[72%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4';

/**
 * A homepage product carousel: heading, prev/next controls, product cards and
 * a "view all" link. Shows skeleton cards while the deferred products load.
 *
 * With no products, it shows `emptyState` when given and otherwise hides the
 * whole section.
 * @param {{
 *   title: string;
 *   description?: string;
 *   products: Promise<ProductCardFragment[] | null>;
 *   viewAll: {to: string; label: string};
 *   emptyState?: React.ReactNode;
 * }}
 */
export function ProductCarouselSection({
  title,
  description,
  products,
  viewAll,
  emptyState,
}) {
  const shell = {title, description, viewAll};
  const empty = emptyState ? (
    <SectionShell {...shell}>{emptyState}</SectionShell>
  ) : null;

  return (
    <Suspense
      fallback={
        <SectionShell {...shell}>
          <CarouselSkeleton label={title} />
        </SectionShell>
      }
    >
      <Await errorElement={empty} resolve={products}>
        {(resolved) =>
          resolved?.length ? (
            <SectionShell {...shell}>
              <CarouselContent>
                {resolved.map((product) => (
                  <CarouselItem className={SLIDE} key={product.id}>
                    <ProductCard product={product} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </SectionShell>
          ) : (
            empty
          )
        }
      </Await>
    </Suspense>
  );
}

/**
 * @param {{
 *   title: string;
 *   description?: string;
 *   viewAll: {to: string; label: string};
 *   children: React.ReactNode;
 * }}
 */
function SectionShell({title, description, viewAll, children}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="py-10 md:py-12">
      <Carousel aria-label={title} opts={{align: 'start'}}>
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2
              className="m-0 text-2xl leading-tight font-bold tracking-tight md:text-3xl"
              id={headingId}
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CarouselPrevious className="static size-10 translate-y-0" />
            <CarouselNext className="static size-10 translate-y-0" />
          </div>
        </div>

        {children}
      </Carousel>

      <div className="mt-8 flex justify-center">
        <Button asChild className="hover:no-underline" variant="outline">
          <Link prefetch="intent" to={viewAll.to}>
            {viewAll.label}
          </Link>
        </Button>
      </div>
    </section>
  );
}

/** @param {{label: string}} */
function CarouselSkeleton({label}) {
  return (
    <div aria-busy="true" className="flex gap-4 overflow-hidden">
      <span className="sr-only">Loading {label.toLowerCase()}</span>
      {Array.from({length: 4}, (_, index) => (
        <div className={`min-w-0 shrink-0 grow-0 ${SLIDE}`} key={index}>
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductCardFragment} ProductCardFragment */

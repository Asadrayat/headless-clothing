import {Link} from '~/components/Link';
import {Badge} from '~/components/ui/badge';
import {Button} from '~/components/ui/button';
import {HeroArt} from './HeroArt';

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative grid overflow-hidden rounded-2xl bg-mist py-0 lg:grid-cols-2"
    >
      <div className="relative z-10 flex flex-col items-start justify-center px-6 pt-10 pb-2 sm:px-10 md:pt-14 lg:py-20 lg:pr-0 lg:pl-14">
        <Badge className="border-line bg-paper text-ink" variant="outline">
          Women&rsquo;s golf &amp; tennis
        </Badge>
        <h1
          className="m-0 mt-5 text-5xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-6xl xl:text-7xl"
          id="hero-heading"
        >
          Play it preppy.
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-muted md:text-lg">
          Polos, skorts, vests and jackets in tech-stretch fabrics, with prints
          that bring a little New York energy to the club.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            asChild
            className="h-12 rounded-full px-7 text-base hover:no-underline"
            size="lg"
          >
            <Link prefetch="intent" to="/collections/all">
              Shop now
            </Link>
          </Button>
          <Button
            asChild
            className="h-12 rounded-full px-7 text-base hover:no-underline"
            size="lg"
            variant="outline"
          >
            <Link prefetch="intent" to="/collections">
              Browse collections
            </Link>
          </Button>
        </div>
      </div>
      <HeroArt className="h-72 sm:h-96 lg:h-auto lg:min-h-[560px]" />
    </section>
  );
}

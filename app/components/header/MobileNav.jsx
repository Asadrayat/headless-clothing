import {Suspense, useState} from 'react';
import {Await, useLocation} from 'react-router';
import {ChevronDown, Menu, UserRound} from 'lucide-react';
import {cn} from 'cn';
import {Link} from '~/components/Link';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/ui/sheet';
import {useLocalizedPath} from '~/lib/i18n';

const TOP_LEVEL =
  'flex w-full items-center justify-between rounded-xl px-3 py-3 text-lg font-semibold tracking-tight text-ink transition-colors hover:bg-ink/5 hover:no-underline';

/**
 * Mobile menu (below lg): a glass sheet from the left. Items with children are
 * native <details> disclosures, open by default when they hold the current
 * page.
 * @param {{
 *   items: NavItem[];
 *   shopName: string;
 *   isLoggedIn: Promise<boolean>;
 *   triggerClassName?: string;
 * }}
 */
export function MobileNav({items, shopName, isLoggedIn, triggerClassName}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const {pathname} = useLocation();
  const localize = useLocalizedPath();
  const isCurrent = (to) => localize(to) === pathname;

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          className={cn(triggerClassName, 'lg:hidden')}
          type="button"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        className="w-[88%] max-w-sm gap-0 border-r border-white/60 bg-white/80 p-0 shadow-[24px_0_60px_-20px_rgba(16,27,59,0.35)] backdrop-blur-2xl backdrop-saturate-150"
        side="left"
      >
        <SheetHeader className="px-6 pt-6 pb-3">
          <SheetTitle className="text-xl tracking-tight">{shopName}</SheetTitle>
          <SheetDescription className="sr-only">
            Site navigation
          </SheetDescription>
        </SheetHeader>

        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
            {items.map((item) => (
              <li key={item.id}>
                {item.items.length ? (
                  <details
                    className="group"
                    open={
                      [item, ...item.items].some((entry) =>
                        isCurrent(entry.to),
                      ) || undefined
                    }
                  >
                    <summary
                      className={cn(
                        TOP_LEVEL,
                        'cursor-pointer list-none [&::-webkit-details-marker]:hidden',
                      )}
                    >
                      {item.title}
                      <ChevronDown
                        aria-hidden="true"
                        className="size-5 text-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                      />
                    </summary>
                    <ul className="m-0 mb-2 ml-5 flex list-none flex-col border-l border-ink/10 py-1 pl-3 animate-in fade-in-0 slide-in-from-top-1 motion-reduce:animate-none">
                      {item.items.map((child) => (
                        <li key={child.id}>
                          <Link
                            aria-current={
                              isCurrent(child.to) ? 'page' : undefined
                            }
                            className="block rounded-lg px-3 py-2.5 text-base text-ink/75 transition-colors hover:bg-ink/5 hover:text-ink hover:no-underline aria-[current=page]:font-medium aria-[current=page]:text-ink"
                            onClick={close}
                            prefetch="intent"
                            to={child.to}
                          >
                            {child.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link
                    aria-current={isCurrent(item.to) ? 'page' : undefined}
                    className={TOP_LEVEL}
                    onClick={close}
                    prefetch="intent"
                    to={item.to}
                  >
                    {item.title}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-ink/8 px-6 py-5">
          <Link
            className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:no-underline"
            onClick={close}
            prefetch="intent"
            to="/account"
          >
            <UserRound aria-hidden="true" className="size-4" />
            <Suspense fallback="Sign in">
              <Await errorElement="Sign in" resolve={isLoggedIn}>
                {(loggedIn) => (loggedIn ? 'My account' : 'Sign in')}
              </Await>
            </Suspense>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** @typedef {import('~/lib/menu').NavItem} NavItem */

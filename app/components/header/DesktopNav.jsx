import {useState} from 'react';
import {useLocation} from 'react-router';
import {Image} from '@shopify/hydrogen';
import {ArrowRight, ChevronDown} from 'lucide-react';
import {NavigationMenu} from 'radix-ui';
import {cn} from 'cn';
import {Link} from '~/components/Link';
import {useLocalizedPath} from '~/lib/i18n';

const ITEM =
  'inline-flex h-9 cursor-pointer items-center gap-1 rounded-full px-3.5 text-sm font-medium text-ink/75 transition-colors duration-200 hover:bg-ink/6 hover:text-ink hover:no-underline';
const ACTIVE = 'bg-ink/6 text-ink';

/**
 * Desktop menu (lg and up). Items with children open a glass dropdown; Radix
 * NavigationMenu supplies hover intent, keyboard support and Escape.
 * @param {{items: NavItem[]}}
 */
export function DesktopNav({items}) {
  const isCurrent = useIsCurrent();

  return (
    <NavigationMenu.Root
      aria-label="Main"
      className="hidden justify-center lg:flex"
      delayDuration={80}
    >
      <NavigationMenu.List className="m-0 flex list-none items-center gap-0.5 p-0">
        {items.map((item) =>
          item.items.length ? (
            <NavigationMenu.Item
              className="relative"
              key={item.id}
              value={item.id}
            >
              <NavigationMenu.Trigger
                className={cn(
                  ITEM,
                  'group data-[state=open]:bg-ink/6 data-[state=open]:text-ink',
                  [item, ...item.items].some((entry) => isCurrent(entry.to)) &&
                    ACTIVE,
                )}
              >
                {item.title}
                <ChevronDown
                  aria-hidden="true"
                  className="size-3.5 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                />
              </NavigationMenu.Trigger>
              {/* The top padding bridges the gap to the trigger, so the
                  pointer can cross it without the menu closing. */}
              <NavigationMenu.Content className="absolute top-full left-1/2 -translate-x-1/2 pt-4">
                {/* Glass and animation live here, not on Content: a fading
                    ancestor would stop backdrop-filter from blurring the page. */}
                <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/75 shadow-[0_24px_60px_-20px_rgba(16,27,59,0.35)] ring-1 ring-ink/6 backdrop-blur-2xl backdrop-saturate-150 animate-in duration-200 fade-in-0 zoom-in-[0.98] slide-in-from-top-1 motion-reduce:animate-none">
                  <MenuPanel isCurrent={isCurrent} item={item} />
                </div>
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          ) : (
            <NavigationMenu.Item key={item.id}>
              <NavigationMenu.Link active={isCurrent(item.to)} asChild>
                <Link
                  className={cn(ITEM, isCurrent(item.to) && ACTIVE)}
                  prefetch="intent"
                  to={item.to}
                >
                  {item.title}
                </Link>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          ),
        )}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}

/**
 * Dropdown body: the item's links (two columns past five) and, when the
 * children are collections with images, a preview that follows the hovered or
 * focused link. Rendered only while open, so its images load on demand.
 * @param {{item: NavItem; isCurrent: (to: string) => boolean}}
 */
function MenuPanel({item, isCurrent}) {
  const withImages = item.items.filter((child) => child.image);
  const [previewId, setPreviewId] = useState(withImages[0]?.id);
  const preview = withImages.find((child) => child.id === previewId);
  const showViewAll = !item.items.some((child) => child.to === item.to);

  return (
    <div className="flex gap-2 p-2">
      <div className="flex min-w-60 flex-col p-2">
        <p className="m-0 px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
          {item.title}
        </p>
        <ul
          className={cn(
            'm-0 grid list-none gap-0.5 p-0',
            item.items.length > 5 &&
              'grid-cols-[repeat(2,minmax(10rem,auto))] gap-x-2',
          )}
        >
          {item.items.map((child) => (
            <li key={child.id}>
              <NavigationMenu.Link active={isCurrent(child.to)} asChild>
                <Link
                  className="group/link flex min-w-40 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-ink/80 transition-colors hover:bg-ink/6 hover:text-ink hover:no-underline data-active:font-medium data-active:text-ink"
                  onFocus={() => child.image && setPreviewId(child.id)}
                  onPointerEnter={() => child.image && setPreviewId(child.id)}
                  prefetch="intent"
                  to={child.to}
                >
                  {child.title}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-3.5 -translate-x-1 opacity-0 transition duration-200 group-hover/link:translate-x-0 group-hover/link:opacity-60 group-focus-visible/link:translate-x-0 group-focus-visible/link:opacity-60"
                  />
                </Link>
              </NavigationMenu.Link>
            </li>
          ))}
        </ul>
        {showViewAll ? (
          <NavigationMenu.Link asChild>
            <Link
              className="mx-3 mt-3 inline-flex items-center gap-1.5 border-t border-ink/8 pt-3 text-xs font-semibold tracking-wide text-ink hover:no-underline"
              prefetch="intent"
              to={item.to}
            >
              View all {item.title.toLowerCase()}
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </NavigationMenu.Link>
        ) : null}
      </div>

      {preview ? (
        // Duplicates the hovered link for pointer users only.
        <Link
          aria-hidden="true"
          className="relative block min-h-60 w-56 shrink-0 overflow-hidden rounded-xl bg-mist hover:no-underline"
          tabIndex={-1}
          to={preview.to}
        >
          {/* All previews mount together so switching between them is instant. */}
          {withImages.map((child) => (
            <Image
              alt=""
              aspectRatio="4/5"
              className={cn(
                'absolute inset-0 size-full object-cover transition-opacity duration-300 motion-reduce:transition-none',
                child.id === preview.id ? 'opacity-100' : 'opacity-0',
              )}
              data={child.image}
              key={child.id}
              loading="eager"
              sizes="224px"
            />
          ))}
          <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-ink/70 to-transparent p-4 pt-12 text-sm font-semibold text-paper">
            {preview.title}
          </span>
        </Link>
      ) : null}
    </div>
  );
}

/** Whether a menu path is the current page (locale prefix aware). */
function useIsCurrent() {
  const {pathname} = useLocation();
  const localize = useLocalizedPath();
  return (to) => localize(to) === pathname;
}

/** @typedef {import('~/lib/menu').NavItem} NavItem */

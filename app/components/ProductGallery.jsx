import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import {ProductImage} from '~/components/ProductImage';

/**
 * Every piece of product media, laid out with the first item across the full
 * width and the rest in a two column grid. Clicking any tile opens the
 * lightbox, where the media is shown uncropped.
 * @param {{
 *   media?: ProductFragment['media']['nodes'];
 *   selectedVariantImage?: ProductVariantFragment['image'];
 *   fallbackImage?: ProductFragment['featuredImage'];
 *   title: string;
 * }}
 */
export function ProductGallery({
  media,
  selectedVariantImage,
  fallbackImage,
  title,
}) {
  const items = useGalleryItems({media, selectedVariantImage, fallbackImage});
  const [openIndex, setOpenIndex] = useState(null);
  const tileRefs = useRef([]);

  const closeLightbox = useCallback(() => {
    // Hand focus back to the tile the lightbox was opened from.
    tileRefs.current[openIndex]?.focus();
    setOpenIndex(null);
  }, [openIndex]);

  if (!items.length) {
    return <div className="product-gallery" />;
  }

  return (
    <>
      <div className="product-gallery">
        {items.map((item, index) => (
          <button
            aria-label={`Open ${mediaLabel(item, title)} (${index + 1} of ${
              items.length
            })`}
            className={
              index === 0
                ? 'product-gallery-item product-gallery-item--hero'
                : 'product-gallery-item'
            }
            key={item.id}
            onClick={() => setOpenIndex(index)}
            ref={(node) => {
              tileRefs.current[index] = node;
            }}
            type="button"
          >
            <ProductImage
              alt={item.alt || title}
              aspectRatio={index === 0 ? undefined : '1/1'}
              className="product-gallery-image"
              image={mediaImage(item)}
              loading={index === 0 ? 'eager' : 'lazy'}
              sizes={
                index === 0
                  ? '(min-width: 45em) 50vw, 100vw'
                  : '(min-width: 45em) 25vw, 50vw'
              }
            />
            {isVideo(item) && (
              <span aria-hidden="true" className="product-gallery-badge">
                <PlayIcon />
              </span>
            )}
          </button>
        ))}
      </div>
      {openIndex !== null && (
        <ProductGalleryLightbox
          index={openIndex}
          items={items}
          onChange={setOpenIndex}
          onClose={closeLightbox}
          title={title}
        />
      )}
    </>
  );
}

/**
 * Full screen viewer for a single media item, with arrow key and click
 * navigation through the rest of the gallery.
 * @param {{
 *   index: number;
 *   items: GalleryItem[];
 *   onChange: (index: number) => void;
 *   onClose: () => void;
 *   title: string;
 * }}
 */
function ProductGalleryLightbox({index, items, onChange, onClose, title}) {
  const dialogRef = useRef(null);
  const item = items[index];
  const hasMultiple = items.length > 1;

  const goTo = useCallback(
    (offset) => onChange((index + offset + items.length) % items.length),
    [index, items.length, onChange],
  );

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Keep the page behind the overlay from scrolling.
  useEffect(() => {
    const {overflow} = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight' && hasMultiple) {
        goTo(1);
      } else if (event.key === 'ArrowLeft' && hasMultiple) {
        goTo(-1);
      } else if (event.key === 'Tab') {
        trapFocus(event, dialogRef.current);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goTo, hasMultiple, onClose]);

  return (
    <div
      aria-label={`${title} media viewer`}
      aria-modal="true"
      className="product-gallery-lightbox"
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      {/* Clicking away from the media dismisses the viewer. The close button
      below covers the same action for keyboard and screen reader users. */}
      <button
        aria-hidden="true"
        className="product-gallery-lightbox-backdrop"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <button
        aria-label="Close media viewer"
        className="product-gallery-lightbox-close"
        onClick={onClose}
        type="button"
      >
        <CloseIcon />
      </button>
      {hasMultiple && (
        <button
          aria-label="Previous media"
          className="product-gallery-lightbox-nav product-gallery-lightbox-nav--prev"
          onClick={() => goTo(-1)}
          type="button"
        >
          <ChevronIcon />
        </button>
      )}
      <figure className="product-gallery-lightbox-frame">
        <LightboxMedia item={item} title={title} />
        {hasMultiple && (
          <figcaption className="product-gallery-lightbox-counter">
            {index + 1} / {items.length}
          </figcaption>
        )}
      </figure>
      {hasMultiple && (
        <button
          aria-label="Next media"
          className="product-gallery-lightbox-nav product-gallery-lightbox-nav--next"
          onClick={() => goTo(1)}
          type="button"
        >
          <ChevronIcon />
        </button>
      )}
    </div>
  );
}

/**
 * @param {{item: GalleryItem; title: string}}
 */
function LightboxMedia({item, title}) {
  if (item.__typename === 'Video' && item.sources?.length) {
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption -- the Storefront API exposes no caption tracks for product videos
      <video
        autoPlay
        className="product-gallery-lightbox-media"
        controls
        key={item.id}
        playsInline
        poster={item.previewImage?.url ?? undefined}
      >
        {item.sources.map((source) => (
          <source key={source.url} src={source.url} type={source.mimeType} />
        ))}
      </video>
    );
  }

  if (item.__typename === 'ExternalVideo' && item.embedUrl) {
    return (
      <iframe
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        className="product-gallery-lightbox-media product-gallery-lightbox-embed"
        src={item.embedUrl}
        title={mediaLabel(item, title)}
      />
    );
  }

  const image = mediaImage(item);
  if (!image) return null;

  return (
    <Image
      alt={item.alt || image.altText || title}
      className="product-gallery-lightbox-media"
      data={image}
      key={item.id}
      sizes="(min-width: 45em) 70vw, 100vw"
    />
  );
}

/**
 * Media in gallery order: the selected variant's image first, then the rest of
 * the product media as the merchant ordered it.
 * @param {{
 *   media?: ProductFragment['media']['nodes'];
 *   selectedVariantImage?: ProductVariantFragment['image'];
 *   fallbackImage?: ProductFragment['featuredImage'];
 * }}
 * @returns {GalleryItem[]}
 */
function useGalleryItems({media, selectedVariantImage, fallbackImage}) {
  return useMemo(() => {
    const renderable = (media ?? []).filter(
      (item) => item && (mediaImage(item)?.url || item.embedUrl),
    );
    const items = renderable.length ? renderable : imageAsMedia(fallbackImage);

    if (!selectedVariantImage?.id) return items;

    const selected = items.findIndex(
      (item) =>
        item.__typename === 'MediaImage' &&
        item.image?.id === selectedVariantImage.id,
    );
    if (selected === 0) return items;
    if (selected > 0) {
      return [
        items[selected],
        ...items.slice(0, selected),
        ...items.slice(selected + 1),
      ];
    }
    // The variant image isn't part of the product media, so lead with it.
    return [...imageAsMedia(selectedVariantImage), ...items];
  }, [media, selectedVariantImage, fallbackImage]);
}

/**
 * Wraps a plain image so it can be rendered alongside real media nodes.
 * @param {ProductFragment['featuredImage']} [image]
 * @returns {GalleryItem[]}
 */
function imageAsMedia(image) {
  if (!image?.url) return [];
  return [
    {
      __typename: 'MediaImage',
      alt: image.altText,
      id: image.id,
      image,
      mediaContentType: 'IMAGE',
      previewImage: image,
    },
  ];
}

/**
 * The still image to render for a media node, whatever its type.
 * @param {GalleryItem} item
 */
function mediaImage(item) {
  const image = item.__typename === 'MediaImage' ? item.image : null;
  return image ?? item.previewImage;
}

/**
 * @param {GalleryItem} item
 */
function isVideo(item) {
  return item.__typename === 'Video' || item.__typename === 'ExternalVideo';
}

/**
 * @param {GalleryItem} item
 * @param {string} title
 */
function mediaLabel(item, title) {
  if (isVideo(item)) return `${title} video`;
  return item.alt || `${title} image`;
}

/**
 * Cycles Tab within the overlay so keyboard focus can't wander behind it.
 * @param {KeyboardEvent} event
 * @param {HTMLElement | null} container
 */
function trapFocus(event, container) {
  if (!container) return;

  const focusable = container.querySelectorAll(
    'button:not([tabindex="-1"]), [href], input, select, textarea, video, iframe, [tabindex]:not([tabindex="-1"])',
  );
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && (active === first || active === container)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function PlayIcon() {
  return (
    <svg fill="none" height="20" viewBox="0 0 20 20" width="20">
      <path d="M7 4.5l9 5.5-9 5.5v-11z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
      <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg fill="none" height="20" viewBox="0 0 12 20" width="12">
      <path d="M10 1L2 10l8 9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** @typedef {ProductFragment['media']['nodes'][number]} GalleryItem */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
/** @typedef {import('storefrontapi.generated').ProductVariantFragment} ProductVariantFragment */

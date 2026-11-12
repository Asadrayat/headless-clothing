import {Component, lazy, Suspense, useEffect, useRef, useState} from 'react';

/**
 * three.js is browser-only. The server build swaps the import for a no-op so
 * none of it is bundled into, or evaluated by, the worker.
 */
const HeroScene = lazy(() =>
  import.meta.env.SSR
    ? Promise.resolve({default: () => null})
    : import('./HeroScene'),
);

/**
 * Decorative hero artwork. The static SVG is server-rendered and is what
 * every visitor sees first. Once the page has loaded and the device looks up
 * to it, the 3D canvas is lazy-loaded and cross-fades in over the SVG.
 * @param {{className?: string}}
 */
export function HeroArt({className = ''}) {
  const ref = useRef(null);
  const {mount, active} = useHero3D(ref);
  const [painted, setPainted] = useState(false);
  const [failed, setFailed] = useState(false);
  const show3D = mount && !failed;

  return (
    <div aria-hidden="true" className={`relative ${className}`} ref={ref}>
      <StaticArt
        className={`absolute inset-0 size-full transition-opacity duration-700 ${
          show3D && painted ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {show3D ? (
        <SceneBoundary onError={() => setFailed(true)}>
          <Suspense fallback={null}>
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
                painted ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <HeroScene
                active={active}
                onLost={() => setFailed(true)}
                onReady={() => setPainted(true)}
              />
            </div>
          </Suspense>
        </SceneBoundary>
      ) : null}
    </div>
  );
}

/**
 * Decides whether the 3D scene may mount, and whether it should be rendering
 * right now.
 *
 * - `mount` turns true at most once, after window load plus an idle slot, and
 *   only for capable devices. It turns false again if the visitor switches on
 *   reduced motion.
 * - `active` is true while the hero is on screen and the tab is visible; the
 *   scene stops its render loop otherwise.
 * @param {React.RefObject<HTMLElement>} ref
 */
function useHero3D(ref) {
  const [capable, setCapable] = useState(false);
  const [inView, setInView] = useState(false);
  const [seen, setSeen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let idleId;
    let timeoutId;

    const evaluate = () => setCapable(canRun3D(reducedMotion));
    const whenIdle = () => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(evaluate, {timeout: 2000});
      } else {
        timeoutId = window.setTimeout(evaluate, 200);
      }
    };

    if (document.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, {once: true});

    const onMotionChange = () => {
      if (reducedMotion.matches) setCapable(false);
    };
    reducedMotion.addEventListener('change', onMotionChange);

    return () => {
      window.removeEventListener('load', whenIdle);
      reducedMotion.removeEventListener('change', onMotionChange);
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) setSeen(true);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return {mount: capable && seen, active: inView && tabVisible};
}

/**
 * @param {MediaQueryList} reducedMotion
 */
function canRun3D(reducedMotion) {
  if (reducedMotion.matches) return false;

  // Small screens keep the static art: the scene is not worth the bytes there.
  if (window.innerWidth < 640) return false;

  // Low-power hints. All optional APIs; missing values are treated as fine.
  const {deviceMemory, hardwareConcurrency, connection} = navigator;
  if (connection?.saveData) return false;
  if (deviceMemory && deviceMemory < 4) return false;
  if (hardwareConcurrency && hardwareConcurrency < 4) return false;

  // WebGL must exist and be hardware accelerated.
  try {
    const canvas = document.createElement('canvas');
    const options = {failIfMajorPerformanceCaveat: true};
    const gl =
      canvas.getContext('webgl2', options) ||
      canvas.getContext('webgl', options);
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    return false;
  }

  return true;
}

/** Falls back to the static art if the scene chunk or WebGL throws. */
class SceneBoundary extends Component {
  state = {failed: false};

  static getDerivedStateFromError() {
    return {failed: true};
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The same cast of shapes as the 3D scene, drawn flat. Colors come from the
 * brand tokens through Tailwind's fill utilities.
 * @param {{className?: string}}
 */
function StaticArt({className}) {
  return (
    <svg
      className={className}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 600 600"
    >
      <defs>
        <pattern
          height="44"
          id="hero-dots-paper"
          patternUnits="userSpaceOnUse"
          width="44"
        >
          <circle className="fill-paper" cx="11" cy="11" r="7" />
          <circle className="fill-paper" cx="33" cy="33" r="7" />
        </pattern>
        <pattern
          height="36"
          id="hero-dots-ink"
          patternUnits="userSpaceOnUse"
          width="36"
        >
          <circle className="fill-ink" cx="9" cy="9" r="5.5" />
          <circle className="fill-ink" cx="27" cy="27" r="5.5" />
        </pattern>
        <pattern
          height="84"
          id="hero-argyle-punch"
          patternUnits="userSpaceOnUse"
          width="56"
        >
          <path className="fill-punch" d="M28 0 56 42 28 84 0 42Z" />
          <path
            className="stroke-paper"
            d="M0 0 56 84M56 0 0 84"
            fill="none"
            strokeDasharray="5 5"
            strokeWidth="2"
          />
        </pattern>
        <pattern
          height="60"
          id="hero-argyle-indigo"
          patternUnits="userSpaceOnUse"
          width="40"
        >
          <path className="fill-indigo" d="M20 0 40 30 20 60 0 30Z" />
          <path
            className="stroke-sun"
            d="M0 0 40 60M40 0 0 60"
            fill="none"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
        </pattern>
        <radialGradient cx="34%" cy="28%" id="hero-shade" r="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.38" />
          <stop offset="45%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
        </radialGradient>
        <linearGradient id="hero-shade-flat" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {/* small court-green ball */}
      <circle className="fill-court" cx="118" cy="150" r="46" />
      <circle cx="118" cy="150" fill="url(#hero-shade)" r="46" />

      {/* sun disc with navy dots */}
      <g transform="rotate(-18 468 118)">
        <ellipse className="fill-ink/25" cx="468" cy="132" rx="84" ry="60" />
        <ellipse className="fill-sun" cx="468" cy="118" rx="84" ry="60" />
        <ellipse cx="468" cy="118" fill="url(#hero-dots-ink)" rx="84" ry="60" />
        <ellipse
          cx="468"
          cy="118"
          fill="url(#hero-shade-flat)"
          rx="84"
          ry="60"
        />
      </g>

      {/* big bluebelle ball with white dots */}
      <circle className="fill-indigo" cx="318" cy="282" r="152" />
      <circle cx="318" cy="282" fill="url(#hero-dots-paper)" r="152" />
      <circle cx="318" cy="282" fill="url(#hero-shade)" r="152" />

      {/* small navy argyle cube */}
      <g transform="rotate(16 492 300)">
        <rect
          className="fill-ink"
          height="96"
          rx="22"
          width="96"
          x="444"
          y="252"
        />
        <rect
          fill="url(#hero-argyle-indigo)"
          height="96"
          rx="22"
          width="96"
          x="444"
          y="252"
        />
        <rect
          fill="url(#hero-shade-flat)"
          height="96"
          rx="22"
          width="96"
          x="444"
          y="252"
        />
      </g>

      {/* candy-apple argyle cube */}
      <g transform="rotate(-14 150 432)">
        <rect
          className="fill-apple"
          height="176"
          rx="36"
          width="176"
          x="62"
          y="344"
        />
        <rect
          fill="url(#hero-argyle-punch)"
          height="176"
          rx="36"
          width="176"
          x="62"
          y="344"
        />
        <rect
          fill="url(#hero-shade-flat)"
          height="176"
          rx="36"
          width="176"
          x="62"
          y="344"
        />
      </g>

      {/* fruit-punch ball with white dots */}
      <circle className="fill-punch" cx="486" cy="470" r="60" />
      <circle
        cx="486"
        cy="470"
        fill="url(#hero-dots-paper)"
        opacity="0.9"
        r="60"
      />
      <circle cx="486" cy="470" fill="url(#hero-shade)" r="60" />
    </svg>
  );
}

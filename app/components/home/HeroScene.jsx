/**
 * Browser-only. Import this module through the lazy loader in HeroArt.jsx,
 * never directly, so three.js stays out of the server bundle and the initial
 * client bundle.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {PerformanceMonitor, RoundedBox} from '@react-three/drei';
import {CanvasTexture, RepeatWrapping, SRGBColorSpace} from 'three';

const TOKENS = ['ink', 'paper', 'indigo', 'apple', 'punch', 'sun', 'court'];

/**
 * @param {{
 *   active: boolean;
 *   onReady: () => void;
 *   onLost: () => void;
 * }}
 */
export default function HeroScene({active, onReady, onLost}) {
  const [maxDpr, setMaxDpr] = useState(getMaxDpr);

  return (
    <Canvas
      aria-hidden="true"
      camera={{fov: 35, position: [0, 0, 10]}}
      dpr={[1, maxDpr]}
      // Brand colors as authored: no filmic tone mapping.
      flat
      // Stops the render loop when the hero is off screen or the tab hidden.
      frameloop={active ? 'always' : 'never'}
      gl={{alpha: true, antialias: true, powerPreference: 'default'}}
      onCreated={({gl}) => {
        gl.domElement.addEventListener('webglcontextlost', onLost, {
          once: true,
        });
      }}
      tabIndex={-1}
    >
      <PerformanceMonitor onDecline={() => setMaxDpr(1)} />
      <ambientLight intensity={1.6} />
      <directionalLight intensity={2.2} position={[-4, 6, 8]} />
      <directionalLight intensity={0.6} position={[5, -3, 4]} />
      <Shapes onReady={onReady} />
    </Canvas>
  );
}

/** 1.5 on phones and tablets, 2 on desktop. */
function getMaxDpr() {
  const isMobile =
    window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 1024;
  return Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
}

/**
 * @param {{onReady: () => void}}
 */
function Shapes({onReady}) {
  const group = useRef(null);
  const pointer = useRef({x: 0, y: 0});
  const ready = useRef(false);
  const viewport = useThree((state) => state.viewport);
  const maxAnisotropy = useThree((state) =>
    Math.min(4, state.gl.capabilities.getMaxAnisotropy()),
  );
  // The layout needs about a 6.8 unit square including drift; shrink to fit
  // smaller canvases.
  const scale = Math.min(1, viewport.width / 6.8, viewport.height / 6.8);

  const textures = useMemo(() => {
    const c = readBrandColors();
    const prepare = (texture) => {
      texture.anisotropy = maxAnisotropy;
      return texture;
    };
    return {
      bigBall: prepare(dotTexture(c.indigo, c.paper, [6, 3])),
      punchBall: prepare(dotTexture(c.punch, c.paper, [6, 3])),
      disc: prepare(dotTexture(c.sun, c.ink, [3, 3])),
      appleCube: prepare(argyleTexture(c.apple, c.punch, c.paper, [1.4, 1])),
      inkCube: prepare(argyleTexture(c.ink, c.indigo, c.sun, [2.4, 1.7])),
      court: c.court,
      sun: c.sun,
    };
  }, [maxAnisotropy]);

  useEffect(() => {
    return () => {
      Object.values(textures).forEach((texture) => texture.dispose?.());
    };
  }, [textures]);

  // The canvas ignores pointer events so it never blocks the page; follow the
  // pointer across the whole window instead.
  useEffect(() => {
    const onMove = (event) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, {passive: true});
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((_, delta) => {
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
    const g = group.current;
    if (!g) return;
    const ease = 1 - Math.exp(-Math.min(delta, 0.1) * 3);
    const scroll = Math.min(window.scrollY / window.innerHeight, 1.5);
    g.rotation.y += (pointer.current.x * 0.22 - g.rotation.y) * ease;
    g.rotation.x +=
      (pointer.current.y * 0.14 + scroll * 0.3 - g.rotation.x) * ease;
    g.position.y += (scroll * 1.4 - g.position.y) * ease;
  });

  return (
    <group ref={group} scale={scale}>
      <Drift phase={0} position={[0.2, 0.15, 0]} spin={0.12}>
        <mesh>
          <sphereGeometry args={[1.55, 48, 32]} />
          <meshStandardMaterial map={textures.bigBall} roughness={0.55} />
        </mesh>
      </Drift>

      <Drift phase={1.7} position={[-1.85, -1.6, 0.6]} range={0.2} spin={0.2}>
        <RoundedBox
          args={[1.75, 1.75, 1.75]}
          radius={0.34}
          rotation={[0.35, 0.5, -0.2]}
          smoothness={5}
        >
          <meshStandardMaterial map={textures.appleCube} roughness={0.6} />
        </RoundedBox>
      </Drift>

      <Drift phase={3.1} position={[1.75, 1.95, -0.4]} range={0.22} spin={0.1}>
        <mesh rotation={[1.1, 0.25, 0.35]}>
          <cylinderGeometry args={[0.9, 0.9, 0.22, 48]} />
          {/* Plain rim, dotted faces: the pattern would smear around the edge. */}
          <meshStandardMaterial
            attach="material-0"
            color={textures.sun}
            roughness={0.6}
          />
          <meshStandardMaterial
            attach="material-1"
            map={textures.disc}
            roughness={0.6}
          />
          <meshStandardMaterial
            attach="material-2"
            map={textures.disc}
            roughness={0.6}
          />
        </mesh>
      </Drift>

      <Drift phase={4.4} position={[-2.2, 1.55, -0.8]} range={0.28} spin={0.1}>
        <mesh>
          <sphereGeometry args={[0.48, 32, 24]} />
          <meshStandardMaterial color={textures.court} roughness={0.5} />
        </mesh>
      </Drift>

      <Drift phase={5.2} position={[2.05, -1.9, 0.7]} range={0.24} spin={0.18}>
        <mesh>
          <sphereGeometry args={[0.62, 32, 24]} />
          <meshStandardMaterial map={textures.punchBall} roughness={0.55} />
        </mesh>
      </Drift>

      <Drift phase={2.4} position={[2.0, 0.1, 1.1]} range={0.18} spin={0.25}>
        <RoundedBox
          args={[0.9, 0.9, 0.9]}
          radius={0.2}
          rotation={[0.4, -0.5, 0.3]}
          smoothness={5}
        >
          <meshStandardMaterial map={textures.inkCube} roughness={0.6} />
        </RoundedBox>
      </Drift>
    </group>
  );
}

/**
 * Slow bob and turn. Time is accumulated from clamped frame deltas, so the
 * motion resumes smoothly after the render loop has been paused.
 * @param {{
 *   position: [number, number, number];
 *   phase?: number;
 *   range?: number;
 *   spin?: number;
 *   children: React.ReactNode;
 * }}
 */
function Drift({position, phase = 0, range = 0.25, spin = 0.15, children}) {
  const ref = useRef(null);
  const time = useRef(phase);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    time.current += Math.min(delta, 0.1);
    const t = time.current;
    g.position.x = position[0] + Math.cos(t * 0.35) * range * 0.45;
    g.position.y = position[1] + Math.sin(t * 0.5) * range;
    g.rotation.x = Math.sin(t * 0.3) * spin;
    g.rotation.y = t * spin * 0.6;
    g.rotation.z = Math.cos(t * 0.25) * spin * 0.6;
  });

  return (
    <group position={position} ref={ref}>
      {children}
    </group>
  );
}

/** Reads the brand tokens from tailwind.css so the scene follows the theme. */
function readBrandColors() {
  const styles = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    TOKENS.map((name) => [
      name,
      styles.getPropertyValue(`--color-${name}`).trim() || '#101b3b',
    ]),
  );
}

/**
 * @param {(ctx: CanvasRenderingContext2D, size: number) => void} draw
 * @param {[number, number]} repeat
 */
function patternTexture(draw, repeat) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  return texture;
}

/** A seamless tile of staggered polka dots. */
function dotTexture(background, dot, repeat) {
  return patternTexture((ctx, size) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = dot;
    const r = size * 0.15;
    const centers = [
      [0.25, 0.25],
      [0.75, 0.75],
    ];
    for (const [x, y] of centers) {
      ctx.beginPath();
      ctx.arc(x * size, y * size, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, repeat);
}

/** A seamless argyle tile: one diamond with dashed diagonal stitching. */
function argyleTexture(background, diamond, stitch, repeat) {
  return patternTexture((ctx, size) => {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = diamond;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size, size / 2);
    ctx.lineTo(size / 2, size);
    ctx.lineTo(0, size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = stitch;
    ctx.lineWidth = size * 0.02;
    ctx.setLineDash([size * 0.05, size * 0.05]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(size, size);
    ctx.moveTo(size, 0);
    ctx.lineTo(0, size);
    ctx.stroke();
  }, repeat);
}

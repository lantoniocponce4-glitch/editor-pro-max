import React, {useEffect, useState} from "react";
import {
  AbsoluteFill,
  Img,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

/**
 * Motor de escenas de la serie "Amor en Fit Life".
 * Los personajes son recortes reales (PNG con transparencia en public/serie/) que se animan
 * como actores: entran caminando, se giran, se inclinan, saltan, respiran y hablan con globos.
 */

export const OSWALD = "Oswald, 'Arial Narrow', Impact, sans-serif";
export const SERIF = "'Playfair Display', Georgia, serif";
export const GOLD = "#f2c76e";
export const RED = "#d8172e";
export const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
export const serie = (f: string) => staticFile(`serie/${f}`);

export const useSerieFonts = () => {
  const [handle] = useState(() => delayRender("Cargando fuentes"));
  useEffect(() => {
    const faces = [
      new FontFace("Oswald", `url(${staticFile("fonts/oswald-latin-700-normal.woff2")}) format("woff2")`, {weight: "700"}),
      new FontFace("Oswald", `url(${staticFile("fonts/oswald-latin-600-normal.woff2")}) format("woff2")`, {weight: "600"}),
      new FontFace("Playfair Display", `url(${staticFile("fonts/playfair-display-latin-600-italic.woff2")}) format("woff2")`, {weight: "600", style: "italic"}),
    ];
    Promise.all(faces.map((x) => x.load()))
      .then((loaded) => {
        loaded.forEach((x) => document.fonts.add(x));
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);
};

export const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/* ---------- actores ---------- */

export type ActorImg = {src: string; w: number; h: number};
export const ACTORS = {
  luis: {src: "luis.png", w: 627, h: 1228},
  cynia: {src: "cynia.png", w: 547, h: 1155},
  bruno: {src: "bruno-busto.png", w: 761, h: 1362},
  brunoEchado: {src: "bruno-echado.png", w: 2384, h: 1255},
  cumple: {src: "cumple-grupo.png", w: 1121, h: 1175},
} as const;

/** Una "clave" de movimiento: en el cuadro f el actor está en x,y con estos ajustes. */
export type Key = {
  f: number;
  x: number; // centro horizontal (px de pantalla)
  y: number; // pies (px de pantalla)
  h?: number; // alto en pantalla
  rot?: number; // grados
  flip?: boolean; // mirar al otro lado
  op?: number;
};

const ease = Easing.inOut(Easing.cubic);

/** Interpola entre claves. */
const pose = (keys: Key[], frame: number) => {
  if (frame <= keys[0].f) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.f) {
      const t = ease((frame - a.f) / Math.max(1, b.f - a.f));
      const lerp = (p?: number, q?: number, d = 0) => (p ?? d) + ((q ?? p ?? d) - (p ?? d)) * t;
      return {
        f: frame,
        x: lerp(a.x, b.x),
        y: lerp(a.y, b.y),
        h: lerp(a.h, b.h, 1000),
        rot: lerp(a.rot, b.rot),
        op: lerp(a.op, b.op, 1),
        flip: t < 0.5 ? a.flip : b.flip,
        moving: Math.abs(b.x - a.x) > 20,
      };
    }
  }
  return keys[keys.length - 1];
};

/**
 * Actor recortado. Camina (balanceo + pasos) cuando se desplaza, respira cuando está quieto,
 * y puede "saltar" (hop) o "temblar" (shake) en cuadros puntuales.
 */
export const Actor: React.FC<{
  who: ActorImg;
  keys: Key[];
  hops?: number[];
  shakes?: number[];
  shadow?: boolean;
  z?: number;
  tint?: string;
}> = ({who, keys, hops = [], shakes = [], shadow = true, z = 1, tint}) => {
  const frame = useCurrentFrame();
  const p = pose(keys, frame) as Key & {moving?: boolean};
  const h = p.h ?? 1000;
  const w = (who.w / who.h) * h;
  const walking = (p as {moving?: boolean}).moving ?? false;
  const step = walking ? Math.abs(Math.sin(frame / 4.2)) : 0;
  const bob = walking ? -step * h * 0.018 : Math.sin(frame / 22) * h * 0.003;
  const sway = walking ? Math.sin(frame / 4.2) * 2.2 : Math.sin(frame / 40) * 0.6;
  const breathe = walking ? 1 : 1 + Math.sin(frame / 22) * 0.006;
  const hop = Math.max(0, ...hops.map((s) => (frame >= s && frame <= s + 14 ? Math.sin(((frame - s) / 14) * Math.PI) : 0)));
  const shake = Math.max(0, ...shakes.map((s) => interpolate(frame, [s, s + 18], [1, 0], clamp)));
  const sx = Math.sin(frame * 2.3) * 10 * shake;
  const op = p.op ?? 1;
  if (op <= 0.01) return null;
  return (
    <div style={{position: "absolute", left: p.x - w / 2, top: p.y - h, width: w, height: h, zIndex: z, opacity: op}}>
      {shadow && (
        <div style={{position: "absolute", left: w * 0.12, right: w * 0.12, bottom: -h * 0.015, height: h * 0.05, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 70%)", transform: `scale(${1 - hop * 0.35})`}} />
      )}
      <Img
        src={serie(who.src)}
        style={{
          width: "100%",
          height: "100%",
          transformOrigin: "50% 100%",
          transform: `translate(${sx}px, ${bob - hop * h * 0.16}px) rotate(${(p.rot ?? 0) + sway}deg) scaleX(${p.flip ? -1 : 1}) scaleY(${breathe})`,
          filter: `drop-shadow(0 10px 18px rgba(0,0,0,0.35)) ${tint ?? ""}`,
        }}
      />
    </div>
  );
};

/* ---------- escenarios ---------- */

/** Fondo fotográfico con encuadre de cámara (centro y alto visible en px de la foto). */
export const Backdrop: React.FC<{
  src: string;
  size: [number, number];
  cam: [number, number, number][]; // [cx, cy, alto visible] por clave
  camF: number[]; // cuadros de cada clave
  blur?: number;
  dim?: number;
}> = ({src, size, cam, camF, blur = 2, dim = 0.15}) => {
  const frame = useCurrentFrame();
  const i = Math.max(0, camF.findIndex((f, k) => frame < (camF[k + 1] ?? Infinity) && frame >= f));
  const a = cam[i];
  const b = cam[Math.min(i + 1, cam.length - 1)];
  const t = camF[i + 1] ? ease(Math.min(1, (frame - camF[i]) / (camF[i + 1] - camF[i]))) : 0;
  const cx = a[0] + (b[0] - a[0]) * t;
  const cy = a[1] + (b[1] - a[1]) * t;
  const vh = a[2] + (b[2] - a[2]) * t;
  const k = Math.max(1920 / vh, 1080 / size[0]);
  const w = size[0] * k;
  const h = size[1] * k;
  const left = Math.min(0, Math.max(1080 - w, 540 - cx * k));
  const top = Math.min(0, Math.max(1920 - h, 960 - cy * k));
  return (
    <AbsoluteFill style={{overflow: "hidden", background: "#050505"}}>
      <Img src={src} style={{position: "absolute", width: w, height: h, left, top, maxWidth: "none", filter: `blur(${blur}px) brightness(${1 - dim})`}} />
    </AbsoluteFill>
  );
};

/** Piso con brillo para que los actores no "floten" sobre la foto. */
export const Floor: React.FC<{y: number; color?: string}> = ({y, color = "rgba(10,10,14,0.85)"}) => (
  <div style={{position: "absolute", left: 0, right: 0, top: y, bottom: 0, background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${color} 18%, ${color} 100%)`}} />
);

/* ---------- efectos ---------- */

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.08}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: "overlay", opacity, pointerEvents: "none", zIndex: 50}}>
      <svg width="1080" height="1920">
        <filter id={`sg${frame % 7}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 97} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter={`url(#sg${frame % 7})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Look: React.FC<{tint?: string; vignette?: number}> = ({tint = "rgba(20,60,80,0.22)", vignette = 0.7}) => (
  <>
    <AbsoluteFill style={{background: tint, mixBlendMode: "soft-light", zIndex: 40, pointerEvents: "none"}} />
    <AbsoluteFill style={{background: `radial-gradient(ellipse 72% 58% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)`, zIndex: 41, pointerEvents: "none"}} />
  </>
);

export const Flash: React.FC<{at?: number; len?: number; color?: string}> = ({at = 0, len = 10, color = "#ffffff"}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 1, at + len], [0, 0.8, 0], clamp);
  return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: "none", zIndex: 60}} />;
};

/** Sacudida de cámara en un cuadro. */
export const useShake = (at: number[], strength = 14) => {
  const frame = useCurrentFrame();
  const k = Math.max(0, ...at.map((a) => interpolate(frame, [a, a + 10], [1, 0], clamp)));
  return `translate(${Math.sin(frame * 2.7) * strength * k}px, ${Math.cos(frame * 3.1) * strength * k}px)`;
};

/** Zoom de cámara sobre un punto de la pantalla (para primeros planos dentro de la escena). */
export const Camera: React.FC<{keys: {f: number; z: number; x: number; y: number}[]; children: React.ReactNode; shake?: number[]}> = ({keys, children, shake = []}) => {
  const frame = useCurrentFrame();
  let z = keys[0].z;
  let x = keys[0].x;
  let y = keys[0].y;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame >= a.f && frame <= b.f) {
      const t = ease((frame - a.f) / Math.max(1, b.f - a.f));
      z = a.z + (b.z - a.z) * t;
      x = a.x + (b.x - a.x) * t;
      y = a.y + (b.y - a.y) * t;
    } else if (frame > b.f) {
      z = b.z;
      x = b.x;
      y = b.y;
    }
  }
  const sh = useShake(shake, 16);
  // centrar el punto (x, y) sin mostrar nada fuera del escenario
  const tx = Math.min(x * (z - 1), Math.max((1080 - x) * (1 - z), 540 - x));
  const ty = Math.min(y * (z - 1), Math.max((1920 - y) * (1 - z), 960 - y));
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <AbsoluteFill style={{transform: `${sh} translate(${tx}px, ${ty}px) scale(${z})`, transformOrigin: `${x}px ${y}px`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- textos ---------- */

/** Globo de diálogo que apunta al personaje que habla. */
export const Speech: React.FC<{text: string; start: number; end: number; x: number; y: number; tail?: "left" | "right" | "center"; size?: number; tone?: "normal" | "grito" | "pensamiento"}> = ({text, start, end, x, y, tail = "center", size = 58, tone = "normal"}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start || frame >= end) return null;
  const s = spring({frame: frame - start, fps, config: {damping: 12, stiffness: 200}});
  const out = interpolate(frame, [end - 6, end], [1, 0], clamp);
  const tailX = tail === "left" ? "22%" : tail === "right" ? "78%" : "50%";
  const shown = text.slice(0, Math.ceil((frame - start) * 1.6));
  const bg = tone === "pensamiento" ? "rgba(255,255,255,0.92)" : "#fffaf2";
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${s})`, transformOrigin: `${tailX} 100%`, opacity: out, zIndex: 30}}>
      <div style={{position: "relative", background: bg, color: "#1b1012", fontFamily: tone === "grito" ? OSWALD : SERIF, fontStyle: tone === "grito" ? "normal" : "italic", fontWeight: tone === "grito" ? 700 : 600, fontSize: tone === "grito" ? size * 1.15 : size, lineHeight: 1.15, padding: "20px 34px 24px", borderRadius: tone === "pensamiento" ? 60 : 30, maxWidth: 760, width: "max-content", textAlign: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.45)", border: tone === "grito" ? `6px solid ${RED}` : "none"}}>
        {shown}
        <span style={{opacity: 0}}>{text.slice(shown.length)}</span>
        {tone === "pensamiento" ? (
          <>
            <div style={{position: "absolute", left: tailX, bottom: -34, width: 26, height: 26, borderRadius: "50%", background: bg}} />
            <div style={{position: "absolute", left: `calc(${tailX} + 14px)`, bottom: -60, width: 14, height: 14, borderRadius: "50%", background: bg}} />
          </>
        ) : (
          <div style={{position: "absolute", left: tailX, bottom: -30, width: 0, height: 0, transform: "translateX(-50%)", borderLeft: "20px solid transparent", borderRight: "20px solid transparent", borderTop: `34px solid ${tone === "grito" ? RED : bg}`}} />
        )}
      </div>
    </div>
  );
};

/** Narración centrada estilo drama. */
export const Narration: React.FC<{text: string; start: number; end?: number; top?: number; size?: number}> = ({text, start, end = Infinity, top = 1500, size = 66}) => {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const t = interpolate(frame, [start, start + 16], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const out = Number.isFinite(end) ? interpolate(frame, [end - 8, end], [1, 0], clamp) : 1;
  return (
    <AbsoluteFill style={{top, height: "auto", alignItems: "center", padding: "0 80px", opacity: t * out, zIndex: 45}}>
      <div style={{fontFamily: SERIF, fontStyle: "italic", fontWeight: 600, fontSize: size, lineHeight: 1.18, color: "#fff7ea", textAlign: "center", textWrap: "balance", transform: `translateY(${(1 - t) * 26}px)`, textShadow: "0 4px 24px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.9)"}}>{text}</div>
    </AbsoluteFill>
  );
};

/** Ficha de personaje. */
export const NameCard: React.FC<{name: string; tag: string; start: number; end?: number; color?: string; top?: number}> = ({name, tag, start, end = Infinity, color = RED, top = 1380}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start || frame >= end) return null;
  const bar = spring({frame: frame - start, fps, config: {damping: 16, stiffness: 140}});
  const nm = spring({frame: frame - start - 5, fps, config: {damping: 13, stiffness: 160}});
  const tg = interpolate(frame, [start + 14, start + 30], [0, 1], clamp);
  const out = Number.isFinite(end) ? interpolate(frame, [end - 8, end], [1, 0], clamp) : 1;
  return (
    <AbsoluteFill style={{top, height: "auto", paddingLeft: 70, opacity: out, zIndex: 46}}>
      <div style={{position: "absolute", left: 0, right: 0, top: -60, height: 420, background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0) 100%)"}} />
      <div style={{position: "relative"}}>
        <div style={{position: "absolute", left: -70, top: 14, width: 700 * bar, height: 130, background: `linear-gradient(90deg, ${color} 0%, ${color} 70%, rgba(0,0,0,0) 100%)`, opacity: 0.92}} />
        <div style={{position: "relative", fontFamily: OSWALD, fontWeight: 700, fontSize: 140, lineHeight: 1, color: "#fff", letterSpacing: "0.04em", transform: `translateX(${(1 - nm) * -120}px)`, opacity: nm, textShadow: "0 6px 20px rgba(0,0,0,0.5)"}}>{name.toUpperCase()}</div>
        <div style={{width: 340 * tg, height: 4, background: GOLD, margin: "20px 0 16px"}} />
        <div style={{fontFamily: SERIF, fontStyle: "italic", fontWeight: 600, fontSize: 50, color: GOLD, opacity: tg, textShadow: "0 3px 16px rgba(0,0,0,0.9)"}}>{tag}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Íconos que flotan sobre un personaje (corazones, rayos de celos, signos). */
export const Emote: React.FC<{kind: "corazon" | "rayo" | "sorpresa" | "sudor" | "nota"; x: number; y: number; start: number; end: number; size?: number}> = ({kind, x, y, start, end, size = 90}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start || frame >= end) return null;
  const s = spring({frame: frame - start, fps, config: {damping: 9, stiffness: 220}});
  const float = Math.sin((frame - start) / 6) * 8;
  const out = interpolate(frame, [end - 6, end], [1, 0], clamp);
  const icon = {
    corazon: <path d="M0,38 C-60,0 -50,-50 0,-18 C50,-50 60,0 0,38 Z" fill="#ff4f7a" stroke="#fff" strokeWidth={5} />,
    rayo: <path d="M8,-50 L-26,6 L-2,6 L-12,50 L26,-8 L2,-8 Z" fill="#ffd32a" stroke="#1b1012" strokeWidth={5} strokeLinejoin="round" />,
    sorpresa: (
      <g>
        <rect x={-9} y={-48} width={18} height={62} rx={8} fill="#fff" stroke="#1b1012" strokeWidth={4} />
        <circle cx={0} cy={34} r={11} fill="#fff" stroke="#1b1012" strokeWidth={4} />
      </g>
    ),
    sudor: <path d="M0,-40 C18,-6 30,10 30,24 A30,30 0 0 1 -30,24 C-30,10 -18,-6 0,-40 Z" fill="#8fd3ff" stroke="#fff" strokeWidth={4} />,
    nota: (
      <g>
        <path d="M-10,30 L-10,-36 L30,-46 L30,20" stroke="#fff" strokeWidth={8} fill="none" />
        <circle cx={-20} cy={30} r={14} fill="#fff" />
        <circle cx={20} cy={20} r={14} fill="#fff" />
      </g>
    ),
  }[kind];
  return (
    <svg width={size * 1.4} height={size * 1.4} viewBox="-70 -70 140 140" style={{position: "absolute", left: x - size * 0.7, top: y - size * 0.7 + float, transform: `scale(${s})`, opacity: out, zIndex: 35, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.4))"}}>
      {icon}
    </svg>
  );
};

/** Lluvia de corazones. */
export const Hearts: React.FC<{count?: number; from?: number}> = ({count = 12, from = 0}) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  return (
    <AbsoluteFill style={{pointerEvents: "none", zIndex: 34}}>
      {Array.from({length: count}).map((_, i) => {
        const t = (frame - from + i * 19) % 140;
        const x = 80 + rand(i) * 920 + Math.sin((frame + i * 30) / 16) * 30;
        const y = 1800 - t * 12;
        const o = interpolate(t, [0, 15, 110, 140], [0, 0.8, 0.8, 0]);
        const sz = 40 + rand(i + 3) * 60;
        return (
          <svg key={i} width={sz} height={sz} viewBox="-50 -45 100 90" style={{position: "absolute", left: x, top: y, opacity: o}}>
            <path d="M0,38 C-60,0 -50,-50 0,-18 C50,-50 60,0 0,38 Z" fill={i % 3 ? "#ff4f7a" : "#ffb3c6"} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

/** Tarjeta de título del episodio. */
export const EpisodeTitle: React.FC<{num: number; title: string}> = ({num, title}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 12, stiffness: 120}});
  const shine = interpolate(frame, [10, 50], [-40, 140], clamp);
  const t2 = interpolate(frame, [20, 36], [0, 1], clamp);
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "center", zIndex: 47}}>
      <div style={{transform: `scale(${0.85 + 0.15 * s})`, opacity: s, display: "flex", flexDirection: "column", alignItems: "center"}}>
        <div style={{fontFamily: OSWALD, fontWeight: 600, fontSize: 64, letterSpacing: "0.5em", color: "#fff", marginRight: "-0.5em"}}>AMOR EN</div>
        <div style={{fontFamily: OSWALD, fontWeight: 700, fontSize: 200, lineHeight: 1, backgroundImage: `linear-gradient(110deg, #b8862e 0%, #f7dc8b ${shine - 20}%, #fffbe8 ${shine}%, #f7dc8b ${shine + 20}%, #b8862e 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.6))"}}>FIT LIFE</div>
        <div style={{marginTop: 34, fontFamily: OSWALD, fontWeight: 600, fontSize: 44, letterSpacing: "0.3em", color: "#fff", background: RED, padding: "8px 30px 10px 40px"}}>EPISODIO {num}</div>
        <div style={{marginTop: 26, fontFamily: SERIF, fontStyle: "italic", fontWeight: 600, fontSize: 70, color: GOLD, opacity: t2, transform: `translateY(${(1 - t2) * 20}px)`, textShadow: "0 4px 20px rgba(0,0,0,0.8)"}}>{title}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Cierre con "Continuará…" o "Fin". */
export const EndCard: React.FC<{text: string; sub: string}> = ({text, sub}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - 4, fps, config: {damping: 12}});
  const t = interpolate(frame, [26, 42], [0, 1], clamp);
  const beat = 1 + 0.12 * Math.max(0, Math.sin(frame / 5));
  return (
    <AbsoluteFill style={{background: "#000", alignItems: "center", justifyContent: "center", zIndex: 70}}>
      <div style={{fontFamily: OSWALD, fontWeight: 700, fontSize: 140, letterSpacing: "0.06em", color: GOLD, transform: `scale(${0.85 + 0.15 * s})`, opacity: s, textShadow: "0 0 40px rgba(242,199,110,0.35)"}}>{text}</div>
      <div style={{marginTop: 28, fontFamily: SERIF, fontStyle: "italic", fontWeight: 600, fontSize: 58, color: "#fff", opacity: t}}>{sub}</div>
      <svg width={110} height={110} viewBox="-50 -45 100 90" style={{marginTop: 80, opacity: t, transform: `scale(${beat})`}}>
        <path d="M0,38 C-60,0 -50,-50 0,-18 C50,-50 60,0 0,38 Z" fill="#ff4f7a" />
      </svg>
    </AbsoluteFill>
  );
};

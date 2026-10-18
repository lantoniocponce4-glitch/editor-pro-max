import React, {useEffect, useState} from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import TIMING from "./drama-timing.json";

/**
 * Mini drama vertical "Amor en Fit Life · Episodio 1" (1080x1920, 30 fps, 51 s).
 * Usa public/drama/pareja.jpg (foto de la pareja) y public/cumpleanos/retrato.jpg (Bruno).
 * Tiempos en drama-timing.json; música en public/drama/musica.mp3 (scripts/drama-music.py).
 */

export type DramaProps = {
  el: string;
  ella: string;
  mascota: string;
  music?: boolean;
};

const S = TIMING.scenes as unknown as Record<string, [number, number]>;
export const DRAMA_DURATION = S.final[0] + S.final[1];

const OSWALD = "Oswald, 'Arial Narrow', Impact, sans-serif";
const SERIF = "'Playfair Display', Georgia, serif";
const GOLD = "#f2c76e";
const RED = "#d8172e";
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

// Foto de la pareja: 2576 x 1717 px. Puntos de interés en píxeles de la foto.
const PHOTO: [number, number] = [2576, 1717];
const P = {
  luis: [1124, 660],
  cynia: [1418, 740],
  mano: [1230, 880],
  letrero: [1340, 290],
  pareja: [1220, 1000],
} as const;

const useFonts = () => {
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

const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/* ---------- efectos de cine ---------- */

/** Grano de película que cambia en cada cuadro. */
const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: "overlay", opacity, pointerEvents: "none"}}>
      <svg width="1080" height="1920">
        <filter id={`g${frame % 7}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 97} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter={`url(#g${frame % 7})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Viñeta cinematográfica y tono frío en sombras / cálido en luces. */
const Look: React.FC<{tint?: string; vignette?: number}> = ({tint = "rgba(20,60,80,0.28)", vignette = 0.75}) => (
  <>
    <AbsoluteFill style={{background: tint, mixBlendMode: "soft-light"}} />
    <AbsoluteFill style={{background: `radial-gradient(ellipse 70% 55% at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,${vignette}) 100%)`}} />
  </>
);

/** Destello blanco de transición. */
const Flash: React.FC<{at?: number; len?: number; color?: string}> = ({at = 0, len = 10, color = "#ffffff"}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 1, at + len], [0, 0.85, 0], clamp);
  return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: "none"}} />;
};

/** Sacudida breve de cámara en los golpes musicales. */
const useShake = (at: number, strength = 14) => {
  const frame = useCurrentFrame();
  const k = interpolate(frame, [at, at + 10], [1, 0], clamp);
  return `translate(${Math.sin(frame * 2.7) * strength * k}px, ${Math.cos(frame * 3.1) * strength * k}px)`;
};

/** Encuadre de la foto: centro (cx, cy) y alto visible en píxeles de la foto. */
const Frame: React.FC<{src: string; size: [number, number]; from: [number, number, number]; to: [number, number, number]; dur: number; filter?: string; blur?: number}> = ({src, size, from, to, dur, filter = "contrast(1.1) saturate(1.05)", blur = 0}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const cx = from[0] + (to[0] - from[0]) * t;
  const cy = from[1] + (to[1] - from[1]) * t;
  const vh = from[2] + (to[2] - from[2]) * t;
  const k = Math.max(1920 / vh, 1080 / size[0]);
  const w = size[0] * k;
  const h = size[1] * k;
  const left = Math.min(0, Math.max(1080 - w, 540 - cx * k));
  const top = Math.min(0, Math.max(1920 - h, 960 - cy * k));
  return (
    <AbsoluteFill style={{overflow: "hidden", background: "#050505"}}>
      <Img src={src} style={{position: "absolute", width: w, height: h, left, top, maxWidth: "none", filter: `${filter}${blur ? ` blur(${blur}px)` : ""}`}} />
    </AbsoluteFill>
  );
};

const pareja = () => staticFile("drama/pareja.jpg");

/* ---------- textos ---------- */

/** Frase narrada al centro, estilo drama. */
const Line: React.FC<{text: string; start: number; end?: number; top?: number; size?: number; typewriter?: boolean}> = ({text, start, end = Infinity, top = 1380, size = 74, typewriter}) => {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const t = interpolate(frame, [start, start + 18], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const out = Number.isFinite(end) ? interpolate(frame, [end - 8, end], [1, 0], clamp) : 1;
  const shown = typewriter ? text.slice(0, Math.floor((frame - start) * 1.1)) : text;
  return (
    <AbsoluteFill style={{top, height: "auto", alignItems: "center", padding: "0 80px", opacity: typewriter ? out : t * out}}>
      <div style={{fontFamily: SERIF, fontStyle: "italic", fontWeight: 600, fontSize: size, lineHeight: 1.18, color: "#fff7ea", textAlign: "center", textWrap: "balance", transform: `translateY(${typewriter ? 0 : (1 - t) * 30}px)`, textShadow: "0 4px 24px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.8)"}}>
        {shown}
        {typewriter && shown.length < text.length && <span style={{color: GOLD}}>|</span>}
      </div>
    </AbsoluteFill>
  );
};

/** Ficha de presentación del personaje (barra roja + nombre grande). */
const NameCard: React.FC<{name: string; tag: string; start: number; color?: string}> = ({name, tag, start, color = RED}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start) return null;
  const bar = spring({frame: frame - start, fps, config: {damping: 16, stiffness: 140}});
  const nm = spring({frame: frame - start - 5, fps, config: {damping: 13, stiffness: 160}});
  const tg = interpolate(frame, [start + 14, start + 30], [0, 1], clamp);
  return (
    <AbsoluteFill style={{top: 1330, height: "auto", paddingLeft: 70}}>
      <div style={{position: "relative"}}>
        <div style={{position: "absolute", left: -70, top: 18, width: 720 * bar, height: 150, background: `linear-gradient(90deg, ${color} 0%, ${color} 70%, rgba(0,0,0,0) 100%)`, opacity: 0.92}} />
        <div style={{position: "relative", fontFamily: OSWALD, fontWeight: 700, fontSize: 168, lineHeight: 1, color: "#ffffff", letterSpacing: "0.04em", transform: `translateX(${(1 - nm) * -120}px)`, opacity: nm, textShadow: "0 6px 20px rgba(0,0,0,0.5)"}}>
          {name.toUpperCase()}
        </div>
        <div style={{width: 360 * tg, height: 4, background: GOLD, margin: "22px 0 18px"}} />
        <div style={{fontFamily: SERIF, fontStyle: "italic", fontWeight: 600, fontSize: 56, color: GOLD, opacity: tg, textShadow: "0 3px 16px rgba(0,0,0,0.9)"}}>{tag}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Subtítulo de diálogo con el nombre de quien habla. */
const Dialogue: React.FC<{who: string; text: string; start: number; end: number}> = ({who, text, start, end}) => {
  const frame = useCurrentFrame();
  if (frame < start || frame >= end) return null;
  const t = interpolate(frame, [start, start + 10, end - 8, end], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{top: 1420, height: "auto", alignItems: "center", padding: "0 60px", opacity: t}}>
      <div style={{fontFamily: OSWALD, fontWeight: 600, fontSize: 44, letterSpacing: "0.18em", color: GOLD, marginBottom: 10, textShadow: "0 2px 10px rgba(0,0,0,0.9)"}}>{who.toUpperCase()}</div>
      <div style={{fontFamily: OSWALD, fontWeight: 600, fontSize: 80, lineHeight: 1.15, color: "#ffffff", textAlign: "center", textWrap: "balance", background: "rgba(0,0,0,0.45)", padding: "14px 34px", borderRadius: 14, textShadow: "0 3px 12px rgba(0,0,0,0.8)"}}>
        “{text}”
      </div>
    </AbsoluteFill>
  );
};

const Heart: React.FC<{size: number; color?: string}> = ({size, color = "#ff4f7a"}) => (
  <svg width={size} height={size} viewBox="-50 -45 100 90">
    <path d="M0,38 C-60,0 -50,-50 0,-18 C50,-50 60,0 0,38 Z" fill={color} />
  </svg>
);

const FloatingHearts: React.FC<{count?: number}> = ({count = 14}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {Array.from({length: count}).map((_, i) => {
        const t = (frame + i * 19) % 150;
        const x = 80 + rand(i) * 920 + Math.sin((frame + i * 30) / 16) * 30;
        const y = 1900 - t * 13;
        const o = interpolate(t, [0, 15, 120, 150], [0, 0.75, 0.75, 0]);
        return (
          <div key={i} style={{position: "absolute", left: x, top: y, opacity: o, filter: `blur(${rand(i + 9) > 0.6 ? 3 : 0}px)`}}>
            <Heart size={40 + rand(i + 3) * 60} color={i % 3 ? "#ff4f7a" : "#ffb3c6"} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- escenas ---------- */

const Apertura: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.5 + 0.5 * Math.max(0, ...TIMING.heartbeats.filter((h) => h < 150).map((h) => interpolate(frame, [h, h + 3, h + 14], [0, 1, 0], clamp)));
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, rgba(160,10,30,${0.25 * pulse}) 0%, rgba(0,0,0,0) 55%)`}} />
      <Line text="Nadie imaginó que una rutina de gimnasio…" start={10} end={78} top={820} typewriter size={70} />
      <Line text="…cambiaría dos vidas para siempre." start={80} top={820} typewriter size={70} />
      <Grain opacity={0.14} />
    </AbsoluteFill>
  );
};

const Titulo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 12, stiffness: 120}});
  const shine = interpolate(frame, [12, 50], [-40, 140], clamp);
  return (
    <AbsoluteFill style={{transform: useShake(0, 18)}}>
      <Frame src={pareja()} size={PHOTO} from={[P.letrero[0], P.letrero[1] + 300, 1000]} to={[P.letrero[0], P.letrero[1] + 300, 900]} dur={90} blur={10} filter="brightness(0.45) contrast(1.2)" />
      <Look vignette={0.85} />
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", transform: `scale(${0.8 + 0.2 * s})`, opacity: s}}>
        <div style={{fontFamily: OSWALD, fontWeight: 600, fontSize: 70, letterSpacing: "0.5em", color: "#ffffff", marginRight: "-0.5em"}}>AMOR EN</div>
        <div style={{fontFamily: OSWALD, fontWeight: 700, fontSize: 220, lineHeight: 1, letterSpacing: "0.02em", backgroundImage: `linear-gradient(110deg, #b8862e 0%, #f7dc8b ${shine - 20}%, #fffbe8 ${shine}%, #f7dc8b ${shine + 20}%, #b8862e 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.6))"}}>
          FIT LIFE
        </div>
        <div style={{marginTop: 40, fontFamily: OSWALD, fontWeight: 600, fontSize: 48, letterSpacing: "0.3em", color: "#fff", background: RED, padding: "10px 34px 12px 44px"}}>EPISODIO 1</div>
      </AbsoluteFill>
      <Flash len={12} />
      <Grain />
    </AbsoluteFill>
  );
};

const Retrato: React.FC<{who: "luis" | "cynia"; name: string; tag: string}> = ({who, name, tag}) => {
  const pt = P[who];
  return (
    <AbsoluteFill style={{transform: useShake(50, 10)}}>
      <Frame src={pareja()} size={PHOTO} from={[pt[0], pt[1] + 260, 1150]} to={[pt[0], pt[1] + 240, 880]} dur={150} />
      <Look />
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.75) 100%)"}} />
      <NameCard name={name} tag={tag} start={50} />
      <Flash len={10} />
      <Flash at={50} len={8} color="#ffe9c0" />
      <Grain />
    </AbsoluteFill>
  );
};

const Miradas: React.FC = () => {
  const frame = useCurrentFrame();
  const half = (pt: readonly [number, number], z0: number, z1: number) => {
    // cada mitad muestra 1080 x 960; se simula con un Frame recortado
    const t = interpolate(frame, [0, 180], [0, 1], clamp);
    const vh = z0 + (z1 - z0) * t;
    const k = 960 / vh;
    const w = PHOTO[0] * k;
    const h = PHOTO[1] * k;
    return (
      <div style={{position: "relative", width: 1080, height: 960, overflow: "hidden"}}>
        <Img src={pareja()} style={{position: "absolute", width: w, height: h, left: Math.min(0, Math.max(1080 - w, 540 - pt[0] * k)), top: Math.min(0, Math.max(960 - h, 480 - pt[1] * k)), maxWidth: "none", filter: "contrast(1.1)"}} />
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{flexDirection: "column"}}>
        {half([P.luis[0], P.luis[1] + 40], 520, 440)}
        {half([P.cynia[0], P.cynia[1] + 40], 520, 440)}
      </AbsoluteFill>
      <div style={{position: "absolute", left: 0, top: 956, width: 1080, height: 8, background: GOLD}} />
      <Look vignette={0.6} />
      <Line text="Él llegaba todos los días a las 7." start={8} end={64} top={760} size={66} />
      <Line text="Ella también." start={64} end={110} top={1700} size={70} />
      <Line text="Durante semanas… solo miradas." start={112} top={880} size={70} />
      <Flash len={10} />
      <Grain />
    </AbsoluteFill>
  );
};

const Letrero: React.FC = () => {
  const frame = useCurrentFrame();
  const sparkle = Array.from({length: 10}).map((_, i) => {
    const t = (frame + i * 13) % 60;
    return {x: 120 + rand(i) * 840, y: 640 + rand(i + 4) * 360, o: interpolate(t, [0, 8, 20], [0, 1, 0], clamp), s: 18 + rand(i + 7) * 26};
  });
  return (
    <AbsoluteFill style={{transform: useShake(0, 12)}}>
      <Frame src={pareja()} size={PHOTO} from={[640, 470, 940]} to={[1960, 470, 940]} dur={150} filter="contrast(1.2) brightness(1.05)" />
      <Look vignette={0.7} tint="rgba(80,50,0,0.25)" />
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.7) 100%)"}} />
      {sparkle.map((sp, i) => (
        <svg key={i} width={sp.s * 2} height={sp.s * 2} viewBox="-10 -10 20 20" style={{position: "absolute", left: sp.x, top: sp.y, opacity: sp.o}}>
          <path d="M0,-10 L2,-2 L10,0 L2,2 L0,10 L-2,2 L-10,0 L-2,-2 Z" fill="#fff6d0" />
        </svg>
      ))}
      <Line text="Hasta que llegó el aniversario de Fit Life…" start={20} top={1420} size={74} />
      <Flash len={12} color="#fff1c8" />
      <Grain />
    </AbsoluteFill>
  );
};

const Momento: React.FC = () => {
  const frame = useCurrentFrame();
  const bloom = interpolate(frame, [60, 120], [0, 0.35], clamp);
  return (
    <AbsoluteFill>
      <Frame src={pareja()} size={PHOTO} from={[P.mano[0], P.mano[1], 520]} to={[P.pareja[0], P.pareja[1] - 120, 1650]} dur={200} />
      <AbsoluteFill style={{background: "radial-gradient(circle at 55% 40%, rgba(255,200,170,1) 0%, rgba(255,140,160,0.4) 35%, rgba(0,0,0,0) 65%)", mixBlendMode: "screen", opacity: bloom}} />
      <Look vignette={0.7} tint="rgba(90,20,40,0.22)" />
      <FloatingHearts />
      <Line text="Ella puso la mano en su hombro…" start={14} end={100} top={1450} size={74} />
      <Line text="…y el mundo se detuvo." start={104} top={1450} size={82} />
      <Flash len={14} color="#ffe2e8" />
      <Grain />
    </AbsoluteFill>
  );
};

const Dialogo: React.FC<{el: string; ella: string}> = ({el, ella}) => (
  <AbsoluteFill>
    <Frame src={pareja()} size={PHOTO} from={[P.pareja[0], P.pareja[1] - 150, 1500]} to={[P.pareja[0] + 40, P.pareja[1] - 260, 1150]} dur={180} />
    <Look vignette={0.7} tint="rgba(90,20,40,0.18)" />
    <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)"}} />
    <Dialogue who={el} text="¿Te tomas una foto conmigo?" start={10} end={88} />
    <Dialogue who={ella} text="Pensé que nunca me lo pedirías." start={92} end={178} />
    <FloatingHearts count={8} />
    <Grain />
  </AbsoluteFill>
);

const Giro: React.FC<{mascota: string}> = ({mascota}) => {
  const frame = useCurrentFrame();
  const zoom = frame < 20 ? 1 : interpolate(frame, [20, 26], [1, 1.35], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{transform: useShake(20, 22)}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: "50% 26%"}}>
        <Img src={staticFile("cumpleanos/retrato.jpg")} style={{width: "100%", height: "100%", objectFit: "cover", filter: "contrast(1.15) saturate(0.9)"}} />
      </AbsoluteFill>
      <Look vignette={0.9} tint="rgba(140,0,20,0.35)" />
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(10,0,5,0.85) 100%)"}} />
      <Line text="Pero alguien no estaba de acuerdo…" start={0} end={58} top={1420} size={72} />
      <NameCard name={mascota} tag="El gato celoso" start={60} color="#7a1fb8" />
      <Flash at={20} len={8} />
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};

const Final: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - 4, fps, config: {damping: 12}});
  const sub = interpolate(frame, [30, 46], [0, 1], clamp);
  const beat = 1 + 0.12 * Math.max(0, Math.sin(frame / 5));
  const out = interpolate(frame, [104, 120], [1, 0], clamp);
  return (
    <AbsoluteFill style={{background: "#000", alignItems: "center", justifyContent: "center", opacity: out}}>
      <div style={{fontFamily: OSWALD, fontWeight: 700, fontSize: 150, letterSpacing: "0.06em", color: GOLD, transform: `scale(${0.85 + 0.15 * s})`, opacity: s, textShadow: "0 0 40px rgba(242,199,110,0.35)"}}>CONTINUARÁ…</div>
      <div style={{marginTop: 30, fontFamily: SERIF, fontStyle: "italic", fontWeight: 600, fontSize: 62, color: "#fff", opacity: sub}}>Episodio 2 · muy pronto</div>
      <div style={{marginTop: 90, opacity: sub, transform: `scale(${beat})`}}>
        <Heart size={120} />
      </div>
      <Grain opacity={0.14} />
    </AbsoluteFill>
  );
};

/* ---------- línea de tiempo ---------- */
export const DramaFitLife: React.FC<DramaProps> = ({el, ella, mascota, music = true}) => {
  useFonts();
  const sc = (k: string, node: React.ReactNode) => (
    <Sequence key={k} from={S[k][0]} durationInFrames={S[k][1]}>
      {node}
    </Sequence>
  );
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {sc("apertura", <Apertura />)}
      {sc("titulo", <Titulo />)}
      {sc("luis", <Retrato who="luis" name={el} tag="El chico de la camiseta roja" />)}
      {sc("cynia", <Retrato who="cynia" name={ella} tag="La sonrisa que ilumina el gimnasio" />)}
      {sc("miradas", <Miradas />)}
      {sc("letrero", <Letrero />)}
      {sc("momento", <Momento />)}
      {sc("dialogo", <Dialogo el={el} ella={ella} />)}
      {sc("giro", <Giro mascota={mascota} />)}
      {sc("final", <Final />)}
      {music && <Audio src={staticFile("drama/musica.mp3")} />}
    </AbsoluteFill>
  );
};

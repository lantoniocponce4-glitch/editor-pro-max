import React, {useEffect, useState} from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  Easing,
} from "remotion";

/**
 * Video de cumpleaños realista (1080x1920, 30 fps, 32 s) con material real de la mascota.
 * Los clips ya vienen estabilizados y con color cálido (ver CLAUDE.md, "Material real").
 * Archivos en public/cumpleanos/: clip-juguete.mp4, clip-enroscado.mp4, clip-retrato.mp4,
 * clip-final.mp4, retrato.jpg, cynia-bruno.jpg, bruno-lavadora.jpg, bruno-pasto.jpg.
 */

export const CUMPLEANOS_REAL_DURATION = 960;
const XF = 12; // cuadros de fundido entre escenas

export type CumpleanosRealProps = {
  nombre: string;
  mascota: string;
  music?: boolean;
};

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const HAND = "Caveat, 'Segoe Script', cursive";
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const f = (p: string) => staticFile(`cumpleanos/${p}`);

const useFonts = () => {
  const [handle] = useState(() => delayRender("Cargando fuentes"));
  useEffect(() => {
    const faces = [
      new FontFace("Playfair Display", `url(${staticFile("fonts/playfair-display-latin-600-italic.woff2")}) format("woff2")`, {weight: "600", style: "italic"}),
      new FontFace("Playfair Display", `url(${staticFile("fonts/playfair-display-latin-600-normal.woff2")}) format("woff2")`, {weight: "600"}),
      new FontFace("Caveat", `url(${staticFile("fonts/caveat-latin-700-normal.woff2")}) format("woff2")`, {weight: "700"}),
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

/* ---------- capas de ambiente ---------- */

/** Viñeta suave y degradado inferior para que el texto se lea. */
const Grade: React.FC<{bottom?: boolean}> = ({bottom = true}) => (
  <>
    <AbsoluteFill style={{background: "radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(20,8,0,0.55) 100%)"}} />
    {bottom && <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(25,10,0,0.62) 100%)"}} />}
  </>
);

/** Destello de luz cálida que se desplaza lento (como sol entrando por una ventana). */
const LightLeak: React.FC<{seed?: number; strength?: number}> = ({seed = 0, strength = 0.35}) => {
  const frame = useCurrentFrame();
  const x = 75 + Math.sin((frame + seed * 40) / 70) * 18;
  const y = 12 + Math.cos((frame + seed * 30) / 90) * 8;
  return <AbsoluteFill style={{background: `radial-gradient(circle at ${x}% ${y}%, rgba(255,186,110,${strength}) 0%, rgba(255,140,60,${strength * 0.4}) 22%, rgba(0,0,0,0) 48%)`, mixBlendMode: "screen"}} />;
};

/** Partículas de luz desenfocadas (bokeh) que suben despacio. */
const Bokeh: React.FC<{count?: number; seed?: number}> = ({count = 16, seed = 0}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{mixBlendMode: "screen", pointerEvents: "none"}}>
      {Array.from({length: count}).map((_, i) => {
        const k = i + seed * 100;
        const size = 30 + rand(k) * 90;
        const x = rand(k + 1) * 1080;
        const y = 1920 - (((rand(k + 2) * 1920 + frame * (0.6 + rand(k + 3) * 1.2)) % 2100));
        const op = 0.12 + 0.22 * Math.abs(Math.sin((frame + k * 17) / 40));
        return <div key={i} style={{position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,214,150,1) 0%, rgba(255,170,90,0.4) 45%, rgba(255,170,90,0) 70%)", opacity: op, filter: "blur(3px)"}} />;
      })}
    </AbsoluteFill>
  );
};

/** Fundido de entrada de cada escena (se superpone a la anterior). */
const Scene: React.FC<{children: React.ReactNode; fadeOut?: number; dur?: number}> = ({children, fadeOut, dur = 0}) => {
  const frame = useCurrentFrame();
  const fin = interpolate(frame, [0, XF], [0, 1], clamp);
  const fout = fadeOut ? interpolate(frame, [dur - fadeOut, dur], [1, 0], clamp) : 1;
  return <AbsoluteFill style={{opacity: fin * fout}}>{children}</AbsoluteFill>;
};

/** Texto elegante: entra subiendo y con el espaciado asentándose. */
const Title: React.FC<{text: string; start: number; end?: number; size?: number; top?: number; kicker?: string}> = ({text, start, end = Infinity, size = 92, top = 1430, kicker}) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  const t = interpolate(frame, [start, start + 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const out = Number.isFinite(end) ? interpolate(frame, [end - 10, end], [1, 0], clamp) : 1;
  return (
    <AbsoluteFill style={{alignItems: "center", top, height: "auto", padding: "0 70px", opacity: t * out}}>
      {kicker && (
        <div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 42, letterSpacing: `${0.24 + (1 - t) * 0.2}em`, textTransform: "uppercase", color: "#ffe6c4", marginBottom: 20, textShadow: "0 2px 18px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6)"}}>{kicker}</div>
      )}
      <div style={{fontFamily: SERIF, fontStyle: "italic", fontWeight: 600, fontSize: size, lineHeight: 1.08, color: "#fff8ee", textAlign: "center", textWrap: "balance", letterSpacing: `${(1 - t) * 0.06}em`, transform: `translateY(${(1 - t) * 36}px)`, textShadow: "0 4px 30px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.4)"}}>
        {text}
      </div>
    </AbsoluteFill>
  );
};

/** Foto con movimiento de cámara lento (Ken Burns) desde un encuadre a otro. */
const KenBurns: React.FC<{src: string; size: [number, number]; from: [number, number, number]; to: [number, number, number]; dur: number}> = ({src, size, from, to, dur}) => {
  // from/to = [centroX, centroY, zoom] en píxeles de la foto; zoom 1 = la foto cubre el cuadro
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const cx = from[0] + (to[0] - from[0]) * t;
  const cy = from[1] + (to[1] - from[1]) * t;
  const z = from[2] + (to[2] - from[2]) * t;
  const cover = Math.max(1080 / size[0], 1920 / size[1]) * z;
  const w = size[0] * cover;
  const h = size[1] * cover;
  const left = Math.min(0, Math.max(1080 - w, 540 - cx * cover));
  const top = Math.min(0, Math.max(1920 - h, 960 - cy * cover));
  return (
    <AbsoluteFill style={{overflow: "hidden", background: "#120a04"}}>
      <Img src={src} style={{position: "absolute", width: w, height: h, left, top, maxWidth: "none"}} />
    </AbsoluteFill>
  );
};

const Paw: React.FC<{size?: number}> = ({size = 64}) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{display: "inline-block", verticalAlign: "middle"}}>
    <ellipse cx={0} cy={14} rx={24} ry={20} fill="#ffe2bd" />
    {[[-28, -12], [-10, -28], [10, -28], [28, -12]].map(([px, py], i) => (
      <ellipse key={i} cx={px} cy={py} rx={10} ry={12} fill="#ffe2bd" />
    ))}
  </svg>
);

/* ---------- escenas ---------- */
const T = {
  juguete: [0, 165],
  enroscado: [165, 150],
  cynia: [315, 150],
  lavadora: [465, 120],
  pasto: [585, 120],
  retrato: [705, 150],
  final: [855, 105],
} as const;

export const CumpleanosReal: React.FC<CumpleanosRealProps> = ({nombre, mascota, music = true}) => {
  useFonts();
  const seq = (k: keyof typeof T, el: React.ReactNode) => {
    const [start, dur] = T[k];
    const s = Math.max(0, start - (start === 0 ? 0 : XF));
    return (
      <Sequence key={k} from={s} durationInFrames={dur + (start - s)}>
        {el}
      </Sequence>
    );
  };
  return (
    <AbsoluteFill style={{background: "#0d0703"}}>
      {seq(
        "juguete",
        <Scene>
          <OffthreadVideo src={f("clip-juguete.mp4")} muted playbackRate={0.7} style={{width: "100%", height: "100%", objectFit: "cover"}} />
          <LightLeak seed={1} />
          <Grade />
          <Title kicker="Un mensaje especial" text={`¡Feliz cumpleaños, ${nombre}!`} start={30} size={104} top={1360} />
        </Scene>,
      )}
      {seq(
        "enroscado",
        <Scene>
          <OffthreadVideo src={f("clip-enroscado.mp4")} muted trimBefore={30} style={{width: "100%", height: "100%", objectFit: "cover"}} />
          <LightLeak seed={2} strength={0.28} />
          <Grade />
          <Title text="Hoy es un día muy especial…" start={24} size={88} />
        </Scene>,
      )}
      {seq(
        "cynia",
        <Scene>
          <KenBurns src={f("cynia-bruno.jpg")} size={[1512, 2016]} from={[756, 1008, 1.0]} to={[640, 860, 1.32]} dur={T.cynia[1] + XF} />
          <Bokeh seed={1} count={14} />
          <LightLeak seed={3} strength={0.3} />
          <Grade />
          <Title kicker={`Para ${nombre}`} text="con todo el cariño del mundo" start={26} size={86} />
        </Scene>,
      )}
      {seq(
        "lavadora",
        <Scene>
          <KenBurns src={f("bruno-lavadora.jpg")} size={[2576, 1449]} from={[600, 760, 1.05]} to={[2180, 620, 1.18]} dur={T.lavadora[1] + XF} />
          <LightLeak seed={4} strength={0.4} />
          <Grade />
          <Title text={`De parte de tu gato más esponjoso`} start={18} size={84} />
        </Scene>,
      )}
      {seq(
        "pasto",
        <Scene>
          <KenBurns src={f("bruno-pasto.jpg")} size={[1512, 2016]} from={[756, 1000, 1.0]} to={[780, 760, 1.6]} dur={T.pasto[1] + XF} />
          <LightLeak seed={5} strength={0.32} />
          <Grade />
          <Title text="y tu compañero de aventuras" start={18} size={84} />
        </Scene>,
      )}
      {seq("retrato", <Retrato mascota={mascota} />)}
      {seq("final", <Final mascota={mascota} />)}
      {music && <Audio src={f("musica-real.mp3")} />}
    </AbsoluteFill>
  );
};

/** Cámara lenta del primer plano que se congela en su mirada. */
const Retrato: React.FC<{mascota: string}> = ({mascota}) => {
  const frame = useCurrentFrame();
  const clipFrames = Math.round((1.3 / 0.45) * 30); // 1,3 s de clip a 0,45x
  const freeze = clipFrames - 1; // congelar justo en el último cuadro del clip
  const push = interpolate(frame, [freeze, 162], [1.0, 1.1], clamp);
  const flash = interpolate(frame, [freeze - 2, freeze + 2, freeze + 14], [0, 0.45, 0], clamp);
  return (
    <Scene>
      <Sequence durationInFrames={freeze + 2} layout="none">
        <AbsoluteFill>
          <OffthreadVideo src={f("clip-retrato.mp4")} muted playbackRate={0.45} style={{width: "100%", height: "100%", objectFit: "cover"}} />
        </AbsoluteFill>
      </Sequence>
      {frame >= freeze && (
        <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: "50% 30%"}}>
          <Img src={f("retrato.jpg")} style={{width: "100%", height: "100%", objectFit: "cover"}} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{background: "#fff6e8", opacity: flash}} />
      <Bokeh seed={2} count={12} />
      <LightLeak seed={6} strength={0.3} />
      <Grade />
      <Title text={`${mascota} te quiere mucho`} start={freeze} size={96} />
    </Scene>
  );
};

const Final: React.FC<{mascota: string}> = ({mascota}) => {
  const frame = useCurrentFrame();
  const total = T.final[1] + XF;
  const sig = interpolate(frame, [48, 66], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <Scene fadeOut={18} dur={total}>
      <OffthreadVideo src={f("clip-final.mp4")} muted playbackRate={0.53} style={{width: "100%", height: "100%", objectFit: "cover"}} />
      <Bokeh seed={3} count={20} />
      <LightLeak seed={7} strength={0.38} />
      <Grade />
      <Title text="¡Que cumplas muchos más!" start={14} size={98} top={1300} />
      <AbsoluteFill style={{alignItems: "center", top: 1600, height: "auto", opacity: sig, transform: `translateY(${(1 - sig) * 20}px)`}}>
        <div style={{fontFamily: HAND, fontWeight: 700, fontSize: 92, color: "#ffe2bd", textShadow: "0 3px 20px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", gap: 18}}>
          Con cariño, {mascota} <Paw size={72} />
        </div>
      </AbsoluteFill>
    </Scene>
  );
};

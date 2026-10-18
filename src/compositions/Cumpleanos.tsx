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

/**
 * Video de cumpleaños vertical (1080x1920, 30 fps, 32 s) presentado por la mascota.
 * Props: nombre de la cumpleañera, nombre de la mascota y la foto (en public/).
 * La foto se recorta en la escena 5 con FOTO_CARINO (coordenadas en píxeles de la foto).
 * Música: public/cumpleanos/musica.mp3 (scripts/cumpleanos-music.py).
 */

export const CUMPLEANOS_DURATION = 960;

export type CumpleanosProps = {
  nombre: string;
  mascota: string;
  foto: string;
  /** Ancho y alto de la foto en píxeles */
  fotoSize: [number, number];
  /** Zona de la foto para la escena de cariño: [x, y, ancho, alto] en píxeles */
  fotoCarino: [number, number, number, number];
  music?: boolean;
};

const C = {
  ink: "#3a1f3d",
  night1: "#3b1d6e",
  night2: "#8a3fa0",
  card: "#fff8f0",
  pink: "#ff6fa5",
  yellow: "#ffd34d",
  orange: "#ee9a45",
  orangeDark: "#c96f22",
  orangeBody: "#e8913a",
  cream: "#fff4e6",
  brick: "#c9a87a",
  brickLine: "#b08f62",
  grass: "#79c35c",
  grassDark: "#5aa544",
};
const FONT = "Fredoka, 'Baloo 2', 'Comic Sans MS', system-ui, sans-serif";
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const useFredoka = () => {
  const [handle] = useState(() => delayRender("Cargando fuente Fredoka"));
  useEffect(() => {
    const faces = [
      new FontFace("Fredoka", `url(${staticFile("fonts/fredoka-latin-600-normal.woff2")}) format("woff2")`, {weight: "600"}),
      new FontFace("Fredoka", `url(${staticFile("fonts/fredoka-latin-700-normal.woff2")}) format("woff2")`, {weight: "700"}),
    ];
    Promise.all(faces.map((f) => f.load()))
      .then((loaded) => {
        loaded.forEach((f) => document.fonts.add(f));
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);
};

/** Número pseudoaleatorio estable (mismo resultado en cada render). */
const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const blinkAt = (frame: number, times: number[]) =>
  Math.max(0, ...times.map((t) => interpolate(frame, [t, t + 3, t + 6], [0, 1, 0], clamp)));

/* ---------- Bruno ---------- */
type CatProps = {
  x: number;
  y: number; // suelo bajo el gato
  scale?: number;
  blink?: number;
  tail?: number; // ángulo de la cola
  tilt?: number; // inclinación de la cabeza
  bob?: number;
  hat?: boolean;
  look?: number;
  happy?: boolean; // ojos cerrados contentos (^ ^)
};

const Fluff: React.FC<{cx: number; cy: number; rx: number; ry: number; fill: string; w?: number}> = ({cx, cy, rx, ry, fill, w = 14}) => (
  <>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} />
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={fill} strokeWidth={w} strokeDasharray="3 11" strokeLinecap="round" />
  </>
);

const Cat: React.FC<CatProps> = ({x, y, scale = 1, blink = 0, tail = 0, tilt = 0, bob = 0, hat, look = 0, happy}) => {
  const eyeRy = 27 * Math.max(0.08, 1 - blink);
  return (
    <g transform={`translate(${x},${y + bob}) scale(${scale})`}>
      {/* cola esponjosa con la punta clara */}
      <g transform={`rotate(${tail} 95 -70)`}>
        <path d="M95,-70 Q230,-90 215,-250 Q205,-330 150,-345" stroke={C.orangeBody} strokeWidth={62} fill="none" strokeLinecap="round" />
        <path d="M95,-70 Q230,-90 215,-250 Q205,-330 150,-345" stroke={C.orangeBody} strokeWidth={80} fill="none" strokeDasharray="3 16" strokeLinecap="round" />
        <path d="M190,-300 Q190,-335 150,-345" stroke="#f6c48e" strokeWidth={40} fill="none" strokeLinecap="round" />
      </g>
      {/* cuerpo y pechera blanca */}
      <Fluff cx={0} cy={-150} rx={135} ry={150} fill={C.orangeBody} />
      <Fluff cx={0} cy={-140} rx={78} ry={112} fill={C.cream} w={12} />
      <ellipse cx={-55} cy={-14} rx={44} ry={26} fill={C.cream} />
      <ellipse cx={55} cy={-14} rx={44} ry={26} fill={C.cream} />
      {/* cabeza */}
      <g transform={`rotate(${tilt} 0 -300)`}>
        <path d="M-108,-390 L-82,-505 L-18,-430 Z" fill={C.orange} />
        <path d="M108,-390 L82,-505 L18,-430 Z" fill={C.orange} />
        <path d="M-94,-405 L-80,-475 L-42,-430 Z" fill="#ffb8c8" />
        <path d="M94,-405 L80,-475 L42,-430 Z" fill="#ffb8c8" />
        <Fluff cx={-92} cy={-298} rx={52} ry={42} fill={C.orange} />
        <Fluff cx={92} cy={-298} rx={52} ry={42} fill={C.orange} />
        <Fluff cx={0} cy={-338} rx={122} ry={112} fill={C.orange} />
        {/* rayitas de la frente */}
        <path d="M-22,-440 Q-18,-410 -14,-392 M0,-446 L0,-396 M22,-440 Q18,-410 14,-392" stroke={C.orangeDark} strokeWidth={9} fill="none" strokeLinecap="round" />
        {/* ojos */}
        {happy ? (
          <>
            <path d="M-72,-338 Q-48,-366 -24,-338" stroke={C.ink} strokeWidth={9} fill="none" strokeLinecap="round" />
            <path d="M24,-338 Q48,-366 72,-338" stroke={C.ink} strokeWidth={9} fill="none" strokeLinecap="round" />
          </>
        ) : (
          [-48, 48].map((ex) => (
            <g key={ex}>
              <ellipse cx={ex} cy={-345} rx={23} ry={eyeRy} fill="#f2c14e" />
              {blink < 0.5 && (
                <>
                  <ellipse cx={ex + look * 6} cy={-345} rx={9} ry={eyeRy * 0.8} fill="#2a1a12" />
                  <circle cx={ex + look * 6 - 6} cy={-355} r={6} fill="#ffffff" />
                </>
              )}
            </g>
          ))
        )}
        <circle cx={-82} cy={-302} r={15} fill="#ff9c9c" opacity={0.5} />
        <circle cx={82} cy={-302} r={15} fill="#ff9c9c" opacity={0.5} />
        {/* hocico */}
        <ellipse cx={-22} cy={-286} rx={30} ry={24} fill={C.cream} />
        <ellipse cx={22} cy={-286} rx={30} ry={24} fill={C.cream} />
        <path d="M-11,-306 L11,-306 L0,-294 Z" fill="#f28da0" />
        <path d="M0,-294 Q-12,-278 -22,-284 M0,-294 Q12,-278 22,-284" stroke={C.ink} strokeWidth={5} fill="none" strokeLinecap="round" />
        <path d="M-50,-292 L-130,-306 M-50,-282 L-132,-280 M50,-292 L130,-306 M50,-282 L132,-280" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.9} />
        {hat && (
          <g transform="translate(30,-450) rotate(14)">
            <path d="M-58,0 L0,-150 L58,0 Z" fill={C.pink} />
            <path d="M-40,-46 L40,-46 M-22,-96 L22,-96" stroke={C.yellow} strokeWidth={12} />
            <circle cx={0} cy={-152} r={20} fill={C.yellow} />
            <ellipse cx={0} cy={2} rx={62} ry={12} fill="#ffffff" />
          </g>
        )}
      </g>
    </g>
  );
};

/* ---------- decoración ---------- */
const Confetti: React.FC<{frame: number; count?: number; burstAt?: number}> = ({frame, count = 70, burstAt}) => {
  const colors = [C.pink, C.yellow, "#7fd1ff", "#9b7bff", "#7be08a", "#ff9a52"];
  return (
    <g>
      {Array.from({length: count}).map((_, i) => {
        let x: number;
        let y: number;
        if (burstAt !== undefined) {
          const t = Math.max(0, frame - burstAt);
          const ang = rand(i) * Math.PI * 2;
          const sp = 14 + rand(i + 100) * 22;
          x = 540 + Math.cos(ang) * sp * t;
          y = 860 + Math.sin(ang) * sp * t + 0.45 * t * t;
          if (frame < burstAt) return null;
        } else {
          x = rand(i) * 1080 + Math.sin((frame + i * 10) / 20) * 30;
          y = ((rand(i + 50) * 2200 + frame * (3 + rand(i + 7) * 4)) % 2100) - 100;
        }
        const rot = frame * (4 + rand(i + 3) * 8) + i * 40;
        return <rect key={i} x={x} y={y} width={18} height={30} rx={4} fill={colors[i % colors.length]} transform={`rotate(${rot} ${x + 9} ${y + 15})`} />;
      })}
    </g>
  );
};

const NightBg: React.FC<{frame: number}> = ({frame}) => (
  <g>
    <defs>
      <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.night1} />
        <stop offset="1" stopColor={C.night2} />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#night)" />
    {Array.from({length: 40}).map((_, i) => (
      <circle key={i} cx={rand(i + 300) * 1080} cy={rand(i + 400) * 1920} r={2 + rand(i) * 4} fill="#ffffff" opacity={0.3 + 0.5 * Math.abs(Math.sin((frame + i * 13) / 18))} />
    ))}
  </g>
);

/** Patio como el de la foto: pared de ladrillos, maceteros y pasto. */
const Patio: React.FC<{frame: number}> = ({frame}) => (
  <g>
    <rect width={1080} height={1920} fill={C.brick} />
    {Array.from({length: 22}).map((_, r) =>
      Array.from({length: 6}).map((__, c) => (
        <rect key={`${r}-${c}`} x={c * 200 - (r % 2 ? 100 : 0)} y={r * 60} width={196} height={56} rx={6} fill="none" stroke={C.brickLine} strokeWidth={4} />
      )),
    )}
    <rect x={120} y={220} width={560} height={300} fill="#e9eef2" stroke="#f7f7f7" strokeWidth={18} />
    <line x1={400} y1={220} x2={400} y2={520} stroke="#f7f7f7" strokeWidth={10} />
    {[150, 330, 510, 690, 870].map((px, i) => (
      <g key={i} transform={`translate(${px},1250)`}>
        <path d="M-50,0 L50,0 L38,90 L-38,90 Z" fill="#c8673c" />
        <rect x={-56} y={-10} width={112} height={18} rx={6} fill="#b35a33" />
        {i % 2 === 0 && (
          <g transform={`rotate(${Math.sin((frame + i * 9) / 25) * 4})`}>
            <ellipse cx={-24} cy={-40} rx={22} ry={40} fill={C.grassDark} transform="rotate(-25 -24 -40)" />
            <ellipse cx={22} cy={-44} rx={22} ry={42} fill={C.grass} transform="rotate(25 22 -44)" />
          </g>
        )}
      </g>
    ))}
    <rect y={1340} width={1080} height={580} fill={C.grass} />
    {Array.from({length: 60}).map((_, i) => {
      const gx = rand(i + 900) * 1080;
      const gy = 1350 + rand(i + 950) * 560;
      return <path key={i} d={`M${gx},${gy} q6,-30 ${10 + rand(i) * 10},-44`} stroke={C.grassDark} strokeWidth={5} fill="none" strokeLinecap="round" />;
    })}
  </g>
);

const Balloon: React.FC<{x: number; y: number; frame: number; scale?: number; label?: boolean; color?: string}> = ({x, y, frame, scale = 1, label, color = "#1b1424"}) => (
  <g transform={`translate(${x},${y + Math.sin(frame / 15) * 14}) rotate(${Math.sin(frame / 22) * 4}) scale(${scale})`}>
    <path d="M0,170 Q-20,260 10,360" stroke="#d9c7ff" strokeWidth={4} fill="none" />
    <circle r={170} fill={color} />
    {label &&
      Array.from({length: 18}).map((_, i) => {
        const a = rand(i + 70) * Math.PI * 2;
        const rr = 60 + rand(i + 80) * 95;
        return <path key={i} d="M0,-12 L4,-4 L12,-4 L6,2 L8,11 L0,6 L-8,11 L-6,2 L-12,-4 L-4,-4 Z" fill={[C.yellow, C.pink, "#7fd1ff", "#7be08a"][i % 4]} transform={`translate(${Math.cos(a) * rr},${Math.sin(a) * rr}) scale(${1 + rand(i) })`} />;
      })}
    {label && (
      <>
        <text y={-6} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={62} fill="#ffffff">Feliz</text>
        <text y={52} textAnchor="middle" fontFamily={FONT} fontWeight={600} fontSize={40} fill="#ffffff">Cumpleaños</text>
      </>
    )}
    <ellipse cx={-60} cy={-80} rx={30} ry={50} fill="#ffffff" opacity={0.18} transform="rotate(30 -60 -80)" />
    <path d="M-14,168 L14,168 L0,184 Z" fill={color} />
  </g>
);

const Bubble: React.FC<{text: string; start: number; end?: number; x?: number; y?: number; size?: number}> = ({text, start, end = Infinity, x = 540, y = 560, size = 64}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start || frame >= end) return null;
  const s = spring({frame: frame - start, fps, config: {damping: 11, stiffness: 180}});
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -100%) scale(${s})`,
        transformOrigin: "50% 100%",
        background: C.card,
        border: `8px solid ${C.ink}`,
        borderRadius: 50,
        padding: "26px 44px 30px",
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.15,
        color: C.ink,
        textAlign: "center",
        width: 860,
        boxShadow: `0 10px 0 ${C.ink}`,
      }}
    >
      {text}
      <div style={{position: "absolute", left: "50%", bottom: -46, width: 0, height: 0, borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderTop: `40px solid ${C.ink}`, transform: "translateX(-50%)"}} />
    </div>
  );
};

const Banner: React.FC<{text: string; start: number; at?: "top" | "bottom"; size?: number; end?: number}> = ({text, start, at = "top", size = 72, end = Infinity}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < start || frame >= end) return null;
  const s = spring({frame: frame - start, fps, config: {damping: 12, stiffness: 160}});
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: at === "top" ? "flex-start" : "flex-end", padding: "110px 70px"}}>
      <div
        style={{
          transform: `scale(${0.6 + 0.4 * s})`,
          opacity: s,
          background: C.card,
          color: C.ink,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.15,
          textAlign: "center",
          padding: "24px 44px 28px",
          borderRadius: 48,
          border: `8px solid ${C.ink}`,
          boxShadow: `0 10px 0 ${C.ink}`,
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const FadeIn: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{opacity: interpolate(frame, [0, 8], [0, 1], clamp)}}>{children}</AbsoluteFill>;
};

const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{position: "absolute", inset: 0}}>
    {children}
  </svg>
);

/** Muestra una zona de la foto [x, y, ancho, alto] ocupando la caja w x h. */
const PhotoCrop: React.FC<{src: string; size: [number, number]; region: [number, number, number, number]; w: number; h: number; zoom?: number}> = ({src, size, region, w, h, zoom = 1}) => {
  const [rx, ry, rw, rh] = region;
  const k = Math.max(w / rw, h / rh) * zoom;
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  return (
    <div style={{width: w, height: h, overflow: "hidden", position: "relative", borderRadius: 6}}>
      <Img src={src} style={{position: "absolute", width: size[0] * k, height: size[1] * k, left: w / 2 - cx * k, top: h / 2 - cy * k, maxWidth: "none"}} />
    </div>
  );
};

/* ---------- escenas ---------- */
const SceneTitulo: React.FC<{nombre: string}> = ({nombre}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const word = (txt: string, delay: number, size: number, colors: string[]) =>
    txt.split("").map((ch, i) => {
      const s = spring({frame: frame - delay - i * 2, fps, config: {damping: 9, stiffness: 180}});
      return (
        <span key={i} style={{display: "inline-block", fontSize: size, fontWeight: 700, color: colors[i % colors.length], WebkitTextStroke: `10px ${C.ink}`, paintOrder: "stroke", transform: `translateY(${(1 - s) * -300 + Math.sin((frame + i * 7) / 9) * 6}px)`, opacity: Math.min(1, s * 2), whiteSpace: "pre"}}>
          {ch}
        </span>
      );
    });
  return (
    <FadeIn>
      <Stage>
        <NightBg frame={frame} />
        <Confetti frame={frame} />
        <Balloon x={760} y={1380} frame={frame} label scale={1.15} />
        <Balloon x={250} y={1500} frame={frame + 20} color={C.pink} scale={0.7} />
      </Stage>
      <AbsoluteFill style={{alignItems: "center", paddingTop: 260, fontFamily: FONT, textAlign: "center"}}>
        <div>{word("¡Feliz", 6, 150, [C.yellow, C.pink])}</div>
        <div style={{marginTop: -20}}>{word("cumpleaños,", 18, 128, ["#7fd1ff", C.yellow, C.pink])}</div>
        <div style={{marginTop: 10}}>{word(`${nombre}!`, 40, 190, [C.pink, C.yellow])}</div>
      </AbsoluteFill>
    </FadeIn>
  );
};

const SceneBruno: React.FC<{mascota: string; nombre: string}> = ({mascota}) => {
  const frame = useCurrentFrame();
  const walk = interpolate(frame, [0, 45], [-260, 540], {...clamp, easing: Easing.out(Easing.quad)});
  const walking = frame < 45;
  return (
    <FadeIn>
      <Stage>
        <Patio frame={frame} />
        <Cat x={walk} y={1720} scale={1.25} bob={walking ? -Math.abs(Math.sin(frame / 3)) * 18 : 0} tail={Math.sin(frame / 6) * 10} blink={blinkAt(frame, [80, 130])} tilt={frame > 60 ? Math.sin(frame / 14) * 6 : 0} />
      </Stage>
      <Bubble text={`¡Hola! Soy ${mascota}.`} start={50} end={95} y={1000} size={72} />
      <Bubble text="Hoy es un día muy especial..." start={95} y={1000} size={66} />
    </FadeIn>
  );
};

const SceneFoto: React.FC<{nombre: string; foto: string; fotoSize: [number, number]}> = ({nombre, foto, fotoSize}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - 10, fps, config: {damping: 12, stiffness: 110}});
  const zoom = interpolate(frame, [0, 180], [1.0, 1.12], clamp);
  const W = 780;
  const H = Math.round((W * fotoSize[1]) / fotoSize[0]);
  return (
    <FadeIn>
      <Stage>
        <NightBg frame={frame} />
        <Confetti frame={frame} count={90} burstAt={14} />
      </Stage>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center", paddingTop: 140}}>
        <div style={{background: "#ffffff", padding: "24px 24px 30px", borderRadius: 12, boxShadow: "0 30px 60px rgba(0,0,0,0.4)", transform: `rotate(${(1 - s) * 18 - 3}deg) scale(${0.3 + 0.7 * s})`, opacity: Math.min(1, s * 1.5)}}>
          <PhotoCrop src={staticFile(foto)} size={fotoSize} region={[0, 0, fotoSize[0], fotoSize[1]]} w={W} h={H} zoom={zoom} />
        </div>
      </AbsoluteFill>
      <Banner text={`¡Es el cumpleaños de ${nombre}!`} start={30} size={70} />
    </FadeIn>
  );
};

const Gift: React.FC<{kind: "oso" | "caja" | "canasta" | "globo"; x: number; y: number; start: number; frame: number}> = ({kind, x, y, start, frame}) => {
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - start, fps, config: {damping: 9, stiffness: 160}});
  if (frame < start) return null;
  const wob = Math.sin((frame - start) / 8) * 3;
  return (
    <g transform={`translate(${x},${y}) scale(${s}) rotate(${wob})`}>
      {kind === "oso" && (
        <g>
          <circle cx={-52} cy={-170} r={30} fill="#f7a8b8" />
          <circle cx={52} cy={-170} r={30} fill="#f7a8b8" />
          <ellipse cx={0} cy={-60} rx={80} ry={70} fill="#f7a8b8" />
          <circle cx={0} cy={-140} r={70} fill="#f9b6c4" />
          <ellipse cx={0} cy={-122} rx={30} ry={22} fill="#fde0e6" />
          <circle cx={-24} cy={-150} r={8} fill={C.ink} />
          <circle cx={24} cy={-150} r={8} fill={C.ink} />
          <circle cx={0} cy={-128} r={8} fill={C.ink} />
          <path d="M-30,-82 L0,-72 L-30,-62 Z M30,-82 L0,-72 L30,-62 Z" fill="#b8123a" />
        </g>
      )}
      {kind === "caja" && (
        <g>
          <rect x={-90} y={-160} width={180} height={160} rx={10} fill="#9b7bff" />
          <rect x={-102} y={-190} width={204} height={44} rx={10} fill="#b39bff" />
          <rect x={-14} y={-190} width={28} height={190} fill={C.yellow} />
          <path d="M0,-190 Q-60,-250 -50,-200 Z M0,-190 Q60,-250 50,-200 Z" fill={C.yellow} stroke={C.yellow} strokeWidth={10} />
        </g>
      )}
      {kind === "canasta" && (
        <g>
          <rect x={-110} y={-200} width={36} height={130} rx={6} fill="#c0392b" />
          <rect x={-66} y={-230} width={50} height={160} rx={8} fill="#f6a03a" />
          <rect x={-8} y={-190} width={60} height={120} rx={8} fill="#8b5a2b" />
          <circle cx={88} cy={-112} r={42} fill="#e74c3c" />
          <path d="M-130,-80 L130,-80 L112,0 L-112,0 Z" fill="#d8b4e8" />
          <path d="M-60,-80 L-40,-36 L-20,-80 M20,-80 L40,-36 L60,-80" stroke="#b989cf" strokeWidth={8} fill="none" />
          <path d="M0,-78 Q-40,-120 -36,-70 Z M0,-78 Q40,-120 36,-70 Z" fill="#c9a6ff" />
        </g>
      )}
      {kind === "globo" && (
        <g>
          <path d="M0,0 Q-14,-60 4,-130" stroke="#d9c7ff" strokeWidth={4} fill="none" />
          <ellipse cx={0} cy={-210} rx={70} ry={84} fill={C.pink} />
          <ellipse cx={-24} cy={-240} rx={14} ry={24} fill="#ffffff" opacity={0.3} />
        </g>
      )}
    </g>
  );
};

const SceneRegalos: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <FadeIn>
      <Stage>
        <Patio frame={frame} />
        <Cat x={500} y={1700} scale={0.95} tail={Math.sin(frame / 5) * 14} blink={blinkAt(frame, [40, 140])} tilt={Math.sin(frame / 12) * 5} look={Math.sin(frame / 20)} />
        <Gift kind="globo" x={150} y={1520} start={20} frame={frame} />
        <Gift kind="oso" x={170} y={1840} start={34} frame={frame} />
        <Gift kind="canasta" x={890} y={1850} start={48} frame={frame} />
        <Gift kind="caja" x={920} y={1580} start={62} frame={frame} />
      </Stage>
      <Bubble text="Te traje regalos, sorpresas y un desayuno rico." start={10} y={1020} size={62} />
    </FadeIn>
  );
};

const Heart: React.FC<{x: number; y: number; s: number; color: string; opacity: number}> = ({x, y, s, color, opacity}) => (
  <path d="M0,30 C-50,-5 -40,-55 0,-25 C40,-55 50,-5 0,30 Z" fill={color} opacity={opacity} transform={`translate(${x},${y}) scale(${s})`} />
);

const SceneCarino: React.FC<{mascota: string; foto: string; fotoSize: [number, number]; fotoCarino: [number, number, number, number]}> = ({mascota, foto, fotoSize, fotoCarino}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - 4, fps, config: {damping: 14, stiffness: 120}});
  const zoom = interpolate(frame, [0, 150], [1.0, 1.15], clamp);
  return (
    <FadeIn>
      <Stage>
        <rect width={1080} height={1920} fill="#ffe1ec" />
      </Stage>
      <AbsoluteFill style={{alignItems: "center", justifyContent: "center"}}>
        <div style={{background: "#ffffff", padding: 22, borderRadius: 40, boxShadow: "0 24px 50px rgba(120,40,80,0.3)", transform: `scale(${0.85 + 0.15 * s})`, opacity: s}}>
          <div style={{borderRadius: 28, overflow: "hidden"}}>
            <PhotoCrop src={staticFile(foto)} size={fotoSize} region={fotoCarino} w={900} h={1000} zoom={zoom} />
          </div>
        </div>
      </AbsoluteFill>
      <Stage>
        {Array.from({length: 10}).map((_, i) => {
          const t = (frame + i * 22) % 110;
          const side = i % 2 ? 70 + rand(i + 5) * 160 : 850 + rand(i + 5) * 160;
          const hx = side + Math.sin((frame + i * 20) / 12) * 26;
          const hy = 1700 - t * 13;
          return <Heart key={i} x={hx} y={hy} s={0.9 + rand(i) * 1.1} color={i % 2 ? C.pink : "#ff3d7f"} opacity={interpolate(t, [0, 10, 90, 110], [0, 1, 1, 0])} />;
        })}
      </Stage>
      <Banner text={`...y muchos cariñitos de ${mascota}`} start={20} size={68} at="bottom" />
    </FadeIn>
  );
};

const Cake: React.FC<{x: number; y: number; frame: number}> = ({x, y, frame}) => (
  <g transform={`translate(${x},${y})`}>
    <ellipse cx={0} cy={10} rx={240} ry={34} fill="#000000" opacity={0.15} />
    <rect x={-210} y={-170} width={420} height={170} rx={24} fill="#ffd1e0" />
    <path d="M-210,-130 Q-180,-90 -150,-130 Q-120,-90 -90,-130 Q-60,-90 -30,-130 Q0,-90 30,-130 Q60,-90 90,-130 Q120,-90 150,-130 Q180,-90 210,-130 L210,-170 L-210,-170 Z" fill="#ffffff" />
    <rect x={-150} y={-290} width={300} height={130} rx={20} fill="#9b7bff" />
    <path d="M-150,-250 Q-125,-220 -100,-250 Q-75,-220 -50,-250 Q-25,-220 0,-250 Q25,-220 50,-250 Q75,-220 100,-250 Q125,-220 150,-250 L150,-290 L-150,-290 Z" fill="#ffffff" />
    {[-90, -30, 30, 90].map((cx, i) => {
      const fl = 1 + 0.15 * Math.sin(frame / 2 + i * 2);
      return (
        <g key={cx}>
          <rect x={cx - 9} y={-370} width={18} height={84} rx={6} fill={[C.yellow, "#7fd1ff", C.pink, "#7be08a"][i]} />
          <ellipse cx={cx} cy={-392} rx={13 * fl} ry={24 * fl} fill="#ffb02e" />
          <ellipse cx={cx} cy={-386} rx={6} ry={12} fill="#fff3b0" />
        </g>
      );
    })}
  </g>
);

const SceneFinal: React.FC<{nombre: string; mascota: string}> = ({nombre, mascota}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sig = spring({frame: frame - 90, fps, config: {damping: 12}});
  return (
    <FadeIn>
      <Stage>
        <NightBg frame={frame} />
        <Confetti frame={frame} count={60} />
        <Cake x={380} y={1540} frame={frame} />
        <Cat x={820} y={1640} scale={0.85} hat tail={Math.sin(frame / 5) * 14} happy={frame > 40 && frame < 70} blink={blinkAt(frame, [120])} tilt={-6 + Math.sin(frame / 10) * 5} />
      </Stage>
      <Banner text={`¡Que cumplas muchos más, ${nombre}!`} start={8} size={80} />
      <AbsoluteFill style={{alignItems: "center", justifyContent: "flex-start", paddingTop: 640}}>
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 64, color: "#ffffff", opacity: sig, transform: `scale(${0.7 + 0.3 * sig})`, display: "flex", alignItems: "center", gap: 20}}>
          Con cariño, {mascota}
          <svg width={70} height={70} viewBox="-50 -50 100 100">
            <ellipse cx={0} cy={14} rx={24} ry={20} fill={C.yellow} />
            {[[-28, -12], [-10, -28], [10, -28], [28, -12]].map(([px, py], i) => (
              <ellipse key={i} cx={px} cy={py} rx={10} ry={12} fill={C.yellow} />
            ))}
          </svg>
        </div>
      </AbsoluteFill>
    </FadeIn>
  );
};

/* ---------- línea de tiempo ---------- */
export const Cumpleanos: React.FC<CumpleanosProps> = ({nombre, mascota, foto, fotoSize, fotoCarino, music = true}) => {
  useFredoka();
  return (
    <AbsoluteFill style={{background: C.night1}}>
      <Sequence from={0} durationInFrames={120}>
        <SceneTitulo nombre={nombre} />
      </Sequence>
      <Sequence from={120} durationInFrames={170}>
        <SceneBruno mascota={mascota} nombre={nombre} />
      </Sequence>
      <Sequence from={290} durationInFrames={180}>
        <SceneFoto nombre={nombre} foto={foto} fotoSize={fotoSize} />
      </Sequence>
      <Sequence from={470} durationInFrames={150}>
        <SceneRegalos />
      </Sequence>
      <Sequence from={620} durationInFrames={150}>
        <SceneCarino mascota={mascota} foto={foto} fotoSize={fotoSize} fotoCarino={fotoCarino} />
      </Sequence>
      <Sequence from={770} durationInFrames={190}>
        <SceneFinal nombre={nombre} mascota={mascota} />
      </Sequence>
      {music && <Audio src={staticFile("cumpleanos/musica.mp3")} />}
    </AbsoluteFill>
  );
};

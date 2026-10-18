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
 * "Saltarina, la arañita saltadora" — video infantil (1920x1080, 30 fps, 56 s).
 * Personaje ilustrado inspirado en una foto real de araña saltadora (public/saltarina/arana.jpg).
 * Música: public/saltarina/musica.mp3 (scripts/saltarina-music.py).
 */

export const SALTARINA_DURATION = 1680;

const C = {
  ink: "#3b2a1f",
  title: "#ff8a1f",
  card: "#fffaf0",
  body: "#3d3833",
  bodyDark: "#26221f",
  head: "#5c5650",
  cream: "#efdfa8",
  leg: "#6e6862",
  legRing: "#efe9dd",
  white: "#fbf8f1",
  blush: "#ff9c9c",
  leaf: "#5fbf4f",
  leafDark: "#3f9a38",
  silk: "#ffffff",
};

const FONT = "Fredoka, 'Baloo 2', 'Comic Sans MS', system-ui, sans-serif";

/* ---------- fuente local (funciona sin internet) ---------- */
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
      .catch(() => continueRender(handle)); // si falla, se usa la fuente de respaldo
  }, [handle]);
};

/* ---------- utilidades de animación ---------- */
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

/** Posición a lo largo de un salto parabólico entre dos puntos. */
const jumpPos = (
  frame: number,
  start: number,
  dur: number,
  from: [number, number],
  to: [number, number],
  height: number,
) => {
  const t = interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.quad)});
  const x = from[0] + (to[0] - from[0]) * t;
  const y = from[1] + (to[1] - from[1]) * t - 4 * height * t * (1 - t);
  return {x, y, t, airborne: t > 0 && t < 1};
};

/** Aplastar y estirar: antes de despegar, en el aire y al aterrizar. */
const squash = (frame: number, start: number, dur: number) => {
  const pre = interpolate(frame, [start - 8, start - 2, start], [0, 1, 0], clamp);
  const air = interpolate(frame, [start, start + 4, start + dur - 4, start + dur], [0, 1, 1, 0], clamp);
  const land = interpolate(frame, [start + dur, start + dur + 4, start + dur + 12], [0, 1, 0], clamp);
  const sx = 1 + 0.18 * pre - 0.1 * air + 0.22 * land;
  const sy = 1 - 0.2 * pre + 0.14 * air - 0.22 * land;
  return {sx, sy};
};

const blinkAt = (frame: number, times: number[]) =>
  Math.max(0, ...times.map((t) => interpolate(frame, [t, t + 3, t + 6], [0, 1, 0], clamp)));

/* ---------- personaje ---------- */
type SpiderProps = {
  x: number;
  y: number; // punto del suelo bajo la araña
  scale?: number;
  sx?: number;
  sy?: number;
  blink?: number; // 0..1
  look?: number; // -1..1 hacia dónde miran los ojos
  wave?: number; // ángulo en grados de la pata delantera derecha
  rotate?: number;
  bob?: number;
};

const LEGS_LEFT: [number, number][][] = [
  [[150, 240], [108, 268], [118, 338]],
  [[136, 226], [58, 212], [44, 330]],
  [[136, 210], [44, 162], [18, 300]],
  [[150, 196], [72, 118], [66, 260]],
];

const Leg: React.FC<{pts: [number, number][]; mirror?: boolean; rot?: number}> = ({pts, mirror, rot = 0}) => {
  const p = mirror ? pts.map(([x, y]) => [400 - x, y] as [number, number]) : pts;
  const d = `M${p[0][0]},${p[0][1]} L${p[1][0]},${p[1][1]} L${p[2][0]},${p[2][1]}`;
  return (
    <g transform={`rotate(${rot} ${p[0][0]} ${p[0][1]})`}>
      <path d={d} stroke={C.leg} strokeWidth={17} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={C.legRing} strokeWidth={17} fill="none" strokeDasharray="3 20" strokeLinejoin="round" opacity={0.75} />
      <circle cx={p[2][0]} cy={p[2][1]} r={10} fill={C.bodyDark} />
    </g>
  );
};

const Eye: React.FC<{cx: number; cy: number; r: number; blink: number; look: number}> = ({cx, cy, r, blink, look}) => {
  const ry = r * Math.max(0.08, 1 - blink);
  const lx = look * r * 0.22;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={r} ry={ry} fill="#15110e" />
      {blink < 0.5 && (
        <>
          <ellipse cx={cx + lx} cy={cy + r * 0.05} rx={r * 0.72} ry={ry * 0.72} fill="#2f2621" />
          <circle cx={cx + lx - r * 0.32} cy={cy - r * 0.36} r={r * 0.28} fill="#ffffff" />
          <circle cx={cx + lx + r * 0.3} cy={cy + r * 0.28} r={r * 0.11} fill="#ffffff" opacity={0.85} />
        </>
      )}
    </g>
  );
};

const Spider: React.FC<SpiderProps> = ({x, y, scale = 1, sx = 1, sy = 1, blink = 0, look = 0, wave = 0, rotate = 0, bob = 0}) => (
  <g transform={`translate(${x},${y + bob}) rotate(${rotate}) scale(${scale * sx},${scale * sy}) translate(-200,-340)`}>
    {/* patas traseras primero */}
    {LEGS_LEFT.map((l, i) => (
      <Leg key={`l${i}`} pts={l} />
    ))}
    {LEGS_LEFT.map((l, i) => (
      <Leg key={`r${i}`} pts={l} mirror rot={i === 0 ? -wave : 0} />
    ))}
    {/* abdomen peludito con la banda crema de la foto */}
    <circle cx={200} cy={128} r={98} fill={C.body} />
    <circle cx={200} cy={128} r={98} fill="none" stroke={C.body} strokeWidth={12} strokeDasharray="2 9" strokeLinecap="round" />
    <path d="M120,86 Q200,22 282,90 Q252,74 230,74 Q200,66 170,74 Q140,80 120,86 Z" fill={C.cream} />
    <path d="M128,104 Q200,58 274,106 Q240,94 200,92 Q160,94 128,104 Z" fill={C.cream} opacity={0.9} />
    <path d="M196,40 Q206,90 200,140" stroke={C.bodyDark} strokeWidth={14} fill="none" strokeLinecap="round" />
    {/* cabeza */}
    <ellipse cx={200} cy={218} rx={100} ry={74} fill={C.head} />
    <ellipse cx={200} cy={218} rx={100} ry={74} fill="none" stroke={C.head} strokeWidth={12} strokeDasharray="2 9" strokeLinecap="round" />
    <path d="M118,192 Q200,150 282,192" stroke={C.white} strokeWidth={6} fill="none" opacity={0.55} strokeLinecap="round" />
    {/* ojos laterales y principales */}
    <Eye cx={117} cy={206} r={13} blink={blink} look={look} />
    <Eye cx={283} cy={206} r={13} blink={blink} look={look} />
    <Eye cx={163} cy={218} r={33} blink={blink} look={look} />
    <Eye cx={237} cy={218} r={33} blink={blink} look={look} />
    {/* mejillas, sonrisa y pedipalpos blancos */}
    <circle cx={128} cy={250} r={13} fill={C.blush} opacity={0.55} />
    <circle cx={272} cy={250} r={13} fill={C.blush} opacity={0.55} />
    <path d="M186,262 Q200,274 214,262" stroke={C.bodyDark} strokeWidth={5} fill="none" strokeLinecap="round" />
    <ellipse cx={174} cy={286} rx={17} ry={14} fill={C.white} />
    <ellipse cx={226} cy={286} rx={17} ry={14} fill={C.white} />
  </g>
);

/* ---------- fondo de jardín ---------- */
const Garden: React.FC<{frame: number; ground?: boolean}> = ({frame, ground = true}) => (
  <g>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a8e0ff" />
        <stop offset="1" stopColor="#fff4d2" />
      </linearGradient>
    </defs>
    <rect width={1920} height={1080} fill="url(#sky)" />
    <g transform={`translate(1690,170) rotate(${frame * 0.4})`}>
      {Array.from({length: 12}).map((_, i) => (
        <rect key={i} x={-6} y={-150} width={12} height={46} rx={6} fill="#ffd34d" transform={`rotate(${i * 30})`} />
      ))}
      <circle r={88} fill="#ffd34d" />
    </g>
    {[0, 1, 2].map((i) => {
      const cx = ((i * 700 + frame * (0.6 + i * 0.25)) % 2400) - 240;
      return (
        <g key={i} transform={`translate(${cx},${130 + i * 70})`} opacity={0.95}>
          <ellipse cx={0} cy={0} rx={110} ry={42} fill="#ffffff" />
          <ellipse cx={-55} cy={10} rx={70} ry={34} fill="#ffffff" />
          <ellipse cx={60} cy={8} rx={76} ry={36} fill="#ffffff" />
        </g>
      );
    })}
    {ground && (
      <>
        <path d="M0,760 Q480,640 960,760 T1920,740 L1920,1080 L0,1080 Z" fill="#a9de86" />
        <path d="M0,880 Q520,820 1000,880 T1920,870 L1920,1080 L0,1080 Z" fill="#7cc762" />
        {[[160, 905, "#ff7aa8"], [420, 935, "#ffd23f"], [1520, 925, "#b48cff"], [1790, 900, "#ff7aa8"], [1100, 960, "#ffd23f"]].map(
          ([fx, fy, col], i) => (
            <g key={i} transform={`translate(${fx},${fy}) rotate(${Math.sin((frame + i * 20) / 18) * 5})`}>
              <path d="M0,0 L0,60" stroke={C.leafDark} strokeWidth={6} />
              {Array.from({length: 5}).map((_, k) => (
                <circle key={k} cx={Math.cos((k * 2 * Math.PI) / 5) * 17} cy={Math.sin((k * 2 * Math.PI) / 5) * 17} r={13} fill={col as string} />
              ))}
              <circle r={10} fill="#fff3b0" />
            </g>
          ),
        )}
      </>
    )}
  </g>
);

const Leaf: React.FC<{x: number; y: number; w?: number; flip?: boolean}> = ({x, y, w = 300, flip}) => (
  <g transform={`translate(${x},${y}) scale(${flip ? -1 : 1},1)`}>
    <path d={`M${-w * 0.1},14 Q-40,200 -60,520`} stroke={C.leafDark} strokeWidth={10} fill="none" />
    <path d={`M${-w / 2},0 Q0,-70 ${w / 2},0 Q0,60 ${-w / 2},0 Z`} fill={C.leaf} />
    <path d={`M${-w / 2 + 20},0 L${w / 2 - 20},0`} stroke={C.leafDark} strokeWidth={4} opacity={0.6} />
  </g>
);

/* ---------- textos ---------- */
const Caption: React.FC<{text: string; at?: "top" | "bottom"; start?: number; end?: number; size?: number}> = ({text, at = "top", start = 0, end = Infinity, size = 74}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - start, fps, config: {damping: 12, stiffness: 160}});
  if (frame < start || frame >= end) return null;
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: at === "top" ? "flex-start" : "flex-end", padding: "56px 120px"}}>
      <div
        style={{
          transform: `scale(${0.6 + 0.4 * s}) translateY(${(1 - s) * (at === "top" ? -40 : 40)}px)`,
          opacity: s,
          background: C.card,
          color: C.ink,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.15,
          textAlign: "center",
          padding: "22px 48px 26px",
          borderRadius: 48,
          border: `8px solid ${C.ink}`,
          boxShadow: `0 10px 0 ${C.ink}`,
          maxWidth: 1500,
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
  <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: "absolute", inset: 0}}>
    {children}
  </svg>
);

/* ---------- escenas ---------- */
const SceneTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const j = jumpPos(frame, 22, 30, [-220, 930], [960, 930], 420);
  const sq = squash(frame, 22, 30);
  const letters = "Saltarina".split("");
  return (
    <FadeIn>
      <Stage>
        <Garden frame={frame} />
        <Spider x={j.x} y={j.y} scale={1.15} sx={sq.sx} sy={sq.sy} rotate={j.airborne ? (j.t - 0.5) * 30 : 0} blink={blinkAt(frame, [95])} bob={j.t >= 1 ? Math.sin(frame / 6) * 4 : 0} />
      </Stage>
      <AbsoluteFill style={{alignItems: "center", paddingTop: 70, fontFamily: FONT}}>
        <div style={{display: "flex", gap: 4}}>
          {letters.map((ch, i) => {
            const s = spring({frame: frame - 55 - i * 3, fps, config: {damping: 9, stiffness: 180}});
            return (
              <span
                key={i}
                style={{
                  fontSize: 190,
                  fontWeight: 700,
                  color: i % 2 ? "#ff6fa5" : C.title,
                  WebkitTextStroke: `10px ${C.ink}`,
                  paintOrder: "stroke",
                  display: "inline-block",
                  transform: `translateY(${(1 - s) * -260 + Math.sin((frame + i * 6) / 9) * 6}px)`,
                  opacity: Math.min(1, s * 2),
                }}
              >
                {ch}
              </span>
            );
          })}
        </div>
        <div
          style={{
            marginTop: -6,
            fontSize: 72,
            fontWeight: 700,
            color: C.ink,
            opacity: interpolate(frame, [88, 100], [0, 1], clamp),
            transform: `scale(${interpolate(frame, [88, 100], [0.7, 1], clamp)})`,
          }}
        >
          la arañita saltadora
        </div>
      </AbsoluteFill>
    </FadeIn>
  );
};

const SceneHola: React.FC = () => {
  const frame = useCurrentFrame();
  const wave = interpolate(frame, [20, 32], [0, 1], clamp) * (55 + 20 * Math.sin(frame / 4));
  const waveOut = interpolate(frame, [120, 135], [1, 0], clamp);
  return (
    <FadeIn>
      <Stage>
        <Garden frame={frame + 150} />
        <Spider x={960} y={1000} scale={1.75} wave={wave * waveOut} blink={blinkAt(frame, [70, 150])} bob={Math.sin(frame / 7) * 5} />
      </Stage>
      <Caption text="¡Hola! Soy Saltarina." start={6} />
      <Caption text="Soy una araña saltadora." at="bottom" start={70} size={60} />
    </FadeIn>
  );
};

const Badge: React.FC<{x: number; y: number; n: number; start: number; big?: boolean}> = ({x, y, n, start, big}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - start, fps, config: {damping: 10, stiffness: 200}});
  if (frame < start) return null;
  const r = big ? 46 : 36;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <circle r={r} fill="#ffd34d" stroke={C.ink} strokeWidth={6} />
      <text y={r * 0.36} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={r * 1.1} fill={C.ink}>
        {n}
      </text>
    </g>
  );
};

const SceneOjos: React.FC = () => {
  const frame = useCurrentFrame();
  const S = 3.0;
  const gx = 960;
  const gy = 650 + 125 * S;
  const to = (lx: number, ly: number): [number, number] => [gx + (lx - 200) * S, gy + (ly - 340) * S];
  const front: [number, number][] = [to(163, 218), to(237, 218), to(117, 206), to(283, 206)];
  const top: [number, number][] = [to(150, 168), to(250, 168), to(124, 186), to(276, 186)];
  const look = Math.sin(frame / 22) * interpolate(frame, [170, 190], [0, 1], clamp);
  return (
    <FadeIn>
      <Stage>
        <Garden frame={frame + 330} ground={false} />
        <Spider x={gx} y={gy} scale={S} blink={blinkAt(frame, [150])} look={look} />
        {top.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={14} fill="#15110e" opacity={interpolate(frame, [100 + i * 8, 106 + i * 8], [0, 1], clamp)} />
        ))}
        {front.map(([x, y], i) => (
          <Badge key={i} x={x + (i < 2 ? 0 : i === 2 ? -70 : 70)} y={y - (i < 2 ? 140 : 90)} n={i + 1} start={30 + i * 14} big={i < 2} />
        ))}
        {top.map(([x, y], i) => (
          <Badge key={`t${i}`} x={x + (i % 2 ? 1 : -1) * (i < 2 ? 70 : 190)} y={y - (i < 2 ? 150 : 230)} n={i + 5} start={100 + i * 8} />
        ))}
      </Stage>
      <Caption text="¡Tengo 8 ojos!" at="bottom" start={6} end={160} />
      <Sequence from={160} layout="none">
        <AbsoluteFill style={{background: "transparent"}}>
          <Caption text="Los 2 grandes de adelante ven muy, muy bien." at="bottom" size={64} />
        </AbsoluteFill>
      </Sequence>
    </FadeIn>
  );
};

/** Saltos de hoja en hoja: [inicio, duración, desde, hasta, altura] */
const LEAPS: [number, number, [number, number], [number, number], number][] = [
  [40, 30, [250, 930], [720, 752], 260],
  [100, 30, [720, 752], [1180, 612], 240],
  [160, 32, [1180, 612], [1650, 792], 260],
];

const SceneSaltos: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  let pos: {x: number; y: number} = {x: LEAPS[0][2][0], y: LEAPS[0][2][1]};
  let sq = {sx: 1, sy: 1};
  let rot = 0;
  const lines: React.ReactNode[] = [];
  for (const [s, d, from, to, h] of LEAPS) {
    if (frame >= s - 8) {
      const j = jumpPos(frame, s, d, from, to, h);
      pos = j;
      sq = squash(frame, s, d);
      rot = j.airborne ? (j.t - 0.5) * 24 : 0;
      if (frame >= s) {
        const fade = interpolate(frame, [s + d, s + d + 40], [0.9, 0], clamp);
        lines.push(<line key={s} x1={from[0]} y1={from[1] - 30} x2={j.x} y2={j.y - 30} stroke={C.silk} strokeWidth={3} opacity={fade} />);
      }
    }
  }
  return (
    <FadeIn>
      <Stage>
        <Garden frame={frame + 570} />
        <Leaf x={720} y={752} />
        <Leaf x={1180} y={612} flip />
        <Leaf x={1650} y={792} />
        {lines}
        <Spider x={pos.x} y={pos.y} scale={0.85} sx={sq.sx} sy={sq.sy} rotate={rot} blink={blinkAt(frame, [20, 230])} bob={frame > 200 ? Math.sin(frame / 6) * 3 : 0} />
        {LEAPS.map(([s, d, , to], i) => {
          const sp = spring({frame: frame - s - d, fps, config: {damping: 9, stiffness: 200}});
          if (frame < s + d) return null;
          return (
            <text key={i} x={to[0]} y={to[1] - 320} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={110} fill="#ff6fa5" stroke={C.ink} strokeWidth={8} paintOrder="stroke" transform={`translate(${to[0]},${to[1] - 350}) scale(${sp}) translate(${-to[0]},${-(to[1] - 350)})`}>
              ¡{i + 1}!
            </text>
          );
        })}
      </Stage>
      <Caption text="¡Salto muy, muy lejos!" start={6} />
    </FadeIn>
  );
};

const SceneHilo: React.FC = () => {
  const frame = useCurrentFrame();
  const anchor = {x: 960, y: 150};
  const drop = interpolate(frame, [22, 58], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
  const len = 90 + drop * 300;
  const swing = frame > 58 ? 14 * Math.sin((frame - 58) / 9) * Math.exp(-(frame - 58) / 120) : 0;
  const rad = (swing * Math.PI) / 180;
  const bx = anchor.x + Math.sin(rad) * len;
  const by = anchor.y + Math.cos(rad) * len;
  // la araña cuelga del hilo desde la parte de arriba del abdomen (local y≈30)
  const S = 0.95;
  const gy = by + (340 - 30) * S;
  return (
    <FadeIn>
      <Stage>
        <Garden frame={frame + 840} />
        <path d="M-20,120 Q600,95 1100,150 L1100,170 Q600,118 -20,145 Z" fill="#8a5a36" />
        <line x1={anchor.x} y1={anchor.y} x2={bx} y2={by} stroke={C.silk} strokeWidth={4} />
        <g transform={`rotate(${swing} ${bx} ${by})`}>
          <Spider x={bx} y={gy} scale={S} blink={blinkAt(frame, [110])} wave={frame > 120 ? 40 + 15 * Math.sin(frame / 4) : 0} />
        </g>
      </Stage>
      <Caption text="Antes de saltar, pego un hilo de seda." at="bottom" start={6} end={110} size={64} />
      <Sequence from={110} layout="none">
        <AbsoluteFill>
          <Caption text="¡Es mi cuerda de seguridad!" at="bottom" />
        </AbsoluteFill>
      </Sequence>
    </FadeIn>
  );
};

const Fly: React.FC<{x: number; y: number; frame: number}> = ({x, y, frame}) => {
  const flap = Math.sin(frame * 2.2) * 0.5 + 0.5;
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={-14} cy={-20} rx={22} ry={12 + 8 * flap} fill="#dff4ff" stroke={C.ink} strokeWidth={4} transform="rotate(-30 -14 -20)" />
      <ellipse cx={14} cy={-20} rx={22} ry={12 + 8 * flap} fill="#dff4ff" stroke={C.ink} strokeWidth={4} transform="rotate(30 14 -20)" />
      <ellipse cx={0} cy={0} rx={30} ry={22} fill="#4b4f5c" stroke={C.ink} strokeWidth={4} />
      <circle cx={18} cy={-6} r={9} fill="#c0392b" />
      <circle cx={21} cy={-8} r={3} fill="#fff" />
    </g>
  );
};

const SceneMosca: React.FC = () => {
  const frame = useCurrentFrame();
  const pounce = 120;
  const flyEscape = interpolate(frame, [pounce + 12, pounce + 40], [0, 1], {...clamp, easing: Easing.in(Easing.quad)});
  const fx = 1260 + Math.sin(frame / 11) * 140 + flyEscape * 520;
  const fy = 560 + Math.cos(frame / 7) * 60 - flyEscape * 640;
  const j = jumpPos(frame, pounce, 28, [480, 930], [1220, 930], 330);
  const sq = squash(frame, pounce, 28);
  const look = Math.max(-1, Math.min(1, (fx - j.x) / 500));
  const dizzy = frame > pounce + 34 ? Math.sin(frame / 3) * 6 : 0;
  return (
    <FadeIn>
      <Stage>
        <Garden frame={frame + 1050} />
        <Spider x={j.x} y={j.y} scale={1.0} sx={sq.sx} sy={sq.sy} rotate={(j.airborne ? (j.t - 0.5) * 26 : 0) + dizzy} look={look} blink={blinkAt(frame, [60, 175])} />
        <Fly x={fx} y={fy} frame={frame} />
      </Stage>
      <Caption text="No hago telarañas para cazar..." start={6} end={95} size={66} />
      <Sequence from={95} layout="none">
        <AbsoluteFill>
          <Caption text="¡Yo salto!" />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={165} layout="none">
        <AbsoluteFill>
          <Caption text="¡Uy, se escapó!" at="bottom" />
        </AbsoluteFill>
      </Sequence>
    </FadeIn>
  );
};

const SceneFoto: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - 6, fps, config: {damping: 13, stiffness: 120}});
  const zoom = interpolate(frame, [0, 240], [1.05, 1.3], clamp);
  const peek = spring({frame: frame - 60, fps, config: {damping: 12}});
  return (
    <FadeIn>
      <Stage>
        <Garden frame={frame + 1260} />
        <Spider x={1700} y={1080 + 210 - 230 * peek} scale={0.9} wave={frame > 80 ? 45 + 18 * Math.sin(frame / 4) : 0} blink={blinkAt(frame, [140])} look={-0.8} />
      </Stage>
      <AbsoluteFill style={{flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 90, paddingBottom: 40}}>
        <div
          style={{
            background: "#ffffff",
            padding: "26px 26px 90px",
            borderRadius: 10,
            boxShadow: "0 24px 50px rgba(59,42,31,0.35)",
            transform: `rotate(${-4 + (1 - s) * -14}deg) scale(${0.5 + 0.5 * s})`,
            opacity: s,
            position: "relative",
          }}
        >
          <div style={{width: 560, height: 747, overflow: "hidden", borderRadius: 4}}>
            <Img src={staticFile("saltarina/arana.jpg")} style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})`, transformOrigin: "40% 45%"}} />
          </div>
          <div style={{position: "absolute", bottom: 22, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 600, fontSize: 40, color: C.ink}}>
            ¡Una de verdad!
          </div>
        </div>
        <div
          style={{
            maxWidth: 720,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 76,
            lineHeight: 1.12,
            color: C.ink,
            background: C.card,
            border: `8px solid ${C.ink}`,
            boxShadow: `0 10px 0 ${C.ink}`,
            borderRadius: 48,
            padding: "36px 48px",
            opacity: interpolate(frame, [30, 44], [0, 1], clamp),
            transform: `translateX(${interpolate(frame, [30, 44], [60, 0], clamp)}px)`,
          }}
        >
          Así se ve una arañita saltadora de verdad.
        </div>
      </AbsoluteFill>
    </FadeIn>
  );
};

const SceneChao: React.FC = () => {
  const frame = useCurrentFrame();
  const j = jumpPos(frame, 132, 32, [960, 980], [2250, 760], 380);
  const sq = squash(frame, 132, 32);
  const wave = frame > 92 && frame < 130 ? 50 + 20 * Math.sin(frame / 4) : 0;
  return (
    <FadeIn>
      <Stage>
        <Garden frame={frame + 1500} />
        <Spider x={j.x} y={j.y} scale={1.5} sx={sq.sx} sy={sq.sy} rotate={j.airborne ? (j.t - 0.5) * 30 : 0} wave={wave} blink={blinkAt(frame, [50])} bob={j.t <= 0 ? Math.sin(frame / 7) * 4 : 0} />
      </Stage>
      <Caption text="Si ves una, mírala con cariño y déjala saltar." start={6} size={64} />
      <Sequence from={90} layout="none">
        <AbsoluteFill>
          <Caption text="¡Chao, amiguitos!" at="bottom" size={90} />
        </AbsoluteFill>
      </Sequence>
    </FadeIn>
  );
};

/* ---------- línea de tiempo ---------- */
const SCENES: [number, number, React.FC][] = [
  [0, 150, SceneTitle],
  [150, 180, SceneHola],
  [330, 240, SceneOjos],
  [570, 270, SceneSaltos],
  [840, 210, SceneHilo],
  [1050, 210, SceneMosca],
  [1260, 240, SceneFoto],
  [1500, 180, SceneChao],
];

export const Saltarina: React.FC<{music?: boolean}> = ({music = true}) => {
  useFredoka();
  return (
    <AbsoluteFill style={{background: "#a8e0ff"}}>
      {SCENES.map(([from, dur, Comp]) => (
        <Sequence key={from} from={from} durationInFrames={dur}>
          <Comp />
        </Sequence>
      ))}
      {music && <Audio src={staticFile("saltarina/musica.mp3")} volume={1} />}
    </AbsoluteFill>
  );
};

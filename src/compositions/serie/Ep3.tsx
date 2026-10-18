import React from "react";
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from "remotion";
import {
  ACTORS,
  Actor,
  Backdrop,
  Camera,
  EndCard,
  Emote,
  EpisodeTitle,
  Flash,
  GOLD,
  Grain,
  Hearts,
  Look,
  Narration,
  OSWALD,
  Speech,
  clamp,
  rand,
  serie,
  useSerieFonts,
} from "../../components/serie/Stage";
import type {SerieProps} from "./Ep1";
import T from "./ep3.json";

/**
 * Serie "Amor en Fit Life" · Episodio 3 "La sorpresa" (1080x1920, 30 fps, 48 s).
 * Luis y Bruno hacen las paces para preparar el cumpleaños de Cynia; cierra con la foto real.
 */

const S = T.scenes as unknown as Record<string, [number, number]>;
export const EP3_DURATION = S.fin[0] + S.fin[1];

const K = 1250 / 1228;
const LH = 1228 * K;
const CH = 1155 * K;
const FEET = 1990;
const HOME = serie("casa-fondo.jpg");
const homeCam: [number, number, number][] = [[540, 960, 1920]];
const INDOOR = "brightness(1.06) saturate(1.02)";

const Video: React.FC<{src: string; rate?: number}> = ({src, rate = 1}) => (
  <OffthreadVideo src={src} muted playbackRate={rate} style={{width: "100%", height: "100%", objectFit: "cover"}} />
);

const Confetti: React.FC<{from?: number; count?: number}> = ({from = 0, count = 80}) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  const t = frame - from;
  const colors = ["#ff6fa5", "#ffd34d", "#7fd1ff", "#9b7bff", "#7be08a", "#ff9a52"];
  return (
    <AbsoluteFill style={{pointerEvents: "none", zIndex: 33}}>
      {Array.from({length: count}).map((_, i) => {
        const ang = rand(i) * Math.PI * 2;
        const sp = 12 + rand(i + 50) * 22;
        const x = 540 + Math.cos(ang) * sp * Math.min(t, 40) + Math.sin((t + i * 7) / 9) * 20;
        const y = 760 + Math.sin(ang) * sp * Math.min(t, 40) + 0.35 * t * t * 0.4;
        return <div key={i} style={{position: "absolute", left: x, top: y, width: 18, height: 30, borderRadius: 4, background: colors[i % colors.length], transform: `rotate(${t * (6 + rand(i + 3) * 10) + i * 40}deg)`}} />;
      })}
    </AbsoluteFill>
  );
};

/** Globo rosado que Luis lleva para la fiesta. */
const Balloon: React.FC<{x: number; y: number}> = ({x, y}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={260} height={520} viewBox="-130 -170 260 520" style={{position: "absolute", left: x - 130, top: y - 170 + Math.sin(frame / 10) * 10, zIndex: 3}}>
      <path d="M0,150 Q-30,250 10,350" stroke="#e7d7ff" strokeWidth={4} fill="none" />
      <ellipse cx={0} cy={0} rx={110} ry={135} fill="#ff6fa5" />
      <ellipse cx={-40} cy={-55} rx={22} ry={40} fill="#fff" opacity={0.35} transform="rotate(25 -40 -55)" />
      <path d="M-12,134 L12,134 L0,152 Z" fill="#ff6fa5" />
    </svg>
  );
};

const Apertura: React.FC<SerieProps> = ({ella}) => (
  <AbsoluteFill>
    <Camera keys={[{f: 0, z: 1, x: 540, y: 960}, {f: 90, z: 1, x: 540, y: 960}, {f: 120, z: 1.18, x: 540, y: 1100}]}>
      <Backdrop src={HOME} size={[1080, 1920]} cam={homeCam} camF={[0]} blur={2} dim={0.05} />
      <Actor who={ACTORS.luis} keys={[{f: 0, x: -420, y: FEET, h: LH}, {f: 55, x: 300, y: FEET, h: LH}]} tint={INDOOR} z={1} />
      <Actor who={ACTORS.bruno} keys={[{f: 0, x: 820, y: 2700, h: 950}, {f: 70, x: 820, y: 2700, h: 950}, {f: 92, x: 820, y: 2030, h: 950}]} shadow={false} z={2} />
    </Camera>
    <Narration text="Una semana después…" start={4} end={56} top={330} />
    <Speech text={`Psst… mañana es el cumpleaños de ${ella}.`} start={60} end={118} x={480} y={480} tail="left" size={52} />
    <Speech text="¿Me ayudas con la sorpresa?" start={120} end={168} x={480} y={480} tail="left" />
    <Emote kind="sorpresa" x={850} y={1020} start={96} end={150} />
    <Look tint="rgba(60,40,20,0.12)" vignette={0.55} />
    <Grain />
  </AbsoluteFill>
);

const Titulo: React.FC = () => (
  <AbsoluteFill>
    <Backdrop src={HOME} size={[1080, 1920]} cam={homeCam} camF={[0]} blur={12} dim={0.55} />
    <EpisodeTitle num={3} title="La sorpresa" />
    <Flash len={12} />
    <Grain />
  </AbsoluteFill>
);

const Trato: React.FC = () => (
  <AbsoluteFill>
    <Camera keys={[{f: 0, z: 1.18, x: 540, y: 1100}, {f: 60, z: 1.3, x: 700, y: 1250}, {f: 110, z: 1.1, x: 540, y: 1100}]}>
      <Backdrop src={HOME} size={[1080, 1920]} cam={homeCam} camF={[0]} blur={2} dim={0.05} />
      <Actor who={ACTORS.luis} keys={[{f: 0, x: 300, y: FEET, h: LH}]} tint={INDOOR} z={1} hops={[120]} />
      <Actor who={ACTORS.bruno} keys={[{f: 0, x: 820, y: 2030, h: 950}]} shadow={false} z={2} hops={[75]} />
    </Camera>
    <Speech text="Mmm… solo si hay comida." tone="pensamiento" start={10} end={72} x={640} y={820} tail="right" />
    <Speech text="¡Trato hecho, socio!" start={80} end={150} x={470} y={460} tail="left" />
    <Emote kind="corazon" x={820} y={900} start={110} end={178} size={100} />
    <Narration text="Nació una alianza inesperada." start={140} top={1580} size={64} />
    <Look tint="rgba(60,40,20,0.12)" vignette={0.55} />
    <Grain />
  </AbsoluteFill>
);

/** Montaje rápido de los preparativos. */
const Preparativos: React.FC<SerieProps> = ({mascota, el}) => {
  const tag = (text: string) => (
    <div style={{position: "absolute", left: 60, top: 260, zIndex: 45, fontFamily: OSWALD, fontWeight: 700, fontSize: 64, color: "#1b1012", background: GOLD, padding: "8px 26px", transform: "rotate(-3deg)", boxShadow: "0 8px 20px rgba(0,0,0,0.4)"}}>{text}</div>
  );
  return (
    <AbsoluteFill>
      <Sequence durationInFrames={80} layout="none">
        <AbsoluteFill>
          <Video src={serie("bruno-camina.mp4")} rate={1.3} />
          {tag(`${mascota} revisó el jardín`)}
          <Look tint="rgba(30,60,20,0.12)" vignette={0.5} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={80} durationInFrames={80} layout="none">
        <AbsoluteFill>
          <Backdrop src={HOME} size={[1080, 1920]} cam={homeCam} camF={[0]} blur={2} dim={0.05} />
          <Actor who={ACTORS.luis} keys={[{f: 0, x: -400, y: FEET, h: LH}, {f: 28, x: 440, y: FEET, h: LH}, {f: 54, x: 440, y: FEET, h: LH}, {f: 80, x: 1500, y: FEET, h: LH}]} tint={INDOOR} hops={[34]} />
          <PasaGlobo />
          {tag(`${el} trajo los globos`)}
          <Look tint="rgba(60,40,20,0.12)" vignette={0.5} />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={160} durationInFrames={80} layout="none">
        <AbsoluteFill>
          <Video src={serie("bruno-llega.mp4")} rate={1.1} />
          {tag("…y todo fue aprobado")}
          <Emote kind="corazon" x={760} y={700} start={30} end={80} size={100} />
          <Look tint="rgba(30,60,20,0.12)" vignette={0.5} />
        </AbsoluteFill>
      </Sequence>
      <Flash len={6} />
      <Flash at={80} len={6} />
      <Flash at={160} len={6} />
      <Grain />
    </AbsoluteFill>
  );
};

/** El globo cruza junto a Luis (se usa dentro de la secuencia de 80 cuadros). */
const PasaGlobo: React.FC = () => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 28, 54, 80], [-400, 440, 440, 1500], {...clamp, easing: Easing.inOut(Easing.cubic)}) + 250;
  return <Balloon x={x} y={560} />;
};

const Espera: React.FC<SerieProps> = ({ella}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = frame < 60 ? null : frame < 90 ? 3 : frame < 120 ? 2 : 1;
  const local = n === 3 ? frame - 60 : n === 2 ? frame - 90 : frame - 120;
  const s = spring({frame: local, fps, config: {damping: 10, stiffness: 200}});
  return (
    <AbsoluteFill style={{background: "#050304", alignItems: "center", justifyContent: "center"}}>
      <Narration text={`Shh… ${ella} está por llegar.`} start={6} end={58} top={880} size={72} />
      {n && (
        <div style={{fontFamily: OSWALD, fontWeight: 700, fontSize: 420, color: GOLD, transform: `scale(${0.6 + 0.4 * s})`, opacity: interpolate(local, [0, 4, 24, 30], [0, 1, 1, 0], clamp), textShadow: "0 0 60px rgba(242,199,110,0.4)"}}>{n}</div>
      )}
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};

const Sorpresa: React.FC<SerieProps> = ({ella}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = interpolate(frame, [0, 240], [0, 1], {...clamp, easing: Easing.inOut(Easing.sin)});
  const title = spring({frame: frame - 12, fps, config: {damping: 10, stiffness: 140}});
  // foto real del cumpleaños: 1512 x 2016, acercamiento lento hacia Cynia y Bruno
  const k = (1920 / 2016) * (1 + 0.25 * t);
  const cx = 756 - 120 * t;
  const cy = 1008 - 110 * t;
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <Img src={staticFile("cumpleanos/cynia-bruno.jpg")} style={{position: "absolute", width: 1512 * k, height: 2016 * k, left: 540 - cx * k, top: 960 - cy * k, maxWidth: "none"}} />
      <Confetti from={2} />
      <AbsoluteFill style={{alignItems: "center", top: 170, height: "auto", zIndex: 44}}>
        <div style={{transform: `scale(${title})`, textAlign: "center", fontFamily: OSWALD, fontWeight: 700, color: "#fff", textShadow: "0 6px 30px rgba(0,0,0,0.7)"}}>
          <div style={{fontSize: 92, letterSpacing: "0.06em"}}>¡FELIZ CUMPLEAÑOS,</div>
          <div style={{fontSize: 170, lineHeight: 1, color: GOLD}}>{ella.toUpperCase()}!</div>
        </div>
      </AbsoluteFill>
      <Speech text="¿Ustedes dos hicieron todo esto?" start={110} end={236} x={540} y={1560} size={56} />
      <Look tint="rgba(90,40,0,0.1)" vignette={0.55} />
      <Flash len={16} />
      <Grain />
    </AbsoluteFill>
  );
};

const Final: React.FC<SerieProps> = ({el, mascota}) => {
  const frame = useCurrentFrame();
  const hand = interpolate(frame, [40, 60], [0, 1], clamp);
  const luisX = 300;
  return (
    <AbsoluteFill>
      <Camera keys={[{f: 0, z: 1, x: 540, y: 960}, {f: 240, z: 1.12, x: 540, y: 1000}]}>
        <Backdrop src={HOME} size={[1080, 1920]} cam={homeCam} camF={[0]} blur={3} dim={0.1} />
        <Actor who={ACTORS.cynia} keys={[{f: 0, x: 960, y: FEET, h: CH}, {f: 36, x: luisX + 572 * (1250 / 1350), y: FEET, h: CH}]} tint={INDOOR} z={1} />
        <Actor who={ACTORS.luis} keys={[{f: 0, x: luisX, y: FEET, h: LH}]} tint={INDOOR} z={2} />
        <Img src={serie("mano.png")} style={{position: "absolute", left: luisX - (627 * K) / 2 + 503 * K, top: FEET - LH + 328 * K, width: 112 * K, height: 134 * K, opacity: hand, zIndex: 3, filter: INDOOR}} />
        <Actor who={ACTORS.bruno} keys={[{f: 0, x: 560, y: 2700, h: 820}, {f: 70, x: 560, y: 2700, h: 820}, {f: 92, x: 560, y: 2090, h: 820}]} hops={[150]} shadow={false} z={4} />
      </Camera>
      <Hearts from={50} count={10} />
      <Narration text={`Desde ese día, ${mascota} aceptó a ${el}…`} start={10} end={130} top={330} size={62} />
      <Speech text="…casi." tone="pensamiento" start={140} end={236} x={560} y={1180} size={70} />
      <Look tint="rgba(90,20,40,0.14)" vignette={0.55} />
      <Grain />
    </AbsoluteFill>
  );
};

export const SerieEp3: React.FC<SerieProps> = (props) => {
  useSerieFonts();
  const sc = (k: string, node: React.ReactNode) => (
    <Sequence key={k} from={S[k][0]} durationInFrames={S[k][1]}>
      {node}
    </Sequence>
  );
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {sc("apertura", <Apertura {...props} />)}
      {sc("titulo", <Titulo />)}
      {sc("trato", <Trato />)}
      {sc("preparativos", <Preparativos {...props} />)}
      {sc("espera", <Espera {...props} />)}
      {sc("sorpresa", <Sorpresa {...props} />)}
      {sc("final", <Final {...props} />)}
      {sc("fin", <EndCard text="FIN" sub="Amor en Fit Life · Temporada 1" />)}
      {props.music !== false && <Audio src={serie("ep3-musica.mp3")} />}
    </AbsoluteFill>
  );
};

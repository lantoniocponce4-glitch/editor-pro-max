import React from "react";
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {
  ACTORS,
  Actor,
  Backdrop,
  Camera,
  EndCard,
  Emote,
  EpisodeTitle,
  Flash,
  Grain,
  Hearts,
  Look,
  NameCard,
  Narration,
  Speech,
  clamp,
  serie,
  useSerieFonts,
} from "../../components/serie/Stage";
import T from "./ep1.json";

/**
 * Serie "Amor en Fit Life" · Episodio 1 "La mirada" (1080x1920, 30 fps, 47 s).
 * Luis y Cynia (recortes de su foto) se encuentran en el gimnasio; Bruno se entera.
 */

const S = T.scenes as unknown as Record<string, [number, number]>;
export const EP1_DURATION = S.fin[0] + S.fin[1];

export type SerieProps = {el: string; ella: string; mascota: string; music?: boolean};

// Escala común de la foto de la pareja: Luis 1350 px de alto en pantalla
const K = 1350 / 1228;
const LH = 1228 * K;
const CH = 1155 * K;
const FEET = 1945;
const GYM = serie("gym-fondo.jpg");
const GYM_SIZE: [number, number] = [2576, 1717];
const gymCam = (cx = 1240): [number, number, number][] => [[cx, 860, 1717]];

/** Mano de Cynia sobre el hombro de Luis cuando están juntos (pose original de la foto). */
const Mano: React.FC<{luisX: number; show: number}> = ({luisX, show}) => {
  const left = luisX - (627 * K) / 2 + 503 * K;
  const top = FEET - LH + 328 * K;
  return <Img src={serie("mano.png")} style={{position: "absolute", left, top, width: 112 * K, height: 134 * K, opacity: show, zIndex: 3}} />;
};

const Apertura: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [60, 110], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <AbsoluteFill style={{opacity: reveal}}>
        <Backdrop src={GYM} size={GYM_SIZE} cam={[[1240, 520, 1100], [1240, 640, 1400]]} camF={[60, 120]} dim={0.3} />
      </AbsoluteFill>
      <Narration text="Gimnasio Fit Life. 7:00 a. m." start={8} end={70} top={880} size={74} />
      <Narration text="Todos tenemos una rutina…" start={70} top={1500} size={70} />
      <Look vignette={0.85} />
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};

const Titulo: React.FC = () => (
  <AbsoluteFill>
    <Backdrop src={GYM} size={GYM_SIZE} cam={gymCam()} camF={[0]} blur={12} dim={0.55} />
    <EpisodeTitle num={1} title="La mirada" />
    <Flash len={12} />
    <Grain />
  </AbsoluteFill>
);

const LuisEntra: React.FC<SerieProps> = ({el}) => (
  <AbsoluteFill>
    <Camera keys={[{f: 0, z: 1, x: 540, y: 960}, {f: 60, z: 1, x: 540, y: 960}, {f: 110, z: 1.25, x: 430, y: 900}]}>
      <Backdrop src={GYM} size={GYM_SIZE} cam={gymCam()} camF={[0]} />
      <Actor who={ACTORS.luis} keys={[{f: 0, x: -420, y: FEET, h: LH}, {f: 58, x: 420, y: FEET, h: LH}]} />
    </Camera>
    <Speech text="Hoy sí le hablo…" tone="pensamiento" start={70} end={165} x={560} y={430} tail="left" />
    <Emote kind="sudor" x={800} y={560} start={110} end={165} size={70} />
    <NameCard name={el} tag="El chico de la camiseta roja" start={62} />
    <Look />
    <Grain />
  </AbsoluteFill>
);

const CyniaEntra: React.FC<SerieProps> = ({ella}) => (
  <AbsoluteFill>
    <Camera keys={[{f: 0, z: 1, x: 540, y: 960}, {f: 60, z: 1, x: 540, y: 960}, {f: 110, z: 1.22, x: 680, y: 960}]}>
      <Backdrop src={GYM} size={GYM_SIZE} cam={gymCam()} camF={[0]} />
      <Actor who={ACTORS.cynia} keys={[{f: 0, x: 1460, y: FEET, h: CH}, {f: 58, x: 700, y: FEET, h: CH}]} />
    </Camera>
    <Emote kind="nota" x={880} y={600} start={20} end={70} size={70} />
    <Speech text="¿Será que hoy viene?" tone="pensamiento" start={74} end={165} x={600} y={520} tail="right" />
    <NameCard name={ella} tag="La sonrisa que ilumina el gimnasio" start={62} />
    <Look />
    <Grain />
  </AbsoluteFill>
);

/** Se acercan sin verse, chocan y conversan. */
const Choque: React.FC = () => (
  <AbsoluteFill>
    <Camera
      keys={[
        {f: 0, z: 1, x: 540, y: 960},
        {f: 70, z: 1, x: 540, y: 960},
        {f: 78, z: 1.18, x: 560, y: 900},
        {f: 150, z: 1.18, x: 560, y: 900},
        {f: 175, z: 1.35, x: 420, y: 820},
        {f: 225, z: 1.35, x: 420, y: 820},
        {f: 245, z: 1.35, x: 700, y: 860},
      ]}
      shake={[76]}
    >
      <Backdrop src={GYM} size={GYM_SIZE} cam={gymCam()} camF={[0]} />
      {/* Luis entra mirando su teléfono... */}
      <Actor who={ACTORS.luis} keys={[{f: 0, x: -360, y: FEET, h: LH}, {f: 72, x: 330, y: FEET, h: LH}, {f: 82, x: 230, y: FEET, h: LH, rot: -4}, {f: 110, x: 250, y: FEET, h: LH}]} shakes={[76]} z={2} />
      {/* ...y Cynia, distraída, viene del otro lado */}
      <Actor who={ACTORS.cynia} keys={[{f: 0, x: 1420, y: FEET, h: CH}, {f: 72, x: 780, y: FEET, h: CH}, {f: 82, x: 880, y: FEET, h: CH, rot: 4}, {f: 110, x: 860, y: FEET, h: CH}]} shakes={[76]} z={1} />
    </Camera>
    <Emote kind="sorpresa" x={430} y={420} start={78} end={130} />
    <Emote kind="sorpresa" x={900} y={500} start={80} end={130} />
    <Speech text="¡Perdón! No te vi…" start={100} end={170} x={460} y={380} tail="left" />
    <Speech text="Tranquilo… ¿vienes siempre a esta hora?" start={172} end={240} x={600} y={330} tail="right" size={52} />
    <Speech text="Todos los días. Igual que tú." start={242} end={300} x={470} y={330} tail="left" />
    <Emote kind="corazon" x={900} y={480} start={262} end={300} size={80} />
    <Look />
    <Grain />
  </AbsoluteFill>
);

/** Ella se acerca y le pone la mano en el hombro: la pose real de la foto. */
const Momento: React.FC = () => {
  const frame = useCurrentFrame();
  const hand = interpolate(frame, [70, 90], [0, 1], clamp);
  const luisX = 290;
  return (
    <AbsoluteFill>
      <Camera keys={[{f: 0, z: 1, x: 540, y: 960}, {f: 60, z: 1, x: 540, y: 960}, {f: 200, z: 1.45, x: 560, y: 760}]}>
        <Backdrop src={GYM} size={GYM_SIZE} cam={gymCam()} camF={[0]} />
        <Actor who={ACTORS.cynia} keys={[{f: 0, x: 900, y: FEET, h: CH}, {f: 60, x: luisX + 572, y: FEET, h: CH}]} z={1} />
        <Actor who={ACTORS.luis} keys={[{f: 0, x: luisX, y: FEET, h: LH}]} z={2} />
        <Mano luisX={luisX} show={hand} />
        <Emote kind="corazon" x={580} y={480} start={100} end={200} size={110} />
      </Camera>
      <AbsoluteFill style={{background: "radial-gradient(circle at 50% 40%, rgba(255,190,170,1) 0%, rgba(255,120,150,0.35) 35%, rgba(0,0,0,0) 65%)", mixBlendMode: "screen", opacity: interpolate(frame, [90, 150], [0, 0.4], clamp), zIndex: 30}} />
      <Hearts from={95} />
      <Narration text="Ella puso la mano en su hombro…" start={20} end={100} />
      <Narration text="…y el mundo se detuvo." start={104} size={76} />
      <Look tint="rgba(90,20,40,0.2)" />
      <Grain />
    </AbsoluteFill>
  );
};

/** En casa, Bruno ve la foto y no está nada contento. */
const BrunoSeEntera: React.FC<SerieProps> = ({mascota, el}) => {
  const frame = useCurrentFrame();
  const phone = interpolate(frame, [30, 50], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Camera keys={[{f: 0, z: 1, x: 540, y: 960}, {f: 110, z: 1, x: 540, y: 960}, {f: 125, z: 1.3, x: 540, y: 1000}]} shake={[118]}>
        <Backdrop src={serie("casa-fondo.jpg")} size={[1080, 1920]} cam={[[540, 960, 1920]]} camF={[0]} blur={3} />
        {/* la foto de la pareja en el celular de Cynia, sobre la manta */}
        <div style={{position: "absolute", left: 140, top: 1180, width: 300, height: 520, borderRadius: 34, background: "#111", padding: 14, transform: `rotate(-12deg) scale(${0.7 + 0.3 * phone})`, opacity: phone, boxShadow: "0 20px 40px rgba(0,0,0,0.5)", zIndex: 1}}>
          <Img src={staticFile("drama/pareja.jpg")} style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: 24}} />
        </div>
        <Actor who={ACTORS.bruno} keys={[{f: 0, x: 680, y: 2700, h: 1250}, {f: 26, x: 680, y: 1990, h: 1250}]} hops={[118]} shakes={[118]} shadow={false} z={2} />
      </Camera>
      <Emote kind="sorpresa" x={600} y={720} start={70} end={112} />
      <Speech text={`¿Y ese ${el} quién es?`} tone="grito" start={122} end={225} x={540} y={620} size={60} />
      <Emote kind="rayo" x={190} y={760} start={126} end={225} />
      <Emote kind="rayo" x={900} y={740} start={132} end={225} />
      <Narration text="Mientras tanto, en casa…" start={4} end={66} top={330} />
      <NameCard name={mascota} tag="El gato celoso" start={150} color="#7a1fb8" top={1460} />
      <Look tint="rgba(120,0,30,0.25)" vignette={0.8} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};

export const SerieEp1: React.FC<SerieProps> = (props) => {
  useSerieFonts();
  const sc = (k: string, node: React.ReactNode) => (
    <Sequence key={k} from={S[k][0]} durationInFrames={S[k][1]}>
      {node}
    </Sequence>
  );
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {sc("apertura", <Apertura />)}
      {sc("titulo", <Titulo />)}
      {sc("luis", <LuisEntra {...props} />)}
      {sc("cynia", <CyniaEntra {...props} />)}
      {sc("choque", <Choque />)}
      {sc("momento", <Momento />)}
      {sc("bruno", <BrunoSeEntera {...props} />)}
      {sc("fin", <EndCard text="CONTINUARÁ…" sub="Episodio 2 · El rival peludo" />)}
      {props.music !== false && <Audio src={serie("ep1-musica.mp3")} />}
    </AbsoluteFill>
  );
};

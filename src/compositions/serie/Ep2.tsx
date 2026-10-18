import React from "react";
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
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
  Look,
  Narration,
  OSWALD,
  RED,
  Speech,
  clamp,
  serie,
  useSerieFonts,
  useShake,
} from "../../components/serie/Stage";
import type {SerieProps} from "./Ep1";
import T from "./ep2.json";

/**
 * Serie "Amor en Fit Life" · Episodio 2 "El rival peludo" (1080x1920, 30 fps, 62 s).
 * Bruno (video real en el jardín) vigila; Luis llega, se enfrentan y Luis intenta ganárselo.
 */

const S = T.scenes as unknown as Record<string, [number, number]>;
export const EP2_DURATION = S.fin[0] + S.fin[1];

const K = 1250 / 1228; // escala de la foto de la pareja en el jardín
const LH = 1228 * K;
const CH = 1155 * K;
const FEET = 1990;
const DAY = "brightness(1.12) saturate(1.06) sepia(0.06)"; // iguala la luz de las fotos al sol del jardín
const GARDEN = serie("jardin-fondo.jpg");
const gardenCam: [number, number, number][] = [[540, 960, 1920]];

const Video: React.FC<{src: string; rate?: number; from?: number}> = ({src, rate = 1, from = 0}) => (
  <OffthreadVideo src={src} muted playbackRate={rate} trimBefore={from} style={{width: "100%", height: "100%", objectFit: "cover"}} />
);

const Apertura: React.FC<SerieProps> = ({el, mascota}) => (
  <AbsoluteFill>
    <Video src={serie("bruno-vigila.mp4")} />
    <Narration text={`Desde aquel día, ${mascota} no dejó de vigilar.`} start={10} end={95} top={1450} />
    <Speech text={`Si ese tal ${el} aparece por aquí…`} tone="pensamiento" start={98} end={178} x={540} y={470} size={56} />
    <Look tint="rgba(30,60,20,0.18)" />
    <Grain />
  </AbsoluteFill>
);

const Titulo: React.FC = () => (
  <AbsoluteFill>
    <Backdrop src={GARDEN} size={[1080, 1920]} cam={gardenCam} camF={[0]} blur={12} dim={0.55} />
    <EpisodeTitle num={2} title="El rival peludo" />
    <Flash len={12} />
    <Grain />
  </AbsoluteFill>
);

const Llegada: React.FC<SerieProps> = ({ella}) => (
  <AbsoluteFill>
    <Camera keys={[{f: 0, z: 1, x: 540, y: 960}, {f: 80, z: 1, x: 540, y: 960}, {f: 140, z: 1.2, x: 520, y: 900}]}>
      <Backdrop src={GARDEN} size={[1080, 1920]} cam={gardenCam} camF={[0]} blur={1.5} dim={0} />
      <Actor who={ACTORS.luis} keys={[{f: 0, x: -400, y: FEET, h: LH}, {f: 70, x: 470, y: FEET, h: LH}]} tint={DAY} />
    </Camera>
    <Speech text={`¿${ella}? Vine a verte…`} start={78} end={140} x={540} y={520} tail="left" />
    <Speech text="Qué jardín tan tranquilo." start={142} end={198} x={540} y={520} tail="left" />
    <Emote kind="nota" x={800} y={620} start={150} end={198} size={70} />
    <Look tint="rgba(30,60,20,0.12)" vignette={0.55} />
    <Grain />
  </AbsoluteFill>
);

const Despierta: React.FC = () => (
  <AbsoluteFill style={{transform: useShake([0], 18)}}>
    <Video src={serie("bruno-despierta.mp4")} />
    <Narration text="Pero el guardián despertó." start={20} top={1450} size={76} />
    <Emote kind="sorpresa" x={540} y={560} start={70} end={170} />
    <Look tint="rgba(120,0,30,0.18)" vignette={0.8} />
    <Flash len={10} />
    <Grain />
  </AbsoluteFill>
);

const Camina: React.FC = () => {
  const frame = useCurrentFrame();
  const bars = interpolate(frame, [0, 20], [0, 1], clamp);
  return (
    <AbsoluteFill style={{transform: useShake([0], 12)}}>
      <Video src={serie("bruno-camina.mp4")} rate={0.95} />
      {/* franjas de cine para el momento épico */}
      <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 190 * bars, background: "#000", zIndex: 42}} />
      <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 190 * bars, background: "#000", zIndex: 42}} />
      <Narration text="…y fue directo a su encuentro." start={16} top={1500} size={72} />
      <Look tint="rgba(120,0,30,0.2)" vignette={0.75} />
      <Grain opacity={0.1} />
    </AbsoluteFill>
  );
};

/** Pantalla dividida: Luis contra Bruno. */
const Duelo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const vs = spring({frame: frame - 10, fps, config: {damping: 8, stiffness: 220}});
  const half = (node: React.ReactNode, top: number) => <div style={{position: "absolute", left: 0, top, width: 1080, height: 960, overflow: "hidden"}}>{node}</div>;
  return (
    <AbsoluteFill style={{background: "#000"}}>
      {half(
        <>
          <Img src={GARDEN} style={{position: "absolute", width: 1080, height: 1920, top: -500, filter: "blur(3px)"}} />
          <Actor who={ACTORS.luis} keys={[{f: 0, x: 540, y: 1500, h: 1500}]} tint={DAY} shakes={[150]} />
        </>,
        0,
      )}
      {half(
        <>
          <Img src={GARDEN} style={{position: "absolute", width: 1080, height: 1920, top: -900, filter: "blur(3px)"}} />
          <Actor who={ACTORS.bruno} keys={[{f: 0, x: 560, y: 1240, h: 1150}]} hops={[100]} shadow={false} />
        </>,
        960,
      )}
      <div style={{position: "absolute", left: 0, top: 952, width: 1080, height: 16, background: RED, zIndex: 20}} />
      <div style={{position: "absolute", left: 540, top: 960, transform: `translate(-50%,-50%) scale(${vs}) rotate(-8deg)`, zIndex: 30, fontFamily: OSWALD, fontWeight: 700, fontSize: 190, color: "#fff", WebkitTextStroke: `10px ${RED}`, paintOrder: "stroke", textShadow: "0 10px 30px rgba(0,0,0,0.6)"}}>VS</div>
      <Speech text="Tranquilo, amigo… vengo en son de paz." start={30} end={100} x={540} y={300} size={50} />
      <Speech text="¡ESTE ES MI TERRITORIO!" tone="grito" start={102} end={175} x={540} y={1260} size={56} />
      <Emote kind="rayo" x={160} y={1320} start={104} end={175} />
      <Emote kind="rayo" x={920} y={1300} start={110} end={175} />
      <Emote kind="sudor" x={800} y={420} start={150} end={235} size={80} />
      <Speech text="…ok, plan B." start={180} end={236} x={500} y={300} />
      <Flash len={8} />
      <Grain />
    </AbsoluteFill>
  );
};

/** Luis le ofrece el juguete morado. */
const Soborno: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const give = spring({frame: frame - 60, fps, config: {damping: 14, stiffness: 90}});
  const toyX = 470 + give * 230;
  const toyY = 1180 + give * 360;
  return (
    <AbsoluteFill>
      <Camera keys={[{f: 0, z: 1, x: 540, y: 960}, {f: 150, z: 1, x: 540, y: 960}, {f: 180, z: 1.25, x: 700, y: 1250}]}>
        <Backdrop src={GARDEN} size={[1080, 1920]} cam={gardenCam} camF={[0]} blur={1.5} dim={0} />
        <Actor who={ACTORS.luis} keys={[{f: 0, x: 300, y: FEET, h: LH}, {f: 40, x: 330, y: FEET + 80, h: LH, rot: 6}]} tint={DAY} z={2} />
        <Actor who={ACTORS.bruno} keys={[{f: 0, x: 1300, y: FEET + 40, h: 900}, {f: 30, x: 800, y: FEET + 40, h: 900}]} hops={[90, 105]} shadow={false} z={1} />
        <Img src={serie("juguete.png")} style={{position: "absolute", left: toyX - 110, top: toyY - 90, width: 220, transform: `rotate(${-20 + give * 30}deg)`, zIndex: 3, filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.4))"}} />
      </Camera>
      <Speech text="Mira lo que te traje…" start={50} end={110} x={460} y={560} tail="left" />
      <Speech text="¿Un juguete nuevo?" tone="pensamiento" start={112} end={180} x={640} y={860} tail="right" />
      <Emote kind="corazon" x={820} y={1000} start={160} end={238} size={110} />
      <Look tint="rgba(30,60,20,0.12)" vignette={0.55} />
      <Grain />
    </AbsoluteFill>
  );
};

const Juguete: React.FC = () => (
  <AbsoluteFill>
    <Video src={staticFile("cumpleanos/clip-juguete.mp4")} rate={0.8} />
    <Narration text="Plan «soborno»: ¡éxito total!" start={14} top={1500} size={74} />
    <Look tint="rgba(90,40,0,0.15)" vignette={0.6} />
    <Grain />
  </AbsoluteFill>
);

const LlegaCynia: React.FC<SerieProps> = ({el, mascota}) => (
  <AbsoluteFill>
    <Camera keys={[{f: 0, z: 1, x: 540, y: 960}, {f: 150, z: 1, x: 540, y: 960}, {f: 175, z: 1.35, x: 560, y: 1500}]}>
      <Backdrop src={GARDEN} size={[1080, 1920]} cam={gardenCam} camF={[0]} blur={1.5} dim={0} />
      <Actor who={ACTORS.cynia} keys={[{f: 0, x: 1420, y: FEET, h: CH}, {f: 55, x: 790, y: FEET, h: CH}]} tint={DAY} z={1} />
      <Actor who={ACTORS.luis} keys={[{f: 0, x: 270, y: FEET, h: LH}]} tint={DAY} z={2} />
      <Actor who={ACTORS.bruno} keys={[{f: 0, x: 540, y: FEET + 120, h: 760}]} hops={[60]} shadow={false} z={3} />
    </Camera>
    <Speech text="¡Ya se conocieron!" start={58} end={110} x={640} y={500} tail="right" />
    <Speech text={`Somos grandes amigos… ¿verdad, ${mascota}?`} start={112} end={165} x={470} y={430} tail="left" size={52} />
    <Speech text="Por ahora, humano… por ahora." tone="pensamiento" start={172} end={238} x={540} y={760} />
    <Emote kind="rayo" x={240} y={900} start={180} end={238} />
    <Narration text={`${el} había ganado una batalla…`} start={10} end={56} top={300} size={60} />
    <Look tint="rgba(90,20,40,0.12)" vignette={0.55} />
    <Grain />
  </AbsoluteFill>
);

export const SerieEp2: React.FC<SerieProps> = (props) => {
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
      {sc("llegada", <Llegada {...props} />)}
      {sc("despierta", <Despierta />)}
      {sc("camina", <Camina />)}
      {sc("duelo", <Duelo />)}
      {sc("soborno", <Soborno />)}
      {sc("juguete", <Juguete />)}
      {sc("cynia", <LlegaCynia {...props} />)}
      {sc("fin", <EndCard text="CONTINUARÁ…" sub="Episodio 3 · La sorpresa" />)}
      {props.music !== false && <Audio src={serie("ep2-musica.mp3")} />}
    </AbsoluteFill>
  );
};

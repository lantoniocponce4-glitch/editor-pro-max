import React, {useMemo} from "react";
import {ThreeCanvas} from "@remotion/three";
import * as THREE from "three";

/**
 * Bruno en 3D estilo anime: sombreado "cel" (3 tonos planos), contorno negro
 * (técnica de casco invertido) y ojos grandes con reflejos.
 * <Bruno3DLayer> cubre todo el cuadro y ubica al gato en coordenadas de pantalla,
 * igual que el Bruno plano (x, y = punto del suelo bajo el gato).
 */

export type Bruno3DPose = {
  x: number;
  y: number;
  scale?: number;
  blink?: number;
  tail?: number; // grados
  tilt?: number; // grados
  bob?: number; // px
  hat?: boolean;
  look?: number; // -1..1
  happy?: boolean;
  turn?: number; // giro del cuerpo en grados (muestra el volumen 3D)
};

const COL = {
  orange: "#f39a45",
  orangeDark: "#c8661f",
  cream: "#fff3e2",
  pinkEar: "#ffb3c4",
  nose: "#f0849a",
  iris: "#f6b62e",
  pupil: "#2a160c",
  outline: "#2b1408",
  blush: "#ff8fa3",
  hat: "#ff6fa5",
  hatStripe: "#ffd34d",
};

const useToonGradient = () =>
  useMemo(() => {
    const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
    const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }, []);

const GradientCtx = React.createContext<THREE.Texture | null>(null);

type V3 = [number, number, number];

/** Esfera con sombreado anime y contorno. */
const Blob: React.FC<{pos: V3; scale: V3; color: string; rot?: V3; outline?: number; seg?: number}> = ({pos, scale, color, rot = [0, 0, 0], outline = 0.045, seg = 40}) => {
  const grad = React.useContext(GradientCtx);
  return (
    <group position={pos} rotation={rot}>
      <mesh scale={scale}>
        <sphereGeometry args={[1, seg, seg]} />
        <meshToonMaterial color={color} gradientMap={grad} />
      </mesh>
      {outline > 0 && (
        <mesh scale={[scale[0] + outline, scale[1] + outline, scale[2] + outline]}>
          <sphereGeometry args={[1, seg, seg]} />
          <meshBasicMaterial color={COL.outline} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
};

/** Cono con sombreado anime (orejas, mechones, gorro). */
const Cone: React.FC<{pos: V3; rot?: V3; r: number; h: number; color: string; outline?: number; scale?: V3}> = ({pos, rot = [0, 0, 0], r, h, color, outline = 0.04, scale = [1, 1, 1]}) => {
  const grad = React.useContext(GradientCtx);
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <mesh>
        <coneGeometry args={[r, h, 32]} />
        <meshToonMaterial color={color} gradientMap={grad} />
      </mesh>
      {outline > 0 && (
        <mesh scale={[1 + outline / r, 1 + outline / h, 1 + outline / r]}>
          <coneGeometry args={[r, h, 32]} />
          <meshBasicMaterial color={COL.outline} side={THREE.BackSide} />
        </mesh>
      )}
    </group>
  );
};

/** Trazo fino (boca, bigotes, ojos cerrados). */
const Stroke: React.FC<{pts: V3[]; r?: number; color?: string}> = ({pts, r = 0.018, color = COL.outline}) => {
  const geo = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 24, r, 8, false), [pts, r]);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color={color} />
    </mesh>
  );
};

/** Ojo anime: base oscura, iris ámbar, pupila vertical y dos brillos. */
const AnimeEye: React.FC<{x: number; blink: number; look: number; happy?: boolean}> = ({x, blink, look, happy}) => {
  const open = Math.max(0.06, 1 - blink);
  if (happy) {
    return <Stroke pts={[[x - 0.2, 2.3, 0.86], [x, 2.44, 0.92], [x + 0.2, 2.3, 0.86]]} r={0.035} />;
  }
  const lx = look * 0.05;
  return (
    <group position={[x, 2.34, 0.8]} scale={[1, open, 1]} rotation={[0, x * 0.35, 0]}>
      <mesh scale={[0.27, 0.34, 0.1]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={COL.outline} />
      </mesh>
      <mesh position={[lx, -0.02, 0.05]} scale={[0.23, 0.29, 0.08]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={COL.iris} />
      </mesh>
      <mesh position={[lx, 0.05, 0.075]} scale={[0.19, 0.16, 0.06]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#e08a12" />
      </mesh>
      <mesh position={[lx, -0.01, 0.1]} scale={[0.08, 0.22, 0.05]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={COL.pupil} />
      </mesh>
      {open > 0.5 && (
        <>
          <mesh position={[lx - 0.08, 0.12, 0.15]} scale={[0.075, 0.09, 0.03]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[lx + 0.08, -0.13, 0.15]} scale={[0.035, 0.035, 0.02]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      )}
    </group>
  );
};

/** Geometría de la cola: tubo que se adelgaza, con borde ondulado como pelo esponjoso. */
const makeTailGeometry = (curve: THREE.CatmullRomCurve3, extra: number, tipFrom = 0, tipTo = 1) => {
  const seg = 64;
  const radial = 28;
  const frames = curve.computeFrenetFrames(seg, false);
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const t = tipFrom + (tipTo - tipFrom) * (i / seg);
    const p = curve.getPointAt(t);
    const k = Math.round(t * seg);
    const N = frames.normals[k];
    const B = frames.binormals[k];
    // grosor: delgado en la base, esponjoso al medio, redondeado en la punta
    const base = 0.16 + 0.26 * Math.sin(Math.min(1, t * 1.25) * Math.PI * 0.62) * (t > 0.9 ? Math.sqrt(Math.max(0, (1 - t) / 0.1)) : 1);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const fluff = 1 + 0.1 * Math.sin(a * 7 + t * 20) * Math.sin(t * Math.PI);
      const r = base * fluff + extra;
      pos.push(p.x + r * (Math.cos(a) * N.x + Math.sin(a) * B.x), p.y + r * (Math.cos(a) * N.y + Math.sin(a) * B.y), p.z + r * (Math.cos(a) * N.z + Math.sin(a) * B.z));
    }
  }
  for (let i = 0; i < seg; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1); // caras hacia afuera, para que el contorno quede detrás
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
};

const Tail: React.FC<{wag: number}> = ({wag}) => {
  const grad = React.useContext(GradientCtx);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.75, 0.12, -0.1),
        new THREE.Vector3(1.2, 0.85, -0.05),
        new THREE.Vector3(1.1, 1.75, 0.05),
        new THREE.Vector3(0.68, 2.2, 0.1),
      ]),
    [],
  );
  const body = useMemo(() => makeTailGeometry(curve, 0, 0, 0.8), [curve]);
  const tip = useMemo(() => makeTailGeometry(curve, 0, 0.79, 1), [curve]);
  const hull = useMemo(() => makeTailGeometry(curve, 0.045), [curve]);
  return (
    <group position={[0.5, 0.5, -0.55]} rotation={[0, 0, (wag * Math.PI) / 180]}>
      <mesh geometry={body}>
        <meshToonMaterial color={COL.orange} gradientMap={grad} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={tip}>
        <meshToonMaterial color={COL.cream} gradientMap={grad} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={hull}>
        <meshBasicMaterial color={COL.outline} side={THREE.BackSide} />
      </mesh>
    </group>
  );
};

export const Bruno3DModel: React.FC<Omit<Bruno3DPose, "x" | "y" | "scale" | "bob">> = ({blink = 0, tail = 0, tilt = 0, hat, look = 0, happy, turn = 0}) => (
  <group rotation={[0, (turn * Math.PI) / 180, 0]}>
    <Tail wag={tail} />
    {/* cuerpo, pechera y patitas */}
    <Blob pos={[0, 0.95, 0]} scale={[0.95, 1.05, 0.8]} color={COL.orange} />
    <Blob pos={[0, 1.0, 0.42]} scale={[0.6, 0.82, 0.42]} color={COL.cream} outline={0.03} />
    {[-0.62, 0.62].map((sx) =>
      [0, 1, 2].map((k) => (
        <Cone key={`${sx}${k}`} pos={[sx * (1 + k * 0.04), 1.45 - k * 0.35, 0.05]} rot={[0, 0, (sx > 0 ? -1 : 1) * (1.9 + k * 0.15)]} r={0.16} h={0.45} color={COL.orange} outline={0.03} />
      )),
    )}
    <Blob pos={[-0.36, 0.14, 0.62]} scale={[0.27, 0.17, 0.3]} color={COL.cream} outline={0.035} />
    <Blob pos={[0.36, 0.14, 0.62]} scale={[0.27, 0.17, 0.3]} color={COL.cream} outline={0.035} />
    {/* cabeza */}
    <group position={[0, 2.25, 0]} rotation={[0, 0, (tilt * Math.PI) / 180]}>
      <group position={[0, -2.25, 0]}>
        <Blob pos={[0, 2.3, 0]} scale={[1.05, 0.88, 0.86]} color={COL.orange} />
        {/* mechones de las mejillas, típicos de un gato de pelo largo */}
        {[-1, 1].map((sd) =>
          [0, 1].map((k) => (
            <Cone key={`${sd}${k}`} pos={[sd * (0.95 - k * 0.06), 1.98 - k * 0.2, 0.1]} rot={[0, 0, sd * -(2.1 + k * 0.35)]} r={0.17} h={0.36} color={COL.orange} outline={0.03} />
          )),
        )}
        {/* orejas */}
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <Cone pos={[sd * 0.6, 3.28, -0.05]} rot={[0, 0, sd * -0.4]} r={0.38} h={0.85} color={COL.orange} />
            <Cone pos={[sd * 0.59, 3.22, 0.14]} rot={[0.1, 0, sd * -0.4]} r={0.23} h={0.56} color={COL.pinkEar} outline={0} />
            <Cone pos={[sd * 0.5, 3.36, 0.22]} rot={[0.15, 0, sd * -0.15]} r={0.05} h={0.34} color={COL.cream} outline={0} />
          </group>
        ))}
        {/* rayitas de la frente */}
        {[-0.18, 0, 0.18].map((fx) => (
          <Blob key={fx} pos={[fx, 2.88, 0.62]} rot={[-0.55, 0, fx * -0.8]} scale={[0.05, 0.17, 0.04]} color={COL.orangeDark} outline={0} seg={16} />
        ))}
        <AnimeEye x={-0.38} blink={blink} look={look} happy={happy} />
        <AnimeEye x={0.38} blink={blink} look={look} happy={happy} />
        {/* mejillas sonrojadas */}
        {[-0.68, 0.68].map((bx) => (
          <mesh key={bx} position={[bx, 2.05, 0.72]} rotation={[0, bx * 0.6, 0]} scale={[0.17, 0.09, 0.02]}>
            <sphereGeometry args={[1, 24, 24]} />
            <meshBasicMaterial color={COL.blush} transparent opacity={0.75} />
          </mesh>
        ))}
        {/* hocico, nariz y boca "w" */}
        <Blob pos={[-0.15, 1.98, 0.74]} scale={[0.2, 0.16, 0.14]} color={COL.cream} outline={0.02} />
        <Blob pos={[0.15, 1.98, 0.74]} scale={[0.2, 0.16, 0.14]} color={COL.cream} outline={0.02} />
        <Blob pos={[0, 2.1, 0.86]} scale={[0.08, 0.055, 0.05]} color={COL.nose} outline={0.015} seg={16} />
        <Stroke pts={[[-0.17, 1.98, 0.88], [-0.09, 1.92, 0.9], [0, 1.99, 0.91], [0.09, 1.92, 0.9], [0.17, 1.98, 0.88]]} />
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <Stroke pts={[[sd * 0.32, 2.02, 0.75], [sd * 0.7, 2.08, 0.72], [sd * 1.05, 2.16, 0.6]]} r={0.012} color="#ffffff" />
            <Stroke pts={[[sd * 0.32, 1.96, 0.75], [sd * 0.72, 1.94, 0.72], [sd * 1.08, 1.9, 0.6]]} r={0.012} color="#ffffff" />
          </group>
        ))}
        {hat && (
          <group position={[0.22, 3.15, 0]} rotation={[0, 0, -0.25]}>
            <Cone pos={[0, 0.45, 0]} r={0.42} h={0.95} color={COL.hat} />
            {[0.2, 0.55].map((hy, i) => (
              <mesh key={i} position={[0, hy, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.4 - hy * 0.38, 0.05, 12, 40]} />
                <meshBasicMaterial color={COL.hatStripe} />
              </mesh>
            ))}
            <Blob pos={[0, 0.95, 0]} scale={[0.14, 0.14, 0.14]} color={COL.hatStripe} outline={0.03} seg={20} />
          </group>
        )}
      </group>
    </group>
  </group>
);

/** Capa a pantalla completa: ubica a Bruno en coordenadas de píxeles. */
export const Bruno3DLayer: React.FC<Bruno3DPose & {width: number; height: number}> = ({width, height, x, y, scale = 1, bob = 0, ...pose}) => {
  const grad = useToonGradient();
  const camZ = 20;
  const fov = 30;
  const visibleH = 2 * camZ * Math.tan(((fov / 2) * Math.PI) / 180);
  const pxToUnit = visibleH / height;
  const wx = (x - width / 2) * pxToUnit;
  const wy = (height / 2 - (y + bob)) * pxToUnit;
  // la altura del Bruno plano (≈505 px a escala 1) equivale a ≈3.55 unidades del modelo
  const s = ((505 * scale) * pxToUnit) / 3.55;
  return (
    <ThreeCanvas width={width} height={height} camera={{fov, position: [0, 0, camZ], near: 0.1, far: 100}} gl={{antialias: true, alpha: true, preserveDrawingBuffer: true}} style={{position: "absolute", inset: 0}}>
      <GradientCtx.Provider value={grad}>
        <ambientLight intensity={0.85} />
        <directionalLight position={[-6, 9, 10]} intensity={1.9} />
        <directionalLight position={[6, 2, -6]} intensity={0.8} color="#ffd9b0" />
        <group position={[wx, wy, 0]} scale={[s, s, s]}>
          {/* sombra suave en el suelo */}
          <mesh position={[0.15, 0.02, -0.9]} scale={[1.5, 0.22, 1]}>
            <circleGeometry args={[1, 40]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.18} />
          </mesh>
          <Bruno3DModel {...pose} />
        </group>
      </GradientCtx.Provider>
    </ThreeCanvas>
  );
};

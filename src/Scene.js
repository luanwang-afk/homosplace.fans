import React, { Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const STORY_BEAT_RAD = Math.PI * 4;
const STORY_HALF_BEAT_RAD = STORY_BEAT_RAD * 2;
const NEON_WHITE = new THREE.Color('#fff0e4');
const STEAM_WHITE = new THREE.Color('#fff0e3');
const BREATH_RED = new THREE.Color('#ff4a2b');
const BREATH_MAGENTA = new THREE.Color('#ff1a0d');

function createDoorFogTexture(isMobilePerformance = false) {
  if (typeof document === 'undefined') return null;

  const size = isMobilePerformance ? 256 : 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(210, 225, 220, 0.08)';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < (isMobilePerformance ? 28 : 72); i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 55 + Math.random() * 185;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgba(242, 250, 246, ${0.2 + Math.random() * 0.22})`);
    gradient.addColorStop(0.5, `rgba(230, 241, 236, ${0.08 + Math.random() * 0.14})`);
    gradient.addColorStop(1, 'rgba(230, 241, 236, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < (isMobilePerformance ? 5 : 12); i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const rx = 24 + Math.random() * 85;
    const ry = 35 + Math.random() * 120;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    gradient.addColorStop(0, `rgba(0, 0, 0, ${0.2 + Math.random() * 0.28})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.7);
    ctx.scale(rx / 70, ry / 70);
    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';

  ctx.lineCap = 'round';
  for (let i = 0; i < (isMobilePerformance ? 8 : 24); i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const length = 35 + Math.random() * 160;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 + Math.random() * 0.13})`;
    ctx.lineWidth = 1 + Math.random() * 2.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + (Math.random() - 0.5) * 12,
      y + length * 0.35,
      x + (Math.random() - 0.5) * 12,
      y + length * 0.7,
      x + (Math.random() - 0.5) * 12,
      y + length
    );
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.9, 0.8);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function FoggyDoorGlass({ isMobilePerformance = false }) {
  const fogMap = React.useMemo(() => createDoorFogTexture(isMobilePerformance), [isMobilePerformance]);

  useFrame(({ clock }) => {
    if (!fogMap || isMobilePerformance) return;
    const t = clock.getElapsedTime();
    fogMap.offset.x = Math.sin(t * 0.08) * 0.018;
    fogMap.offset.y = Math.cos(t * 0.07) * 0.012;
  });

  useEffect(() => () => fogMap?.dispose(), [fogMap]);

  if (!fogMap) return null;

  return (
    <mesh position={[43.48, 12.7, 52.53]} renderOrder={12}>
      <planeGeometry args={[11.25, 30.7]} />
      <meshPhysicalMaterial
        color="#dce7e2"
        map={fogMap}
        alphaMap={fogMap}
        transparent
        opacity={0.6}
        roughness={0.98}
        metalness={0}
        clearcoat={0.5}
        clearcoatRoughness={0.95}
        transmission={0.02}
        thickness={0.38}
        side={THREE.DoubleSide}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}

function ExteriorModel({ onReady, isMobilePerformance = false, ...props }) {
  const { scene } = useGLTF(`${process.env.PUBLIC_URL}/aussen.glb`);
  const neonLightsRef = React.useRef([]);
  const steamCloudsRef = React.useRef([]);
  const mobileFrameSkipRef = React.useRef(0);
  const neonBlue = React.useMemo(() => new THREE.Color('#4b36ff'), []);
  const neonPurple = React.useMemo(() => new THREE.Color('#d02cff'), []);
  const neonRed = React.useMemo(() => new THREE.Color('#ff170d'), []);
  const sharedColor = React.useMemo(() => new THREE.Color(), []);
  const localColor = React.useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    // Apply glossy/wet look only to parts related to "saunainnen"
    const needle = 'saunainnen';
    const matchesSaunaInnen = (obj) => {
      const name = (obj.name || '').toLowerCase();
      if (name.includes(needle)) return true;
      // check parents
      let p = obj.parent;
      while (p) {
        if ((p.name || '').toLowerCase().includes(needle)) return true;
        p = p.parent;
      }
      // check material names (single or array)
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m && (m.name || '').toLowerCase().includes(needle)) return true;
      }
      return false;
    };

    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      if (!matchesSaunaInnen(obj)) return;
      const apply = (mat) => {
        if (!mat) return;
        if ('clearcoat' in mat) mat.clearcoat = 1.0;
        if ('clearcoatRoughness' in mat) mat.clearcoatRoughness = 0.02;
        if ('roughness' in mat) mat.roughness = Math.max(0.08, mat.roughness ?? 0.08);
        if ('metalness' in mat) mat.metalness = Math.max(0.45, mat.metalness ?? 0.45);
        if ('envMapIntensity' in mat) mat.envMapIntensity = Math.min(1.2, mat.envMapIntensity ?? 1.2);
        // mitigate z-fighting on glossy surfaces
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = 1;
        mat.polygonOffsetUnits = 1;
        mat.needsUpdate = true;
      };
      const m = obj.material;
      if (Array.isArray(m)) m.forEach(apply); else apply(m);
    });

  }, [scene]);

  useEffect(() => {
    const lights = [];
    const steamClouds = [];
    scene.traverse((obj) => {
      if (obj.isLight && /neonspot/i.test(obj.name || '')) {
        const lightIndex = lights.length;
        lights.push({
          light: obj,
          baseIntensity: obj.intensity ?? 1,
          baseDistance: obj.distance ?? 0,
          baseAngle: obj.angle ?? 0,
          phase: lightIndex * 0.73,
          twitchPhase: lightIndex * 1.91,
          flickerRate: 8.5 + (lightIndex % 5) * 2.2,
          breathRate: 0.48 + (lightIndex % 4) * 0.12,
          flickers: true
        });
      }
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      const isSteamCloud = obj.isMesh && (
        /^SteamCloudMesh/i.test(obj.name || '') ||
        materials.some((mat) => /steamcloud/i.test(mat?.name || ''))
      );
      if (isSteamCloud) {
        const cloudIndex = steamClouds.length;
        const shouldAnimateCloud = !isMobilePerformance || cloudIndex < 5;
        const density = 0.75 + (cloudIndex % 5) * 0.08;
        const baseOpacity = (isMobilePerformance ? 0.014 : 0.024) + (cloudIndex % 5) * 0.0025;
        const tint = ['#d7ddd7', '#dde0d5', '#d2dad4', '#e0ddd0', '#d5dddc'][cloudIndex % 5];
        materials.forEach((mat) => {
          if (!mat) return;
          if (mat.color) mat.color.set(tint);
          if (mat.emissive) mat.emissive.set('#243025');
          if ('emissiveIntensity' in mat) mat.emissiveIntensity = 0.02;
          if ('opacity' in mat) mat.opacity = baseOpacity;
          if ('roughness' in mat) mat.roughness = 1;
          mat.transparent = true;
          mat.depthWrite = false;
          mat.needsUpdate = true;
        });
        steamClouds.push({
          mesh: obj,
          animate: shouldAnimateCloud,
          basePosition: obj.position.clone(),
          baseRotation: obj.rotation.clone(),
          baseScale: obj.scale.clone(),
          baseOpacity,
          density,
          tint,
          phase: steamClouds.length * 0.91
        });
      }
    });
    neonLightsRef.current = lights;
    steamCloudsRef.current = steamClouds;
    onReady?.();
  }, [scene, onReady, isMobilePerformance]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const lights = neonLightsRef.current;
    if (lights.length) {
      const blend = 0.5 + Math.sin(t * 0.52) * 0.5;
      const redBlend = Math.max(0, Math.sin(t * 0.74 - 0.35));
      const heatBloom = Math.max(0, Math.sin(t * 1.12 - 0.8));
      sharedColor.copy(neonBlue)
        .lerp(neonPurple, blend)
        .lerp(neonRed, Math.min(0.86, 0.24 + redBlend * 0.38 + heatBloom * 0.22));
      for (let i = 0; i < lights.length; i++) {
        const entry = lights[i];
        const l = entry.light;
        const unstableRed = Math.max(0, Math.sin(t * 0.9 + entry.phase) + Math.sin(t * 0.3 + entry.phase * 2.4) * 0.65);
        localColor.copy(sharedColor)
          .lerp(neonRed, Math.min(0.68, unstableRed * 0.28))
          .lerp(NEON_WHITE, Math.max(0, Math.sin(t * 2.1 + entry.phase) - 0.93) * 0.18);
        l.color.copy(localColor);

        const slowBreath = 1.04 + Math.sin(t * entry.breathRate + entry.phase) * 0.22;
        const smallJitter = Math.max(0, Math.sin(t * entry.flickerRate + Math.sin(t * 1.8 + entry.phase) * 2.2) - 0.84) * 0.14;
        const hardDrop = Math.max(0, Math.sin(t * (13.5 + i * 1.2) + entry.twitchPhase) - 0.975) * 0.14;
        const clapFlash = Math.max(0, Math.sin(t * STORY_HALF_BEAT_RAD + entry.phase * 0.35) - 0.72) * 0.22;
        const kickFlash = Math.max(0, Math.sin(t * STORY_BEAT_RAD + entry.phase) - 0.93) * 0.12 + clapFlash;
        const unstable = slowBreath + smallJitter + kickFlash - hardDrop;
        l.intensity = entry.baseIntensity * Math.max(0.36, unstable * 1.08);
        if (entry.baseDistance && 'distance' in l) {
          l.distance = entry.baseDistance * (1.02 + Math.max(0, kickFlash) * 0.16 + Math.sin(t * 0.34 + entry.phase) * 0.05);
        }
        if (entry.baseAngle && 'angle' in l) {
          l.angle = entry.baseAngle * (1 + Math.sin(t * 0.62 + entry.phase) * 0.035);
        }
      }
    }

    if (isMobilePerformance) {
      mobileFrameSkipRef.current = (mobileFrameSkipRef.current + 1) % 2;
      if (mobileFrameSkipRef.current !== 0) return;
    }

    const steamClouds = steamCloudsRef.current;
    for (let i = 0; i < steamClouds.length; i++) {
      const cloud = steamClouds[i];
      if (!cloud.animate) continue;
      const mesh = cloud.mesh;
      const p = cloud.phase;
      mesh.position.set(
        cloud.basePosition.x + Math.sin(t * 0.12 + p) * 3.4 + Math.sin(t * 0.05 + p * 2.1) * 1.1,
        cloud.basePosition.y + Math.sin(t * 0.1 + p * 1.4) * 2.25 + Math.cos(t * 0.04 + p) * 0.7,
        cloud.basePosition.z + Math.cos(t * 0.11 + p) * 3.0 + Math.sin(t * 0.06 + p * 1.7) * 0.9
      );
      mesh.rotation.set(
        cloud.baseRotation.x + Math.sin(t * 0.07 + p) * 0.18,
        cloud.baseRotation.y + Math.sin(t * 0.06 + p) * 0.32,
        cloud.baseRotation.z + Math.cos(t * 0.075 + p) * 0.2
      );
      const scalePulse = 1 + Math.sin(t * 0.14 + p) * 0.14;
      mesh.scale.set(
        cloud.baseScale.x * scalePulse,
        cloud.baseScale.y * (1 + Math.cos(t * 0.12 + p) * 0.12),
        cloud.baseScale.z * (1 + Math.sin(t * 0.11 + p * 1.3) * 0.13)
      );

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        if (!mat || !('opacity' in mat)) return;
        const breath = 0.72 + Math.sin(t * 0.14 + p) * 0.2 + Math.sin(t * 0.065 + p * 2) * 0.12;
        const heatKick = Math.max(0, Math.sin(t * STORY_BEAT_RAD + p) - 0.9) * 0.34;
        mat.opacity = Math.max(0.008, cloud.baseOpacity * (breath + heatKick));
        if (mat.color) {
          const wetPulse = 0.5 + Math.sin(t * 0.18 + p) * 0.5 + heatKick;
          mat.color.set(cloud.tint).lerp(STEAM_WHITE, Math.min(0.34, wetPulse * 0.16));
        }
        if (mat.emissive && 'emissiveIntensity' in mat) {
          mat.emissive.set('#352018');
          mat.emissiveIntensity = 0.018 + heatKick * 0.05;
        }
      });
    }
  });
  return (
    <group {...props}>
      <primitive object={scene} />
      <FoggyDoorGlass />
    </group>
  );
}



// Simple Error Boundary to prevent white screen if model fails
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false }; }
  static getDerivedStateFromError(){ return { hasError:true }; }
  componentDidCatch(err, info){ this.props.onError?.(err, info); }
  render(){
    if(this.state.hasError){
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

function CameraGlintLight({ isMobilePerformance = false }) {
  const lightRef = React.useRef(null);
  const { camera } = useThree();
  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.position.copy(camera.position);
    }
  });
  return (
    <pointLight
      ref={lightRef}
      intensity={isMobilePerformance ? 0.045 : 0.11}
      distance={220}
      decay={2}
      color="#ffffff"
    />
  );
}

function ResponsiveCameraControls({ introReady, hasStarted }) {
  const controlsRef = React.useRef(null);
  const introElapsed = React.useRef(0);
  const [reducedMotion] = React.useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (hasStarted || reducedMotion) introElapsed.current = 5;
    if (introReady) introElapsed.current = Math.min(5, introElapsed.current + Math.min(delta, 0.1));
    // Wait for the loading overlay, then demonstrate one gentle arc and settle.
    const phase = THREE.MathUtils.clamp((introElapsed.current - 0.8) / 4, 0, 1);
    controls.autoRotateSpeed = -0.2 - 3 * Math.sin(Math.PI * phase);
  }, -2);

  const { camera, size } = useThree();
  const aspect = size.width / Math.max(size.height, 1);

  React.useLayoutEffect(() => {
    // Keep at least a 40-degree horizontal view on narrow screens.
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(
      Math.tan(THREE.MathUtils.degToRad(20)) / Math.min(aspect, 1)
    ));
    camera.updateProjectionMatrix();
  }, [camera, aspect]);

  return (
    <OrbitControls
      ref={controlsRef}
      onStart={() => { introElapsed.current = 5; }}
      enableDamping
      dampingFactor={0.08}
      // Orbit around the figure on every screen size.
      target={[45, 2, 10]}
      enableZoom
      minDistance={12}
      maxDistance={220}
      minPolarAngle={Math.PI * 0.15}
      maxPolarAngle={Math.PI * 0.5}
      autoRotate
      autoRotateSpeed={-0.20}
      enablePan
    />
  );
}

function SceneBreathingLights({ isMobilePerformance = false }) {
  const redRef = React.useRef(null);
  const warmRef = React.useRef(null);
  const magentaRef = React.useRef(null);
  const hazeRef = React.useRef(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (isMobilePerformance) {
      if (redRef.current) {
        redRef.current.intensity = 0.16 + Math.max(0, Math.sin(t * STORY_BEAT_RAD) - 0.94) * 0.08;
      }
      if (warmRef.current) warmRef.current.intensity = 0.045;
      if (magentaRef.current) magentaRef.current.intensity = 0.045;
      if (hazeRef.current) hazeRef.current.intensity = 0.05;
      return;
    }
    const clap = Math.max(0, Math.sin(t * STORY_HALF_BEAT_RAD) - 0.74);
    const kick = Math.max(0, Math.sin(t * STORY_BEAT_RAD) - 0.94);
    const twitch = Math.max(0, Math.sin(t * 9.5 + Math.sin(t * 1.5) * 1.8) - 0.965);
    const slow = 0.5 + Math.sin(t * 0.38) * 0.5;
    const redSwing = 0.5 + Math.sin(t * 0.72) * 0.5;

    if (redRef.current) {
      redRef.current.intensity = 0.13 + slow * 0.13 + clap * 0.28 + kick * 0.13 + twitch * 0.08;
      redRef.current.color.set('#ff1008').lerp(BREATH_RED, redSwing);
      redRef.current.position.x = 30 + Math.sin(t * 0.38) * 18;
      redRef.current.position.z = 44 + Math.cos(t * 0.32) * 16;
    }
    if (warmRef.current) {
      warmRef.current.intensity = 0.05 + Math.max(0, Math.sin(t * 0.54 + 1.6)) * 0.06 + clap * 0.06 + kick * 0.045;
      warmRef.current.position.y = 18 + Math.sin(t * 0.28) * 4;
    }
    if (magentaRef.current) {
      magentaRef.current.intensity = 0.035 + Math.max(0, Math.sin(t * 0.95 + 0.8)) * 0.08 + clap * 0.105 + twitch * 0.06;
      magentaRef.current.color.set('#ff006a').lerp(BREATH_MAGENTA, redSwing);
      magentaRef.current.position.x = -18 + Math.sin(t * 0.48 + 1.7) * 22;
      magentaRef.current.position.z = 62 + Math.cos(t * 0.42 + 0.4) * 14;
    }
    if (hazeRef.current) {
      hazeRef.current.intensity = 0.042 + slow * 0.024 + clap * 0.01;
    }
  });

  return (
    <>
      <pointLight ref={redRef} position={[30, 16, 44]} intensity={0.24} distance={180} decay={1.35} color="#ff170d" />
      <pointLight ref={warmRef} position={[-38, 18, 28]} intensity={0.08} distance={150} decay={1.45} color="#ffc2a0" />
      <pointLight ref={magentaRef} position={[-18, 13, 62]} intensity={0.08} distance={165} decay={1.45} color="#ff006a" />
      <hemisphereLight ref={hazeRef} skyColor="#3a0c0c" groundColor="#100000" intensity={0.065} />
    </>
  );
}

function CanvasReadySignal({ onReady }) {
  const framesRef = React.useRef(0);

  useFrame(() => {
    if (framesRef.current >= 6) return;
    framesRef.current += 1;
    if (framesRef.current === 6) onReady?.();
  });

  return null;
}


export default function Scene({ isMobilePerformance, onModelReady, onCanvasReady, onError, introReady, hasStarted }) {
  return (
      <Canvas
        dpr={isMobilePerformance ? [0.75, 1] : [1, 1.6]}
        camera={{ fov: 40, near: 0.5, far: 500 }}
        gl={{
          antialias: !isMobilePerformance,
          alpha: false,
          powerPreference: isMobilePerformance ? 'low-power' : 'high-performance'
        }}
        onCreated={({ camera, gl }) => {
          camera.position.set(62, 14, 62);
          gl.setClearColor('#000000', 1);
          gl.domElement.addEventListener('webglcontextlost', () => {
            onError('webgl-context-lost');
          }, { once: true });
        }}
      >
        <ErrorBoundary fallback={<group />} onError={() => onError('scene-error')}>
          <Suspense fallback={null}>
            <ExteriorModel isMobilePerformance={isMobilePerformance} onReady={onModelReady} rotation={[0, Math.PI * 0.58, 0]} position={[0, -8, 0]} />
          </Suspense>
        </ErrorBoundary>
        <CanvasReadySignal onReady={onCanvasReady} />
        <SceneBreathingLights isMobilePerformance={isMobilePerformance} />
        {/* Classic neutral lights */}
        <directionalLight position={[3, 5, 4]} intensity={0.28} color="#ffd4c5" />
        <directionalLight position={[-6, 3, -2]} intensity={0.05} color="#ff5b4a" />
        <hemisphereLight skyColor="#2a0808" groundColor="#110000" intensity={0.145} />
        <CameraGlintLight isMobilePerformance={isMobilePerformance} />
        <ResponsiveCameraControls introReady={introReady} hasStarted={hasStarted} />
      </Canvas>
  );
}

import React, { Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Preload, useTexture, Decal } from '@react-three/drei';

import CanvasLoader from '../Loader';

const canvasSupported = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('webgl2'))
    );
  } catch (e) {
    return false;
  }
};

const Ball = (props) => {
  const [decal] = useTexture([props.imgUrl]);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Apply a small continuous rotation for subtle motion
  const ref = React.useRef();
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.25;
  });
  // Use a minimal unlit material on mobile to avoid shader compilation issues.
  if (isMobile) {
    return (
      <Float speed={1.75} rotationIntensity={1} floatIntensity={2}>
        <mesh ref={ref} scale={2.0}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#fff8eb" metalness={0.3} roughness={0.4} />
          <Decal position={[0, 0, 1]} rotation={[2 * Math.PI, 0, 6.25]} scale={0.9} map={decal} />
        </mesh>
      </Float>
    );
  }

  // Desktop: standard material with decal for higher-quality appearance.
  return (
    <Float speed={1.75} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={ref} scale={2.75} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#fff8eb" polygonOffset polygonOffsetFactor={-5} flatShading />
        <Decal
          position={[0, 0, 1]}
          rotation={[2 * Math.PI, 0, 6.25]}
          scale={1}
          map={decal}
          flatShading
        />
      </mesh>
    </Float>
  );
};

const BallCanvas = ({ icon }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [webglSupported, setWebglSupported] = useState(true);
  const [optimizedIcon, setOptimizedIcon] = useState(null);
  useEffect(() => {
    setWebglSupported(canvasSupported());
  }, []);

  useEffect(() => {
    // If the build contains an optimized public icon, prefer it at runtime.
    // We expect optimised icons to be written to `public/tech-compressed/<basename>`.
    let cancelled = false;
    async function checkOptimized() {
      try {
        const base = (icon || '').split('/').pop();
        if (!base) return;
        const candidate = `/tech-compressed/${base}`;
        const res = await fetch(candidate, { method: 'HEAD' });
        if (!cancelled && res.ok) setOptimizedIcon(candidate);
      } catch (e) {
        // no-op: optimized icon not available
      }
    }
    checkOptimized();
    return () => {
      cancelled = true;
    };
  }, [icon]);

  if (!webglSupported) {
    return (
      <div className="w-32 h-32 flex items-center justify-center bg-black rounded-full">
        <img
          src={optimizedIcon || icon}
          alt="tech icon"
          className="w-20 h-20 object-contain"
        />
      </div>
    );
  }
  // WebGPU path removed: prefer the WebGL path with safe fallbacks for mobile devices.
  return (
    <Canvas
      frameloop="demand"
      dpr={isMobile ? [1, 1] : [1, 2]}
      gl={{
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
        antialias: !isMobile,
        alpha: true,
      }}
    >
      {/* Add low-cost lighting so `meshStandardMaterial` renders correctly on mobile */}
      <ambientLight intensity={0.6} />
      <pointLight intensity={0.6} position={[10, 10, 10]} />

      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls enableZoom={false} />
        <Ball imgUrl={optimizedIcon || icon} />
      </Suspense>

      {!isMobile && <Preload all />}
    </Canvas>
  );
};

export default BallCanvas;

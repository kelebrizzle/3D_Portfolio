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
  useEffect(() => {
    setWebglSupported(canvasSupported());
  }, []);

  // Always use the provided `icon` path at runtime; do not attempt to prefer
  // any compressed/optimized copy.

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
      dpr={isMobile ? 1 : [1, 1.5]}
      onCreated={({ gl }) => {
        try {
          gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5));
        } catch (e) {}
      }}
      gl={{
        preserveDrawingBuffer: false,
        powerPreference: isMobile ? 'low-power' : 'high-performance',
        antialias: !isMobile,
        alpha: true,
      }}
    >
      {/* Add low-cost lighting so `meshStandardMaterial` renders correctly on mobile */}
      <ambientLight intensity={0.6} />
      <pointLight intensity={0.6} position={[10, 10, 10]} />

      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls enableZoom={false} />
        <Ball imgUrl={icon} />
      </Suspense>

      {!isMobile && <Preload all />}
    </Canvas>
  );
};

export default BallCanvas;

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload, useGLTF } from '@react-three/drei';

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

const Computers = ({ isMobile }) => {
  // Load glTF model unconditionally to satisfy React hooks rules.
  const computer = useGLTF('./desktop_pc/scene.gltf');

  if (!isMobile) {
    return (
      <mesh>
        <hemisphereLight intensity={0.15} groundColor="black" />
        <spotLight
          position={[-20, 50, 10]}
          angle={0.12}
          penumbra={1}
          intensity={1}
          castShadow
          shadow-mapSize={1024}
        />
        <pointLight intensity={1} />
        <primitive
          object={computer.scene}
          scale={0.75}
          position={[0, -3.75, -1.5]}
          rotation={[-0.01, -0.2, -0.1]}
        />
      </mesh>
    );
  }

  // Mobile: render a lightweight placeholder using basic materials.
  return (
    <mesh>
      <hemisphereLight intensity={0.3} groundColor="black" />
      <pointLight intensity={0.8} />

      <group position={[0, -1.5, -1.8]}>
        <mesh scale={[2.2, 1.4, 0.2]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#0f1724" />
        </mesh>
        {/* Screen panel */}
        <mesh position={[0, 0, 0.12]} scale={[1.8, 0.9, 0.01]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#0b1020" />
        </mesh>
      </group>
    </mesh>
  );
};

const ComputersCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    // Check WebGL support
    setWebglSupported(canvasSupported());

    // Add a listener for changes to the screen size
    const mediaQuery = window.matchMedia('(max-width: 500px)');

    // Set the initial value of the `isMobile` state variable
    setIsMobile(mediaQuery.matches);

    // Define a callback function to handle changes to the media query
    const handleMediaQueryChange = (event) => {
      setIsMobile(event.matches);
    };

    // Add the callback function as a listener for changes to the media query
    mediaQuery.addEventListener('change', handleMediaQueryChange);

    // Remove the listener when the component is unmounted
    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <img
          src="./desktop_pc/scene.png"
          alt="3D Desktop"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  // WebGPU renderer removed: use WebGL with safe fallbacks for low-end devices.

  return (
    <Canvas
      frameloop="demand"
      shadows={!isMobile}
      dpr={isMobile ? [1, 1] : [1, 2]}
      camera={{ position: [20, 3, 5], fov: 25 }}
      gl={{
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
        antialias: !isMobile,
        alpha: true,
      }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />
        <Computers isMobile={isMobile} />
      </Suspense>

      <Preload all />
    </Canvas>
  );
};

export default ComputersCanvas;

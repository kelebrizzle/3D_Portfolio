import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Preload, useGLTF } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

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

const Computers = ({ isMobile, dracoModel = null }) => {
  // Load the original GLTF model unconditionally to satisfy hooks rule.
  const original = useGLTF('./desktop_pc/scene.gltf');

  // Prefer the Draco model if it was loaded asynchronously and passed down
  // (dracoModel is loaded in the parent via a non-hook loader).
  const computer = dracoModel && dracoModel.scene ? dracoModel : original;

  // Use the same glTF model for desktop and mobile, adjusting scale and
  // lighting so mobile devices render with good visual quality but without
  // expensive shadows.
  return (
    <mesh>
      <hemisphereLight intensity={isMobile ? 0.35 : 0.15} groundColor="black" />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.12}
        penumbra={1}
        intensity={isMobile ? 0.8 : 1}
        castShadow={!isMobile}
        shadow-mapSize={1024}
      />
      <pointLight intensity={isMobile ? 0.6 : 1} />

      <primitive
        object={computer.scene}
        scale={isMobile ? 0.6 : 0.75}
        position={isMobile ? [0, -2.5, -1] : [0, -3.75, -1.5]}
        rotation={[-0.01, -0.2, -0.1]}
        castShadow={!isMobile}
        receiveShadow={!isMobile}
      />
    </mesh>
  );
};

const ComputersCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [dracoModel, setDracoModel] = useState(null);

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

  useEffect(() => {
    // Check if a Draco-compressed GLB exists and load it (async) to improve
    // mobile load size. We keep the original `useGLTF` load for safety.
    let cancelled = false;
    const dracoUrl = '/desktop_pc/scene_draco.glb';
    const loader = new GLTFLoader();

    async function tryLoadDraco() {
      try {
        const head = await fetch(dracoUrl, { method: 'HEAD' });
        if (!head.ok) return;
        const gltf = await loader.loadAsync(dracoUrl);
        if (cancelled) return;
        setDracoModel(gltf);
      } catch (e) {
        // No-op: draco asset not present or failed to load.
      }
    }

    tryLoadDraco();
    return () => {
      cancelled = true;
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
          {/* Pass dracoModel if available, else `Computers` will use the original glTF */}
          <Computers isMobile={isMobile} dracoModel={dracoModel} />
        </Suspense>

      <Preload all />
    </Canvas>
  );
};

export default ComputersCanvas;

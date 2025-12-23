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

const Computers = ({ isMobile }) => {
  // Load the original GLTF model.
  const computer = useGLTF('./desktop_pc/scene.gltf');

  // Synchronously sanitize geometries to avoid NaN values that cause
  // three.js to compute NaN bounding spheres. Doing this synchronously
  // (rather than in an effect) reduces the chance computeBoundingSphere
  // is called before we fix invalid values.
  if (computer && computer.scene) {
    try {
      computer.scene.traverse((child) => {
        if (!child.isMesh || !child.geometry) return;

        const geom = child.geometry;
        const sanitizeAttr = (attr) => {
          if (!attr || !attr.array) return false;
          const a = attr.array;
          let found = false;
          for (let i = 0; i < a.length; i++) {
            const v = a[i];
            if (!Number.isFinite(v)) {
              a[i] = 0;
              found = true;
            }
          }
          if (found) attr.needsUpdate = true;
          return found;
        };

        const p = geom.attributes && geom.attributes.position;
        const n = geom.attributes && geom.attributes.normal;
        const hadNaNPos = sanitizeAttr(p);
        const hadNaNNormal = sanitizeAttr(n);
        if (hadNaNPos || hadNaNNormal) {
          try {
            geom.computeBoundingBox && geom.computeBoundingBox();
            geom.computeBoundingSphere && geom.computeBoundingSphere();
          } catch (e) {
            // ignore compute errors
          }
        }
      });
    } catch (e) {
      // no-op
    }
  }

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

  // No compressed-model loading: always use the original glTF for consistency.

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
      dpr={isMobile ? 1 : [1, 1.5]}
      camera={{ position: [20, 3, 5], fov: 25 }}
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
        <Suspense fallback={<CanvasLoader />}>
          <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />
          {/* Pass dracoModel if available, else `Computers` will use the original glTF */}
          <Computers isMobile={isMobile} dracoModel={dracoModel} />
        </Suspense>

      {!isMobile && <Preload all />}
    </Canvas>
  );
};

export default ComputersCanvas;

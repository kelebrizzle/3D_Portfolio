import React, { Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Preload, useTexture } from '@react-three/drei';
import * as THREE from 'three';

import CanvasLoader from '../Loader';
import { vertexShaderGLSL, fragmentShaderGLSL } from '../../shaders/cheapShader';

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

  // Shader uniforms
  const uniforms = {
    uColor: { value: new THREE.Color('#fff8eb') },
    uTexture: { value: decal || new THREE.Texture() },
    uUseTexture: { value: decal ? 1.0 : 0.0 },
  };

  // Apply a small continuous rotation for subtle motion
  const ref = React.useRef();
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.25;
  });

  return (
    <Float speed={1.75} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={ref} scale={2.0}>
        <icosahedronGeometry args={[1, 0]} />
        <shaderMaterial
          vertexShader={vertexShaderGLSL}
          fragmentShader={fragmentShaderGLSL}
          uniforms={uniforms}
          glslVersion={THREE.GLSL3}
        />
      </mesh>
    </Float>
  );
};

const BallCanvas = ({ icon }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [webglSupported, setWebglSupported] = useState(true);
  const supportsWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu;

  useEffect(() => {
    setWebglSupported(canvasSupported());
  }, []);

  if (!webglSupported) {
    return (
      <div className="w-32 h-32 flex items-center justify-center bg-black rounded-full">
        <img src={icon} alt="tech icon" className="w-20 h-20 object-contain" />
      </div>
    );
  }
  // If WebGPU is supported, attempt to use the WebGPU renderer as a higher-performance path.
  // Failure to load the WebGPU module falls back to the WebGL renderer.
  if (supportsWebGPU) {
    try {
      const BallWebGPU = require('../../webgpu/BallWebGPU.jsx').default;
      return <BallWebGPU />;
    } catch (e) {
      // Proceed with the WebGL renderer on failure.
    }
  }
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
      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls enableZoom={false} />
        <Ball imgUrl={icon} />
      </Suspense>

      {!isMobile && <Preload all />}
    </Canvas>
  );
};

export default BallCanvas;

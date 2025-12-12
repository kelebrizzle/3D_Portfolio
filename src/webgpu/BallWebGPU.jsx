import React, { useEffect, useRef } from 'react';

// Minimal WebGPU renderer that renders a sphere-like shading on a full-screen quad.
// The implementation uses a compact WGSL fragment shader optimized for low-resource devices.

const vertexWGSL = `@vertex
fn main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
  var pos = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0)
  );
  let p = pos[VertexIndex];
  return vec4<f32>(p, 0.0, 1.0);
}`;

const fragmentWGSL = `@fragment
fn main(@builtin(position) FragCoord: vec4<f32>) -> @location(0) vec4<f32> {
  // normalize coordinates to [-1,1]
  let uv = FragCoord.xy / vec2<f32>(canvasWidth, canvasHeight) * 2.0 - vec2<f32>(1.0, 1.0);
  // preserve aspect ratio by using y scaled by canvasWidth/canvasHeight in JS (we will pass pre-adjusted)
  let p = uv;
  let r = length(p);
  if (r > 1.0) {
    return vec4<f32>(0.04, 0.06, 0.1, 0.0);
  }
  // compute simple lambert-like shading using sphere normal
  let z = sqrt(max(0.0, 1.0 - r * r));
  let normal = normalize(vec3<f32>(p.x, p.y, z));
  let lightDir = normalize(vec3<f32>(0.3, 0.5, 0.8));
  let diff = max(dot(normal, lightDir), 0.0);
  let base = vec3<f32>(1.0, 0.97, 0.92);
  let color = base * (0.25 + diff * 0.75);
  return vec4<f32>(color, 1.0);
}`;

// The WGSL shader requires canvas dimensions; these are injected into the shader code at runtime.

const BallWebGPU = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!navigator.gpu) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'low-power' });
      if (!adapter) return;
      const device = await adapter.requestDevice();
      const context = canvas.getContext('webgpu');

      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: 'premultiplied' });

      const resize = () => {
        const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 1));
        canvas.width = Math.floor(canvas.clientWidth * dpr);
        canvas.height = Math.floor(canvas.clientHeight * dpr);
      };

      resize();
      window.addEventListener('resize', resize);

      const vertModule = device.createShaderModule({ code: vertexWGSL });
      // inject canvas size into fragment WGSL
      const fragCode = fragmentWGSL
        .replace(/canvasWidth/g, String(canvas.width))
        .replace(/canvasHeight/g, String(canvas.height));
      const fragModule = device.createShaderModule({ code: fragCode });

      const pipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: { module: vertModule, entryPoint: 'main' },
        fragment: { module: fragModule, entryPoint: 'main', targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      });

      const render = () => {
        if (cancelled) return;
        const commandEncoder = device.createCommandEncoder();
        const textureView = context.getCurrentTexture().createView();
        const renderPass = commandEncoder.beginRenderPass({
          colorAttachments: [
            {
              view: textureView,
              loadOp: 'clear',
              storeOp: 'store',
              clearValue: { r: 0.02, g: 0.03, b: 0.06, a: 1 },
            },
          ],
        });
        renderPass.setPipeline(pipeline);
        renderPass.draw(6, 1, 0, 0);
        renderPass.end();
        device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(render);
      };

      render();

      return () => {
        cancelled = true;
        window.removeEventListener('resize', resize);
      };
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-32 h-32 rounded-full"
      style={{ width: '8rem', height: '8rem' }}
    />
  );
};

export default BallWebGPU;

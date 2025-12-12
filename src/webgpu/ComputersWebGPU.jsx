import React, { useEffect, useRef } from 'react';

// Minimal WebGPU renderer for a placeholder computer panel. The fragment shader
// produces a compact gradient and sheen effect and is optimized for efficiency.

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
  let uv = FragCoord.xy / vec2<f32>(canvasWidth, canvasHeight);
  // center a panel
  let center = vec2<f32>(0.5, 0.45);
  let p = (uv - center) * vec2<f32>(canvasWidth / canvasHeight, 1.0);
  let inside = smoothstep(0.9, 0.88, length(p));
  let panel = mix(vec3<f32>(0.05, 0.07, 0.12), vec3<f32>(0.08, 0.10, 0.18), uv.y);
  let sheen = pow(max(dot(normalize(vec3<f32>(p, 0.1)), normalize(vec3<f32>(0.0, 0.6, 0.8))), 0.0), 8.0);
  let color = mix(vec3<f32>(0.02, 0.025, 0.04), panel, inside) + sheen * 0.06;
  return vec4<f32>(color, 1.0);
}`;

const ComputersWebGPU = () => {
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
    <canvas ref={canvasRef} className="w-full h-48" style={{ width: '100%', height: '12rem' }} />
  );
};

export default ComputersWebGPU;

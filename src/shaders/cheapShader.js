// Lightweight GLSL shader module for low-cost fragment shading.
// Exports a small vertex shader and a compact fragment shader suitable for
// resource-constrained devices. The fragment shader implements a simple
// normal-based lighting term and supports optional texture blending.

export const vertexShaderGLSL = `
precision mediump float;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fragmentShaderGLSL = `
precision mediump float;
uniform vec3 uColor;
uniform sampler2D uTexture;
uniform float uUseTexture; // 0.0 = no, 1.0 = yes
varying vec3 vNormal;
varying vec2 vUv;

void main() {
  // cheap directional-like term from normal
  float l = dot(normalize(vNormal), normalize(vec3(0.0, 0.8, 0.6)));
  float light = clamp(l * 0.5 + 0.5, 0.25, 1.0);

  vec3 base = uColor;

  // subtle vertical gradient to add depth
  base = mix(base, vec3(1.0), vUv.y * 0.12);

  vec3 color = base * light;

  if (uUseTexture > 0.5) {
    vec4 t = texture2D(uTexture, vUv);
    // blend texture over base color, use texture alpha
    color = mix(color, t.rgb, t.a);
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

// WGSL placeholders are included for reference. A production WebGPU path
// requires conversion of these shaders and integration with a WebGPU render pipeline.
export const fragmentShaderWGSL = `// WGSL shader placeholder - implement for WebGPU pipeline`;

export const vertexShaderWGSL = `// WGSL vertex placeholder`;

export default {
  vertexShaderGLSL,
  fragmentShaderGLSL,
  vertexShaderWGSL,
  fragmentShaderWGSL,
};

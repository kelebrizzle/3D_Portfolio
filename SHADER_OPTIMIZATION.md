# Low-GPU 3D Rendering with Cheap Shaders + WebGPU Fallbacks

## Overview

This project now includes **lightweight 3D rendering** optimized for low-end mobile devices, with runtime selection between:

- **WebGL** (with cheap GLSL shaders on mobile, full models on desktop)
- **WebGPU** (minimal WGSL quad shaders when available)
- **Static fallbacks** (images/icons if WebGL unavailable)

## Files Added

### Shader Module

- **`src/shaders/cheapShader.js`** — Exports cheap GLSL vertex/fragment shaders
  - Uses `precision mediump float` for mobile compatibility
  - Simple normal-based lighting (no shadow maps, no complex effects)
  - Optional texture sampling (for texture decals)
  - Designed for sub-millisecond performance on low-end GPUs

### WebGPU Components (optional, auto-selected if available)

- **`src/webgpu/BallWebGPU.jsx`** — WGSL sphere renderer
  - Draws a lit sphere-like quad using procedural math
  - No texture sampling (kept intentionally minimal)
  - Lightweight and fast on devices with WebGPU support

- **`src/webgpu/ComputersWebGPU.jsx`** — WGSL panel/computer renderer
  - Draws a stylized panel representing the desktop computer
  - Procedural gradient + simple sheen effect
  - Minimal geometry, no model loading

## Updated Components

### `src/components/canvas/Ball.jsx`

**Desktop:** Uses `meshStandardMaterial` with texture decal
**Mobile:** Uses cheap GLSL `shaderMaterial` (no decal, simplified lighting)
**Fallback:** Icon image in circular div if WebGL unavailable
**WebGPU:** Auto-selects `BallWebGPU.jsx` if `navigator.gpu` available

```javascript
const supportsWebGPU = typeof navigator !== 'undefined' && !!navigator.gpu;
if (supportsWebGPU) {
  const BallWebGPU = require('../../webgpu/BallWebGPU.jsx').default;
  return <BallWebGPU />;
}
// Falls back to WebGL shaders below
```

### `src/components/canvas/Computers.jsx`

**Desktop:** Full glTF model with advanced lighting and shadows
**Mobile:** Cheap GLSL shader-driven box (no glTF loading)
**Fallback:** Static PNG image if WebGL unavailable
**WebGPU:** Auto-selects `ComputersWebGPU.jsx` if `navigator.gpu` available

## Rendering Strategy by Device

| Device Type     | Backend       | Shader               | Performance                     |
| --------------- | ------------- | -------------------- | ------------------------------- |
| Desktop (WebGL) | Three.js      | Standard/Advanced    | Full quality, shadows, textures |
| Mobile (WebGL)  | Three.js      | Cheap GLSL (mediump) | 60 FPS on low-end phones        |
| WebGPU Capable  | Native WebGPU | Minimal WGSL         | Ultra-lightweight, if available |
| No WebGL/GPU    | None          | —                    | Static image fallback           |

## Performance Optimizations

### GLSL Shader (Mobile)

- **Precision:** `mediump float` (16-bit, faster on mobile)
- **Lighting:** Single directional term (no per-light loops)
- **No shadows:** Expensive shadow maps disabled

# Low-GPU 3D Rendering with Compact Shaders and WebGPU Fallbacks

## Overview

This repository includes a lightweight rendering strategy that adapts to device capabilities:

- WebGL: full models on desktop; compact GLSL shaders on mobile.
- WebGPU: minimal WGSL renderers when available.
- Static fallbacks: image or icon placeholders when GPU support is absent.

## Files Added

### Shader Module

- `src/shaders/cheapShader.js` — Compact GLSL vertex and fragment shaders
  - Uses `precision mediump float` for mobile compatibility.
  - Implements a simple normal-based lighting term without shadow maps.
  - Supports optional texture blending for decals.

### WebGPU Components (optional)

- `src/webgpu/BallWebGPU.jsx` — WGSL shader rendering a lit sphere approximation.
- `src/webgpu/ComputersWebGPU.jsx` — WGSL shader rendering a stylized panel.

## Updated Components

### `src/components/canvas/Ball.jsx`

- Desktop: standard materials with optional decal textures.
- Mobile: compact GLSL `shaderMaterial` with reduced shading cost.
- Fallback: icon image when WebGL is not available.
- WebGPU: the WebGPU renderer is selected when `navigator.gpu` is present.

### `src/components/canvas/Computers.jsx`

- Desktop: full glTF model with standard lighting.
- Mobile: simplified geometry with compact GLSL shader material.
- Fallback: static PNG image when WebGL is not available.

## Rendering Strategy by Device

| Device Type     | Backend  | Shader             | Notes                            |
| --------------- | -------- | ------------------ | -------------------------------- |
| Desktop (WebGL) | Three.js | Standard materials | Full quality rendering           |
| Mobile (WebGL)  | Three.js | Compact GLSL       | Lower geometry and costs         |
| WebGPU Capable  | WebGPU   | Minimal WGSL       | Lightweight procedural rendering |
| No GPU Support  | None     | —                  | Static fallback imagery          |

## Performance Optimizations

**GLSL shader (mobile)**

- `mediump` precision to reduce arithmetic cost.
- Single directional lighting term; no shadow maps.
- Minimal geometry (icosahedron, zero subdivisions).

**WebGPU (procedural)**

- No runtime model loading; shaders render procedural geometry.
- Avoids texture sampling to reduce memory bandwidth.

## Testing & Verification

The project builds successfully with the current configuration. To test locally:

```bash
npm run dev    # start development server
npm run build  # production build
npm run preview
```

For mobile simulation use DevTools device toolbar and reduce DPR as required.

## Future Work

- Add texture sampling to WGSL renderers when needed.
- Implement LOD switching based on frame time.
- Consider three.js WebGPU renderer for feature parity where appropriate.

## Troubleshooting

- If 3D content does not appear, check the browser console for shader compilation errors.
- Confirm that WebGL is enabled in the browser and that `navigator.gpu` is available for WebGPU.

## File Structure

```
src/
├── components/
│   └── canvas/
│       ├── Ball.jsx
│       └── Computers.jsx
├── shaders/
│   └── cheapShader.js
└── webgpu/
    ├── BallWebGPU.jsx
    └── ComputersWebGPU.jsx
```

---

Last updated: December 2025

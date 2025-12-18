#!/usr/bin/env node
/*
  Helper script to optimize glTF assets using glTF-Transform CLI.
  This script expects `@gltf-transform/cli` to be installed (locally or via npx).

  Usage:
    npm run optimize:gltf

  What it does:
  - Compresses the main `public/desktop_pc/scene.gltf` into a Draco-compressed GLB
  - Optionally converts textures to KTX2 (Basis) for GPU-friendly compressed textures

  Note: Actual optimization requires installing the CLI tools:
    npm install --save-dev @gltf-transform/cli @gltf-transform/core @gltf-transform/extensions

  The script uses `npx` so it will work without permanent installs but installing
  the packages into devDependencies gives repeatable results.
*/

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const inputGltf = join(root, 'public', 'desktop_pc', 'scene.gltf');
const outputGlb = join(root, 'public', 'desktop_pc', 'scene.draco.glb');
const outputKtxGlb = join(root, 'public', 'desktop_pc', 'scene.draco.ktx2.glb');

if (!existsSync(inputGltf)) {
  console.error('Input glTF not found:', inputGltf);
  process.exit(1);
}

console.log('Compressing glTF with Draco (requires @gltf-transform/cli)...');
try {
  // 1) Convert to GLB and apply DRACO compression
  // Using npx so the tool can be used without prior install
  execSync(
    `npx @gltf-transform/cli draco "${inputGltf}" "${outputGlb}" --quantize-position=14 --quantize-normal=10 --quantize-texcoord=12`,
    { stdio: 'inherit' }
  );

  // 2) Optionally transcode textures to KTX2 (Basis) for GPU-friendly compressed textures
  if (existsSync(outputGlb)) {
    console.log('Converting textures to KTX2 (Basis) for better runtime performance...');
    execSync(
      `npx @gltf-transform/cli ktx2 "${outputGlb}" "${outputKtxGlb}" --quality=50`,
      { stdio: 'inherit' }
    );

    console.log('Optimization complete. Outputs:');
    console.log(' -', outputGlb);
    console.log(' -', outputKtxGlb);
  } else {
    console.warn('Draco output not found; skipping KTX2 conversion. Check previous step output.');
  }
} catch (e) {
  console.error('Optimization failed. Ensure @gltf-transform/cli is available (npm i -D @gltf-transform/cli).');
  console.error(e.message);
  process.exit(1);
}

console.log('Done. Consider replacing original scene.gltf with the optimized .glb or serving the optimized glb from your app.');

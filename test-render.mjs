#!/usr/bin/env node
// Build-only verification script.
// The previous shader/WebGPU checks were removed when shaders/WebGPU were
// removed from the runtime. This script performs a production build and
// exits non-zero if the build fails.

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runBuild() {
  console.log('Running production build...');
  try {
    const { stdout, stderr } = await execAsync('npm run build', { cwd: '/home/kelechukwu/Desktop/project_3D_developer_portfolio', timeout: 120000 });
    console.log('Build finished.');
    if (stderr && stderr.toLowerCase().includes('error')) {
      console.error('Build reported errors:', stderr);
      process.exit(1);
    }
    process.exit(0);
  } catch (e) {
    console.error('Build failed:', e.message);
    process.exit(1);
  }
}

runBuild();

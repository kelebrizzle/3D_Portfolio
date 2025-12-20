import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const inDir = path.join(process.cwd(), 'public', 'desktop_pc', 'textures');
const outPngDir = path.join(process.cwd(), 'public', 'desktop_pc', 'textures-compressed');
const outWebpDir = path.join(process.cwd(), 'public', 'desktop_pc', 'textures-webp');
const outAvifDir = path.join(process.cwd(), 'public', 'desktop_pc', 'textures-avif');

for (const d of [outPngDir, outWebpDir, outAvifDir]) {
  fs.mkdirSync(d, { recursive: true });
}

async function run() {
  try {
    const all = fs.readdirSync(inDir).filter((f) => /\.(png|jpe?g)$/i.test(f));
    for (const file of all) {
      const input = path.join(inDir, file);
      const name = path.parse(file).name;

      // PNG: strong compression while preserving alpha
      await sharp(input).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(path.join(outPngDir, file));

      // WebP: lossy with alpha support
      await sharp(input).webp({ quality: 80 }).toFile(path.join(outWebpDir, `${name}.webp`));

      // AVIF: high compression; quality tuned to balance size/quality
      await sharp(input).avif({ quality: 50 }).toFile(path.join(outAvifDir, `${name}.avif`));

      console.log('Optimized:', file);
    }
    console.log('Image optimization complete.');
    process.exit(0);
  } catch (err) {
    console.error('Image optimization failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

run();
// script ends

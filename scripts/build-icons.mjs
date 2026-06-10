// Render src/icons/icon.svg into PNGs at the sizes Chrome MV3 expects.
// Run: npm run icons

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "src/icons/icon.svg");
const OUT_DIR = resolve(ROOT, "src/icons");
const SIZES = [16, 32, 48, 128];

await mkdir(OUT_DIR, { recursive: true });
const svg = await readFile(SRC);

for (const size of SIZES) {
  const out = resolve(OUT_DIR, `icon-${size}.png`);
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`✓ ${out}`);
}

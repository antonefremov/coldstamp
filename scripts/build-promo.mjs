// Render src/icons/promo-tile.svg into the Chrome Web Store small promo tile
// (440×280 PNG). Output is written into docs/store-assets/ which is gitignored.
// Run: npm run promo-tile

import { readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SRC = resolve(ROOT, "src/icons/promo-tile.svg");
const OUT_DIR = resolve(ROOT, "docs/store-assets");
const OUT = resolve(OUT_DIR, "promo-tile-440x280.png");

await mkdir(OUT_DIR, { recursive: true });
const svg = await readFile(SRC);

await sharp(svg, { density: 384 })
  .resize(440, 280, { fit: "contain" })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`✓ ${OUT}`);

// Produce a single deterministic SHA-256 of the entire dist/ tree.
// Order-independent across filesystems: paths are sorted before hashing.
//
//   npm run verify         (assumes dist/ already built)
//   npm run build && npm run verify   (full reproducible check)
//
// The output of this script is what CI publishes alongside each release.
// A user can match this against a freshly-built tree to confirm the
// extension binary corresponds to this source.

import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else if (e.isFile()) files.push(full);
  }
  return files;
}

try {
  await stat(DIST);
} catch {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

const files = (await walk(DIST))
  // Normalise path separators so the hash matches across OSes.
  .map((f) => ({ path: relative(DIST, f).split(sep).join("/"), abs: f }))
  .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

const tree = createHash("sha256");
for (const f of files) {
  const contents = await readFile(f.abs);
  const fileHash = createHash("sha256").update(contents).digest("hex");
  tree.update(`${f.path}\0${fileHash}\n`);
}

const digest = tree.digest("hex");
console.log(digest);

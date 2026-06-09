import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import { resolve } from "node:path";
import manifest from "./src/manifest.json" with { type: "json" };

export default defineConfig({
  plugins: [crx({ manifest: manifest as any })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        onboarding: resolve(__dirname, "src/onboarding/index.html"),
      },
    },
  },
  server: { port: 5173 },
});

import { defineConfig } from "vite";

// Tiny static server for the fake checkout fixture.
// Run with: npm run fixture
export default defineConfig({
  root: "fixtures/fake-checkout",
  server: { port: 5174, strictPort: true },
});

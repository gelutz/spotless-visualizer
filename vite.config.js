import { defineConfig } from "vite";

// The site is served from https://gelutz.github.io/spotless-visualizer/, a repo
// subpath. Without this every asset URL resolves against the domain root and 404s.
export default defineConfig({
  base: "/spotless-visualizer/",
  build: { outDir: "dist" }
});

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/viewer",
  plugins: [react()],
  build: {
    outDir: "../../dist/viewer",
    emptyOutDir: true,
    // elkjs alone is ~1.5 MB. The viewer is served from localhost, so bundle size doesn't matter.
    chunkSizeWarningLimit: 2500,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
  optimizeDeps: {
    include: ["react-is"],
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.source === 'react-is') return;
        warn(warning);
      },
      external: [],
    },
    chunkSizeWarningLimit: 2000,
  },
  resolve: {
    alias: {},
  },
});

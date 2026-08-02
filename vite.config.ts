import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "supabase",
              test: /node_modules\/@supabase\//,
            },
            {
              name: "react-vendor",
              test: /node_modules\/react\/|node_modules\/react-dom\/|node_modules\/@tanstack\//,
            },
          ],
        },
      },
    },
  },
});
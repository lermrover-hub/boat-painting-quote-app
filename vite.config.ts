import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/boat-painting-quote-app/",
  plugins: [react()],
  build: {
    sourcemap: true
  }
});

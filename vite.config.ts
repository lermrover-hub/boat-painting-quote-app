import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/boat-paintquoat-app/",
  plugins: [react()],
  build: {
    sourcemap: true
  }
});

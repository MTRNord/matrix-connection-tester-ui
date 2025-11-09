import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
export default defineConfig({
  plugins: [
    fresh(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
      sass: {
        quietDeps: true,
      },
    },
  },
});

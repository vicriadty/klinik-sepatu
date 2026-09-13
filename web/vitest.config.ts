import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { svgrReactComponent } from "./vite.svgr";

export default defineConfig({
  plugins: [react(), svgrReactComponent()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});

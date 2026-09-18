import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

// The favicon is sourced from packages/brand and only exists once the
// official icon has been added there; there is deliberately no fallback glyph.
function brandFavicon(): Plugin {
  const icon = resolve(import.meta.dirname, "../../packages/brand/assets/tamva-icon.svg");
  return {
    name: "tamva-brand-favicon",
    transformIndexHtml() {
      return existsSync(icon)
        ? [{ tag: "link", attrs: { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }, injectTo: "head" }]
        : [];
    },
    configureServer(server) {
      server.middlewares.use("/favicon.svg", (_req, res, next) => {
        if (!existsSync(icon)) return next();
        res.setHeader("Content-Type", "image/svg+xml");
        res.end(readFileSync(icon));
      });
    },
    generateBundle() {
      if (existsSync(icon)) {
        this.emitFile({ type: "asset", fileName: "favicon.svg", source: readFileSync(icon) });
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backend = env.VITE_API_PROXY_TARGET || "http://localhost:8000";

  return {
    plugins: [react(), tailwindcss(), brandFavicon()],
    server: {
      host: "0.0.0.0",
      port: 3000,
      proxy: {
        "/api": backend,
        "/health": backend,
      },
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
  };
});

// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { loadEnv } from "vite";
import { defineConfig as defineTanstackConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

const isVercel = Boolean(process.env.VERCEL);

export default defineTanstackConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "");
  const platformUrl = (env.VITE_PLATFORM_URL || "http://localhost:3000").replace(/\/$/, "");

  return {
    cloudflare: isVercel ? false : undefined,
    plugins: isVercel ? [nitro()] : [],
    tanstackStart: {
      server: { entry: "server" },
    },
    vite: {
      // Block parent Hi-Tech-school-system/postcss.config.mjs (Tailwind v3) from processing this app.
      // Tailwind v4 is handled solely by @tailwindcss/vite via @import "tailwindcss" in styles.css.
      css: {
        postcss: {
          plugins: [],
        },
      },
      server: {
        port: 8080,
        strictPort: false,
        proxy: {
          "/schools": { target: platformUrl, changeOrigin: true },
          "/api": { target: platformUrl, changeOrigin: true },
        },
      },
    },
  };
});

import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    remix({ future: { v3_fetcherPersist: true } }),
  ],
  ssr: {
    external: ["@gftdcojp/performer-observability"],
  },
});



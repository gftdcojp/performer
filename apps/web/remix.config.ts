import type { AppConfig } from "@remix-run/dev";

export default {
  future: {
    v3_fetcherPersist: true,
  },
  vite: {
    build: {
      rollupOptions: {
        external: [
          /@gftdcojp\/performer-observability/,
        ],
      },
    },
  },
} satisfies AppConfig;



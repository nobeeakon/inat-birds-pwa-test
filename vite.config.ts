import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import {
  PHOTO_CACHE_MAX_AGE_SECONDS,
  PHOTO_CACHE_MAX_ENTRIES,
  PHOTO_CACHE_NAME,
  PHOTO_URL_PATTERN,
} from "./src/photoCache";

// https://vite.dev/config/
export default defineConfig({
  base: "/inat-birds-pwa-test/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    VitePWA({
      // "prompt" instead of "autoUpdate": the new worker waits until the user
      // accepts the reload offered by src/components/UpdatePrompt.tsx, so an
      // update never interrupts a game in progress.
      registerType: "prompt",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "iNat memorama",
        short_name: "iNat memorama",
        description:
          "memorama for species. Data from iNaturalist, the app is for test purpose only",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "bird_48_48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "bird_192_192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        // Drop precaches from previous builds so old bundles are not kept around
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern:
              /^https:\/\/api\.inaturalist\.org\/v2\/observations\/species_counts/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "inat-species-cache",
              expiration: {
                maxEntries: 70,
                maxAgeSeconds: 60 * 60 * 24 * 2, // 2 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Shared with the prefetch that fills this cache, see src/photoCache.ts
            urlPattern: PHOTO_URL_PATTERN,
            handler: "CacheFirst",
            options: {
              cacheName: PHOTO_CACHE_NAME,
              expiration: {
                maxEntries: PHOTO_CACHE_MAX_ENTRIES,
                maxAgeSeconds: PHOTO_CACHE_MAX_AGE_SECONDS,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
});

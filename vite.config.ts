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
        // Both the app bar green (palette.primary.main in src/theme.ts) rather than the
        // paper background, because Chrome on Android keeps an installed app below the
        // status bar — viewport-fit=cover is honoured in a tab and ignored in the
        // WebAPK — so the band behind the clock and battery sits outside the web
        // viewport where no page CSS can reach it. Android fills that band from
        // background_color and picks the icon colour from theme_color, so a paper
        // background_color left white system icons on a near-white strip. Baked into
        // the WebAPK at install time: changing these needs a reinstall to take effect.
        theme_color: "#2f6f4e",
        background_color: "#2f6f4e",
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
            // The species list has its own cache in IndexedDB, which is what decides
            // when it is refetched (see src/species/speciesListCache.ts). This route
            // is only a fallback for a reload that races that cache, so it keeps a
            // handful of entries rather than the seventy it used to: an entry here is
            // up to five hundred species.
            urlPattern:
              /^https:\/\/api\.inaturalist\.org\/v2\/observations\/species_counts/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "inat-species-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 2, // 2 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Which country a set of coordinates falls in, which is a fact rather than
            // a reading: worth keeping for as long as the user keeps the location.
            // Answered from here, a saved location costs no lookup at all.
            urlPattern: /^https:\/\/api\.inaturalist\.org\/v1\/places\/nearby/i,
            handler: "CacheFirst",
            options: {
              cacheName: "inat-places-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 180, // 6 months
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

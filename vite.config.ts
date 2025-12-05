import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

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
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "Birds iNat App",
        short_name: "Birds iNat",
        description: "Your birds iNat application",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "android-launchericon-48-48.png",
            sizes: "48x48",
            type: "image/png",
          },
          {
            src: "android-launchericon-192-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
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
            urlPattern:
              /^https:\/\/inaturalist-open-data\.s3\.amazonaws\.com\/photos\/\d+\/medium\.jpg\?cache=true/i,
            handler: "CacheFirst",
            options: {
              cacheName: "inat-photos-cache",
              expiration: {
                maxEntries: 900,
                maxAgeSeconds: 60 * 60 * 24 * 2, // 2 days
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

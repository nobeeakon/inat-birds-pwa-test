import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Keeps the app on the latest released build, checking once per load.
 *
 * Registering is the check: the browser refetches the worker script on every
 * registration and compares it byte for byte, so nothing has to ask. registerType
 * is "autoUpdate" (see vite.config.ts), so a worker that turns out to be new
 * claims this page immediately and vite-plugin-pwa reloads it.
 *
 * That reload is unconditional, which is why this replaced a prompt: an offer to
 * reload only works if the new worker actually takes control, and when it did not,
 * the old worker answered the reload from its own precached index.html and served
 * the old build back.
 *
 * A build released while the app is already open is therefore picked up the next
 * time it is opened, not while it sits there.
 */
export const useServiceWorkerUpdate = (): void => {
  useRegisterSW({
    onRegisterError: (error) => {
      console.error("Service worker registration failed", error);
    },
  });
};

import { useSyncExternalStore } from "react";

/**
 * Whether the browser has a connection, which is the one thing the platform will tell
 * us about the network.
 *
 * `navigator.onLine` says nothing about whether iNaturalist itself is reachable, but it
 * is right about the case this app runs into: a phone out in the field with no signal.
 * Every request sent then fails, and the observations fetch would spend its whole
 * sequence of per-species sleeps finding that out, so the fetches are held back instead.
 *
 * Plain function as well as hook because the request streams that honour it are async
 * functions, outside React.
 */
export const isOffline = (): boolean => !navigator.onLine;

const subscribeToConnectionChanges = (onChange: () => void): (() => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);

  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

/**
 * Re-renders on the browser's own online/offline events.
 *
 * An external store rather than state kept in sync by an effect: the connection is
 * already state that lives outside React, and reading it through a subscription means
 * no render can ever see a stale copy of it.
 */
export const useIsOffline = (): boolean =>
  useSyncExternalStore(subscribeToConnectionChanges, isOffline);

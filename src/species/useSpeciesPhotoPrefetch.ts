import { useEffect } from "react";

import {
  PHOTO_CACHE_MAX_ENTRIES,
  PHOTO_CACHE_NAME,
  PHOTO_URL_PATTERN,
} from "@/photoCache";
import { useIsOffline } from "@/onlineStatus";
import { getCachedPhotoUrl, sleep } from "@/utils";
import type { SpeciesData } from "@/species/useFetchSpecies";

/**
 * Downloads the photos of the whole species list so the service worker caches them.
 *
 * The list used to cache itself as a side effect of rendering: every card mounted its
 * photo, which the service worker stored on the way through. The list is virtualized
 * now, so only the cards near the viewport ever request one and the cache ends up
 * holding whichever rows happened to be scrolled past. Walking the list here puts
 * that back, without tying it to what is on screen.
 *
 * It runs from the species page rather than from the provider above the routes, so the
 * only people who download a list of photos are the ones who opened the list. It used
 * to run for everyone the moment the species list landed, which meant a user who never
 * left the round still paid for the whole of it — tens of megabytes off iNaturalist's
 * photo hosts, for a page they were not looking at.
 *
 * The cost of that is offline: the photos of a list that was never browsed are not
 * there to show. The ones of a list that was are, and they are what the service worker
 * keeps (see PHOTO_CACHE_MAX_ENTRIES).
 */

/**
 * Photos requested at a time, followed by a pause. Together with the pause this holds
 * the prefetch to about six photos a second, some 350 kB, which leaves the network to
 * the photos the user is waiting on: the cards on screen, and the next observation.
 * A full list of 900 photos takes a couple of minutes to work through at that rate,
 * which is time the user spends browsing anyway.
 *
 * It was thirty, which is six times what this comment claimed and a burst of thirty
 * connections at iNaturalist's photo hosts. They ask that media downloads stay under
 * 5 GB an hour (https://www.inaturalist.org/pages/api+recommended+practices); a full
 * list is only some 55 MB, but there is no reason to fetch it at a rate that would
 * breach that if it ran on.
 */
const PHOTOS_PER_BATCH = 6;

const PAUSE_BETWEEN_BATCHES_MS = 1000;

/**
 * Time given to the grid before the prefetch starts competing with it.
 *
 * It used to be eight seconds, which was the wait the observations page needed: the
 * prefetch ran from the provider above the routes, so it started while the user was
 * still on the round. Mounted on the species page it only runs once they are looking at
 * the list, and the wait is for two much smaller things — letting the rows on screen
 * have the connection first, and not firing a batch at all for someone passing through
 * the page on their way somewhere else.
 */
const START_DELAY_MS = 800;

const getPhotoUrlsToPrefetch = (species: SpeciesData[]): string[] => {
  const photoUrls = new Set<string>();

  for (const item of species) {
    // Past what the cache holds, a photo only evicts one already written. The list
    // arrives most observed first, so the ones kept are the ones most likely wanted.
    if (photoUrls.size >= PHOTO_CACHE_MAX_ENTRIES) {
      break;
    }

    const photoUrl = getCachedPhotoUrl(item.taxon.default_photo?.square_url);

    // A photo the service worker would not keep is not worth the bandwidth
    if (photoUrl && PHOTO_URL_PATTERN.test(photoUrl)) {
      photoUrls.add(photoUrl);
    }
  }

  return Array.from(photoUrls);
};

const getCachedPhotoUrls = async (): Promise<Set<string>> => {
  try {
    const photoCache = await caches.open(PHOTO_CACHE_NAME);
    const cachedRequests = await photoCache.keys();
    return new Set(cachedRequests.map((request) => request.url));
  } catch (error) {
    // Worst case every photo is requested again, which the service worker answers
    // from this same cache
    console.warn("Failed to read the cached photos:", error);
    return new Set();
  }
};

const requestPhoto = async (photoUrl: string, abortSignal: AbortSignal) => {
  try {
    // Requested the way a card's <img> would: static.inaturalist.org, which serves
    // the older photos, sends no CORS headers, so a plain fetch of those is blocked
    // before the service worker can cache anything. The opaque response this gives
    // back is of no use here, only the caching it triggers.
    await fetch(photoUrl, { mode: "no-cors", signal: abortSignal });
  } catch {
    // A photo that cannot be downloaded is one the card shows blank offline. The rest
    // of the list is still worth caching, so keep going.
  }
};

/**
 * Requests the photos in small batches, pausing between them.
 *
 * A batch is awaited in full before the next one starts, so a slow photo holds the
 * prefetch back instead of letting requests pile up on the connection.
 */
const prefetchPhotos = async (
  photoUrls: string[],
  abortSignal: AbortSignal
): Promise<void> => {
  for (
    let batchStart = 0;
    batchStart < photoUrls.length;
    batchStart += PHOTOS_PER_BATCH
  ) {
    if (abortSignal.aborted) {
      return;
    }

    const batch = photoUrls.slice(batchStart, batchStart + PHOTOS_PER_BATCH);
    await Promise.all(
      batch.map((photoUrl) => requestPhoto(photoUrl, abortSignal))
    );

    await sleep(PAUSE_BETWEEN_BATCHES_MS);
  }
};

export const useSpeciesPhotoPrefetch = (
  species: SpeciesData[] | null
): void => {
  const isOffline = useIsOffline();

  useEffect(() => {
    // Without a service worker in charge of the page there is nothing to cache into,
    // and the photos would be downloaded for nothing: this is a first load, or the
    // dev server, which registers no service worker. The next load has one, and
    // prefetches then.
    if (!species || !navigator.serviceWorker?.controller) {
      return;
    }

    // Offline every request here fails, and walking hundreds of them is a few minutes
    // of nothing. The prefetch starts over when the connection returns, skipping
    // whatever it already managed to cache.
    if (isOffline) {
      return;
    }

    const abortController = new AbortController();

    const startPrefetch = async () => {
      const photoUrls = getPhotoUrlsToPrefetch(species);
      const alreadyCachedUrls = await getCachedPhotoUrls();

      if (abortController.signal.aborted) {
        return;
      }

      // Skipping what is already there keeps a revisit from walking the whole list
      // through the service worker again
      const missingPhotoUrls = photoUrls.filter(
        (photoUrl) => !alreadyCachedUrls.has(photoUrl)
      );

      await prefetchPhotos(missingPhotoUrls, abortController.signal);
    };

    const startTimeout = setTimeout(startPrefetch, START_DELAY_MS);

    return () => {
      clearTimeout(startTimeout);
      abortController.abort();
    };
  }, [species, isOffline]);
};

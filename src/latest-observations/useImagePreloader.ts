import { useEffect } from "react";

import type { ObservationType } from "@/latest-observations/useFetchObservations";

/**
 * Preloads all images from provided observations.
 * Uses browser Image() constructor to trigger service worker caching.
 */
export const useImagePreloader = (
  observationsToPreload: ObservationType[]
): void => {
  useEffect(() => {
    const imagesToPreload: HTMLImageElement[] = [];
    const seenUrls = new Set<string>();

    // Preload all photos from all observations, deduplicating by URL
    observationsToPreload.forEach((observation) => {
      observation.photos?.slice(0,3).forEach((photo) => {
        const imgUrl = photo.url.replace("square", "medium");

        if (!seenUrls.has(imgUrl)) {
          seenUrls.add(imgUrl);
          const img = new Image();
          img.src = imgUrl;
          imagesToPreload.push(img);
        }
      });
    });

    // Cleanup: Clear image references to allow garbage collection
    return () => {
      imagesToPreload.forEach((img) => {
        img.src = "";
      });
    };
  }, [observationsToPreload]);
};

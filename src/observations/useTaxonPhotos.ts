import { useEffect, useState } from "react";

import { fetchData } from "@/fetchData";
import { getTaxonPhotosUrl, notNullish } from "@/utils";

export type TaxonPhoto = {
  id: number;
  mediumUrl: string;
};

type TaxonPhotosResponse = {
  results: {
    taxon_photos?: {
      photo?: {
        id: number;
        medium_url?: string;
        url?: string;
      };
    }[];
  }[];
};

/**
 * Photos kept per species. iNaturalist returns a long tail of them and they are only
 * browsed one at a time, so the rest would be fetched bytes nobody looks at.
 */
const MAX_TAXON_PHOTOS = 12;

/**
 * Photos already fetched this session, so paging back to a species the user has
 * already revealed does not spend another request on it. Not persisted: the service
 * worker has no rule for this endpoint, and the photos themselves are what matter
 * offline.
 */
const taxonPhotosCache = new Map<number, TaxonPhoto[]>();

/**
 * The species photos of a taxon, fetched the first time `isEnabled` turns true.
 *
 * Gated rather than fetched on mount because the observations page reveals the
 * species on demand: the request belongs to that reveal, not to every card the user
 * pages past.
 */
export const useTaxonPhotos = (taxonId: number, isEnabled: boolean) => {
  // Tagged with the taxon it belongs to, so a result the card received for a previous
  // species is never read as this one's. What is being fetched, and the cache hits,
  // are derived below instead of stored, which keeps the effect free of setState.
  const [result, setResult] = useState<{
    taxonId: number;
    photos: TaxonPhoto[];
    error: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isEnabled || taxonPhotosCache.has(taxonId)) return;

    // The species can change under this hook while the request runs, when the card is
    // reused for another observation; its results must not land on the new one
    let isStaleRequest = false;

    const fetchTaxonPhotos = async () => {
      try {
        const response = await fetchData<TaxonPhotosResponse>(
          getTaxonPhotosUrl(taxonId)
        );

        const photos = (response.results?.[0]?.taxon_photos ?? [])
          .map(({ photo }) => {
            // medium_url is missing on a few older photos, where the square url can
            // be rewritten into the same size the observation photos use
            const mediumUrl =
              photo?.medium_url ?? photo?.url?.replace("square", "medium");

            return photo && mediumUrl ? { id: photo.id, mediumUrl } : null;
          })
          .filter(notNullish)
          .slice(0, MAX_TAXON_PHOTOS);

        taxonPhotosCache.set(taxonId, photos);

        if (isStaleRequest) return;

        setResult({ taxonId, photos, error: false });
      } catch {
        if (isStaleRequest) return;

        // Not cached: a failed request should be retried on the next reveal
        setResult({ taxonId, photos: [], error: true });
      }
    };

    fetchTaxonPhotos();

    return () => {
      isStaleRequest = true;
    };
  }, [taxonId, isEnabled]);

  if (!isEnabled) return { loading: false, photos: [], error: false };

  const cachedPhotos = taxonPhotosCache.get(taxonId);
  if (cachedPhotos)
    return { loading: false, photos: cachedPhotos, error: false };

  const resultForTaxon = result?.taxonId === taxonId ? result : null;

  return {
    loading: !resultForTaxon,
    photos: resultForTaxon?.photos ?? [],
    error: resultForTaxon?.error ?? false,
  };
};

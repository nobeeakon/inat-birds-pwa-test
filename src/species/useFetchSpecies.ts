import { useState, useEffect } from "react";
import { fetchData } from "@/fetchData";
import { sleep, getUrl } from "@/utils";
import {
  readCachedSpeciesList,
  writeCachedSpeciesList,
} from "@/species/speciesListCache";
import type { Taxa } from "@/taxa";

type Photo = {
  id: number;
  square_url: string;
  attribution?: string;
  license_code?: string | null;
  medium_url?: string;
  url?: string;
};

type Taxon = {
  id: number;
  default_photo: Photo;
  iconic_taxon_name: string;
  is_active: boolean;
  name: string;
  preferred_common_name?: string;
  rank: string;
  rank_level: number;
};

export type SpeciesData = {
  count: number;
  taxon: {
    id: number;
    ancestor_ids: number[];
    ancestors: Taxon[];
    ancestry: string;
    default_photo: Photo;
    iconic_taxon_name: string;
    is_active: boolean;
    name: string;
    preferred_common_name?: string;
    rank: string;
    rank_level: number;
    establishment_means?: {
      establishment_means: string;
    };
    conservation_status?: {
      id: number;
      status: string;
    };
  };
};

type ResponseType = {
  total_results: number;
  page: number;
  per_page: number;
  results: SpeciesData[];
};

const fetchSpecies = async ({
  lat,
  lng,
  radius,
  taxa,
  numberOfPages,
}: {
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
  numberOfPages: number;
}) => {
  const result = [];

  for (let page = 1; page <= numberOfPages; page++) {
    await sleep(1000);
    const pageUrl = getUrl({
      type: "species",
      lat,
      lng,
      radius,
      taxa,
      page,
      perPage: 50,
    });
    const data = await fetchData<ResponseType>(pageUrl);

    if (data.results.length === 0) {
      break;
    }

    result.push(...data.results);
  }

  return result;
};

// TODO do as infinite pager
export const useFetchSpecies = ({
  locationId,
  lat,
  lng,
  radius,
  taxa,
  numberOfPages = 10,
  enabled = true,
}: {
  locationId: string;
  lat: number;
  lng: number;
  radius: number;
  taxa: Taxa;
  numberOfPages?: number;
  enabled?: boolean;
}) => {
  const [queries, setQueries] = useState<{
    loading: boolean;
    data: null | SpeciesData[];
    error: boolean | null;
    isCachedData: boolean;
  }>({ loading: false, data: null, error: null, isCachedData: false });

  useEffect(() => {
    // The fetch is slow enough that the user can change location while it runs; its
    // results must not land on top of whatever is being shown by then
    let isStaleRequest = false;

    const fetchPagesData = async () => {
      if (!lat || !lng || !radius) {
        setQueries({
          loading: false,
          data: null,
          error: null,
          isCachedData: false,
        });
        return;
      }

      // The list from a previous session fills the page while the fetch runs, and
      // is shown even before it starts: callers defer the fetch to stay under the
      // iNaturalist rate limit, which makes the wait longer still
      const cachedSpecies = await readCachedSpeciesList({ locationId, taxa });
      if (isStaleRequest) return;

      setQueries({
        loading: true,
        data: cachedSpecies,
        error: null,
        isCachedData: !!cachedSpecies,
      });

      if (!enabled) {
        return;
      }

      try {
        const data = await fetchSpecies({
          lat,
          lng,
          radius,
          taxa,
          numberOfPages,
        });

        // Refill the cache so the next start has a list to show right away. Worth
        // doing even for a stale request: the data is still valid for its own key.
        await writeCachedSpeciesList({ locationId, taxa }, data);

        if (isStaleRequest) return;

        setQueries({
          loading: false,
          data,
          error: null,
          isCachedData: false,
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        if (isStaleRequest) return;

        setQueries({
          loading: false,
          data: null,
          error: true,
          isCachedData: false,
        });
      }
    };

    fetchPagesData();

    return () => {
      isStaleRequest = true;
    };
  }, [locationId, lat, lng, radius, taxa, numberOfPages, enabled]);

  return queries;
};

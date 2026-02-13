import { useState, useEffect } from "react";
import { fetchData } from "@/fetchData";
import { sleep, getUrl } from "@/utils";

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
  numberOfPages,
}: {
  lat: number;
  lng: number;
  radius: number;
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
  lat,
  lng,
  radius,
  numberOfPages = 10,
}: {
  lat: number;
  lng: number;
  radius: number;
  numberOfPages?: number;
}) => {
  const [queries, setQueries] = useState<{
    loading: boolean;
    data: null | SpeciesData[];
    error: boolean | null;
  }>({ loading: false, data: null, error: null });

  useEffect(() => {
    const fetchPagesData = async () => {
      if (!lat || !lng || !radius) {
        setQueries({ loading: false, data: null, error: null });
        return;
      }

      setQueries({ loading: true, data: null, error: null });
      try {
        const data = await fetchSpecies({ lat, lng, radius, numberOfPages });

        setQueries({ loading: false, data, error: null });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        setQueries({ loading: false, data: null, error: true });
      }
    };

    fetchPagesData();
  }, [lat, lng, radius, numberOfPages]);

  return queries;
};

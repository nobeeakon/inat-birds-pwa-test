import { useState, useEffect } from "react";
import { fetchData } from "@/fetchData";

type Photo = {
  id: number;
  square_url: string;
  attribution?: string;
  license_code?: string;
  medium_url?: string;
  url?: string;
};

type Taxon = {
  id: number;
  default_photo: Photo;
  iconic_taxon_name: string;
  is_active: boolean;
  name: string;
  preferred_common_name: string;
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
    preferred_common_name: string;
    rank: string;
    rank_level: number;
  };
};

type ResponseType = {
  total_results: number;
  page: number;
  per_page: number;
  results: SpeciesData[];
};

const parseURLWithPage = (url: string, page: number) => {
  // example URL:
  // https://api.inaturalist.org/v2/observations/species_counts?verifiable=true&spam=false&lat=20.5756156646437&lng=-100.36499030435793&radius=11.590587837954427&iconic_taxa%5B%5D=Aves&locale=es-MX&preferred_place_id=6793&page=2&per_page=50&include_ancestors=true&fields=(taxon%3A(ancestor_ids%3A!t%2Cancestors%3A(default_photo%3A(square_url%3A!t)%2Ciconic_taxon_name%3A!t%2Cid%3A!t%2Cis_active%3A!t%2Cname%3A!t%2Cpreferred_common_name%3A!t%2Cpreferred_common_names%3A(name%3A!t)%2Crank%3A!t%2Crank_level%3A!t%2Cuuid%3A!t)%2Cancestry%3A!t%2Cconservation_status%3A(status%3A!t)%2Cdefault_photo%3A(attribution%3A!t%2Clicense_code%3A!t%2Cmedium_url%3A!t%2Csquare_url%3A!t%2Curl%3A!t)%2Cestablishment_means%3A(establishment_means%3A!t)%2Ciconic_taxon_name%3A!t%2Cid%3A!t%2Cis_active%3A!t%2Cname%3A!t%2Cpreferred_common_name%3A!t%2Cpreferred_common_names%3A(name%3A!t)%2Crank%3A!t%2Crank_level%3A!t))"

  const newUrl = new URL(url);
  newUrl.searchParams.set("page", page.toString());
  return newUrl.toString();
};

// TODO do as infinite pager
export const useFetchSpecies = (url: string, numberOfPages: number = 10) => {
  const [queries, setQueries] = useState<{
    loading: boolean;
    data: null | SpeciesData[];
    error: boolean | null;
  }>({ loading: false, data: null, error: null });

  useEffect(() => {
    const fetchPagesData = async () => {
      if (!url) {
        setQueries({ loading: false, data: null, error: null });
      }

      const queries = Array(numberOfPages)
        .fill(null)
        .map((_, page) => fetchData(parseURLWithPage(url, page)));

      setQueries({ loading: true, data: null, error: null });
      try {
        const data = await Promise.all<ResponseType>(queries);

        const items = data.map((dataItem) => dataItem.results).flat();

        setQueries({ loading: false, data: items, error: null });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        setQueries({ loading: false, data: null, error: true });
      }
    };

    fetchPagesData();
  }, [numberOfPages, url]);

  return queries;
};

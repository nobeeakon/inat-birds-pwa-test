import { useState, useEffect } from "react";
import { fetchData } from "@/fetchData";

export type ObservationType = {
  uuid: string;
  comments_count: number;
  created_at: string;
  created_at_details: {
    date: string;
    day: number;
    hour: number;
    month: number;
    week: number;
    year: number;
  };
  created_time_zone: string;
  faves_count: number;
  geoprivacy?: null | boolean;
  id: number;
  identifications: {
    id: number;
    current: boolean;
  }[];
  identifications_count: number;
  location: `${number},${number}`;
  mappable: boolean;
  obscured: boolean;
  observed_on: string;
  observed_on_details: {
    date: string;
    day: number;
    hour: number;
    month: number;
    week: number;
    year: number;
  };
  observed_time_zone: string;
  photos: {
    id: number;
    url: string;
  }[];
  place_guess: string;
  quality_grade: string;
  sounds: [];
  taxon: {
    id: number;
    iconic_taxon_id: number;
    name: string;
    preferred_common_name: string;
    rank: string;
    rank_level: number;
  };
  time_observed_at: string;
  user: {
    id: number;
    icon_url: string;
    login: string;
  };
};

type ResponseType = {
  total_results: number;
  page: number;
  per_page: number;
  results: ObservationType[];
};

const parseURLWithPage = (url: string, page: number) => {
  // example URL:
  //  https://api.inaturalist.org/v2/observations?verifiable=true&order_by=id&order=desc&page=7&spam=false&lat=20.54454801218982&lng=-100.38172842219655&radius=24.739610563075544&locale=es-MX&preferred_place_id=6793&iconic_taxa%5B%5D=Aves&per_page=24&no_total_hits=true&fields=(comments_count%3A!t%2Ccreated_at%3A!t%2Ccreated_at_details%3Aall%2Ccreated_time_zone%3A!t%2Cfaves_count%3A!t%2Cgeoprivacy%3A!t%2Cid%3A!t%2Cidentifications%3A(current%3A!t)%2Cidentifications_count%3A!t%2Clocation%3A!t%2Cmappable%3A!t%2Cobscured%3A!t%2Cobserved_on%3A!t%2Cobserved_on_details%3Aall%2Cobserved_time_zone%3A!t%2Cphotos%3A(id%3A!t%2Curl%3A!t)%2Cplace_guess%3A!t%2Cprivate_geojson%3A!t%2Cquality_grade%3A!t%2Csounds%3A(id%3A!t)%2Ctaxon%3A(iconic_taxon_id%3A!t%2Cname%3A!t%2Cpreferred_common_name%3A!t%2Cpreferred_common_names%3A(name%3A!t)%2Crank%3A!t%2Crank_level%3A!t)%2Ctime_observed_at%3A!t%2Cuser%3A(icon_url%3A!t%2Cid%3A!t%2Clogin%3A!t))

  const newUrl = new URL(url);
  newUrl.searchParams.set("page", page.toString());
  return newUrl.toString();
};

const selectRandomNumbers = (size: number, max: number = 100) => {
  const numbers = new Set(Array(max).keys());

  const selectedNumbers = [];

  for (let i = 0; i < size; i++) {
    const arrayNumbers = Array.from(numbers);
    const randomIndex = Math.floor(Math.random() * arrayNumbers.length);
    selectedNumbers.push(arrayNumbers[randomIndex]);
    numbers.delete(arrayNumbers[randomIndex]);
  }

  return selectedNumbers;
};

export const useFetchObservations = (
  url: string,
  numberOfPages: number = 10
) => {
  const [queries, setQueries] = useState<{
    loading: boolean;
    data: null | ObservationType[];
    error: boolean | null;
  }>({ loading: false, data: null, error: null });

  useEffect(() => {
    const fetchPagesData = async () => {
      if (!url) {
        setQueries({ loading: false, data: null, error: null });
      }

      const queries = selectRandomNumbers(9, 120).map((page) =>
        fetchData(parseURLWithPage(url, page))
      );

      setQueries({ loading: true, data: null, error: null });
      try {
        const data = await Promise.all<ResponseType>(queries);

        const items = data
          .map((dataItem) => dataItem.results)
          .flat()
          .filter(
            (observation) =>
              observation.quality_grade === "research" &&
              observation.photos.length > 0
          );

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

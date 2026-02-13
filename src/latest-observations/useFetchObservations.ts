import { useState, useEffect } from "react";
import { fetchData } from "@/fetchData";
import { getUrl, getObservationsUrlForTaxon, sleep, notNullish } from "@/utils";
import type { SpeciesData } from "@/species/useFetchSpecies";

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

const MIN_SLEEP_MS = 1000;
const PAGE_SIZE = 10;
const SPECIES_NUMBER = 15;
const MAX_HEURISTIC_PAGE = 20; // Heuristic max pages for random selection

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

export const useFetchObservations = ({
  lat,
  lng,
  radius,
}: {
  lat: number;
  lng: number;
  radius: number;
}) => {
  const [queries, setQueries] = useState<{
    loading: boolean;
    data: null | ObservationType[];
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
        // Stage 1: Get total results to calculate max pages
        const initialUrl = getUrl({
          type: "species",
          lat,
          lng,
          radius,
          perPage: 1,
          page: 0,
        });
        const initialData = await fetchData<{
          total_results: number;
          results: SpeciesData[];
        }>(initialUrl);

        const maxPages = Math.ceil(initialData.total_results / PAGE_SIZE);

        const numberOfPagesToFetch = Math.ceil(SPECIES_NUMBER / PAGE_SIZE);
        const speciesPages = selectRandomNumbers(
          numberOfPagesToFetch,
          maxPages
        );

        const speciesData: { results: SpeciesData[] }[] = [];
        for (const page of speciesPages) {
          await sleep(MIN_SLEEP_MS);
          const speciesUrl = getUrl({
            type: "species",
            lat,
            lng,
            radius,
            perPage: PAGE_SIZE,
            page,
          });
          const data = await fetchData<{ results: SpeciesData[] }>(speciesUrl);
          speciesData.push(data);
        }

        const allSpecies = speciesData
          .flatMap((d) => d.results)
          .filter(notNullish);

        const filteredSpecies = selectRandomNumbers(
          SPECIES_NUMBER,
          allSpecies.length
        )
          .map((idx) => allSpecies[idx])
          .filter(notNullish);

        // Stage 2: Fetch observations per species
        const allObservations: ObservationType[] = [];
        const observationRadius = radius + 250; // Increased radius to get more observations per species

        for (const speciesItem of filteredSpecies) {
          await sleep(MIN_SLEEP_MS); // Prevent rate limiting

          // Heuristic: Pick random page from 0 to MAX_HEURISTIC_PAGE
          const randomPage = Math.floor(Math.random() * MAX_HEURISTIC_PAGE);

          const obsUrl = getObservationsUrlForTaxon({
            lat,
            lng,
            radius: observationRadius,
            taxonId: speciesItem.taxon.id,
            perPage: 30,
            page: randomPage,
          });

          let obsData = await fetchData<ResponseType>(obsUrl);

          // Fallback: if page is empty (rare species), try page 0
          if (obsData.results.length === 0) {
            await sleep(MIN_SLEEP_MS);
            const fallbackUrl = getObservationsUrlForTaxon({
              lat,
              lng,
              radius: observationRadius,
              taxonId: speciesItem.taxon.id,
              perPage: 30,
              page: 0,
            });
            obsData = await fetchData<ResponseType>(fallbackUrl);
          }

          const observations = obsData.results.filter(
            (obs) => obs.quality_grade === "research" && obs.photos.length > 0
          );

          // Select 5 random observations
          const selectedObs = selectRandomNumbers(
            Math.min(5, observations.length),
            observations.length
          )
            .map((idx) => observations[idx])
            .filter(notNullish);

          allObservations.push(...selectedObs);
        }

        // Stage 3: Randomize final observations
        const shuffled = allObservations
          .map((obs) => ({ obs, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ obs }) => obs);

        setQueries({ loading: false, data: shuffled, error: null });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        setQueries({ loading: false, data: null, error: true });
      }
    };

    fetchPagesData();
  }, [lat, lng, radius]);

  return queries;
};

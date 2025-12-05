import { useState } from "react";

import { useFetchObservations } from "@/latest-observations/useFetchObservations";
import { useStorageState } from "@/storage";
import { LOCAL_STORAGE_KEY } from "@/constants";
import ObservationCard from "@/latest-observations/ObservationCard";
import Header from "@/latest-observations/Header";
import type { ObservationStatus } from "@/latest-observations/types";
import usePreviousObservations from "@/latest-observations/usePreviousObservations";
import { getRandomIndex } from "@/utils";
// TODO add an error boundary

const LatestObservationsPage = ({
  currentLocationId,
  onShowSpecies,
  onShowLocations,
  url,
  updateLocation,
}: {
  currentLocationId: string;
  onShowSpecies: () => void;
  onShowLocations: () => void;
  url: string;
  updateLocation: (newLocationId: string) => void;
}) => {
  const query = useFetchObservations(url);
  const [indices, setIndices] = useState([0]);
  const [showEditExcludedTaxa, setShowEditExcludedTaxa] = useState(false);
  const [taxaToExclude, setTaxaToExclude] = useStorageState<
    Record<string, string>
  >(LOCAL_STORAGE_KEY.EXCLUDED_TAXA_STORAGE_KEY, {});

  const {
    previousObservations,
    addPreviousObservation,
    getRandomPreviousUuid,
  } = usePreviousObservations();

  const filteredData = query.data?.filter(
    (item) => !(item.taxon.id in taxaToExclude)
  );

  const onNext = () => {
    const allPreviousUuidsSet = new Set(
      Object.values(previousObservations).flat()
    );

    const nonObservedObservations = (filteredData ?? []).filter(
      (observationItem) => !allPreviousUuidsSet.has(observationItem.uuid)
    );

    const targetUuid =
      nonObservedObservations[getRandomIndex(nonObservedObservations.length)]
        .uuid;

    const randomIndex = (filteredData ?? []).findIndex(
      (observationItem) => observationItem.uuid === targetUuid
    );

    const previousUuid = getRandomPreviousUuid(
      (filteredData ?? []).map((item) => item.uuid)
    );

    const previousRandomIndex = (filteredData ?? []).findIndex(
      (item) => item.uuid === previousUuid.uuid
    );

    let nextIndex =
      Math.random() <= 0.45 && previousUuid.totalObservationsCount > 20
        ? previousRandomIndex
        : randomIndex;

    if (nextIndex < 0) {
      nextIndex = Math.max(previousRandomIndex, randomIndex, 0);
    }

    setIndices((prev) => [...prev, nextIndex]);
  };

  const onPrevious = () => {
    if (indices.length <= 1) return;

    setIndices((prev) => prev.slice(0, prev.length - 1));
  };

  const onExcludeTaxa = () => {
    const dataItem = (filteredData ?? [])[indices[indices.length - 1]];
    if (!dataItem) return;

    const newTaxaToExclude = {
      ...taxaToExclude,
      [dataItem.taxon.id]: dataItem.taxon.name,
    };

    setTaxaToExclude(newTaxaToExclude);

    // Move to next item
    onNext();
  };

  const onObservationIdentified = (
    observationUuid: string,
    status: ObservationStatus
  ) => {
    addPreviousObservation(observationUuid, status);

    onNext();
  };

  const handleUpdateLocation = (newLocationId: string) => {
    setIndices([0]);
    updateLocation(newLocationId);
  };

  const currendIdx = indices[indices.length - 1];
  const dataItem = (filteredData ?? [])[currendIdx];

  return (
    <>
      <div>
        <Header
          onExcludeTaxa={onExcludeTaxa}
          currentLocationId={currentLocationId}
          updateLocation={handleUpdateLocation}
          toggleEditExcludedTaxa={() =>
            setShowEditExcludedTaxa(!showEditExcludedTaxa)
          }
          onShowSpecies={onShowSpecies}
          onShowLocations={onShowLocations}
        />
      </div>

      {showEditExcludedTaxa && (
        <div>
          {Object.entries(taxaToExclude).map(([taxonId, taxonName]) => (
            <div
              key={taxonId}
              style={{ display: "flex", alignItems: "center", gap: "1rem" }}
            >
              <span>{taxonName}</span>
              <button
                onClick={() => {
                  const newTaxaToExclude = { ...taxaToExclude };
                  delete newTaxaToExclude[taxonId];
                  setTaxaToExclude(newTaxaToExclude);
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        {query.loading && <p>Cargando...</p>}
        {query.error && <p>Hubo un error</p>}
        {!dataItem ? (
          <div>--</div>
        ) : (
          <ObservationCard
            key={`card-observation-${currendIdx}`}
            data={dataItem}
            onNext={(status: ObservationStatus) =>
              onObservationIdentified(dataItem.uuid.toString(), status)
            }
            onPrevious={onPrevious}
          />
        )}
      </div>
    </>
  );
};

export default LatestObservationsPage;

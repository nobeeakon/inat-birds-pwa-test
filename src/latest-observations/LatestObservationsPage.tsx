import { useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

import { useFetchObservations } from "@/latest-observations/useFetchObservations";
import ObservationCard from "@/latest-observations/ObservationCard";
import Header from "@/latest-observations/Header";
import type { ObservationStatus } from "@/latest-observations/types";
import usePreviousObservations from "@/latest-observations/usePreviousObservations";
import { getRandomIndex } from "@/utils";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
// TODO add an error boundary

const LatestObservationsPage = ({
  currentLocationId,
  onShowSpecies,
  onShowLocations,
  lat,
  lng,
  radius,
  updateLocation,
}: {
  currentLocationId: string;
  onShowSpecies: () => void;
  onShowLocations: () => void;
  lat: number;
  lng: number;
  radius: number;
  updateLocation: (newLocationId: string) => void;
}) => {
  const query = useFetchObservations({ lat, lng, radius });
  const [indices, setIndices] = useState([0]);
  const [showEditExcludedTaxa, setShowEditExcludedTaxa] = useState(false);
  const { state, updateSpeciesInfo, getSpeciesInfo } = useSpeciesInfoContext();

  const speciesInfo = state.status === 'success' ? state.data : null;
  const speciesToExclude = speciesInfo ? Array.from(speciesInfo.values()).filter(info => info.exclude) : [];

  const {
    previousObservations,
    addPreviousObservation,
    getRandomPreviousUuid,
  } = usePreviousObservations();

  const filteredData = query.data?.filter(
    (item) => !getSpeciesInfo(item.taxon.id.toString())?.exclude
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
    const existingInfo = getSpeciesInfo(dataItem.taxon.id.toString());
    if (!dataItem) return;

    updateSpeciesInfo(
      dataItem.taxon.id.toString(),
      {
        ...(existingInfo ?? {}),
        taxonId: dataItem.taxon.id.toString(),
        speciesName: dataItem.taxon.name,
        exclude: true,
      }
    );

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
    <Box>
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

      {showEditExcludedTaxa && (
        <Box sx={{ my: 2 }}>
          <Stack spacing={1}>
            {speciesToExclude.map((info) => (
              <Chip
                key={info.taxonId}
                label={info.speciesName}
                onDelete={() => {
                  updateSpeciesInfo(info.taxonId, {
                    ...info,
                    exclude: undefined,
                  });
                }}
                sx={{ justifyContent: "space-between" }}
              />
            ))}
          </Stack>
        </Box>
      )}

      <Box>
        {query.loading && <Typography>Cargando...</Typography>}
        {query.error && <Typography>Hubo un error</Typography>}
        {!dataItem ? (
          <Typography>--</Typography>
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
      </Box>
    </Box>
  );
};

export default LatestObservationsPage;

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Chip, Stack, Typography } from "@mui/material";

import { useFetchObservations } from "@/observations/useFetchObservations";
import ObservationCard from "@/observations/ObservationCard";
import Header from "@/observations/Header";
import LoadingWithBirdFacts from "@/observations/LoadingWithBirdFacts";
import type { ObservationStatus } from "@/observations/types";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import type { ObservationType } from "@/observations/useFetchObservations";
import { useImagePreloader } from "@/observations/useImagePreloader";
// TODO add an error boundary

type ReviewInfo = {
  status: ObservationStatus;
  reviewCount: number;
  lastReviewedAt: number;
};

// Calculate weight for spaced repetition based on status
const getRepetitionWeight = (reviewInfo: ReviewInfo | undefined): number => {
  if (!reviewInfo) return 0; // Not yet reviewed

  const statusWeights = {
    unidentified: 4, // Highest priority for repetition
    sortOfIdentified: 2, // Medium priority
    identified: 1, // Lowest priority
  };

  return statusWeights[reviewInfo.status] * reviewInfo.reviewCount;
};

// Select next observation with spaced repetition logic
const selectNextIndex = (
  currentIndex: number,
  filteredData: ObservationType[],
  reviewMap: Map<string, ReviewInfo>
): number => {
  const dataLength = filteredData.length;
  if (dataLength === 0) return 0;

  const totalReviews = reviewMap.size;

  // If less than 10 reviews or 70% chance, just go to next unreviewed item
  if (totalReviews < 10 || Math.random() < 0.7) {
    // Find next unreviewed item
    const startNextIndex = currentIndex + 1;

    // Search for unreviewed items forward
    for (let i = startNextIndex; i < dataLength; i++) {
      const uuid = filteredData[i]?.uuid.toString();
      if (uuid && !reviewMap.has(uuid)) {
        return i;
      }
    }

    // If none found forward, wrap around and search from beginning
    for (let i = 0; i < currentIndex; i++) {
      const uuid = filteredData[i]?.uuid.toString();
      if (uuid && !reviewMap.has(uuid)) {
        return i;
      }
    }

    // All items reviewed, go to next sequential
    return startNextIndex >= dataLength ? 0 : startNextIndex;
  }

  // 30% chance after 10 reviews: select a reviewed item based on weights
  const reviewedItems = Array.from(reviewMap.entries())
    .map(([uuid, info]) => {
      const index = filteredData.findIndex(
        (item) => item.uuid.toString() === uuid
      );
      return { uuid, info, index, weight: getRepetitionWeight(info) };
    })
    .filter((item) => item.index !== -1 && item.index !== currentIndex); // Exclude current and removed items

  if (reviewedItems.length === 0) {
    // Fallback to sequential
    const nextIndex = currentIndex + 1;
    return nextIndex >= dataLength ? 0 : nextIndex;
  }

  // Weighted random selection
  const totalWeight = reviewedItems.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of reviewedItems) {
    random -= item.weight;
    if (random <= 0) {
      return item.index;
    }
  }

  // Fallback (shouldn't reach here)
  return reviewedItems[0].index;
};

const ObservationsPage = ({
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
  const { t } = useTranslation();
  const query = useFetchObservations({ lat, lng, radius });
  const [indices, setIndices] = useState([0]);
  const [showEditExcludedTaxa, setShowEditExcludedTaxa] = useState(false);
  const [reviewMap, setReviewMap] = useState<Map<string, ReviewInfo>>(
    new Map()
  );
  const { state, updateSpeciesInfo, getSpeciesInfo } = useSpeciesInfoContext();

  const speciesInfo = state.status === "success" ? state.data : null;
  const speciesToExclude = speciesInfo
    ? Array.from(speciesInfo.values()).filter((info) => info.exclude)
    : [];

  const filteredData =
    query.data?.filter(
      (item) => !getSpeciesInfo(item.taxon.id.toString())?.exclude
    ) ?? [];

  const currendIdx = indices[indices.length - 1];

  useImagePreloader(filteredData.slice(currendIdx, currendIdx + 3)); // Preload images for next observations to improve navigation performance

  const onNext = () => {
    setIndices((prevIndices) => {
      const currentIndex = prevIndices[prevIndices.length - 1];
      const nextIndex = selectNextIndex(currentIndex, filteredData, reviewMap);
      return [...prevIndices, nextIndex];
    });
  };

  const onPrevious = () => {
    if (indices.length <= 1) return;

    setIndices((prev) => prev.slice(0, prev.length - 1));
  };

  const onExcludeTaxa = () => {
    const dataItem = filteredData[indices[indices.length - 1]];
    const existingInfo = getSpeciesInfo(dataItem.taxon.id.toString());
    if (!dataItem) return;

    updateSpeciesInfo(dataItem.taxon.id.toString(), {
      ...(existingInfo ?? {}),
      taxonId: dataItem.taxon.id.toString(),
      speciesName: dataItem.taxon.name,
      exclude: true,
    });

    // Move to next item
    onNext();
  };

  const onObservationIdentified = (
    observationUuid: string,
    status: ObservationStatus
  ) => {
    // Update review map first, then select next index with updated map
    setReviewMap((prevReviewMap) => {
      const updatedMap = new Map(prevReviewMap);
      const existingReview = updatedMap.get(observationUuid);

      updatedMap.set(observationUuid, {
        status,
        reviewCount: (existingReview?.reviewCount ?? 0) + 1,
        lastReviewedAt: Date.now(),
      });

      // Now update indices using the updated review map
      setIndices((prevIndices) => {
        const currentIndex = prevIndices[prevIndices.length - 1];
        const nextIndex = selectNextIndex(
          currentIndex,
          filteredData,
          updatedMap
        );
        return [...prevIndices, nextIndex];
      });

      return updatedMap;
    });
  };

  const handleUpdateLocation = (newLocationId: string) => {
    setIndices([0]);
    updateLocation(newLocationId);
  };

  const dataItem = filteredData[currendIdx];

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
        {query.loading && <LoadingWithBirdFacts />}
        {!!query.error && <Typography>{t("errorOccurred")}</Typography>}
        {!!dataItem && (
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

export default ObservationsPage;

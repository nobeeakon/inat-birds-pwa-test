import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import ObservationCard from "@/observations/ObservationCard";
import Header from "@/observations/Header";
import LoadingWithNatureFacts from "@/observations/LoadingWithNatureFacts";
import type { ObservationStatus } from "@/observations/types";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import { useObservationsData } from "@/INaturalistDataContext";
import { useImagePreloader } from "@/observations/useImagePreloader";
import type { Taxa } from "@/taxa";
import type { SpeciesPool } from "@/speciesPool";
import {
  addExclusionScope,
  isSpeciesExcluded,
  removeExclusionScope,
} from "@/exclusions";
// TODO add an error boundary

const ObservationsPage = ({
  currentLocationId,
  currentTaxa,
  currentSpeciesPool,
  updateLocation,
  updateTaxa,
  updateSpeciesPool,
}: {
  currentLocationId: string;
  currentTaxa: Taxa;
  currentSpeciesPool: SpeciesPool;
  updateLocation: (newLocationId: string) => void;
  updateTaxa: (newTaxa: Taxa) => void;
  updateSpeciesPool: (newSpeciesPool: SpeciesPool) => void;
}) => {
  const { t } = useTranslation();
  const [showEditExcludedTaxa, setShowEditExcludedTaxa] = useState(false);
  const { state, updateSpeciesInfo, getSpeciesInfo } = useSpeciesInfoContext();
  const {
    loading,
    error,
    isCachedData,
    observations,
    currentIndex,
    currentObservation,
    goToNextObservation,
    markObservationReviewed,
  } = useObservationsData();

  const speciesInfo = state.status === "success" ? state.data : null;
  // Only what is hidden while browsing this location and taxa: an exclusion made
  // elsewhere is not undone from here
  const excludedSpecies = speciesInfo
    ? Array.from(speciesInfo.values()).filter((info) =>
        isSpeciesExcluded(info, currentLocationId, currentTaxa)
      )
    : [];

  useImagePreloader(observations.slice(currentIndex, currentIndex + 3)); // Preload images for next observations to improve navigation performance

  const onExcludeTaxa = () => {
    if (!currentObservation) return;

    const existingInfo = getSpeciesInfo(currentObservation.taxon.id.toString());

    updateSpeciesInfo(
      currentObservation.taxon.id.toString(),
      addExclusionScope(
        {
          ...(existingInfo ?? {}),
          taxonId: currentObservation.taxon.id.toString(),
          speciesName: currentObservation.taxon.name,
        },
        currentLocationId,
        currentTaxa
      )
    );

    // Move to next item
    goToNextObservation();
  };

  // The whole round is one screenful — header, photo, ratings — so the page is sized to
  // the viewport and the photo absorbs whatever height the rest does not use. Nothing
  // here scrolls, which is what keeps the rating buttons reachable on a phone.
  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Header
        currentLocationId={currentLocationId}
        updateLocation={updateLocation}
        currentTaxa={currentTaxa}
        updateTaxa={updateTaxa}
        currentSpeciesPool={currentSpeciesPool}
        updateSpeciesPool={updateSpeciesPool}
        hasExcludedSpecies={excludedSpecies.length > 0}
        toggleEditExcludedTaxa={() =>
          setShowEditExcludedTaxa(!showEditExcludedTaxa)
        }
      />

      {/* Removing the last exclusion also hides the button that opened this panel.
          Capped and scrollable so a long list cannot squeeze the photo out. */}
      {showEditExcludedTaxa && excludedSpecies.length > 0 && (
        <Box sx={{ px: 1, py: 1, maxHeight: "30dvh", overflowY: "auto" }}>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            {excludedSpecies.map((info) => (
              <Chip
                key={info.taxonId}
                size="small"
                label={info.speciesName}
                onDelete={() => {
                  updateSpeciesInfo(
                    info.taxonId,
                    removeExclusionScope(info, currentLocationId, currentTaxa)
                  );
                }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Capped and centred: the card is one photo and three buttons, and stretching
          it across a desktop window puts the rating buttons a screen apart */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          maxWidth: 640,
          mx: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* The cached observations stand in for the loading screen when there are any */}
        {loading && observations.length === 0 && <LoadingWithNatureFacts />}
        {error && <Typography>{t("errorOccurred")}</Typography>}
        {/* Reachable through a category pool: its species may have no observations
            nearby, or every one of them may have been excluded */}
        {!loading && !error && observations.length === 0 && (
          <Typography sx={{ p: 2 }}>{t("noObservations")}</Typography>
        )}
        {loading && isCachedData && observations.length > 0 && (
          <Alert
            severity="info"
            icon={<CircularProgress size={20} />}
            sx={{ mb: 1 }}
          >
            {t("loadingFreshObservations")}
          </Alert>
        )}
        {!!currentObservation && (
          <ObservationCard
            key={`card-observation-${currentObservation.uuid}`}
            data={currentObservation}
            onExcludeTaxa={onExcludeTaxa}
            onNext={(status: ObservationStatus) =>
              markObservationReviewed(
                currentObservation.uuid.toString(),
                status
              )
            }
          />
        )}
      </Box>
    </Box>
  );
};

export default ObservationsPage;

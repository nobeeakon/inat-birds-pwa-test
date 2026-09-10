import { useState } from "react";
import "@/App.css";
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  CircularProgress,
  Button,
  Box,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTranslation } from "react-i18next";

import TaxonSummary from "@/components/TaxonSummary";
import SpeciesCategories from "@/components/SpeciesCategories";
import { formatConservationStatus } from "@/conservation";
import { type ObservationType } from "@/observations/useFetchObservations";
import { useTaxonPhotos } from "@/observations/useTaxonPhotos";
import type { ObservationStatus } from "@/observations/types";

/**
 * Reserved as a fixed slice of the viewport so photos of any aspect ratio occupy the
 * same space: the previous/next buttons above it stay put instead of jumping as the
 * user pages through photos, and both they and the difficulty buttons stay on screen.
 */
const OBSERVATION_IMAGE_HEIGHT = "70dvh";

const ObservationCard = ({
  data,
  onNext,
  onExcludeTaxa,
}: {
  data: ObservationType;
  onNext: (observationStatus: ObservationStatus) => void;
  onExcludeTaxa: () => void;
}) => {
  const [showTaxa, setShowTaxa] = useState(false);
  // The observation this component renders can change under a stable key, for
  // instance when excluding a species reshuffles the list. Tying the index to
  // the observation keeps it from pointing past the photos of the new one.
  const [photoSelection, setPhotoSelection] = useState({
    observationUuid: data.uuid,
    index: 0,
  });
  const { t } = useTranslation();

  // Only once the species is revealed: before that, the pictures the user has to work
  // from are the ones of this sighting
  const {
    photos: taxonPhotos,
    loading: isLoadingTaxonPhotos,
    error: taxonPhotosError,
  } = useTaxonPhotos(data.taxon.id, showTaxa);

  const observationPhotos = (data.photos ?? []).map((photo) => ({
    id: photo.id,
    imageUrl: photo.url.replace("square", "medium"),
  }));

  // The default photo of a species is often one of its observations, so the same
  // picture can come back from both endpoints
  const observationPhotoIds = new Set(
    observationPhotos.map((photo) => photo.id)
  );
  const speciesPhotos = taxonPhotos
    .filter((photo) => !observationPhotoIds.has(photo.id))
    .map((photo) => ({ id: photo.id, imageUrl: photo.mediumUrl }));

  const photos = [...observationPhotos, ...speciesPhotos];

  // Clamped rather than reset: the species photos arrive after the reveal, and losing
  // the photo being looked at when a request comes back would be worse than a stale index
  const photoIdx = Math.min(
    photoSelection.observationUuid === data.uuid ? photoSelection.index : 0,
    Math.max(photos.length - 1, 0)
  );

  const imgUrl = photos.length > 0 ? photos[photoIdx].imageUrl : null;

  // Before the reveal the only photos are this sighting's, and the counter says nothing
  // the previous/next buttons don't already show
  const showPhotoCounter = speciesPhotos.length > 0;

  const onNextPhoto = () => {
    setPhotoSelection({
      observationUuid: data.uuid,
      index: photoIdx + 1 >= photos.length ? photoIdx : photoIdx + 1,
    });
  };

  const onPrevPhoto = () => {
    setPhotoSelection({
      observationUuid: data.uuid,
      index: photoIdx - 1 < 0 ? photoIdx : photoIdx - 1,
    });
  };

  return (
    <Card elevation={0} square sx={{ backgroundColor: "transparent" }}>
      <CardActions sx={{ display: "flex", gap: 2, mb: 1, mt: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="success"
          onClick={() => onNext("identified")}
        >
          {t("easy")}
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={() => onNext("sortOfIdentified")}
        >
          {t("okay")}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => onNext("unidentified")}
        >
          {t("hard")}
        </Button>
      </CardActions>

      <Box sx={{ textAlign: "center", mx: 1 }}>
        <Button onClick={() => setShowTaxa(true)} color="info" fullWidth>
          {t("show")}
        </Button>
      </Box>

      {showTaxa && (
        <CardContent sx={{ pt: 0, pb: 0.5 }}>
          <TaxonSummary
            taxonId={data.taxon.id}
            scientificName={data.taxon.name}
            prominentName
            details={[
              data.taxon?.preferred_common_name,
              data.family,
              data.taxon?.establishment_means?.establishment_means,
              formatConservationStatus(data.taxon?.conservation_status),
            ]}
          />

          <SpeciesCategories
            taxonId={data.taxon.id}
            speciesName={data.taxon.name}
          />
        </CardContent>
      )}

      {(photos.length > 1 || isLoadingTaxonPhotos || taxonPhotosError) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 2,
            py: 0.5,
          }}
        >
          <Button
            onClick={onPrevPhoto}
            startIcon={<ChevronLeftIcon />}
            sx={{ visibility: photoIdx > 0 ? "visible" : "hidden" }}
          >
            {t("Previous")}
          </Button>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              minWidth: 0,
            }}
          >
            {isLoadingTaxonPhotos && <CircularProgress size={14} />}
            {(taxonPhotosError || showPhotoCounter) && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {taxonPhotosError
                  ? t("speciesPhotosError")
                  : `${photoIdx + 1}/${photos.length}`}
              </Typography>
            )}
          </Box>

          <Button
            onClick={onNextPhoto}
            endIcon={<ChevronRightIcon />}
            sx={{
              visibility: photoIdx < photos.length - 1 ? "visible" : "hidden",
            }}
          >
            {t("Next")}
          </Button>
        </Box>
      )}

      {!!imgUrl && (
        <Box
          sx={{
            height: OBSERVATION_IMAGE_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CardMedia
            component="img"
            image={imgUrl}
            alt={data.taxon?.preferred_common_name || "Observation Photo"}
            sx={{
              height: "100%",
              width: "100%",
              maxWidth: 500,
              objectFit: "contain",
            }}
          />
        </Box>
      )}

      <CardActions sx={{ justifyContent: "center", mt: 2 }}>
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={onExcludeTaxa}
        >
          {t("exclude")}
        </Button>
      </CardActions>
    </Card>
  );
};

export default ObservationCard;

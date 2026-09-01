import { useState } from "react";
import "@/App.css";
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Button,
  Box,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import TaxonSummary from "@/components/TaxonSummary";
import SpeciesCategories from "@/components/SpeciesCategories";
import { type ObservationType } from "@/observations/useFetchObservations";
import type { ObservationStatus } from "@/observations/types";

/**
 * Reserved as a fixed slice of the viewport so photos of any aspect ratio occupy the
 * same space: the previous/next buttons below stay put instead of jumping as the user
 * pages through photos, and both they and the difficulty buttons stay on screen.
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
  const [photoIdx, setPhotoIdx] = useState(0);
  const { t } = useTranslation();

  const imgUrl =
    data.photos && data.photos.length > 0
      ? data.photos[photoIdx].url.replace("square", "medium")
      : null;

  const onNextPhoto = () => {
    if (data.photos && data.photos.length > 0) {
      setPhotoIdx((prev) => (prev + 1 >= data.photos.length ? prev : prev + 1));
    }
  };

  const onPrevPhoto = () => {
    if (data.photos && data.photos.length > 0) {
      setPhotoIdx((prev) => (prev - 1 < 0 ? prev : prev - 1));
    }
  };

  return (
    <Card elevation={0} square sx={{ backgroundColor: "transparent" }}>
      <CardActions sx={{ display: "flex", gap: 2, mb: 1 }}>
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
              data.taxon?.conservation_status?.status,
            ]}
          />

          <SpeciesCategories
            taxonId={data.taxon.id}
            speciesName={data.taxon.name}
          />
        </CardContent>
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

      {data.photos.length > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            p: 2,
          }}
        >
          <Button
            onClick={onPrevPhoto}
            sx={{ visibility: photoIdx > 0 ? "visible" : "hidden" }}
          >
            {t("Previous")}
          </Button>
          {photoIdx < data.photos.length - 1 && (
            <Button onClick={onNextPhoto}>{t("Next")}</Button>
          )}
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

import { useState, type ReactNode } from "react";
import "@/App.css";
import {
  Box,
  Button,
  CircularProgress,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTranslation } from "react-i18next";

import SpeciesCategories from "@/components/SpeciesCategories";
import ExcludeSpeciesButton from "@/components/ExcludeSpeciesButton";
import { formatConservationStatus } from "@/conservation";
import { INATURALIST_SITE_URL } from "@/constants";
import { useEstablishmentMeansLabel } from "@/establishment";
import { capitalizeFirstLetter } from "@/utils";
import { type ObservationType } from "@/observations/useFetchObservations";
import { useTaxonPhotos } from "@/observations/useTaxonPhotos";
import type { ObservationStatus } from "@/observations/types";
import { SCRIM_GRADIENT } from "@/theme";

// A shade deeper than the page, so a letterboxed photo reads as mounted on a mat rather
// than as a picture that failed to fill its box. A dark stage did the same job but was
// the one night-time surface in an otherwise light app. The controls below the photo
// share it: the card is one mounted plate, and the reveal button shows up better on the
// mat than it did on the near-white page. Only just deeper than the page (#f6f4ef): a
// mat that reads as its own warm band competes with the photo it is there to frame.
const CARD_MAT_COLOR = "#f1eee6";

const DETAIL_SEPARATOR = " · ";

/** Wide enough for a thumb at the edge of the photo, narrow enough to leave it visible. */
const PHOTO_STEP_ZONE_WIDTH = 56;

/** The visible part of that zone: a chip no bigger than the icon needs. */
const PHOTO_STEP_CHIP_SIZE = 34;

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
  const getEstablishmentMeansLabel = useEstablishmentMeansLabel();

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

  const hasPreviousPhoto = photoIdx > 0;
  const hasNextPhoto = photoIdx < photos.length - 1;

  // Before the reveal the only photos are this sighting's, and the counter says nothing
  // the stepper arrows don't already show
  const showPhotoCounter = speciesPhotos.length > 0;

  const taxonDetails = [
    capitalizeFirstLetter(data.taxon?.preferred_common_name),
    data.family,
    getEstablishmentMeansLabel(
      data.taxon?.establishment_means?.establishment_means
    ),
    formatConservationStatus(data.taxon?.conservation_status),
  ].filter(Boolean);

  const onNextPhoto = () => {
    setPhotoSelection({
      observationUuid: data.uuid,
      index: hasNextPhoto ? photoIdx + 1 : photoIdx,
    });
  };

  const onPrevPhoto = () => {
    setPhotoSelection({
      observationUuid: data.uuid,
      index: hasPreviousPhoto ? photoIdx - 1 : photoIdx,
    });
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* The photo takes whatever height is left after the controls, so the rating
          buttons stay on screen without the photo needing a guessed fixed height */}
      <Box
        sx={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          backgroundColor: CARD_MAT_COLOR,
        }}
      >
        {!!imgUrl && (
          <Box
            component="img"
            // Keyed on the photo so the fade replays on every change of picture, not
            // just the first paint of the card
            key={imgUrl}
            className="photo-fade-in"
            src={imgUrl}
            alt={data.taxon?.preferred_common_name || t("observationPhoto")}
            sx={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        )}

        {/* Strips down the edges of the photo rather than a row of buttons under it: a
            thumb reaches them without moving, and they cost no height */}
        {hasPreviousPhoto && (
          <PhotoStepZone
            side="left"
            label={t("Previous")}
            onClick={onPrevPhoto}
          >
            <ChevronLeftIcon />
          </PhotoStepZone>
        )}
        {hasNextPhoto && (
          <PhotoStepZone side="right" label={t("Next")} onClick={onNextPhoto}>
            <ChevronRightIcon />
          </PhotoStepZone>
        )}

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ position: "absolute", top: 8, right: 8 }}
        >
          {isLoadingTaxonPhotos && (
            <CircularProgress size={14} sx={{ color: "common.white" }} />
          )}
          {(taxonPhotosError || showPhotoCounter) && (
            <Typography
              variant="caption"
              noWrap
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: 5,
                color: "common.white",
                backgroundColor: "rgba(12, 20, 16, 0.55)",
              }}
            >
              {taxonPhotosError
                ? t("speciesPhotosError")
                : `${photoIdx + 1}/${photos.length}`}
            </Typography>
          )}
          {/* An excluded species has no observations left to show here, so the button
              is never in its excluded state on this page */}
          <ExcludeSpeciesButton
            speciesName={showTaxa ? data.taxon.name : null}
            onToggleExclusion={onExcludeTaxa}
          />
        </Stack>

        {/* The answer is captioned onto the plate, the way a guide labels an
            illustration, so revealing it costs the photo no height */}
        {showTaxa && (
          <Box
            className="photo-fade-in"
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              px: 2,
              pt: 4,
              pb: 1.5,
              background: SCRIM_GRADIENT,
              pointerEvents: "none",
            }}
          >
            <Typography
              component="p"
              sx={{
                fontFamily: (theme) => theme.typography.h6.fontFamily,
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: { xs: "1.35rem", sm: "1.5rem" },
                lineHeight: 1.15,
                color: "common.white",
              }}
            >
              {/* The one link that keeps its own colour: it sits on the photo scrim, where
                  the theme's green would disappear, so it underlines in the caption's white */}
              <Link
                href={`${INATURALIST_SITE_URL}/taxa/${data.taxon.id}`}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                sx={{
                  textDecorationColor: "rgba(255, 255, 255, 0.5)",
                  "&:hover": {
                    color: "inherit",
                    textDecorationColor: "currentcolor",
                  },
                  pointerEvents: "auto",
                }}
              >
                {data.taxon.name}
              </Link>
            </Typography>
            {taxonDetails.length > 0 && (
              <Typography
                variant="body2"
                sx={{ color: "rgba(255, 255, 255, 0.82)", lineHeight: 1.3 }}
              >
                {taxonDetails.join(DETAIL_SEPARATOR)}
              </Typography>
            )}
            {/* Part of the caption rather than of the control strip below: the
                categories label this species, and in the strip they only looked
                like whatever had taken the place of the reveal button */}
            <Box sx={{ pointerEvents: "auto" }}>
              <SpeciesCategories
                taxonId={data.taxon.id}
                speciesName={data.taxon.name}
                isOnScrim
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* One control strip, sized to its content and carrying the photo's mat colour
          on, so there is no seam between the plate and its controls */}
      <Box
        sx={{
          flex: "0 0 auto",
          px: 1,
          pt: 1,
          backgroundColor: CARD_MAT_COLOR,
          // Clears the home indicator on a phone without padding every other device
          pb: "max(8px, env(safe-area-inset-bottom))",
        }}
      >
        {/* The row keeps its height once the species is revealed, so the rating
            buttons stay under the same thumb instead of jumping up */}
        {showTaxa ? (
          <Box sx={{ minHeight: 34 }} />
        ) : (
          <Button
            onClick={() => setShowTaxa(true)}
            fullWidth
            variant="contained"
            // White on the mat, in the green of the app's actions: the one thing to
            // press before rating, so it should not read as quiet text
            sx={{
              minHeight: 34,
              backgroundColor: "background.paper",
              color: "primary.dark",
              border: 1,
              borderColor: "divider",
              boxShadow: 1,
              "&:hover": {
                backgroundColor: "background.paper",
                borderColor: "primary.light",
                boxShadow: 2,
              },
            }}
          >
            {t("show")}
          </Button>
        )}

        {/* Three shades of one rating rather than three unrelated colours: filled
            green, filled ochre, then a white plate, so the scale reads left to
            right. Locked until the species is revealed: the rating is of the guess
            against the answer, so there is nothing to rate before seeing it. */}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            fullWidth
            size="large"
            variant="contained"
            color="success"
            disabled={!showTaxa}
            onClick={() => onNext("identified")}
          >
            {t("easy")}
          </Button>
          <Button
            fullWidth
            size="large"
            variant="contained"
            color="secondary"
            disabled={!showTaxa}
            onClick={() => onNext("sortOfIdentified")}
          >
            {t("okay")}
          </Button>
          <Button
            fullWidth
            size="large"
            variant="contained"
            disabled={!showTaxa}
            onClick={() => onNext("unidentified")}
            // Filled white rather than outlined: on the mat an outline read as a
            // patch of background, so the quietest of the three still needs a plate
            // of its own to look pressable
            sx={{
              backgroundColor: "background.paper",
              color: "text.primary",
              border: 1,
              borderColor: "divider",
              boxShadow: 1,
              "&:hover": {
                backgroundColor: "background.paper",
                borderColor: "text.secondary",
                boxShadow: 2,
              },
            }}
          >
            {t("hard")}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

const PhotoStepZone = ({
  side,
  label,
  onClick,
  children,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
  children: ReactNode;
}) => (
  <Box
    component="button"
    type="button"
    aria-label={label}
    onClick={onClick}
    sx={{
      position: "absolute",
      // Inset from the corners, which belong to the menu button, the photo counter and
      // the exclude button
      top: "20%",
      bottom: "20%",
      [side]: 0,
      width: PHOTO_STEP_ZONE_WIDTH,
      display: "flex",
      alignItems: "center",
      justifyContent: side === "left" ? "flex-start" : "flex-end",
      px: 0.75,
      border: 0,
      cursor: "pointer",
      // The strip stays invisible and only the chip is drawn: a thumb still has the
      // full edge of the photo to hit, without a gradient smudged down each side
      background: "transparent",
      "&:hover > *, &:focus-visible > *": {
        backgroundColor: "rgba(12, 20, 16, 0.62)",
      },
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: PHOTO_STEP_CHIP_SIZE,
        height: PHOTO_STEP_CHIP_SIZE,
        borderRadius: "50%",
        color: "common.white",
        // Translucent, so it reads over both a bright photo and the pale mat
        backgroundColor: "rgba(12, 20, 16, 0.42)",
        transition: "background-color 150ms ease-out",
      }}
    >
      {children}
    </Box>
  </Box>
);

export default ObservationCard;

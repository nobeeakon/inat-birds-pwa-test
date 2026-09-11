import { memo } from "react";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaxonSummary from "@/components/TaxonSummary";
import SpeciesCategories from "@/components/SpeciesCategories";
import ExcludeSpeciesButton from "@/components/ExcludeSpeciesButton";
import { formatConservationStatus } from "@/conservation";
import SimilarSpecies from "@/species/SimilarSpecies";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import {
  addExclusionScope,
  isSpeciesExcluded,
  removeExclusionScope,
} from "@/exclusions";
import type { SpeciesData } from "@/species/useFetchSpecies";
import type { Taxa } from "@/taxa";
import { getFamilyName } from "@/taxonomy";
import { useEstablishmentMeansLabel } from "@/establishment";
import { capitalizeFirstLetter, getCachedPhotoUrl } from "@/utils";

const SpecieCard = ({
  data,
  idx,
  currentLocationId,
  currentTaxa,
}: {
  data: SpeciesData;
  idx?: number;
  currentLocationId: string;
  currentTaxa: Taxa;
}) => {
  const { t } = useTranslation();
  const { getSpeciesInfo, updateSpeciesInfo } = useSpeciesInfoContext();
  const getEstablishmentMeansLabel = useEstablishmentMeansLabel();

  const imageUrl = getCachedPhotoUrl(data.taxon.default_photo?.square_url);

  const familyName = getFamilyName(data.taxon.ancestors);

  const stringTaxonId = data.taxon.id.toString();
  const speciesInfo = getSpeciesInfo(stringTaxonId);
  const isExcluded = isSpeciesExcluded(
    speciesInfo,
    currentLocationId,
    currentTaxa
  );

  // Excluding here hides the species from the observations of this location and taxa
  // only; the card stays on the list so the exclusion can be undone from the same place
  const toggleExclusion = () => {
    const updatedInfo = {
      ...(speciesInfo ?? {}),
      taxonId: stringTaxonId,
      speciesName: speciesInfo?.speciesName ?? data.taxon.name,
    };

    updateSpeciesInfo(
      stringTaxonId,
      isExcluded
        ? removeExclusionScope(updatedInfo, currentLocationId, currentTaxa)
        : addExclusionScope(updatedInfo, currentLocationId, currentTaxa)
    );
  };

  // A plate and its caption rather than a card: no frame, no shadow, no radius. In a
  // one-column phone layout a card outline is just a box drawn around the whole page,
  // and in a multi-column one the gap already separates the entries.
  return (
    <Box sx={{ maxWidth: 400, width: "100%" }}>
      <Box sx={{ position: "relative" }}>
        <Box
          component="img"
          src={imageUrl}
          alt={data.taxon.name}
          loading="lazy"
          // Desaturated as well as faded, so an excluded species is recognisable at a
          // glance in a grid rather than only in comparison with its neighbours. The
          // photo and the caption carry it, not the whole card: fading the button that
          // undoes the exclusion along with them is what it has to stand out against.
          sx={{
            display: "block",
            width: "100%",
            aspectRatio: "4/3",
            objectFit: "cover",
            backgroundColor: "action.hover",
            opacity: isExcluded ? 0.5 : 1,
            filter: isExcluded ? "grayscale(0.9)" : "none",
          }}
        />
        {/* On the corner of the photo, as on the observation card: the same control in
            the same place on both pages */}
        <Box sx={{ position: "absolute", top: 8, right: 8 }}>
          <ExcludeSpeciesButton
            isExcluded={isExcluded}
            speciesName={data.taxon.name}
            onToggleExclusion={toggleExclusion}
          />
        </Box>
      </Box>
      <Box sx={{ pt: 0.75, opacity: isExcluded ? 0.5 : 1 }}>
        <TaxonSummary
          taxonId={data.taxon.id}
          scientificName={data.taxon.name}
          index={idx}
          details={[
            capitalizeFirstLetter(data.taxon.preferred_common_name),
            familyName,
            t("observationCount", { count: data.count }),
            getEstablishmentMeansLabel(
              data.taxon.establishment_means?.establishment_means
            ),
            formatConservationStatus(data.taxon.conservation_status),
          ]}
        />

        <SpeciesCategories
          taxonId={data.taxon.id}
          speciesName={data.taxon.name}
        />

        <SimilarSpecies species={data} />
      </Box>
    </Box>
  );
};

// Scrolling and typing re-render the list around the cards; the species objects
// themselves keep their identity, so the visible cards can skip those renders
export default memo(SpecieCard);

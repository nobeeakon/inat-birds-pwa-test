import { memo } from "react";
import { Box, Button, Card, CardMedia, CardContent } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaxonSummary from "@/components/TaxonSummary";
import SpeciesCategories from "@/components/SpeciesCategories";
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
import { getCachedPhotoUrl } from "@/utils";

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

  return (
    <Card sx={{ maxWidth: 400, width: "100%", opacity: isExcluded ? 0.6 : 1 }}>
      <CardMedia
        component="img"
        image={imageUrl}
        alt={data.taxon.name}
        sx={{
          width: "100%",
          height: "auto",
          aspectRatio: "4/3",
          objectFit: "cover",
        }}
      />
      <CardContent>
        <TaxonSummary
          taxonId={data.taxon.id}
          scientificName={data.taxon.name}
          index={idx}
          details={[
            data.taxon.preferred_common_name,
            familyName,
            t("observationCount", { count: data.count }),
            data.taxon.establishment_means?.establishment_means,
            data.taxon.conservation_status?.status,
          ]}
        />

        <SpeciesCategories
          taxonId={data.taxon.id}
          speciesName={data.taxon.name}
        />

        <SimilarSpecies species={data} />

        <Box sx={{ mt: 0.5 }}>
          <Button
            size="small"
            color={isExcluded ? "primary" : "inherit"}
            variant={isExcluded ? "outlined" : "text"}
            onClick={toggleExclusion}
          >
            {isExcluded ? t("excludedHere") : t("exclude")}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Scrolling and typing re-render the list around the cards; the species objects
// themselves keep their identity, so the visible cards can skip those renders
export default memo(SpecieCard);

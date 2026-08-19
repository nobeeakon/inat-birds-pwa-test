import { memo } from "react";
import { Card, CardMedia, CardContent } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaxonSummary from "@/components/TaxonSummary";
import SpeciesCategories from "@/components/SpeciesCategories";
import SimilarSpecies from "@/species/SimilarSpecies";
import type { SpeciesData } from "@/species/useFetchSpecies";
import { getFamilyName } from "@/taxonomy";
import { getCachedPhotoUrl } from "@/utils";

const SpecieCard = ({ data, idx }: { data: SpeciesData; idx?: number }) => {
  const { t } = useTranslation();

  const imageUrl = getCachedPhotoUrl(data.taxon.default_photo?.square_url);

  const familyName = getFamilyName(data.taxon.ancestors);

  return (
    <Card sx={{ maxWidth: 400, width: "100%" }}>
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
      </CardContent>
    </Card>
  );
};

// Scrolling and typing re-render the list around the cards; the species objects
// themselves keep their identity, so the visible cards can skip those renders
export default memo(SpecieCard);

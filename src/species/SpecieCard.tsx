import { Card, CardMedia, CardContent } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaxonSummary from "@/components/TaxonSummary";
import SpeciesCategories from "@/components/SpeciesCategories";
import type { SpeciesData } from "@/species/useFetchSpecies";
import { getFamilyName } from "@/taxonomy";

const SpecieCard = ({ data, idx }: { data: SpeciesData; idx?: number }) => {
  const { t } = useTranslation();

  const imageUrl =
    (data.taxon.default_photo?.square_url?.replace("square", "medium") || "") +
    "?cache=true";

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
      </CardContent>
    </Card>
  );
};

export default SpecieCard;

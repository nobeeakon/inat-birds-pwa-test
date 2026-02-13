import { useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/species/Header";
import { useFetchSpecies } from "@/species/useFetchSpecies";
import SpecieCard from "@/species/SpecieCard";
import { Box, TextField } from "@mui/material";
import { useCategoriesContext } from "@/CategoriesContext";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import EditCategories from "@/species/EditCategories";
import { notNullish } from "@/utils";
// TODO use a different photo, selected from the observations
// TODO add notes in the specie card

const SpeciesPage = ({
  onShowLatestObservations,
  onShowLocations,
  url,
  currentLocationId,
  updateLocation,
}: {
  onShowLatestObservations: () => void;
  onShowLocations: () => void;
  url: string;
  currentLocationId: string;
  updateLocation: (newLocationId: string) => void;
}) => {
  const { t } = useTranslation();
  const [showCategories, setShowCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const categoriesContext = useCategoriesContext();
  const speciesInfoContext = useSpeciesInfoContext();

  const categories = categoriesContext.state.status === 'success'
    ? Array.from(categoriesContext.state.data.values())
    : [];

  const getCategoriesNames = (categoryIds: string[]) => {
    return categoryIds
      .map(categoryId => categoriesContext.getCategory(categoryId))
      .filter(notNullish);
  };

  const onSpecieCategoryChange = async (taxonId: number, newCategoryId: string) => {
    const stringTaxonId = taxonId.toString();
    const existingInfo = speciesInfoContext.getSpeciesInfo(stringTaxonId);

    let categoryIds = existingInfo?.categoryIds || [];

    if (categoryIds.includes(newCategoryId)) {
      // Remove category
      categoryIds = categoryIds.filter(id => id !== newCategoryId);
    } else {
      // Add category
      categoryIds = [...categoryIds, newCategoryId];
    }

    await speciesInfoContext.updateSpeciesInfo(stringTaxonId, {
      ...existingInfo,
      taxonId: stringTaxonId,
      categoryIds,
    });
  };


  const speciesData = useFetchSpecies(url, 10);

  const filteredSpeciesData =
    !searchTerm || !speciesData.data
      ? speciesData.data
      : speciesData.data.filter((item) => {
          const lowerSearchTerm = searchTerm.toLowerCase().trim();

          const includesName = item.taxon.name
            .toLowerCase()
            .includes(lowerSearchTerm);
          const includesCommonName = item.taxon.preferred_common_name
            ?.toLowerCase()
            .includes(lowerSearchTerm);

          const speciesInfo = speciesInfoContext.getSpeciesInfo(item.taxon.id.toString());
          const categories = getCategoriesNames(speciesInfo?.categoryIds || []);
          const includesCategory = categories.some(category =>
            category.name.toLowerCase().includes(lowerSearchTerm)
          );

          return includesName || includesCommonName || includesCategory;
        });

  return (
    <div>
      <Header
        currentLocationId={currentLocationId}
        updateLocation={updateLocation}
        onShowLatestObservations={onShowLatestObservations}
        onShowLocations={onShowLocations}
        onEditCategories={() => setShowCategories((prev) => !prev)}
      />

      {speciesData.loading && <div>{t("loading")}</div>}
      {speciesData.error && <div>{t("error")}</div>}
      {filteredSpeciesData && (
        <div>
          <h2>
            {t("speciesData")} ({filteredSpeciesData.length} /{" "}
            {speciesData.data?.length || 0})
          </h2>

          <TextField
            label={t("search")}
            variant="outlined"
            size="small"
            fullWidth
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          {showCategories && (
            <EditCategories
            />
          )}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: { xs: "center", sm: "flex-start" },
            }}
          >
            {filteredSpeciesData.map((item) => {
              const speciesInfo = speciesInfoContext.getSpeciesInfo(item.taxon.id.toString());
              return (
                <SpecieCard
                  key={`spp-${item.taxon.id}`}
                  data={item}
                  speciesCategories={getCategoriesNames(speciesInfo?.categoryIds || [])}
                  allCategories={categories}
                  onCategoryChange={(newCategoryId) => {
                    onSpecieCategoryChange(item.taxon.id, newCategoryId || "");
                  }}
                />
              );
            })}
          </Box>
        </div>
      )}
    </div>
  );
};

export default SpeciesPage;

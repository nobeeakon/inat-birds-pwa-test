import { useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/species/Header";
import SpecieCard from "@/species/SpecieCard";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useCategoriesContext } from "@/CategoriesContext";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import { useSpeciesData } from "@/BirdDataContext";
import EditCategories from "@/species/EditCategories";
import { notNullish } from "@/utils";
import { getFamilyName } from "@/taxonomy";
import LoadingWithBirdFacts from "@/observations/LoadingWithBirdFacts";
import type { Taxa } from "@/taxa";
// TODO use a different photo, selected from the observations

const SpeciesPage = ({
  currentLocationId,
  currentTaxa,
  updateLocation,
  updateTaxa,
}: {
  currentLocationId: string;
  currentTaxa: Taxa;
  updateLocation: (newLocationId: string) => void;
  updateTaxa: (newTaxa: Taxa) => void;
}) => {
  const { t } = useTranslation();
  const [showCategories, setShowCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const categoriesContext = useCategoriesContext();
  const speciesInfoContext = useSpeciesInfoContext();
  const speciesData = useSpeciesData();

  const getCategoriesNames = (categoryIds: string[]) => {
    return categoryIds
      .map((categoryId) => categoriesContext.getCategory(categoryId))
      .filter(notNullish);
  };

  // How many species of this location carry each category, so the filter only
  // offers categories that lead somewhere
  const speciesCountByCategoryId = new Map<string, number>();
  for (const item of speciesData.species ?? []) {
    const speciesInfo = speciesInfoContext.getSpeciesInfo(
      item.taxon.id.toString()
    );
    for (const categoryId of speciesInfo?.categoryIds ?? []) {
      speciesCountByCategoryId.set(
        categoryId,
        (speciesCountByCategoryId.get(categoryId) ?? 0) + 1
      );
    }
  }

  const categoryFilters = Array.from(speciesCountByCategoryId.entries())
    .map(([categoryId, speciesCount]) => {
      const category = categoriesContext.getCategory(categoryId);
      return category ? { ...category, speciesCount } : null;
    })
    .filter(notNullish)
    .sort((a, b) => a.name.localeCompare(b.name));

  // A category deleted while selected leaves an id that matches nothing, which would
  // strand the list on an empty result with no chip left to clear it
  const activeCategoryId =
    selectedCategoryId && categoriesContext.getCategory(selectedCategoryId)
      ? selectedCategoryId
      : null;

  const matchesCategory = (categoryIds: string[]) =>
    activeCategoryId === null || categoryIds.includes(activeCategoryId);

  const isFiltered = !!searchTerm || activeCategoryId !== null;

  const filteredSpeciesData =
    speciesData.species?.filter((item) => {
      const speciesInfo = speciesInfoContext.getSpeciesInfo(
        item.taxon.id.toString()
      );
      const categoryIds = speciesInfo?.categoryIds || [];

      if (!matchesCategory(categoryIds)) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const lowerSearchTerm = searchTerm.toLowerCase().trim();

      const includesName = item.taxon.name
        .toLowerCase()
        .includes(lowerSearchTerm);
      const includesCommonName = item.taxon.preferred_common_name
        ?.toLowerCase()
        .includes(lowerSearchTerm);

      const includesFamily = getFamilyName(item.taxon.ancestors)
        ?.toLowerCase()
        .includes(lowerSearchTerm);

      // iNaturalist returns these untranslated ("native", "introduced",
      // "endemic"), which is also how the card shows them
      const includesEstablishmentMeans =
        item.taxon.establishment_means?.establishment_means
          ?.toLowerCase()
          .includes(lowerSearchTerm);

      const categories = getCategoriesNames(categoryIds);
      const includesCategory = categories.some((category) =>
        category.name.toLowerCase().includes(lowerSearchTerm)
      );

      return (
        includesName ||
        includesCommonName ||
        includesFamily ||
        includesEstablishmentMeans ||
        includesCategory
      );
    }) ?? null;

  return (
    <>
      <Header
        currentLocationId={currentLocationId}
        updateLocation={updateLocation}
        currentTaxa={currentTaxa}
        updateTaxa={updateTaxa}
        onEditCategories={() => setShowCategories((prev) => !prev)}
      />

      {speciesData.error && <div>{t("error")}</div>}
      {/* The cached list stands in for the loading screen when there is one. It may
          also still be deferred behind the observations request, which leaves it
          null with nothing loading yet. */}
      {!speciesData.error && speciesData.species === null && (
        <LoadingWithBirdFacts />
      )}
      {filteredSpeciesData && (
        <Box sx={{ p: 4 }}>
          {speciesData.loading && speciesData.isCachedData && (
            <Alert
              severity="info"
              icon={<CircularProgress size={20} />}
              sx={{ mb: 2 }}
            >
              {t("loadingFreshSpecies")}
            </Alert>
          )}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="h6" component="h2" sx={{ lineHeight: 1.2 }}>
              {t("species")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {filteredSpeciesData.length} / {speciesData.species?.length || 0}
            </Typography>
          </Box>

          <TextField
            label={t("search")}
            variant="outlined"
            size="small"
            fullWidth
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />

          {categoryFilters.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                component="p"
              >
                {t("filterByCategory")}
              </Typography>
              <Box
                sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}
                role="group"
              >
                {categoryFilters.map((category) => {
                  const isActive = activeCategoryId === category.id;
                  return (
                    <Chip
                      key={category.id}
                      label={`${category.name} (${category.speciesCount})`}
                      // Clicking the active one clears the filter
                      onClick={() =>
                        setSelectedCategoryId(isActive ? null : category.id)
                      }
                      color={isActive ? "primary" : "default"}
                      variant={isActive ? "filled" : "outlined"}
                    />
                  );
                })}
              </Box>
            </Box>
          )}

          {showCategories && <EditCategories />}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: { xs: "center", sm: "flex-start" },
            }}
          >
            {filteredSpeciesData.map((item, idx) => (
              <SpecieCard
                key={`spp-${item.taxon.id}`}
                data={item}
                idx={!isFiltered ? idx + 1 : undefined}
              />
            ))}
          </Box>
        </Box>
      )}
    </>
  );
};

export default SpeciesPage;

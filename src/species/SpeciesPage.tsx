import { useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/species/Header";
import VirtualizedSpeciesGrid from "@/species/VirtualizedSpeciesGrid";
import { Alert, Box, Chip, CircularProgress, Typography } from "@mui/material";
import { useCategoriesContext } from "@/CategoriesContext";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import { useSpeciesData } from "@/BirdDataContext";
import { notNullish } from "@/utils";
import { getFamilyName } from "@/taxonomy";
import LoadingWithBirdFacts from "@/observations/LoadingWithBirdFacts";
import SpeciesSearchField from "@/species/SpeciesSearchField";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const categoriesContext = useCategoriesContext();
  const speciesInfoContext = useSpeciesInfoContext();
  const speciesData = useSpeciesData();

  const { getCategory } = categoriesContext;
  const { getSpeciesInfo } = speciesInfoContext;
  const allSpecies = speciesData.species;

  // The search field commits its term here once typing pauses; deferring it on top of
  // that keeps the filtering render, which walks hundreds of species, from blocking a
  // keystroke that lands while it runs
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const categoryFilters = useMemo(() => {
    // How many species of this location carry each category, so the filter only
    // offers categories that lead somewhere
    const speciesCountByCategoryId = new Map<string, number>();
    for (const item of allSpecies ?? []) {
      const speciesInfo = getSpeciesInfo(item.taxon.id.toString());
      for (const categoryId of speciesInfo?.categoryIds ?? []) {
        speciesCountByCategoryId.set(
          categoryId,
          (speciesCountByCategoryId.get(categoryId) ?? 0) + 1
        );
      }
    }

    return Array.from(speciesCountByCategoryId.entries())
      .map(([categoryId, speciesCount]) => {
        const category = getCategory(categoryId);
        return category ? { ...category, speciesCount } : null;
      })
      .filter(notNullish)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allSpecies, getSpeciesInfo, getCategory]);

  // A category deleted while selected leaves an id that matches nothing, which would
  // strand the list on an empty result with no chip left to clear it
  const activeCategoryId =
    selectedCategoryId && getCategory(selectedCategoryId)
      ? selectedCategoryId
      : null;

  const isFiltered = !!deferredSearchTerm || activeCategoryId !== null;

  const filteredSpeciesData = useMemo(() => {
    if (!allSpecies) {
      return null;
    }

    const lowerSearchTerm = deferredSearchTerm.toLowerCase().trim();

    return allSpecies.filter((item) => {
      const speciesInfo = getSpeciesInfo(item.taxon.id.toString());
      const categoryIds = speciesInfo?.categoryIds || [];

      const matchesCategory =
        activeCategoryId === null || categoryIds.includes(activeCategoryId);

      if (!matchesCategory) {
        return false;
      }

      if (!lowerSearchTerm) {
        return true;
      }

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

      const includesCategory = categoryIds
        .map((categoryId) => getCategory(categoryId))
        .filter(notNullish)
        .some((category) =>
          category.name.toLowerCase().includes(lowerSearchTerm)
        );

      return (
        includesName ||
        includesCommonName ||
        includesFamily ||
        includesEstablishmentMeans ||
        includesCategory
      );
    });
  }, [
    allSpecies,
    deferredSearchTerm,
    activeCategoryId,
    getSpeciesInfo,
    getCategory,
  ]);

  return (
    <>
      <Header
        currentLocationId={currentLocationId}
        updateLocation={updateLocation}
        currentTaxa={currentTaxa}
        updateTaxa={updateTaxa}
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

          <SpeciesSearchField onSearchTermChange={setSearchTerm} />

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

          <VirtualizedSpeciesGrid
            species={filteredSpeciesData}
            showIndex={!isFiltered}
          />
        </Box>
      )}
    </>
  );
};

export default SpeciesPage;

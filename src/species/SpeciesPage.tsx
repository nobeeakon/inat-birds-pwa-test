import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/species/Header";
import VirtualizedSpeciesGrid from "@/species/VirtualizedSpeciesGrid";
import { Alert, Box, Chip, CircularProgress, Typography } from "@mui/material";
import { useCategoriesContext } from "@/CategoriesContext";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import { useSpeciesData } from "@/INaturalistDataContext";
import { useEstablishmentMeansLabel } from "@/establishment";
import { notNullish } from "@/utils";
import { getFamilyName } from "@/taxonomy";
import LoadingWithNatureFacts from "@/observations/LoadingWithNatureFacts";
import FetchErrorState from "@/components/FetchErrorState";
import { OfflineState } from "@/components/OfflineNotice";
import { useIsOffline } from "@/onlineStatus";
import SpeciesSearchField from "@/species/SpeciesSearchField";
import { MAX_SPECIES_TO_FETCH } from "@/species/useFetchSpecies";
import { useSpeciesPhotoPrefetch } from "@/species/useSpeciesPhotoPrefetch";
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
  // The species a card asked to see the similar ones of, which replaces the search and
  // category filters while it is set
  const [comparedTaxonId, setComparedTaxonId] = useState<string | null>(null);

  const isOffline = useIsOffline();
  const getEstablishmentMeansLabel = useEstablishmentMeansLabel();
  const categoriesContext = useCategoriesContext();
  const speciesInfoContext = useSpeciesInfoContext();
  const speciesData = useSpeciesData();

  const { getCategory } = categoriesContext;
  const { getSpeciesInfo } = speciesInfoContext;
  const allSpecies = speciesData.species;

  // The grid is virtualized, so only the rows near the viewport ever request a photo.
  // Walking the list here is what fills the offline cache with the rest of it, and it
  // happens from this page so that nobody who never opens it pays for the download.
  useSpeciesPhotoPrefetch(allSpecies);

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

  // Ranks come from the unfiltered list and travel with the species, so a filtered
  // card still says where it sits among all of them: "3, 41, 58" tells you how thinly
  // the matches are spread, which renumbering them "1, 2, 3" would hide
  const speciesRankByTaxonId = useMemo(
    () =>
      new Map(
        (allSpecies ?? []).map((item, itemIndex) => [
          item.taxon.id,
          itemIndex + 1,
        ])
      ),
    [allSpecies]
  );

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

      // Matched on the translated label, since that is what the card shows; the
      // English value iNaturalist returns keeps matching for anyone who types it
      const establishmentMeans =
        item.taxon.establishment_means?.establishment_means;
      const includesEstablishmentMeans =
        establishmentMeans?.toLowerCase().includes(lowerSearchTerm) ||
        getEstablishmentMeansLabel(establishmentMeans)
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
    getEstablishmentMeansLabel,
  ]);

  /**
   * The compared species and the ones linked to it, or null when no card asked for
   * that view.
   *
   * Null again, rather than a list of one, once the view has nothing left to compare:
   * the links can be edited from the cards it shows, and a location switch can drop
   * the compared species from the page altogether.
   */
  const comparedSpeciesGroup = useMemo(() => {
    if (!allSpecies || !comparedTaxonId) {
      return null;
    }

    const comparedSpecies = allSpecies.find(
      (item) => item.taxon.id.toString() === comparedTaxonId
    );
    const similarTaxonIds =
      getSpeciesInfo(comparedTaxonId)?.similarSpeciesIds ?? [];

    if (!comparedSpecies || similarTaxonIds.length === 0) {
      return null;
    }

    // The compared species leads, so the photo everything else is being told apart
    // from is the first of the grid rather than wherever its count puts it
    const similarSpecies = allSpecies.filter((item) =>
      similarTaxonIds.includes(item.taxon.id.toString())
    );

    return [comparedSpecies, ...similarSpecies];
  }, [allSpecies, comparedTaxonId, getSpeciesInfo]);

  const compareSimilarSpecies = useCallback((taxonId: string) => {
    setComparedTaxonId(taxonId);
    // The button that opens this view can be hundreds of cards down the list, which
    // is well past the handful the view leaves on the page
    window.scrollTo({ top: 0 });
  }, []);

  const displayedSpecies = comparedSpeciesGroup ?? filteredSpeciesData;

  return (
    <>
      <Header
        currentLocationId={currentLocationId}
        updateLocation={updateLocation}
        currentTaxa={currentTaxa}
        updateTaxa={updateTaxa}
      />

      {!isOffline && !!speciesData.error && (
        <FetchErrorState
          errorKind={speciesData.error}
          onRetry={speciesData.retry}
        />
      )}
      {/* The saved list is the whole page offline. Without one there is nothing to
          study and nothing being fetched either, so the loading screen would be a lie. */}
      {isOffline && !speciesData.loading && speciesData.species === null && (
        <OfflineState message={t("offlineSpeciesBody")} />
      )}
      {/* The cached list stands in for the loading screen when there is one. It may
          also still be deferred behind the observations request, which leaves it
          null with nothing loading yet. */}
      {!isOffline && !speciesData.error && speciesData.species === null && (
        <LoadingWithNatureFacts />
      )}
      {displayedSpecies && (
        <Box component="main" sx={{ px: 2, py: 2 }}>
          {speciesData.loading && speciesData.isCachedData && (
            <Alert
              severity="info"
              icon={<CircularProgress size={20} />}
              sx={{ mb: 2 }}
            >
              {t("loadingFreshSpecies")}
            </Alert>
          )}
          {speciesData.isTruncated && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t("speciesListTruncated", {
                limit: MAX_SPECIES_TO_FETCH,
                total: speciesData.totalSpeciesCount,
              })}
            </Alert>
          )}
          {/* Title and count on one line rather than stacked: two lines of chrome above
              a list is one line too many on a phone */}
          <Box sx={{ mb: 1, display: "flex", alignItems: "baseline", gap: 1 }}>
            <Typography variant="h6" component="h2" sx={{ lineHeight: 1.2 }}>
              {t("species")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {displayedSpecies.length} / {speciesData.species?.length || 0}
            </Typography>
          </Box>

          {/* The comparison replaces the filters instead of combining with them: the
              group is a handful of species, so there is nothing left to search, and a
              category filter left on could empty a list the user just asked to see */}
          {comparedSpeciesGroup ? (
            <Box sx={{ mb: 2 }}>
              <Chip
                label={t("similarSpecies")}
                color="primary"
                onDelete={() => setComparedTaxonId(null)}
              />
            </Box>
          ) : (
            <SpeciesSearchField onSearchTermChange={setSearchTerm} />
          )}

          {!comparedSpeciesGroup && categoryFilters.length > 0 && (
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
            species={displayedSpecies}
            speciesRankByTaxonId={speciesRankByTaxonId}
            currentLocationId={currentLocationId}
            currentTaxa={currentTaxa}
            onCompareSimilarSpecies={compareSimilarSpecies}
          />
        </Box>
      )}
    </>
  );
};

export default SpeciesPage;

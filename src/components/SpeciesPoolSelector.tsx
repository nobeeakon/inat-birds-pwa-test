import { useTranslation } from "react-i18next";
import {
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Divider,
} from "@mui/material";

import {
  PRESET_SPECIES_POOLS,
  usePresetSpeciesPoolLabels,
  getCategorySpeciesPool,
  getSpeciesPoolCategoryId,
} from "@/speciesPool";
import type { SpeciesPool } from "@/speciesPool";
import { useCategoriesContext } from "@/CategoriesContext";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import { useSpeciesData } from "@/INaturalistDataContext";
import { isSpeciesExcluded } from "@/exclusions";
import type { Taxa } from "@/taxa";

const SpeciesPoolSelector = ({
  currentLocationId,
  currentTaxa,
  currentSpeciesPool,
  updateSpeciesPool,
}: {
  currentLocationId: string;
  currentTaxa: Taxa;
  currentSpeciesPool: SpeciesPool;
  updateSpeciesPool: (newSpeciesPool: SpeciesPool) => void;
}) => {
  const { t } = useTranslation();
  const presetLabels = usePresetSpeciesPoolLabels();
  const categoriesContext = useCategoriesContext();
  const speciesInfoContext = useSpeciesInfoContext();
  const locationSpecies = useSpeciesData().species;

  const selectedCategoryId = getSpeciesPoolCategoryId(currentSpeciesPool);

  const allSpeciesInfo =
    speciesInfoContext.state.status === "success"
      ? Array.from(speciesInfoContext.state.data.values())
      : [];

  // Tags are global, so a species tagged elsewhere would otherwise offer a pool that
  // draws nothing here. Null while the species list of the location is still being
  // fetched: filtering against a list that has not landed would empty the menu.
  const locationTaxonIds = locationSpecies
    ? new Set(locationSpecies.map((species) => species.taxon.id.toString()))
    : null;

  // Species excluded from this location and taxa are dropped from the pool when it is
  // fetched, so they must not count towards a category being offered either
  const selectableSpeciesInfo = allSpeciesInfo.filter(
    (speciesInfo) =>
      !isSpeciesExcluded(speciesInfo, currentLocationId, currentTaxa) &&
      (locationTaxonIds === null || locationTaxonIds.has(speciesInfo.taxonId))
  );

  // Only categories with species tagged are offered: an empty one would fetch nothing
  const categoryOptions = (
    categoriesContext.state.status === "success"
      ? Array.from(categoriesContext.state.data.values())
      : []
  )
    .map((category) => ({
      ...category,
      speciesCount: selectableSpeciesInfo.filter((speciesInfo) =>
        speciesInfo.categoryIds?.includes(category.id)
      ).length,
    }))
    // The selected one is kept even when empty here, so switching to a location none
    // of its species reach still shows what is being drawn from
    .filter(
      (category) =>
        category.speciesCount > 0 || category.id === selectedCategoryId
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // The stored pool can name a category that was deleted, emptied, or is still
  // loading; a placeholder keeps the Select from rendering an unknown value
  const isSelectedCategoryMissing =
    selectedCategoryId !== null &&
    !categoryOptions.some((category) => category.id === selectedCategoryId);

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel id="species-pool-selector-label">
        {t("speciesPool")}
      </InputLabel>
      <Select
        labelId="species-pool-selector-label"
        id="species-pool-selector"
        value={currentSpeciesPool}
        label={t("speciesPool")}
        onChange={(e) => updateSpeciesPool(e.target.value as SpeciesPool)}
      >
        {PRESET_SPECIES_POOLS.map((presetPool) => (
          <MenuItem key={presetPool} value={presetPool}>
            {presetLabels[presetPool]}
          </MenuItem>
        ))}

        {categoryOptions.length > 0 && <Divider />}

        {categoryOptions.map((category) => (
          <MenuItem
            key={category.id}
            value={getCategorySpeciesPool(category.id)}
          >
            {`${category.name} (${category.speciesCount})`}
          </MenuItem>
        ))}

        {isSelectedCategoryMissing && (
          <MenuItem value={currentSpeciesPool} disabled>
            {t("speciesPoolCategoryUnavailable")}
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
};

export default SpeciesPoolSelector;

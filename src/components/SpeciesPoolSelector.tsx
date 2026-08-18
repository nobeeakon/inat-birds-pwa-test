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

const SpeciesPoolSelector = ({
  currentSpeciesPool,
  updateSpeciesPool,
}: {
  currentSpeciesPool: SpeciesPool;
  updateSpeciesPool: (newSpeciesPool: SpeciesPool) => void;
}) => {
  const { t } = useTranslation();
  const presetLabels = usePresetSpeciesPoolLabels();
  const categoriesContext = useCategoriesContext();
  const speciesInfoContext = useSpeciesInfoContext();

  const allSpeciesInfo =
    speciesInfoContext.state.status === "success"
      ? Array.from(speciesInfoContext.state.data.values())
      : [];

  // Only categories with species tagged are offered: an empty one would fetch nothing
  const categoryOptions = (
    categoriesContext.state.status === "success"
      ? Array.from(categoriesContext.state.data.values())
      : []
  )
    .map((category) => ({
      ...category,
      speciesCount: allSpeciesInfo.filter((speciesInfo) =>
        speciesInfo.categoryIds?.includes(category.id)
      ).length,
    }))
    .filter((category) => category.speciesCount > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  // The stored pool can name a category that was deleted, emptied, or is still
  // loading; a placeholder keeps the Select from rendering an unknown value
  const selectedCategoryId = getSpeciesPoolCategoryId(currentSpeciesPool);
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

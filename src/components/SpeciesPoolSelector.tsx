import { useTranslation } from "react-i18next";
import { FormControl, Select, MenuItem, InputLabel } from "@mui/material";

import { SPECIES_POOLS, useSpeciesPoolLabels } from "@/speciesPool";
import type { SpeciesPool } from "@/speciesPool";

const SpeciesPoolSelector = ({
  currentSpeciesPool,
  updateSpeciesPool,
}: {
  currentSpeciesPool: SpeciesPool;
  updateSpeciesPool: (newSpeciesPool: SpeciesPool) => void;
}) => {
  const { t } = useTranslation();
  const speciesPoolLabels = useSpeciesPoolLabels();

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
        {SPECIES_POOLS.map((speciesPoolOption) => (
          <MenuItem key={speciesPoolOption} value={speciesPoolOption}>
            {speciesPoolLabels[speciesPoolOption]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SpeciesPoolSelector;

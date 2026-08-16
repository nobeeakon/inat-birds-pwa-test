import { useTranslation } from "react-i18next";
import { FormControl, Select, MenuItem, InputLabel } from "@mui/material";

import { TAXA, useTaxaLabels } from "@/taxa";
import type { Taxa } from "@/taxa";

const TaxaSelector = ({
  currentTaxa,
  updateTaxa,
}: {
  currentTaxa: Taxa;
  updateTaxa: (newTaxa: Taxa) => void;
}) => {
  const { t } = useTranslation();
  const taxaLabels = useTaxaLabels();

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel id="taxa-selector-label">{t("taxa")}</InputLabel>
      <Select
        labelId="taxa-selector-label"
        id="taxa-selector"
        value={currentTaxa}
        label={t("taxa")}
        onChange={(e) => updateTaxa(e.target.value as Taxa)}
      >
        {TAXA.map((taxaOption) => (
          <MenuItem key={taxaOption} value={taxaOption}>
            {taxaLabels[taxaOption]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TaxaSelector;

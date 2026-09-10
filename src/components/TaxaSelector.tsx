import { useTranslation } from "react-i18next";
import { Select, MenuItem } from "@mui/material";

import { TAXA, useTaxaLabels } from "@/taxa";
import type { Taxa } from "@/taxa";

/**
 * Lives in the app bar, so it is drawn as bare inherited-colour text rather than an
 * outlined field: the label chrome would compete with the toolbar's own controls and
 * eat the horizontal space phones do not have. The visible value names the taxa, and
 * the aria-label carries the "group" wording for screen readers.
 */
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
    <Select
      id="taxa-selector"
      value={currentTaxa}
      onChange={(event) => updateTaxa(event.target.value as Taxa)}
      variant="standard"
      disableUnderline
      inputProps={{ "aria-label": t("group") }}
      sx={{
        color: "inherit",
        "& .MuiSelect-select": { py: 0.5 },
        "& .MuiSelect-icon": { color: "inherit" },
      }}
    >
      {TAXA.map((taxaOption) => (
        <MenuItem key={taxaOption} value={taxaOption}>
          {taxaLabels[taxaOption]}
        </MenuItem>
      ))}
    </Select>
  );
};

export default TaxaSelector;

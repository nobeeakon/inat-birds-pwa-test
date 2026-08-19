import { memo, useEffect, useState } from "react";
import { TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";

/** How long typing has to pause before the list is filtered again. */
const SEARCH_DELAY_MS = 350;

/**
 * The species search field, which keeps what is being typed to itself.
 *
 * Every keystroke re-renders this component alone; the term is handed up only once
 * typing pauses, so the page — and the several hundred cards hanging off its filter —
 * re-renders once per search instead of once per character.
 */
const SpeciesSearchField = ({
  onSearchTermChange,
}: {
  /** Must be stable, since it is what the debounced commit is keyed on. */
  onSearchTermChange: (searchTerm: string) => void;
}) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebouncedValue(inputValue, SEARCH_DELAY_MS);

  useEffect(() => {
    onSearchTermChange(debouncedInputValue);
  }, [debouncedInputValue, onSearchTermChange]);

  return (
    <TextField
      label={t("search")}
      variant="outlined"
      size="small"
      fullWidth
      value={inputValue}
      onChange={(event) => setInputValue(event.target.value)}
      sx={{ mb: 2 }}
    />
  );
};

// Nothing the page re-renders for reaches the field, so it stays out of those renders
export default memo(SpeciesSearchField);

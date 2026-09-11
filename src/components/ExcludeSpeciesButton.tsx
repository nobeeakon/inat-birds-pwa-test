import { useState } from "react";
import { IconButton } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import { useTranslation } from "react-i18next";

import ExcludeSpeciesDialog from "@/components/ExcludeSpeciesDialog";

/** Dark enough to read over a bright photo without hiding the corner of it. */
const OVERLAY_BUTTON_BACKGROUND = "rgba(12, 20, 16, 0.55)";

/** The red of the app's destructive actions, which is also what the button turns while
 *  the species is excluded. */
const EXCLUDE_BUTTON_BACKGROUND = "rgba(179, 64, 58, 0.85)";

/**
 * The exclude control the observation and species cards share: a chip on the corner of
 * the photo rather than a labelled button, so it costs the card no height.
 *
 * Excluding asks for confirmation, since the species then drops out of every round at
 * this location and group. Undoing one is harmless, so it takes effect straight away —
 * and the button staying lit is what says the species is excluded.
 */
const ExcludeSpeciesButton = ({
  isExcluded = false,
  speciesName,
  onToggleExclusion,
}: {
  isExcluded?: boolean;
  speciesName: string | null;
  onToggleExclusion: () => void;
}) => {
  const { t } = useTranslation();
  const [isConfirmingExclusion, setIsConfirmingExclusion] = useState(false);

  return (
    <>
      <IconButton
        size="small"
        aria-label={isExcluded ? t("excludedHere") : t("exclude")}
        aria-pressed={isExcluded}
        onClick={() =>
          isExcluded ? onToggleExclusion() : setIsConfirmingExclusion(true)
        }
        sx={{
          color: "common.white",
          backgroundColor: isExcluded
            ? EXCLUDE_BUTTON_BACKGROUND
            : OVERLAY_BUTTON_BACKGROUND,
          "&:hover": { backgroundColor: EXCLUDE_BUTTON_BACKGROUND },
        }}
      >
        <BlockIcon fontSize="small" />
      </IconButton>

      <ExcludeSpeciesDialog
        isOpen={isConfirmingExclusion}
        speciesName={speciesName}
        onCancel={() => setIsConfirmingExclusion(false)}
        onConfirm={() => {
          setIsConfirmingExclusion(false);
          onToggleExclusion();
        }}
      />
    </>
  );
};

export default ExcludeSpeciesButton;

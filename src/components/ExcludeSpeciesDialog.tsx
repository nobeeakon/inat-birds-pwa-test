import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useTranslation } from "react-i18next";

/**
 * Confirms excluding a species.
 *
 * Excluding drops the species from every round at this location and group, which is
 * not what a mis-tap on a button sitting over a photo should cost. On the observations
 * page the species is only named once it has been revealed, so the dialog cannot give
 * the answer away.
 */
const ExcludeSpeciesDialog = ({
  isOpen,
  speciesName,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  speciesName: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <DialogTitle>
        {speciesName
          ? t("excludeSpeciesNamedTitle", { name: speciesName })
          : t("excludeSpeciesTitle")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{t("excludeSpeciesExplanation")}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t("cancel")}</Button>
        <Button color="error" onClick={onConfirm} autoFocus>
          {t("exclude")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExcludeSpeciesDialog;

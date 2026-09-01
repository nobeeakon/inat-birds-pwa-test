import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

const AboutDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onClose={onClose} aria-labelledby="about-title">
      <DialogTitle id="about-title">{t("about")}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t("aboutDescription")}</DialogContentText>
        <DialogContentText variant="body2" sx={{ mt: 2 }}>
          {t("aboutDataSource")}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AboutDialog;

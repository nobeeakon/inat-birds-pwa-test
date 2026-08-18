import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import type { Category } from "@/storage/db";

/**
 * Confirms deleting a category. Open while a category is given.
 *
 * Deleting is not blocked when species are using the category, so the warning is
 * what tells the user those tags are about to stop showing anywhere.
 */
const DeleteCategoryDialog = ({
  category,
  onCancel,
  onConfirm,
}: {
  category: Category | null;
  onCancel: () => void;
  onConfirm: (categoryId: string) => void;
}) => {
  const { t } = useTranslation();

  return (
    <Dialog open={category !== null} onClose={onCancel}>
      <DialogTitle>{t("deleteCategoryTitle")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("deleteCategoryWarning", { name: category?.name })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t("cancel")}</Button>
        <Button
          color="error"
          onClick={() => category && onConfirm(category.id)}
          autoFocus
        >
          {t("delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteCategoryDialog;

import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useCategoriesContext } from "@/CategoriesContext";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import { useState } from "react";

const EditCategories = () => {
  const { t } = useTranslation();
  const categoriesContext = useCategoriesContext();
  const speciesInfoContext = useSpeciesInfoContext();

  const [deleteDialogMessage, setDeleteDialogMessage] = useState("");

  const categories =
    categoriesContext.state.status === "success"
      ? Array.from(categoriesContext.state.data.values())
      : [];

  const onAddCategory = async () => {
    const newCategoryId = `category-${Date.now()}`;
    await categoriesContext.addCategory({
      id: newCategoryId,
      name: "",
    });
  };

  const onUpdateCategoryName = async (categoryId: string, newName: string) => {
    await categoriesContext.updateCategory({
      id: categoryId,
      name: newName,
    });
  };

  const onDeleteCategory = async (categoryId: string) => {
    // Check if any species is using this category
    if (speciesInfoContext.state.status === "success") {
      const allSpeciesInfo = Array.from(speciesInfoContext.state.data.values());
      const speciesUsingCategory = allSpeciesInfo.filter((speciesInfo) =>
        speciesInfo.categoryIds?.includes(categoryId)
      );

      if (speciesUsingCategory.length > 0) {
        setDeleteDialogMessage(
          t("cannotDeleteCategory", { count: speciesUsingCategory.length })
        );
        return;
      }
    }

    await categoriesContext.deleteCategory(categoryId);
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={onAddCategory} sx={{ mb: 2 }}>
          {t("addCategory")}
        </Button>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {categories.map((categoryItem) => (
            <Box
              key={categoryItem.id}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <TextField
                label={t("name")}
                size="small"
                value={categoryItem.name}
                onChange={(e) =>
                  onUpdateCategoryName(categoryItem.id, e.target.value)
                }
              />
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => onDeleteCategory(categoryItem.id)}
              >
                {t("delete")}
              </Button>
            </Box>
          ))}
        </Box>
      </Box>
      <Dialog
        open={deleteDialogMessage !== ""}
        onClose={() => setDeleteDialogMessage("")}
      >
        <DialogTitle>{t("cannotDeleteCategoryTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{deleteDialogMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogMessage("")}>{t("ok")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditCategories;

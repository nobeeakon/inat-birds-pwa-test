import { useState } from "react";
import { Box, Button, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useCategoriesContext } from "@/CategoriesContext";
import { createCategoryId } from "@/categories";
import DeleteCategoryDialog from "@/components/DeleteCategoryDialog";
import type { Category } from "@/storage/db";

/**
 * The global category list: rename or delete.
 *
 * Deleting does not touch the species that reference the category; the dangling ids
 * are filtered out wherever categories are displayed.
 */
const EditCategories = () => {
  const { t } = useTranslation();
  const categoriesContext = useCategoriesContext();
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  const categories =
    categoriesContext.state.status === "success"
      ? Array.from(categoriesContext.state.data.values())
      : [];

  const onAddCategory = async () => {
    await categoriesContext.addCategory({
      id: createCategoryId(),
      name: "",
    });
  };

  const onUpdateCategoryName = async (categoryId: string, newName: string) => {
    await categoriesContext.updateCategory({
      id: categoryId,
      name: newName,
    });
  };

  return (
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
              onClick={() => setCategoryToDelete(categoryItem)}
            >
              {t("delete")}
            </Button>
          </Box>
        ))}
      </Box>

      <DeleteCategoryDialog
        category={categoryToDelete}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={async (categoryId) => {
          setCategoryToDelete(null);
          await categoriesContext.deleteCategory(categoryId);
        }}
      />
    </Box>
  );
};

export default EditCategories;

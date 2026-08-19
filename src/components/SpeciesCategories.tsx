import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useCategoriesContext } from "@/CategoriesContext";
import { useSpeciesInfoContext } from "@/SpeciesInfoContext";
import { notNullish } from "@/utils";
import { createCategoryId } from "@/categories";
import DeleteCategoryDialog from "@/components/DeleteCategoryDialog";
import type { Category } from "@/storage/db";

/**
 * The categories assigned to a species, plus a dialog to change them.
 *
 * Categories are a single global list; a species only stores the ids, so renaming a
 * category updates every species at once and deleting one leaves dangling ids behind.
 */
const SpeciesCategories = ({
  taxonId,
  speciesName,
}: {
  taxonId: number;
  speciesName?: string;
}) => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );

  const categoriesContext = useCategoriesContext();
  const speciesInfoContext = useSpeciesInfoContext();

  const stringTaxonId = taxonId.toString();
  const speciesInfo = speciesInfoContext.getSpeciesInfo(stringTaxonId);
  const assignedCategoryIds = speciesInfo?.categoryIds ?? [];

  const allCategories =
    categoriesContext.state.status === "success"
      ? Array.from(categoriesContext.state.data.values()).sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      : [];

  // Ids of deleted categories are dropped here rather than cleaned up on delete
  const assignedCategories = assignedCategoryIds
    .map((categoryId) => categoriesContext.getCategory(categoryId))
    .filter(notNullish);

  const toggleCategory = async (categoryId: string) => {
    const updatedCategoryIds = assignedCategoryIds.includes(categoryId)
      ? assignedCategoryIds.filter((assignedId) => assignedId !== categoryId)
      : [...assignedCategoryIds, categoryId];

    await speciesInfoContext.updateSpeciesInfo(stringTaxonId, {
      ...speciesInfo,
      taxonId: stringTaxonId,
      speciesName: speciesName ?? speciesInfo?.speciesName,
      categoryIds: updatedCategoryIds,
    });
  };

  // Creating from here keeps the observations page usable: it has no category manager
  const onCreateCategory = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    const newCategoryId = createCategoryId();
    await categoriesContext.addCategory({
      id: newCategoryId,
      name: trimmedName,
    });
    await toggleCategory(newCategoryId);
    setNewCategoryName("");
  };

  return (
    <Box sx={{ mt: 0.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        {assignedCategories.map((category) => (
          <Chip key={category.id} label={category.name} size="small" />
        ))}
        <Button size="small" onClick={() => setIsDialogOpen(true)}>
          {t("categories")}
        </Button>
      </Stack>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("editCategories")}</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
            <TextField
              label={t("newCategory")}
              size="small"
              fullWidth
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onCreateCategory();
              }}
            />
            <Button
              onClick={onCreateCategory}
              disabled={!newCategoryName.trim()}
            >
              {t("add")}
            </Button>
          </Stack>

          {allCategories.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("noCategoriesYet")}
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {allCategories.map((category) => {
                const isAssigned = assignedCategoryIds.includes(category.id);
                return (
                  <Chip
                    key={category.id}
                    label={category.name}
                    onClick={() => toggleCategory(category.id)}
                    onDelete={() => setCategoryToDelete(category)}
                    color={isAssigned ? "primary" : "default"}
                    variant={isAssigned ? "filled" : "outlined"}
                  />
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>{t("done")}</Button>
        </DialogActions>
      </Dialog>

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

export default SpeciesCategories;

import { useState } from "react";
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
} from "@mui/material";
import type { SpeciesData } from "@/species/useFetchSpecies";

const EditCategory = ({
  speciesCategories,
  allCategories,
  onUpdateCategories,
  onClose,
}: {
  speciesCategories: { id: string; name: string }[];
  allCategories: { id: string; name: string }[];
  onUpdateCategories: (newCategoryId: string) => void;
  onClose: () => void;
}) => {
  const sortedCategories = allCategories.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        {sortedCategories.map((categoryItem) => (
          <Chip
            key={categoryItem.id}
            label={categoryItem.name}
            onClick={() => onUpdateCategories(categoryItem.id)}
            color={
              speciesCategories?.some((cat) => cat.id === categoryItem.id)
                ? "primary"
                : "default"
            }
            variant={
              speciesCategories?.some((cat) => cat.id === categoryItem.id)
                ? "filled"
                : "outlined"
            }
          />
        ))}
      </Box>
      <Box>
        <Button onClick={onClose}>Cerrar</Button>
      </Box>
    </Box>
  );
};

const SpecieCard = ({
  data,
  speciesCategories,
  allCategories,
  onCategoryChange,
}: {
  data: SpeciesData;
  speciesCategories: { id: string; name: string }[];
  allCategories: { id: string; name: string }[];
  onCategoryChange: (newCategory?: string) => void;
}) => {
  const [editCategory, setEditCategory] = useState(false);

  const imageUrl =
    (data.taxon.default_photo?.square_url?.replace("square", "medium") || "") +
    "?cache=true";

  return (
    <Card sx={{ maxWidth: 400, width: "100%" }}>
      <CardMedia
        component="img"
        image={imageUrl}
        alt={data.taxon.name}
        sx={{ width: "100%", height: "auto", aspectRatio: "4/3", objectFit: "cover" }}
      />
      <CardContent>
        <Typography>
          <strong>
            <i>{data.taxon.name}</i>
          </strong>{" "}
          ({data.taxon.preferred_common_name})
          <span> [{data.count}]</span>
        </Typography>

        {!!speciesCategories?.length && (
          <Typography>
            Category: {speciesCategories.map((cat) => cat.name).join(", ")}
          </Typography>
        )}
      </CardContent>

      <CardActions>
        {!editCategory ? (
          <Button onClick={() => setEditCategory(true)}>Edit Category</Button>
        ) : (
          <EditCategory
            allCategories={allCategories}
            speciesCategories={speciesCategories}
            onUpdateCategories={onCategoryChange}
            onClose={() => setEditCategory(false)}
          />
        )}
      </CardActions>
    </Card>
  );
};

export default SpecieCard;

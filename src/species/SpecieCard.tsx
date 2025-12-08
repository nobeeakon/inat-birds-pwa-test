import { useState } from "react";
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
    <div>
      <div>
        {sortedCategories.map((categoryItem) => (
          <button
            key={categoryItem.id}
            onClick={() => onUpdateCategories(categoryItem.id)}
            style={{
              backgroundColor: speciesCategories?.some(
                (cat) => cat.id === categoryItem.id
              )
                ? "lightblue"
                : "white",
            }}
          >
            {categoryItem.name}
          </button>
        ))}
      </div>
      <div>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
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
    <div
      style={{
        border: "1px solid lightgray",
        borderRadius: "8px",
        marginTop: "8px",
        marginBottom: "8px",
        padding: "8px",
      }}
    >
      <img src={imageUrl} alt={data.taxon.name} width="100%" />
      <p>
        <strong>
          <i>{data.taxon.name} </i>
        </strong>{" "}
        ({data.taxon.preferred_common_name})
      </p>
      <p> [{data.count}]</p>

      {!!speciesCategories?.length && (
        <p> Category: {speciesCategories.map((cat) => cat.name).join(", ")}</p>
      )}

      {!editCategory ? (
        <button onClick={() => setEditCategory(true)}>Edit Category</button>
      ) : (
        <EditCategory
          allCategories={allCategories}
          speciesCategories={speciesCategories}
          onUpdateCategories={onCategoryChange}
          onClose={() => setEditCategory(false)}
        />
      )}
    </div>
  );
};

export default SpecieCard;

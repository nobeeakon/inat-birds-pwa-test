import { useState } from "react";
import type { SpeciesData } from "@/species/useFetchSpecies";

const EditCategory = ({
  category,
  categories,
  onDone,
  onCancel,
}: {
  category?: string;
  categories: string[];
  onDone: (newCategory?: string) => void;
  onCancel: () => void;
}) => {
  const [selectedCategory, setSelectedCategory] = useState(category);

  const onSave = () => {
    onDone(selectedCategory);
  };

  return (
    <div>
      <select
        value={selectedCategory ?? ""}
        onChange={(e) => {
          setSelectedCategory(e.target.value || undefined);
        }}
      >
        <option value="">Select category</option>
        {categories.map((categoryItem, index) => (
          <option key={index} value={categoryItem}>
            {categoryItem}
          </option>
        ))}
      </select>
      <button onClick={onCancel}>Cancel</button>
      <button onClick={onSave}>Guardar</button>
    </div>
  );
};

const SpecieCard = ({
  data,
  category,
  onCategoryChange,
  categories,
}: {
  data: SpeciesData;
  category?: string;
  onCategoryChange: (newCategory?: string) => void;
  categories: string[];
}) => {
  const [editCategory, setEditCategory] = useState(false);

  const imageUrl =
    data.taxon.default_photo?.square_url?.replace("square", "medium") || "";

  return (
    <div
      style={{ border: "1px solid gray", marginBottom: "8px", padding: "8px" }}
    >
      <img src={imageUrl} alt={data.taxon.name} />
      <p>
        <strong>
          <i>{data.taxon.name} </i>
        </strong>{" "}
        ({data.taxon.preferred_common_name})
      </p>
      <p> [{data.count}]</p>

      {!editCategory ? (
        <button onClick={() => setEditCategory(true)}>Edit Category</button>
      ) : (
        <EditCategory
          category={category}
          categories={categories}
          onDone={(newCategory) => {
            onCategoryChange(newCategory);
            setEditCategory(false);
          }}
          onCancel={() => setEditCategory(false)}
        />
      )}
    </div>
  );
};

export default SpecieCard;

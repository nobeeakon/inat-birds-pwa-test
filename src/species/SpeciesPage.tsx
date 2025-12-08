import { useStorageState } from "@/storage";
import { useState } from "react";
import Header from "@/species/Header";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useFetchSpecies } from "@/species/useFetchSpecies";
import SpeciesCard from "@/species/SpecieCard";

// TODO use a different photo, selected from the observations
// TODO add notes in the specie card

type CategoryType = {
  name: string;
  taxa: string[];
};
type CategoryMapType = Record<string, CategoryType>;

const EditCategories = ({
  categoriesMap,
  onAddCategory,
  onUpdateCategoryName,
  onDeleteCategory,
}: {
  categoriesMap: CategoryMapType;
  onAddCategory: () => void;
  onUpdateCategoryName: (categoryId: string, newName: string) => void;
  onDeleteCategory: (categoryId: string) => void;
}) => {
  return (
    <div>
      <button onClick={onAddCategory}>Add category</button>
      <div>
        {Object.entries(categoriesMap).map(([categoryIdItem, categoryItem]) => (
          <div key={categoryIdItem}>
            <label>
              Name:
              <input
                type="text"
                value={categoryItem.name}
                onChange={(e) =>
                  onUpdateCategoryName(categoryIdItem, e.target.value)
                }
              />{" "}
            </label>{" "}
            <button onClick={() => onDeleteCategory(categoryIdItem)}>
              delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const SpeciesPage = ({
  onShowLatestObservations,
  onShowLocations,
  url,
  currentLocationId,
  updateLocation,
}: {
  onShowLatestObservations: () => void;
  onShowLocations: () => void;
  url: string;
  currentLocationId: string;
  updateLocation: (newLocationId: string) => void;
}) => {
  const [categories, setCategories] = useStorageState<
    Record<string, CategoryType>
  >(LOCAL_STORAGE_KEY.species.speciesCategories, {});
  const [showCategories, setShowCategories] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const getSpecieCategories = (taxonId: number) => {
    const result: { name: string; id: string }[] = [];
    const stringTaxonId = taxonId.toString();
    for (const [categoryId, { name, taxa }] of Object.entries(categories)) {
      if (taxa.includes(stringTaxonId)) {
        result.push({ name, id: categoryId });
      }
    }
    return result;
  };

  const onSpecieCategoryChange = (taxonId: number, newCategoryId: string) => {
    const newCategories = { ...categories };
    const stringTaxonId = taxonId.toString();

    if (newCategoryId) {
      let newTaxa = [...newCategories[newCategoryId].taxa];
      if (newTaxa.includes(stringTaxonId)) {
        newTaxa = newTaxa.filter(
          (taxonIdItem) => taxonIdItem !== stringTaxonId
        );
      } else {
        newTaxa.push(stringTaxonId);
      }

      newCategories[newCategoryId].taxa = newTaxa;
    } else {
      // remove previous
      for (const { taxa } of Object.values(newCategories)) {
        const index = taxa.indexOf(stringTaxonId);
        if (index !== -1) {
          taxa.splice(index, 1);
        }
      }
    }

    setCategories(newCategories);
  };

  const onAddCategory = () => {
    const newCategoryKey = `category-${Date.now()}`;
    const newCategories = {
      ...categories,
      [newCategoryKey]: { name: "", taxa: [] },
    };

    setCategories(newCategories);
  };

  const onUpdateCategoryName = (categoryId: string, newName: string) => {
    const newCategories = { ...categories };
    newCategories[categoryId].name = newName;

    setCategories(newCategories);
  };

  const onDeleteCategory = (categoryId: string) => {
    const newCategories = { ...categories };
    delete newCategories[categoryId];

    setCategories(newCategories);
  };

  const speciesData = useFetchSpecies(url, 10);

  const filteredSpeciesData =
    !searchTerm || !speciesData.data
      ? speciesData.data
      : speciesData.data.filter((item) => {
          const lowerSearchTerm = searchTerm.toLowerCase().trim();

          const includesName = item.taxon.name
            .toLowerCase()
            .includes(lowerSearchTerm);
          const includesCommonName = item.taxon.preferred_common_name
            ?.toLowerCase()
            .includes(lowerSearchTerm);
          const includesCategory = Object.entries(categories).some(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ([_, categoryItem]) => {
              return (
                categoryItem.name.toLowerCase().includes(lowerSearchTerm) &&
                categoryItem.taxa.includes(item.taxon.id.toString())
              );
            }
          );

          return includesName || includesCommonName || includesCategory;
        });

  return (
    <div>
      <Header
        currentLocationId={currentLocationId}
        updateLocation={updateLocation}
        onShowLatestObservations={onShowLatestObservations}
        onShowLocations={onShowLocations}
        onEditCategories={() => setShowCategories((prev) => !prev)}
      />

      {speciesData.loading && <div>Loading...</div>}
      {speciesData.error && <div>Error</div>}
      {filteredSpeciesData && (
        <div>
          <h2>
            Species Data ({filteredSpeciesData.length} /{" "}
            {speciesData.data?.length || 0})
          </h2>

          <div>
            <label htmlFor="search-specie">Search</label>
            <input
              type="text"
              id="search-specie"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {showCategories && (
            <EditCategories
              categoriesMap={categories}
              onAddCategory={onAddCategory}
              onUpdateCategoryName={onUpdateCategoryName}
              onDeleteCategory={onDeleteCategory}
            />
          )}
          {filteredSpeciesData.map((item) => (
            <SpeciesCard
              key={`spp-${item.taxon.id}`}
              data={item}
              speciesCategories={getSpecieCategories(item.taxon.id)}
              allCategories={Object.entries(categories).map(
                ([id, { name }]) => ({ id, name })
              )}
              onCategoryChange={(newCategoryId) => {
                onSpecieCategoryChange(item.taxon.id, newCategoryId || "");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SpeciesPage;

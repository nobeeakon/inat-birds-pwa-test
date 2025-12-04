import { storage } from "@/storage";
import { useState } from "react";
import Header from "@/species/Header";
import { LOCAL_STORAGE_KEY } from "@/constants";
import { useFetchSpecies } from "@/species/useFetchSpecies";
import SpeciesCard from "@/species/SpecieCard";

// TODO add search box by category, name or common name
// TODO floating button to edit categories
// TODO edit category as overlay/modal
// TODO use a different photo, selected from the observations
// TODO add notes in the specie card
// TODO cache the species data
// TODO cache species photo

// TODO share the URL between pages

const EditCategory = () => {
  // TODO edit single category : rename, delete
};

// TODO edit categories: add, rename, delete
const EditCategories = ({}: { onAddCategory: () => void }) => {
  return (
    <div>
      <input type="text" /> <button>Add Category</button>
    </div>
  );
};

const SpeciesPage = ({
  onShowLatestObservations,
}: {
  onShowLatestObservations: () => void;
}) => {
  const [url, setUrl] = useState(
    () => storage.get<string>(LOCAL_STORAGE_KEY.species.lastUrl) ?? ""
  );
  const [categories, setCategories] = useState(
    () =>
      storage.get<Record<string, string[]>>(
        LOCAL_STORAGE_KEY.species.speciesCategories
      ) ?? {}
  );

  const getSpecieCategory = (taxonId: number) => {
    const stringTaxonId = taxonId.toString();
    for (const [category, taxa] of Object.entries(categories)) {
      if (taxa.includes(stringTaxonId)) {
        return category;
      }
    }
  };

  const onSpecieCategoryChange = (taxonId: number, newCategory: string) => {
    const newCategories = { ...categories };
    const stringTaxonId = taxonId.toString();

    // remove previous
    for (const taxa of Object.values(newCategories)) {
      const index = taxa.indexOf(stringTaxonId);
      if (index !== -1) {
        taxa.splice(index, 1);
      }
    }

    // add to new category
    if (newCategory && !newCategories[newCategory]) {
      newCategories[newCategory] = [];
    }
    if (newCategory) {
      newCategories[newCategory].push(stringTaxonId);
    }

    setCategories(newCategories);
    storage.set<Record<string, string[]>>(
      LOCAL_STORAGE_KEY.species.speciesCategories,
      newCategories
    );
  };

  const speciesData = useFetchSpecies(url, 20);

  return (
    <div>
      <Header
        value={url}
        onSelected={setUrl}
        onShowLatestObservations={onShowLatestObservations}
      />

      {speciesData.loading && <div>Loading...</div>}
      {speciesData.error && <div>Error</div>}
      {speciesData.data && (
        <div>
          <h2>Species Data ({speciesData.data.length})</h2>
          {speciesData.data.map((item) => (
            <SpeciesCard
              key={`spp-${item.taxon.id}`}
              data={item}
              categories={Object.keys(categories)}
              category={getSpecieCategory(item.taxon.id)}
              onCategoryChange={(newCategory) => {
                onSpecieCategoryChange(item.taxon.id, newCategory || "");
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SpeciesPage;

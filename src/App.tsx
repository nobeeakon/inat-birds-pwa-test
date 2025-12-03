import { useState } from "react";
import "./App.css";

import { useFetchDataPages, type ObservationType } from "./fetchData";
import { storage } from "./storage";


const Card = ({
  data,
  onNext,
  onPrevious,
  onObservationIdentified,
}: {
  data: ObservationType;
  onNext: () => void;
  onPrevious: () => void;
  onObservationIdentified: ()=> void;
}) => {
  const [showTaxa, setShowTaxa] = useState(false);

  const imgUrl =
    data.photos && data.photos.length > 0
      ? data.photos[0].url.replace("square", "original")
      : null;

  return (
    <div
      style={{

        marginBottom: "16px",
        marginTop: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        <button onClick={() => setShowTaxa(true)} style={{backgroundColor: "lightblue"}}>Show</button>
        <button onClick={onObservationIdentified} style={{backgroundColor: "lightgreen"}}>OK</button>
        <button onClick={onNext}>Again</button>
        <button onClick={onPrevious}>Prev</button>
      </div>
      {showTaxa && (
          <p >
            <strong>
              <i>{data.taxon?.name} </i>
            </strong>{" "}
            ({data.taxon?.preferred_common_name})
          </p>
      )}
      {!!imgUrl && (
        <img
          src={imgUrl}
          alt={data.taxon?.preferred_common_name || "Observation Photo"}
          style={{ maxWidth: "340px" }}
        />
      )}
    </div>
  );
};

const STORED_URLS_KEY = "stored-urls";

type StoredUrlType = {
  name: string;
  url: string;
};

const StoredUrl = ({
  value,
  onSelected,
  isRandom,
  onToggleRandom,
  onExcludeTaxa,
  showEditExcludedTaxa,
  toggleEditExcludedTaxa,
}: {
  value: string;
  onSelected: (url: string) => void;
  isRandom: boolean;
  onToggleRandom: () => void;
  onExcludeTaxa: () => void;
 showEditExcludedTaxa:boolean;
  toggleEditExcludedTaxa: () => void;
}) => {
  const [edit, setEdit] = useState(false);
  const [url, setUrl] = useState(
    storage.get<StoredUrlType[]>(STORED_URLS_KEY) || []
  );

  const updateStoredUrls = (newUrls: StoredUrlType[]) => {
    setUrl(newUrls);
    storage.set<StoredUrlType[]>(STORED_URLS_KEY, newUrls);
  };

  if (!edit) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <select value={value} onChange={(e) => onSelected(e.target.value)}>
          <option value="">Select stored URL</option>
          {url.map((storedUrl, index) => (
            <option key={index} value={storedUrl.url.trim()}>
              {storedUrl.name}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => setEdit(true)}>Edit</button>
          <button onClick={onToggleRandom}>
            {isRandom ? "Random On" : "Random Off"}
          </button>
          <button onClick={onExcludeTaxa}>Excluir</button>
          <button onClick={toggleEditExcludedTaxa}>
            {showEditExcludedTaxa?"Ocultar editar excluir taxa":"Editar excluir"}
          </button>
        </div>
       
      </div>
    );
  }

  return (
    <div>
      {url.map((storedUrl, index) => (
        <div key={index}>
          <label>
            <span>Name:</span>
            <input
              type="text"
              value={storedUrl.name}
              onChange={(e) => {
                const newUrls = [...url];
                newUrls[index].name = e.target.value;
                updateStoredUrls(newUrls);
              }}
            />
          </label>
          <label>
            <span>URL:</span>
            <input
              type="text"
              value={storedUrl.url}
              onChange={(e) => {
                const newUrls = [...url];
                newUrls[index].url = e.target.value;
                updateStoredUrls(newUrls);
              }}
            />
          </label>
          <button
            onClick={() => {
              const newUrls = url.filter((_, i) => i !== index);
              updateStoredUrls(newUrls);
            }}
          >
            Delete
          </button>
        </div>
      ))}
      <div>
        <button
          onClick={() => {
            const newUrls = [...url, { name: "", url: "" }];
            updateStoredUrls(newUrls);
          }}
        >
          Add
        </button>
      </div>
      <div>
        <button onClick={() => setEdit(false)}>Done</button>
      </div>
    </div>
  );
};

// https://api.inaturalist.org/v2/observations?verifiable=true&order_by=id&order=desc&page=7&spam=false&lat=20.54454801218982&lng=-100.38172842219655&radius=24.739610563075544&locale=es-MX&preferred_place_id=6793&iconic_taxa%5B%5D=Aves&per_page=24&no_total_hits=true&fields=(comments_count%3A!t%2Ccreated_at%3A!t%2Ccreated_at_details%3Aall%2Ccreated_time_zone%3A!t%2Cfaves_count%3A!t%2Cgeoprivacy%3A!t%2Cid%3A!t%2Cidentifications%3A(current%3A!t)%2Cidentifications_count%3A!t%2Clocation%3A!t%2Cmappable%3A!t%2Cobscured%3A!t%2Cobserved_on%3A!t%2Cobserved_on_details%3Aall%2Cobserved_time_zone%3A!t%2Cphotos%3A(id%3A!t%2Curl%3A!t)%2Cplace_guess%3A!t%2Cprivate_geojson%3A!t%2Cquality_grade%3A!t%2Csounds%3A(id%3A!t)%2Ctaxon%3A(iconic_taxon_id%3A!t%2Cname%3A!t%2Cpreferred_common_name%3A!t%2Cpreferred_common_names%3A(name%3A!t)%2Crank%3A!t%2Crank_level%3A!t)%2Ctime_observed_at%3A!t%2Cuser%3A(icon_url%3A!t%2Cid%3A!t%2Clogin%3A!t))

const LAST_URL_KEY = "last-url";
const EXCLUDED_TAXA_STORAGE_KEY = "excluded-taxa";
const IDENTIFIED_OBSERVATIONS_UUIDS_KEY = "identified-observations";


function App() {
  const [url, setUrl] = useState(() => storage.get<string>(LAST_URL_KEY) || "");
  const query = useFetchDataPages(url);
  const [isRandom, setIsRandom] = useState(true);
  const [indices, setIndices] = useState([{index:0, isRandom}]);
  const [showEditExcludedTaxa, setShowEditExcludedTaxa] = useState(false);
  const [taxaToExclude, setTaxaToExclude] = useState<Record<string, string>>(
    storage.get<Record<string, string>>(EXCLUDED_TAXA_STORAGE_KEY) || {}
  );
    const [identifiedObservationsUuids, setIdentifiedObservationsUuids] = useState<string[]>(storage.get<string[]>(IDENTIFIED_OBSERVATIONS_UUIDS_KEY) || [])

  const filteredData = query.data?.filter(
    (item) => !(item.taxon.id in taxaToExclude) && identifiedObservationsUuids.indexOf(item.uuid.toString()) === -1
  );

  const onNext = () => {
    if (isRandom) {
      const randomIndex = Math.floor(
        Math.random() * (filteredData?.length || 1)
      );
      setIndices((prev) => [...prev, {index: randomIndex, isRandom}]);
    } else {
      const lastIndex = indices[indices.length - 1];
      const nextIndex = lastIndex.isRandom? 0 : lastIndex.index + 1;
      setIndices((prev) => [...prev, {index: nextIndex, isRandom}]);
    }
  };

  const onPrevious = () => {
    if (indices.length <= 1) return;

    setIndices((prev) => prev.slice(0, prev.length - 1));
  };

  const onExcludeTaxa = () => {
    const dataItem = (filteredData ?? [])[indices[indices.length - 1].index];
    if (!dataItem) return;

    const newTaxaToExclude = {
      ...taxaToExclude,
      [dataItem.taxon.id]: dataItem.taxon.name,
    };

    setTaxaToExclude(newTaxaToExclude);
    storage.set<Record<string, string>>(
      EXCLUDED_TAXA_STORAGE_KEY,
      newTaxaToExclude
    );

    // Move to next item
    onNext();
  };

  const onObservationIdentified = (observationUuid: string) => {
    const identifiedUuids = storage.get<string[]>(IDENTIFIED_OBSERVATIONS_UUIDS_KEY) || [];
    if (!identifiedUuids.includes(observationUuid)) {
      identifiedUuids.push(observationUuid);


      if (identifiedUuids.length > 600) {
        identifiedUuids.shift();
      }

      storage.set<string[]>(IDENTIFIED_OBSERVATIONS_UUIDS_KEY, identifiedUuids);
    }

    setIdentifiedObservationsUuids(prev => ([...prev,observationUuid]));
    onNext();
  }

  const onSelectUrl = (newUrl: string) => {
    setIndices([{index:0, isRandom}]);
    setUrl(newUrl);
    storage.set(LAST_URL_KEY, newUrl);
  };

  const currendIdx = indices[indices.length - 1].index;
  const dataItem = (filteredData ?? [])[currendIdx];

  return (
    <>
      <div>
        <StoredUrl
          onExcludeTaxa={onExcludeTaxa}
          value={url}
          onSelected={onSelectUrl}
          isRandom={isRandom}
          onToggleRandom={() => setIsRandom(!isRandom)}
          showEditExcludedTaxa={showEditExcludedTaxa}
          toggleEditExcludedTaxa={() => setShowEditExcludedTaxa(!showEditExcludedTaxa)}
        />
      </div>

      {showEditExcludedTaxa && (  
        <div>
          {Object.entries(taxaToExclude).map(([taxonId, taxonName]) => (
            <div key={taxonId} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span>
                {taxonName} (ID: {taxonId})
              </span>
              <button
                onClick={() => {
                  const newTaxaToExclude = { ...taxaToExclude };
                  delete newTaxaToExclude[taxonId];
                  setTaxaToExclude(newTaxaToExclude);
                  storage.set<Record<string, string>>(
                    EXCLUDED_TAXA_STORAGE_KEY,
                    newTaxaToExclude
                  );
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        {query.loading && <p>Loading...</p>}
        {query.error && <p>Error fetching data.</p>}
        {dataItem && (
          <Card
            key={`card-${currendIdx}`}
            data={dataItem}
            onNext={onNext}
            onPrevious={onPrevious}
            onObservationIdentified={() => onObservationIdentified(dataItem.uuid.toString())}
          />
        )}
      </div>
    </>
  );
}

export default App;

import { useState } from "react";

import { storage } from "@/storage";
import { LOCAL_STORAGE_KEY } from "@/constants";

export type StoredUrlType = {
  name: string;
  url: string;
};

const EditUrls = ({ onDone }: { onDone: () => void }) => {
  const [url, setUrl] = useState(
    storage.get<StoredUrlType[]>(LOCAL_STORAGE_KEY.STORED_URLS_KEY) || []
  );

  const updateStoredUrls = (newUrls: StoredUrlType[]) => {
    setUrl(newUrls);
    storage.set<StoredUrlType[]>(LOCAL_STORAGE_KEY.STORED_URLS_KEY, newUrls);
  };

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
        <button onClick={onDone}>Done</button>
      </div>
    </div>
  );
};

const Header = ({
  value,
  toggleEditUrls,
  onSelected,
  onExcludeTaxa,
  toggleEditExcludedTaxa,
  onShowSpecies,
}: {
  value: string;
  toggleEditUrls: () => void;
  onSelected: (url: string) => void;
  onExcludeTaxa: () => void;
  toggleEditExcludedTaxa: () => void;
  onShowSpecies: () => void;
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [url] = useState(
    storage.get<StoredUrlType[]>(LOCAL_STORAGE_KEY.STORED_URLS_KEY) || []
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <label htmlFor="url-selector">Data:</label>
        <select
          id="url-selector"
          value={value}
          onChange={(e) => onSelected(e.target.value)}
        >
          <option value="">Select stored URL</option>
          {url.map((storedUrl, index) => (
            <option key={index} value={storedUrl.url.trim()}>
              {storedUrl.name}
            </option>
          ))}
        </select>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <button onClick={onExcludeTaxa}>Excluir</button>
          <button onClick={() => setShowConfig(!showConfig)}>Config</button>
          <button onClick={onShowSpecies}>Species</button>
        </div>
      </div>
      {showConfig && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginTop: "1rem",
            border: "1px solid #ccc",
            padding: "0.5rem",
          }}
        >
          <button onClick={toggleEditUrls}>URLs</button>

          <button onClick={toggleEditExcludedTaxa}>Excluir spp.</button>
        </div>
      )}
    </div>
  );
};

const HeaderWrapper = ({
  value,
  onSelected,
  onExcludeTaxa,
  toggleEditExcludedTaxa,
  onShowSpecies,
}: {
  value: string;
  onSelected: (url: string) => void;
  onExcludeTaxa: () => void;
  toggleEditExcludedTaxa: () => void;
  onShowSpecies: () => void;
}) => {
  const [edit, setEdit] = useState(false);

  if (edit) {
    return <EditUrls onDone={() => setEdit(false)} />;
  }

  return (
    <Header
      value={value}
      toggleEditUrls={() => setEdit(true)}
      onSelected={onSelected}
      onExcludeTaxa={onExcludeTaxa}
      toggleEditExcludedTaxa={toggleEditExcludedTaxa}
      onShowSpecies={onShowSpecies}
    />
  );
};

export default HeaderWrapper;

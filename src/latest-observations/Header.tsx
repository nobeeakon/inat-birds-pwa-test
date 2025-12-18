import { useState } from "react";

import { useLocationsContext } from "@/LocationsContext";

export type StoredUrlType = {
  name: string;
  url: string;
};

const Header = ({
  currentLocationId,
  updateLocation,
  onExcludeTaxa,
  toggleEditExcludedTaxa,
  onShowSpecies,
  onShowLocations,
}: {
  currentLocationId: string;
  updateLocation: (newLocationId: string) => void;
  onExcludeTaxa: () => void;
  toggleEditExcludedTaxa: () => void;
  onShowSpecies: () => void;
  onShowLocations: () => void;
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const locations = useLocationsContext().locationsInfo;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <button onClick={onShowSpecies}>Species</button>
          <button onClick={onExcludeTaxa}>Excluir</button>
          <button onClick={() => setShowConfig(!showConfig)}>Config</button>
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
          <label htmlFor="url-selector">Data:</label>
          <select
            id="url-selector"
            value={currentLocationId}
            onChange={(e) => updateLocation(e.target.value)}
          >
            <option value="">Select Location</option>
            {locations.map((locationItem) => (
              <option key={locationItem.id} value={locationItem.id}>
                {locationItem.name}
              </option>
            ))}
          </select>
          <button onClick={onShowLocations}>Edit locations</button>

          <button onClick={toggleEditExcludedTaxa}>Excluir spp.</button>
        </div>
      )}
    </div>
  );
};

export default Header;

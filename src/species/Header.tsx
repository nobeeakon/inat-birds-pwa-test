import { useState } from "react";

import { useLocationsContext } from "@/LocationsContext";

const Header = ({
  currentLocationId,
  updateLocation,
  onShowLatestObservations,
  onShowLocations,
  onEditCategories,
}: {
  currentLocationId: string;
  updateLocation: (locationId: string) => void;
  onShowLatestObservations: () => void;
  onShowLocations: () => void;
  onEditCategories: () => void;
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const locations = useLocationsContext().locationsInfo;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <label htmlFor="url-selector">Data:</label>
        <select
          id="url-selector"
          value={currentLocationId}
          onChange={(e) => updateLocation(e.target.value)}
        >
          <option value="">Select location</option>
          {locations.map((locationItem) => (
            <option key={locationItem.id} value={locationItem.id}>
              {locationItem.name}
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
          <button onClick={() => setShowConfig(!showConfig)}>Config</button>
          <button onClick={onShowLatestObservations}>Observations</button>
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
          }}
        >
          <button onClick={onShowLocations}>Edit locations</button>
          <button onClick={onEditCategories}>Edit categories</button>
        </div>
      )}
    </div>
  );
};

export default Header;

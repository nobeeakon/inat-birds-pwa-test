import { useState } from "react";
import { useLocationsContext } from "@/LocationsContext";
import type { LocationInformation } from "@/types";
import Map from "@/components/Map";

const EditLocation = ({
  location,
  updateLocation,
  onDone,
  onDeleteLocation,
}: {
  location: LocationInformation;
  updateLocation: (location: LocationInformation) => void;
  onDone: () => void;
  onDeleteLocation: () => void;
}) => {
  const [isMapClickEnabled, setIsMapClickEnabled] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onDone();
  };

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateLocation({
            ...location,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Could not get your location");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h3>Select Location</h3>
        <button
          type="button"
          onClick={() => setIsMapClickEnabled(!isMapClickEnabled)}
          style={{
            marginBottom: "10px",
            padding: "8px 16px",
            backgroundColor: isMapClickEnabled ? "#4CAF50" : "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isMapClickEnabled
            ? "✓ Click on Map Enabled"
            : "📍 Enable Click on Map"}
        </button>
        <Map
          center={[location.lat, location.lng]}
          zoom={12}
          radius={location.radius}
          height="300px"
          onMapClick={
            isMapClickEnabled
              ? (lat, lng) => {
                  updateLocation({ ...location, lat, lng });
                }
              : undefined
          }
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name:
            <input
              type="text"
              value={location.name}
              onChange={(e) =>
                updateLocation({ ...location, name: e.target.value })
              }
              required
            />
          </label>
        </div>
        <div>
          <label>
            Latitude:
            <input
              type="number"
              step="any"
              value={location.lat}
              onChange={(e) =>
                updateLocation({ ...location, lat: Number(e.target.value) })
              }
              required
            />
          </label>
        </div>
        <div>
          <label>
            Longitude:
            <input
              type="number"
              step="any"
              value={location.lng}
              onChange={(e) =>
                updateLocation({ ...location, lng: Number(e.target.value) })
              }
              required
            />
          </label>
        </div>

        <div>
          <label>
            Radius (km):
            <input
              type="number"
              step="any"
              value={location.radius}
              onChange={(e) =>
                updateLocation({ ...location, radius: Number(e.target.value) })
              }
              required
            />
          </label>
        </div>
        <div>
          <button type="button" onClick={handleGetCurrentLocation}>
            📍 Use Current Location
          </button>
          <button type="submit">Done</button>
        </div>
      </form>
      <button onClick={onDeleteLocation}>Eliminar</button>
    </div>
  );
};

const DEFAULT_NEW_LOCATION: LocationInformation = {
  id: "",
  name: "",
  lat: 20,
  lng: -99,
  radius: 5,
};

const LocationsPage = ({
  onShowObservationsPage,
}: {
  onShowObservationsPage: () => void;
}) => {
  const { locationsInfo, setLocationsInfo } = useLocationsContext();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const selectedLocation =
    locationsInfo.find((loc) => loc.id === selectedLocationId) ?? null;

  const onDeleteLocation = (locationId: string) => {
    const newLocations = locationsInfo.filter((loc) => loc.id !== locationId);
    setLocationsInfo(newLocations);
    setSelectedLocationId(null);
  };

  const onAddNewLocation = () => {
    const newLocation: LocationInformation = {
      ...DEFAULT_NEW_LOCATION,
      id: `loc-${Date.now()}`, // Simple unique ID
      name: `Location ${locationsInfo.length + 1}`,
    };
    setLocationsInfo([...locationsInfo, newLocation]);
    setSelectedLocationId(newLocation.id);
  };

  return (
    <div>
      <div>
        {locationsInfo.length > 0 && (
          <button onClick={onShowObservationsPage}>Done</button>
        )}
        <button onClick={onAddNewLocation}>Add Location</button>
      </div>

      {selectedLocation ? (
        <EditLocation
          location={selectedLocation}
          onDeleteLocation={() => onDeleteLocation(selectedLocation.id)}
          updateLocation={(updatedLocation) => {
            const newLocations = locationsInfo.map((loc) =>
              loc.id === updatedLocation.id ? updatedLocation : loc
            );
            setLocationsInfo(newLocations);
          }}
          onDone={() => setSelectedLocationId(null)}
        />
      ) : (
        <div>
          {locationsInfo.map((locationItem, index) => (
            <div
              key={locationItem.id}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
                display: "flex",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <span>
                Name: {locationItem.name}. Radius (km): {locationItem.radius}
              </span>

              <button onClick={() => setSelectedLocationId(locationItem.id)}>
                Editar
              </button>
              <button
                onClick={() => {
                  const newLocations = locationsInfo.filter(
                    (_, i) => i !== index
                  );
                  setLocationsInfo(newLocations);
                }}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationsPage;

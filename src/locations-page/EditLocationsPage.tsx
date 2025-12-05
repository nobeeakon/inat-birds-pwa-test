import { useState } from "react";
import { useLocationsContext } from "@/LocationsContext";
import type { LocationInformation } from "@/types";

const EditLocations = ({
  locations,
  setLocations,
}: {
  locations: LocationInformation[];
  setLocations: (locations: LocationInformation[]) => void;
}) => {
  return (
    <div>
      {locations.map((locationItem, index) => (
        <div key={locationItem.id}>
          <label>
            <span>Name:</span>
            <input
              type="text"
              value={locationItem.name}
              onChange={(e) => {
                const newLocations = [...locations];
                newLocations[index].name = e.target.value;
                setLocations(newLocations);
              }}
            />
          </label>
          <label>
            <span>Latitude:</span>
            <input
              type="number"
              value={locationItem.lat}
              onChange={(e) => {
                const newLocations = [...locations];

                newLocations[index].lat = Number(e.target.value);
                setLocations(newLocations);
              }}
            />
          </label>
          <label>
            <span>Longitude:</span>
            <input
              type="number"
              value={locationItem.lng}
              onChange={(e) => {
                const newLocations = [...locations];

                newLocations[index].lng = Number(e.target.value);
                setLocations(newLocations);
              }}
            />
          </label>
          <label>
            <span>Radio:</span>
            <input
              type="number"
              value={locationItem.radius}
              onChange={(e) => {
                const newLocations = [...locations];

                newLocations[index].radius = Number(e.target.value);
                setLocations(newLocations);
              }}
            />
          </label>
          <button
            onClick={() => {
              const newLocations = locations.filter((_, i) => i !== index);
              setLocations(newLocations);
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

const AddLocation = () => {
  const { locationsInfo, setLocationsInfo } = useLocationsContext();
  const [formData, setFormData] = useState<
    Pick<LocationInformation, "name" | "lat" | "lng" | "radius">
  >({
    name: "",
    lat: 0,
    lng: 0,
    radius: 5,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setLocationsInfo([
      ...locationsInfo,
      {
        id: crypto.randomUUID(),
        name: formData.name,
        lat: formData.lat,
        lng: formData.lng,
        radius: 10,
      },
    ]);

    setFormData({
      name: "",
      lat: 0,
      lng: 0,
      radius: 5,
    });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name:
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
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
              value={formData.lat}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lat: Number(e.target.value),
                }))
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
              value={formData.lng}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  lng: Number(e.target.value),
                }))
              }
              required
            />
          </label>
        </div>

        <div>
          <label>
            Radius:
            <input
              type="number"
              value={formData.radius}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  radius: Number(e.target.value),
                }))
              }
              required
            />
          </label>
        </div>
        <div>
          <button type="submit">Add Location</button>
        </div>
      </form>
    </div>
  );
};

const Header = ({
  hasLocations,
  isAddLocation,
  toggleIsAddLocation,
  onShowObservationsPage,
}: {
  hasLocations: boolean;
  isAddLocation: boolean;
  toggleIsAddLocation: () => void;
  onShowObservationsPage: () => void;
}) => {
  return (
    <div>
      {hasLocations && <button onClick={onShowObservationsPage}>Done</button>}
      <button onClick={() => toggleIsAddLocation()}>
        {isAddLocation && hasLocations
          ? "Editar Locations"
          : "Agregar Location"}
      </button>
    </div>
  );
};

const LocationsPage = ({
  onShowObservationsPage,
}: {
  onShowObservationsPage: () => void;
}) => {
  const [isAddLocation, setIsAddLocation] = useState(false);
  const { locationsInfo, setLocationsInfo } = useLocationsContext();

  return (
    <div>
      <Header
        hasLocations={locationsInfo.length > 0}
        isAddLocation={isAddLocation}
        toggleIsAddLocation={() => setIsAddLocation(!isAddLocation)}
        onShowObservationsPage={onShowObservationsPage}
      />
      {isAddLocation || locationsInfo.length === 0 ? (
        <AddLocation />
      ) : (
        <EditLocations
          locations={locationsInfo}
          setLocations={setLocationsInfo}
        />
      )}
    </div>
  );
};

export default LocationsPage;

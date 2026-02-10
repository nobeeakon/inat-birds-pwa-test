import { useState } from "react";
import {
  TextField,
  Button,
  Stack,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
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
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Select Location
        </Typography>
        <Button
          type="button"
          onClick={() => setIsMapClickEnabled(!isMapClickEnabled)}
          variant={isMapClickEnabled ? "contained" : "outlined"}
          color={isMapClickEnabled ? "success" : "primary"}
          sx={{ mb: 2 }}
        >
          {isMapClickEnabled
            ? "✓ Click on Map Enabled"
            : "📍 Enable Click on Map"}
        </Button>
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
      </Box>

      <Stack component="form" onSubmit={handleSubmit} spacing={2}>
        <TextField
          label="Name"
          value={location.name}
          onChange={(e) =>
            updateLocation({ ...location, name: e.target.value })
          }
          required
          fullWidth
        />
        <TextField
          label="Latitude"
          type="number"
          inputProps={{ step: "any" }}
          value={location.lat}
          onChange={(e) =>
            updateLocation({ ...location, lat: Number(e.target.value) })
          }
          required
          fullWidth
        />
        <TextField
          label="Longitude"
          type="number"
          inputProps={{ step: "any" }}
          value={location.lng}
          onChange={(e) =>
            updateLocation({ ...location, lng: Number(e.target.value) })
          }
          required
          fullWidth
        />
        <TextField
          label="Radius (km)"
          type="number"
          inputProps={{ step: "any" }}
          value={location.radius}
          onChange={(e) =>
            updateLocation({ ...location, radius: Number(e.target.value) })
          }
          required
          fullWidth
        />
        <Stack direction="row" spacing={1}>
          <Button type="button" onClick={handleGetCurrentLocation}>
            📍 Use Current Location
          </Button>
          <Button type="submit" variant="contained">
            Done
          </Button>
        </Stack>
      </Stack>
      <Button onClick={onDeleteLocation} color="error" sx={{ mt: 2 }}>
        Eliminar
      </Button>
    </Box>
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
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {locationsInfo.length > 0 && (
          <Button onClick={onShowObservationsPage} variant="contained">
            Done
          </Button>
        )}
        <Button onClick={onAddNewLocation} variant="outlined">
          Add Location
        </Button>
      </Stack>

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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Radius (km)</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locationsInfo.map((locationItem, index) => (
                <TableRow key={locationItem.id}>
                  <TableCell>{locationItem.name}</TableCell>
                  <TableCell>{locationItem.radius}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={() => setSelectedLocationId(locationItem.id)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          const newLocations = locationsInfo.filter(
                            (_, i) => i !== index
                          );
                          setLocationsInfo(newLocations);
                        }}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default LocationsPage;

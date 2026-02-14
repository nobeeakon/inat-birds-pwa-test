import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
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
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
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
  const { t } = useTranslation();
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
          alert(t("couldNotGetLocation"));
        }
      );
    } else {
      alert(t("geolocationNotSupported"));
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t("selectLocation")}
        </Typography>
        <Button
          type="button"
          onClick={() => setIsMapClickEnabled(!isMapClickEnabled)}
          variant={isMapClickEnabled ? "contained" : "outlined"}
          color={isMapClickEnabled ? "success" : "primary"}
          sx={{ mb: 2 }}
        >
          {isMapClickEnabled ? t("clickOnMapEnabled") : t("enableClickOnMap")}
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
          label={t("name")}
          value={location.name}
          onChange={(e) =>
            updateLocation({ ...location, name: e.target.value })
          }
          required
          fullWidth
        />
        <TextField
          label={t("latitude")}
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
          label={t("longitude")}
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
          label={t("radiusKm")}
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
            {t("useCurrentLocation")}
          </Button>
          <Button type="submit" variant="contained">
            {t("done")}
          </Button>
        </Stack>
      </Stack>
      <Button onClick={onDeleteLocation} color="error" sx={{ mt: 2 }}>
        {t("delete")}
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

const LocationsPage = () => {
  const { t } = useTranslation();
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
      name: t("locationNumber", { number: locationsInfo.length + 1 }),
    };
    setLocationsInfo([...locationsInfo, newLocation]);
    setSelectedLocationId(newLocation.id);
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Stack direction="row" spacing={1} sx={{ flexGrow: 1 }}>
            {locationsInfo.length > 0 && (
              <Button component={Link} to="/observations" color="inherit">
                {t("done")}
              </Button>
            )}
            <Button onClick={onAddNewLocation} color="inherit">
              {t("addLocation")}
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Box sx={{ mt: 2, px: 4 }}>
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
                  <TableCell>{t("name")}</TableCell>
                  <TableCell>{t("radiusKm")}</TableCell>
                  <TableCell>{t("actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locationsInfo.map((locationItem, index) => (
                  <TableRow key={locationItem.id}>
                    <TableCell>
                      <Link to={`/observations?location=${locationItem.id}`}>
                        {locationItem.name}
                      </Link>
                    </TableCell>
                    <TableCell>{locationItem.radius}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          onClick={() => setSelectedLocationId(locationItem.id)}
                        >
                          {t("edit")}
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
                          {t("delete")}
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
    </Box>
  );
};

export default LocationsPage;

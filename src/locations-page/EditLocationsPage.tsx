import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import AddIcon from "@mui/icons-material/Add";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import { useLocationsContext } from "@/LocationsContext";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import type { LocationInformation } from "@/types";
import Map from "@/components/Map";
import { ADD_LOCATION_SEARCH_PARAM } from "./addLocationParam";

const EditLocation = ({
  location,
  isNewLocation,
  updateLocation,
  onDone,
  onDiscardLocation,
}: {
  location: LocationInformation;
  isNewLocation: boolean;
  updateLocation: (location: LocationInformation) => void;
  onDone: () => void;
  onDiscardLocation: () => void;
}) => {
  const { t } = useTranslation();
  const [isMapClickEnabled, setIsMapClickEnabled] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (location.name.trim() === "") {
      return;
    }

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
      <Typography variant="h6" sx={{ mb: 2 }}>
        {isNewLocation ? t("addLocation") : t("selectLocation")}
      </Typography>
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

        <Stack
          direction="row"
          spacing={4}
          sx={{ display: "flex", justifyContent: "center" }}
        >
          <Button
            onClick={onDiscardLocation}
            color={isNewLocation ? "primary" : "error"}
            sx={{ mt: 2 }}
          >
            {isNewLocation ? t("cancel") : t("delete")}
          </Button>

          <Button type="submit" variant="contained">
            {isNewLocation ? t("save") : t("done")}
          </Button>
        </Stack>
      </Stack>
      <Box sx={{ mb: 3, mt: 2 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Button
            type="button"
            onClick={() => setIsMapClickEnabled(!isMapClickEnabled)}
            variant={isMapClickEnabled ? "contained" : "outlined"}
            startIcon={isMapClickEnabled ? undefined : <TouchAppIcon />}
          >
            {isMapClickEnabled ? t("clickOnMapEnabled") : t("enableClickOnMap")}
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={handleGetCurrentLocation}
            startIcon={<MyLocationIcon />}
          >
            {t("useCurrentLocation")}
          </Button>
        </Stack>
        <Map
          center={[location.lat, location.lng]}
          zoom={12}
          radius={location.radius}
          height="400px"
          onMapClick={
            isMapClickEnabled
              ? (lat, lng) => {
                  updateLocation({ ...location, lat, lng });
                }
              : undefined
          }
        />
      </Box>
    </Box>
  );
};

const DEFAULT_NEW_LOCATION: LocationInformation = {
  id: "",
  name: "",
  lat: 20.541081392376856,
  lng: -100.37336899427861,
  radius: 5,
};

const buildNewLocation = (): LocationInformation => ({
  ...DEFAULT_NEW_LOCATION,
  id: `loc-${Date.now()}`, // Simple unique ID
});

const LocationsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { locationsInfo, setLocationsInfo } = useLocationsContext();
  const { setCurrentLocationId } = useCurrentLocation();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  // A location being created lives here, out of the saved list, until the user submits the
  // form. Otherwise abandoning the form leaves an unfilled default location behind.
  // A user with nothing saved came here to add their first location, and so did one who
  // arrived from the location selector, so the form starts open rather than behind one
  // more button.
  const [newLocationDraft, setNewLocationDraft] =
    useState<LocationInformation | null>(() =>
      locationsInfo.length === 0 || searchParams.has(ADD_LOCATION_SEARCH_PARAM)
        ? buildNewLocation()
        : null
    );

  // Dropped once the form it asked for is resolved, so reloading or coming back does not
  // reopen it
  const forgetAddLocationRequest = () => {
    if (!searchParams.has(ADD_LOCATION_SEARCH_PARAM)) {
      return;
    }

    const remainingParams = new URLSearchParams(searchParams);
    remainingParams.delete(ADD_LOCATION_SEARCH_PARAM);
    setSearchParams(remainingParams, { replace: true });
  };

  const savedSelectedLocation =
    locationsInfo.find((loc) => loc.id === selectedLocationId) ?? null;
  const editedLocation = newLocationDraft ?? savedSelectedLocation;

  const onDeleteLocation = (locationId: string) => {
    const newLocations = locationsInfo.filter((loc) => loc.id !== locationId);
    setLocationsInfo(newLocations);
    setSelectedLocationId(null);
  };

  const onAddNewLocation = () => {
    setSelectedLocationId(null);
    setNewLocationDraft(buildNewLocation());
  };

  const onUpdateEditedLocation = (updatedLocation: LocationInformation) => {
    if (newLocationDraft) {
      setNewLocationDraft(updatedLocation);
      return;
    }

    const newLocations = locationsInfo.map((loc) =>
      loc.id === updatedLocation.id ? updatedLocation : loc
    );
    setLocationsInfo(newLocations);
  };

  const goToObservationsOf = (locationId: string) => {
    setCurrentLocationId(locationId);
    navigate("/observations");
  };

  // Straight to the observations of the location that was just edited, rather than back
  // to the table: editing it is how the user says which one they are interested in
  const onDoneEditing = () => {
    if (newLocationDraft) {
      setLocationsInfo([...locationsInfo, newLocationDraft]);
      setNewLocationDraft(null);
      forgetAddLocationRequest();
      goToObservationsOf(newLocationDraft.id);
      return;
    }

    setSelectedLocationId(null);

    if (savedSelectedLocation) {
      goToObservationsOf(savedSelectedLocation.id);
    }
  };

  const onDiscardEditedLocation = () => {
    if (newLocationDraft) {
      setNewLocationDraft(null);
      forgetAddLocationRequest();
      return;
    }

    if (savedSelectedLocation) {
      onDeleteLocation(savedSelectedLocation.id);
    }
  };

  return (
    <Box>
      <Box sx={{ mt: 2, px: 4 }}>
        {editedLocation ? (
          <EditLocation
            location={editedLocation}
            isNewLocation={newLocationDraft !== null}
            onDiscardLocation={onDiscardEditedLocation}
            updateLocation={onUpdateEditedLocation}
            onDone={onDoneEditing}
          />
        ) : locationsInfo.length === 0 ? (
          // Only reached by backing out of the form, since an empty list opens it; the
          // home screen is what explains the app to a first-time user
          <Stack spacing={2} sx={{ alignItems: "center", py: 8 }}>
            <Typography variant="body1" sx={{ textAlign: "center" }}>
              {t("noLocationsYet")}
            </Typography>
            <Button
              onClick={onAddNewLocation}
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
            >
              {t("addLocation")}
            </Button>
            <Button component={Link} to="/" size="small">
              {t("back")}
            </Button>
          </Stack>
        ) : (
          <>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button
                onClick={onAddNewLocation}
                variant="contained"
                startIcon={<AddIcon />}
              >
                {t("addLocation")}
              </Button>
            </Stack>
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
                        <Link
                          to="/observations"
                          onClick={() => setCurrentLocationId(locationItem.id)}
                        >
                          {locationItem.name}
                        </Link>
                      </TableCell>
                      <TableCell>{locationItem.radius}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            onClick={() =>
                              setSelectedLocationId(locationItem.id)
                            }
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
          </>
        )}
      </Box>
    </Box>
  );
};

export default LocationsPage;

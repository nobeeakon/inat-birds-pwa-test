import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Divider, ListItemIcon, MenuItem, Select } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { useLocationsContext } from "@/LocationsContext";
import { ADD_LOCATION_SEARCH_PARAM } from "@/locations-page/addLocationParam";

/** Location names are free text, so the value is truncated rather than left to push
 *  the taxa selector off a phone-width bar. */
const LOCATION_NAME_MAX_WIDTH = 150;

/** Not a location id, so picking it navigates instead of changing the selection. Saved
 *  ids are `loc-<timestamp>`, so this cannot collide with one. */
const ADD_LOCATION_OPTION_VALUE = "__add-location__";

/**
 * Lives in the app bar next to the taxa selector and is drawn the same way: bare
 * inherited-colour text rather than an outlined field, since the two together decide
 * what every page shows and belong side by side rather than behind the menu button.
 */
const LocationSelector = ({
  currentLocationId,
  updateLocation,
}: {
  currentLocationId: string;
  updateLocation: (newLocationId: string) => void;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locations = useLocationsContext().locationsInfo;

  const handleChange = (selectedValue: string) => {
    if (selectedValue === ADD_LOCATION_OPTION_VALUE) {
      navigate(`/locations?${ADD_LOCATION_SEARCH_PARAM}=1`);
      return;
    }

    updateLocation(selectedValue);
  };

  return (
    <Select
      id="location-selector"
      value={currentLocationId}
      onChange={(event) => handleChange(event.target.value)}
      variant="standard"
      disableUnderline
      // Without a label above it, an unset location has to show its own prompt
      displayEmpty
      inputProps={{ "aria-label": t("location") }}
      sx={{
        color: "inherit",
        minWidth: 0,
        "& .MuiSelect-select": {
          py: 0.5,
          maxWidth: LOCATION_NAME_MAX_WIDTH,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
        "& .MuiSelect-icon": { color: "inherit" },
      }}
    >
      <MenuItem value="">{t("selectLocation")}</MenuItem>
      {locations.map((locationItem) => (
        <MenuItem key={locationItem.id} value={locationItem.id}>
          {locationItem.name}
        </MenuItem>
      ))}
      {/* Adding a location from here saves opening the menu and the locations page to
          get to the same form */}
      <Divider />
      <MenuItem value={ADD_LOCATION_OPTION_VALUE}>
        <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
          <AddIcon fontSize="small" />
        </ListItemIcon>
        {t("addLocation")}
      </MenuItem>
    </Select>
  );
};

export default LocationSelector;

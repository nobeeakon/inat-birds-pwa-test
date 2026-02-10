import { useState } from "react";
import {
  Stack,
  Button,
  FormControl,
  Select,
  MenuItem,
  Box,
  InputLabel,
} from "@mui/material";

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
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={onShowLatestObservations}>
          Observations
        </Button>
        <Button variant="outlined" onClick={() => setShowConfig(!showConfig)}>
          Config
        </Button>
      </Stack>
      {showConfig && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
            mt: 2,
            border: 1,
            borderColor: "grey.300",
            p: 1,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="url-selector-label">Data</InputLabel>
            <Select
              labelId="url-selector-label"
              id="url-selector"
              value={currentLocationId}
              label="Data"
              onChange={(e) => updateLocation(e.target.value)}
            >
              <MenuItem value="">Select location</MenuItem>
              {locations.map((locationItem) => (
                <MenuItem key={locationItem.id} value={locationItem.id}>
                  {locationItem.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button onClick={onShowLocations}>Edit locations</Button>
          <Button onClick={onEditCategories}>Edit categories</Button>
        </Box>
      )}
    </Box>
  );
};

export default Header;

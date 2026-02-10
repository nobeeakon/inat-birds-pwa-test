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
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={onShowSpecies}>
          Species
        </Button>
        <Button variant="outlined" onClick={onExcludeTaxa}>
          Excluir
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
              <MenuItem value="">Select Location</MenuItem>
              {locations.map((locationItem) => (
                <MenuItem key={locationItem.id} value={locationItem.id}>
                  {locationItem.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button onClick={onShowLocations}>Edit locations</Button>
          <Button onClick={toggleEditExcludedTaxa}>Excluir spp.</Button>
        </Box>
      )}
    </Box>
  );
};

export default Header;

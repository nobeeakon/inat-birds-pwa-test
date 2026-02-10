import { useState } from "react";
import "@/App.css";
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Button,
  Box,
  Typography,
} from "@mui/material";

import { type ObservationType } from "@/latest-observations/useFetchObservations";
import type { ObservationStatus } from "@/latest-observations/types";

const ObservationCard = ({
  data,
  onNext,
  onPrevious,
}: {
  data: ObservationType;
  onNext: (observationStatus: ObservationStatus) => void;
  onPrevious: () => void;
}) => {
  const [showTaxa, setShowTaxa] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  const imgUrl =
    data.photos && data.photos.length > 0
      ? data.photos[photoIdx].url.replace("square", "medium")
      : null;

  const onNextPhoto = () => {
    if (data.photos && data.photos.length > 0) {
      setPhotoIdx((prev) => (prev + 1 >= data.photos.length ? prev : prev + 1));
    }
  };

  const onPrevPhoto = () => {
    if (data.photos && data.photos.length > 0) {
      setPhotoIdx((prev) => (prev - 1 < 0 ? prev : prev - 1));
    }
  };

  return (
    <Card>
      <CardActions sx={{ display: "flex", gap: 2, mb: 1 }}>
        <Button
          fullWidth
          variant="contained"
          color="success"
          onClick={() => onNext("identified")}
        >
          Fácil
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={() => onNext("sorOfIdentified")}
        >
          Bien
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => onNext("unidentified")}
        >
          Difícil
        </Button>
        <Button fullWidth variant="outlined" onClick={onPrevious}>
          Prev
        </Button>
      </CardActions>

      <Box sx={{ textAlign: "center", m: 1, }}>
        <Button onClick={() => setShowTaxa(true)} color="info" fullWidth>
          Show
        </Button>
      </Box>

      {showTaxa && (
        <CardContent>
          <Typography>
            <strong>
              <i>{data.taxon?.name}</i>
            </strong>{" "}
            ({data.taxon?.preferred_common_name})
          </Typography>
        </CardContent>
      )}

      {!!imgUrl && (
        <CardMedia
          component="img"
          image={imgUrl}
          alt={data.taxon?.preferred_common_name || "Observation Photo"}
          sx={{ maxWidth: 500, mx: "auto", display: "block" }}
        />
      )}

      {data.photos.length > 1 && (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, p: 2 }}>
          <Button
            onClick={onPrevPhoto}
            sx={{ visibility: photoIdx > 0 ? "visible" : "hidden" }}
          >
            Anterior
          </Button>
          {photoIdx < data.photos.length - 1 && (
            <Button onClick={onNextPhoto}>Siguiente</Button>
          )}
        </Box>
      )}
    </Card>
  );
};

export default ObservationCard;

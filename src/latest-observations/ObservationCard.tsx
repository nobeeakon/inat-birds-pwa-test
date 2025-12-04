import { useState } from "react";
import "@/App.css";

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
    <div
      style={{
        marginBottom: "16px",
        marginTop: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "0.2rem",
        }}
      >
        <button
          onClick={() => onNext("identified")}
          style={{ backgroundColor: "lightgreen" }}
        >
          Bien
        </button>
        <button onClick={() => onNext("sorOfIdentified")}>Maomenos</button>
        <button onClick={() => onNext("unidentified")}>Mal</button>
        <button onClick={onPrevious}>Prev</button>
      </div>
      <div
        style={{
          marginBottom: "0.2rem",
        }}
      >
        <button
          onClick={() => setShowTaxa(true)}
          style={{
            backgroundColor: "lightblue",
            display: "block",
            width: "300px",
          }}
        >
          Show
        </button>
      </div>
      {showTaxa && (
        <p>
          <strong>
            <i>{data.taxon?.name} </i>
          </strong>{" "}
          ({data.taxon?.preferred_common_name})
        </p>
      )}
      {!!imgUrl && (
        <img
          src={imgUrl}
          alt={data.taxon?.preferred_common_name || "Observation Photo"}
          style={{ maxWidth: "340px" }}
        />
      )}
      {data.photos.length > 1 && (
        <div style={{ display: "flex", gap: "2rem" }}>
          {
            <button
              onClick={onPrevPhoto}
              style={{ visibility: photoIdx > 0 ? "visible" : "hidden" }}
            >
              Anterior
            </button>
          }
          {photoIdx < data.photos.length - 1 && (
            <button onClick={onNextPhoto}>Siguiente</button>
          )}
        </div>
      )}
    </div>
  );
};

export default ObservationCard;

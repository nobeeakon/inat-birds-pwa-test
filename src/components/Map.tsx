import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { useEffect, useState } from "react";

// Fix for default marker icon issue in React-Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapProps {
  center: [number, number]; // [latitude, longitude]
  zoom?: number;
  radius?: number; // in kilometers
  markers?: Array<{
    position: [number, number];
    label: string;
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
}

// Component to handle map click events
const MapClickHandler = ({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

const Map = ({
  center,
  zoom = 13,
  radius,
  markers = [],
  onMapClick,
  height = "400px",
}: MapProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div style={{ height, background: "#e0e0e0" }}>Loading map...</div>;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onMapClick={onMapClick} />

      {/* Show radius circle if provided */}
      {radius && (
        <Circle
          center={center}
          radius={radius * 1000} // Convert km to meters
          pathOptions={{
            color: "blue",
            fillColor: "blue",
            fillOpacity: 0.1,
          }}
        />
      )}

      {/* Center marker */}
      <Marker position={center} icon={DefaultIcon}>
        <Popup>Current Location</Popup>
      </Marker>

      {/* Additional markers */}
      {markers.map((marker, idx) => (
        <Marker key={idx} position={marker.position} icon={DefaultIcon}>
          <Popup>{marker.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;

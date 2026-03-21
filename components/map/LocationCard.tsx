"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

type Props = {
  origin: {
    latitude: number;
    longitude: number;
    location: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    location: string;
  };
};

// Fix marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

export default function LocationCard({ origin, destination }: Props) {
  const originPos: [number, number] = [origin.latitude, origin.longitude];
  const destPos: [number, number] = [
    destination.latitude,
    destination.longitude,
  ];

  return (
    <MapContainer
      center={originPos}
      zoom={6}
      className="w-full h-full"
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Origin Marker */}
      <Marker position={originPos}>
        <Popup>Start: {origin.location}</Popup>
      </Marker>

      {/* Destination Marker */}
      <Marker position={destPos}>
        <Popup>Destination: {destination.location}</Popup>
      </Marker>

      {/* Route Line */}
      <Polyline positions={[originPos, destPos]} color="blue" />
    </MapContainer>
  );
}
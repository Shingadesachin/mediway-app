"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Coordinates } from "@/lib/location";
import { mapsDirections } from "@/lib/utils";
import type { MapItem } from "./MapPanel";

const marker = (kind: MapItem["kind"]) => L.divIcon({
  className: "",
  html: `<span style="display:grid;place-items:center;width:30px;height:30px;border:2px solid white;border-radius:50%;background:${kind === "hospital" ? "#d62839" : kind === "urgent" ? "#0fa3b1" : "#0f52a8"};color:white;font-weight:800;box-shadow:0 2px 6px #0005">${kind === "hospital" ? "+" : kind === "urgent" ? "!" : "C"}</span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});
const userMarker = L.divIcon({
  className: "",
  html: '<span style="display:block;width:18px;height:18px;border:3px solid white;border-radius:50%;background:#20a66a;box-shadow:0 1px 5px #0007"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function LeafletMap({ items, selected, onSelect, userLocation }: {
  items: MapItem[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  userLocation?: Coordinates | null;
}) {
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : items.length ? [items[0].lat, items[0].lng] : [19.119, 72.85];
  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="h-full min-h-64 w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarker}><Popup>You are here</Popup></Marker>}
      {items.map((item) => (
        <Marker key={item.id} position={[item.lat, item.lng]} icon={marker(item.kind)} eventHandlers={{ click: () => onSelect?.(item.id) }}>
          <Popup>
            <strong>{item.label}</strong>
            <br />
            <a href={mapsDirections(`${item.lat},${item.lng}`)} target="_blank" rel="noreferrer">Get directions</a>
            {selected === item.id && <span className="block text-xs text-slate-500">Selected</span>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

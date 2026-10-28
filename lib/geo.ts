export interface Coordinates { lat: number; lng: number; label?: string }

export function distanceKm(origin: Pick<Coordinates, "lat" | "lng">, target: Pick<Coordinates, "lat" | "lng">) {
  const rad = (degree: number) => degree * Math.PI / 180;
  const dLat = rad(target.lat - origin.lat), dLng = rad(target.lng - origin.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(origin.lat)) * Math.cos(rad(target.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

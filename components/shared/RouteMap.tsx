"use client";

// Real Leaflet map (OSM tiles) + OSRM road route through the plan's stores.
// Loaded ONLY via dynamic(..., { ssr: false }) from MapPanel — Leaflet needs window.
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { PlanStore } from "@/lib/services/buildPlan";
import type { LatLon, RouteResult } from "@/lib/services/route";

interface RouteMapProps {
  origin: LatLon;
  originLabel: string;
  stores: PlanStore[]; // already in visiting order
  route: RouteResult | null;
  /** When set, a map click reports the picked location (origin picker mode). */
  onPick?: (p: LatLon) => void;
  picking?: boolean;
}

// divIcon pins — no image assets, so no bundler icon-path issues.
function numberPin(color: string, n: number): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

const START_PIN = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#fff;border:5px solid #0F1B16;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

// Origin picker: while active, one click on the map = new starting point.
function ClickPicker({ onPick, picking }: { onPick?: (p: LatLon) => void; picking?: boolean }) {
  const map = useMapEvents({
    click(e) {
      if (picking && onPick) onPick({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  useEffect(() => {
    map.getContainer().style.cursor = picking ? "crosshair" : "";
  }, [map, picking]);
  return null;
}

// Fit the viewport to the whole route whenever the data changes.
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = useMemo(() => JSON.stringify(points), [points]);
  const lastKey = useRef<string>("");
  useEffect(() => {
    if (points.length === 0 || key === lastKey.current) return;
    lastKey.current = key;
    map.fitBounds(L.latLngBounds(points.map(([lat, lon]) => L.latLng(lat, lon))), {
      padding: [28, 28],
    });
  }, [map, key, points]);
  return null;
}

export default function RouteMap({ origin, originLabel, stores, route, onPick, picking }: RouteMapProps) {
  const allPoints: [number, number][] = [
    [origin.lat, origin.lon],
    ...stores.map((s) => [s.lat, s.lon] as [number, number]),
  ];
  const line = route && route.geometry.length > 1 ? route.geometry : allPoints;

  return (
    <MapContainer
      center={[origin.lat, origin.lon]}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
      attributionControl
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Polyline
        positions={line}
        pathOptions={{
          color: "#1A73E8",
          weight: 5,
          opacity: 0.85,
          dashArray: route?.estimated ? "8 8" : undefined, // dashed = ước lượng
        }}
      />
      <Marker position={[origin.lat, origin.lon]} icon={START_PIN}>
        <Popup>{originLabel}</Popup>
      </Marker>
      {stores.map((s, i) => (
        <Marker key={s.code} position={[s.lat, s.lon]} icon={numberPin(s.color, i + 1)}>
          <Popup>
            <b>
              {i + 1}. {s.name}
            </b>
            <br />
            {s.address}
          </Popup>
        </Marker>
      ))}
      <FitBounds points={allPoints} />
      <ClickPicker onPick={onPick} picking={picking} />
    </MapContainer>
  );
}

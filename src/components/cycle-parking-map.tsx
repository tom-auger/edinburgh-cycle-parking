"use client";

import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import type { ParkingPoint, UserLocation } from "@/lib/types";
import { getParkingDetails } from "@/lib/parking";

type CycleParkingMapProps = {
  points: ParkingPoint[];
  userLocation: UserLocation;
  selectedPoint: ParkingPoint | null;
  nearestPoint: ParkingPoint | null;
  nearestHighlightedPoints: ParkingPoint[];
  onSelectPoint: (id: string) => void;
};

const defaultCenter: [number, number] = [55.9533, -3.1883];
const highlightedRankCount = 3;
type HighlightedRank = 1 | 2 | 3;

function getFocusPadding(map: L.Map): L.FitBoundsOptions {
  const size = map.getSize();

  if (size.x <= 820) {
    return {
      paddingTopLeft: [40, 40],
      paddingBottomRight: [40, Math.min(Math.round(size.y * 0.58), size.y - 80)],
    };
  }

  return {
    padding: [40, 40],
  };
}

function createParkingIcon(kind: "default" | "selected" | `rank-${HighlightedRank}`) {
  const className = `parking-marker parking-marker-${kind}`;
  const label = kind.startsWith("rank-") ? kind.replace("rank-", "") : "";

  return L.divIcon({
    className,
    html: `<span>${label}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

const userIcon = L.divIcon({
  className: "user-marker",
  html: "<span></span>",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapFocus({
  highlightedPoints,
  nearestPoint,
  selectedPoint,
  userLocation,
}: {
  highlightedPoints: ParkingPoint[];
  nearestPoint: ParkingPoint | null;
  selectedPoint: ParkingPoint | null;
  userLocation: UserLocation;
}) {
  const map = useMap();

  useEffect(() => {
    const focusPoints =
      highlightedPoints.length > 0 ? highlightedPoints : nearestPoint ? [nearestPoint] : [];

    if (selectedPoint) {
      if (selectedPoint.id === nearestPoint?.id) {
        const bounds = L.latLngBounds([
          [userLocation.latitude, userLocation.longitude],
          ...focusPoints.map((point) => [point.latitude, point.longitude] as [number, number]),
        ]);

        map.fitBounds(bounds, {
          animate: true,
          duration: 0.7,
          maxZoom: 17,
          ...getFocusPadding(map),
        });
        return;
      }

      map.flyTo([selectedPoint.latitude, selectedPoint.longitude], Math.max(map.getZoom(), 16), {
        duration: 0.7,
      });
      return;
    }

    if (focusPoints.length > 0) {
      const bounds = L.latLngBounds([
        [userLocation.latitude, userLocation.longitude],
        ...focusPoints.map((point) => [point.latitude, point.longitude] as [number, number]),
      ]);

      map.fitBounds(bounds, {
        animate: true,
        duration: 0.7,
        maxZoom: 17,
        ...getFocusPadding(map),
      });
      return;
    }

    map.setView([userLocation.latitude, userLocation.longitude], 16);
  }, [highlightedPoints, map, nearestPoint, selectedPoint, userLocation]);

  return null;
}

function AttributionPrefix() {
  const map = useMap();

  useEffect(() => {
    map.attributionControl.setPrefix(false);
  }, [map]);

  return null;
}

export default function CycleParkingMap({
  points,
  userLocation,
  selectedPoint,
  nearestPoint,
  nearestHighlightedPoints,
  onSelectPoint,
}: CycleParkingMapProps) {
  const icons = useMemo(
    () => ({
      default: createParkingIcon("default"),
      selected: createParkingIcon("selected"),
      rank1: createParkingIcon("rank-1"),
      rank2: createParkingIcon("rank-2"),
      rank3: createParkingIcon("rank-3"),
    }),
    [],
  );
  const highlightedPointRanks = useMemo(() => {
    return new Map(
      nearestHighlightedPoints
        .slice(0, highlightedRankCount)
        .map((point, index) => [point.id, (index + 1) as HighlightedRank]),
    );
  }, [nearestHighlightedPoints]);

  return (
    <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom className="bike-map">
      <AttributionPrefix />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFocus
        highlightedPoints={nearestHighlightedPoints}
        nearestPoint={nearestPoint}
        selectedPoint={selectedPoint}
        userLocation={userLocation}
      />
      <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
        <Popup>
          <div className="parking-popup">
            <strong>Reference location</strong>
            <span>Distances are sorted from here.</span>
          </div>
        </Popup>
      </Marker>
      {points.map((point) => {
        const highlightedRank = highlightedPointRanks.get(point.id);
        let icon = point.id === selectedPoint?.id ? icons.selected : icons.default;
        if (highlightedRank === 1) {
          icon = icons.rank1;
        } else if (highlightedRank === 2) {
          icon = icons.rank2;
        } else if (highlightedRank === 3) {
          icon = icons.rank3;
        }

        return (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={icon}
            eventHandlers={{
              click: () => onSelectPoint(point.id),
            }}
          >
            <Popup>
              <div className="parking-popup">
                <strong>{point.name}</strong>
                <dl>
                  {getParkingDetails(point).map((detail) => (
                    <div key={detail.label}>
                      <dt>{detail.label}</dt>
                      <dd>{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

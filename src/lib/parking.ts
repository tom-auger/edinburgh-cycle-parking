import { formatDistance } from "@/lib/geo";
import type { ParkingPoint } from "@/lib/types";

type ParkingDetail = {
  label: string;
  value: string;
};

function normalizeText(value: string | number | boolean | null | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function formatCapacity(value: string | number | boolean | null | undefined) {
  return typeof value === "number" && value > 0 ? `${value} spaces` : "Not listed";
}

function formatCovered(value: string | number | boolean | null | undefined) {
  if (value === "yes") {
    return "Covered";
  }

  if (value === "no") {
    return "Not covered";
  }

  return "Not listed";
}

export function getParkingDetails(point: ParkingPoint): ParkingDetail[] {
  return [
    {
      label: "Distance",
      value:
        typeof point.distanceMeters === "number"
          ? `${formatDistance(point.distanceMeters)} away`
          : "Not listed",
    },
    {
      label: "Spaces",
      value: formatCapacity(point.properties.capacity),
    },
    {
      label: "Type",
      value: normalizeText(point.properties.bicycle_pa) ?? "Not listed",
    },
    {
      label: "Cover",
      value: formatCovered(point.properties.covered),
    },
    {
      label: "Access",
      value: normalizeText(point.properties.access) ?? "Not listed",
    },
  ];
}

export function describeParkingPoint(point: ParkingPoint) {
  const capacity = formatCapacity(point.properties.capacity);
  const kind = normalizeText(point.properties.bicycle_pa) ?? "type not listed";
  const covered = formatCovered(point.properties.covered).toLowerCase();

  return [capacity, kind, covered].join(", ");
}

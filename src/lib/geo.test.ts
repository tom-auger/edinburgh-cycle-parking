import { describe, expect, it } from "vitest";
import {
  distanceMeters,
  formatDistance,
  isFarFromNearestParking,
  isResolvedLocation,
  sortByDistance,
} from "@/lib/geo";
import { parsePlaceSearchResults } from "@/lib/geocoder";
import { describeParkingPoint, getParkingDetails } from "@/lib/parking";
import type { ParkingPoint } from "@/lib/types";

const points: ParkingPoint[] = [
  {
    id: "far",
    name: "Far point",
    latitude: 55.9605,
    longitude: -3.21,
    properties: {},
  },
  {
    id: "near",
    name: "Near point",
    latitude: 55.9534,
    longitude: -3.1884,
    properties: {},
  },
];

describe("geo utilities", () => {
  it("calculates approximate distance in metres", () => {
    const distance = distanceMeters(
      { latitude: 55.9533, longitude: -3.1883 },
      { latitude: 55.9534, longitude: -3.1884 },
    );

    expect(distance).toBeGreaterThan(10);
    expect(distance).toBeLessThan(15);
  });

  it("sorts points by nearest distance", () => {
    const sorted = sortByDistance(points, { latitude: 55.9533, longitude: -3.1883 });

    expect(sorted.map((point) => point.id)).toEqual(["near", "far"]);
    expect(sorted[0]?.distanceMeters).toBeLessThan(sorted[1]?.distanceMeters ?? 0);
    expect(sorted.every((point) => typeof point.distanceMeters === "number")).toBe(true);
  });

  it("handles empty point lists", () => {
    expect(sortByDistance([], { latitude: 55.9533, longitude: -3.1883 })).toEqual([]);
  });

  it("detects locations far from Edinburgh cycle parking", () => {
    expect(isFarFromNearestParking(points, { latitude: 51.5072, longitude: -0.1276 })).toBe(true);
    expect(isFarFromNearestParking(points, { latitude: 55.9533, longitude: -3.1883 })).toBe(false);
  });

  it("rejects unresolved null-island coordinates", () => {
    expect(isResolvedLocation({ latitude: 0, longitude: 0 })).toBe(false);
    expect(isResolvedLocation({ latitude: 0.00001, longitude: -0.00001 })).toBe(false);
    expect(isResolvedLocation({ latitude: 55.9533, longitude: -3.1883 })).toBe(true);
  });

  it("rejects out-of-range coordinates", () => {
    expect(isResolvedLocation({ latitude: 91, longitude: -3.1883 })).toBe(false);
    expect(isResolvedLocation({ latitude: 55.9533, longitude: -181 })).toBe(false);
  });

  it("formats metres and kilometres", () => {
    expect(formatDistance(42.4)).toBe("42 m");
    expect(formatDistance(1_250)).toBe("1.3 km");
  });

  it("formats parking details with not-listed values", () => {
    const [distance, spaces, type, cover, access] = getParkingDetails({
      id: "details",
      name: "Details point",
      latitude: 55.9533,
      longitude: -3.1883,
      distanceMeters: 42,
      properties: {
        capacity: 0,
        bicycle_pa: " ",
        covered: " ",
        access: null,
      },
    });

    expect(distance?.value).toBe("42 m away");
    expect(spaces?.value).toBe("Not listed");
    expect(type?.value).toBe("Not listed");
    expect(cover?.value).toBe("Not listed");
    expect(access?.value).toBe("Not listed");
  });

  it("summarizes populated parking details", () => {
    expect(
      describeParkingPoint({
        id: "summary",
        name: "Summary point",
        latitude: 55.9533,
        longitude: -3.1883,
        properties: {
          capacity: 8,
          bicycle_pa: "stands",
          covered: "no",
        },
      }),
    ).toBe("8 spaces, stands, not covered");
  });

  it("parses valid place search results and rejects invalid coordinates", () => {
    expect(
      parsePlaceSearchResults([
        {
          display_name: "Meadows, Edinburgh, Scotland, United Kingdom",
          lat: "55.941",
          lon: "-3.191",
          osm_id: 123,
        },
        {
          display_name: "Null Island",
          lat: "0",
          lon: "0",
          osm_id: 456,
        },
        {
          display_name: "Invalid",
          lat: "not-a-number",
          lon: "-3.191",
        },
      ]),
    ).toEqual([
      {
        id: "123",
        name: "Meadows, Edinburgh, Scotland, United Kingdom",
        location: {
          latitude: 55.941,
          longitude: -3.191,
        },
      },
    ]);
  });
});

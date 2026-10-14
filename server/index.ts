import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Destination = {
  name: string;
  address: string;
  city: string;
  category: string;
  latitude: number;
  longitude: number;
};

async function searchDestinations(query: string): Promise<Destination[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("lang", "en");

  const response = await fetch(url.toString(), {
    headers: {
      "User-Agent": "TripMind/1.0 (contact@tripmind.example)",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Geocoding service error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    features: Array<{
      properties: {
        name?: string;
        country?: string;
        state?: string;
        county?: string;
        city?: string;
        osm_value?: string;
        osm_key?: string;
      };
      geometry: {
        coordinates: [number, number];
      };
    }>;
  };

  return data.features.map((feature) => {
    const props = feature.properties;
    const name = props.name ?? "";
    const city = props.city ?? props.county ?? props.state ?? "";
    const address = [city, props.state, props.country]
      .filter(Boolean)
      .join(", ");
    const category = props.osm_value ?? "place";
    const [longitude, latitude] = feature.geometry.coordinates;
    return {
      name,
      address,
      city,
      category,
      latitude,
      longitude,
    };
  });
}

type Place = {
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  displayName: string;
};

const POI_TAGS: Array<[string, string]> = [
  ["tourism", "attraction"],
  ["tourism", "museum"],
  ["tourism", "viewpoint"],
  ["tourism", "artwork"],
  ["tourism", "theme_park"],
  ["tourism", "zoo"],
  ["amenity", "restaurant"],
  ["amenity", "cafe"],
  ["amenity", "fast_food"],
  ["amenity", "cinema"],
  ["amenity", "theatre"],
  ["historic", "monument"],
  ["historic", "castle"],
  ["historic", "ruins"],
  ["historic", "memorial"],
  ["leisure", "park"],
  ["leisure", "garden"],
  ["leisure", "nature_reserve"],
  ["shop", "mall"],
  ["shop", "supermarket"],
  ["shop", "department_store"],
  ["natural", "peak"],
  ["natural", "beach"],
  ["natural", "waterfall"],
];

function buildOverpassQuery(lat: number, lon: number, radius: number): string {
  const parts = POI_TAGS.map(
    ([key, value]) =>
      `node["${key}"="${value}"](around:${radius},${lat},${lon});\nway["${key}"="${value}"](around:${radius},${lat},${lon});`,
  );
  return `[out:json][timeout:25];\n(\n${parts.join("\n")}\n);\nout body center;\n>;\nout skel qt;`;
}

function resolveCategory(tags: Record<string, string>): string {
  for (const [key, value] of POI_TAGS) {
    if (tags[key] === value) {
      return value;
    }
  }
  return (
    tags.tourism ??
    tags.amenity ??
    tags.historic ??
    tags.leisure ??
    tags.shop ??
    tags.natural ??
    "place"
  );
}

async function searchPlaces(
  lat: number,
  lon: number,
  radius: number,
): Promise<Place[]> {
  const query = buildOverpassQuery(lat, lon, radius);
  const url = "https://overpass-api.de/api/interpreter";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "TripMind/1.0 (contact@tripmind.example)",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Overpass API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    elements: Array<{
      type: string;
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };

  const places: Place[] = [];

  for (const element of data.elements) {
    if (!element.tags?.name) continue;

    let latitude: number | undefined;
    let longitude: number | undefined;

    if (
      element.type === "node" &&
      element.lat !== undefined &&
      element.lon !== undefined
    ) {
      latitude = element.lat;
      longitude = element.lon;
    } else if (element.center) {
      latitude = element.center.lat;
      longitude = element.center.lon;
    }

    if (latitude === undefined || longitude === undefined) continue;

    const name = element.tags.name;
    const category = resolveCategory(element.tags);
    const city = element.tags["addr:city"] ?? element.tags["is_in:city"] ?? "";
    const displayName = [name, city].filter(Boolean).join(", ");

    places.push({
      name,
      category,
      latitude,
      longitude,
      displayName,
    });
  }

  return places;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  app.get("/api/search-destinations", async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!query) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Query parameter 'q' is required." }));
      return;
    }

    try {
      const destinations = await searchDestinations(query);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ destinations }));
    } catch (error) {
      console.error("Search destinations error:", error);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Destination search failed. Please try again later.",
        }),
      );
    }
  });

  app.get("/api/places", async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const radius = req.query.radius ? Number(req.query.radius) : 5000;

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Parameter 'lat' must be a valid latitude between -90 and 90.",
        }),
      );
      return;
    }

    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            "Parameter 'lon' must be a valid longitude between -180 and 180.",
        }),
      );
      return;
    }

    if (!Number.isFinite(radius) || radius <= 0 || radius > 20000) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            "Parameter 'radius' must be a positive number up to 20000 meters.",
        }),
      );
      return;
    }

    try {
      const places = await searchPlaces(lat, lon, radius);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ places }));
    } catch (error) {
      console.error("Search places error:", error);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Place search failed. Please try again later.",
        }),
      );
    }
  });

  function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function nameMatchScore(query: string, candidate: string): number {
    const q = normalizeName(query);
    const c = normalizeName(candidate);
    if (c === q) return 100;
    if (c.startsWith(q)) return 85;
    if (q.startsWith(c)) return 80;
    if (c.includes(q)) return 70;
    if (q.includes(c)) return 65;

    const qWords = q.split(" ");
    const cWords = c.split(" ");
    let matchedWords = 0;
    for (const qw of qWords) {
      if (qw.length < 3) continue;
      for (const cw of cWords) {
        if (cw === qw || cw.includes(qw) || qw.includes(cw)) {
          matchedWords++;
          break;
        }
      }
    }
    if (
      matchedWords === qWords.filter((w) => w.length >= 3).length &&
      matchedWords > 0
    )
      return 60;
    if (matchedWords > 0) return 30 + matchedWords * 10;

    return 0;
  }

  const NON_ATTRACTION_CATEGORIES = new Set([
    "bus_stop",
    "bus_station",
    "fuel",
    "petrol_bank",
    "hotel",
    "motel",
    "hostel",
    "guest_house",
    "post_office",
    "bank",
    "atm",
    "pharmacy",
    "hospital",
    "clinic",
    "school",
    "college",
    "university_building",
    "parking",
    "toilets",
    "telephone",
    "police",
    "embassy",
    "townhall",
    "courthouse",
    "prison",
    "social_facility",
    "recycling",
    "waste_basket",
    "bench",
    "water_point",
    "hunting_stand",
    "waste_disposal",
  ]);

  const KIND_TO_OSM_CATEGORIES: Record<string, Set<string>> = {
    food: new Set([
      "restaurant",
      "cafe",
      "fast_food",
      "bar",
      "pub",
      "bistro",
      "coffee_shop",
      "food_court",
      "biergarten",
    ]),
    culture: new Set([
      "museum",
      "gallery",
      "monument",
      "castle",
      "ruins",
      "memorial",
      "archaeological_site",
      "hermitage",
      "planetarium",
      "aquarium",
      "artwork",
      "temple",
      "church",
      "cathedral",
      "shrine",
      "synagogue",
      "mosque",
      "fort",
      "battlefield",
      "historical",
      "theatre",
      "cinema",
      "religious",
      "place_of_worship",
      "manor",
    ]),
    nature: new Set([
      "park",
      "garden",
      "beach",
      "nature_reserve",
      "viewpoint",
      "peak",
      "waterfall",
      "cliff",
      "forest",
      "beach_resort",
      "wood",
      "meadow",
      "wetland",
      "cave_entrance",
      "cave",
      "spring",
      "geyser",
      "farm",
    ]),
    shopping: new Set([
      "market",
      "mall",
      "supermarket",
      "shop",
      "department_store",
      "boutique",
      "clothes",
      "bakery",
      "convenience",
      "electronics",
      "furniture",
      "garden_centre",
      "hardware",
      "jewellery",
      "kiosk",
      "leather",
      "music",
      "newsagent",
      "optician",
      "pet",
      "photo",
      "second_hand",
      "shoes",
      "sport",
      "stationery",
      "variety_store",
      "antiques",
      "gift",
      "florist",
      "bookshop",
      "books",
      "mobile_phone",
      "computer",
    ]),
    stay: new Set([
      "hotel",
      "motel",
      "hostel",
      "guest_house",
      "guesthouse",
      "B&B",
      "bed_and_breakfast",
      "chalet",
      "alpine_hut",
      "camp_site",
      "caravan_site",
    ]),
  };

  const GENERIC_GEOGRAPHIC_CATEGORIES = new Set([
    "town",
    "village",
    "hamlet",
    "place",
    "island",
    "archipelago",
    "locality",
    "continent",
    "country",
    "region",
  ]);

  function categoryMatchScore(category: string, kind?: string): number {
    if (!kind) {
      if (NON_ATTRACTION_CATEGORIES.has(category)) return -30;
      return 0;
    }
    const expected = KIND_TO_OSM_CATEGORIES[kind];
    if (!expected) {
      if (NON_ATTRACTION_CATEGORIES.has(category)) return -30;
      return 0;
    }
    if (expected.has(category)) return 40;
    if (NON_ATTRACTION_CATEGORIES.has(category)) return -50;
    if (GENERIC_GEOGRAPHIC_CATEGORIES.has(category)) return 0;
    for (const [otherKind, otherSet] of Object.entries(
      KIND_TO_OSM_CATEGORIES,
    )) {
      if (otherKind !== kind && otherSet.has(category)) return -50;
    }
    return 0;
  }

  function isLikelyAttraction(name: string, category: string): boolean {
    if (NON_ATTRACTION_CATEGORIES.has(category)) return false;
    const lower = name.toLowerCase();
    if (
      /\b(bus stop|bus station|petrol|fuel|bank|post office|hotel|motel|hostel|pharmacy|clinic|school|college|parking|toilet|police|prison)\b/.test(
        lower,
      )
    ) {
      return false;
    }
    return true;
  }

  function pickBestResult(
    results: Destination[],
    queryName: string,
    destLat: number | undefined,
    destLon: number | undefined,
    kind?: string,
    title?: string,
  ): Destination | null {
    if (results.length === 0) return null;

    const scored = results.map((r) => {
      const nameScore = nameMatchScore(queryName, r.name);
      const attractionBonus = isLikelyAttraction(r.name, r.category) ? 15 : 0;
      const categoryScore = categoryMatchScore(r.category, kind);
      let proximityScore = 0;
      if (destLat !== undefined && destLon !== undefined) {
        const dist = haversineDistance(
          destLat,
          destLon,
          r.latitude,
          r.longitude,
        );
        proximityScore = Math.max(0, 30 - (dist / 100000) * 30);
      }
      const totalScore =
        nameScore + attractionBonus + categoryScore + proximityScore;
      return {
        result: r,
        nameScore,
        attractionBonus,
        categoryScore,
        proximityScore,
        totalScore,
      };
    });

    scored.sort((a, b) => b.totalScore - a.totalScore);

    for (const candidate of scored) {
      if (candidate.nameScore < 30) return null;
      if (NON_ATTRACTION_CATEGORIES.has(candidate.result.category)) continue;
      if (
        !isLikelyAttraction(candidate.result.name, candidate.result.category) &&
        candidate.nameScore < 85
      )
        continue;
      if (candidate.categoryScore < 0 && candidate.nameScore < 100) continue;

      if (destLat !== undefined && destLon !== undefined) {
        const dist = haversineDistance(
          destLat,
          destLon,
          candidate.result.latitude,
          candidate.result.longitude,
        );
        if (dist > 100000) continue;
      }

      return candidate.result;
    }
    return null;
  }

  app.get("/api/geocode", async (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const city =
      typeof req.query.city === "string" ? req.query.city.trim() : "";
    const country =
      typeof req.query.country === "string" ? req.query.country.trim() : "";
    const destLat = req.query.destLat ? Number(req.query.destLat) : undefined;
    const destLon = req.query.destLon ? Number(req.query.destLon) : undefined;
    const kind =
      typeof req.query.kind === "string" && req.query.kind.trim()
        ? req.query.kind.trim()
        : undefined;
    const title =
      typeof req.query.title === "string" && req.query.title.trim()
        ? req.query.title.trim()
        : undefined;

    if (!query) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Query parameter 'q' is required." }));
      return;
    }

    const contextualParts = [query, city, country].filter(Boolean);
    const contextualQuery = contextualParts.join(", ");

    try {
      const [contextualResults, broadResults] = await Promise.all([
        searchDestinations(contextualQuery),
        searchDestinations(query),
      ]);
      const seen = new Set<string>();
      const destinations: Destination[] = [];
      for (const r of [...contextualResults, ...broadResults]) {
        const key = `${r.name}|${r.latitude}|${r.longitude}`;
        if (seen.has(key)) continue;
        seen.add(key);
        destinations.push(r);
      }
      const best = pickBestResult(
        destinations,
        query,
        destLat,
        destLon,
        kind,
        title,
      );
      if (!best) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "No relevant results found for the given place.",
          }),
        );
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          name: best.name,
          latitude: best.latitude,
          longitude: best.longitude,
        }),
      );
    } catch (error) {
      console.error("Geocode error:", error);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Geocoding failed. Please try again later.",
        }),
      );
    }
  });

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

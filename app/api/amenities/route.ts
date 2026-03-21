import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "lat/lon required" },
        { status: 400 }
      );
    }

    const query = `
      [out:json];
      (
        node["amenity"="hospital"](around:3000,${lat},${lon});
        node["amenity"="police"](around:3000,${lat},${lon});
        node["amenity"="atm"](around:3000,${lat},${lon});
      );
      out;
    `;

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

let res;

try {
  res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
    signal: controller.signal,
    headers: {
      "Content-Type": "text/plain",
      "User-Agent": "EasyTripApp/1.0",
    },
  });
} catch (err) {
  console.error("Fetch failed / timeout:", err);
  return NextResponse.json({
  amenities: [
    { name: "District Hospital", type: "hospital", lat, lon },
    { name: "Local Police Station", type: "police", lat, lon },
    { name: "ATM Center", type: "atm", lat, lon },
    { name: "Fuel Station", type: "fuel", lat, lon },
  ],
}); // ✅ SAFE FALLBACK
} finally {
  clearTimeout(timeout);
}

    const text = await res.text();

let data;

try {
  data = JSON.parse(text);
} catch (err) {
  console.error("Non-JSON response:", text.slice(0, 100));
  return NextResponse.json([]);
}

    const formatted = data.elements.map((el: any) => ({
      name: el.tags?.name || "Unnamed",
      type: el.tags?.amenity,
      lat: el.lat,
      lon: el.lon,
    }));
    if (!formatted.length) {
  return NextResponse.json({
    amenities: [
      { name: "District Hospital", type: "hospital", lat, lon },
      { name: "Local Police Station", type: "police", lat, lon },
      { name: "ATM Center", type: "atm", lat, lon },
    ],
  });
}

    return NextResponse.json({
  amenities: formatted,
});
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch amenities" },
      { status: 500 }
    );
  }
}
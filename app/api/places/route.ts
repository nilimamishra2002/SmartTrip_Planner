import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const type = searchParams.get("type"); // hotel, restaurant, attraction

  if (!lat || !lon || !type) {
    return NextResponse.json(
      { error: "lat, lon, type required" },
      { status: 400 }
    );
  }

  let queryType = "";

  if (type === "hotel") {
    queryType = `node["tourism"="hotel"]`;
  } else if (type === "restaurant") {
    queryType = `node["amenity"="restaurant"]`;
  } else if (type === "attraction") {
    queryType = `node["tourism"="attraction"]`;
  }

  const query = `
    [out:json];
    (
      ${queryType}(around:3000,${lat},${lon});
    );
    out;
  `;

const url = "https://overpass-api.de/api/interpreter";

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

const res = await fetch(url, {
  method: "POST",
  body: query,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  signal: controller.signal,
});

clearTimeout(timeout);

// 🔥 IMPORTANT CHECK
if (!res.ok) {
  return NextResponse.json({
    places: [],
    fallback: true,
  });
}

const text = await res.text();

if (text.startsWith("<?xml")) {
  console.warn("Overpass rate limited → using fallback");

  return NextResponse.json({
    places: [],
    fallback: true,
  });
}

const data = JSON.parse(text);
  const formatted = data.elements.map((el: any) => ({
    name: el.tags?.name || "Unnamed",
    lat: el.lat,
    lon: el.lon,
  }));

  return NextResponse.json(formatted);
}
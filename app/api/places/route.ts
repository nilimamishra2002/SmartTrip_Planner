import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");
    const type = searchParams.get("type");

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // ⬆️ increase timeout

    let res;

    try {
      res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        signal: controller.signal,
      });
    } catch (err) {
      console.error("Places API timeout:", err);

      return NextResponse.json({
        places: [
          { name: "Sample Hotel", lat, lon },
          { name: "Nearby Restaurant", lat, lon },
          { name: "Tourist Attraction", lat, lon },
        ],
        fallback: true,
      });
    } finally {
      clearTimeout(timeout);
    }

    const text = await res.text();

    if (!res.ok || text.startsWith("<?xml")) {
      return NextResponse.json({
        places: [],
        fallback: true,
      });
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Invalid JSON:", text.slice(0, 100));

      return NextResponse.json({
        places: [],
        fallback: true,
      });
    }

    const formatted = data.elements.map((el: any) => ({
      name: el.tags?.name || "Unnamed",
      lat: el.lat,
      lon: el.lon,
    }));

    return NextResponse.json({ places: formatted });

  } catch (err) {
    console.error("Places API crash:", err);

    return NextResponse.json({
      places: [],
      fallback: true,
    });
  }
}
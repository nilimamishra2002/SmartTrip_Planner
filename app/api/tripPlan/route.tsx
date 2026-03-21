import { NextResponse } from "next/server";
import axios from "axios";

const pythonServer = process.env.PYTHON_SERVER_URL;

const clean = (v: string | null, fallback = "") =>
  v && v !== "undefined" && v !== "null" ? v : fallback;

const normalizeCity = (city: string) => {
  const c = city.trim().toLowerCase();
  if (c === "bhubanewsar" || c === "bhubaneswar city") return "Bhubaneswar";
  if (c === "puri city") return "Puri";
  return city.trim();
};

function validateTrip(data: any) {
  const errors = [];

  try {
    const destinations = data.checkpoints?.map(
      (c: any) => c.destination.location
    ) || [];

    const uniqueCities = Array.from(new Set(destinations));
    if (uniqueCities.length > 1) {
      errors.push("Multiple destination cities detected");
    }

    const hotels = Object.values(data.accommodation || {}).map(
      (d: any) => d.title
    );
    if (new Set(hotels).size > 1) {
      errors.push("Multiple hotels detected");
    }

    const allActivities =
      data.itinerary?.flatMap((d: any) => d.activities) || [];

    if (new Set(allActivities).size !== allActivities.length) {
      errors.push("Duplicate activities found");
    }

  } catch (err) {
    errors.push("Invalid structure");
  }

  return errors;
}

export async function GET(request: Request) {
  if (!pythonServer) {
    console.error("PYTHON_SERVER_URL not defined");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);

  const origin = normalizeCity(
    clean(searchParams.get("origin"), "Bhubaneswar")
  );
  const destination = normalizeCity(
    clean(searchParams.get("destination"), "Puri")
  );

  const days = Number(clean(searchParams.get("days"), "3"));
  const budget = Number(clean(searchParams.get("budget"), "5000"));
  const people = Number(clean(searchParams.get("people"), "1"));
  const preferences = clean(searchParams.get("preferences"), "beach");
  const tripType = clean(searchParams.get("tripType"), "oneWay");
  const journeyDate = clean(
    searchParams.get("journeyDate"),
    new Date().toISOString()
  );
  const travelClass = clean(searchParams.get("travelClass"), "economy");

  console.log(
    "Trip Plan Query:",
    origin,
    destination,
    days,
    budget,
    people,
    preferences
  );

  try {
    let result;
let retries = 2;

while (retries--) {
  const response = await axios.post(
    `${pythonServer}/trip_plan/invoke`,
    {
      input: {
        origin,
        destination,
        days,
        people,
        budget,
        preferences,
        tripType,
        journeyDate,
        travelClass,
      },
    },
    { timeout: 30000 }
  );

  result = response.data;

  const errors = validateTrip(result);

  if (errors.length === 0) break;

  console.log("Retrying due to:", errors);
}

return NextResponse.json(result);

  } catch (error: any) {
    console.error(
      "Trip plan API failed:",
      error?.response?.data || error.message
    );
    
    return NextResponse.json(
      { error: "Failed to fetch trip plan" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tripPlanId, data } = body;

    if (!tripPlanId || !data) {
      return NextResponse.json(
        { error: "tripPlanId and data are required" },
        { status: 400 }
      );
    }

    // 🔒 Ensure trip belongs to logged in user
    const existingTrip = await prisma.tripPlan.findFirst({
      where: {
        id: tripPlanId,
        author: {
          email: session.user.email,
        },
      },
    });

    if (!existingTrip) {
      return NextResponse.json(
        { error: "Trip not found or access denied" },
        { status: 404 }
      );
    }

    // 🚀 Call Python AI Server
// 🧠 Send only planning fields (NOT itinerary/food/hotel)
const cleanInput = {
  origin: data.origin,
  destination: data.destination,
  days: data.days,
  people: data.people,
  budget:
    typeof data.budget === "object"
      ? data.budget?.total
      : data.budget,
  preferences: data.preferences || "general",
  journeyDate: data.journeyDate,
  tripType: data.tripType || "oneWay",
  travelClass: data.travelClass || "economy",
};

const aiResponse = await fetch(
  `${process.env.PYTHON_SERVER_URL}/trip_plan/invoke`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: cleanInput }),
  }
);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Server Error:", errorText);

      return NextResponse.json(
        { error: "AI server failed to generate trip" },
        { status: 500 }
      );
    }

    const newTripData = await aiResponse.json();

    // 🛑 If Python returned error object
    if (newTripData?.detail) {
      console.error("AI Detail Error:", newTripData.detail);

      return NextResponse.json(
        { error: "AI generation error", detail: newTripData.detail },
        { status: 500 }
      );
    }

    // 🔍 Minimal structure validation
    if (
      !newTripData.origin ||
      !newTripData.destination ||
      !newTripData.budget ||
      !newTripData.itinerary
    ) {
      console.error("Invalid AI Structure:", newTripData);

      return NextResponse.json(
        { error: "Invalid AI response structure" },
        { status: 500 }
      );
    }

    // ✅ Update only AI fields (do NOT spread blindly)
    const updatedTrip = await prisma.tripPlan.update({
      where: { id: tripPlanId },
      data: {
        data: newTripData,
      },
      include: {
        members: {
          select: {
            email: true,
            name: true,
            image: true,
          },
        },
      },
    });

    console.log("✅ Regeneration successful for:", tripPlanId);

    return NextResponse.json(updatedTrip);
  } catch (error) {
    console.error("🔥 Regenerate Route Crash:", error);

    return NextResponse.json(
      { error: "Unexpected regeneration failure" },
      { status: 500 }
    );
  }
}
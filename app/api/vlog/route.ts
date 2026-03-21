import prisma from "@/prisma/prisma-client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { tripPlanId, images = [], query } = await req.json();

  const trip = await prisma.tripPlan.findUnique({
    where: { id: tripPlanId },
    include: {
      photos: true,
      members: true,
      blogs: true,
      vlogs: true,
    },
  });

  if (!trip) {
    return NextResponse.json(
      { error: "Trip not found" },
      { status: 404 }
    );
  }

  /* ================= NEW FLOW (USER SELECTED IMAGES) ================= */
  if (images && images.length > 0) {
    try {
      // 🔥 Call Python with selected images
      const response = await fetch(
        process.env.PYTHON_SERVER_URL + "/vlog/invoke",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: {
              tripData: trip.data,
              members: trip.members,
              images, // ✅ USER SELECTED IMAGES
            },
          }),
        }
      );

      const generated = await response.json();

      return NextResponse.json(generated);
    } catch (err) {
      console.error("Python error:", err);

      // 🔥 FALLBACK (if Python fails)
      const fallbackScenes = images.map((img: string, i: number) => ({
        image: img,
        voiceover: `Scene ${i + 1}: A beautiful moment from the journey.`,
      }));

      return NextResponse.json({
        title: "My Travel Vlog",
        scenes: fallbackScenes,
      });
    }
  }

  /* ================= OLD FLOW (QUERY BASED) ================= */
  if (query) {
    const response = await fetch(
      process.env.PYTHON_SERVER_URL + "/vlog/invoke",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            query,
            tripData: trip.data,
            members: trip.members,
            images: trip.photos.map((p) => p.url),
          },
        }),
      }
    );

    const generated = await response.json();

    return NextResponse.json(generated);
  }

  /* ================= SAFETY ================= */
  return NextResponse.json(
    { error: "Invalid request" },
    { status: 400 }
  );
}
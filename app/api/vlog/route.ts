import prisma from "@/prisma/prisma-client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { tripPlanId, images = [], query } = await req.json();

  // 🔒 ACCESS CONTROL
  const trip = await prisma.tripPlan.findFirst({
    where: {
      id: tripPlanId,
      members: {
        some: { email: session.user.email },
      },
    },
    include: {
      photos: true,
      members: true,
      blogs: true,
      vlogs: true,
    },
  });

  if (!trip) {
    return NextResponse.json(
      { error: "Access Denied or Trip not found" },
      { status: 403 }
    );
  }

  /* ================= NEW FLOW ================= */
  if (images && images.length > 0) {
    try {
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
              images,
            },
          }),
        }
      );

      const generated = await response.json();
      return NextResponse.json(generated);

    } catch (err) {
      console.error("Python error:", err);

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

  /* ================= OLD FLOW ================= */
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

  return NextResponse.json(
    { error: "Invalid request" },
    { status: 400 }
  );
}
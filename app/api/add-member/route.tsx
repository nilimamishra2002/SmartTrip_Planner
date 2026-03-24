import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma-client";

export async function POST(request: Request) {
  const body = await request.json();
  const { user_email, tripPlanId } = body;

  if (!user_email || !tripPlanId) {
    return NextResponse.json(
      { error: "Email and Trip ID required" },
      { status: 400 }
    );
  }

  try {
    // ✅ Ensure user exists
    const user = await prisma.user.upsert({
      where: { email: user_email },
      update: {},
      create: {
        email: user_email,
        name: user_email.split("@")[0],
      },
    });

    // ✅ Add user to trip
    const updatedTrip = await prisma.tripPlan.update({
      where: { id: tripPlanId },
      data: {
        members: {
          connect: { id: user.id },
        },
      },
    });

    return NextResponse.json({
      message: "User added to trip",
      tripPlanId: updatedTrip.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
import prisma from "@/prisma/prisma-client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const tripPlanId = searchParams.get("tripPlanId");

  if (!tripPlanId) {
    return NextResponse.json(
      { error: "tripPlanId required" },
      { status: 400 }
    );
  }

  // 🔒 ACCESS CONTROL
  const trip = await prisma.tripPlan.findFirst({
    where: {
      id: tripPlanId,
      members: {
        some: { email: session.user.email },
      },
    },
  });

  if (!trip) {
    return NextResponse.json(
      { error: "Access Denied" },
      { status: 403 }
    );
  }

  const vlogs = await prisma.vlog.findMany({
    where: { tripPlanId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ vlogs });
}
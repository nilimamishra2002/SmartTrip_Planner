import prisma from "@/prisma/prisma-client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tripPlanId = searchParams.get("tripPlanId");

  if (!tripPlanId) {
    return NextResponse.json({ error: "Missing tripPlanId" }, { status: 400 });
  }

  const images = await prisma.photoData.findMany({
    where: { tripPlanId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ images });
}
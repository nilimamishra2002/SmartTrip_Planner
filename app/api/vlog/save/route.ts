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

  const { tripPlanId, title, content, thumbnail } =
    await req.json();

  if (!tripPlanId || !title) {
    return NextResponse.json(
      { error: "Missing fields" },
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

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const vlog = await prisma.vlog.create({
    data: {
      title,
      content,
      thumbnail: thumbnail || "",
      tripPlanId,
      authorId: user.id,
      status: "PRIVATE",
    },
  });

  return NextResponse.json({ vlog });
}
import prisma from "@/prisma/prisma-client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/* ================= UPLOAD ================= */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { email, tripPlanId, name, url } = await req.json();

    if (!tripPlanId || !url) {
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

    // ensure user exists
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: name || email?.split("@")[0],
      },
    });

    const photo = await prisma.photoData.create({
      data: {
        url,
        name: name || "Image",
        tripPlanId,
        authorId: user.id,
      },
    });

    return NextResponse.json({ photo });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

/* ================= DELETE ================= */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { photoId } = await req.json();

  if (!photoId) {
    return NextResponse.json(
      { error: "photoId required" },
      { status: 400 }
    );
  }

  // 🔒 FETCH PHOTO WITH TRIP
  const photo = await prisma.photoData.findUnique({
    where: { id: photoId },
    include: {
      tripPlan: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!photo) {
    return NextResponse.json(
      { error: "Photo not found" },
      { status: 404 }
    );
  }

  // 🔒 ACCESS CHECK
  const isMember = photo.tripPlan.members.some(
    (m) => m.email === session.user.email
  );

  if (!isMember) {
    return NextResponse.json(
      { error: "Access Denied" },
      { status: 403 }
    );
  }

  await prisma.photoData.delete({
    where: { id: photoId },
  });

  return NextResponse.json({ success: true });
}
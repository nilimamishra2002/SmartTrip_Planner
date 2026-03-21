import prisma from "@/prisma/prisma-client";
import { NextResponse } from "next/server";

/* ================= UPLOAD ================= */
export async function POST(req: Request) {
  try {
    const { email, tripPlanId, name, url } = await req.json();

    if (!tripPlanId || !url) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
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
  const { photoId } = await req.json();

  if (!photoId) {
    return NextResponse.json(
      { error: "photoId required" },
      { status: 400 }
    );
  }

  await prisma.photoData.delete({
    where: { id: photoId },
  });

  return NextResponse.json({ success: true });
}
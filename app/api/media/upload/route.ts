import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma-client";
import cloudinary from "@/lib/cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const tripPlanId = formData.get("tripPlanId") as string;

  if (!file || !tripPlanId)
    return NextResponse.json({ error: "Missing data" }, { status: 400 });

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

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadResult: any = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `smarttrip/${tripPlanId}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      )
      .end(buffer);
  });

  const photo = await prisma.photoData.create({
    data: {
      url: uploadResult.secure_url,
      name: file.name,
      tripPlanId,
      authorId: user.id,
      status: "PRIVATE",
    },
  });

  return NextResponse.json({ photo });
}
import prisma from "@/prisma/prisma-client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { vlogId } = await req.json();

  if (!vlogId) {
    return NextResponse.json(
      { error: "Vlog ID required" },
      { status: 400 }
    );
  }

  // 🔒 FETCH VLOG WITH TRIP MEMBERS
  const vlog = await prisma.vlog.findUnique({
    where: { id: vlogId },
    include: {
      tripPlan: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!vlog) {
    return NextResponse.json(
      { error: "Vlog not found" },
      { status: 404 }
    );
  }

  // 🔒 ACCESS CHECK
  const isMember = vlog.tripPlan.members.some(
    (m) => m.email === session.user.email
  );

  if (!isMember) {
    return NextResponse.json(
      { error: "Access Denied" },
      { status: 403 }
    );
  }

  await prisma.vlog.delete({
    where: { id: vlogId },
  });

  return NextResponse.json({ success: true });
}
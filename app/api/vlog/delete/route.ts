import prisma from "@/prisma/prisma-client";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const { vlogId } = await req.json();

  if (!vlogId) {
    return NextResponse.json(
      { error: "Vlog ID required" },
      { status: 400 }
    );
  }

  await prisma.vlog.delete({
    where: { id: vlogId },
  });

  return NextResponse.json({ success: true });
}
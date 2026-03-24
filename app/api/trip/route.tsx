import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/* ================= HELPER ================= */

async function checkTripAccess(tripId: string, email: string) {
  return await prisma.tripPlan.findFirst({
    where: {
      id: tripId,
      members: {
        some: { email },
      },
    },
  });
}

async function checkTripOwner(tripId: string, email: string) {
  return await prisma.tripPlan.findFirst({
    where: {
      id: tripId,
      author: {
        email,
      },
    },
  });
}

/* ================= GET USER TRIPS ================= */

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  // ✅ Get ALL trips where user is a member
  const trips = await prisma.tripPlan.findMany({
    where: {
      members: {
        some: { email },
      },
    },
    include: {
      members: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      },
      photos: {
        orderBy: { createdAt: "desc" },
      },
      blogs: {
        orderBy: { createdAt: "desc" },
      },
      vlogs: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ trips });
}

/* ================= CREATE TRIP ================= */

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;
  const body = await request.json();

  try {
    // ✅ Ensure user exists
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: email.split("@")[0],
      },
    });

    const newTrip = await prisma.tripPlan.create({
      data: {
        authorId: user.id,
        members: {
          connect: { id: user.id }, // creator is member
        },
        data: body.data,
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(newTrip, { status: 201 });
  } catch (error) {
    console.error("Create trip error:", error);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 }
    );
  }
}

/* ================= UPDATE TRIP ================= */

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tripPlanId, data } = body;

  if (!tripPlanId) {
    return NextResponse.json(
      { error: "Trip ID required" },
      { status: 400 }
    );
  }

  try {
    // 🔒 Check access (member)
    const trip = await checkTripAccess(
      tripPlanId,
      session.user.email
    );

    if (!trip) {
      return NextResponse.json(
        { error: "Access Denied" },
        { status: 403 }
      );
    }

    const updatedTrip = await prisma.tripPlan.update({
      where: { id: tripPlanId },
      data: {
        data,
      },
    });

    return NextResponse.json(updatedTrip);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Failed to update trip" },
      { status: 500 }
    );
  }
}

/* ================= ADD MEMBER ================= */

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tripPlanId, email } = body;

  if (!tripPlanId || !email) {
    return NextResponse.json(
      { error: "tripPlanId and email required" },
      { status: 400 }
    );
  }

  try {
    // 🔒 Only OWNER can add members
    const isOwner = await checkTripOwner(
      tripPlanId,
      session.user.email
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Only owner can add members" },
        { status: 403 }
      );
    }

    // ✅ Ensure user exists
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: email.split("@")[0],
      },
    });

    const updatedTrip = await prisma.tripPlan.update({
      where: { id: tripPlanId },
      data: {
        members: {
          connect: { id: user.id },
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(updatedTrip);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}

/* ================= REMOVE MEMBER / DELETE TRIP ================= */

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tripPlanId, memberId } = body;

    if (!tripPlanId) {
      return NextResponse.json(
        { error: "Trip ID required" },
        { status: 400 }
      );
    }

    // 🔒 Only OWNER can modify members or delete trip
    const isOwner = await checkTripOwner(
      tripPlanId,
      session.user.email
    );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Only owner can perform this action" },
        { status: 403 }
      );
    }

    // 🧠 CASE 1: REMOVE MEMBER
    if (memberId) {
      const updatedTrip = await prisma.tripPlan.update({
        where: { id: tripPlanId },
        data: {
          members: {
            disconnect: { id: memberId },
          },
        },
        include: {
          members: true,
        },
      });

      return NextResponse.json(updatedTrip);
    }

    // 🧠 CASE 2: DELETE TRIP
    await prisma.tripPlan.delete({
      where: { id: tripPlanId },
    });

    return NextResponse.json({ message: "Trip deleted" });

  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
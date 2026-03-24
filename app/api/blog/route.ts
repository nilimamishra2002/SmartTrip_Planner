import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma-client";
import axios from "axios";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const pythonServer = process.env.PYTHON_SERVER_URL;

/* ===========================
   HELPER: CHECK TRIP ACCESS
=========================== */
async function checkTripAccess(tripPlanId: string, email: string) {
  return await prisma.tripPlan.findFirst({
    where: {
      id: tripPlanId,
      members: {
        some: { email },
      },
    },
  });
}

/* ===========================
   GET BLOGS (Shared)
=========================== */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const tripPlanId = searchParams.get("tripPlanId");
    const query = searchParams.get("query") || "";

    if (!tripPlanId) {
      return NextResponse.json(
        { error: "tripPlanId is required" },
        { status: 400 }
      );
    }

    // 🔒 ACCESS CONTROL
    const trip = await checkTripAccess(tripPlanId, session.user.email);

    if (!trip) {
      return NextResponse.json(
        { error: "Access Denied" },
        { status: 403 }
      );
    }

    const blogs = await prisma.blog.findMany({
      where: {
        tripPlanId,
        content: {
          contains: query,
          mode: "insensitive",
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ blogs, count: blogs.length });
  } catch (error) {
    console.error("GET /api/blog error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}

/* ===========================
   POST BLOG (Manual + AI)
=========================== */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tripPlanId, query, content, title } = body;

    if (!tripPlanId) {
      return NextResponse.json(
        { error: "tripPlanId is required" },
        { status: 400 }
      );
    }

    // 🔒 ACCESS CONTROL
    const trip = await checkTripAccess(tripPlanId, session.user.email);

    if (!trip) {
      return NextResponse.json(
        { error: "Access Denied" },
        { status: 403 }
      );
    }

    const userEmail = session.user.email;

    /* ========= 1. MANUAL BLOG ========= */
    if (content && title) {
      const blog = await prisma.blog.create({
        data: {
          title,
          content,
          author: { connect: { email: userEmail } },
          tripPlan: { connect: { id: tripPlanId } },
        },
        include: {
          author: { select: { name: true, email: true } },
        },
      });

      return NextResponse.json({ blog });
    }

    /* ========= 2. AI BLOG ========= */

    if (!pythonServer) {
      return NextResponse.json(
        { error: "Python server not configured" },
        { status: 500 }
      );
    }

    const fullTrip = await prisma.tripPlan.findUnique({
      where: { id: tripPlanId },
      include: { members: true },
    });

    if (!fullTrip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    const response = await axios.post(
      `${pythonServer}/blog/invoke`,
      {
        input: {
          name: session.user.name || "Traveler",
          query,
          tripData: fullTrip.data,
          members: fullTrip.members,
        },
      },
      { timeout: 30000 }
    );

    const aiBlog = response.data;

    if (!aiBlog?.title || !aiBlog?.content) {
      return NextResponse.json(
        { error: "Invalid AI blog structure" },
        { status: 500 }
      );
    }

    const savedBlog = await prisma.blog.create({
      data: {
        title: aiBlog.title,
        content: aiBlog.content,
        author: { connect: { email: userEmail } },
        tripPlan: { connect: { id: tripPlanId } },
      },
      include: {
        author: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ savedBlog });
  } catch (error: any) {
    console.error("POST /api/blog error:", error?.message);
    return NextResponse.json(
      { error: "Blog creation failed" },
      { status: 500 }
    );
  }
}

/* ===========================
   DELETE BLOG
=========================== */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { blogId } = body;

    if (!blogId) {
      return NextResponse.json(
        { error: "blogId required" },
        { status: 400 }
      );
    }

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        tripPlan: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // 🔒 MEMBER CHECK
    const isMember = blog.tripPlan.members.some(
      (m) => m.email === session.user.email
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "Access Denied" },
        { status: 403 }
      );
    }

    await prisma.blog.delete({
      where: { id: blogId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/blog error:", error);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
}
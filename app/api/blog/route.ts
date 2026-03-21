import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma-client";
import axios from "axios";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

const pythonServer = process.env.PYTHON_SERVER_URL;

// =====================
// GET BLOGS
// =====================

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const tripPlanId = searchParams.get("tripPlanId");
    const query = searchParams.get("query") || "";

    if (!tripPlanId) {
      return NextResponse.json(
        { error: "tripPlanId is required" },
        { status: 400 }
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
      include: { author: true },
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

// =====================
// POST BLOG
// =====================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripPlanId, query, content, title } = body;

    if (!tripPlanId) {
      return NextResponse.json(
        { error: "tripPlanId is required" },
        { status: 400 }
      );
    }

    // 🔐 Get logged-in user securely
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // ============================================
    // 1️⃣ If manual content → Save directly
    // ============================================

    if (content && title) {
      const blog = await prisma.blog.create({
        data: {
          title,
          content,
          author: { connect: { email: userEmail } },
          tripPlan: { connect: { id: tripPlanId } },
        },
        include: {
          author: { select: { name: true } },
        },
      });

      return NextResponse.json({blog});
    }

    // ============================================
    // 2️⃣ Generate Blog via Python AI
    // ============================================

    if (!pythonServer) {
      return NextResponse.json(
        { error: "Python server not configured" },
        { status: 500 }
      );
    }

    const tripPlan = await prisma.tripPlan.findUnique({
      where: { id: tripPlanId },
      include: { members: true },
    });

    if (!tripPlan) {
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
          tripData: tripPlan.data,
          members: tripPlan.members,
        },
      },
      { timeout: 30_000 }
    );

    const aiBlog = response.data;

    if (!aiBlog?.title || !aiBlog?.content) {
      return NextResponse.json(
        { error: "Invalid AI blog structure" },
        { status: 500 }
      );
    }

    // ✅ Auto-save generated blog
    const savedBlog = await prisma.blog.create({
      data: {
        title: aiBlog.title,
        content: aiBlog.content,
        author: { connect: { email: userEmail } },
        tripPlan: { connect: { id: tripPlanId } },
      },
      include: {
        author: { select: { name: true } },
      },
    });

    return NextResponse.json({savedBlog});
  } catch (error: any) {
    console.error("POST /api/blog error:", error?.message);
    return NextResponse.json(
      { error: "Blog generation failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { blogId } = body;

  if (!blogId) {
    return NextResponse.json(
      { error: "blogId required" },
      { status: 400 }
    );
  }

  await prisma.blog.delete({
    where: { id: blogId },
  });

  return NextResponse.json({ success: true });
}
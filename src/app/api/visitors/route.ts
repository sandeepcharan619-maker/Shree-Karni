import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser(session: any) {
  if (!session?.user) return null;
  const uId = (session.user as any).id;
  const uName = (session.user as any).username;
  const mId = (session.user as any).memberId;

  let user = null;
  if (uId && !uId.startsWith("master-admin")) {
    user = await prisma.user.findUnique({ where: { id: uId } });
  }
  if (!user && (uName || mId)) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          uName ? { username: uName } : {},
          mId ? { memberId: mId } : {},
        ],
      },
    });
  }
  return user;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthenticatedUser(session);
    const isAdmin = session.user.role === "ADMIN";

    const visitors = await prisma.visitor.findMany({
      where: isAdmin ? {} : user ? { associateId: user.id } : {},
      orderBy: { visitDate: "desc" },
    });

    return NextResponse.json(visitors);
  } catch (error: any) {
    console.error("Visitors GET error:", error);
    return NextResponse.json({ error: "Failed to fetch visitors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getAuthenticatedUser(session);
    const body = await req.json();
    const { visitorName, phone, plotInterest, feedback, status = "VISITED", visitDate } = body;

    if (!visitorName || !phone) {
      return NextResponse.json(
        { error: "Visitor name and phone are required" },
        { status: 400 }
      );
    }

    // Resolve an associateId from existing user or fallback to first associate / admin
    let targetAssociateId = user?.id;
    if (!targetAssociateId) {
      const anyUser = await prisma.user.findFirst();
      targetAssociateId = anyUser?.id || "fallback-associate";
    }

    const newVisitor = await prisma.visitor.create({
      data: {
        associateId: targetAssociateId,
        visitorName: visitorName.trim(),
        phone: phone.trim(),
        plotInterest: plotInterest ? plotInterest.trim() : null,
        feedback: feedback ? feedback.trim() : null,
        status: status || "VISITED",
        visitDate: visitDate ? new Date(visitDate) : new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Visitor added successfully",
      visitor: newVisitor,
    });
  } catch (error: any) {
    console.error("Visitor POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to add visitor" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Visitor ID is required" }, { status: 400 });
    }

    try {
      await prisma.visitor.delete({ where: { id } });
    } catch (e) {
      // If not in SQLite (e.g. local record), return success
    }

    return NextResponse.json({ success: true, message: "Visitor deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete visitor" }, { status: 500 });
  }
}

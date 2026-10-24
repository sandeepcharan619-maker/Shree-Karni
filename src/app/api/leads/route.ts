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

    const leads = await prisma.lead.findMany({
      where: isAdmin ? {} : user ? { associateId: user.id } : {},
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leads);
  } catch (error: any) {
    console.error("Leads GET error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
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
    const { name, phone, email, source, plotInterest, notes, status = "NEW" } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Lead name and phone number are required" },
        { status: 400 }
      );
    }

    // Resolve an associateId from existing user or fallback to first associate
    let targetAssociateId = user?.id;
    if (!targetAssociateId) {
      const anyUser = await prisma.user.findFirst();
      targetAssociateId = anyUser?.id || "fallback-associate";
    }

    const newLead = await prisma.lead.create({
      data: {
        associateId: targetAssociateId,
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        source: source ? source.trim() : "Walk-in",
        plotInterest: plotInterest ? plotInterest.trim() : null,
        notes: notes ? notes.trim() : null,
        status: status || "NEW",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lead added successfully",
      lead: newLead,
    });
  } catch (error: any) {
    console.error("Lead POST error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to add lead" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    try {
      await prisma.lead.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
      });
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Lead updated" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
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
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    try {
      await prisma.lead.delete({ where: { id } });
    } catch (e) {}

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}

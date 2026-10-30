import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function isAdmin(session: any): boolean {
  if (!session?.user) return false;
  const role = (session.user.role || "").toUpperCase();
  const username = (session.user.username || "").toLowerCase();
  const memberId = (session.user.memberId || "").toUpperCase();
  return role === "ADMIN" || username === "admin" || memberId === "SKRADMIN";
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const associateId = searchParams.get("associateId");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (source && source !== "ALL") {
      where.source = source;
    }
    if (associateId && associateId !== "ALL") {
      where.associateId = associateId === "UNASSIGNED" ? null : associateId;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { plotInterest: { contains: q } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        associate: {
          select: { id: true, name: true, memberId: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leads);
  } catch (error: any) {
    console.error("GET CRM Leads error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      phone,
      email,
      status = "NEW",
      source = "Website",
      budget,
      preferredSizeGaj,
      preferredLocation = "Jaipur",
      plotInterest,
      notes,
      followUpDate,
      associateId,
    } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and Phone number are required" }, { status: 400 });
    }

    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9+]/g, "").trim();

    const newLead = await prisma.lead.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        status: status || "NEW",
        source: source || "Website",
        budget: budget ? String(budget).trim() : null,
        preferredSizeGaj: preferredSizeGaj ? parseFloat(String(preferredSizeGaj)) : null,
        preferredLocation: preferredLocation ? preferredLocation.trim() : "Jaipur",
        plotInterest: plotInterest ? plotInterest.trim() : null,
        notes: notes ? notes.trim() : null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        associateId: associateId && associateId !== "UNASSIGNED" ? associateId : null,
      },
      include: {
        associate: {
          select: { id: true, name: true, memberId: true },
        },
      },
    });

    try {
      revalidatePath("/admin");
    } catch {}

    return NextResponse.json({
      success: true,
      lead: newLead,
      message: `Enquiry for ${newLead.name} logged successfully!`,
    });
  } catch (error: any) {
    console.error("POST CRM Lead error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create lead" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name,
      phone,
      email,
      status,
      source,
      budget,
      preferredSizeGaj,
      preferredLocation,
      plotInterest,
      notes,
      followUpDate,
      associateId,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone.replace(/[^0-9+]/g, "").trim();
    if (email !== undefined) updateData.email = email ? email.trim() : null;
    if (status) updateData.status = status;
    if (source) updateData.source = source;
    if (budget !== undefined) updateData.budget = budget ? String(budget).trim() : null;
    if (preferredSizeGaj !== undefined) {
      updateData.preferredSizeGaj = preferredSizeGaj ? parseFloat(String(preferredSizeGaj)) : null;
    }
    if (preferredLocation) updateData.preferredLocation = preferredLocation.trim();
    if (plotInterest !== undefined) updateData.plotInterest = plotInterest ? plotInterest.trim() : null;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;
    if (followUpDate !== undefined) {
      updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;
    }
    if (associateId !== undefined) {
      updateData.associateId = !associateId || associateId === "UNASSIGNED" ? null : associateId;
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: updateData,
      include: {
        associate: {
          select: { id: true, name: true, memberId: true },
        },
      },
    });

    try {
      revalidatePath("/admin");
    } catch {}

    return NextResponse.json({
      success: true,
      lead: updated,
      message: `Lead ${updated.name} updated successfully!`,
    });
  } catch (error: any) {
    console.error("PATCH CRM Lead error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id || req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    await prisma.lead.delete({
      where: { id },
    });

    try {
      revalidatePath("/admin");
    } catch {}

    return NextResponse.json({ success: true, message: "Lead removed successfully." });
  } catch (error: any) {
    console.error("DELETE CRM Lead error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete lead" }, { status: 500 });
  }
}

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
    const project = searchParams.get("project");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (project && project !== "ALL") where.projectName = project;

    const visits = await prisma.visitor.findMany({
      where,
      include: {
        associate: {
          select: { id: true, name: true, memberId: true, phone: true },
        },
      },
      orderBy: { visitDate: "asc" },
    });

    return NextResponse.json(visits);
  } catch (error: any) {
    console.error("GET Site Visits error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch site visits" }, { status: 500 });
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
      visitorName,
      phone,
      email,
      projectName = "Shree Karni City",
      plotInterest,
      visitDate,
      timeSlot = "10:00 AM - 12:00 PM",
      pickupLocation,
      driverOrCab,
      associateId,
      feedback,
      rating = 5,
      status = "SCHEDULED",
    } = body;

    if (!visitorName || !phone) {
      return NextResponse.json({ error: "Visitor name and phone are required" }, { status: 400 });
    }

    const newVisit = await prisma.visitor.create({
      data: {
        visitorName: visitorName.trim(),
        phone: phone.replace(/[^0-9+]/g, "").trim(),
        email: email ? email.trim() : null,
        projectName: projectName ? projectName.trim() : "Shree Karni City",
        plotInterest: plotInterest ? plotInterest.trim() : null,
        visitDate: visitDate ? new Date(visitDate) : new Date(),
        timeSlot: timeSlot || "10:00 AM - 12:00 PM",
        pickupLocation: pickupLocation ? pickupLocation.trim() : null,
        driverOrCab: driverOrCab ? driverOrCab.trim() : null,
        associateId: associateId && associateId !== "UNASSIGNED" ? associateId : null,
        feedback: feedback ? feedback.trim() : null,
        rating: typeof rating === "number" ? rating : 5,
        status: status || "SCHEDULED",
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
      visit: newVisit,
      message: `Site visit for ${newVisit.visitorName} scheduled successfully!`,
    });
  } catch (error: any) {
    console.error("POST Site Visit error:", error);
    return NextResponse.json({ error: error?.message || "Failed to schedule site visit" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, feedback, rating, visitDate, timeSlot, pickupLocation, driverOrCab, associateId, plotInterest } = body;

    if (!id) {
      return NextResponse.json({ error: "Site visit ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (feedback !== undefined) updateData.feedback = feedback ? feedback.trim() : null;
    if (rating !== undefined) updateData.rating = typeof rating === "number" ? rating : parseInt(rating, 10);
    if (visitDate) updateData.visitDate = new Date(visitDate);
    if (timeSlot) updateData.timeSlot = timeSlot;
    if (pickupLocation !== undefined) updateData.pickupLocation = pickupLocation ? pickupLocation.trim() : null;
    if (driverOrCab !== undefined) updateData.driverOrCab = driverOrCab ? driverOrCab.trim() : null;
    if (associateId !== undefined) updateData.associateId = !associateId || associateId === "UNASSIGNED" ? null : associateId;
    if (plotInterest !== undefined) updateData.plotInterest = plotInterest ? plotInterest.trim() : null;

    const updated = await prisma.visitor.update({
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
      visit: updated,
      message: `Site visit updated successfully!`,
    });
  } catch (error: any) {
    console.error("PATCH Site Visit error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update site visit" }, { status: 500 });
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
      return NextResponse.json({ error: "Site visit ID is required" }, { status: 400 });
    }

    await prisma.visitor.delete({
      where: { id },
    });

    try {
      revalidatePath("/admin");
    } catch {}

    return NextResponse.json({ success: true, message: "Site visit removed successfully." });
  } catch (error: any) {
    console.error("DELETE Site Visit error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete site visit" }, { status: 500 });
  }
}

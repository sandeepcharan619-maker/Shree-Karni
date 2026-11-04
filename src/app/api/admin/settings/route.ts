import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const activityLogs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        memberId: true,
        createdAt: true,
      },
    });

    const totalRecords = {
      projects: await prisma.project.count(),
      plots: await prisma.plot.count(),
      customers: await prisma.customer.count(),
      bookings: await prisma.booking.count(),
      payments: await prisma.payment.count(),
      associates: await prisma.user.count({ where: { role: "ASSOCIATE" } }),
      activityLogs: await prisma.activityLog.count(),
    };

    return NextResponse.json({
      activityLogs,
      adminUser,
      totalRecords,
    });
  } catch (error: any) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch settings" }, { status: 500 });
  }
}

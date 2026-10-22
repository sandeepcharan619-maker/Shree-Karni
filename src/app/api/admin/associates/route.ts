import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const associates = await prisma.user.findMany({
      where: { role: "ASSOCIATE" },
      include: {
        _count: { select: { referrals: true, sales: true, leads: true } },
        referredBy: { select: { name: true, memberId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(associates);
  } catch (error) {
    console.error("Admin associates error:", error);
    return NextResponse.json({ error: "Failed to fetch associates" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, isActive, rank } = await req.json();

    const updateData: any = {};
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (rank) updateData.rank = rank;

    await prisma.user.update({ where: { id }, data: updateData });
    return NextResponse.json({ message: "Associate updated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

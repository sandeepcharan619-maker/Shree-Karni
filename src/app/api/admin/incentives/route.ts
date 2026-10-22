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

    const incentives = await prisma.incentive.findMany({
      include: { associate: { select: { name: true, memberId: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(incentives);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch incentives" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await req.json();
    const incentive = await prisma.incentive.findUnique({ where: { id } });
    if (!incentive) return NextResponse.json({ error: "Incentive not found" }, { status: 404 });

    // If changing to PAID, add to user's wallet
    if (status === "PAID" && incentive.status !== "PAID") {
      await prisma.user.update({
        where: { id: incentive.associateId },
        data: { walletBalance: { increment: incentive.amount } },
      });
    }

    await prisma.incentive.update({ where: { id }, data: { status } });
    return NextResponse.json({ message: "Incentive updated" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update incentive" }, { status: 500 });
  }
}

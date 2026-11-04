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

    const rules = await prisma.commissionRule.findMany({
      orderBy: { directPercent: "asc" },
    });

    const incentives = await prisma.incentive.findMany({
      include: {
        associate: {
          select: {
            id: true,
            name: true,
            memberId: true,
            phone: true,
            rank: true,
            walletBalance: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalPaid = incentives.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.amount, 0);
    const totalApproved = incentives.filter((i) => i.status === "APPROVED").reduce((sum, i) => sum + i.amount, 0);
    const totalPending = incentives.filter((i) => i.status === "PENDING").reduce((sum, i) => sum + i.amount, 0);

    return NextResponse.json({
      rules,
      incentives,
      totalPaid,
      totalApproved,
      totalPending,
    });
  } catch (error: any) {
    console.error("GET /api/admin/commissions error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch commission data" }, { status: 500 });
  }
}

// POST: Update commission rule
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rank, directPercent, teamPercent, fixedPerGaj, bonusThreshold, bonusAmount } = body;

    if (!rank) {
      return NextResponse.json({ error: "Rank is required" }, { status: 400 });
    }

    const rule = await prisma.commissionRule.upsert({
      where: { rank },
      update: {
        ...(directPercent !== undefined ? { directPercent: parseFloat(directPercent) } : {}),
        ...(teamPercent !== undefined ? { teamPercent: parseFloat(teamPercent) } : {}),
        ...(fixedPerGaj !== undefined ? { fixedPerGaj: parseFloat(fixedPerGaj) } : {}),
        ...(bonusThreshold !== undefined ? { bonusThreshold: parseFloat(bonusThreshold) } : {}),
        ...(bonusAmount !== undefined ? { bonusAmount: parseFloat(bonusAmount) } : {}),
      },
      create: {
        rank,
        directPercent: directPercent ? parseFloat(directPercent) : 5.0,
        teamPercent: teamPercent ? parseFloat(teamPercent) : 2.0,
        fixedPerGaj: fixedPerGaj ? parseFloat(fixedPerGaj) : 100.0,
        bonusThreshold: bonusThreshold ? parseFloat(bonusThreshold) : 1000000.0,
        bonusAmount: bonusAmount ? parseFloat(bonusAmount) : 25000.0,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: "COMMISSION_RULE_UPDATED",
        entity: "CommissionRule",
        details: `Updated commission rule for rank "${rank}" (Direct: ${rule.directPercent}%, Team: ${rule.teamPercent}%)`,
        performedBy: session.user.name || "Admin",
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    console.error("POST /api/admin/commissions error:", error);
    return NextResponse.json({ error: error.message || "Failed to update rule" }, { status: 500 });
  }
}

// PATCH: Approve or Mark as Paid
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "ID and status are required" }, { status: 400 });
    }

    const incentive = await prisma.incentive.findUnique({
      where: { id },
      include: { associate: true },
    });

    if (!incentive) {
      return NextResponse.json({ error: "Incentive not found" }, { status: 404 });
    }

    const updated = await prisma.incentive.update({
      where: { id },
      data: { status },
    });

    // If marked as PAID and it wasn't PAID before, credit associate's walletBalance
    if (status === "PAID" && incentive.status !== "PAID") {
      await prisma.user.update({
        where: { id: incentive.associateId },
        data: { walletBalance: { increment: incentive.amount } },
      });
    }

    await prisma.activityLog.create({
      data: {
        action: "COMMISSION_STATUS_UPDATED",
        entity: "Incentive",
        entityId: id,
        details: `Commission of ₹${incentive.amount.toLocaleString("en-IN")} for ${incentive.associate.name} marked as ${status}`,
        performedBy: session.user.name || "Admin",
      },
    });

    return NextResponse.json({ success: true, incentive: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/commissions error:", error);
    return NextResponse.json({ error: error.message || "Failed to update commission" }, { status: 500 });
  }
}

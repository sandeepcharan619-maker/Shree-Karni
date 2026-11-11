import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [rules, slabs, incentives] = await Promise.all([
      prisma.commissionRule.findMany({
        orderBy: { directPercent: "asc" },
      }),
      prisma.commissionSlab.findMany({
        orderBy: { minSqYard: "asc" },
      }),
      prisma.incentive.findMany({
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
      }),
    ]);

    const totalPaid = incentives.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.amount, 0);
    const totalApproved = incentives.filter((i) => i.status === "APPROVED").reduce((sum, i) => sum + i.amount, 0);
    const totalPending = incentives.filter((i) => i.status === "PENDING").reduce((sum, i) => sum + i.amount, 0);

    return NextResponse.json({
      rules,
      slabs,
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

// POST: Update or create commission rule or commission slab
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 1. Commission Slab (Volume-Based Per Gaj Slab)
    if (body.action === "SLAB" || body.rangeLabel || body.associateRate !== undefined) {
      const { id, rangeLabel, minSqYard, maxSqYard, associateRate, teamLeaderRate, totalRate } = body;

      if (!rangeLabel || !rangeLabel.trim()) {
        return NextResponse.json({ error: "Sales range label is required (e.g. 0 - 249)" }, { status: 400 });
      }

      const numericAssociateRate = parseFloat(associateRate);
      if (isNaN(numericAssociateRate) || numericAssociateRate < 0) {
        return NextResponse.json({ error: "Valid Associate rate (₹ / Sq. Yard) is required" }, { status: 400 });
      }

      let slab;
      if (id) {
        slab = await prisma.commissionSlab.update({
          where: { id },
          data: {
            rangeLabel: rangeLabel.trim(),
            minSqYard: minSqYard !== undefined ? parseFloat(minSqYard) : 0,
            maxSqYard: maxSqYard !== undefined && maxSqYard !== null && maxSqYard !== "" ? parseFloat(maxSqYard) : null,
            associateRate: numericAssociateRate,
            teamLeaderRate: teamLeaderRate !== undefined && teamLeaderRate !== "" ? parseFloat(teamLeaderRate) : 0,
            totalRate: totalRate !== undefined && totalRate !== "" ? parseFloat(totalRate) : 1500,
          },
        });
      } else {
        slab = await prisma.commissionSlab.upsert({
          where: { rangeLabel: rangeLabel.trim() },
          update: {
            minSqYard: minSqYard !== undefined ? parseFloat(minSqYard) : 0,
            maxSqYard: maxSqYard !== undefined && maxSqYard !== null && maxSqYard !== "" ? parseFloat(maxSqYard) : null,
            associateRate: numericAssociateRate,
            teamLeaderRate: teamLeaderRate !== undefined && teamLeaderRate !== "" ? parseFloat(teamLeaderRate) : 0,
            totalRate: totalRate !== undefined && totalRate !== "" ? parseFloat(totalRate) : 1500,
          },
          create: {
            rangeLabel: rangeLabel.trim(),
            minSqYard: minSqYard !== undefined ? parseFloat(minSqYard) : 0,
            maxSqYard: maxSqYard !== undefined && maxSqYard !== null && maxSqYard !== "" ? parseFloat(maxSqYard) : null,
            associateRate: numericAssociateRate,
            teamLeaderRate: teamLeaderRate !== undefined && teamLeaderRate !== "" ? parseFloat(teamLeaderRate) : 0,
            totalRate: totalRate !== undefined && totalRate !== "" ? parseFloat(totalRate) : 1500,
          },
        });
      }

      await prisma.activityLog.create({
        data: {
          action: "COMMISSION_SLAB_UPDATED",
          entity: "CommissionSlab",
          details: `Saved commission slab "${rangeLabel}" (Associate: ₹${slab.associateRate}/Gaj, Team Leader: ₹${slab.teamLeaderRate || 0}/Gaj)`,
          performedBy: session.user.name || "Admin",
        },
      });

      try {
        revalidatePath("/admin/incentives");
        revalidatePath("/dashboard/incentives");
      } catch {}

      return NextResponse.json({
        success: true,
        slab,
        message: `Commission slab "${rangeLabel}" saved successfully!`,
      });
    }

    // 2. Rank-wise Commission Rule
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
        details: `Saved commission rule for rank "${rank}" (Direct: ${rule.directPercent}%, Team: ${rule.teamPercent}%)`,
        performedBy: session.user.name || "Admin",
      },
    });

    try {
      revalidatePath("/admin/incentives");
      revalidatePath("/dashboard/incentives");
      revalidatePath("/admin/associates");
    } catch {}

    return NextResponse.json({
      success: true,
      rule,
      message: `Commission rule for "${rank}" saved successfully.`,
    });
  } catch (error: any) {
    console.error("POST /api/admin/commissions error:", error);
    return NextResponse.json({ error: error.message || "Failed to update commission" }, { status: 500 });
  }
}

// DELETE: Delete a commission rule or commission slab
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id || req.nextUrl.searchParams.get("id");
    const rank = body.rank || req.nextUrl.searchParams.get("rank");
    const type = body.type || req.nextUrl.searchParams.get("type");

    // Delete Commission Slab
    if (type === "SLAB") {
      if (!id) {
        return NextResponse.json({ error: "Slab ID is required" }, { status: 400 });
      }

      const slab = await prisma.commissionSlab.findUnique({ where: { id } });
      if (!slab) {
        return NextResponse.json({ success: true, message: "Slab already removed" });
      }

      await prisma.commissionSlab.delete({ where: { id } });

      await prisma.activityLog.create({
        data: {
          action: "COMMISSION_SLAB_DELETED",
          entity: "CommissionSlab",
          details: `Deleted commission slab "${slab.rangeLabel}"`,
          performedBy: session.user.name || "Admin",
        },
      });

      try {
        revalidatePath("/admin/incentives");
        revalidatePath("/dashboard/incentives");
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Commission slab "${slab.rangeLabel}" deleted successfully.`,
      });
    }

    if (!id && !rank) {
      return NextResponse.json({ error: "Rule ID or Rank is required" }, { status: 400 });
    }

    const rule = await prisma.commissionRule.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(rank ? [{ rank }] : []),
        ],
      },
    });

    if (!rule) {
      return NextResponse.json({ success: true, message: "Rule already removed" });
    }

    await prisma.commissionRule.delete({
      where: { id: rule.id },
    });

    await prisma.activityLog.create({
      data: {
        action: "COMMISSION_RULE_DELETED",
        entity: "CommissionRule",
        details: `Deleted commission rule for rank "${rule.rank}"`,
        performedBy: session.user.name || "Admin",
      },
    });

    try {
      revalidatePath("/admin/incentives");
      revalidatePath("/dashboard/incentives");
      revalidatePath("/admin/associates");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Commission rule for "${rule.rank}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/commissions error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete rule" }, { status: 500 });
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

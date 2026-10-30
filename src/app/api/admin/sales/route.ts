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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sales = await prisma.sale.findMany({
      include: {
        plot: true,
        soldBy: { select: { id: true, name: true, memberId: true } },
      },
      orderBy: { saleDate: "desc" },
    });

    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch sales" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = body.id || req.nextUrl.searchParams.get("id");
    const clearAll = body.all === true || req.nextUrl.searchParams.get("all") === "true";

    if (clearAll || !id) {
      // Delete all sales and free all sold plots
      await prisma.$transaction(async (tx) => {
        const allSales = await tx.sale.findMany({ select: { plotId: true } });
        const plotIds = allSales.map((s) => s.plotId).filter(Boolean);

        await tx.sale.deleteMany({});

        if (plotIds.length > 0) {
          await tx.plot.updateMany({
            where: { id: { in: plotIds }, status: "SOLD" },
            data: { status: "AVAILABLE" },
          });
        }
      });

      try {
        revalidatePath("/admin");
        revalidatePath("/admin/sales");
        revalidatePath("/admin/plots");
      } catch {}

      return NextResponse.json({
        success: true,
        message: "All sales records have been deleted successfully.",
      });
    }

    // Delete single sale by id
    const targetSale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!targetSale) {
      return NextResponse.json({ success: true, message: "Sale already removed" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.sale.delete({ where: { id } });
      if (targetSale.plotId) {
        await tx.plot.update({
          where: { id: targetSale.plotId },
          data: { status: "AVAILABLE" },
        });
      }
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/admin/sales");
      revalidatePath("/admin/plots");
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Sale record deleted and plot restored to Available.",
    });
  } catch (error: any) {
    console.error("Delete sale error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete sale" },
      { status: 500 }
    );
  }
}

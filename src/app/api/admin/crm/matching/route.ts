import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const sizeGaj = searchParams.get("sizeGaj");
    const maxBudget = searchParams.get("maxBudget");
    const minBudget = searchParams.get("minBudget");
    const location = searchParams.get("location");
    const project = searchParams.get("project");

    const where: any = {
      status: "AVAILABLE",
    };

    if (location && location !== "ALL") {
      where.location = { contains: location };
    }
    if (project && project !== "ALL") {
      where.projectName = { contains: project };
    }

    if (minBudget || maxBudget) {
      where.totalPrice = {};
      if (minBudget) where.totalPrice.gte = parseFloat(minBudget);
      if (maxBudget) where.totalPrice.lte = parseFloat(maxBudget);
    }

    if (sizeGaj) {
      const targetSize = parseFloat(sizeGaj);
      if (!isNaN(targetSize)) {
        where.sizeGaj = {
          gte: Math.max(50, targetSize - 40),
          lte: targetSize + 40,
        };
      }
    }

    const matchedPlots = await prisma.plot.findMany({
      where,
      orderBy: { pricePerGaj: "asc" },
      take: 20,
    });

    return NextResponse.json(matchedPlots);
  } catch (error: any) {
    console.error("GET matching plots error:", error);
    return NextResponse.json({ error: error?.message || "Failed to match properties" }, { status: 500 });
  }
}

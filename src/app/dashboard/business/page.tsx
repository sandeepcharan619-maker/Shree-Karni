import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MyBusinessDashboardView, {
  SoldPlotItem,
  BusinessSummary,
} from "./MyBusinessDashboardView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface DownlineNode {
  id: string;
  name: string;
  memberId: string;
  level: number;
}

// Recursive helper to fetch downline hierarchy with levels
async function getDownlineHierarchy(
  parentId: string,
  currentLevel: number = 1
): Promise<DownlineNode[]> {
  try {
    const directMembers = await prisma.user.findMany({
      where: { referredById: parentId },
      select: { id: true, name: true, memberId: true },
    });

    let hierarchy: DownlineNode[] = [];
    for (const member of directMembers) {
      hierarchy.push({
        id: member.id,
        name: member.name,
        memberId: member.memberId,
        level: currentLevel,
      });

      const subDownline = await getDownlineHierarchy(
        member.id,
        currentLevel + 1
      );
      hierarchy = hierarchy.concat(subDownline);
    }
    return hierarchy;
  } catch (e) {
    console.error("Downline recursion error:", e);
    return [];
  }
}

export default async function MyBusinessPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const username = (session.user as any).username;
  const memberId = (session.user as any).memberId;

  // 1. Locate current associate
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referredBy: { select: { id: true, name: true, memberId: true } },
      },
    });
  }

  if (!user && (username || memberId)) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          username ? { username } : {},
          memberId ? { memberId } : {},
        ],
      },
      include: {
        referredBy: { select: { id: true, name: true, memberId: true } },
      },
    });
  }

  const effectiveUserId = user?.id || userId;
  const currentAssociate = {
    id: user?.id || userId || "local-associate",
    name: user?.name || session.user.name || "Associate",
    memberId: user?.memberId || memberId || "SKR00001",
    rank: user?.rank || "Client Adviser",
  };

  // 2. Fetch Downline hierarchy
  const downlineMembers = effectiveUserId
    ? await getDownlineHierarchy(effectiveUserId, 1)
    : [];

  const downlineMap = new Map<string, DownlineNode>();
  downlineMembers.forEach((m) => downlineMap.set(m.id, m));
  const downlineIds = Array.from(downlineMap.keys());

  // 3. Fetch Sales & Bookings
  // Self Sales
  const selfSales = effectiveUserId
    ? await prisma.sale.findMany({
        where: { soldById: effectiveUserId },
        include: { plot: true, soldBy: true },
        orderBy: { saleDate: "desc" },
      })
    : [];

  // Self Bookings
  const selfBookings = effectiveUserId
    ? await prisma.booking.findMany({
        where: { associateId: effectiveUserId },
        include: { plot: true, associate: true },
        orderBy: { bookingDate: "desc" },
      })
    : [];

  // Team Sales
  const teamSales = downlineIds.length > 0
    ? await prisma.sale.findMany({
        where: { soldById: { in: downlineIds } },
        include: { plot: true, soldBy: true },
        orderBy: { saleDate: "desc" },
      })
    : [];

  // Team Bookings
  const teamBookings = downlineIds.length > 0
    ? await prisma.booking.findMany({
        where: { associateId: { in: downlineIds } },
        include: { plot: true, associate: true },
        orderBy: { bookingDate: "desc" },
      })
    : [];

  // 4. Incentives / Commission
  const incentives = effectiveUserId
    ? await prisma.incentive.findMany({
        where: { associateId: effectiveUserId },
        select: { amount: true },
      })
    : [];
  const totalCommissionEarned = incentives.reduce(
    (sum, inc) => sum + (inc.amount || 0),
    0
  );

  // Consolidate plots into a unified list
  const seenPlotIds = new Set<string>();
  const soldPlots: SoldPlotItem[] = [];

  // Add Self Sales
  for (const s of selfSales) {
    if (s.plotId && seenPlotIds.has(s.plotId)) continue;
    if (s.plotId) seenPlotIds.add(s.plotId);

    soldPlots.push({
      id: s.id,
      source: "SALE",
      type: "SELF",
      plotNumber: s.plot?.plotNumber || "N/A",
      projectName: s.plot?.projectName || "Shree Karni Vatika Township",
      location: s.plot?.location || "Vatika, Tonk Road, Jaipur",
      sizeGaj: s.plot?.sizeGaj || 125,
      pricePerGaj: s.plot?.pricePerGaj || 5500,
      saleAmount: s.saleAmount || s.plot?.totalPrice || 687500,
      soldByName: currentAssociate.name,
      soldByMemberId: currentAssociate.memberId,
      isDirect: true,
      downlineLevel: 0,
      buyerName: s.buyerName || "Direct Buyer",
      buyerPhone: s.buyerPhone || "N/A",
      buyerEmail: s.buyerEmail || null,
      saleDate: s.saleDate,
      status: "SOLD",
      agreementStatus: "REGISTRY_DONE",
      paymentMode: "BANK_TRANSFER",
      commissionEarned: Math.round((s.saleAmount || 687500) * 0.05),
    });
  }

  // Add Self Bookings (not already added via Sale)
  for (const b of selfBookings) {
    if (b.plotId && seenPlotIds.has(b.plotId)) continue;
    if (b.plotId) seenPlotIds.add(b.plotId);

    soldPlots.push({
      id: b.id,
      source: "BOOKING",
      type: "SELF",
      plotNumber: b.plot?.plotNumber || b.bookingNumber,
      projectName: b.plot?.projectName || "Shree Karni Green Meadows",
      location: b.plot?.location || "Vatika, Jaipur",
      sizeGaj: b.plot?.sizeGaj || 100,
      pricePerGaj: b.plot?.pricePerGaj || 6000,
      saleAmount: b.totalPlotAmount || b.plot?.totalPrice || 600000,
      bookingAmount: b.bookingAmount,
      balanceAmount: b.balanceAmount,
      soldByName: currentAssociate.name,
      soldByMemberId: currentAssociate.memberId,
      isDirect: true,
      downlineLevel: 0,
      buyerName: b.customerName,
      buyerPhone: b.customerPhone,
      buyerEmail: b.customerEmail,
      saleDate: b.bookingDate,
      status: b.status,
      agreementStatus: b.agreementStatus,
      paymentMode: b.paymentMode,
      commissionEarned: Math.round((b.totalPlotAmount || 600000) * 0.05),
      notes: b.notes,
    });
  }

  // Add Team Sales
  for (const ts of teamSales) {
    if (ts.plotId && seenPlotIds.has(ts.plotId)) continue;
    if (ts.plotId) seenPlotIds.add(ts.plotId);

    const downlineInfo = downlineMap.get(ts.soldById);
    soldPlots.push({
      id: ts.id,
      source: "SALE",
      type: "TEAM",
      plotNumber: ts.plot?.plotNumber || "N/A",
      projectName: ts.plot?.projectName || "Shree Karni Vatika Township",
      location: ts.plot?.location || "Vatika, Tonk Road, Jaipur",
      sizeGaj: ts.plot?.sizeGaj || 125,
      pricePerGaj: ts.plot?.pricePerGaj || 5500,
      saleAmount: ts.saleAmount || ts.plot?.totalPrice || 687500,
      soldByName: ts.soldBy?.name || downlineInfo?.name || "Team Member",
      soldByMemberId: ts.soldBy?.memberId || downlineInfo?.memberId || "SKR",
      isDirect: downlineInfo?.level === 1,
      downlineLevel: downlineInfo?.level || 1,
      buyerName: ts.buyerName || "Direct Customer",
      buyerPhone: ts.buyerPhone || "N/A",
      buyerEmail: ts.buyerEmail || null,
      saleDate: ts.saleDate,
      status: "SOLD",
      agreementStatus: "REGISTRY_DONE",
      paymentMode: "BANK_TRANSFER",
      commissionEarned: Math.round((ts.saleAmount || 687500) * 0.02),
    });
  }

  // Add Team Bookings
  for (const tb of teamBookings) {
    if (tb.plotId && seenPlotIds.has(tb.plotId)) continue;
    if (tb.plotId) seenPlotIds.add(tb.plotId);

    const downlineInfo = tb.associateId ? downlineMap.get(tb.associateId) : null;
    soldPlots.push({
      id: tb.id,
      source: "BOOKING",
      type: "TEAM",
      plotNumber: tb.plot?.plotNumber || tb.bookingNumber,
      projectName: tb.plot?.projectName || "Shree Karni Vatika Township",
      location: tb.plot?.location || "Vatika, Tonk Road, Jaipur",
      sizeGaj: tb.plot?.sizeGaj || 150,
      pricePerGaj: tb.plot?.pricePerGaj || 6000,
      saleAmount: tb.totalPlotAmount || tb.plot?.totalPrice || 900000,
      bookingAmount: tb.bookingAmount,
      balanceAmount: tb.balanceAmount,
      soldByName: tb.associate?.name || downlineInfo?.name || "Team Member",
      soldByMemberId: tb.associate?.memberId || downlineInfo?.memberId || "SKR",
      isDirect: downlineInfo?.level === 1,
      downlineLevel: downlineInfo?.level || 1,
      buyerName: tb.customerName,
      buyerPhone: tb.customerPhone,
      buyerEmail: tb.customerEmail,
      saleDate: tb.bookingDate,
      status: tb.status,
      agreementStatus: tb.agreementStatus,
      paymentMode: tb.paymentMode,
      commissionEarned: Math.round((tb.totalPlotAmount || 900000) * 0.02),
      notes: tb.notes,
    });
  }



  // Calculate Metrics
  const selfPlots = soldPlots.filter((p) => p.type === "SELF");
  const teamPlots = soldPlots.filter((p) => p.type === "TEAM");

  const selfBusinessAmount = selfPlots.reduce((sum, p) => sum + p.saleAmount, 0);
  const selfGaj = selfPlots.reduce((sum, p) => sum + p.sizeGaj, 0);

  const teamBusinessAmount = teamPlots.reduce((sum, p) => sum + p.saleAmount, 0);
  const teamGaj = teamPlots.reduce((sum, p) => sum + p.sizeGaj, 0);

  const totalBusinessAmount = selfBusinessAmount + teamBusinessAmount;
  const totalGaj = selfGaj + teamGaj;

  const summary: BusinessSummary = {
    totalSalesCount: soldPlots.length,
    totalBusinessAmount,
    totalGaj,
    selfSalesCount: selfPlots.length,
    selfBusinessAmount,
    selfGaj,
    teamSalesCount: teamPlots.length,
    teamBusinessAmount,
    teamGaj,
    totalCommissionEarned:
      totalCommissionEarned > 0
        ? totalCommissionEarned
        : soldPlots.reduce((sum, p) => sum + (p.commissionEarned || 0), 0),
  };

  return (
    <div className="w-full">
      <MyBusinessDashboardView
        currentAssociate={currentAssociate}
        summary={summary}
        soldPlots={soldPlots}
      />
    </div>
  );
}

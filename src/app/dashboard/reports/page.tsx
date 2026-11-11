import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AssociateReportsView from "./AssociateReportsView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssociateReportsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const username = session?.user?.username;

  // 1. Fetch associate details
  let user = null;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        memberId: true,
        rank: true,
        customSalesGaj: true,
        customDownline: true,
      },
    });
  }

  if (!user && username) {
    user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        memberId: true,
        rank: true,
        customSalesGaj: true,
        customDownline: true,
      },
    });
  }

  const effectiveUserId = user?.id || userId;

  // 2. Fetch sales, incentives, direct team, visitors in parallel
  const [sales, incentives, teamMembers, visitors] = await Promise.all([
    effectiveUserId
      ? prisma.sale.findMany({
          where: { soldById: effectiveUserId },
          include: { plot: true },
          orderBy: { saleDate: "desc" },
        })
      : Promise.resolve([]),
    effectiveUserId
      ? prisma.incentive.findMany({
          where: { associateId: effectiveUserId },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    effectiveUserId
      ? prisma.user.findMany({
          where: { referredById: effectiveUserId },
          include: {
            sales: { include: { plot: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    effectiveUserId
      ? prisma.visitor.findMany({
          where: { associateId: effectiveUserId },
          orderBy: { visitDate: "desc" },
        })
      : Promise.resolve([]),
  ]);

  // 3. Compute aggregations
  const actualSalesGaj = sales.reduce((sum, s) => sum + (s.plot?.sizeGaj || 0), 0);
  const totalSalesGaj =
    user?.customSalesGaj !== null && user?.customSalesGaj !== undefined
      ? user.customSalesGaj
      : actualSalesGaj;

  const totalBusinessAmount = sales.reduce((sum, s) => sum + (s.saleAmount || 0), 0);

  const totalCommissionPaid = incentives
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const totalCommissionPending = incentives
    .filter((i) => i.status === "PENDING" || i.status === "APPROVED")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const totalTeamMembers =
    user?.customDownline !== null && user?.customDownline !== undefined
      ? user.customDownline
      : teamMembers.length;

  const totalTeamBusiness = teamMembers.reduce((sum, member) => {
    const memberSalesSum = member.sales.reduce((ms, s) => ms + (s.saleAmount || 0), 0);
    return sum + memberSalesSum;
  }, 0);

  // 4. Format row data for reports table & CSV exports
  const formattedSales = sales.map((s, idx) => ({
    sNo: idx + 1,
    plotNumber: s.plot?.plotNumber || "SKC-PLOT",
    projectName: s.plot?.projectName || "Shree Karni City",
    customerName: s.buyerName,
    customerPhone: s.buyerPhone || "N/A",
    sizeGaj: s.plot?.sizeGaj || 0,
    pricePerGaj: s.plot?.pricePerGaj || 0,
    saleAmount: s.saleAmount,
    saleDate: new Date(s.saleDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    status: "Confirmed",
  }));

  const formattedIncentives = incentives.map((i, idx) => ({
    sNo: idx + 1,
    date: new Date(i.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    type: i.type,
    description: i.description || "Associate Milestone Commission",
    amount: i.amount,
    status: i.status,
  }));

  const formattedTeam = teamMembers.map((t, idx) => {
    const memberPlotsSold = t.sales.length;
    const memberGaj = t.sales.reduce((sum, s) => sum + (s.plot?.sizeGaj || 0), 0);
    const memberBusiness = t.sales.reduce((sum, s) => sum + (s.saleAmount || 0), 0);

    return {
      sNo: idx + 1,
      memberId: t.memberId,
      name: t.name,
      phone: t.phone || "N/A",
      rank: t.rank || "Client Adviser",
      plotsSold: memberPlotsSold,
      totalGaj: memberGaj,
      businessAmount: memberBusiness,
      joinedDate: new Date(t.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  });

  const formattedVisitors = visitors.map((v, idx) => ({
    sNo: idx + 1,
    visitorName: v.visitorName,
    phone: v.phone,
    plotInterest: v.plotInterest || "General Inquiry",
    visitDate: new Date(v.visitDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    status: v.status,
    feedback: v.feedback || "Visited site with associate.",
  }));

  return (
    <AssociateReportsView
      associateName={user?.name || "Associate"}
      memberId={user?.memberId || "SKR00001"}
      rank={user?.rank || "Client Adviser"}
      totalSalesGaj={totalSalesGaj}
      totalBusinessAmount={totalBusinessAmount}
      totalCommissionPaid={totalCommissionPaid}
      totalCommissionPending={totalCommissionPending}
      totalTeamMembers={totalTeamMembers}
      totalTeamBusiness={totalTeamBusiness}
      salesData={formattedSales}
      incentivesData={formattedIncentives}
      teamData={formattedTeam}
      visitorsData={formattedVisitors}
    />
  );
}

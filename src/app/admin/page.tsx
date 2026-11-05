import { prisma } from "@/lib/prisma";
import AdminDashboardOverview from "@/components/admin/AdminDashboardOverview";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function AdminDashboard() {
  const associateFilter = {
    NOT: {
      OR: [
        { role: "ADMIN" },
        { username: "admin" },
        { memberId: "SKRADMIN" },
      ],
    },
  };

  // Run all independent queries in parallel for ultra-low latency
  const [
    projects,
    allPlots,
    salesAggregate,
    paymentsAggregate,
    bookingsAggregate,
    totalAssociates,
    incentivesAggregate,
    recentBookings,
    recentPayments,
    recentNotifications,
    pendingKycCount,
  ] = await Promise.all([
    // 1. Projects
    prisma.project.findMany({
      include: {
        plots: {
          select: { id: true, status: true, totalPrice: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 2. Plots
    prisma.plot.findMany({
      select: { id: true, status: true, totalPrice: true },
    }),

    // 3. Financials: Sales
    prisma.sale.aggregate({
      _sum: { saleAmount: true },
    }),

    // 4. Financials: Payments
    prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),

    // 5. Bookings
    prisma.booking.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { balanceAmount: true },
    }),

    // 6. Total Associates Count
    prisma.user.count({ where: associateFilter }),

    // 7. Incentives
    prisma.incentive.aggregate({
      where: { status: { in: ["APPROVED", "PAID"] } },
      _sum: { amount: true },
    }),

    // 8. Recent Bookings
    prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        plot: { select: { plotNumber: true, sizeGaj: true, projectName: true } },
      },
    }),

    // 9. Recent Payments
    prisma.payment.findMany({
      take: 8,
      orderBy: { receiptDate: "desc" },
      include: {
        customer: { select: { name: true, customerId: true } },
        plot: { select: { plotNumber: true } },
      },
    }),

    // 10. Recent Notifications
    prisma.notification.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
    }),

    // 11. Pending KYC Count
    prisma.user.count({
      where: {
        ...associateFilter,
        kycStatus: "PENDING",
        OR: [
          { aadhaarDocUrl: { not: null } },
          { panDocUrl: { not: null } },
          { photoDocUrl: { not: null } },
          { addressDocUrl: { not: null } },
          { bankDocUrl: { not: null } },
        ],
      },
    }),
  ]);

  const totalProjects = projects.length;
  const totalPlots = allPlots.length;
  const availablePlots = allPlots.filter((p) => p.status === "AVAILABLE").length;
  const bookedPlots = allPlots.filter((p) => p.status === "BOOKED" || p.status === "RESERVED").length;
  const soldPlots = allPlots.filter((p) => p.status === "SOLD").length;

  const totalSalesValue =
    (salesAggregate._sum.saleAmount || 0) +
    allPlots.filter((p) => p.status === "BOOKED").reduce((sum, p) => sum + p.totalPrice, 0);

  const totalCollected = paymentsAggregate._sum.amount || 0;
  const pendingPayments = bookingsAggregate._sum.balanceAmount || 0;
  const totalCommission = incentivesAggregate._sum.amount || 0;

  const enrichedProjects = projects.map((proj) => ({
    ...proj,
    plotsCount: proj.plots.length,
    availableCount: proj.plots.filter((p) => p.status === "AVAILABLE").length,
    soldCount: proj.plots.filter((p) => p.status === "SOLD").length,
  }));

  const stats = {
    totalProjects,
    totalPlots,
    availablePlots,
    bookedPlots,
    soldPlots,
    totalSalesValue,
    totalCollected,
    pendingPayments,
    totalAssociates,
    totalCommission,
  };

  return (
    <AdminDashboardOverview
      stats={stats}
      recentBookings={recentBookings}
      recentPayments={recentPayments}
      projects={enrichedProjects}
      recentNotifications={recentNotifications as any}
      pendingKycCount={pendingKycCount}
    />
  );
}

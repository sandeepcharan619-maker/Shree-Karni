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

  // 1. Projects
  const projects = await prisma.project.findMany({
    include: {
      plots: {
        select: { id: true, status: true, totalPrice: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalProjects = projects.length;

  // 2. Plots
  const allPlots = await prisma.plot.findMany({
    select: { id: true, status: true, totalPrice: true },
  });

  const totalPlots = allPlots.length;
  const availablePlots = allPlots.filter((p) => p.status === "AVAILABLE").length;
  const bookedPlots = allPlots.filter((p) => p.status === "BOOKED" || p.status === "RESERVED").length;
  const soldPlots = allPlots.filter((p) => p.status === "SOLD").length;

  // 3. Financials & Sales
  const salesAggregate = await prisma.sale.aggregate({
    _sum: { saleAmount: true },
  });
  const totalSalesValue = (salesAggregate._sum.saleAmount || 0) +
    allPlots.filter((p) => p.status === "BOOKED").reduce((sum, p) => sum + p.totalPrice, 0);

  const paymentsAggregate = await prisma.payment.aggregate({
    where: { status: "SUCCESS" },
    _sum: { amount: true },
  });
  const totalCollected = paymentsAggregate._sum.amount || 0;

  const bookingsAggregate = await prisma.booking.aggregate({
    where: { status: "CONFIRMED" },
    _sum: { balanceAmount: true },
  });
  const pendingPayments = bookingsAggregate._sum.balanceAmount || 0;

  // 4. Associates & Commissions
  const totalAssociates = await prisma.user.count({ where: associateFilter });

  const incentivesAggregate = await prisma.incentive.aggregate({
    where: { status: { in: ["APPROVED", "PAID"] } },
    _sum: { amount: true },
  });
  const totalCommission = incentivesAggregate._sum.amount || 0;

  // 5. Recent Activity
  const recentBookings = await prisma.booking.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      plot: { select: { plotNumber: true, sizeGaj: true, projectName: true } },
    },
  });

  const recentPayments = await prisma.payment.findMany({
    take: 8,
    orderBy: { receiptDate: "desc" },
    include: {
      customer: { select: { name: true, customerId: true } },
      plot: { select: { plotNumber: true } },
    },
  });

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
    />
  );
}

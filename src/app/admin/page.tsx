import { prisma } from "@/lib/prisma";
import DashboardCard from "@/components/DashboardCard";
import Link from "next/link";
import AssociatesManager from "@/components/AssociatesManager";
import PlotsManager from "@/components/PlotsManager";
import AddPlotModal from "./plots/AddPlotModal";
import AddAssociateModal from "./associates/AddAssociateModal";
import RecentSalesActivity from "./RecentSalesActivity";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDashboard() {
  const totalAssociates = await prisma.user.count({ where: { role: "ASSOCIATE" } });
  const totalPlots = await prisma.plot.count();
  const availablePlots = await prisma.plot.count({ where: { status: "AVAILABLE" } });
  const soldPlots = await prisma.plot.count({ where: { status: "SOLD" } });

  const totalSalesSum = await prisma.sale.aggregate({
    _sum: { saleAmount: true },
  });

  const totalSalesGaj = await prisma.sale.findMany({
    include: { plot: true },
  });
  const totalGajSold = totalSalesGaj.reduce((acc, s) => acc + (s.plot?.sizeGaj || 0), 0);

  const pendingIncentivesSum = await prisma.incentive.aggregate({
    where: { status: "PENDING" },
    _sum: { amount: true },
  });

  // Fetch all associates for the manager
  const associates = await prisma.user.findMany({
    where: { role: "ASSOCIATE" },
    include: {
      referredBy: { select: { id: true, name: true, memberId: true } },
      _count: { select: { referrals: true, sales: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const sponsorOptions = associates.map((a) => ({
    id: a.id,
    name: a.name,
    memberId: a.memberId,
  }));

  // Fetch all plots for the manager
  const plots = await prisma.plot.findMany({
    include: {
      sale: {
        include: {
          soldBy: { select: { id: true, name: true, memberId: true } },
        },
      },
    },
    orderBy: { plotNumber: "asc" },
  });

  // Recent Sales
  const recentSales = await prisma.sale.findMany({
    take: 5,
    orderBy: { saleDate: "desc" },
    include: {
      plot: true,
      soldBy: { select: { name: true, memberId: true } },
    },
  });

  return (
    <div className="space-y-8">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-xs border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your network associates, plot inventory, and track sales commissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddPlotModal />
          <AddAssociateModal sponsors={sponsorOptions} />
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <DashboardCard
          label="Total Associates"
          value={totalAssociates}
          subtitle="Registered Network"
          color="magenta"
        />
        <DashboardCard
          label="Total Sales Volume"
          value={`₹${(totalSalesSum._sum.saleAmount || 0).toLocaleString("en-IN")}`}
          subtitle="All-time Revenue"
          color="blue"
        />
        <DashboardCard
          label="Total Business (GAJ)"
          value={`${totalGajSold} GAJ`}
          subtitle="Land Sold"
          color="orange"
        />
        <DashboardCard
          label="Plots Available / Total"
          value={`${availablePlots} / ${totalPlots}`}
          subtitle={`${soldPlots} Sold`}
          color="green"
        />
        <DashboardCard
          label="Pending Incentives"
          value={`₹${(pendingIncentivesSum._sum.amount || 0).toLocaleString("en-IN")}`}
          subtitle="Awaiting Approval"
          color="red"
        />
        <DashboardCard
          label="Company Rank"
          value="Headquarters"
          subtitle="Admin Controls Active"
          color="purple"
        />
      </div>

      {/* Associates Network Section with Real-Time Local & Server Sync */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
        <AssociatesManager
          initialAssociates={associates}
          title="All Associates Network"
          subtitle="Real-time associate registry with instant updates, search, and status controls"
        />
      </div>

      {/* Plots Inventory Section with Real-Time Local & Server Sync */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
        <PlotsManager
          initialPlots={plots as any}
          initialAssociates={sponsorOptions}
          title="Plots Inventory Management"
          subtitle="Manage plot inventory, prices, status, and sales assignments"
        />
      </div>

      {/* Recent Sales Activity */}
      <RecentSalesActivity initialSales={recentSales as any} />
    </div>
  );
}

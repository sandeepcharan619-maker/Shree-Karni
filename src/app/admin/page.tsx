import { prisma } from "@/lib/prisma";
import DashboardCard from "@/components/DashboardCard";
import Link from "next/link";
import AssociatesManager from "@/components/AssociatesManager";
import PlotsManager from "@/components/PlotsManager";
import AddPlotModal from "./plots/AddPlotModal";
import AddAssociateModal from "./associates/AddAssociateModal";

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
          soldBy: { select: { name: true, memberId: true } },
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
          initialPlots={plots}
          title="Plots Inventory Management"
          subtitle="Manage plot inventory, prices, status, and sales assignments"
        />
      </div>

      {/* Recent Sales Activity */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Sales Activity</h2>
            <p className="text-xs text-gray-500">Latest completed buyer bookings and associate commissions</p>
          </div>
          <Link href="/admin/sales" className="text-sm font-semibold text-blue-600 hover:underline">
            View All Sales →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
                <th className="px-4 py-3 text-left">Plot No</th>
                <th className="px-4 py-3 text-left">Buyer</th>
                <th className="px-4 py-3 text-left">Sold By</th>
                <th className="px-4 py-3 text-left">Size (GAJ)</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500 text-sm">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">{sale.plot.plotNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{sale.buyerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {sale.soldBy.name} ({sale.soldBy.memberId})
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{sale.plot.sizeGaj} GAJ</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">₹{sale.saleAmount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(sale.saleDate).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import DashboardCard from "@/components/DashboardCard";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import AddPlotModal from "./plots/AddPlotModal";
import AddAssociateModal from "./associates/AddAssociateModal";
import AssociateRowActions from "./associates/AssociateRowActions";
import PlotRowActions from "./plots/PlotRowActions";

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

  // Recent Associates
  const associates = await prisma.user.findMany({
    where: { role: "ASSOCIATE" },
    include: {
      referredBy: { select: { name: true, memberId: true } },
      _count: { select: { referrals: true, sales: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const sponsorOptions = associates.map((a) => ({
    id: a.id,
    name: a.name,
    memberId: a.memberId,
  }));

  // Recent Plots
  const plots = await prisma.plot.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
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
      {/* Page Header with Action Modals */}
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

      {/* Associates Network Section */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Associates Network ({totalAssociates})</h2>
            <p className="text-xs text-gray-500">
              Active members, ranks, downlines, and direct actions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AddAssociateModal sponsors={sponsorOptions} />
            <Link
              href="/admin/associates"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              View All Associates →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
                <th className="px-4 py-3 text-left">Member ID</th>
                <th className="px-4 py-3 text-left">Associate Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Referred By</th>
                <th className="px-4 py-3 text-left">Downline</th>
                <th className="px-4 py-3 text-left">Sales</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {associates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 text-sm">
                    No associates registered yet. Click &ldquo;+ Add New Associate&rdquo; above to register one.
                  </td>
                </tr>
              ) : (
                associates.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">{assoc.memberId}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-800">{assoc.name}</div>
                      <div className="text-xs text-gray-400">@{assoc.username}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{assoc.phone || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{assoc.rank}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {assoc.referredBy ? `${assoc.referredBy.name} (${assoc.referredBy.memberId})` : "Direct"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{assoc._count.referrals}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{assoc._count.sales}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={assoc.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <AssociateRowActions
                        id={assoc.id}
                        name={assoc.name}
                        memberId={assoc.memberId}
                        isActive={assoc.isActive}
                        currentRank={assoc.rank}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plots Inventory Section */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Plots Inventory ({totalPlots})</h2>
            <p className="text-xs text-gray-500">
              Live plot availability, sizes in GAJ, pricing, and status management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AddPlotModal />
            <Link
              href="/admin/plots"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
            >
              Manage All Plots →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
                <th className="px-4 py-3 text-left">Plot No</th>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Size (GAJ)</th>
                <th className="px-4 py-3 text-left">Price/GAJ</th>
                <th className="px-4 py-3 text-left">Total Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">
                    No plots registered yet. Click &ldquo;+ Add Plot&rdquo; above to add inventory.
                  </td>
                </tr>
              ) : (
                plots.map((plot) => (
                  <tr key={plot.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">{plot.plotNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{plot.projectName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{plot.location}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{plot.sizeGaj} GAJ</td>
                    <td className="px-4 py-3 text-sm text-gray-700">₹{plot.pricePerGaj.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">₹{plot.totalPrice.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={plot.status} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <PlotRowActions
                        id={plot.id}
                        plotNumber={plot.plotNumber}
                        currentStatus={plot.status}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Sales Table */}
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

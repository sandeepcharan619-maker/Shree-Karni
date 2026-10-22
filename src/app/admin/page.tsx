import { prisma } from "@/lib/prisma";
import DashboardCard from "@/components/DashboardCard";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

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

  const recentSales = await prisma.sale.findMany({
    take: 5,
    orderBy: { saleDate: "desc" },
    include: {
      plot: true,
      soldBy: { select: { name: true, memberId: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/plots"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            + Add Plot
          </Link>
          <Link
            href="/admin/associates/create"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            + Add Associate
          </Link>
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
          value={`₹${(totalSalesSum._sum.saleAmount || 0).toLocaleString()}`}
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
          value={`₹${(pendingIncentivesSum._sum.amount || 0).toLocaleString()}`}
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

      {/* Recent Sales Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Recent Sales Activity</h2>
          <Link href="/admin/sales" className="text-sm text-blue-600 hover:underline">
            View All Sales →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plot No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Buyer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sold By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size (GAJ)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">{sale.plot.plotNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{sale.buyerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {sale.soldBy.name} ({sale.soldBy.memberId})
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{sale.plot.sizeGaj}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">₹{sale.saleAmount.toLocaleString()}</td>
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

import { prisma } from "@/lib/prisma";

export default async function AdminSalesPage() {
  const sales = await prisma.sale.findMany({
    include: {
      plot: true,
      soldBy: {
        select: { name: true, memberId: true, phone: true },
      },
    },
    orderBy: { saleDate: "desc" },
  });

  const totalSalesVolume = sales.reduce((sum, s) => sum + s.saleAmount, 0);
  const totalGajSold = sales.reduce((sum, s) => sum + (s.plot?.sizeGaj || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales Overview</h1>
          <p className="text-sm text-gray-500">Complete record of all properties sold by the associate network</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Plots Sold</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{sales.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Revenue (₹)</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">₹{totalSalesVolume.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Area Sold</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalGajSold} GAJ</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plot Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project / Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size (GAJ)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Buyer Info</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sold By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sale Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sale Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                sales.map((sale, idx) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">{sale.plot.plotNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{sale.plot.projectName}</div>
                      <div className="text-xs text-gray-400">{sale.plot.location}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{sale.plot.sizeGaj} GAJ</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-800">{sale.buyerName}</div>
                      <div className="text-xs text-gray-400">{sale.buyerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-800">{sale.soldBy.name}</div>
                      <div className="text-xs text-blue-600">{sale.soldBy.memberId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      ₹{sale.saleAmount.toLocaleString()}
                    </td>
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

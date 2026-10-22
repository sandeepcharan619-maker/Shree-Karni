import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export default async function PlotManagerPage() {
  const plots = await prisma.plot.findMany({
    include: {
      sale: {
        include: { soldBy: { select: { name: true, memberId: true } } },
      },
    },
    orderBy: { plotNumber: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Plot Manager</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{plots.filter(p => p.status === "AVAILABLE").length}</p>
          <p className="text-sm text-green-600">Available</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{plots.filter(p => p.status === "RESERVED").length}</p>
          <p className="text-sm text-yellow-600">Reserved</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{plots.filter(p => p.status === "SOLD").length}</p>
          <p className="text-sm text-red-600">Sold</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plot No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size (GAJ)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price/GAJ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plots.map((plot) => (
                <tr key={plot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-blue-600">{plot.plotNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{plot.projectName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{plot.location}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{plot.sizeGaj}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">₹{plot.pricePerGaj.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">₹{plot.totalPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={plot.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

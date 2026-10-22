import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import AddPlotForm from "./AddPlotForm";

export default async function AdminPlotsPage() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Plot Management</h1>
          <p className="text-sm text-gray-500">Add, track and assign plots across projects</p>
        </div>
      </div>

      <AddPlotForm />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plot Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Size (GAJ)</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price/GAJ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sold To / Associate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plots.map((plot) => (
                <tr key={plot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600">{plot.plotNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{plot.projectName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{plot.location}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{plot.sizeGaj} GAJ</td>
                  <td className="px-4 py-3 text-sm text-gray-700">₹{plot.pricePerGaj.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">₹{plot.totalPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={plot.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {plot.sale ? (
                      <div>
                        <div className="font-medium text-gray-800">{plot.sale.buyerName}</div>
                        <div className="text-xs text-gray-400">by {plot.sale.soldBy.name}</div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

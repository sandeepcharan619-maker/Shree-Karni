import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import AddPlotModal from "./AddPlotModal";
import PlotRowActions from "./PlotRowActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const availableCount = plots.filter((p) => p.status === "AVAILABLE").length;
  const reservedCount = plots.filter((p) => p.status === "RESERVED").length;
  const soldCount = plots.filter((p) => p.status === "SOLD").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Plot Management</h1>
          <p className="text-sm text-gray-500">
            Add new inventory, update availability status, and manage plot prices
          </p>
        </div>
        <div>
          <AddPlotModal />
        </div>
      </div>

      {/* Quick Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
          <p className="text-xs text-gray-500 font-medium">Total Plots</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{plots.length}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-xs">
          <p className="text-xs text-emerald-700 font-medium">Available</p>
          <p className="text-2xl font-bold text-emerald-800 mt-1">{availableCount}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-xs">
          <p className="text-xs text-amber-700 font-medium">Reserved</p>
          <p className="text-2xl font-bold text-amber-800 mt-1">{reservedCount}</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 shadow-xs">
          <p className="text-xs text-rose-700 font-medium">Sold</p>
          <p className="text-2xl font-bold text-rose-800 mt-1">{soldCount}</p>
        </div>
      </div>

      {/* Plots Table */}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plots.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No plots added yet. Click &ldquo;+ Add Plot&rdquo; above to add your first plot.
                  </td>
                </tr>
              ) : (
                plots.map((plot) => (
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
    </div>
  );
}

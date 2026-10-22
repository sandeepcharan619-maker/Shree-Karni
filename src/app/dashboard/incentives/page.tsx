import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export default async function IncentivesPage() {
  const session = await getServerSession(authOptions);
  const incentives = await prisma.incentive.findMany({
    where: { associateId: session?.user?.id },
    orderBy: { createdAt: "desc" },
  });

  const totalPaid = incentives.filter(i => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const totalPending = incentives.filter(i => i.status === "PENDING").reduce((s, i) => s + i.amount, 0);
  const totalApproved = incentives.filter(i => i.status === "APPROVED").reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Incentives</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</p>
          <p className="text-sm text-green-600">Total Paid</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">₹{totalApproved.toLocaleString()}</p>
          <p className="text-sm text-blue-600">Approved</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">₹{totalPending.toLocaleString()}</p>
          <p className="text-sm text-yellow-600">Pending</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {incentives.map((inc, idx) => (
                <tr key={inc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={inc.type} /></td>
                  <td className="px-4 py-3 text-sm text-gray-700">{inc.description || "-"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">₹{inc.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm"><StatusBadge status={inc.status} /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(inc.createdAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

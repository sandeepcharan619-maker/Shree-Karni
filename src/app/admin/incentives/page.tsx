import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import IncentiveRowActions from "./IncentiveRowActions";

export default async function AdminIncentivesPage() {
  const incentives = await prisma.incentive.findMany({
    include: {
      associate: {
        select: { name: true, memberId: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingTotal = incentives
    .filter((i) => i.status === "PENDING")
    .reduce((s, i) => s + i.amount, 0);

  const approvedTotal = incentives
    .filter((i) => i.status === "APPROVED")
    .reduce((s, i) => s + i.amount, 0);

  const paidTotal = incentives
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Incentive Management</h1>
          <p className="text-sm text-gray-500">Approve and disburse commissions and bonuses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">₹{pendingTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Approved (Awaiting Payout)</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">₹{approvedTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Disbursed / Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">₹{paidTotal.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Associate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {incentives.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-semibold text-gray-800">{item.associate.name}</div>
                    <div className="text-xs text-blue-600">{item.associate.memberId}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={item.type} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{item.description || "-"}</td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-800">₹{item.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <IncentiveRowActions id={item.id} currentStatus={item.status} />
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

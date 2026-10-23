import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import AssociateRowActions from "./AssociateRowActions";
import AddAssociateModal from "./AddAssociateModal";

export default async function AdminAssociatesPage() {
  const associates = await prisma.user.findMany({
    where: { role: "ASSOCIATE" },
    include: {
      referredBy: { select: { name: true, memberId: true } },
      _count: { select: { referrals: true, sales: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const sponsorOptions = associates.map((a) => ({
    id: a.id,
    name: a.name,
    memberId: a.memberId,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Associates</h1>
          <p className="text-sm text-gray-500">
            Manage sales team associates, downlines, rank promotions, and deletions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AddAssociateModal sponsors={sponsorOptions} />
          <Link
            href="/admin/associates/create"
            className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
          >
            Full Page Form →
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Member ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Associate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Referred By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Downline</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sales</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Wallet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {associates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No associates registered yet. Click &ldquo;+ Add New Associate&rdquo; above to create one.
                  </td>
                </tr>
              ) : (
                associates.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-gray-50">
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
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">₹{assoc.walletBalance.toLocaleString()}</td>
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
    </div>
  );
}

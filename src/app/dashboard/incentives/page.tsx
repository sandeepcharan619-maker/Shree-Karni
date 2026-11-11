import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IncentivesPage() {
  const session = await getServerSession(authOptions);
  const [incentives, slabs] = await Promise.all([
    prisma.incentive.findMany({
      where: { associateId: session?.user?.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commissionSlab.findMany({
      orderBy: { minSqYard: "asc" },
    }),
  ]);

  const totalPaid = incentives.filter(i => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const totalPending = incentives.filter(i => i.status === "PENDING").reduce((s, i) => s + i.amount, 0);
  const totalApproved = incentives.filter(i => i.status === "APPROVED").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">My Incentives & Commissions</h1>
        <Link
          href="/dashboard/commission-rules"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Award size={14} />
          <span>View Commission Rules</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-700">₹{totalPaid.toLocaleString()}</p>
          <p className="text-sm text-green-600 font-medium">Total Paid</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">₹{totalApproved.toLocaleString()}</p>
          <p className="text-sm text-blue-600 font-medium">Approved</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">₹{totalPending.toLocaleString()}</p>
          <p className="text-sm text-yellow-600 font-medium">Pending</p>
        </div>
      </div>

      {/* Commission Slabs Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-[#0d1b2a] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold">Associate Commission Rules (Per Sq. Yard / Gaj)</h3>
          </div>
          <Link
            href="/dashboard/commission-rules"
            className="text-xs text-amber-300 hover:text-white font-semibold transition"
          >
            Rules & Policies →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-700 uppercase">
              <tr>
                <th className="py-2.5 px-4">Sales Range (In Square Yard)</th>
                <th className="py-2.5 px-4 text-center">Associate Commission Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slabs.map((s) => (
                <tr key={s.id} className="hover:bg-amber-50/40">
                  <td className="py-2.5 px-4 font-bold text-gray-900 font-mono">
                    {s.rangeLabel} Sq. Yard
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                      ₹ {s.associateRate?.toLocaleString("en-IN")} / Gaj
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incentives History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 font-bold text-gray-900 text-sm">
          Incentive Payout History
        </div>
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
              {incentives.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-gray-400">
                    No incentive records logged yet.
                  </td>
                </tr>
              ) : (
                incentives.map((inc, idx) => (
                  <tr key={inc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm"><StatusBadge status={inc.type} /></td>
                    <td className="px-4 py-3 text-sm text-gray-700">{inc.description || "-"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">₹{inc.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm"><StatusBadge status={inc.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(inc.createdAt).toLocaleDateString("en-IN")}</td>
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

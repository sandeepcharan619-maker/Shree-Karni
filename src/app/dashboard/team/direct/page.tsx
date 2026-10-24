import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { Trees, UserPlus } from "lucide-react";

export default async function DirectTeamPage() {
  const session = await getServerSession(authOptions);
  const directTeam = await prisma.user.findMany({
    where: { referredById: session?.user?.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Direct Team</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/team/tree"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition"
          >
            <Trees size={14} className="text-green-700" />
            <span>Tree View</span>
          </Link>
          <Link
            href="/dashboard/register"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0a1628] hover:bg-[#12243e] text-white rounded-md text-xs font-semibold shadow-xs transition"
          >
            <UserPlus size={14} className="text-[#e9b04c]" />
            <span>+ Register Associate</span>
          </Link>
        </div>
      </div>
      {directTeam.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No direct team members yet. Register new associates to build your team!
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Member ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {directTeam.map((member, idx) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{member.memberId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.phone || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.rank}</td>
                    <td className="px-4 py-3 text-sm"><StatusBadge status={member.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(member.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

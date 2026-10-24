import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { Trees, UserPlus } from "lucide-react";

async function getAllDownline(userId: string): Promise<any[]> {
  const direct = await prisma.user.findMany({
    where: { referredById: userId },
  });
  
  let allMembers = [...direct];
  for (const member of direct) {
    const subDownline = await getAllDownline(member.id);
    allMembers = [...allMembers, ...subDownline];
  }
  return allMembers;
}

export default async function TotalDownlinePage() {
  const session = await getServerSession(authOptions);
  const downline = await getAllDownline(session?.user?.id || "");

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Total Downline</h1>
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
      <p className="text-sm text-gray-500 mb-6">Total members: {downline.length}</p>
      {downline.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No downline members yet.
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {downline.map((member, idx) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">{member.memberId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.phone || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{member.rank}</td>
                    <td className="px-4 py-3 text-sm"><StatusBadge status={member.isActive ? "ACTIVE" : "INACTIVE"} /></td>
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

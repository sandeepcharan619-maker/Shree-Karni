import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

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
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Total Downline</h1>
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

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import AddLeadForm from "./AddLeadForm";

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  const leads = await prisma.lead.findMany({
    where: { associateId: session?.user?.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Lead Manager</h1>
      </div>

      <AddLeadForm />

      <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plot Interest</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No leads yet. Start adding leads!
                  </td>
                </tr>
              ) : (
                leads.map((lead, idx) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{lead.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{lead.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{lead.source || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{lead.plotInterest || "-"}</td>
                    <td className="px-4 py-3 text-sm"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{lead.notes || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(lead.createdAt).toLocaleDateString("en-IN")}</td>
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

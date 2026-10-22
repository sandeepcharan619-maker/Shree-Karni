import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import AddVisitorForm from "./AddVisitorForm";

export default async function VisitorsPage() {
  const session = await getServerSession(authOptions);
  const visitors = await prisma.visitor.findMany({
    where: { associateId: session?.user?.id },
    orderBy: { visitDate: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Visitor Management</h1>
      </div>

      <AddVisitorForm />

      <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">S.No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Visitor Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Plot Interest</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Visit Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Feedback</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No visitors logged yet.
                  </td>
                </tr>
              ) : (
                visitors.map((visitor, idx) => (
                  <tr key={visitor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{visitor.visitorName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{visitor.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{visitor.plotInterest || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(visitor.visitDate).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{visitor.feedback || "-"}</td>
                    <td className="px-4 py-3 text-sm"><StatusBadge status={visitor.status} /></td>
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

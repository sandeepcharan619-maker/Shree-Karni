"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle, CheckCircle2 } from "lucide-react";

export interface SaleItem {
  id: string;
  plotId: string;
  buyerName: string;
  saleAmount: number;
  saleDate: string | Date;
  plot: {
    plotNumber: string;
    sizeGaj: number;
    projectName?: string;
  };
  soldBy: {
    name: string;
    memberId: string;
  };
}

export default function RecentSalesActivity({
  initialSales = [],
}: {
  initialSales: SaleItem[];
}) {
  const router = useRouter();
  const [sales, setSales] = useState<SaleItem[]>(initialSales);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showMsg = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleDeleteSale = async (id: string, plotNo: string) => {
    const confirmed = window.confirm(`Delete sale entry for Plot ${plotNo}? The plot will be restored to Available.`);
    if (!confirmed) return;

    setLoading(true);
    setSales((prev) => prev.filter((s) => s.id !== id));

    try {
      const res = await fetch("/api/admin/sales", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete sale");
      showMsg("Sale entry deleted successfully.", "success");
      router.refresh();
    } catch (err: any) {
      showMsg(err.message || "Failed to delete sale", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete ALL sales entries?\n\nAll plots will be restored to Available status."
    );
    if (!confirmed) return;

    setLoading(true);
    setSales([]);

    try {
      const res = await fetch("/api/admin/sales", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear sales");
      showMsg("All sales entries have been deleted.", "success");
      router.refresh();
    } catch (err: any) {
      showMsg(err.message || "Failed to clear sales", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Recent Sales Activity</h2>
          <p className="text-xs text-gray-500">
            Latest completed buyer bookings and associate commissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {sales.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>Delete All Entries</span>
            </button>
          )}
          <Link
            href="/admin/sales"
            className="text-sm font-semibold text-blue-600 hover:underline"
          >
            View All Sales →
          </Link>
        </div>
      </div>

      {message && (
        <div
          className={`px-4 py-2.5 rounded-lg mb-4 text-xs font-medium flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
              <th className="px-4 py-3 text-left">Plot No</th>
              <th className="px-4 py-3 text-left">Buyer</th>
              <th className="px-4 py-3 text-left">Sold By</th>
              <th className="px-4 py-3 text-left">Size (GAJ)</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                  <p className="font-medium text-gray-700">No sales recorded yet.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    All sales entries are cleared. New sales will appear here when recorded.
                  </p>
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                    {sale.plot?.plotNumber || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {sale.buyerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {sale.soldBy ? `${sale.soldBy.name} (${sale.soldBy.memberId})` : "Direct / Admin"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {sale.plot?.sizeGaj || 0} GAJ
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                    ₹{(sale.saleAmount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString("en-IN") : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteSale(sale.id, sale.plot?.plotNumber || "")}
                      disabled={loading}
                      title="Delete this sale entry"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function PlotRowActions({
  id,
  plotNumber,
  currentStatus,
  onDeleted,
  onUpdated,
}: {
  id: string;
  plotNumber: string;
  currentStatus: string;
  onDeleted?: () => void;
  onUpdated?: (newStatus: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      if (onUpdated) {
        onUpdated(newStatus);
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to update plot status");
    } finally {
      setLoading(false);
    }
  };

  const deletePlot = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete Plot "${plotNumber}"?\n\nThis will remove the plot and any associated sales records.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/plots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete plot");

      if (onDeleted) {
        onDeleted();
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete plot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentStatus}
        onChange={(e) => updateStatus(e.target.value)}
        disabled={loading}
        title="Change Plot Status"
        className="text-xs border border-gray-300 rounded px-2 py-1 outline-none bg-white hover:border-gray-400 focus:ring-1 focus:ring-blue-500"
      >
        <option value="AVAILABLE">Available</option>
        <option value="RESERVED">Reserved</option>
        <option value="SOLD">Sold</option>
      </select>

      <button
        onClick={deletePlot}
        disabled={loading}
        title="Delete Plot"
        className="flex items-center gap-1 px-2 py-1 text-xs rounded font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition disabled:opacity-50"
      >
        <Trash2 size={13} />
        <span>Delete</span>
      </button>
    </div>
  );
}

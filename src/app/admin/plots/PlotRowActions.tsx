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
    if (onUpdated) {
      onUpdated(newStatus);
    }

    try {
      // Update in localStorage
      try {
        const stored = localStorage.getItem("shreekarni_custom_plots_v1");
        if (stored) {
          const list = JSON.parse(stored);
          const updated = list.map((p: any) =>
            p.id === id || p.plotNumber === plotNumber ? { ...p, status: newStatus } : p
          );
          localStorage.setItem("shreekarni_custom_plots_v1", JSON.stringify(updated));
        }
      } catch (e) {}

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("skr-plot-updated", { detail: { id, plotNumber, status: newStatus } })
        );
      }

      const res = await fetch("/api/admin/plots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      router.refresh();
    } catch (err: any) {
      console.warn("Status update warning:", err);
    } finally {
      setLoading(false);
    }
  };

  const deletePlot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    let confirmed = true;
    try {
      confirmed = window.confirm(
        `Are you sure you want to permanently delete Plot "${plotNumber}"?\n\nThis will remove the plot from inventory.`
      );
    } catch {
      confirmed = true;
    }
    if (!confirmed) return;

    setLoading(true);

    // 1. Remove from localStorage immediately
    try {
      const stored = localStorage.getItem("shreekarni_custom_plots_v1");
      if (stored) {
        const list = JSON.parse(stored);
        const updated = list.filter(
          (p: any) => p.id !== id && p.plotNumber !== plotNumber
        );
        localStorage.setItem("shreekarni_custom_plots_v1", JSON.stringify(updated));
      }
    } catch (e) {}

    // 2. Dispatch global event so every component removes it
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("skr-plot-deleted", { detail: { id, plotNumber } })
      );
    }

    // 3. Call onDeleted immediately to remove row from UI
    if (onDeleted) {
      onDeleted();
    }

    try {
      await fetch("/api/admin/plots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, plotNumber }),
      });
      router.refresh();
    } catch (err: any) {
      console.warn("Delete plot server sync warning:", err);
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
        className="text-xs border border-gray-300 rounded px-2 py-1 outline-none bg-white hover:border-gray-400 focus:ring-1 focus:ring-blue-500 cursor-pointer"
      >
        <option value="AVAILABLE">Available</option>
        <option value="RESERVED">Reserved</option>
        <option value="SOLD">Sold</option>
      </select>

      <button
        type="button"
        onClick={deletePlot}
        disabled={loading}
        title="Delete Plot"
        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 transition cursor-pointer active:scale-95 disabled:opacity-50"
      >
        <Trash2 size={13} />
        <span>Delete</span>
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function AssociateRowActions({
  id,
  name,
  memberId,
  isActive,
  currentRank,
  onDeleted,
  onUpdated,
}: {
  id: string;
  name: string;
  memberId: string;
  isActive: boolean;
  currentRank: string;
  onDeleted?: () => void;
  onUpdated?: (updates: { isActive?: boolean; rank?: string }) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    setLoading(true);
    const newStatus = !isActive;
    try {
      const res = await fetch("/api/admin/associates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      
      if (onUpdated) {
        onUpdated({ isActive: newStatus });
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const updateRank = async (newRank: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/associates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, rank: newRank }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update rank");

      if (onUpdated) {
        onUpdated({ rank: newRank });
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to update rank");
    } finally {
      setLoading(false);
    }
  };

  const deleteAssociate = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to remove associate "${name}" (${memberId})?\n\nThis will permanently delete their account and unlink any downlines.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/associates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove associate");

      if (onDeleted) {
        onDeleted();
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Failed to delete associate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Rank selector */}
      <select
        value={currentRank}
        onChange={(e) => updateRank(e.target.value)}
        disabled={loading}
        title="Change Associate Rank"
        className="text-xs border border-gray-300 rounded px-2 py-1 outline-none bg-white hover:border-gray-400 focus:ring-1 focus:ring-blue-500"
      >
        <option value="Client Adviser">Client Adviser</option>
        <option value="Senior Adviser">Senior Adviser</option>
        <option value="Team Leader">Team Leader</option>
        <option value="Branch Manager">Branch Manager</option>
        <option value="Director">Director</option>
      </select>

      {/* Activate / Deactivate Toggle */}
      <button
        onClick={toggleStatus}
        disabled={loading}
        title={isActive ? "Deactivate Account" : "Activate Account"}
        className={`px-2 py-1 text-xs rounded font-medium transition ${
          isActive
            ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
        } disabled:opacity-50`}
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>

      {/* Delete / Remove Button */}
      <button
        onClick={deleteAssociate}
        disabled={loading}
        title="Permanently Remove Associate"
        className="flex items-center gap-1 px-2 py-1 text-xs rounded font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition disabled:opacity-50"
      >
        <Trash2 size={13} />
        <span>Delete</span>
      </button>
    </div>
  );
}

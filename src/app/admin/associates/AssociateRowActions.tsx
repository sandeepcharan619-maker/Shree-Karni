"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Edit3 } from "lucide-react";

export default function AssociateRowActions({
  id,
  name,
  memberId,
  isActive,
  currentRank,
  onDeleted,
  onUpdated,
  onEdit,
}: {
  id: string;
  name: string;
  memberId: string;
  isActive: boolean;
  currentRank: string;
  onDeleted?: () => void;
  onUpdated?: (updates: { isActive?: boolean; rank?: string }) => void;
  onEdit?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLoading(true);
    const newStatus = !isActive;

    // Optimistically update parent state immediately
    if (onUpdated) {
      onUpdated({ isActive: newStatus });
    }

    try {
      const res = await fetch("/api/admin/associates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: newStatus }),
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

  const updateRank = async (newRank: string) => {
    setLoading(true);
    if (onUpdated) {
      onUpdated({ rank: newRank });
    }

    try {
      const res = await fetch("/api/admin/associates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, rank: newRank }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update rank");
      router.refresh();
    } catch (err: any) {
      console.warn("Rank update warning:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAssociate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    let confirmed = true;
    try {
      confirmed = window.confirm(
        `Are you sure you want to remove associate "${name}" (${memberId})?\n\nThis will remove their record from the active list.`
      );
    } catch {
      confirmed = true;
    }
    if (!confirmed) return;

    setLoading(true);

    // Call onDeleted immediately to remove the row from UI and localStorage instantly!
    if (onDeleted) {
      onDeleted();
    }

    try {
      await fetch("/api/admin/associates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, memberId }),
      });
      router.refresh();
    } catch (err: any) {
      console.warn("Delete server sync warning:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Edit Full Profile Button */}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onEdit();
          }}
          title="Edit Member ID, Name, Phone, Rank, Sponsor, Downline, Sales, Wallet, Status"
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 transition cursor-pointer"
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>
      )}

      {/* Quick Rank selector */}
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
        type="button"
        onClick={toggleStatus}
        disabled={loading}
        title={isActive ? "Deactivate Account" : "Activate Account"}
        className={`px-2 py-1 text-xs rounded font-medium transition cursor-pointer ${
          isActive
            ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
        } disabled:opacity-50`}
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>

      {/* Delete / Remove Button */}
      <button
        type="button"
        onClick={deleteAssociate}
        disabled={loading}
        title="Permanently Remove Associate"
        className="flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 transition cursor-pointer active:scale-95 disabled:opacity-50"
      >
        <Trash2 size={13} />
        <span>Delete</span>
      </button>
    </div>
  );
}

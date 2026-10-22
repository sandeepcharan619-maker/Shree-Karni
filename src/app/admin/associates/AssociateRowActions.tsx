"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AssociateRowActions({
  id,
  isActive,
  currentRank,
}: {
  id: string;
  isActive: boolean;
  currentRank: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/associates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      router.refresh();
    } catch {
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const updateRank = async (newRank: string) => {
    setLoading(true);
    try {
      await fetch("/api/admin/associates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, rank: newRank }),
      });
      router.refresh();
    } catch {
      alert("Failed to update rank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentRank}
        onChange={(e) => updateRank(e.target.value)}
        disabled={loading}
        className="text-xs border border-gray-300 rounded px-2 py-1 outline-none"
      >
        <option value="Client Adviser">Client Adviser</option>
        <option value="Senior Adviser">Senior Adviser</option>
        <option value="Team Leader">Team Leader</option>
        <option value="Branch Manager">Branch Manager</option>
        <option value="Director">Director</option>
      </select>

      <button
        onClick={toggleStatus}
        disabled={loading}
        className={`px-2 py-1 text-xs rounded font-medium transition ${
          isActive
            ? "bg-red-50 text-red-600 hover:bg-red-100"
            : "bg-green-50 text-green-600 hover:bg-green-100"
        }`}
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
    </div>
  );
}

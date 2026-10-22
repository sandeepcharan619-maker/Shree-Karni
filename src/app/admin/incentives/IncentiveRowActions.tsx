"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IncentiveRowActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/incentives", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus === "PAID") {
    return <span className="text-xs text-gray-400 italic">Completed</span>;
  }

  return (
    <div className="flex items-center gap-1.5">
      {currentStatus === "PENDING" && (
        <button
          onClick={() => updateStatus("APPROVED")}
          disabled={loading}
          className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-medium transition"
        >
          Approve
        </button>
      )}
      <button
        onClick={() => updateStatus("PAID")}
        disabled={loading}
        className="px-2.5 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded font-medium transition"
      >
        Mark Paid
      </button>
    </div>
  );
}

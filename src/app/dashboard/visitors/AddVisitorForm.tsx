"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddVisitorForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    visitorName: "",
    phone: "",
    plotInterest: "",
    feedback: "",
    status: "VISITED",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add visitor");
      setForm({ visitorName: "", phone: "", plotInterest: "", feedback: "", status: "VISITED" });
      setOpen(false);
      router.refresh();
    } catch {
      alert("Failed to add visitor");
    } finally {
      setLoading(false);
    }
  };

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
      >
        + Add Visitor
      </button>
    );

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <h3 className="font-semibold text-gray-800 mb-4">Add New Visitor</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Visitor Name *"
          value={form.visitorName}
          onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
          required
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="tel"
          placeholder="Phone *"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Plot Interest"
          value={form.plotInterest}
          onChange={(e) => setForm({ ...form, plotInterest: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="VISITED">Visited</option>
          <option value="INTERESTED">Interested</option>
          <option value="NOT_INTERESTED">Not Interested</option>
          <option value="FOLLOW_UP">Follow Up</option>
        </select>
        <input
          type="text"
          placeholder="Feedback"
          value={form.feedback}
          onChange={(e) => setForm({ ...form, feedback: e.target.value })}
          className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="md:col-span-2 flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Visitor"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

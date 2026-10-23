"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, X, RefreshCw } from "lucide-react";

export default function AddPlotModal({
  onSuccess,
}: {
  onSuccess?: (newPlot: any) => void;
} = {}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    plotNumber: "",
    projectName: "Shree Karni City",
    location: "Main Vatika Road, Jaipur",
    sizeGaj: "",
    pricePerGaj: "",
    status: "AVAILABLE",
  });

  const handleOpen = () => {
    setError("");
    setSuccess("");
    setForm({
      plotNumber: "",
      projectName: "Shree Karni City",
      location: "Main Vatika Road, Jaipur",
      sizeGaj: "",
      pricePerGaj: "",
      status: "AVAILABLE",
    });
    setIsOpen(true);
  };

  const calculatedTotal =
    parseFloat(form.sizeGaj) > 0 && parseFloat(form.pricePerGaj) > 0
      ? (parseFloat(form.sizeGaj) * parseFloat(form.pricePerGaj)).toLocaleString("en-IN")
      : "0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/plots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create plot");

      const createdPlot = {
        id: data.plot?.id || `local-${Date.now()}`,
        plotNumber: form.plotNumber.trim().toUpperCase(),
        projectName: form.projectName.trim(),
        location: form.location.trim(),
        sizeGaj: parseFloat(form.sizeGaj),
        pricePerGaj: parseFloat(form.pricePerGaj),
        totalPrice: parseFloat(form.sizeGaj) * parseFloat(form.pricePerGaj),
        status: form.status,
      };

      if (onSuccess) {
        onSuccess(createdPlot);
      }

      setSuccess(`Plot ${createdPlot.plotNumber} added successfully!`);
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-xs transition"
      >
        <PlusCircle size={16} />
        <span>+ Add Plot</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-[#0a1628] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle size={18} className="text-yellow-400" />
                <h3 className="font-semibold text-lg">Add New Plot Entry</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm font-medium">
                  {success}
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Plot Number */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Plot Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SKC-101"
                    value={form.plotNumber}
                    onChange={(e) => setForm({ ...form, plotNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase font-semibold"
                  />
                </div>

                {/* Project Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shree Karni City"
                    value={form.projectName}
                    onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Location */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Location / Corridor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Vatika Road, Jaipur"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Size (GAJ) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Size (GAJ) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 150"
                    value={form.sizeGaj}
                    onChange={(e) => setForm({ ...form, sizeGaj: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Price Per GAJ */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Price / GAJ (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    placeholder="e.g. 6500"
                    value={form.pricePerGaj}
                    onChange={(e) => setForm({ ...form, pricePerGaj: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                  </select>
                </div>

                {/* Auto Calculated Total */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-gray-500">Auto Calculated Price</span>
                  <span className="text-base font-bold text-blue-700">₹{calculatedTotal}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50"
                >
                  {loading && <RefreshCw size={14} className="animate-spin" />}
                  <span>{loading ? "Adding Plot..." : "Save Plot"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

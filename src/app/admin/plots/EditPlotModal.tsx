"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { PlotItem } from "@/components/PlotsManager";

export interface AssociateOption {
  id: string;
  name: string;
  memberId: string;
}

export default function EditPlotModal({
  plot,
  isOpen,
  onClose,
  onSuccess,
  associates = [],
}: {
  plot: PlotItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPlot: PlotItem) => void;
  associates?: AssociateOption[];
}) {
  const [form, setForm] = useState({
    plotNumber: "",
    projectName: "",
    location: "",
    sizeGaj: "",
    pricePerGaj: "",
    totalPrice: "",
    status: "AVAILABLE",
    buyerName: "",
    buyerPhone: "",
    soldById: "",
    saleAmount: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (plot) {
      const size = plot.sizeGaj || 0;
      const price = plot.pricePerGaj || 0;
      const total = plot.totalPrice || size * price;

      setForm({
        plotNumber: plot.plotNumber || "",
        projectName: plot.projectName || "Shree Karni City",
        location: plot.location || "",
        sizeGaj: size ? size.toString() : "",
        pricePerGaj: price ? price.toString() : "",
        totalPrice: total ? total.toString() : "",
        status: plot.status || "AVAILABLE",
        buyerName: plot.sale?.buyerName || "",
        buyerPhone: (plot.sale as any)?.buyerPhone || "",
        soldById: (plot.sale as any)?.soldById || plot.sale?.soldBy?.id || "",
        saleAmount: (plot.sale as any)?.saleAmount ? (plot.sale as any).saleAmount.toString() : total.toString(),
      });
      setError(null);
    }
  }, [plot]);

  if (!isOpen || !plot) return null;

  const handleSizeChange = (val: string) => {
    const s = parseFloat(val) || 0;
    const p = parseFloat(form.pricePerGaj) || 0;
    setForm((prev) => ({
      ...prev,
      sizeGaj: val,
      totalPrice: (s * p).toString(),
      saleAmount: prev.status === "SOLD" ? (s * p).toString() : prev.saleAmount,
    }));
  };

  const handlePriceChange = (val: string) => {
    const p = parseFloat(val) || 0;
    const s = parseFloat(form.sizeGaj) || 0;
    setForm((prev) => ({
      ...prev,
      pricePerGaj: val,
      totalPrice: (s * p).toString(),
      saleAmount: prev.status === "SOLD" ? (s * p).toString() : prev.saleAmount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload: any = {
        id: plot.id,
        plotNumber: form.plotNumber.trim().toUpperCase(),
        projectName: form.projectName.trim(),
        location: form.location.trim(),
        sizeGaj: parseFloat(form.sizeGaj) || 0,
        pricePerGaj: parseFloat(form.pricePerGaj) || 0,
        totalPrice: parseFloat(form.totalPrice) || 0,
        status: form.status,
      };

      if (form.status === "SOLD" || form.buyerName.trim()) {
        payload.buyerName = form.buyerName.trim();
        payload.buyerPhone = form.buyerPhone.trim();
        payload.soldById = form.soldById;
        payload.saleAmount = parseFloat(form.saleAmount) || payload.totalPrice;
      } else if (form.status === "AVAILABLE") {
        payload.buyerName = "";
        payload.soldById = "";
      }

      // 1. Optimistic updated object
      const selectedAssoc = associates.find((a) => a.id === form.soldById);
      const updatedItem: PlotItem = {
        ...plot,
        plotNumber: payload.plotNumber,
        projectName: payload.projectName,
        location: payload.location,
        sizeGaj: payload.sizeGaj,
        pricePerGaj: payload.pricePerGaj,
        totalPrice: payload.totalPrice,
        status: payload.status,
        sale:
          form.status === "SOLD" || form.buyerName.trim()
            ? {
                buyerName: form.buyerName.trim() || "Buyer",
                buyerPhone: form.buyerPhone.trim(),
                soldBy: selectedAssoc ? { id: selectedAssoc.id, name: selectedAssoc.name, memberId: selectedAssoc.memberId } : undefined,
              }
            : null,
      };

      // 2. Call server API
      const res = await fetch("/api/admin/plots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update plot");
      }

      const finalPlot = data.plot || updatedItem;

      // 3. Update localStorage
      try {
        const stored = localStorage.getItem("shreekarni_custom_plots_v1");
        if (stored) {
          const list = JSON.parse(stored);
          const updatedList = list.map((p: any) =>
            p.id === plot.id || p.plotNumber === plot.plotNumber ? { ...p, ...finalPlot } : p
          );
          localStorage.setItem("shreekarni_custom_plots_v1", JSON.stringify(updatedList));
        }
      } catch (e) {}

      // 4. Dispatch global event
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("skr-plot-updated", { detail: finalPlot })
        );
      }

      onSuccess(finalPlot);
      onClose();
    } catch (err: any) {
      console.error("Edit plot error:", err);
      setError(err.message || "An unexpected error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Edit Plot Details: <span className="text-blue-600">{plot.plotNumber}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Modify Plot No, Project, Location, Size in GAJ, Pricing, Status, and Associate Assignment
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Plot Identity */}
          <div className="bg-gray-50/70 p-4 rounded-lg border border-gray-200/80 space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              1. Plot Specifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Plot Number *
                </label>
                <input
                  type="text"
                  required
                  value={form.plotNumber}
                  onChange={(e) => setForm({ ...form, plotNumber: e.target.value })}
                  placeholder="e.g. SKC-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  placeholder="e.g. Shree Karni City"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Sector 1, Jodhpur"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Size & Pricing */}
          <div className="bg-gray-50/70 p-4 rounded-lg border border-gray-200/80 space-y-4">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              2. Dimensions & Pricing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Size (GAJ) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={form.sizeGaj}
                  onChange={(e) => handleSizeChange(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Price / GAJ (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={form.pricePerGaj}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Total Price (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.totalPrice}
                  onChange={(e) => setForm({ ...form, totalPrice: e.target.value })}
                  placeholder="Calculated automatically"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-emerald-700"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Status & Sales / Associate */}
          <div className="bg-gray-50/70 p-4 rounded-lg border border-gray-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                3. Plot Status & Sale Details
              </h4>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  form.status === "SOLD"
                    ? "bg-red-100 text-red-700"
                    : form.status === "RESERVED"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {form.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Inventory Status *
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium cursor-pointer"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="SOLD">Sold</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Assigned Associate / Agent
                </label>
                <select
                  value={form.soldById}
                  onChange={(e) => setForm({ ...form, soldById: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                >
                  <option value="">-- None / Select Associate --</option>
                  {associates.map((assoc) => (
                    <option key={assoc.id} value={assoc.id}>
                      {assoc.name} ({assoc.memberId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Buyer fields - shown if status is SOLD, RESERVED or buyerName entered */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sold To (Buyer Name)
                </label>
                <input
                  type="text"
                  value={form.buyerName}
                  onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                  placeholder="Buyer's Full Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Buyer Contact / Phone
                </label>
                <input
                  type="tel"
                  value={form.buyerPhone}
                  onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                  placeholder="Buyer Mobile No."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sale Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.saleAmount}
                  onChange={(e) => setForm({ ...form, saleAmount: e.target.value })}
                  placeholder={form.totalPrice || "0"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save size={16} />
              <span>{loading ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

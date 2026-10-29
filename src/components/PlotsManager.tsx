"use client";

import { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import AddPlotModal from "@/app/admin/plots/AddPlotModal";
import EditPlotModal, { AssociateOption } from "@/app/admin/plots/EditPlotModal";
import PlotRowActions from "@/app/admin/plots/PlotRowActions";
import { Search, MapPin, CheckCircle2, Check, X, ExternalLink, Trash2, Edit } from "lucide-react";

export interface PlotItem {
  id: string;
  plotNumber: string;
  projectName: string;
  location: string;
  sizeGaj: number;
  pricePerGaj: number;
  totalPrice: number;
  status: string;
  sale?: {
    id?: string;
    buyerName: string;
    buyerPhone?: string;
    saleAmount?: number;
    soldById?: string;
    soldBy?: { id?: string; name: string; memberId: string };
  } | null;
  createdAt?: string | Date;
}

const PLOT_STORAGE_KEY = "shreekarni_custom_plots_v1";

export default function PlotsManager({
  initialPlots = [],
  initialAssociates = [],
  title = "Plots Inventory",
  subtitle = "Live plot availability, sizes in GAJ, pricing, and status management",
  maxRows,
}: {
  initialPlots: PlotItem[];
  initialAssociates?: AssociateOption[];
  title?: string;
  subtitle?: string;
  maxRows?: number;
}) {
  const [plots, setPlots] = useState<PlotItem[]>(initialPlots);
  const [associates, setAssociates] = useState<AssociateOption[]>(initialAssociates);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState<string | null>(null);

  // Modal edit state
  const [modalPlot, setModalPlot] = useState<PlotItem | null>(null);

  // Inline row edit state
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [inlineForm, setInlineForm] = useState({
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

  // Sync with persistent browser storage & associates list on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PLOT_STORAGE_KEY);
      if (stored) {
        const localList: PlotItem[] = JSON.parse(stored);
        if (Array.isArray(localList) && localList.length > 0) {
          setPlots((prev) => {
            const map = new Map<string, PlotItem>();
            prev.forEach((item) => map.set((item.plotNumber || item.id).toUpperCase(), item));
            localList.forEach((item) => map.set((item.plotNumber || item.id).toUpperCase(), item));
            return Array.from(map.values());
          });
        }
      }
    } catch (e) {}

    // Fetch associates if empty
    if (!initialAssociates || initialAssociates.length === 0) {
      fetch("/api/admin/associates")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAssociates(
              data.map((u: any) => ({
                id: u.id,
                name: u.name,
                memberId: u.memberId,
              }))
            );
          }
        })
        .catch(() => {});
    }

    // Listen to global plot add/delete/update events
    const handleGlobalPlotAdded = (e: any) => {
      const newPlot = e.detail;
      if (newPlot) {
        setPlots((prev) => {
          const cleanPlotNumber = (newPlot.plotNumber || "").toUpperCase();
          return [newPlot, ...prev.filter((p) => (p.plotNumber || "").toUpperCase() !== cleanPlotNumber)];
        });
        showToast(`Plot ${newPlot.plotNumber} added to the inventory!`);
      }
    };

    const handleGlobalPlotDeleted = (e: any) => {
      const { id, plotNumber } = e.detail || {};
      setPlots((prev) =>
        prev.filter((p) => {
          if (id && p.id === id) return false;
          if (plotNumber && (p.plotNumber || "").toUpperCase() === (plotNumber || "").toUpperCase()) return false;
          return true;
        })
      );
      showToast("Plot removed successfully.");
    };

    const handleGlobalPlotUpdated = (e: any) => {
      const updated = e.detail;
      if (updated && (updated.id || updated.plotNumber)) {
        setPlots((prev) =>
          prev.map((p) => {
            if (p.id === updated.id || (p.plotNumber && p.plotNumber.toUpperCase() === (updated.plotNumber || "").toUpperCase())) {
              return { ...p, ...updated };
            }
            return p;
          })
        );
      }
    };

    window.addEventListener("skr-plot-added", handleGlobalPlotAdded);
    window.addEventListener("skr-plot-deleted", handleGlobalPlotDeleted);
    window.addEventListener("skr-plot-updated", handleGlobalPlotUpdated);

    return () => {
      window.removeEventListener("skr-plot-added", handleGlobalPlotAdded);
      window.removeEventListener("skr-plot-deleted", handleGlobalPlotDeleted);
      window.removeEventListener("skr-plot-updated", handleGlobalPlotUpdated);
    };
  }, [initialAssociates]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handlePlotCreated = (newPlot: PlotItem) => {
    setPlots((prev) => {
      const cleanPlotNumber = (newPlot.plotNumber || "").toUpperCase();
      const updated = [newPlot, ...prev.filter((p) => (p.plotNumber || "").toUpperCase() !== cleanPlotNumber)];
      try {
        localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Plot ${newPlot.plotNumber} added to the inventory!`);
  };

  const handlePlotDeleted = (id: string, plotNumber: string) => {
    setPlots((prev) => {
      const updated = prev.filter((p) => {
        if (id && p.id === id) return false;
        if (plotNumber && (p.plotNumber || "").toUpperCase() === (plotNumber || "").toUpperCase()) return false;
        return true;
      });
      try {
        localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast("Plot deleted successfully.");
  };

  const handlePlotUpdated = (id: string, updates: Partial<PlotItem>) => {
    setPlots((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      try {
        localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handlePlotUpdatedFromModal = (updatedPlot: PlotItem) => {
    setPlots((prev) => {
      const updated = prev.map((p) =>
        p.id === updatedPlot.id || (p.plotNumber && p.plotNumber.toUpperCase() === updatedPlot.plotNumber.toUpperCase())
          ? updatedPlot
          : p
      );
      try {
        localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Plot ${updatedPlot.plotNumber} updated successfully!`);
  };

  // Start inline editing for a row
  const startInlineEdit = (plot: PlotItem) => {
    const size = plot.sizeGaj || 0;
    const price = plot.pricePerGaj || 0;
    const total = plot.totalPrice || size * price;

    setInlineForm({
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
    setEditingPlotId(plot.id);
  };

  const cancelInlineEdit = () => {
    setEditingPlotId(null);
  };

  const handleInlineSizeChange = (val: string) => {
    const s = parseFloat(val) || 0;
    const p = parseFloat(inlineForm.pricePerGaj) || 0;
    setInlineForm((prev) => ({
      ...prev,
      sizeGaj: val,
      totalPrice: (s * p).toString(),
      saleAmount: prev.status === "SOLD" ? (s * p).toString() : prev.saleAmount,
    }));
  };

  const handleInlinePriceChange = (val: string) => {
    const p = parseFloat(val) || 0;
    const s = parseFloat(inlineForm.sizeGaj) || 0;
    setInlineForm((prev) => ({
      ...prev,
      pricePerGaj: val,
      totalPrice: (s * p).toString(),
      saleAmount: prev.status === "SOLD" ? (s * p).toString() : prev.saleAmount,
    }));
  };

  const saveInlineEdit = async (plot: PlotItem) => {
    setInlineSaving(true);
    try {
      const payload: any = {
        id: plot.id,
        plotNumber: inlineForm.plotNumber.trim().toUpperCase(),
        projectName: inlineForm.projectName.trim(),
        location: inlineForm.location.trim(),
        sizeGaj: parseFloat(inlineForm.sizeGaj) || 0,
        pricePerGaj: parseFloat(inlineForm.pricePerGaj) || 0,
        totalPrice: parseFloat(inlineForm.totalPrice) || 0,
        status: inlineForm.status,
      };

      if (inlineForm.status === "SOLD" || inlineForm.buyerName.trim()) {
        payload.buyerName = inlineForm.buyerName.trim();
        payload.buyerPhone = inlineForm.buyerPhone.trim();
        payload.soldById = inlineForm.soldById;
        payload.saleAmount = parseFloat(inlineForm.saleAmount) || payload.totalPrice;
      } else if (inlineForm.status === "AVAILABLE") {
        payload.buyerName = "";
        payload.soldById = "";
      }

      const selectedAssoc = associates.find((a) => a.id === inlineForm.soldById);
      const updatedLocal: PlotItem = {
        ...plot,
        plotNumber: payload.plotNumber,
        projectName: payload.projectName,
        location: payload.location,
        sizeGaj: payload.sizeGaj,
        pricePerGaj: payload.pricePerGaj,
        totalPrice: payload.totalPrice,
        status: payload.status,
        sale:
          inlineForm.status === "SOLD" || inlineForm.buyerName.trim()
            ? {
                buyerName: inlineForm.buyerName.trim() || "Buyer",
                buyerPhone: inlineForm.buyerPhone.trim(),
                soldBy: selectedAssoc ? { id: selectedAssoc.id, name: selectedAssoc.name, memberId: selectedAssoc.memberId } : undefined,
              }
            : null,
      };

      // Optimistic update
      setPlots((prev) => prev.map((p) => (p.id === plot.id ? updatedLocal : p)));

      const res = await fetch("/api/admin/plots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update plot");
      }

      const finalPlot = data.plot || updatedLocal;

      // Update state & storage with final server response
      setPlots((prev) => {
        const list = prev.map((p) => (p.id === plot.id ? finalPlot : p));
        try {
          localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(list));
        } catch (e) {}
        return list;
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("skr-plot-updated", { detail: finalPlot }));
      }

      showToast(`Plot ${finalPlot.plotNumber} updated successfully!`);
      setEditingPlotId(null);
    } catch (err: any) {
      alert(err.message || "Failed to save plot changes");
    } finally {
      setInlineSaving(false);
    }
  };

  const filtered = plots.filter((plot) => {
    const matchSearch =
      plot.plotNumber.toLowerCase().includes(search.toLowerCase()) ||
      plot.projectName.toLowerCase().includes(search.toLowerCase()) ||
      plot.location.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "ALL" || plot.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const displayList = maxRows ? filtered.slice(0, maxRows) : filtered;

  return (
    <div className="space-y-4">
      {/* Toast alert */}
      {toast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-md flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span className="font-semibold">{toast}</span>
          </div>
          <button type="button" onClick={() => setToast(null)} className="text-white/80 hover:text-white text-xs cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header with Title and Add Modal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={20} className="text-emerald-600" />
            <span>{title} ({plots.length})</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <div>
          <AddPlotModal onSuccess={handlePlotCreated} />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-lg shadow-xs border border-gray-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search plot number, project, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 font-medium shrink-0">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white outline-none w-full sm:w-auto cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px]">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
                <th className="px-3.5 py-3 text-left">Plot No</th>
                <th className="px-3.5 py-3 text-left">Project</th>
                <th className="px-3.5 py-3 text-left">Location</th>
                <th className="px-3.5 py-3 text-left">Size (GAJ)</th>
                <th className="px-3.5 py-3 text-left">Price/GAJ</th>
                <th className="px-3.5 py-3 text-left">Total Price</th>
                <th className="px-3.5 py-3 text-left">Status</th>
                <th className="px-3.5 py-3 text-left">Sold To / Associate</th>
                <th className="px-3.5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                    <p className="font-medium text-gray-700">No plots found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {search ? "Try adjusting your search criteria" : "Click '+ Add Plot' above to register new plot inventory."}
                    </p>
                  </td>
                </tr>
              ) : (
                displayList.map((plot) => {
                  const isEditing = editingPlotId === plot.id;

                  if (isEditing) {
                    return (
                      <tr key={plot.id} className="bg-blue-50/30 border-2 border-blue-400 animate-in fade-in">
                        {/* 1. Plot No */}
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={inlineForm.plotNumber}
                            onChange={(e) => setInlineForm({ ...inlineForm, plotNumber: e.target.value })}
                            className="w-24 px-2 py-1 text-xs border border-blue-400 rounded font-semibold text-blue-700 bg-white uppercase focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Plot No"
                          />
                        </td>

                        {/* 2. Project */}
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={inlineForm.projectName}
                            onChange={(e) => setInlineForm({ ...inlineForm, projectName: e.target.value })}
                            className="w-28 px-2 py-1 text-xs border border-gray-300 rounded text-gray-800 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Project"
                          />
                        </td>

                        {/* 3. Location */}
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={inlineForm.location}
                            onChange={(e) => setInlineForm({ ...inlineForm, location: e.target.value })}
                            className="w-32 px-2 py-1 text-xs border border-gray-300 rounded text-gray-800 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                            placeholder="Location"
                          />
                        </td>

                        {/* 4. Size (GAJ) */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={inlineForm.sizeGaj}
                              onChange={(e) => handleInlineSizeChange(e.target.value)}
                              className="w-18 px-2 py-1 text-xs border border-gray-300 rounded font-semibold bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                              placeholder="Size"
                            />
                            <span className="text-xs text-gray-500 font-medium">GAJ</span>
                          </div>
                        </td>

                        {/* 5. Price/GAJ */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">₹</span>
                            <input
                              type="number"
                              step="any"
                              value={inlineForm.pricePerGaj}
                              onChange={(e) => handleInlinePriceChange(e.target.value)}
                              className="w-20 px-2 py-1 text-xs border border-gray-300 rounded font-semibold bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                              placeholder="Rate"
                            />
                          </div>
                        </td>

                        {/* 6. Total Price */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-emerald-700 font-bold">₹</span>
                            <input
                              type="number"
                              step="any"
                              value={inlineForm.totalPrice}
                              onChange={(e) => setInlineForm({ ...inlineForm, totalPrice: e.target.value })}
                              className="w-24 px-2 py-1 text-xs border border-emerald-400 rounded font-bold text-emerald-700 bg-emerald-50/50 focus:ring-1 focus:ring-emerald-500 outline-none"
                              placeholder="Total"
                            />
                          </div>
                        </td>

                        {/* 7. Status */}
                        <td className="px-2 py-2">
                          <select
                            value={inlineForm.status}
                            onChange={(e) => setInlineForm({ ...inlineForm, status: e.target.value })}
                            className="px-2 py-1 text-xs border border-gray-300 rounded font-semibold bg-white cursor-pointer outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="AVAILABLE">Available</option>
                            <option value="RESERVED">Reserved</option>
                            <option value="SOLD">Sold</option>
                          </select>
                        </td>

                        {/* 8. Sold To / Associate */}
                        <td className="px-2 py-2">
                          <div className="space-y-1 min-w-[150px]">
                            <input
                              type="text"
                              value={inlineForm.buyerName}
                              onChange={(e) => setInlineForm({ ...inlineForm, buyerName: e.target.value })}
                              placeholder="Buyer name"
                              className="w-full px-2 py-0.5 text-xs border border-gray-300 rounded bg-white placeholder:text-gray-400 outline-none"
                            />
                            <select
                              value={inlineForm.soldById}
                              onChange={(e) => setInlineForm({ ...inlineForm, soldById: e.target.value })}
                              className="w-full px-1.5 py-0.5 text-xs border border-gray-300 rounded bg-white text-gray-700 cursor-pointer outline-none"
                            >
                              <option value="">-- Associate --</option>
                              {associates.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({a.memberId})
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* 9. Actions (Inline Save / Cancel) */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => saveInlineEdit(plot)}
                              disabled={inlineSaving}
                              title="Save inline changes"
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                            >
                              <Check size={13} />
                              <span>{inlineSaving ? "Saving..." : "Save"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={cancelInlineEdit}
                              title="Cancel editing"
                              className="p-1 text-xs rounded border border-gray-300 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                            >
                              <X size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPlotId(null);
                                setModalPlot(plot);
                              }}
                              title="Open full edit dialog modal"
                              className="p-1 text-xs rounded border border-blue-200 text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            >
                              <ExternalLink size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Normal view row
                  return (
                    <tr
                      key={plot.id || plot.plotNumber}
                      onDoubleClick={() => startInlineEdit(plot)}
                      className="hover:bg-gray-50 transition group"
                    >
                      {/* Plot No */}
                      <td className="px-3.5 py-3 text-sm font-semibold text-blue-600">
                        {plot.plotNumber}
                      </td>

                      {/* Project */}
                      <td className="px-3.5 py-3 text-sm text-gray-700">{plot.projectName}</td>

                      {/* Location */}
                      <td className="px-3.5 py-3 text-sm text-gray-700">{plot.location}</td>

                      {/* Size (GAJ) */}
                      <td className="px-3.5 py-3 text-sm font-medium text-gray-800">
                        {plot.sizeGaj} GAJ
                      </td>

                      {/* Price/GAJ */}
                      <td className="px-3.5 py-3 text-sm text-gray-700">
                        ₹{(plot.pricePerGaj || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Total Price */}
                      <td className="px-3.5 py-3 text-sm font-semibold text-gray-800">
                        ₹{(plot.totalPrice || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Status */}
                      <td className="px-3.5 py-3 text-sm">
                        <StatusBadge status={plot.status} />
                      </td>

                      {/* Sold To / Associate */}
                      <td className="px-3.5 py-3 text-sm text-gray-600">
                        {plot.sale ? (
                          <div>
                            <div className="font-medium text-gray-800">{plot.sale.buyerName}</div>
                            {plot.sale.soldBy?.name && (
                              <div className="text-xs text-gray-500">
                                by {plot.sale.soldBy.name} ({plot.sale.soldBy.memberId})
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-3 text-sm">
                        <PlotRowActions
                          id={plot.id}
                          plotNumber={plot.plotNumber}
                          currentStatus={plot.status}
                          onDeleted={() => handlePlotDeleted(plot.id, plot.plotNumber)}
                          onUpdated={(newStatus) => handlePlotUpdated(plot.id, { status: newStatus })}
                          onEditInline={() => startInlineEdit(plot)}
                          onOpenModal={() => setModalPlot(plot)}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Plot Modal for full detailed popup editing */}
      <EditPlotModal
        isOpen={!!modalPlot}
        plot={modalPlot}
        onClose={() => setModalPlot(null)}
        onSuccess={handlePlotUpdatedFromModal}
        associates={associates}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import AddPlotModal from "@/app/admin/plots/AddPlotModal";
import PlotRowActions from "@/app/admin/plots/PlotRowActions";
import { Search, MapPin, CheckCircle2 } from "lucide-react";

export interface PlotItem {
  id: string;
  plotNumber: string;
  projectName: string;
  location: string;
  sizeGaj: number;
  pricePerGaj: number;
  totalPrice: number;
  status: string;
  sale?: { buyerName: string; soldBy: { name: string; memberId: string } } | null;
  createdAt?: string | Date;
}

const PLOT_STORAGE_KEY = "shreekarni_custom_plots_v1";

export default function PlotsManager({
  initialPlots = [],
  title = "Plots Inventory",
  subtitle = "Live plot availability, sizes in GAJ, pricing, and status management",
  maxRows,
}: {
  initialPlots: PlotItem[];
  title?: string;
  subtitle?: string;
  maxRows?: number;
}) {
  const [plots, setPlots] = useState<PlotItem[]>(initialPlots);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PLOT_STORAGE_KEY);
      if (stored) {
        const localList: PlotItem[] = JSON.parse(stored);
        if (Array.isArray(localList) && localList.length > 0) {
          setPlots((prev) => {
            const map = new Map<string, PlotItem>();
            prev.forEach((item) => map.set(item.plotNumber || item.id, item));
            localList.forEach((item) => map.set(item.plotNumber || item.id, item));
            return Array.from(map.values());
          });
        }
      }
    } catch (e) {}
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handlePlotCreated = (newPlot: PlotItem) => {
    setPlots((prev) => {
      const updated = [newPlot, ...prev.filter((p) => p.plotNumber !== newPlot.plotNumber)];
      try {
        localStorage.setItem(PLOT_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Plot ${newPlot.plotNumber} added to the inventory!`);
  };

  const handlePlotDeleted = (id: string, plotNumber: string) => {
    setPlots((prev) => {
      const updated = prev.filter((p) => p.id !== id && p.plotNumber !== plotNumber);
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
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white text-xs">
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
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white outline-none w-full sm:w-auto"
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
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
                <th className="px-4 py-3 text-left">Plot No</th>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Size (GAJ)</th>
                <th className="px-4 py-3 text-left">Price/GAJ</th>
                <th className="px-4 py-3 text-left">Total Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Sold To / Associate</th>
                <th className="px-4 py-3 text-left">Actions</th>
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
                displayList.map((plot) => (
                  <tr key={plot.id || plot.plotNumber} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                      {plot.plotNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{plot.projectName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{plot.location}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {plot.sizeGaj} GAJ
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      ₹{plot.pricePerGaj.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      ₹{plot.totalPrice.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={plot.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {plot.sale ? (
                        <div>
                          <div className="font-medium text-gray-800">{plot.sale.buyerName}</div>
                          <div className="text-xs text-gray-400">by {plot.sale.soldBy?.name}</div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <PlotRowActions
                        id={plot.id}
                        plotNumber={plot.plotNumber}
                        currentStatus={plot.status}
                        onDeleted={() => handlePlotDeleted(plot.id, plot.plotNumber)}
                        onUpdated={(newStatus) => handlePlotUpdated(plot.id, { status: newStatus })}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Plus,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  Compass,
  ArrowRight,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Download,
  CalendarCheck,
  Building2,
  Eye,
  Save,
} from "lucide-react";

export interface PlotData {
  id: string;
  plotNumber: string;
  projectName: string;
  location: string;
  sizeGaj: number;
  pricePerGaj: number;
  totalPrice: number;
  status: string; // AVAILABLE, BOOKED, SOLD, RESERVED
  facing?: string | null;
  dimensions?: string | null;
  roadWidth?: string | null;
  sector?: string | null;
  projectId?: string | null;
  project?: { id: string; name: string; location: string } | null;
  customer?: { id: string; name: string; phone: string; customerId: string } | null;
  assignedAssociate?: { id: string; name: string; memberId: string } | null;
  sale?: {
    buyerName: string;
    buyerPhone: string;
    saleAmount: number;
    soldById?: string;
    soldBy?: { id?: string; name: string; memberId: string } | null;
  } | null;
  bookings?: {
    id: string;
    bookingNumber: string;
    customerName: string;
    customerPhone: string;
    bookingAmount: number;
    balanceAmount: number;
    status: string;
  }[];
}

interface AdminPlotsManagerProps {
  initialPlots: PlotData[];
  projects: { id: string; name: string }[];
  associates: { id: string; name: string; memberId: string }[];
}

export default function AdminPlotsManager({
  initialPlots,
  projects,
  associates,
}: AdminPlotsManagerProps) {
  const [plots, setPlots] = useState<PlotData[]>(initialPlots);
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [facingFilter, setFacingFilter] = useState("ALL");
  const [roadFilter, setRoadFilter] = useState("ALL");

  // Selected plot for inspection modal
  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<PlotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Edit plot form state
  const [editForm, setEditForm] = useState({
    id: "",
    plotNumber: "",
    projectId: "",
    projectName: "",
    location: "",
    sector: "",
    sizeGaj: "150",
    pricePerGaj: "11500",
    totalPrice: "1725000",
    status: "AVAILABLE",
    facing: "East",
    dimensions: "30 x 45",
    roadWidth: "30 Ft",
    assignedAssociateId: "",
    buyerName: "",
    buyerPhone: "",
    soldById: "",
    saleAmount: "",
  });

  // Form states
  const [singleForm, setSingleForm] = useState({
    plotNumber: "",
    projectName: projects[0]?.name || "Shree Karni Vatika Township",
    location: "Vatika, Jaipur",
    sizeGaj: "150",
    pricePerGaj: "11500",
    status: "AVAILABLE",
    facing: "East",
    dimensions: "30 x 45",
    roadWidth: "30 Ft",
    sector: "Block A",
    projectId: projects[0]?.id || "",
  });

  const [bulkForm, setBulkForm] = useState({
    prefix: "VTK",
    startNumber: "101",
    count: "20",
    projectName: projects[0]?.name || "Shree Karni Vatika Township",
    location: "Vatika, Jaipur",
    sizeGaj: "125",
    pricePerGaj: "11000",
    facing: "East",
    dimensions: "30 x 45",
    roadWidth: "30 Ft",
    sector: "Block A",
    projectId: projects[0]?.id || "",
  });

  const availableCount = plots.filter((p) => p.status === "AVAILABLE").length;
  const bookedCount = plots.filter((p) => p.status === "BOOKED" || p.status === "RESERVED").length;
  const soldCount = plots.filter((p) => p.status === "SOLD").length;

  // Filtered plots
  const filtered = plots.filter((p) => {
    const matchesSearch =
      p.plotNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.projectName.toLowerCase().includes(search.toLowerCase()) ||
      (p.customer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sale?.buyerName || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "BOOKED"
        ? p.status === "BOOKED" || p.status === "RESERVED"
        : p.status === statusFilter;

    const matchesSector = sectorFilter === "ALL" || p.sector === sectorFilter;
    const matchesFacing = facingFilter === "ALL" || p.facing === facingFilter;
    const matchesRoad = roadFilter === "ALL" || p.roadWidth === roadFilter;

    return matchesSearch && matchesStatus && matchesSector && matchesFacing && matchesRoad;
  });

  // Handle single plot create
  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/plots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(singleForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create plot");

      // Refetch
      const fetchRes = await fetch("/api/admin/plots");
      const updatedPlots = await fetchRes.json();
      setPlots(updatedPlots);

      setIsAddModalOpen(false);
      setSingleForm({
        plotNumber: "",
        projectName: projects[0]?.name || "Shree Karni Vatika Township",
        location: "Vatika, Jaipur",
        sizeGaj: "150",
        pricePerGaj: "11500",
        status: "AVAILABLE",
        facing: "East",
        dimensions: "30 x 45",
        roadWidth: "30 Ft",
        sector: "Block A",
        projectId: projects[0]?.id || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk generate
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/plots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bulkForm, isBulk: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate plots");

      const fetchRes = await fetch("/api/admin/plots");
      const updatedPlots = await fetchRes.json();
      setPlots(updatedPlots);

      setIsBulkModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update plot status directly
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/plots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setPlots((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );

      if (selectedPlot && selectedPlot.id === id) {
        setSelectedPlot({ ...selectedPlot, status: newStatus });
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete plot
  const handleDeletePlot = async (id: string, plotNo: string) => {
    if (!confirm(`Are you sure you want to delete plot ${plotNo}?`)) return;

    try {
      const res = await fetch(`/api/admin/plots?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete plot");

      setPlots((prev) => prev.filter((p) => p.id !== id));
      if (selectedPlot?.id === id) setSelectedPlot(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Open Edit Modal for a plot
  const handleOpenEdit = (plot: PlotData) => {
    setEditingPlot(plot);
    const size = plot.sizeGaj || 0;
    const price = plot.pricePerGaj || 0;
    const total = plot.totalPrice || size * price;

    setEditForm({
      id: plot.id,
      plotNumber: plot.plotNumber || "",
      projectId: plot.projectId || plot.project?.id || "",
      projectName: plot.projectName || plot.project?.name || "Shree Karni Vatika Township",
      location: plot.location || plot.project?.location || "Vatika, Jaipur",
      sector: plot.sector || "Block A",
      sizeGaj: String(size),
      pricePerGaj: String(price),
      totalPrice: String(total),
      status: plot.status || "AVAILABLE",
      facing: plot.facing || "East",
      dimensions: plot.dimensions || "30 x 45",
      roadWidth: plot.roadWidth || "30 Ft",
      assignedAssociateId: plot.assignedAssociate?.id || "",
      buyerName: plot.customer?.name || plot.sale?.buyerName || "",
      buyerPhone: plot.customer?.phone || (plot.sale as any)?.buyerPhone || "",
      soldById: plot.sale?.soldBy?.id || (plot.sale as any)?.soldById || "",
      saleAmount: plot.sale?.saleAmount ? String(plot.sale.saleAmount) : String(total),
    });
    setError("");
    setIsEditModalOpen(true);
  };

  const handleEditSizeChange = (val: string) => {
    const s = parseFloat(val) || 0;
    const p = parseFloat(editForm.pricePerGaj) || 0;
    setEditForm((prev) => ({
      ...prev,
      sizeGaj: val,
      totalPrice: String(Math.round(s * p)),
      saleAmount: prev.status === "SOLD" ? String(Math.round(s * p)) : prev.saleAmount,
    }));
  };

  const handleEditPriceChange = (val: string) => {
    const p = parseFloat(val) || 0;
    const s = parseFloat(editForm.sizeGaj) || 0;
    setEditForm((prev) => ({
      ...prev,
      pricePerGaj: val,
      totalPrice: String(Math.round(s * p)),
      saleAmount: prev.status === "SOLD" ? String(Math.round(s * p)) : prev.saleAmount,
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: any = {
        id: editForm.id,
        plotNumber: editForm.plotNumber.trim().toUpperCase(),
        projectId: editForm.projectId || null,
        projectName: editForm.projectName.trim(),
        location: editForm.location.trim(),
        sector: editForm.sector.trim(),
        sizeGaj: parseFloat(editForm.sizeGaj) || 0,
        pricePerGaj: parseFloat(editForm.pricePerGaj) || 0,
        totalPrice: parseFloat(editForm.totalPrice) || 0,
        status: editForm.status,
        facing: editForm.facing,
        dimensions: editForm.dimensions,
        roadWidth: editForm.roadWidth,
        assignedAssociateId: editForm.assignedAssociateId || null,
      };

      if (editForm.status === "SOLD" || editForm.buyerName.trim()) {
        payload.buyerName = editForm.buyerName.trim();
        payload.buyerPhone = editForm.buyerPhone.trim();
        payload.soldById = editForm.soldById;
        payload.saleAmount = parseFloat(editForm.saleAmount) || payload.totalPrice;
      } else if (editForm.status === "AVAILABLE") {
        payload.buyerName = "";
        payload.buyerPhone = "";
        payload.soldById = "";
      }

      const res = await fetch("/api/admin/plots", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update plot");

      const updatedPlot: PlotData = data.plot;

      setPlots((prev) =>
        prev.map((p) => (p.id === updatedPlot.id ? { ...p, ...updatedPlot } : p))
      );

      if (selectedPlot?.id === updatedPlot.id) {
        setSelectedPlot({ ...selectedPlot, ...updatedPlot });
      }

      // Update localStorage & trigger custom event for multi-tab sync
      try {
        const stored = localStorage.getItem("shreekarni_custom_plots_v1");
        if (stored) {
          const list = JSON.parse(stored);
          const updated = list.map((p: any) =>
            p.id === updatedPlot.id || p.plotNumber === updatedPlot.plotNumber
              ? { ...p, ...updatedPlot }
              : p
          );
          localStorage.setItem("shreekarni_custom_plots_v1", JSON.stringify(updated));
        }
      } catch {}

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("skr-plot-updated", { detail: updatedPlot })
        );
      }

      setIsEditModalOpen(false);
      setEditingPlot(null);
    } catch (err: any) {
      setError(err.message || "Failed to update plot");
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Plot Number",
      "Project",
      "Sector",
      "Size (GAJ)",
      "Price Per GAJ",
      "Total Price",
      "Facing",
      "Road Width",
      "Dimensions",
      "Status",
      "Customer",
      "Associate",
    ];

    const rows = filtered.map((p) => [
      p.plotNumber,
      `"${p.projectName}"`,
      p.sector || "Block A",
      p.sizeGaj,
      p.pricePerGaj,
      p.totalPrice,
      p.facing || "East",
      p.roadWidth || "30 Ft",
      p.dimensions || "30 x 45",
      p.status,
      `"${p.customer?.name || p.sale?.buyerName || ""}"`,
      `"${p.assignedAssociate?.name || p.sale?.soldBy?.name || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ShreeKarni_Plots_Inventory_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* ============================================================== */}
      {/* 1. HEADER & ACTIONS                                             */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Plot Inventory Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Vatika, Jaipur
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visual interactive layout map, dimension sheets, pricing per square yard (Gaj), and live booking control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "map"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass size={14} className={viewMode === "map" ? "text-amber-500" : ""} />
              <span>Visual Map</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers size={14} className={viewMode === "table" ? "text-blue-500" : ""} />
              <span>Table Inventory</span>
            </button>
          </div>

          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>Bulk Generate</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 font-bold text-xs transition cursor-pointer shadow-sm"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Single Plot</span>
          </button>

          <button
            onClick={exportToCSV}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Export CSV"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. STATS PILLS & ADVANCED FILTERS                              */}
      {/* ============================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        {/* Status Counts */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              statusFilter === "ALL"
                ? "bg-[#0d1b2a] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>All Plots</span>
            <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[11px]">
              {plots.length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("AVAILABLE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              statusFilter === "AVAILABLE"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Available</span>
            <span className="px-1.5 py-0.2 bg-emerald-200/50 rounded-md text-[11px]">
              {availableCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("BOOKED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              statusFilter === "BOOKED"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Booked / Reserved</span>
            <span className="px-1.5 py-0.2 bg-amber-200/50 rounded-md text-[11px]">
              {bookedCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("SOLD")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              statusFilter === "SOLD"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-800 hover:bg-rose-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Sold</span>
            <span className="px-1.5 py-0.2 bg-rose-200/50 rounded-md text-[11px]">
              {soldCount}
            </span>
          </button>
        </div>

        {/* Filter Selectors Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search plot number (e.g. VTK-001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          {/* Sector */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
          >
            <option value="ALL">All Sectors / Blocks</option>
            <option value="Block A">Block A</option>
            <option value="Block B">Block B</option>
            <option value="Block C">Block C</option>
            <option value="Block D">Block D</option>
          </select>

          {/* Facing */}
          <select
            value={facingFilter}
            onChange={(e) => setFacingFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
          >
            <option value="ALL">All Facings</option>
            <option value="East">East Facing</option>
            <option value="North">North Facing</option>
            <option value="Park Facing">Park Facing</option>
            <option value="Corner">Corner Plot</option>
            <option value="West">West Facing</option>
            <option value="South">South Facing</option>
          </select>

          {/* Road Width */}
          <select
            value={roadFilter}
            onChange={(e) => setRoadFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
          >
            <option value="ALL">All Road Widths</option>
            <option value="30 Ft">30 Ft Internal Road</option>
            <option value="40 Ft">40 Ft Wide Avenue</option>
            <option value="60 Ft Main Road">60 Ft Main Sector Road</option>
          </select>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. VISUAL INTERACTIVE MAP VIEW                                  */}
      {/* ============================================================== */}
      {viewMode === "map" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Compass size={18} className="text-amber-500" />
                Vatika Township Visual Master Plan
              </h3>
              <p className="text-xs text-slate-500">
                Click any plot cell to inspect dimensions, pricing, and book directly.
              </p>
            </div>

            {/* Colour Legend */}
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                Available ({availableCount})
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-3 h-3 rounded bg-amber-500" />
                Booked ({bookedCount})
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-3 h-3 rounded bg-rose-500" />
                Sold ({soldCount})
              </span>
            </div>
          </div>

          {/* Map Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pt-2">
            {filtered.map((p) => {
              const isAvail = p.status === "AVAILABLE";
              const isBooked = p.status === "BOOKED" || p.status === "RESERVED";
              const isSold = p.status === "SOLD";

              const borderBgClass = isAvail
                ? "border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-950"
                : isBooked
                ? "border-amber-300 bg-amber-50/70 hover:bg-amber-100/80 text-amber-950"
                : "border-rose-300 bg-rose-50/60 hover:bg-rose-100/70 text-rose-950";

              const badgeBgClass = isAvail
                ? "bg-emerald-500 text-white"
                : isBooked
                ? "bg-amber-500 text-white"
                : "bg-rose-500 text-white";

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlot(p)}
                  className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between shadow-xs hover:shadow-md hover:scale-[1.02] cursor-pointer relative min-h-[120px] ${borderBgClass}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono font-black text-xs tracking-tight">
                      {p.plotNumber}
                    </span>
                    <div className="flex items-center gap-1">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(p);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-amber-700 hover:bg-black/5 transition"
                        title="Edit Plot"
                      >
                        <Edit2 size={11} />
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${badgeBgClass}`}>
                        {p.status.slice(0, 4)}
                      </span>
                    </div>
                  </div>

                  <div className="my-1.5">
                    <div className="text-xs font-bold leading-tight">
                      {p.sizeGaj} <span className="text-[10px] font-normal text-slate-500">Gaj</span>
                    </div>
                    <div className="text-[11px] font-mono font-black text-slate-900 mt-0.5">
                      ₹ {(p.totalPrice / 100000).toFixed(2)} L
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/50 w-full">
                    <span className="truncate max-w-[65px] font-medium">{p.facing || "East"}</span>
                    <span className="font-semibold">{p.roadWidth || "30Ft"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TABLE VIEW                                                   */}
      {/* ============================================================== */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Plot No</th>
                  <th className="py-3 px-4">Project / Sector</th>
                  <th className="py-3 px-4">Size (GAJ)</th>
                  <th className="py-3 px-4">Rate / GAJ</th>
                  <th className="py-3 px-4">Total Price</th>
                  <th className="py-3 px-4">Facing & Road</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm">
                      {p.plotNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{p.projectName}</span>
                      <span className="text-[10px] text-slate-500">{p.sector || "Block A"}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.sizeGaj} Gaj</td>
                    <td className="py-3 px-4 text-slate-600">₹ {p.pricePerGaj?.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      ₹ {p.totalPrice?.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 block">{p.facing || "East Facing"}</span>
                      <span className="text-[10px] text-slate-500">{p.roadWidth || "30 Ft Road"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={p.status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border outline-none cursor-pointer ${
                          p.status === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : p.status === "BOOKED" || p.status === "RESERVED"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : "bg-rose-50 text-rose-800 border-rose-300"
                        }`}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="BOOKED">BOOKED</option>
                        <option value="SOLD">SOLD</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      {p.customer?.name || p.sale?.buyerName ? (
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {p.customer?.name || p.sale?.buyerName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {p.customer?.phone || p.sale?.buyerPhone}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                          title="Edit Plot Details"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setSelectedPlot(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                          title="Inspect Plot Sheet"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDeletePlot(p.id, p.plotNumber)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Plot"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. PLOT DETAILS / INSPECTION DRAWER MODAL                       */}
      {/* ============================================================== */}
      {selectedPlot && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedPlot(null)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${
                  selectedPlot.status === "AVAILABLE"
                    ? "bg-emerald-100 text-emerald-800"
                    : selectedPlot.status === "BOOKED" || selectedPlot.status === "RESERVED"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {selectedPlot.plotNumber.split("-")[0] || "VTK"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900">{selectedPlot.plotNumber}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      selectedPlot.status === "AVAILABLE"
                        ? "bg-emerald-500 text-white"
                        : selectedPlot.status === "BOOKED" || selectedPlot.status === "RESERVED"
                        ? "bg-amber-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {selectedPlot.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {selectedPlot.projectName} • {selectedPlot.location}
                </p>
              </div>
            </div>

            {/* Plot Specification Sheet */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs mb-4">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Plot Size</span>
                <span className="font-bold text-slate-900 text-sm">{selectedPlot.sizeGaj} Gaj</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Rate / Gaj</span>
                <span className="font-bold text-slate-900 text-sm">₹ {selectedPlot.pricePerGaj?.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Price</span>
                <span className="font-black text-emerald-700 text-sm">₹ {selectedPlot.totalPrice?.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Dimensions</span>
                <span className="font-bold text-slate-900">{selectedPlot.dimensions || "30 x 45"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Facing</span>
                <span className="font-bold text-slate-900">{selectedPlot.facing || "East"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold uppercase">Road Width</span>
                <span className="font-bold text-slate-900">{selectedPlot.roadWidth || "30 Ft"}</span>
              </div>
            </div>

            {/* Customer Details if Booked or Sold */}
            {(selectedPlot.customer || selectedPlot.sale?.buyerName) && (
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 mb-4 text-xs">
                <h4 className="font-bold text-blue-950 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-blue-600" />
                  Buyer & Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Buyer Name</span>
                    <span className="font-bold">{selectedPlot.customer?.name || selectedPlot.sale?.buyerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Mobile Number</span>
                    <span className="font-bold font-mono">{selectedPlot.customer?.phone || selectedPlot.sale?.buyerPhone || "-"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(selectedPlot)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Edit2 size={13} />
                  <span>Edit Plot</span>
                </button>
                <button
                  onClick={() => handleStatusChange(selectedPlot.id, "AVAILABLE")}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                >
                  Make Available
                </button>
                <button
                  onClick={() => handleStatusChange(selectedPlot.id, "BOOKED")}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                >
                  Mark Booked
                </button>
              </div>

              {selectedPlot.status === "AVAILABLE" && (
                <Link
                  href={`/admin/bookings?plotId=${selectedPlot.id}`}
                  className="px-4 py-2 rounded-xl bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <CalendarCheck size={14} />
                  <span>Book This Plot</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. ADD SINGLE PLOT MODAL                                       */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">Add Plot to Inventory</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter unique plot number, dimensions, square yards, and rate in Vatika, Jaipur.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSingle} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Plot Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VTK-101"
                    value={singleForm.plotNumber}
                    onChange={(e) => setSingleForm({ ...singleForm, plotNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sector / Block</label>
                  <input
                    type="text"
                    value={singleForm.sector}
                    onChange={(e) => setSingleForm({ ...singleForm, sector: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Size (Square Yards / GAJ) *</label>
                  <input
                    type="number"
                    required
                    value={singleForm.sizeGaj}
                    onChange={(e) => setSingleForm({ ...singleForm, sizeGaj: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rate Per GAJ (₹) *</label>
                  <input
                    type="number"
                    required
                    value={singleForm.pricePerGaj}
                    onChange={(e) => setSingleForm({ ...singleForm, pricePerGaj: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={singleForm.dimensions}
                    onChange={(e) => setSingleForm({ ...singleForm, dimensions: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facing</label>
                  <select
                    value={singleForm.facing}
                    onChange={(e) => setSingleForm({ ...singleForm, facing: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  >
                    <option value="East">East</option>
                    <option value="North">North</option>
                    <option value="Park Facing">Park Facing</option>
                    <option value="Corner">Corner</option>
                    <option value="West">West</option>
                    <option value="South">South</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Road Width</label>
                  <select
                    value={singleForm.roadWidth}
                    onChange={(e) => setSingleForm({ ...singleForm, roadWidth: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  >
                    <option value="30 Ft">30 Ft</option>
                    <option value="40 Ft">40 Ft</option>
                    <option value="60 Ft Main Road">60 Ft Main Road</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 font-medium">
                Total Price Calculated:{" "}
                <strong>
                  ₹{" "}
                  {(
                    (parseFloat(singleForm.sizeGaj) || 0) * (parseFloat(singleForm.pricePerGaj) || 0)
                  ).toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Plot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. BULK GENERATE PLOTS MODAL                                    */}
      {/* ============================================================== */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsBulkModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">Bulk Generate Plots</h3>
            <p className="text-xs text-slate-500 mb-4">
              Instantly create sequential residential plots (e.g. VTK-101 to VTK-120) with uniform rates and dimensions.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleBulkGenerate} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prefix</label>
                  <input
                    type="text"
                    required
                    value={bulkForm.prefix}
                    onChange={(e) => setBulkForm({ ...bulkForm, prefix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start No.</label>
                  <input
                    type="number"
                    required
                    value={bulkForm.startNumber}
                    onChange={(e) => setBulkForm({ ...bulkForm, startNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Count</label>
                  <input
                    type="number"
                    required
                    max="50"
                    value={bulkForm.count}
                    onChange={(e) => setBulkForm({ ...bulkForm, count: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Size (GAJ)</label>
                  <input
                    type="number"
                    required
                    value={bulkForm.sizeGaj}
                    onChange={(e) => setBulkForm({ ...bulkForm, sizeGaj: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rate / GAJ (₹)</label>
                  <input
                    type="number"
                    required
                    value={bulkForm.pricePerGaj}
                    onChange={(e) => setBulkForm({ ...bulkForm, pricePerGaj: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Generating..." : `Generate ${bulkForm.count} Plots`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. EDIT PLOT MODAL                                             */}
      {/* ============================================================== */}
      {isEditModalOpen && editingPlot && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingPlot(null);
              }}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                <Edit2 size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900">
                    Edit Plot: {editForm.plotNumber || editingPlot.plotNumber}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      editForm.status === "AVAILABLE"
                        ? "bg-emerald-500 text-white"
                        : editForm.status === "BOOKED" || editForm.status === "RESERVED"
                        ? "bg-amber-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {editForm.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Update dimensions, pricing, status, project association, or buyer assignment.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Plot Identification & Project */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Identification & Project
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Plot Number *</label>
                    <input
                      type="text"
                      required
                      value={editForm.plotNumber}
                      onChange={(e) => setEditForm({ ...editForm, plotNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 uppercase font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sector / Block</label>
                    <input
                      type="text"
                      value={editForm.sector}
                      onChange={(e) => setEditForm({ ...editForm, sector: e.target.value })}
                      placeholder="e.g. Block A"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Project</label>
                    <select
                      value={editForm.projectId}
                      onChange={(e) => {
                        const proj = projects.find((p) => p.id === e.target.value);
                        setEditForm({
                          ...editForm,
                          projectId: e.target.value,
                          projectName: proj ? proj.name : editForm.projectName,
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                    >
                      <option value="">-- No Project Linked --</option>
                      {projects.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="e.g. Vatika, Jaipur"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Sizing & Pricing */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Dimensions & Financials
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Size (GAJ) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editForm.sizeGaj}
                      onChange={(e) => handleEditSizeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Rate / GAJ (₹) *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editForm.pricePerGaj}
                      onChange={(e) => handleEditPriceChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Price (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={editForm.totalPrice}
                      onChange={(e) => setEditForm({ ...editForm, totalPrice: e.target.value })}
                      className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/50 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-950 font-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Facing</label>
                    <select
                      value={editForm.facing}
                      onChange={(e) => setEditForm({ ...editForm, facing: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                    >
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="Corner">Corner</option>
                      <option value="Park Facing">Park Facing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dimensions</label>
                    <input
                      type="text"
                      placeholder="30 x 45"
                      value={editForm.dimensions}
                      onChange={(e) => setEditForm({ ...editForm, dimensions: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Road Width</label>
                    <select
                      value={editForm.roadWidth}
                      onChange={(e) => setEditForm({ ...editForm, roadWidth: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                    >
                      <option value="30 Ft">30 Ft</option>
                      <option value="40 Ft">40 Ft</option>
                      <option value="60 Ft">60 Ft</option>
                      <option value="80 Ft">80 Ft</option>
                      <option value="100 Ft">100 Ft</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status & Assignment */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Status & Assignment
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Inventory Status *</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setEditForm((prev) => ({
                          ...prev,
                          status: newStatus,
                          saleAmount:
                            newStatus === "SOLD" && (!prev.saleAmount || prev.saleAmount === "0")
                              ? prev.totalPrice
                              : prev.saleAmount,
                        }));
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                    >
                      <option value="AVAILABLE">AVAILABLE (Available for sale)</option>
                      <option value="BOOKED">BOOKED (Advance received)</option>
                      <option value="RESERVED">RESERVED (Hold for customer)</option>
                      <option value="SOLD">SOLD (Full registry / sale)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Associate</label>
                    <select
                      value={editForm.assignedAssociateId}
                      onChange={(e) => setEditForm({ ...editForm, assignedAssociateId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                    >
                      <option value="">-- None (Direct / Open) --</option>
                      {associates.map((assoc) => (
                        <option key={assoc.id} value={assoc.id}>
                          {assoc.name} ({assoc.memberId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Conditional Buyer Details when Sold or Booked */}
                {(editForm.status === "SOLD" || editForm.status === "BOOKED" || editForm.status === "RESERVED" || editForm.buyerName) && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-3">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                      Buyer & Sale Record
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Rajesh Agarwal"
                          value={editForm.buyerName}
                          onChange={(e) => setEditForm({ ...editForm, buyerName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer Phone</label>
                        <input
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={editForm.buyerPhone}
                          onChange={(e) => setEditForm({ ...editForm, buyerPhone: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Sold By Associate</label>
                        <select
                          value={editForm.soldById}
                          onChange={(e) => setEditForm({ ...editForm, soldById: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 bg-white"
                        >
                          <option value="">-- Select Associate --</option>
                          {associates.map((assoc) => (
                            <option key={assoc.id} value={assoc.id}>
                              {assoc.name} ({assoc.memberId})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Sale Amount (₹)</label>
                        <input
                          type="number"
                          value={editForm.saleAmount}
                          onChange={(e) => setEditForm({ ...editForm, saleAmount: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingPlot(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#0d1b2a] hover:bg-slate-800 text-amber-400 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                >
                  <Save size={14} />
                  <span>{loading ? "Saving Changes..." : "Save Plot Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

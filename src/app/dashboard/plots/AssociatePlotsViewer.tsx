"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  Eye,
  X,
  Sparkles,
  Phone,
  Building2,
  ShieldCheck,
  Share2,
  Check,
  Layers,
  LayoutGrid,
  List,
  AlertCircle,
  Briefcase,
} from "lucide-react";

export interface PlotItem {
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
}

interface Props {
  initialPlots: PlotItem[];
  initialProjectFilter?: string;
}

export default function AssociatePlotsViewer({
  initialPlots = [],
  initialProjectFilter = "ALL",
}: Props) {
  const [plots] = useState<PlotItem[]>(initialPlots);
  const [viewMode, setViewMode] = useState<"map" | "table">("map");

  // Filter States
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectFilter);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedFacing, setSelectedFacing] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Inspect Plot Modal
  const [inspectPlot, setInspectPlot] = useState<PlotItem | null>(null);
  const [copiedPlot, setCopiedPlot] = useState(false);

  // Extract unique projects
  const projectsList = useMemo(() => {
    const set = new Set<string>();
    plots.forEach((p) => {
      if (p.projectName && p.projectName.trim()) {
        set.add(p.projectName.trim());
      }
    });
    return Array.from(set);
  }, [plots]);

  // Filtered plots
  const filteredPlots = useMemo(() => {
    return plots
      .filter((p) => {
        // Project
        if (
          selectedProject !== "ALL" &&
          p.projectName?.toLowerCase() !== selectedProject.toLowerCase()
        ) {
          return false;
        }

        // Status
        if (selectedStatus !== "ALL" && p.status !== selectedStatus) {
          return false;
        }

        // Facing
        if (selectedFacing !== "ALL" && p.facing !== selectedFacing) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNo = p.plotNumber.toLowerCase().includes(q);
          const matchSector = p.sector?.toLowerCase().includes(q);
          const matchProject = p.projectName.toLowerCase().includes(q);
          return matchNo || matchSector || matchProject;
        }

        return true;
      })
      .sort((a, b) => {
        // Natural sort by plot number
        const numA = parseInt(a.plotNumber.replace(/\D/g, ""), 10);
        const numB = parseInt(b.plotNumber.replace(/\D/g, ""), 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.plotNumber.localeCompare(b.plotNumber);
      });
  }, [plots, selectedProject, selectedStatus, selectedFacing, searchQuery]);

  // Aggregate counts
  const totalCount = plots.length;
  const availableCount = plots.filter((p) => p.status === "AVAILABLE").length;
  const bookedCount = plots.filter(
    (p) => p.status === "BOOKED" || p.status === "RESERVED"
  ).length;
  const soldCount = plots.filter((p) => p.status === "SOLD").length;

  // Copy plot summary to clipboard
  const handleCopyPlot = (p: PlotItem) => {
    const text = `🏡 *Shree Karni Real Estate - Plot Details*\n📍 Project: ${p.projectName} (${p.location})\n🔢 Plot No: ${p.plotNumber} (${p.sector || "Block A"})\n📐 Size: ${p.sizeGaj} Gaj (${p.dimensions || "Standard"})\n🧭 Facing: ${p.facing || "East"} | Road: ${p.roadWidth || "30 Ft"}\n💰 Rate: ₹${p.pricePerGaj.toLocaleString("en-IN")}/Gaj\n🏷️ Total Price: ₹${p.totalPrice.toLocaleString("en-IN")}\n📌 Status: ${p.status}\n📞 For Booking & Site Visit: Call 8952821872`;
    navigator.clipboard.writeText(text);
    setCopiedPlot(true);
    setTimeout(() => setCopiedPlot(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0a1628] via-[#0f243e] to-[#0a1628] border border-amber-500/30 shadow-2xl text-white p-6 sm:p-8">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="h-2 w-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-500 absolute top-0 left-0" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-400/50 text-amber-300">
                <MapPin size={14} className="text-amber-400" />
                <span>Township Plot Inventory & Layout Map</span>
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-slate-300 text-xs hidden sm:inline">
                Live Inventory Status
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Interactive Plot Map & Inventory
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Check color-coded real-time availability across Shree Karni townships in Vatika, Jaipur. Click any plot to view dimensions, road width, facing, and rate per square yard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm font-bold text-white transition cursor-pointer"
            >
              <Building2 size={16} className="text-amber-400" />
              <span>Township Projects</span>
            </Link>

            <Link
              href="/dashboard/business"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Briefcase size={16} />
              <span>My Sold Plots →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. READ-ONLY COMPLIANCE BADGE */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-xs text-amber-950 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={18} className="text-amber-600 shrink-0" />
          <p>
            <strong className="font-bold">Associate Read-Only Access:</strong> Plot pricing, inventory allocations, and registry statuses are verified and locked by Admin. Associates have live view rights to show inventory to prospective clients.
          </p>
        </div>
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 shrink-0">
          Locked Rates
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 3. METRIC CARDS & COLOR-CODED LEGEND */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Plots */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Total Plots in Masterplan
          </span>
          <p className="text-2xl font-black font-mono text-gray-900 mt-1">
            {totalCount}
          </p>
          <span className="text-[11px] text-gray-400">Total approved inventory</span>
        </div>

        {/* Available Plots (Green) */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-300 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Available for Sale
            </span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-900 mt-1">
            {availableCount}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold">
            🟢 Ready for client booking
          </span>
        </div>

        {/* Booked / Reserved Plots (Yellow/Amber) */}
        <div className="bg-white rounded-2xl p-5 border border-amber-300 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Booked / Under Agreement
            </span>
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
          </div>
          <p className="text-2xl font-black font-mono text-amber-900 mt-1">
            {bookedCount}
          </p>
          <span className="text-[11px] text-amber-700 font-semibold">
            🟡 Advance token received
          </span>
        </div>

        {/* Sold Plots (Red) */}
        <div className="bg-white rounded-2xl p-5 border border-rose-300 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Sold / Registry Done
            </span>
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          </div>
          <p className="text-2xl font-black font-mono text-rose-900 mt-1">
            {soldCount}
          </p>
          <span className="text-[11px] text-rose-700 font-semibold">
            🔴 Registry completed
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. FILTER CONTROLS & VIEW TOGGLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("map")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                viewMode === "map"
                  ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <LayoutGrid size={16} />
              <span>Interactive Visual Map</span>
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                viewMode === "table"
                  ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <List size={16} />
              <span>Inventory Table</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{filteredPlots.length}</strong> of{" "}
            {plots.length} plots in inventory
          </div>
        </div>

        {/* Filter Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plot number, sector..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
            />
          </div>

          {/* Project Filter */}
          <div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-700"
            >
              <option value="ALL">All Township Projects</option>
              {projectsList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-700"
            >
              <option value="ALL">All Plot Statuses</option>
              <option value="AVAILABLE">🟢 Available Only</option>
              <option value="BOOKED">🟡 Booked / Reserved Only</option>
              <option value="SOLD">🔴 Sold Only</option>
            </select>
          </div>

          {/* Facing Filter */}
          <div>
            <select
              value={selectedFacing}
              onChange={(e) => setSelectedFacing(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-700"
            >
              <option value="ALL">All Facings</option>
              <option value="East">East Facing</option>
              <option value="West">West Facing</option>
              <option value="North">North Facing</option>
              <option value="South">South Facing</option>
              <option value="Corner">Corner Plot</option>
              <option value="Park Facing">Park Facing</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5A. INTERACTIVE VISUAL MAP VIEW */}
      {/* ========================================================================= */}
      {viewMode === "map" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Compass size={18} className="text-amber-500" />
                <span>Township Master Layout Grid</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Click any plot box to inspect full dimensions, facing, rate, and customer details.
              </p>
            </div>

            {/* Quick Map Legend */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-3 h-3 rounded bg-emerald-500"></span>
                <span>Available</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-amber-700">
                <span className="w-3 h-3 rounded bg-amber-400"></span>
                <span>Booked</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-rose-700">
                <span className="w-3 h-3 rounded bg-rose-500"></span>
                <span>Sold</span>
              </span>
            </div>
          </div>

          {filteredPlots.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No plots found matching your filter criteria.
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
              {filteredPlots.map((plot) => {
                const isAvail = plot.status === "AVAILABLE";
                const isBooked = plot.status === "BOOKED" || plot.status === "RESERVED";
                const isSold = plot.status === "SOLD";

                const bgClass = isAvail
                  ? "bg-emerald-50 border-emerald-400 text-emerald-950 hover:bg-emerald-100"
                  : isBooked
                  ? "bg-amber-50 border-amber-400 text-amber-950 hover:bg-amber-100"
                  : "bg-rose-50 border-rose-400 text-rose-950 hover:bg-rose-100";

                const badgeBg = isAvail
                  ? "bg-emerald-500 text-white"
                  : isBooked
                  ? "bg-amber-500 text-white"
                  : "bg-rose-500 text-white";

                return (
                  <button
                    key={plot.id}
                    onClick={() => setInspectPlot(plot)}
                    className={`rounded-xl border-2 p-2.5 flex flex-col justify-between text-left transition transform hover:-translate-y-0.5 shadow-xs cursor-pointer ${bgClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black font-mono">
                        {plot.plotNumber}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1 py-0.2 rounded ${badgeBg}`}
                      >
                        {isAvail ? "Avail" : isBooked ? "Booked" : "Sold"}
                      </span>
                    </div>

                    <div className="mt-2">
                      <p className="text-xs font-bold font-mono">
                        {plot.sizeGaj} Gaj
                      </p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        ₹{(plot.totalPrice / 100000).toFixed(1)}L
                      </p>
                    </div>

                    <div className="text-[9px] text-gray-500 mt-1 truncate">
                      {plot.facing || "East"}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5B. SEARCHABLE INVENTORY TABLE VIEW */}
      {/* ========================================================================= */}
      {viewMode === "table" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4">Plot No.</th>
                  <th className="py-3.5 px-4">Project & Location</th>
                  <th className="py-3.5 px-4">Sector / Block</th>
                  <th className="py-3.5 px-4">Size (Gaj)</th>
                  <th className="py-3.5 px-4">Facing & Road</th>
                  <th className="py-3.5 px-4">Rate / Gaj</th>
                  <th className="py-3.5 px-4">Total Price (₹)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlots.map((plot) => {
                  const isAvail = plot.status === "AVAILABLE";
                  const isBooked = plot.status === "BOOKED" || plot.status === "RESERVED";

                  return (
                    <tr
                      key={plot.id}
                      className="hover:bg-amber-50/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {plot.plotNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 text-xs">
                          {plot.projectName}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[150px]">
                          {plot.location}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {plot.sector || "Block A"}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-gray-900">
                        {plot.sizeGaj} Gaj
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-semibold text-gray-800">
                          {plot.facing || "East"}
                        </span>
                        <span className="text-gray-400 text-[11px] block">
                          {plot.roadWidth || "30 Ft Road"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-gray-600">
                        ₹{plot.pricePerGaj.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-gray-900">
                        ₹{plot.totalPrice.toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4">
                        {isAvail ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 size={12} />
                            <span>Available</span>
                          </span>
                        ) : isBooked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock size={12} />
                            <span>Booked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <X size={12} />
                            <span>Sold</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setInspectPlot(plot)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-[#0d1b2a] hover:text-amber-400 text-gray-700 text-xs font-bold transition cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. READ-ONLY PLOT INSPECTION MODAL */}
      {/* ========================================================================= */}
      {inspectPlot && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 border border-amber-400/30">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-[#0a1628] to-[#122846] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  Plot Technical Specifications (Read-Only)
                </span>
                <h3 className="font-extrabold text-base flex items-center gap-2 mt-0.5">
                  <span>Plot No. {inspectPlot.plotNumber}</span>
                  <span className="text-xs font-normal text-slate-300">
                    ({inspectPlot.sector || "Block A"})
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setInspectPlot(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 bg-slate-50/50">
              {/* Status Banner */}
              <div className="p-3.5 rounded-2xl bg-white border border-gray-200 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">
                    Real-Time Availability
                  </span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {inspectPlot.projectName}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    inspectPlot.status === "AVAILABLE"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : inspectPlot.status === "BOOKED" || inspectPlot.status === "RESERVED"
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-rose-100 text-rose-800 border border-rose-300"
                  }`}
                >
                  {inspectPlot.status}
                </span>
              </div>

              {/* Specifications Grid */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Plot Dimensions</span>
                  <p className="font-bold text-gray-900 font-mono">
                    {inspectPlot.dimensions || "30 x 45 Ft"}
                  </p>
                </div>

                <div>
                  <span className="text-gray-400">Plot Area</span>
                  <p className="font-bold text-gray-900 font-mono">
                    {inspectPlot.sizeGaj} Gaj ({(inspectPlot.sizeGaj * 9).toFixed(0)} Sq.Ft)
                  </p>
                </div>

                <div>
                  <span className="text-gray-400">Road Width</span>
                  <p className="font-bold text-gray-900">
                    {inspectPlot.roadWidth || "30 Ft Wide Avenue"}
                  </p>
                </div>

                <div>
                  <span className="text-gray-400">Facing Direction</span>
                  <p className="font-bold text-gray-900">
                    {inspectPlot.facing || "East Facing"}
                  </p>
                </div>

                <div>
                  <span className="text-gray-400">Rate / Gaj</span>
                  <p className="font-bold text-gray-900 font-mono">
                    ₹{inspectPlot.pricePerGaj.toLocaleString("en-IN")}/Gaj
                  </p>
                </div>

                <div>
                  <span className="text-gray-400">Total Plot Value</span>
                  <p className="font-black text-amber-700 text-sm font-mono">
                    ₹{inspectPlot.totalPrice.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Commission Estimation for Associate */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-900">
                    Direct Sales Commission (5%):
                  </span>
                  <p className="text-[11px] text-amber-700">
                    Payable immediately upon customer agreement clearance.
                  </p>
                </div>
                <span className="font-black text-amber-900 font-mono text-sm">
                  ₹{Math.round(inspectPlot.totalPrice * 0.05).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-gray-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopyPlot(inspectPlot)}
                className="flex-1 py-2 px-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedPlot ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    <span>Share on WhatsApp</span>
                  </>
                )}
              </button>

              <a
                href="tel:8952821872"
                className="flex-1 py-2 px-3 rounded-xl bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Phone size={14} />
                <span>Call to Reserve</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

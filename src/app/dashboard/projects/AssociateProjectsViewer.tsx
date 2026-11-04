"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  ExternalLink,
  Phone,
  Eye,
  X,
  Sparkles,
  Download,
  ShieldCheck,
  ChevronRight,
  Share2,
  Check,
} from "lucide-react";

export interface ProjectItem {
  id: string;
  name: string;
  location: string;
  description: string | null;
  status: string;
  totalAcreage: number | null;
  totalPlotsCount: number | null;
  imageUrl: string | null;
  layoutMapUrl: string | null;
  plotsCount: number;
  availablePlots: number;
  bookedPlots: number;
  soldPlots: number;
  totalInventoryValue: number;
  soldSalesValue: number;
}

interface Props {
  initialProjects: ProjectItem[];
}

export default function AssociateProjectsViewer({ initialProjects }: Props) {
  const [projects] = useState<ProjectItem[]>(initialProjects);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedMapProject, setSelectedMapProject] = useState<ProjectItem | null>(null);
  const [copiedProject, setCopiedProject] = useState<string | null>(null);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchLoc = p.location.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        return matchName || matchLoc || matchDesc;
      }
      return true;
    });
  }, [projects, search, statusFilter]);

  // Aggregate stats
  const totalAvailablePlots = useMemo(
    () => projects.reduce((sum, p) => sum + p.availablePlots, 0),
    [projects]
  );
  const totalAllPlots = useMemo(
    () => projects.reduce((sum, p) => sum + p.plotsCount, 0),
    [projects]
  );
  const totalAcreage = useMemo(
    () => projects.reduce((sum, p) => sum + (p.totalAcreage || 0), 0),
    [projects]
  );

  const handleCopyProjectLink = (projectName: string, location: string) => {
    const text = `Shree Karni Real Estate Project: ${projectName} - ${location}. Call 8952821872 for residential plot bookings.`;
    navigator.clipboard.writeText(text);
    setCopiedProject(projectName);
    setTimeout(() => setCopiedProject(null), 2500);
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
                <Building2 size={14} className="text-amber-400" />
                <span>Township Projects Directory</span>
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-slate-300 text-xs hidden sm:inline">
                Location: Vatika, Tonk Road, Jaipur
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Shree Karni Real Estate Projects
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Explore verified residential projects and approved township layouts in Jaipur. Access brochures and plot inventory to present directly to your prospective clients.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/plots"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Compass size={16} />
              <span>Interactive Plot Map →</span>
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
            <strong className="font-bold">Associate Read-Only Access:</strong> Project layouts, pricing, and master approvals are managed by Head Office. Associates have verified view access to show maps and check plot availability for clients.
          </p>
        </div>
        <span className="hidden sm:inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 shrink-0">
          Verified Catalog
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 3. METRIC SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Total Projects
          </span>
          <p className="text-2xl font-black font-mono text-gray-900 mt-1">
            {projects.length}
          </p>
          <span className="text-[11px] text-gray-400">Vatika & Ring Road</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Available Plots to Sell
          </span>
          <p className="text-2xl font-black font-mono text-emerald-900 mt-1">
            {totalAvailablePlots}
          </p>
          <span className="text-[11px] text-emerald-600">Ready for booking</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Total Plots in Layouts
          </span>
          <p className="text-2xl font-black font-mono text-gray-900 mt-1">
            {totalAllPlots}
          </p>
          <span className="text-[11px] text-gray-400">Approved inventory</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Combined Acreage
          </span>
          <p className="text-2xl font-black font-mono text-indigo-900 mt-1">
            {totalAcreage.toFixed(1)} Acres
          </p>
          <span className="text-[11px] text-gray-400">Total township land</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SEARCH & FILTER CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, location..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "ACTIVE", "UPCOMING", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st === "ALL" ? "All Projects" : st}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. PROJECT CARDS GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const availPercent =
            project.plotsCount > 0
              ? Math.round((project.availablePlots / project.plotsCount) * 100)
              : 0;

          return (
            <div
              key={project.id}
              className="bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Visual Cover / Image */}
                <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                  <Image
                    src={project.imageUrl || "/website-bg.png"}
                    alt={project.name}
                    fill
                    className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-md ${
                        project.status === "ACTIVE"
                          ? "bg-emerald-500/90 text-white"
                          : project.status === "UPCOMING"
                          ? "bg-amber-500/90 text-slate-950"
                          : "bg-blue-500/90 text-white"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      <span>{project.status} Township</span>
                    </span>
                  </div>

                  {/* Acreage Badge */}
                  {project.totalAcreage && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-amber-300 border border-white/10">
                      {project.totalAcreage} Acres
                    </div>
                  )}

                  {/* Title overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white tracking-tight drop-shadow-md">
                      {project.name}
                    </h3>
                    <p className="text-xs text-amber-300 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{project.location}</span>
                    </p>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-4">
                  {/* Description */}
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {project.description ||
                      "JDA Approved residential plot township located in Vatika, Jaipur with prime highway connectivity and modern township amenities."}
                  </p>

                  {/* Plot Inventory Breakdown Bar */}
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">
                        Plot Inventory
                      </span>
                      <span className="font-bold text-emerald-700">
                        {project.availablePlots} Available / {project.plotsCount} Total
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                      <div
                        style={{
                          width: `${(project.soldPlots / (project.plotsCount || 1)) * 100}%`,
                        }}
                        className="bg-rose-500 h-full"
                        title="Sold"
                      />
                      <div
                        style={{
                          width: `${(project.bookedPlots / (project.plotsCount || 1)) * 100}%`,
                        }}
                        className="bg-amber-400 h-full"
                        title="Booked"
                      />
                      <div
                        style={{
                          width: `${(project.availablePlots / (project.plotsCount || 1)) * 100}%`,
                        }}
                        className="bg-emerald-500 h-full"
                        title="Available"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{project.availablePlots} Avail</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>{project.bookedPlots} Booked</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>{project.soldPlots} Sold</span>
                      </span>
                    </div>
                  </div>

                  {/* Township Key Features */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-gray-100">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>JDA Approved</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-gray-100">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>60ft Main Roads</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-gray-100">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>Underground Power</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-gray-100">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>Gated Community</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-5 pt-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/plots?project=${encodeURIComponent(project.name)}`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Compass size={14} />
                    <span>View Plot Inventory</span>
                  </Link>

                  <button
                    onClick={() => setSelectedMapProject(project)}
                    className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="View Approved Layout Map"
                  >
                    <Eye size={14} />
                    <span>Layout Map</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                  <button
                    onClick={() =>
                      handleCopyProjectLink(project.name, project.location)
                    }
                    className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 transition cursor-pointer"
                  >
                    {copiedProject === project.name ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={13} />
                        <span>Share with Client</span>
                      </>
                    )}
                  </button>

                  <a
                    href="tel:8952821872"
                    className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 font-semibold"
                  >
                    <Phone size={12} />
                    <span>Call Office: 8952821872</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 6. APPROVED LAYOUT MAP PREVIEW MODAL */}
      {/* ========================================================================= */}
      {selectedMapProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 border border-amber-400/30 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-[#0a1628] to-[#122846] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  Approved Layout Map Plan
                </span>
                <h3 className="font-extrabold text-base flex items-center gap-2 mt-0.5">
                  <span>{selectedMapProject.name}</span>
                  <span className="text-xs font-normal text-slate-300">
                    ({selectedMapProject.location})
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedMapProject(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Layout Map Graphic / Image */}
            <div className="p-6 bg-slate-900 flex-1 overflow-auto flex flex-col items-center justify-center text-center">
              <div className="relative w-full max-w-xl h-80 sm:h-96 rounded-2xl overflow-hidden border border-amber-400/30 shadow-2xl bg-black">
                <Image
                  src={selectedMapProject.layoutMapUrl || selectedMapProject.imageUrl || "/website-bg.png"}
                  alt={`${selectedMapProject.name} Layout Map`}
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-xs text-slate-400 mt-3 max-w-md">
                Official JDA Approved layout map. Shows road alignments, plot dimensions, green belts, and commercial arcade zones.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-100 flex items-center justify-between">
              <Link
                href={`/dashboard/plots?project=${encodeURIComponent(selectedMapProject.name)}`}
                className="px-4 py-2 rounded-xl bg-[#0d1b2a] hover:bg-[#1a3350] text-amber-400 font-bold text-xs transition flex items-center gap-1.5"
              >
                <Compass size={14} />
                <span>Open Interactive Plot Grid →</span>
              </Link>

              <button
                onClick={() => setSelectedMapProject(null)}
                className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

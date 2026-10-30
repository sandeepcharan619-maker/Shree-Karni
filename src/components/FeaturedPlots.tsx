"use client";

import { useState, useEffect, useMemo } from "react";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { MapPin, ArrowRight, ShieldCheck, Check, Search, Filter } from "lucide-react";

export interface PlotData {
  id: string;
  plotNumber: string;
  projectName: string;
  location: string;
  sizeGaj: number;
  pricePerGaj: number;
  totalPrice: number;
  status: string;
}

export default function FeaturedPlots({ initialPlots }: { initialPlots: PlotData[] }) {
  const [plots, setPlots] = useState<PlotData[]>(initialPlots);
  const [selectedProject, setSelectedProject] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("shreekarni_custom_plots_v1");
      if (stored) {
        const localList: PlotData[] = JSON.parse(stored);
        if (Array.isArray(localList) && localList.length > 0) {
          setPlots((prev) => {
            const map = new Map<string, PlotData>();
            prev.forEach((item) => map.set(item.plotNumber.toUpperCase(), item));
            localList.forEach((item) => map.set(item.plotNumber.toUpperCase(), item));
            return Array.from(map.values());
          });
        }
      }
    } catch (e) {}

    const handleAdded = (e: any) => {
      const newPlot = e.detail;
      if (newPlot) {
        setPlots((prev) => [
          newPlot,
          ...prev.filter((p) => p.plotNumber.toUpperCase() !== newPlot.plotNumber.toUpperCase()),
        ]);
      }
    };

    window.addEventListener("skr-plot-added", handleAdded);
    return () => window.removeEventListener("skr-plot-added", handleAdded);
  }, []);

  // Distinct project list
  const projectList = useMemo(() => {
    const set = new Set<string>();
    plots.forEach((p) => {
      if (p.projectName && p.projectName.trim()) {
        set.add(p.projectName.trim());
      }
    });
    return Array.from(set);
  }, [plots]);

  const filtered = plots.filter((plot) => {
    const matchProject =
      selectedProject === "ALL" ||
      plot.projectName.toLowerCase() === selectedProject.toLowerCase();
    const matchStatus =
      selectedStatus === "ALL" || plot.status.toUpperCase() === selectedStatus.toUpperCase();
    const matchSearch =
      plot.plotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.location.toLowerCase().includes(searchTerm.toLowerCase());

    return matchProject && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Project Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedProject("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedProject === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Projects ({plots.length})
          </button>
          {projectList.map((proj) => (
            <button
              key={proj}
              type="button"
              onClick={() => setSelectedProject(proj)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedProject.toLowerCase() === proj.toLowerCase()
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {proj}
            </button>
          ))}
        </div>

        {/* Status Filter & Search */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search plot no, sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>
      </div>

      {/* Grid of Plots */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <p className="font-semibold text-slate-700">No plots match your filters</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the project or status filters.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedProject("ALL");
              setSelectedStatus("ALL");
              setSearchTerm("");
            }}
            className="mt-3 text-xs text-emerald-600 font-bold hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.slice(0, 12).map((plot) => {
            const isSold = plot.status?.toUpperCase() === "SOLD";
            const isReserved = plot.status?.toUpperCase() === "RESERVED";

            return (
              <div
                key={plot.id || plot.plotNumber}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Top Bar */}
                  <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                        {plot.projectName}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
                        Plot #{plot.plotNumber}
                      </h3>
                    </div>
                    <StatusBadge status={plot.status} />
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center text-xs text-slate-600 gap-1.5">
                      <MapPin size={14} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{plot.location}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Size in GAJ
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {plot.sizeGaj} GAJ
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({Math.round(plot.sizeGaj * 9)} Sq. Ft)
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Rate / GAJ
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                          ₹{(plot.pricePerGaj || 0).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium block">
                          Registry Ready
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with Total Price & Action Button */}
                <div className="px-5 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Total Cost
                    </span>
                    <span className="text-lg font-black text-slate-950">
                      ₹{(plot.totalPrice || 0).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {isSold ? (
                    <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                      SOLD OUT
                    </span>
                  ) : (
                    <Link
                      href="#contact"
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-1 shrink-0"
                    >
                      <span>Inquire</span>
                      <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

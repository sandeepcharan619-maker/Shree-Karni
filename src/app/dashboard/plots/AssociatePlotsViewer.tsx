"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, CheckCircle2, X, Info } from "lucide-react";

export interface PlotData {
  id: string;
  plotNumber: string;
  projectName: string;
  location: string;
  sizeGaj: number;
  pricePerGaj: number;
  totalPrice: number;
  status: string; // AVAILABLE, SOLD, RESERVED
  createdAt?: string | Date;
}

const PLOT_STORAGE_KEY = "shreekarni_custom_plots_v1";

// Helper to extract clean display number: "AV-001" -> "1", "SKC-012" -> "12", "5" -> "5"
function getDisplayPlotNumber(plotNumber: string): string {
  const match = plotNumber.match(/\d+$/);
  if (match) {
    const num = parseInt(match[0], 10);
    return isNaN(num) ? plotNumber : String(num);
  }
  return plotNumber;
}

export default function AssociatePlotsViewer({
  initialPlots = [],
}: {
  initialPlots: PlotData[];
}) {
  const [allPlots, setAllPlots] = useState<PlotData[]>(initialPlots);
  const [selectedProject, setSelectedProject] = useState<string>("ashok vatika");
  const [activeProject, setActiveProject] = useState<string>("ashok vatika");
  const [selectedPlot, setSelectedPlot] = useState<PlotData | null>(null);

  // Sync with persistent storage & Admin events
  useEffect(() => {
    const syncPlots = () => {
      try {
        const stored = localStorage.getItem(PLOT_STORAGE_KEY);
        if (stored) {
          const localList: PlotData[] = JSON.parse(stored);
          if (Array.isArray(localList) && localList.length > 0) {
            setAllPlots((prev) => {
              const map = new Map<string, PlotData>();
              prev.forEach((item) =>
                map.set((item.plotNumber || item.id).toUpperCase(), item)
              );
              localList.forEach((item) =>
                map.set((item.plotNumber || item.id).toUpperCase(), item)
              );
              return Array.from(map.values());
            });
          }
        }
      } catch (e) {
        console.warn("Storage sync error:", e);
      }
    };

    syncPlots();

    const handlePlotEvent = () => syncPlots();
    window.addEventListener("skr-plot-added", handlePlotEvent);
    window.addEventListener("skr-plot-updated", handlePlotEvent);
    window.addEventListener("skr-plot-deleted", handlePlotEvent);

    return () => {
      window.removeEventListener("skr-plot-added", handlePlotEvent);
      window.removeEventListener("skr-plot-updated", handlePlotEvent);
      window.removeEventListener("skr-plot-deleted", handlePlotEvent);
    };
  }, []);

  // Unique list of project names
  const projectList = useMemo(() => {
    const set = new Set<string>();
    allPlots.forEach((p) => {
      if (p.projectName && p.projectName.trim()) {
        set.add(p.projectName.trim());
      }
    });

    const list = Array.from(set);
    // Ensure "ashok vatika" is available
    if (!list.some((p) => p.toLowerCase() === "ashok vatika")) {
      list.unshift("ashok vatika");
    }
    return list;
  }, [allPlots]);

  // Filter plots by active project
  const filteredPlots = useMemo(() => {
    if (!activeProject || activeProject === "ALL") {
      return allPlots;
    }
    return allPlots
      .filter(
        (p) =>
          p.projectName &&
          p.projectName.trim().toLowerCase() === activeProject.trim().toLowerCase()
      )
      .sort((a, b) => {
        const numA = parseInt(getDisplayPlotNumber(a.plotNumber), 10);
        const numB = parseInt(getDisplayPlotNumber(b.plotNumber), 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.plotNumber.localeCompare(b.plotNumber);
      });
  }, [allPlots, activeProject]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveProject(selectedProject);
  };

  return (
    <div className="w-full space-y-6">
      {/* Main Container */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-xs p-6 md:p-8">
        {/* Title */}
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 pb-3 border-b border-gray-200">
          Plot Manager
        </h1>

        {/* Section: Available Plots */}
        <div className="pt-4 space-y-4">
          <h2 className="text-base font-semibold text-gray-700">
            Available Plots
          </h2>

          {/* Project Selection Row - Exact layout from user screenshot */}
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1 pb-4"
          >
            <label className="text-sm text-gray-700 whitespace-nowrap min-w-[100px]">
              Select project
            </label>

            <div className="flex items-center gap-3 flex-1 max-w-md">
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setActiveProject(e.target.value);
                }}
                className="w-full px-3.5 py-2 border border-gray-300 rounded text-sm text-gray-800 bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="">Select Project</option>
                {projectList.map((proj) => (
                  <option key={proj} value={proj}>
                    {proj}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="bg-[#059669] hover:bg-[#047857] active:bg-[#065f46] text-white font-medium px-6 py-2 rounded text-sm transition-colors shadow-xs cursor-pointer shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Plots Grid - 5 columns on desktop matching user screenshot */}
          {filteredPlots.length === 0 ? (
            <div className="mt-6 p-10 text-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
              <p className="text-sm text-gray-500">
                {activeProject
                  ? `No plots found for project "${activeProject}". Admin can add plots in Admin Dashboard.`
                  : "Please select a project and click Search to view available plots."}
              </p>
            </div>
          ) : (
            <div className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-4">
                {filteredPlots.map((plot) => {
                  const displayNum = getDisplayPlotNumber(plot.plotNumber);
                  const isSold = plot.status?.toUpperCase() === "SOLD";
                  const isReserved = plot.status?.toUpperCase() === "RESERVED";

                  return (
                    <div
                      key={plot.id}
                      onClick={() => setSelectedPlot(plot)}
                      title={`Click to view Plot ${displayNum} details`}
                      className={`min-h-[90px] md:min-h-[105px] rounded-xs flex items-center justify-center p-3 select-none transition-transform hover:scale-[1.02] cursor-pointer shadow-2xs ${
                        isSold
                          ? "bg-[#ff0000] text-white"
                          : isReserved
                          ? "bg-[#fef9c3] text-amber-900 border border-amber-300"
                          : "bg-[#faebd7] text-[#262626] border border-[#f1ded0]"
                      }`}
                      style={{
                        fontFamily: "Georgia, Cambria, 'Times New Roman', serif",
                      }}
                    >
                      <span
                        className={`text-center text-sm md:text-base italic tracking-wide ${
                          isSold ? "font-bold text-white drop-shadow-2xs" : "font-medium"
                        }`}
                      >
                        {displayNum} . {isSold ? "SOLD OUT" : isReserved ? "Reserved" : "Available"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status Legend & Info */}
              <div className="mt-8 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-xs bg-[#faebd7] border border-[#f1ded0] inline-block" />
                    <span className="font-medium text-gray-700">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-xs bg-[#ff0000] inline-block" />
                    <span className="font-medium text-gray-700">SOLD OUT</span>
                  </div>
                  {filteredPlots.some((p) => p.status === "RESERVED") && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-xs bg-[#fef9c3] border border-amber-300 inline-block" />
                      <span className="font-medium text-gray-700">Reserved</span>
                    </div>
                  )}
                </div>

                <p className="italic">
                  * Plots & projects are managed exclusively by Administration.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plot Details Modal (Read-Only for Associates) */}
      {selectedPlot && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedPlot(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPlot(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition"
              title="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                  selectedPlot.status === "SOLD"
                    ? "bg-red-600 text-white"
                    : "bg-[#faebd7] text-[#262626] border border-[#f1ded0]"
                }`}
                style={{ fontFamily: "Georgia, serif" }}
              >
                {getDisplayPlotNumber(selectedPlot.plotNumber)}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Plot {getDisplayPlotNumber(selectedPlot.plotNumber)} ({selectedPlot.plotNumber})
                </h3>
                <p className="text-xs text-gray-500 capitalize">
                  Project: {selectedPlot.projectName}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Status</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    selectedPlot.status === "SOLD"
                      ? "bg-red-100 text-red-800"
                      : selectedPlot.status === "RESERVED"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {selectedPlot.status === "SOLD" ? "SOLD OUT" : selectedPlot.status}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Location</span>
                <span className="font-semibold text-gray-800">{selectedPlot.location}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Plot Size</span>
                <span className="font-bold text-gray-900">{selectedPlot.sizeGaj} GAJ</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Rate per GAJ</span>
                <span className="font-semibold text-gray-800">
                  ₹{selectedPlot.pricePerGaj?.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Total Price</span>
                <span className="font-bold text-emerald-700 text-sm">
                  ₹{selectedPlot.totalPrice?.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
              <span>Shree Karni Real Estate</span>
              <button
                type="button"
                onClick={() => setSelectedPlot(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition cursor-pointer"
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

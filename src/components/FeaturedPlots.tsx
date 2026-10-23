"use client";

import { useState, useEffect } from "react";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

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
            return Array.from(map.values()).slice(0, 9);
          });
        }
      }
    } catch (e) {}

    const handleAdded = (e: any) => {
      const newPlot = e.detail;
      if (newPlot) {
        setPlots((prev) => [newPlot, ...prev.filter((p) => p.plotNumber.toUpperCase() !== newPlot.plotNumber.toUpperCase())].slice(0, 9));
      }
    };

    window.addEventListener("skr-plot-added", handleAdded);
    return () => window.removeEventListener("skr-plot-added", handleAdded);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plots.map((plot) => (
        <div
          key={plot.id || plot.plotNumber}
          className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <div>
            {/* Card Header Tag */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                  {plot.projectName}
                </span>
                <h3 className="text-lg font-bold">{plot.plotNumber}</h3>
              </div>
              <StatusBadge status={plot.status} />
            </div>

            {/* Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-center text-sm text-gray-600 gap-1.5">
                <MapPin size={16} className="text-yellow-600 shrink-0" />
                <span className="truncate">{plot.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-sm">
                <div>
                  <span className="text-xs text-gray-500 block">Plot Size</span>
                  <span className="font-semibold text-gray-800">{plot.sizeGaj} GAJ</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Rate / GAJ</span>
                  <span className="font-semibold text-gray-800">
                    ₹{plot.pricePerGaj.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Price & Action */}
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-semibold block">Total Price</span>
              <span className="text-lg font-bold text-slate-900">
                ₹{plot.totalPrice.toLocaleString("en-IN")}
              </span>
            </div>
            <Link
              href="#contact"
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-semibold px-4 py-2 rounded-lg text-xs transition"
            >
              Inquire Now
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

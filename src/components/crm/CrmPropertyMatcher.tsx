"use client";

import { useState, useEffect } from "react";
import {
  Compass,
  Search,
  MessageSquare,
  Building2,
  CheckCircle2,
  IndianRupee,
  Share2,
  BookmarkCheck,
  Sparkles,
} from "lucide-react";

export interface PlotMatchItem {
  id: string;
  plotNumber: string;
  projectName: string;
  location: string;
  sizeGaj: number;
  pricePerGaj: number;
  totalPrice: number;
  status: string;
}

export default function CrmPropertyMatcher({
  availablePlots = [],
  leads = [],
  selectedLead = null,
}: {
  availablePlots: PlotMatchItem[];
  leads: any[];
  selectedLead?: any | null;
}) {
  const [chosenLeadId, setChosenLeadId] = useState<string>(selectedLead?.id || "");
  const [buyerName, setBuyerName] = useState(selectedLead?.name || "");
  const [buyerPhone, setBuyerPhone] = useState(selectedLead?.phone || "");
  const [targetGaj, setTargetGaj] = useState<number>(selectedLead?.preferredSizeGaj || 150);
  const [maxBudget, setMaxBudget] = useState<string>(selectedLead?.budget || "ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (chosenLeadId) {
      const lead = leads.find((l) => l.id === chosenLeadId);
      if (lead) {
        setBuyerName(lead.name);
        setBuyerPhone(lead.phone);
        if (lead.preferredSizeGaj) setTargetGaj(lead.preferredSizeGaj);
        if (lead.budget) setMaxBudget(lead.budget);
      }
    }
  }, [chosenLeadId, leads]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Filter plots matching criteria
  const matchedPlots = availablePlots.filter((plot) => {
    // Size match (+- 50 GAJ tolerance)
    const matchSize = targetGaj ? Math.abs(plot.sizeGaj - targetGaj) <= 60 : true;

    // Location match
    const matchLoc = locationFilter === "ALL" || plot.location.toLowerCase().includes(locationFilter.toLowerCase());

    return matchSize && matchLoc;
  });

  const getWhatsAppProposal = (plot: PlotMatchItem) => {
    const text = encodeURIComponent(
      `*Shree Karni Real Estate — Property Match Proposal*\n\n` +
      `Namaste ${buyerName || "Sir/Ma'am"},\n` +
      `We found a verified plot matching your requirement in *${plot.projectName}*:\n\n` +
      `📌 *Plot Number:* ${plot.plotNumber}\n` +
      `📍 *Location:* ${plot.location}\n` +
      `📐 *Size:* ${plot.sizeGaj} GAJ\n` +
      `💰 *Rate:* ₹${plot.pricePerGaj.toLocaleString()}/GAJ\n` +
      `🏷️ *Total Price:* ₹${plot.totalPrice.toLocaleString()}\n` +
      `✅ *Title:* 100% Legally Verified & Immediate Registry\n\n` +
      `Would you like to schedule a free site visit to inspect this plot this week?`
    );
    const cleanPhone = buyerPhone ? buyerPhone.replace(/[^0-9]/g, "") : "";
    return cleanPhone ? `https://wa.me/91${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  return (
    <div className="space-y-5">
      {/* Toast Alert */}
      {toast && (
        <div className="p-3 bg-emerald-600 text-white rounded-lg text-sm flex items-center gap-2 font-medium shadow-md">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Control Box */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Compass size={20} className="text-amber-500" />
            <span>Smart Property &amp; Inventory Matcher</span>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              AI Matching
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Select a buyer inquiry to automatically match live plot inventory in Jaipur and Jodhpur
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Select Lead */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Select Buyer / Lead
            </label>
            <select
              value={chosenLeadId}
              onChange={(e) => setChosenLeadId(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Manual Criteria --</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.phone}) - {l.preferredSizeGaj || 150} GAJ
                </option>
              ))}
            </select>
          </div>

          {/* Preferred Size */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Preferred Size (GAJ)
            </label>
            <input
              type="number"
              value={targetGaj}
              onChange={(e) => setTargetGaj(parseFloat(e.target.value) || 0)}
              className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
              placeholder="e.g. 150 GAJ"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Target Township / City
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Townships</option>
              <option value="Jaipur">Jaipur (Ajmer Road / Ring Road)</option>
              <option value="Jodhpur">Jodhpur (Sector / Airport Area)</option>
            </select>
          </div>

          {/* Buyer Phone for WhatsApp proposal */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
              Buyer WhatsApp Number
            </label>
            <input
              type="tel"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              placeholder="e.g. 9829012345"
              className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Matched Inventory Results */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-500" />
            <span>Matched Available Inventory ({matchedPlots.length} plots found)</span>
          </h3>
          <span className="text-xs text-gray-500">
            Matching ~{targetGaj} GAJ tolerance range
          </span>
        </div>

        {matchedPlots.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            <p className="font-bold text-gray-700">No available plots found for this size criteria</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting the target GAJ size or location filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matchedPlots.map((plot) => (
              <div
                key={plot.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {plot.plotNumber}
                      </span>
                      <h4 className="font-bold text-gray-900 mt-1 text-sm">{plot.projectName}</h4>
                      <p className="text-xs text-gray-500">{plot.location}</p>
                    </div>
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                      Available
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Plot Size</span>
                      <span className="font-bold text-gray-800 text-sm">{plot.sizeGaj} GAJ</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Rate / GAJ</span>
                      <span className="font-bold text-gray-800 text-sm">₹{plot.pricePerGaj.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-2 bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600">Total Price:</span>
                    <span className="text-sm font-bold text-emerald-700">₹{plot.totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                  <a
                    href={getWhatsAppProposal(plot)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-xs"
                  >
                    <MessageSquare size={14} />
                    <span>Send on WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

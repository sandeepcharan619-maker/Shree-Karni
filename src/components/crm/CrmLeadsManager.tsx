"use client";

import { useState } from "react";
import {
  Search,
  Phone,
  MessageSquare,
  Calendar,
  Building2,
  Trash2,
  Sparkles,
  Kanban,
  ListFilter,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Clock,
  UserCheck,
  Plus,
} from "lucide-react";
import CrmLeadModal from "./CrmLeadModal";
import CrmSiteVisitModal from "./CrmSiteVisitModal";

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  status: string;
  source?: string | null;
  budget?: string | null;
  preferredSizeGaj?: number | null;
  preferredLocation?: string | null;
  plotInterest?: string | null;
  notes?: string | null;
  followUpDate?: string | Date | null;
  associateId?: string | null;
  associate?: {
    id: string;
    name: string;
    memberId: string;
    phone?: string | null;
  } | null;
  createdAt: string | Date;
}

const STAGES = [
  { key: "NEW", label: "New Leads", color: "bg-blue-500", light: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "CONTACTED", label: "Contacted", color: "bg-amber-500", light: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "SITE_VISIT_SCHEDULED", label: "Visit Scheduled", color: "bg-purple-500", light: "bg-purple-50 text-purple-700 border-purple-200" },
  { key: "VISITED", label: "Visit Done", color: "bg-indigo-500", light: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { key: "NEGOTIATION", label: "Negotiation", color: "bg-orange-500", light: "bg-orange-50 text-orange-700 border-orange-200" },
  { key: "WON", label: "Won / Booked", color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "LOST", label: "Lost", color: "bg-gray-400", light: "bg-gray-50 text-gray-600 border-gray-200" },
];

export default function CrmLeadsManager({
  initialLeads = [],
  associates = [],
  onOpenMatcher,
}: {
  initialLeads: LeadItem[];
  associates: Array<{ id: string; name: string; memberId: string }>;
  onOpenMatcher?: (lead: LeadItem) => void;
}) {
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [associateFilter, setAssociateFilter] = useState("ALL");
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [siteVisitLead, setSiteVisitLead] = useState<LeadItem | null>(null);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleStageChange = async (leadId: string, newStage: string) => {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStage } : l)));
    try {
      const res = await fetch("/api/admin/crm/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStage }),
      });
      if (!res.ok) throw new Error("Failed to update stage");
      showToast("Lead stage updated successfully!");
    } catch {
      showToast("Error updating stage", "error");
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!window.confirm(`Delete inquiry for "${name}"?`)) return;
    setLeads((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/admin/crm/leads?id=${id}`, { method: "DELETE" });
      showToast("Lead deleted successfully.");
    } catch {
      showToast("Error deleting lead", "error");
    }
  };

  const filtered = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
      (l.plotInterest && l.plotInterest.toLowerCase().includes(search.toLowerCase()));

    const matchesStage = stageFilter === "ALL" || l.status === stageFilter;
    const matchesSource = sourceFilter === "ALL" || l.source === sourceFilter;
    const matchesAssociate =
      associateFilter === "ALL" ||
      (associateFilter === "UNASSIGNED" ? !l.associateId : l.associateId === associateFilter);

    return matchesSearch && matchesStage && matchesSource && matchesAssociate;
  });

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-3 rounded-lg text-sm flex items-center justify-between font-medium animate-in fade-in ${
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-red-600 text-white shadow-md"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>Enquiries &amp; Leads Pipeline</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
              {filtered.length} leads
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Capture, follow up, and convert potential buyers into plot bookings
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                viewMode === "kanban"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Kanban size={14} />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                viewMode === "table"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <ListFilter size={14} />
              <span>List View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddLeadOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Add Inquiry</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads by name, phone, plot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
          >
            <option value="ALL">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
          >
            <option value="ALL">All Sources</option>
            <option value="Website">Website</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Referral">Referral</option>
            <option value="99acres">99acres</option>
            <option value="MagicBricks">MagicBricks</option>
          </select>

          <select
            value={associateFilter}
            onChange={(e) => setAssociateFilter(e.target.value)}
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
          >
            <option value="ALL">All Associates</option>
            <option value="UNASSIGNED">Unassigned (Head Office)</option>
            {associates.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.memberId})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto pb-4 items-start">
          {STAGES.map((stage) => {
            const stageLeads = filtered.filter((l) => l.status === stage.key);
            return (
              <div key={stage.key} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col min-h-[480px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                    <span className="font-bold text-xs text-slate-800">{stage.label}</span>
                  </div>
                  <span className="text-[11px] font-bold bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {stageLeads.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-gray-400 border border-dashed border-gray-200 rounded-lg">
                      No leads
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
                      const waText = encodeURIComponent(
                        `Namaste ${lead.name} ji, this is from Shree Karni Real Estate regarding your inquiry for plots in Jaipur / Jodhpur.`
                      );
                      const waLink = `https://wa.me/91${cleanPhone}?text=${waText}`;

                      return (
                        <div
                          key={lead.id}
                          className="bg-white p-3 rounded-lg border border-gray-200 shadow-2xs hover:shadow-xs transition space-y-2 group"
                        >
                          {/* Name & Budget */}
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <p className="font-bold text-xs text-gray-900 leading-tight">{lead.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{lead.phone}</p>
                            </div>
                            {lead.budget && (
                              <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-semibold border border-amber-200 shrink-0">
                                {lead.budget}
                              </span>
                            )}
                          </div>

                          {/* Requirements */}
                          {(lead.preferredSizeGaj || lead.preferredLocation || lead.plotInterest) && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded space-y-0.5">
                              {lead.preferredSizeGaj && (
                                <p className="font-medium text-[10px]">
                                  🎯 Req: <span className="font-bold text-blue-700">{lead.preferredSizeGaj} GAJ</span>
                                  {lead.preferredLocation ? ` • ${lead.preferredLocation}` : ""}
                                </p>
                              )}
                              {lead.plotInterest && (
                                <p className="text-[10px] text-gray-500 truncate">Plot: {lead.plotInterest}</p>
                              )}
                            </div>
                          )}

                          {/* Assigned Associate / Source */}
                          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                            <span className="font-medium truncate max-w-[100px]">
                              {lead.associate ? `👤 ${lead.associate.name}` : "🏢 Head Office"}
                            </span>
                            <span className="text-gray-400 font-semibold">{lead.source || "Website"}</span>
                          </div>

                          {/* Quick Action Trigger Buttons */}
                          <div className="flex items-center justify-between gap-1 pt-1">
                            <div className="flex items-center gap-1">
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat on WhatsApp"
                                className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                <MessageSquare size={13} />
                              </a>
                              <a
                                href={`tel:${lead.phone}`}
                                title="Call Buyer"
                                className="p-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                              >
                                <Phone size={13} />
                              </a>
                              <button
                                type="button"
                                onClick={() => setSiteVisitLead(lead)}
                                title="Schedule Site Visit"
                                className="p-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
                              >
                                <Calendar size={13} />
                              </button>
                              {onOpenMatcher && (
                                <button
                                  type="button"
                                  onClick={() => onOpenMatcher(lead)}
                                  title="Match with Available Plots"
                                  className="p-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                                >
                                  <Sparkles size={13} />
                                </button>
                              )}
                            </div>

                            {/* Move stage dropdown */}
                            <select
                              value={lead.status}
                              onChange={(e) => handleStageChange(lead.id, e.target.value)}
                              className="text-[10px] font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 outline-none cursor-pointer"
                            >
                              {STAGES.map((s) => (
                                <option key={s.key} value={s.key}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-600 uppercase">
                  <th className="px-4 py-3 text-left">Buyer Name</th>
                  <th className="px-4 py-3 text-left">Phone &amp; Email</th>
                  <th className="px-4 py-3 text-left">Requirement</th>
                  <th className="px-4 py-3 text-left">Budget</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Assigned Agent</th>
                  <th className="px-4 py-3 text-left">Stage</th>
                  <th className="px-4 py-3 text-right">Quick CRM Triggers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">
                      No leads match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => {
                    const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
                    const waText = encodeURIComponent(
                      `Namaste ${lead.name} ji, this is from Shree Karni Real Estate regarding your inquiry for plots in Jaipur / Jodhpur.`
                    );
                    const waLink = `https://wa.me/91${cleanPhone}?text=${waText}`;

                    return (
                      <tr key={lead.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-sm">
                          <p className="font-bold text-gray-900">{lead.name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <p className="font-mono text-gray-800">{lead.phone}</p>
                          <p className="text-xs text-gray-400">{lead.email || "-"}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {lead.preferredSizeGaj ? (
                            <span className="font-semibold text-blue-700">{lead.preferredSizeGaj} GAJ</span>
                          ) : (
                            <span className="text-gray-400">Any size</span>
                          )}
                          <div className="text-xs text-gray-500">{lead.preferredLocation || "Jaipur"}</div>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-amber-700">
                          {lead.budget || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">
                            {lead.source || "Website"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {lead.associate ? (
                            <div>
                              <p className="font-semibold text-gray-900">{lead.associate.name}</p>
                              <p className="text-xs text-blue-600">{lead.associate.memberId}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Head Office Pool</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStageChange(lead.id, e.target.value)}
                            className="text-xs font-semibold border border-gray-300 rounded px-2 py-1 bg-white outline-none cursor-pointer"
                          >
                            {STAGES.map((s) => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              <MessageSquare size={14} />
                            </a>
                            <a
                              href={`tel:${lead.phone}`}
                              title="Call"
                              className="p-1.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                            >
                              <Phone size={14} />
                            </a>
                            <button
                              type="button"
                              onClick={() => setSiteVisitLead(lead)}
                              title="Schedule Site Visit"
                              className="p-1.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition cursor-pointer"
                            >
                              <Calendar size={14} />
                            </button>
                            {onOpenMatcher && (
                              <button
                                type="button"
                                onClick={() => onOpenMatcher(lead)}
                                title="Match with Plot Inventory"
                                className="p-1.5 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                              >
                                <Sparkles size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteLead(lead.id, lead.name)}
                              title="Delete Lead"
                              className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      <CrmLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        associates={associates}
        onSuccess={(newLead) => {
          setLeads((prev) => [newLead, ...prev]);
          showToast(`Inquiry for ${newLead.name} logged successfully!`);
        }}
      />

      {/* Schedule Site Visit Modal from Lead */}
      {siteVisitLead && (
        <CrmSiteVisitModal
          isOpen={siteVisitLead !== null}
          onClose={() => setSiteVisitLead(null)}
          associates={associates}
          initialData={{
            visitorName: siteVisitLead.name,
            phone: siteVisitLead.phone,
            plotInterest: siteVisitLead.plotInterest || `${siteVisitLead.preferredSizeGaj || 150} GAJ (${siteVisitLead.preferredLocation || "Jaipur"})`,
          }}
          onSuccess={(visit) => {
            handleStageChange(siteVisitLead.id, "SITE_VISIT_SCHEDULED");
            showToast(`Site visit for ${visit.visitorName} scheduled!`);
          }}
        />
      )}
    </div>
  );
}

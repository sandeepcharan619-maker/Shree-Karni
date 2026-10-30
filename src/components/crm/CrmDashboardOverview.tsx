"use client";

import {
  Users,
  Car,
  TrendingUp,
  Building2,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Compass,
} from "lucide-react";
import Link from "next/link";
import { LeadItem } from "./CrmLeadsManager";
import { SiteVisitItem } from "./CrmSiteVisitsManager";

export default function CrmDashboardOverview({
  leads = [],
  visits = [],
  totalPlots = 0,
  availablePlots = 0,
  associates = [],
  onNavigateTab,
}: {
  leads: LeadItem[];
  visits: SiteVisitItem[];
  totalPlots: number;
  availablePlots: number;
  associates: Array<{ id: string; name: string; memberId: string }>;
  onNavigateTab?: (tab: string) => void;
}) {
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "NEW").length;
  const inProgressLeads = leads.filter(
    (l) => l.status === "CONTACTED" || l.status === "SITE_VISIT_SCHEDULED" || l.status === "VISITED" || l.status === "NEGOTIATION"
  ).length;
  const wonLeads = leads.filter((l) => l.status === "WON").length;
  const scheduledVisits = visits.filter((v) => v.status === "SCHEDULED" || v.status === "IN_TRANSIT").length;
  const completedVisits = visits.filter((v) => v.status === "COMPLETED").length;

  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0.0";

  // Leads with follow up due today or no follow up
  const todayStr = new Date().toISOString().split("T")[0];
  const dueFollowUps = leads.filter((l) => {
    if (!l.followUpDate) return false;
    const dStr = new Date(l.followUpDate).toISOString().split("T")[0];
    return dStr <= todayStr && l.status !== "WON" && l.status !== "LOST";
  });

  // Source distribution
  const sourceCounts: Record<string, number> = {};
  leads.forEach((l) => {
    const s = l.source || "Website";
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* 4 Core CRM Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Inquiries */}
        <div
          onClick={() => onNavigateTab && onNavigateTab("leads")}
          className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[120px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Active Inquiries</span>
            <Users size={20} className="text-blue-200" />
          </div>
          <div>
            <p className="text-3xl font-extrabold">{totalLeads}</p>
            <p className="text-xs text-blue-100 mt-1 flex items-center gap-1">
              <span>{newLeads} new leads</span> • <span>{inProgressLeads} in pipeline</span>
            </p>
          </div>
        </div>

        {/* Site Visits */}
        <div
          onClick={() => onNavigateTab && onNavigateTab("visits")}
          className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[120px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Site Visits</span>
            <Car size={20} className="text-emerald-200" />
          </div>
          <div>
            <p className="text-3xl font-extrabold">{visits.length}</p>
            <p className="text-xs text-emerald-100 mt-1 flex items-center gap-1">
              <span>{scheduledVisits} scheduled</span> • <span>{completedVisits} completed</span>
            </p>
          </div>
        </div>

        {/* Available Inventory */}
        <div
          onClick={() => onNavigateTab && onNavigateTab("matching")}
          className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl p-5 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[120px]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-100">Available Plots</span>
            <Building2 size={20} className="text-purple-200" />
          </div>
          <div>
            <p className="text-3xl font-extrabold">{availablePlots}</p>
            <p className="text-xs text-purple-100 mt-1">
              out of {totalPlots} total township plots
            </p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-5 shadow-xs flex flex-col justify-between min-h-[120px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-100">Lead Conversion</span>
            <TrendingUp size={20} className="text-amber-200" />
          </div>
          <div>
            <p className="text-3xl font-extrabold">{conversionRate}%</p>
            <p className="text-xs text-amber-100 mt-1">
              {wonLeads} booked buyers converted
            </p>
          </div>
        </div>
      </div>

      {/* Action Center & Follow-Up Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Today's Follow-up Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <span>Follow-Ups Due Today</span>
              </h3>
              <span className="text-xs font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                {dueFollowUps.length} pending
              </span>
            </div>

            {dueFollowUps.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
                <p className="font-semibold text-gray-700">All follow-ups up to date!</p>
                <p className="mt-0.5">No overdue calls or client reminders today.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {dueFollowUps.map((lead) => {
                  const cleanPhone = lead.phone.replace(/[^0-9]/g, "");
                  const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                    `Namaste ${lead.name} ji, following up regarding your plot requirement with Shree Karni Real Estate.`
                  )}`;

                  return (
                    <div
                      key={lead.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">{lead.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {lead.budget || "Budget not set"} • {lead.preferredLocation || "Jaipur"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          <MessageSquare size={13} />
                        </a>
                        <a
                          href={`tel:${lead.phone}`}
                          className="p-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                          <Phone size={13} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab("leads")}
            className="w-full mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 pt-2 border-t border-gray-100 cursor-pointer"
          >
            <span>View All Enquiries</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Visual Lead Pipeline Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              <span>Real Estate Sales Funnel</span>
            </h3>
            <span className="text-xs text-gray-400 font-semibold">Stage Progression</span>
          </div>

          <div className="space-y-3">
            {[
              { label: "1. New Leads Received", key: "NEW", color: "bg-blue-500", count: leads.filter((l) => l.status === "NEW").length },
              { label: "2. Contacted & Pre-Qualified", key: "CONTACTED", color: "bg-amber-500", count: leads.filter((l) => l.status === "CONTACTED").length },
              { label: "3. Site Visit Scheduled", key: "SITE_VISIT_SCHEDULED", color: "bg-purple-500", count: leads.filter((l) => l.status === "SITE_VISIT_SCHEDULED").length },
              { label: "4. Site Visit Completed", key: "VISITED", color: "bg-indigo-500", count: leads.filter((l) => l.status === "VISITED").length },
              { label: "5. Negotiation / Token", key: "NEGOTIATION", color: "bg-orange-500", count: leads.filter((l) => l.status === "NEGOTIATION").length },
              { label: "6. Converted & Booked", key: "WON", color: "bg-emerald-500", count: leads.filter((l) => l.status === "WON").length },
            ].map((step) => {
              const pct = totalLeads > 0 ? Math.round((step.count / totalLeads) * 100) : 0;
              return (
                <div key={step.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-700">{step.label}</span>
                    <span className="font-bold text-gray-900">
                      {step.count} leads ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${step.color} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, step.count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inquiry Sources & Top Associates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Source ROI */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
          <h3 className="font-bold text-sm text-gray-900 mb-3 pb-2 border-b border-gray-100">
            Inquiry Source Breakdown
          </h3>
          <div className="space-y-2.5">
            {Object.keys(sourceCounts).length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No inquiry source data recorded yet.</p>
            ) : (
              Object.entries(sourceCounts).map(([src, count]) => {
                const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div key={src} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">{src}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{count} inquiries</span>
                      <span className="text-gray-400 font-semibold w-10 text-right">({pct}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real Estate Quick Actions Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-[#0a1628] text-white rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
              Real Estate Sales Engine
            </span>
            <h3 className="font-bold text-lg text-white mt-1">Smart Client Workflow</h3>
            <p className="text-xs text-gray-300 mt-1 leading-relaxed">
              Match prospective buyers with available plots, coordinate site inspection vehicles, and trigger 1-click WhatsApp proposals directly to clients.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-4">
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab("matching")}
              className="flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold py-2 rounded-lg text-xs transition cursor-pointer"
            >
              <Compass size={14} />
              <span>Match Properties</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab && onNavigateTab("visits")}
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition cursor-pointer"
            >
              <Car size={14} />
              <span>Schedule Tour</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

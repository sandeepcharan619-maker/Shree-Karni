"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Car,
  Compass,
  MapPin,
  Banknote,
  Plus,
  Building2,
  TrendingUp,
} from "lucide-react";
import CrmDashboardOverview from "./CrmDashboardOverview";
import CrmLeadsManager, { LeadItem } from "./CrmLeadsManager";
import CrmSiteVisitsManager, { SiteVisitItem } from "./CrmSiteVisitsManager";
import CrmPropertyMatcher, { PlotMatchItem } from "./CrmPropertyMatcher";
import AssociatesManager, { AssociateItem } from "@/components/AssociatesManager";
import PlotsManager, { PlotItem } from "@/components/PlotsManager";
import RecentSalesActivity from "@/app/admin/RecentSalesActivity";
import CrmLeadModal from "./CrmLeadModal";
import CrmSiteVisitModal from "./CrmSiteVisitModal";

export default function AdminCrmSuite({
  initialTab = "crm_overview",
  initialLeads = [],
  initialVisits = [],
  initialPlots = [],
  initialAssociates = [],
  initialRecentSales = [],
  totalAssociatesCount = 0,
  availablePlotsCount = 0,
}: {
  initialTab?: string;
  initialLeads: LeadItem[];
  initialVisits: SiteVisitItem[];
  initialPlots: PlotItem[];
  initialAssociates: AssociateItem[];
  initialRecentSales: any[];
  totalAssociatesCount: number;
  availablePlotsCount: number;
}) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [visits, setVisits] = useState<SiteVisitItem[]>(initialVisits);
  const [matchedLead, setMatchedLead] = useState<LeadItem | null>(null);

  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState(false);

  const sponsorOptions = initialAssociates.map((a) => ({
    id: a.id,
    name: a.name,
    memberId: a.memberId,
  }));

  const handleOpenMatcherForLead = (lead: LeadItem) => {
    setMatchedLead(lead);
    setActiveTab("matching");
  };

  const navTabs = [
    { id: "crm_overview", label: "CRM Overview", icon: LayoutDashboard },
    { id: "leads", label: "Leads & Enquiries", icon: Users, badge: leads.length },
    { id: "visits", label: "Site Visits", icon: Car, badge: visits.length },
    { id: "matching", label: "Property Matcher", icon: Compass },
    { id: "associates", label: "Associates Network", icon: Users, badge: totalAssociatesCount },
    { id: "plots", label: "Plots Inventory", icon: MapPin, badge: availablePlotsCount },
    { id: "sales", label: "Sales Activity", icon: Banknote },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick CRM Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-xs border border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Real Estate CRM Active
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-1">
            Admin CRM Control Suite
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage inquiries, schedule client site visits, match property inventory, and track sales performance
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsAddLeadOpen(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>+ New Lead</span>
          </button>
          <button
            type="button"
            onClick={() => setIsScheduleVisitOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs transition shadow-xs cursor-pointer"
          >
            <Car size={15} />
            <span>+ Schedule Tour</span>
          </button>
        </div>
      </div>

      {/* Main CRM Navigation Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-1.5 flex items-center gap-1 overflow-x-auto">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#0a1628] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon size={15} className={isActive ? "text-yellow-400" : "text-gray-500"} />
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {/* 1. CRM Overview */}
        {activeTab === "crm_overview" && (
          <CrmDashboardOverview
            leads={leads}
            visits={visits}
            totalPlots={initialPlots.length}
            availablePlots={availablePlotsCount}
            associates={sponsorOptions}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {/* 2. Leads & Enquiries Pipeline */}
        {activeTab === "leads" && (
          <CrmLeadsManager
            initialLeads={leads}
            associates={sponsorOptions}
            onOpenMatcher={handleOpenMatcherForLead}
          />
        )}

        {/* 3. Site Visits */}
        {activeTab === "visits" && (
          <CrmSiteVisitsManager
            initialVisits={visits}
            associates={sponsorOptions}
          />
        )}

        {/* 4. Property Matcher */}
        {activeTab === "matching" && (
          <CrmPropertyMatcher
            availablePlots={
              initialPlots.filter((p) => p.status === "AVAILABLE") as any
            }
            leads={leads}
            selectedLead={matchedLead}
          />
        )}

        {/* 5. Associates Network */}
        {activeTab === "associates" && (
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
            <AssociatesManager
              initialAssociates={initialAssociates}
              title="All Associates Network"
              subtitle="Manage sales team members, view downlines, update rank tiers, and edit member options"
            />
          </div>
        )}

        {/* 6. Plots Inventory */}
        {activeTab === "plots" && (
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200">
            <PlotsManager
              initialPlots={initialPlots as any}
              initialAssociates={sponsorOptions}
              title="Plots Inventory Management"
              subtitle="Manage plot inventory, prices, status, and sales assignments"
            />
          </div>
        )}

        {/* 7. Sales Overview */}
        {activeTab === "sales" && (
          <RecentSalesActivity initialSales={initialRecentSales} />
        )}
      </div>

      {/* Global Add Lead Modal */}
      <CrmLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        associates={sponsorOptions}
        onSuccess={(newLead) => {
          setLeads((prev) => [newLead, ...prev]);
        }}
      />

      {/* Global Schedule Visit Modal */}
      <CrmSiteVisitModal
        isOpen={isScheduleVisitOpen}
        onClose={() => setIsScheduleVisitOpen(false)}
        associates={sponsorOptions}
        onSuccess={(newVisit) => {
          setVisits((prev) => [newVisit, ...prev]);
        }}
      />
    </div>
  );
}

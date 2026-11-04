"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  TrendingUp,
  Award,
  Users,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  MapPin,
  Phone,
  User,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  X,
  CreditCard,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface SoldPlotItem {
  id: string;
  source: "SALE" | "BOOKING";
  type: "SELF" | "TEAM";
  plotNumber: string;
  projectName: string;
  location: string;
  sizeGaj: number;
  pricePerGaj: number;
  saleAmount: number;
  bookingAmount?: number;
  balanceAmount?: number;
  soldByName: string;
  soldByMemberId: string;
  isDirect: boolean;
  downlineLevel: number; // 0 for self, 1 for direct recruit, 2 for sub-recruit
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string | null;
  saleDate: string | Date;
  status: string; // SOLD, CONFIRMED, COMPLETED
  agreementStatus: string; // REGISTRY_DONE, AGREEMENT_SIGNED, PENDING
  paymentMode?: string;
  commissionEarned?: number;
  notes?: string | null;
}

export interface BusinessSummary {
  totalSalesCount: number;
  totalBusinessAmount: number;
  totalGaj: number;
  selfSalesCount: number;
  selfBusinessAmount: number;
  selfGaj: number;
  teamSalesCount: number;
  teamBusinessAmount: number;
  teamGaj: number;
  totalCommissionEarned: number;
}

interface Props {
  currentAssociate: {
    id: string;
    name: string;
    memberId: string;
    rank: string;
  };
  summary: BusinessSummary;
  soldPlots: SoldPlotItem[];
}

export default function MyBusinessDashboardView({
  currentAssociate,
  summary,
  soldPlots: initialSoldPlots,
}: Props) {
  // Tab state: "ALL" | "SELF" | "TEAM"
  const [activeTab, setActiveTab] = useState<"ALL" | "SELF" | "TEAM">("ALL");

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"date-desc" | "amount-desc" | "size-desc">("date-desc");

  // Detail Modal State
  const [selectedPlot, setSelectedPlot] = useState<SoldPlotItem | null>(null);

  // Projects list for dropdown
  const projects = useMemo(() => {
    const set = new Set<string>();
    initialSoldPlots.forEach((p) => {
      if (p.projectName) set.add(p.projectName);
    });
    return Array.from(set);
  }, [initialSoldPlots]);

  // Filtered and Sorted Sold Plots
  const filteredPlots = useMemo(() => {
    return initialSoldPlots
      .filter((item) => {
        // Tab filter
        if (activeTab === "SELF" && item.type !== "SELF") return false;
        if (activeTab === "TEAM" && item.type !== "TEAM") return false;

        // Project filter
        if (selectedProject !== "ALL" && item.projectName !== selectedProject) {
          return false;
        }

        // Status filter
        if (statusFilter !== "ALL") {
          if (statusFilter === "REGISTRY_DONE" && item.agreementStatus !== "REGISTRY_DONE") return false;
          if (statusFilter === "AGREEMENT_SIGNED" && item.agreementStatus !== "AGREEMENT_SIGNED") return false;
          if (statusFilter === "CONFIRMED" && item.status !== "CONFIRMED" && item.status !== "SOLD") return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchPlot = item.plotNumber.toLowerCase().includes(q);
          const matchProject = item.projectName.toLowerCase().includes(q);
          const matchBuyer = item.buyerName.toLowerCase().includes(q);
          const matchPhone = item.buyerPhone.includes(q);
          const matchSeller = item.soldByName.toLowerCase().includes(q);
          const matchMemberId = item.soldByMemberId.toLowerCase().includes(q);
          return matchPlot || matchProject || matchBuyer || matchPhone || matchSeller || matchMemberId;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "amount-desc") {
          return b.saleAmount - a.saleAmount;
        }
        if (sortBy === "size-desc") {
          return b.sizeGaj - a.sizeGaj;
        }
        // date-desc default
        const dateA = new Date(a.saleDate).getTime();
        const dateB = new Date(b.saleDate).getTime();
        return dateB - dateA;
      });
  }, [initialSoldPlots, activeTab, selectedProject, statusFilter, searchQuery, sortBy]);

  // Tab counts
  const selfCount = useMemo(
    () => initialSoldPlots.filter((p) => p.type === "SELF").length,
    [initialSoldPlots]
  );
  const teamCount = useMemo(
    () => initialSoldPlots.filter((p) => p.type === "TEAM").length,
    [initialSoldPlots]
  );

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "Sr No",
      "Sale Type",
      "Plot Number",
      "Project Name",
      "Location",
      "Size (Gaj)",
      "Rate Per Gaj (INR)",
      "Total Amount (INR)",
      "Sold By Name",
      "Sold By Member ID",
      "Buyer Name",
      "Buyer Phone",
      "Sale Date",
      "Agreement Status",
      "Commission (INR)",
    ];

    const rows = filteredPlots.map((p, idx) => [
      idx + 1,
      p.type === "SELF" ? "Self Sale" : `Team Sale (Level ${p.downlineLevel})`,
      `"${p.plotNumber}"`,
      `"${p.projectName}"`,
      `"${p.location}"`,
      p.sizeGaj,
      p.pricePerGaj,
      p.saleAmount,
      `"${p.soldByName}"`,
      p.soldByMemberId,
      `"${p.buyerName}"`,
      p.buyerPhone,
      new Date(p.saleDate).toLocaleDateString("en-IN"),
      p.agreementStatus,
      p.commissionEarned || 0,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ShreeKarni_MyBusiness_${activeTab}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                <Briefcase size={14} className="text-amber-400" />
                <span>My Business Portfolio</span>
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-slate-300 text-xs hidden sm:inline font-mono">
                Associate: {currentAssociate.name} ({currentAssociate.memberId})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Plot Sales & Business Turnover
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Track your individual plot bookings and view real-time sales generated by your downline team members.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/plots"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs sm:text-sm font-bold text-white transition cursor-pointer"
            >
              <Building size={16} className="text-amber-400" />
              <span>Available Inventory</span>
            </Link>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Download size={16} />
              <span>Export Sales Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUMMARY KPI METRIC CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Business */}
        <div className="bg-gradient-to-br from-[#0d1b2a] to-[#172c47] rounded-2xl p-5 text-white border border-amber-500/20 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Total Business Turnover
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-white tracking-tight">
            ₹{summary.totalBusinessAmount.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-300">
            <span>{summary.totalSalesCount} Plots Sold</span>
            <span>•</span>
            <span className="font-mono text-amber-300">{summary.totalGaj} Gaj Total</span>
          </div>
        </div>

        {/* Self Business (Direct) */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              My Direct Sales (Self)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <User size={16} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-emerald-900 tracking-tight">
            ₹{summary.selfBusinessAmount.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="font-semibold text-emerald-700">{summary.selfSalesCount} Plots</span>
            <span>•</span>
            <span className="font-mono">{summary.selfGaj} Gaj Sold</span>
          </div>
        </div>

        {/* Team Downline Business */}
        <div className="bg-white rounded-2xl p-5 border border-blue-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Team Downline Business
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-blue-900 tracking-tight">
            ₹{summary.teamBusinessAmount.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="font-semibold text-blue-700">{summary.teamSalesCount} Plots</span>
            <span>•</span>
            <span className="font-mono">{summary.teamGaj} Gaj Sold</span>
          </div>
        </div>

        {/* Commission Earned */}
        <div className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Total Commission Earned
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Award size={16} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-amber-900 tracking-tight">
            ₹{summary.totalCommissionEarned.toLocaleString("en-IN")}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span className="text-emerald-600 font-semibold">Credited to Wallet</span>
            <span>•</span>
            <Link
              href="/dashboard/incentives/wallet"
              className="text-amber-700 font-bold hover:underline"
            >
              View Wallet →
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE FILTER TABS & SEARCH BAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "ALL"
                  ? "bg-[#0d1b2a] text-amber-400 shadow-md shadow-slate-900/10"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span>All Sold Plots</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  activeTab === "ALL"
                    ? "bg-amber-400 text-slate-950"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {initialSoldPlots.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("SELF")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "SELF"
                  ? "bg-[#0d1b2a] text-amber-400 shadow-md shadow-slate-900/10"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <User size={15} />
              <span>My Direct Sales (Self)</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  activeTab === "SELF"
                    ? "bg-amber-400 text-slate-950"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {selfCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("TEAM")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === "TEAM"
                  ? "bg-[#0d1b2a] text-amber-400 shadow-md shadow-slate-900/10"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Users size={15} />
              <span>My Team Sold Plots</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  activeTab === "TEAM"
                    ? "bg-amber-400 text-slate-950"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {teamCount}
              </span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{filteredPlots.length}</strong> of{" "}
            {initialSoldPlots.length} plots
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-3 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Plot, Buyer, Seller ID..."
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
              <option value="ALL">All Projects</option>
              {projects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
          </div>

          {/* Legal / Registry Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-700"
            >
              <option value="ALL">All Registry Statuses</option>
              <option value="REGISTRY_DONE">Registry Completed</option>
              <option value="AGREEMENT_SIGNED">Agreement Executed</option>
              <option value="CONFIRMED">Booking Confirmed</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition text-gray-700"
            >
              <option value="date-desc">Newest Sale First</option>
              <option value="amount-desc">Highest Sale Amount</option>
              <option value="size-desc">Largest Plot Size</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SOLD PLOTS DATA TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {filteredPlots.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Briefcase size={28} />
            </div>
            <h3 className="text-base font-bold text-gray-800">
              No Sold Plots Found
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              {activeTab === "SELF"
                ? "You haven't recorded any self plot bookings yet. Share project brochures with your clients!"
                : activeTab === "TEAM"
                ? "Your downline team hasn't registered sales yet under this filter."
                : "No plot sales match your current search and filter criteria."}
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/plots"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d1b2a] text-amber-400 font-bold text-xs shadow-md"
              >
                <span>Browse Available Inventory</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4">Sr.</th>
                  <th className="py-3.5 px-4">Plot & Project</th>
                  <th className="py-3.5 px-4">Sold By (Associate)</th>
                  <th className="py-3.5 px-4">Buyer / Customer</th>
                  <th className="py-3.5 px-4">Size & Rate</th>
                  <th className="py-3.5 px-4">Total Amount (₹)</th>
                  <th className="py-3.5 px-4">Sale Date</th>
                  <th className="py-3.5 px-4">Registry Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlots.map((plot, idx) => {
                  const isSelf = plot.type === "SELF";
                  return (
                    <tr
                      key={plot.id}
                      className="hover:bg-amber-50/30 transition-colors group"
                    >
                      {/* Sr No */}
                      <td className="py-3.5 px-4 text-xs font-medium text-gray-400">
                        {idx + 1}
                      </td>

                      {/* Plot & Project */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 group-hover:text-amber-700 transition flex items-center gap-1.5">
                          <span>{plot.plotNumber}</span>
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[170px]">
                          {plot.projectName}
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-rose-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{plot.location}</span>
                        </div>
                      </td>

                      {/* Sold By */}
                      <td className="py-3.5 px-4">
                        {isSelf ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Sparkles size={12} className="text-amber-600" />
                            <span>Self (You)</span>
                          </span>
                        ) : (
                          <div>
                            <div className="font-semibold text-gray-900 text-xs">
                              {plot.soldByName}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 font-mono">
                              <span>ID: {plot.soldByMemberId}</span>
                              <span>•</span>
                              <span className="text-blue-600 font-bold">
                                Level {plot.downlineLevel || 1}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Buyer Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-xs">
                          {plot.buyerName}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-emerald-500" />
                          <span>{plot.buyerPhone}</span>
                        </div>
                      </td>

                      {/* Size & Rate */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-xs">
                          {plot.sizeGaj} Gaj
                        </div>
                        <div className="text-[11px] text-gray-500">
                          ₹{plot.pricePerGaj.toLocaleString("en-IN")}/Gaj
                        </div>
                      </td>

                      {/* Total Sale Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold font-mono text-gray-900 text-sm">
                          ₹{plot.saleAmount.toLocaleString("en-IN")}
                        </div>
                        {plot.commissionEarned ? (
                          <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                            Commission: +₹{plot.commissionEarned.toLocaleString("en-IN")}
                          </div>
                        ) : null}
                      </td>

                      {/* Sale Date */}
                      <td className="py-3.5 px-4 text-xs text-gray-600">
                        {new Date(plot.saleDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Registry Status */}
                      <td className="py-3.5 px-4">
                        {plot.agreementStatus === "REGISTRY_DONE" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 size={12} />
                            <span>Registry Done</span>
                          </span>
                        ) : plot.agreementStatus === "AGREEMENT_SIGNED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <FileText size={12} />
                            <span>Agreement Signed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock size={12} />
                            <span>Confirmed</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedPlot(plot)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-[#0d1b2a] hover:text-amber-400 text-gray-700 text-xs font-bold transition cursor-pointer"
                          title="View Plot Details & Receipt"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. DETAILED PLOT SALE MODAL */}
      {/* ========================================================================= */}
      {selectedPlot && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 border border-amber-400/30">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#0a1628] to-[#122846] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                  Plot Sale Agreement & Booking Summary
                </span>
                <h3 className="font-extrabold text-base flex items-center gap-2 mt-0.5">
                  <span>Plot {selectedPlot.plotNumber}</span>
                  <span className="text-xs font-normal text-slate-300">
                    ({selectedPlot.projectName})
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedPlot(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 bg-slate-50/50 max-h-[75vh] overflow-y-auto">
              {/* Sold By Attribution Card */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Sales Attribution
                </span>
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedPlot.soldByName}
                    </p>
                    <p className="text-xs font-mono text-gray-500">
                      Member ID: {selectedPlot.soldByMemberId}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedPlot.type === "SELF"
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-blue-100 text-blue-900 border border-blue-300"
                    }`}
                  >
                    {selectedPlot.type === "SELF"
                      ? "Direct Sale"
                      : `Downline Level ${selectedPlot.downlineLevel || 1}`}
                  </span>
                </div>
              </div>

              {/* Customer Buyer Details */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Customer / Buyer Information
                </span>
                <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                  <div>
                    <span className="text-gray-400">Customer Name</span>
                    <p className="font-bold text-gray-900">{selectedPlot.buyerName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone Number</span>
                    <p className="font-bold text-gray-900 font-mono">
                      {selectedPlot.buyerPhone}
                    </p>
                  </div>
                  {selectedPlot.buyerEmail && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Email Address</span>
                      <p className="font-bold text-gray-900">{selectedPlot.buyerEmail}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Plot Specifications & Financials */}
              <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Plot & Financial Details
                </span>
                <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                  <div>
                    <span className="text-gray-400">Project</span>
                    <p className="font-bold text-gray-900">{selectedPlot.projectName}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Location</span>
                    <p className="font-bold text-gray-900">{selectedPlot.location}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Plot Size</span>
                    <p className="font-bold text-gray-900 font-mono">
                      {selectedPlot.sizeGaj} Gaj
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Rate / Gaj</span>
                    <p className="font-bold text-gray-900 font-mono">
                      ₹{selectedPlot.pricePerGaj.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Plot Value</span>
                    <p className="font-black text-amber-700 text-sm font-mono">
                      ₹{selectedPlot.saleAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Registry Status</span>
                    <p className="font-bold text-emerald-700">
                      {selectedPlot.agreementStatus.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedPlot(null)}
                className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

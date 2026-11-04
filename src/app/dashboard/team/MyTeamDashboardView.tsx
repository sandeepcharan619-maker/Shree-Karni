"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  Trophy,
  Handshake,
  Search,
  Download,
  Filter,
  Eye,
  Crown,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Calendar,
  Building,
  MapPin,
  Sparkles,
  ArrowUpRight,
  User as UserIcon,
} from "lucide-react";

export interface TeamMember {
  id: string;
  name: string;
  memberId: string;
  phone: string;
  email: string;
  rank: string;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  referredById: string | null;
  directSeniorName: string;
  directSeniorId: string;
  selfBusiness: number;
  teamBusiness: number;
  totalBusiness: number;
  directTeamCount: number;
  totalDownlineCount: number;
  commissionEarned: number;
  sales: {
    id: string;
    plotNumber: string;
    projectName: string;
    buyerName: string;
    saleAmount: number;
    saleDate: string;
  }[];
}

export interface RootAssociate {
  id: string;
  name: string;
  memberId: string;
  rank: string;
  avatarUrl?: string | null;
  phone: string;
  email: string;
  createdAt: string;
  selfBusiness: number;
  teamBusiness: number;
  totalBusiness: number;
  directTeamCount: number;
  totalTeamMembers: number;
  totalTeamCommission: number;
}

interface MyTeamDashboardViewProps {
  rootAssociate: RootAssociate;
  allTeamMembers: TeamMember[];
}

export default function MyTeamDashboardView({
  rootAssociate,
  allTeamMembers,
}: MyTeamDashboardViewProps) {
  // State for Hierarchy focus
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null);

  // State for Performance Tabs
  const [perfTab, setPerfTab] = useState<"month" | "3m" | "6m" | "year">("month");

  // State for Table Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [rankFilter, setRankFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Selected member for Profile Modal
  const [selectedProfile, setSelectedProfile] = useState<TeamMember | null>(null);

  // 1. Calculations for Top 4 Summary Cards
  const totalTeamMembersCount = Math.max(
    rootAssociate.totalTeamMembers,
    allTeamMembers.length
  );

  const totalTeamBusinessSum =
    rootAssociate.teamBusiness ||
    allTeamMembers.reduce((sum, m) => sum + (m.selfBusiness || 0), 0);

  const totalTeamCommissionSum =
    rootAssociate.totalTeamCommission ||
    allTeamMembers.reduce((sum, m) => sum + (m.commissionEarned || 0), 0);

  const teamRankDisplay = rootAssociate.rank
    ? `${rootAssociate.rank} ★`
    : "Client Adviser ★";

  // 2. Hierarchy tree resolution
  // If focused member is selected, show that member at top and their directs below
  const focusedMember = useMemo(() => {
    if (!focusedMemberId) return null;
    return allTeamMembers.find((m) => m.id === focusedMemberId) || null;
  }, [focusedMemberId, allTeamMembers]);

  const treeParent = focusedMember || rootAssociate;
  const isRootActive = !focusedMember;

  const directChildren = useMemo(() => {
    return allTeamMembers.filter((m) => m.referredById === treeParent.id);
  }, [allTeamMembers, treeParent.id]);

  // 3. Performance Tab Metrics (Zero initially for new associates with no team sales)
  const perfData = useMemo(() => {
    // If totalTeamBusinessSum is 0 (new associate with no team sales), all metrics are strictly 0!
    if (totalTeamBusinessSum === 0 || allTeamMembers.length === 0) {
      switch (perfTab) {
        case "month":
          return { target: 800000, achieved: 0, percent: 0, label: "This Month" };
        case "3m":
          return { target: 2500000, achieved: 0, percent: 0, label: "Last 3 Months" };
        case "6m":
          return { target: 5000000, achieved: 0, percent: 0, label: "Last 6 Months" };
        case "year":
          return { target: 10000000, achieved: 0, percent: 0, label: "This Year" };
      }
    }

    const allSales = allTeamMembers.flatMap((m) => m.sales || []);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const startOf3Months = new Date(currentYear, currentMonth - 2, 1);
    const startOf6Months = new Date(currentYear, currentMonth - 5, 1);
    const startOfYear = new Date(currentYear, 0, 1);

    const getSalesInRange = (sinceDate: Date) => {
      return allSales
        .filter((s) => new Date(s.saleDate) >= sinceDate)
        .reduce((sum, s) => sum + (s.saleAmount || 0), 0);
    };

    let achieved = 0;
    let target = 800000;
    let label = "This Month";

    switch (perfTab) {
      case "month":
        target = 800000;
        achieved = getSalesInRange(startOfCurrentMonth);
        label = "This Month";
        break;
      case "3m":
        target = 2500000;
        achieved = getSalesInRange(startOf3Months);
        label = "Last 3 Months";
        break;
      case "6m":
        target = 5000000;
        achieved = getSalesInRange(startOf6Months);
        label = "Last 6 Months";
        break;
      case "year":
        target = 10000000;
        achieved = getSalesInRange(startOfYear);
        label = "This Year";
        break;
    }

    // If sales records had no specific timestamp matches, distribute team business proportionally
    if (achieved === 0 && totalTeamBusinessSum > 0) {
      switch (perfTab) {
        case "month":
          achieved = Math.round(totalTeamBusinessSum * 0.25);
          break;
        case "3m":
          achieved = Math.round(totalTeamBusinessSum * 0.5);
          break;
        case "6m":
          achieved = Math.round(totalTeamBusinessSum * 0.75);
          break;
        case "year":
          achieved = totalTeamBusinessSum;
          break;
      }
    }

    const percent = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
    return { target, achieved, percent, label };
  }, [perfTab, totalTeamBusinessSum, allTeamMembers]);

  // 4. Filtering Team Members Table
  const filteredMembers = useMemo(() => {
    return allTeamMembers.filter((member) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.memberId.toLowerCase().includes(q) ||
        member.phone.includes(q);

      // Rank
      const matchRank =
        rankFilter === "ALL" ||
        member.rank.toLowerCase() === rankFilter.toLowerCase();

      // Status
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? member.isActive : !member.isActive);

      // Date
      let matchDate = true;
      if (dateFilter !== "ALL") {
        const memDate = new Date(member.createdAt);
        const now = new Date();
        if (dateFilter === "MONTH") {
          matchDate =
            memDate.getMonth() === now.getMonth() &&
            memDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === "30DAYS") {
          const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchDate = memDate >= past30;
        } else if (dateFilter === "YEAR") {
          matchDate = memDate.getFullYear() === now.getFullYear();
        }
      }

      return matchSearch && matchRank && matchStatus && matchDate;
    });
  }, [allTeamMembers, searchQuery, rankFilter, statusFilter, dateFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMembers.slice(start, start + itemsPerPage);
  }, [filteredMembers, currentPage]);

  // 5. Top Performers Leaderboard (Top 10 sorted by business)
  const topPerformers = useMemo(() => {
    return [...allTeamMembers]
      .sort((a, b) => b.totalBusiness - a.totalBusiness)
      .slice(0, 10);
  }, [allTeamMembers]);

  // 6. CSV Export Functionality
  const exportToExcel = () => {
    const headers = [
      "Sr. No.",
      "Name",
      "Associate ID",
      "Mobile",
      "Joining Date",
      "Rank",
      "Direct Senior",
      "Self Business (INR)",
      "Team Business (INR)",
      "Total Business (INR)",
      "Status",
    ];

    const rows = filteredMembers.map((m, idx) => [
      idx + 1,
      `"${m.name}"`,
      m.memberId,
      `"${m.phone}"`,
      new Date(m.createdAt).toLocaleDateString("en-IN"),
      m.rank,
      `"${m.directSeniorName}"`,
      m.selfBusiness,
      m.teamBusiness,
      m.totalBusiness,
      m.isActive ? "Active" : "Inactive",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Shree_Karni_My_Team_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
      {/* ============================================================== */}
      {/* 1. TOP 4 ATTRACTIVE SUMMARY CARDS                              */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. My Team Members (Dark Blue Gradient) */}
        <div className="rounded-2xl p-5 text-white shadow-sm flex items-center justify-between min-h-[100px] bg-gradient-to-br from-[#123058] via-[#103058] to-[#0c2342] hover:shadow-md transition">
          <div>
            <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
              My Team Members
            </p>
            <h3 className="text-3xl font-black tracking-tight text-white">
              {totalTeamMembersCount}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
            <Users size={24} />
          </div>
        </div>

        {/* 2. Team Business (Vibrant Green Gradient) */}
        <div className="rounded-2xl p-5 text-white shadow-sm flex items-center justify-between min-h-[100px] bg-gradient-to-br from-[#059669] via-[#047857] to-[#065f46] hover:shadow-md transition">
          <div>
            <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider mb-1">
              Team Business
            </p>
            <h3 className="text-2xl font-black tracking-tight text-white">
              ₹ {totalTeamBusinessSum.toLocaleString("en-IN")}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* 3. Team Rank (Purple Gradient) */}
        <div className="rounded-2xl p-5 text-white shadow-sm flex items-center justify-between min-h-[100px] bg-gradient-to-br from-[#7e22ce] via-[#6b21a8] to-[#581c87] hover:shadow-md transition">
          <div>
            <p className="text-xs font-semibold text-purple-100 uppercase tracking-wider mb-1">
              Team Rank
            </p>
            <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              <span>{teamRankDisplay}</span>
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
            <Trophy size={24} />
          </div>
        </div>

        {/* 4. Team Commission (Orange Gradient) */}
        <div className="rounded-2xl p-5 text-white shadow-sm flex items-center justify-between min-h-[100px] bg-gradient-to-br from-[#ea580c] via-[#c2410c] to-[#9a3412] hover:shadow-md transition">
          <div>
            <p className="text-xs font-semibold text-orange-100 uppercase tracking-wider mb-1">
              Team Commission
            </p>
            <h3 className="text-2xl font-black tracking-tight text-white">
              ₹ {totalTeamCommissionSum.toLocaleString("en-IN")}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
            <Handshake size={24} />
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2 & 4. MY TEAM HIERARCHY (LEFT) + TEAM PERFORMANCE (RIGHT)     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* MY TEAM HIERARCHY (60% width) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold tracking-tight">My Team Hierarchy</h3>
            </div>
            {!isRootActive ? (
              <button
                onClick={() => setFocusedMemberId(null)}
                className="text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <span>← Back to My Root</span>
              </button>
            ) : (
              <span className="text-xs font-medium text-slate-300">
                Direct Tree View
              </span>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50/50 to-white">
            {/* 1. Parent / Root Card */}
            <div className="flex flex-col items-center relative z-10">
              {/* Crown Icon */}
              <Crown size={22} className="text-amber-500 fill-amber-400 mb-1 animate-pulse" />

              <div className="bg-gradient-to-br from-amber-50 via-amber-100/70 to-amber-200/50 border-2 border-amber-400 rounded-2xl p-3.5 shadow-sm flex items-center gap-3.5 min-w-[260px]">
                {/* Photo */}
                <div className="w-14 h-14 rounded-full overflow-hidden bg-amber-200 border-2 border-amber-500 shadow-sm shrink-0 flex items-center justify-center">
                  {treeParent.avatarUrl ? (
                    <img
                      src={treeParent.avatarUrl}
                      alt={treeParent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-amber-300 text-amber-900 font-extrabold flex items-center justify-center text-xl">
                      {treeParent.name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                    {isRootActive ? "You" : "Focused Sponsor"}
                  </span>
                  <h4 className="text-sm font-black text-gray-900 truncate mt-0.5">
                    {treeParent.name}
                  </h4>
                  <p className="text-xs font-mono font-semibold text-gray-600">
                    {treeParent.memberId}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold bg-[#e9b04c] text-slate-950 px-2 py-0.5 rounded shadow-2xs">
                    Rank : {treeParent.rank}
                  </span>
                </div>
              </div>
            </div>

            {/* Connecting Tree Lines */}
            {directChildren.length > 0 && (
              <div className="w-full flex flex-col items-center my-2">
                {/* Vertical Stem down */}
                <div className="w-0.5 h-6 bg-blue-300" />
                {/* Horizontal Bar spanning children */}
                {directChildren.length > 1 && (
                  <div className="w-4/5 border-t-2 border-blue-300 h-4 relative">
                    <div className="absolute top-0 left-0 w-0.5 h-4 bg-blue-300" />
                    <div className="absolute top-0 right-0 w-0.5 h-4 bg-blue-300" />
                    {directChildren.length > 2 && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-blue-300" />
                    )}
                  </div>
                )}
                {directChildren.length === 1 && (
                  <div className="w-0.5 h-4 bg-blue-300" />
                )}
              </div>
            )}

            {/* Direct Members Cards */}
            {directChildren.length > 0 ? (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
                {directChildren.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => {
                      // If member has downline, allow drill-down or open profile
                      if (member.directTeamCount > 0) {
                        setFocusedMemberId(member.id);
                      } else {
                        setSelectedProfile(member);
                      }
                    }}
                    className="bg-white rounded-xl p-3.5 border border-blue-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between text-center group cursor-pointer"
                  >
                    <div className="flex flex-col items-center">
                      {/* Photo */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-300 shadow-xs mb-2 group-hover:scale-105 transition">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-base">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      <h5 className="text-xs font-bold text-gray-900 truncate w-full group-hover:text-blue-700">
                        {member.name}
                      </h5>
                      <p className="text-[11px] font-mono text-gray-500">{member.memberId}</p>

                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {member.rank}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 space-y-1">
                      <div className="text-[10px] font-bold text-blue-700 bg-blue-50 py-1 rounded">
                        Team Members: {member.totalDownlineCount}
                      </div>
                      <p className="text-[11px] font-extrabold text-gray-900">
                        ₹ {member.totalBusiness.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500 text-xs mt-2 w-full max-w-md">
                <Users size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="font-semibold text-gray-700">No direct downline members yet under this associate.</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Share your referral link to build your team network!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* TEAM PERFORMANCE (40% width) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold tracking-tight">Team Performance</h3>
            </div>
          </div>

          {/* Interactive Performance Tabs */}
          <div className="flex border-b border-gray-100 bg-gray-50/70 text-xs font-bold px-2">
            {[
              { id: "month", label: "This Month" },
              { id: "3m", label: "Last 3 Months" },
              { id: "6m", label: "Last 6 Months" },
              { id: "year", label: "This Year" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPerfTab(tab.id as any)}
                className={`flex-1 py-3 text-center border-b-2 transition cursor-pointer ${
                  perfTab === tab.id
                    ? "border-blue-600 text-blue-700 font-extrabold bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
            {/* Circular Donut Gauge & Numbers */}
            <div className="flex items-center justify-between gap-5 py-2">
              {/* Radial Donut Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e6edf2"
                    strokeWidth="11"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="11"
                    fill="transparent"
                    strokeDasharray="251.2"
                    strokeDashoffset={`${251.2 * (1 - perfData.percent / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-3xl font-black text-gray-900 leading-none">
                    {perfData.percent}%
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                    Target Achieved
                  </span>
                </div>
              </div>

              {/* Targets details */}
              <div className="flex-1 space-y-3 text-right">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Target Business</p>
                  <p className="text-base font-extrabold text-gray-900 mt-0.5">
                    ₹ {perfData.target.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Achieved Business</p>
                  <p className="text-lg font-black text-emerald-700 mt-0.5">
                    ₹ {perfData.achieved.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Alert Status Pill */}
            <div className={`border rounded-xl p-3 flex items-center gap-2.5 ${
              perfData.achieved > 0
                ? "bg-[#ecfdf5] border-emerald-200"
                : "bg-gray-50 border-gray-200"
            }`}>
              <CheckCircle2
                size={18}
                className={perfData.achieved > 0 ? "text-emerald-600 shrink-0" : "text-gray-400 shrink-0"}
              />
              <p className={`text-xs font-bold ${
                perfData.achieved > 0 ? "text-emerald-950" : "text-gray-600"
              }`}>
                {perfData.achieved > 0
                  ? "You are on track to achieve your team target!"
                  : "No team business recorded yet. As your downline generates sales, performance will update here."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3 & 5. TEAM MEMBERS TABLE (LEFT) + TOP PERFORMERS (RIGHT)      */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* TEAM MEMBERS TABLE (65% width) */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          {/* Table Header with Search */}
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold tracking-tight">Team Members</h3>
              <span className="text-xs text-slate-400">({filteredMembers.length})</span>
            </div>

            {/* Search Input matching screenshot */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by Name or ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white text-gray-800 text-xs rounded-lg pl-3 pr-8 py-1.5 outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-400"
              />
              <Search size={14} className="absolute right-2.5 top-2 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Filter Bar with Export to Excel */}
          <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Rank Filter */}
              <select
                value={rankFilter}
                onChange={(e) => {
                  setRankFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-700 outline-none focus:border-amber-500 font-medium"
              >
                <option value="ALL">All Ranks</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
                <option value="Platinum">Platinum</option>
                <option value="Client Adviser">Client Adviser</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-700 outline-none focus:border-amber-500 font-medium"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-gray-700 outline-none focus:border-amber-500 font-medium"
              >
                <option value="ALL">All Joining Dates</option>
                <option value="MONTH">This Month</option>
                <option value="30DAYS">Last 30 Days</option>
                <option value="YEAR">This Year</option>
              </select>
            </div>

            {/* Export to Excel Button */}
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download size={13} />
              <span>Export to Excel</span>
            </button>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Member ID</th>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Direct Under</th>
                  <th className="py-2.5 px-3">Business (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedMembers.length > 0 ? (
                  paginatedMembers.map((member, idx) => {
                    const rowNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr key={member.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3 px-3 text-gray-400 font-semibold">{rowNumber}</td>
                        <td className="py-3 px-3 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {member.name.charAt(0)}
                            </div>
                            <span className="truncate max-w-[130px]">{member.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-blue-700">
                          {member.memberId}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              member.rank === "Gold"
                                ? "bg-amber-100 text-amber-800"
                                : member.rank === "Silver"
                                ? "bg-slate-200 text-slate-800"
                                : member.rank === "Bronze"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {member.rank}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-600 font-medium">
                          {member.referredById === rootAssociate.id ? (
                            <span className="font-bold text-gray-800">You</span>
                          ) : (
                            member.directSeniorName
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-gray-900">
                          ₹ {member.totalBusiness.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedProfile(member)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-xs transition cursor-pointer"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400">
                      No team members found matching your search and filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {filteredMembers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} members
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
              >
                Prev
              </button>
              <span className="px-2 font-bold text-gray-800">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* TOP PERFORMERS (35% width) */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-between">
          <div className="bg-[#0d1b2a] text-white px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-400" />
              <h3 className="text-sm font-bold tracking-tight">★ Top Performers</h3>
            </div>
            <span className="text-[11px] text-slate-300">Top 10</span>
          </div>

          <div className="p-4 flex-1 divide-y divide-gray-100">
            {topPerformers.length > 0 ? (
              topPerformers.map((performer, idx) => (
                <div
                  key={performer.id}
                  onClick={() => setSelectedProfile(performer)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-gray-50 px-2 rounded-lg transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Medal badge */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        idx === 0
                          ? "bg-amber-400 text-amber-950 shadow-xs"
                          : idx === 1
                          ? "bg-slate-300 text-slate-900"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : "bg-gray-100 text-gray-600 font-semibold text-[10px]"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0 flex items-center justify-center">
                      {performer.avatarUrl ? (
                        <img
                          src={performer.avatarUrl}
                          alt={performer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {performer.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="min-w-0">
                      <h5 className="text-xs font-extrabold text-gray-900 truncate max-w-[120px]">
                        {performer.name}
                      </h5>
                      <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        {performer.rank}
                      </span>
                    </div>
                  </div>

                  {/* Performance amount */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-gray-900">
                      ₹ {performer.totalBusiness.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium">Team Business</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-1.5">
                <Trophy size={32} className="text-gray-300 mb-1" />
                <p className="text-xs font-bold text-gray-600">No Top Performers Yet</p>
                <p className="text-[11px] text-gray-400 max-w-[200px]">
                  Team members will appear on the leaderboard once they achieve sales.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6. TEAM MEMBER PROFILE MODAL                                   */}
      {/* ============================================================== */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="bg-[#0d1b2a] text-white p-5 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-900 font-bold flex items-center justify-center text-lg">
                  {selectedProfile.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {selectedProfile.name}
                  </h3>
                  <p className="text-xs text-amber-300 font-mono">
                    {selectedProfile.memberId} • {selectedProfile.rank}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProfile(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal & Senior Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 font-medium">Mobile Number:</span>
                  <p className="font-bold text-gray-900 text-sm">{selectedProfile.phone}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Email Address:</span>
                  <p className="font-bold text-gray-900">{selectedProfile.email || "Not specified"}</p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Joining Date:</span>
                  <p className="font-bold text-gray-900">
                    {new Date(selectedProfile.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 font-medium">Direct Senior (Sponsor):</span>
                  <p className="font-bold text-blue-700">
                    {selectedProfile.directSeniorName} ({selectedProfile.directSeniorId})
                  </p>
                </div>
              </div>

              {/* 4 Performance Metric Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Self Business</p>
                  <p className="text-sm font-black text-blue-900 mt-1">
                    ₹ {selectedProfile.selfBusiness.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-purple-600 uppercase">Team Business</p>
                  <p className="text-sm font-black text-purple-900 mt-1">
                    ₹ {selectedProfile.teamBusiness.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Total Business</p>
                  <p className="text-sm font-black text-emerald-900 mt-1">
                    ₹ {selectedProfile.totalBusiness.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-amber-600 uppercase">Commission</p>
                  <p className="text-sm font-black text-amber-900 mt-1">
                    ₹ {selectedProfile.commissionEarned.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Network Stats */}
              <div className="flex items-center justify-between text-xs p-3 bg-slate-100 rounded-xl">
                <div>
                  <span className="text-gray-500 font-medium">Direct Team Members:</span>{" "}
                  <span className="font-bold text-gray-900">{selectedProfile.directTeamCount}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Total Downline Members:</span>{" "}
                  <span className="font-bold text-gray-900">{selectedProfile.totalDownlineCount}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Status:</span>{" "}
                  <span className="font-bold text-emerald-600">Active</span>
                </div>
              </div>

              {/* Plot Booking History */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
                  Plot Booking History ({selectedProfile.sales.length})
                </h4>
                {selectedProfile.sales.length > 0 ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50 border-b border-gray-200 text-[10px] text-gray-500 uppercase font-bold">
                        <tr>
                          <th className="p-2">Plot No.</th>
                          <th className="p-2">Project</th>
                          <th className="p-2">Buyer</th>
                          <th className="p-2">Amount</th>
                          <th className="p-2">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedProfile.sales.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="p-2 font-bold text-blue-700">{s.plotNumber}</td>
                            <td className="p-2 text-gray-700">{s.projectName}</td>
                            <td className="p-2 font-medium text-gray-900">{s.buyerName}</td>
                            <td className="p-2 font-bold text-gray-900">
                              ₹ {s.saleAmount.toLocaleString("en-IN")}
                            </td>
                            <td className="p-2 text-gray-500">
                              {new Date(s.saleDate).toLocaleDateString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg text-center">
                    No plot sales recorded yet for this member.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setSelectedProfile(null)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg text-xs transition cursor-pointer"
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

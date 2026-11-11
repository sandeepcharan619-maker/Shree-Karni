"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  Briefcase,
  Gift,
  Users,
  Eye,
  Search,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface SaleReportRow {
  sNo: number;
  plotNumber: string;
  projectName: string;
  customerName: string;
  customerPhone: string;
  sizeGaj: number;
  pricePerGaj: number;
  saleAmount: number;
  saleDate: string;
  status: string;
}

interface IncentiveReportRow {
  sNo: number;
  date: string;
  type: string;
  description: string;
  amount: number;
  status: string;
}

interface TeamMemberReportRow {
  sNo: number;
  memberId: string;
  name: string;
  phone: string;
  rank: string;
  plotsSold: number;
  totalGaj: number;
  businessAmount: number;
  joinedDate: string;
}

interface VisitorReportRow {
  sNo: number;
  visitorName: string;
  phone: string;
  plotInterest: string;
  visitDate: string;
  status: string;
  feedback: string;
}

interface AssociateReportsViewProps {
  associateName: string;
  memberId: string;
  rank: string;
  totalSalesGaj: number;
  totalBusinessAmount: number;
  totalCommissionPaid: number;
  totalCommissionPending: number;
  totalTeamMembers: number;
  totalTeamBusiness: number;
  salesData: SaleReportRow[];
  incentivesData: IncentiveReportRow[];
  teamData: TeamMemberReportRow[];
  visitorsData: VisitorReportRow[];
}

export default function AssociateReportsView({
  associateName,
  memberId,
  rank,
  totalSalesGaj,
  totalBusinessAmount,
  totalCommissionPaid,
  totalCommissionPending,
  totalTeamMembers,
  totalTeamBusiness,
  salesData,
  incentivesData,
  teamData,
  visitorsData,
}: AssociateReportsViewProps) {
  const [activeTab, setActiveTab] = useState<"sales" | "commissions" | "team" | "visitors">("sales");
  const [searchQuery, setSearchQuery] = useState("");

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert("No records to export.");
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...data.map((row) =>
          headers.map((h) => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered views based on search query
  const filteredSales = useMemo(() => {
    if (!searchQuery) return salesData;
    const q = searchQuery.toLowerCase();
    return salesData.filter(
      (s) =>
        s.customerName.toLowerCase().includes(q) ||
        s.plotNumber.toLowerCase().includes(q) ||
        s.projectName.toLowerCase().includes(q)
    );
  }, [salesData, searchQuery]);

  const filteredIncentives = useMemo(() => {
    if (!searchQuery) return incentivesData;
    const q = searchQuery.toLowerCase();
    return incentivesData.filter(
      (i) =>
        i.description.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        i.status.toLowerCase().includes(q)
    );
  }, [incentivesData, searchQuery]);

  const filteredTeam = useMemo(() => {
    if (!searchQuery) return teamData;
    const q = searchQuery.toLowerCase();
    return teamData.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.memberId.toLowerCase().includes(q) ||
        t.rank.toLowerCase().includes(q)
    );
  }, [teamData, searchQuery]);

  const filteredVisitors = useMemo(() => {
    if (!searchQuery) return visitorsData;
    const q = searchQuery.toLowerCase();
    return visitorsData.filter(
      (v) =>
        v.visitorName.toLowerCase().includes(q) ||
        v.plotInterest.toLowerCase().includes(q) ||
        v.status.toLowerCase().includes(q)
    );
  }, [visitorsData, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-blue-100 text-blue-900">
              <BarChart3 size={24} />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Associate Reports & Statements
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official sales statements, commission earnings, team performance, and site visit logs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Statement</span>
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
          >
            <span>Dashboard</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
        {/* Card 1: My Sales (Gaj) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Self Business Volume
          </span>
          <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
            {totalSalesGaj.toLocaleString("en-IN")}{" "}
            <span className="text-xs font-normal text-slate-500">Gaj</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Total Value: <strong className="text-slate-800">₹ {totalBusinessAmount.toLocaleString("en-IN")}</strong>
          </p>
        </div>

        {/* Card 2: Commission Earned */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Commission Disbursed
          </span>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            ₹ {totalCommissionPaid.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Pending: <strong className="text-amber-600">₹ {totalCommissionPending.toLocaleString("en-IN")}</strong>
          </p>
        </div>

        {/* Card 3: Downline Team */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Active Downline Network
          </span>
          <p className="text-2xl font-black text-blue-600 mt-1 font-mono">
            {totalTeamMembers}{" "}
            <span className="text-xs font-normal text-slate-500">Associates</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Team Volume: <strong className="text-slate-800">₹ {totalTeamBusiness.toLocaleString("en-IN")}</strong>
          </p>
        </div>

        {/* Card 4: Associate Rank */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Member Credentials
          </span>
          <p className="text-lg font-black text-amber-700 mt-1 truncate">
            {rank}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            ID: <strong className="text-slate-800">{memberId}</strong>
          </p>
        </div>
      </div>

      {/* Report Tabs & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("sales")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "sales"
                  ? "bg-[#0d1b2a] text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Briefcase size={14} />
              <span>Sales Statement ({salesData.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("commissions")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "commissions"
                  ? "bg-[#0d1b2a] text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Gift size={14} />
              <span>Commission Ledger ({incentivesData.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "team"
                  ? "bg-[#0d1b2a] text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Users size={14} />
              <span>Downline Team Report ({teamData.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("visitors")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "visitors"
                  ? "bg-[#0d1b2a] text-white shadow-sm"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              <Eye size={14} />
              <span>Site Visits & Visitors ({visitorsData.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search report records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* CSV Download Button */}
            <button
              onClick={() => {
                if (activeTab === "sales") downloadCSV(filteredSales, `Sales_Statement_${memberId}`);
                else if (activeTab === "commissions") downloadCSV(filteredIncentives, `Commission_Statement_${memberId}`);
                else if (activeTab === "team") downloadCSV(filteredTeam, `Team_Report_${memberId}`);
                else downloadCSV(filteredVisitors, `Site_Visits_${memberId}`);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Sales Statement */}
        {activeTab === "sales" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1b2a] text-white uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Plot No.</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Customer Phone</th>
                  <th className="py-3 px-4">Plot Size</th>
                  <th className="py-3 px-4 text-right">Value (₹)</th>
                  <th className="py-3 px-4">Booking Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                      No sales records found.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">{s.sNo}</td>
                      <td className="py-3 px-4 font-bold text-blue-700 font-mono">{s.plotNumber}</td>
                      <td className="py-3 px-4 text-slate-700">{s.projectName}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.customerName}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{s.customerPhone}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">{s.sizeGaj} Gaj</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹ {s.saleAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{s.saleDate}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Commission Ledger */}
        {activeTab === "commissions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1b2a] text-white uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Incentive Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncentives.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No commission records found.
                    </td>
                  </tr>
                ) : (
                  filteredIncentives.map((i, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">{i.sNo}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{i.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {i.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{i.description}</td>
                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                        ₹ {i.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            i.status === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : i.status === "APPROVED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {i.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Team Report */}
        {activeTab === "team" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1b2a] text-white uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Member ID</th>
                  <th className="py-3 px-4">Associate Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Current Rank</th>
                  <th className="py-3 px-4 text-center">Plots Sold</th>
                  <th className="py-3 px-4 text-center">Sales Volume</th>
                  <th className="py-3 px-4 text-right">Team Business (₹)</th>
                  <th className="py-3 px-4">Joining Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeam.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                      No direct team members found.
                    </td>
                  </tr>
                ) : (
                  filteredTeam.map((t, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">{t.sNo}</td>
                      <td className="py-3 px-4 font-bold text-blue-700 font-mono">{t.memberId}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{t.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{t.phone}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {t.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {t.plotsSold}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                        {t.totalGaj} Gaj
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ₹ {t.businessAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{t.joinedDate}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Site Visits & Visitors */}
        {activeTab === "visitors" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1b2a] text-white uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Visitor / Client Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Plot Interest</th>
                  <th className="py-3 px-4">Visit Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Feedback / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      No visitor records logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">{v.sNo}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{v.visitorName}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{v.phone}</td>
                      <td className="py-3 px-4 font-semibold text-blue-700">{v.plotInterest}</td>
                      <td className="py-3 px-4 text-slate-500">{v.visitDate}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            v.status === "INTERESTED"
                              ? "bg-emerald-100 text-emerald-800"
                              : v.status === "VISITED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{v.feedback}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

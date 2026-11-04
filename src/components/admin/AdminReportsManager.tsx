"use client";

import { useState } from "react";
import {
  TrendingUp,
  Download,
  Printer,
  Building2,
  MapPin,
  Users,
  Receipt,
  Award,
  Filter,
  FileSpreadsheet,
} from "lucide-react";

interface AdminReportsManagerProps {
  projectSales: any[];
  plotInventory: any[];
  associateSales: any[];
  customerLedger: any[];
  commissionStatements: any[];
}

export default function AdminReportsManager({
  projectSales,
  plotInventory,
  associateSales,
  customerLedger,
  commissionStatements,
}: AdminReportsManagerProps) {
  const [activeReport, setActiveReport] = useState<
    "projects" | "plots" | "associates" | "customers" | "commissions"
  >("projects");

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
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

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reports & Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Vatika, Jaipur
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate, analyze, and export sales, inventory, collections, and commission reports in CSV / Excel or Print format.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            <Printer size={15} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 print:hidden">
        <button
          onClick={() => setActiveReport("projects")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeReport === "projects"
              ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Building2 size={15} />
          <span>Project Sales</span>
        </button>

        <button
          onClick={() => setActiveReport("plots")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeReport === "plots"
              ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <MapPin size={15} />
          <span>Plot Inventory</span>
        </button>

        <button
          onClick={() => setActiveReport("associates")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeReport === "associates"
              ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Users size={15} />
          <span>Associate Leaderboard</span>
        </button>

        <button
          onClick={() => setActiveReport("customers")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeReport === "customers"
              ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Receipt size={15} />
          <span>Customer Ledger</span>
        </button>

        <button
          onClick={() => setActiveReport("commissions")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeReport === "commissions"
              ? "bg-[#0d1b2a] text-amber-400 shadow-sm"
              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Award size={15} />
          <span>Commission Statements</span>
        </button>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block pb-4 mb-4 border-b-2 border-slate-900">
        <h2 className="text-xl font-black text-slate-900 uppercase">Shree Karni Real Estate</h2>
        <p className="text-xs text-slate-500">Official Operations & Sales Report • Vatika, Jaipur</p>
      </div>

      {/* ============================================================== */}
      {/* 1. PROJECT SALES REPORT                                         */}
      {/* ============================================================== */}
      {activeReport === "projects" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Project-Wise Sales & Inventory Performance</h3>
            <button
              onClick={() => downloadCSV(projectSales, "Project_Sales_Report")}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 transition cursor-pointer print:hidden"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Total Acreage</th>
                  <th className="py-3 px-4">Total Plots</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Booked</th>
                  <th className="py-3 px-4">Sold</th>
                  <th className="py-3 px-4">Sales Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projectSales.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{p["Project Name"]}</td>
                    <td className="py-3 px-4 text-slate-600">{p["Location"]}</td>
                    <td className="py-3 px-4">{p["Acreage"]}</td>
                    <td className="py-3 px-4 font-bold">{p["Total Plots"]}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{p["Available Plots"]}</td>
                    <td className="py-3 px-4 font-bold text-amber-700">{p["Booked Plots"]}</td>
                    <td className="py-3 px-4 font-bold text-rose-700">{p["Sold Plots"]}</td>
                    <td className="py-3 px-4 font-black text-slate-900">{p["Sales Value"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. PLOT INVENTORY REPORT                                        */}
      {/* ============================================================== */}
      {activeReport === "plots" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Plot-Wise Inventory Breakdown</h3>
            <button
              onClick={() => downloadCSV(plotInventory, "Plot_Inventory_Report")}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 transition cursor-pointer print:hidden"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Plot No</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Size (GAJ)</th>
                  <th className="py-3 px-4">Rate / GAJ</th>
                  <th className="py-3 px-4">Total Price</th>
                  <th className="py-3 px-4">Facing</th>
                  <th className="py-3 px-4">Road Width</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plotInventory.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p["Plot Number"]}</td>
                    <td className="py-3 px-4 font-medium">{p["Project"]}</td>
                    <td className="py-3 px-4 font-bold">{p["Size (GAJ)"]}</td>
                    <td className="py-3 px-4 font-mono">{p["Rate / GAJ"]}</td>
                    <td className="py-3 px-4 font-black text-slate-900">{p["Total Price"]}</td>
                    <td className="py-3 px-4">{p["Facing"]}</td>
                    <td className="py-3 px-4">{p["Road Width"]}</td>
                    <td className="py-3 px-4 font-bold">{p["Status"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. ASSOCIATE LEADERBOARD REPORT                                 */}
      {/* ============================================================== */}
      {activeReport === "associates" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Associate Sales & Network Leaderboard</h3>
            <button
              onClick={() => downloadCSV(associateSales, "Associate_Sales_Report")}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 transition cursor-pointer print:hidden"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Associate ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Plots Sold</th>
                  <th className="py-3 px-4">Sales Volume (GAJ)</th>
                  <th className="py-3 px-4">Total Business (INR)</th>
                  <th className="py-3 px-4">Direct Downline</th>
                  <th className="py-3 px-4">Wallet Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {associateSales.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{a["Member ID"]}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{a["Name"]}</td>
                    <td className="py-3 px-4 font-medium">{a["Rank"]}</td>
                    <td className="py-3 px-4 font-bold">{a["Plots Sold"]}</td>
                    <td className="py-3 px-4">{a["Sales Volume (GAJ)"]}</td>
                    <td className="py-3 px-4 font-black text-slate-900">{a["Total Business"]}</td>
                    <td className="py-3 px-4">{a["Direct Downline"]}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{a["Wallet Balance"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. CUSTOMER LEDGER REPORT                                       */}
      {/* ============================================================== */}
      {activeReport === "customers" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Customer Collections & Outstanding Balances</h3>
            <button
              onClick={() => downloadCSV(customerLedger, "Customer_Ledger_Report")}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 transition cursor-pointer print:hidden"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Booked Plots</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid Amount</th>
                  <th className="py-3 px-4">Outstanding Balance</th>
                  <th className="py-3 px-4">Registry Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerLedger.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c["Customer ID"]}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c["Name"]}</td>
                    <td className="py-3 px-4 font-mono">{c["Mobile"]}</td>
                    <td className="py-3 px-4 font-bold text-blue-700">{c["Booked Plots"]}</td>
                    <td className="py-3 px-4 font-bold">{c["Total Amount"]}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{c["Paid Amount"]}</td>
                    <td className="py-3 px-4 font-black text-amber-700">{c["Outstanding Balance"]}</td>
                    <td className="py-3 px-4 font-semibold">{c["Registry Status"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. COMMISSION STATEMENTS REPORT                                */}
      {/* ============================================================== */}
      {activeReport === "commissions" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Commission & Incentive Statements</h3>
            <button
              onClick={() => downloadCSV(commissionStatements, "Commission_Statements_Report")}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 transition cursor-pointer print:hidden"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Associate</th>
                  <th className="py-3 px-4">Member ID</th>
                  <th className="py-3 px-4">Incentive Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissionStatements.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{c["Associate Name"]}</td>
                    <td className="py-3 px-4 font-mono text-blue-700">{c["Member ID"]}</td>
                    <td className="py-3 px-4 font-medium">{c["Type"]}</td>
                    <td className="py-3 px-4 font-black text-emerald-700">{c["Amount"]}</td>
                    <td className="py-3 px-4 font-bold">{c["Status"]}</td>
                    <td className="py-3 px-4 text-slate-500">{c["Date"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
